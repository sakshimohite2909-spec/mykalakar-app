import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Database,
  Upload,
  Image as ImageIcon,
  X,
  Search,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp } from "firebase/firestore";
import { CATEGORY_GROUP_ICONS, CATEGORY_GROUP_OPTIONS } from "@/constants/artistSystem";
import { fileToOptimizedDataUrl } from "@/utils/imageCompression";
import {
  getCategoryCircleImage,
  getCustomCategoriesLocal,
  saveCustomCategoriesLocal,
} from "@/services/categoryImageService";

const systemCategories = CATEGORY_GROUP_OPTIONS;

const EVENT_TYPE_OPTIONS = [
  "General / All Events",
  "Varkari Sampraday",
  "Wedding & Reception",
  "Folk, Cultural & Festivals",
  "Corporate & Formal Events",
  "College & Youth Festivals",
  "Birthday & Private Parties",
];

const CURATED_SAMPLE_IMAGES = [
  { label: "Varkari Vocalist", url: "/cultural/varkari-vocalist.png" },
  { label: "Tanpura Singer", url: "/assets/curated/tanpura-singer-1.jpg" },
  { label: "Tabla Hands", url: "/assets/curated/tabla-hands.jpg" },
  { label: "Zanj Temple", url: "/cultural/zanj-temple.png" },
  { label: "Dhol Tasha", url: "/assets/curated/dhol-passion.jpg" },
  { label: "Dhol Performer", url: "/cultural/dhol-pathak-performer.png" },
  { label: "Event Services", url: "/assets/static/category-event-services.webp" },
];

export default function AdminCategories() {
  const [cats, setCats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Form states for Add / Edit
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("🎵");
  const [newCatImage, setNewCatImage] = useState("");
  const [newCatEventType, setNewCatEventType] = useState("General / All Events");
  const [isUploading, setIsUploading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  const [newSubcategory, setNewSubcategory] = useState("");
  const [expandedSub, setExpandedSub] = useState<string | null>(null);
  const [newType, setNewType] = useState("");

  // Filters
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedEventFilter, setSelectedEventFilter] = useState("All");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = collection(db, "categories");
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const dbCategories = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const localCustom = getCustomCategoriesLocal();
        const allDbAndLocal = [...dbCategories];
        localCustom.forEach((lc) => {
          if (
            !allDbAndLocal.some(
              (c: any) =>
                c.id === lc.id || c.name?.toLowerCase() === lc.name?.toLowerCase()
            )
          ) {
            allDbAndLocal.push(lc);
          }
        });

        const systemNames = new Set(
          systemCategories.map((s: any) => s.name?.toLowerCase())
        );

        const customCats = allDbAndLocal.filter(
          (c: any) => !systemNames.has(c.name?.toLowerCase())
        );
        const systemDbCats = allDbAndLocal.filter((c: any) =>
          systemNames.has(c.name?.toLowerCase())
        );

        const combined = [...customCats];

        systemCategories.forEach((sysCat: any) => {
          const existingInDb = systemDbCats.find(
            (c: any) => c.name?.toLowerCase() === sysCat.name?.toLowerCase()
          );
          combined.push(existingInDb || sysCat);
        });

        setCats(combined);
        setLoading(false);
      },
      (error) => {
        console.warn("Categories subscription warning:", error);
        const localCustom = getCustomCategoriesLocal();
        const combined = [...localCustom, ...systemCategories];
        setCats(combined);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const dataUrl = await fileToOptimizedDataUrl(file, 600, 0.85);
      setNewCatImage(dataUrl);
      toast({ title: "Image Uploaded ✅", description: "Image optimized and attached successfully." });
    } catch (err: any) {
      console.error("Upload error:", err);
      toast({ variant: "destructive", title: "Upload Failed", description: "Could not process image file." });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAdd = async () => {
    if (!newCatName.trim()) return;
    const cleanName = newCatName.trim();
    const catData = {
      name: cleanName,
      icon: newCatIcon || "🎵",
      slug: cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      image: newCatImage.trim(),
      imageUrl: newCatImage.trim(),
      eventType: newCatEventType || "General / All Events",
      subcategories: [],
      subcategoryTypes: {},
      count: 0,
      sortOrder: cats.length + 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const tempId = "cat_" + Date.now();
    const newCatObj = { id: tempId, ...catData };

    // Save to local storage backup immediately
    const existingLocal = getCustomCategoriesLocal();
    const updatedLocal = [
      newCatObj,
      ...existingLocal.filter((c: any) => c.name?.toLowerCase() !== cleanName.toLowerCase()),
    ];
    saveCustomCategoriesLocal(updatedLocal);

    setCats((prev) => {
      if (prev.some((c: any) => c.name?.toLowerCase() === cleanName.toLowerCase())) {
        return prev;
      }
      return [newCatObj, ...prev];
    });

    setNewCatName("");
    setNewCatIcon("🎵");
    setNewCatImage("");
    setNewCatEventType("General / All Events");
    setDialogOpen(false);
    toast({ title: "Category Added ✅", description: `'${cleanName}' category created with image successfully.` });

    try {
      await addDoc(collection(db, "categories"), {
        ...catData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.warn("Firestore background write note:", error?.message || error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    const targetCat = cats.find((c: any) => c.id === id);

    // Remove from local storage backup
    const existingLocal = getCustomCategoriesLocal();
    const updatedLocal = existingLocal.filter(
      (c: any) => c.id !== id && c.name?.toLowerCase() !== targetCat?.name?.toLowerCase()
    );
    saveCustomCategoriesLocal(updatedLocal);

    setCats((prev) => prev.filter((c: any) => c.id !== id));

    try {
      if (!id.startsWith("cat_")) {
        await deleteDoc(doc(db, "categories", id));
      }
      toast({ title: "Category Deleted" });
    } catch (error) {
      console.warn("Delete category error:", error);
    }
  };

  const updateCategoryData = async (categoryId: string, updatedFields: Record<string, any>) => {
    // 1. Update React state immediately
    setCats((prev) =>
      prev.map((c: any) => {
        if (c.id === categoryId) {
          return { ...c, ...updatedFields };
        }
        return c;
      })
    );

    // 2. Update localStorage backup
    const localCustom = getCustomCategoriesLocal();
    const targetCat = cats.find((c: any) => c.id === categoryId);
    if (targetCat) {
      const updatedCatObj = { ...targetCat, ...updatedFields };
      const updatedLocal = localCustom.map((lc: any) => {
        if (lc.id === categoryId || lc.name?.toLowerCase() === targetCat.name?.toLowerCase()) {
          return updatedCatObj;
        }
        return lc;
      });
      if (
        !updatedLocal.some(
          (lc: any) => lc.id === categoryId || lc.name?.toLowerCase() === targetCat.name?.toLowerCase()
        )
      ) {
        updatedLocal.push(updatedCatObj);
      }
      saveCustomCategoriesLocal(updatedLocal);
    }

    // 3. Update Firestore doc (or add if it's a default system category being edited for the first time)
    try {
      if (categoryId && !categoryId.startsWith("cat_")) {
        await updateDoc(doc(db, "categories", categoryId), {
          ...updatedFields,
          updatedAt: serverTimestamp(),
        });
      } else if (targetCat) {
        await addDoc(collection(db, "categories"), {
          ...targetCat,
          ...updatedFields,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.warn("Firestore update note:", err);
    }
  };

  const handleEditCategory = (cat: any) => {
    setEditingCategory(cat);
    setNewCatName(cat.name || "");
    setNewCatIcon(cat.icon || "🎵");
    setNewCatImage(cat.image || cat.imageUrl || "");
    setNewCatEventType(cat.eventType || "General / All Events");
    setEditDialogOpen(true);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !newCatName.trim()) return;
    const cleanName = newCatName.trim();
    const updatedFields = {
      name: cleanName,
      slug: cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      icon: newCatIcon,
      image: newCatImage.trim(),
      imageUrl: newCatImage.trim(),
      eventType: newCatEventType,
    };

    await updateCategoryData(editingCategory.id, updatedFields);
    toast({ title: "Category Updated ✅", description: `'${cleanName}' updated with image.` });
    setEditDialogOpen(false);
    setEditingCategory(null);
    setNewCatName("");
    setNewCatIcon("🎵");
    setNewCatImage("");
    setNewCatEventType("General / All Events");
  };

  const handleAddSubcategory = async (categoryId: string) => {
    if (!newSubcategory.trim()) return;
    const category = cats.find((c) => c.id === categoryId);
    if (!category) return;

    const subName = newSubcategory.trim();
    const updatedSubcategories = [...(category.subcategories || []), subName];

    await updateCategoryData(categoryId, { subcategories: updatedSubcategories });
    toast({ title: "Subcategory Added ✅", description: `'${subName}' added to ${category.name}` });
    setNewSubcategory("");
  };

  const handleRemoveSubcategory = async (categoryId: string, subcategory: string) => {
    const category = cats.find((c) => c.id === categoryId);
    if (!category) return;

    const updatedSubcategories = (category.subcategories || []).filter((s: string) => s !== subcategory);
    const updatedTypes = { ...(category.subcategoryTypes || {}) };
    delete updatedTypes[subcategory];

    await updateCategoryData(categoryId, {
      subcategories: updatedSubcategories,
      subcategoryTypes: updatedTypes,
    });
    toast({ title: "Subcategory Removed" });
  };

  const handleAddType = async (categoryId: string, subcategory: string) => {
    const raw = newType.trim();
    if (!raw) return;
    const category = cats.find((c) => c.id === categoryId);
    if (!category) return;
    const names = raw.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
    const existingTypes = category.subcategoryTypes?.[subcategory] || [];
    const toAdd = names.filter((n) => !existingTypes.includes(n));
    if (toAdd.length === 0) {
      toast({ variant: "destructive", title: "Duplicates", description: "All types already exist." });
      return;
    }
    const updatedTypes = { ...(category.subcategoryTypes || {}) };
    updatedTypes[subcategory] = [...existingTypes, ...toAdd].sort();

    await updateCategoryData(categoryId, { subcategoryTypes: updatedTypes });
    toast({ title: `${toAdd.length} type(s) added to ${subcategory}` });
    setNewType("");
  };

  const handleRemoveType = async (categoryId: string, subcategory: string, type: string) => {
    const category = cats.find((c) => c.id === categoryId);
    if (!category) return;

    const updatedTypes = { ...(category.subcategoryTypes || {}) };
    updatedTypes[subcategory] = (updatedTypes[subcategory] || []).filter((t: string) => t !== type);

    await updateCategoryData(categoryId, { subcategoryTypes: updatedTypes });
    toast({ title: "Type Removed" });
  };

  // Filtered categories
  const filteredCats = cats.filter((cat) => {
    const matchesSearch =
      !searchFilter.trim() ||
      cat.name?.toLowerCase().includes(searchFilter.toLowerCase().trim()) ||
      (cat.subcategories || []).some((s: string) => s.toLowerCase().includes(searchFilter.toLowerCase().trim()));

    const matchesEvent =
      selectedEventFilter === "All" ||
      (cat.eventType && cat.eventType.toLowerCase().includes(selectedEventFilter.toLowerCase())) ||
      (selectedEventFilter === "Varkari Sampraday" &&
        (cat.name?.toLowerCase().includes("spiritual") ||
          cat.name?.toLowerCase().includes("vocal") ||
          cat.name?.toLowerCase().includes("instrumental") ||
          cat.name?.toLowerCase().includes("sanstha") ||
          cat.name?.toLowerCase().includes("varkari")));

    return matchesSearch && matchesEvent;
  });

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-black text-stone-950">Categories & Images</h1>
          <p className="text-sm text-stone-500 font-medium mt-1">
            Manage category titles, event associations, and circular display images ({cats.length} total)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (open) {
                setNewCatName("");
                setNewCatIcon("🎵");
                setNewCatImage("");
                setNewCatEventType("General / All Events");
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="h-11 px-6 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-lg shadow-orange-600/20 cursor-pointer">
                <Plus className="h-4 w-4 mr-2" /> Add Category with Image
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg rounded-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display text-xl font-bold">New Category</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {/* Category Name */}
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-stone-600">Category Name</Label>
                  <Input
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g. Spiritual Speakers, Vocal Artists"
                    className="mt-1 h-11 rounded-xl"
                  />
                </div>

                {/* Event Association */}
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-stone-600">Associated Event Type</Label>
                  <select
                    value={newCatEventType}
                    onChange={(e) => setNewCatEventType(e.target.value)}
                    className="w-full mt-1 h-11 px-3 rounded-xl border border-stone-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {EVENT_TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Image Upload & URL */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4 text-orange-600" /> Category Avatar Image (Circular)
                  </Label>

                  {/* Image Preview */}
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-orange-500 shadow-md shrink-0 bg-stone-200">
                      <img
                        src={getCategoryCircleImage(newCatName || "Category", newCatImage)}
                        alt="Preview"
                        className="h-full w-full object-cover object-center"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=400&q=80";
                        }}
                      />
                    </div>
                    <div className="flex-1 text-xs text-stone-600">
                      <p className="font-semibold text-stone-800">Circular Avatar Preview</p>
                      <p className="text-[11px] text-stone-500">
                        This image appears on event category navigation bars.
                      </p>
                      {newCatImage && (
                        <button
                          type="button"
                          onClick={() => setNewCatImage("")}
                          className="mt-1 text-red-600 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <X className="h-3 w-3" /> Remove Custom Image
                        </button>
                      )}
                    </div>
                  </div>

                  {/* File Upload Button */}
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="h-9 px-4 rounded-xl text-xs font-bold border-stone-300 hover:border-orange-400 cursor-pointer"
                    >
                      {isUploading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5 text-orange-600" />
                      ) : (
                        <Upload className="h-3.5 w-3.5 mr-1.5 text-orange-600" />
                      )}
                      Upload Image File
                    </Button>
                    <span className="text-xs text-stone-400">or paste URL below</span>
                  </div>

                  {/* Image URL Input */}
                  <Input
                    value={newCatImage}
                    onChange={(e) => setNewCatImage(e.target.value)}
                    placeholder="https://... or /cultural/... image URL"
                    className="h-10 text-xs rounded-xl bg-white"
                  />

                  {/* Sample Presets */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1.5">
                      Quick Presets:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {CURATED_SAMPLE_IMAGES.map((preset) => (
                        <button
                          key={preset.url}
                          type="button"
                          onClick={() => setNewCatImage(preset.url)}
                          className="text-[11px] px-2.5 py-1 rounded-lg border border-stone-200 bg-white hover:bg-orange-50 hover:border-orange-300 font-medium text-stone-700 transition cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Emoji Icon */}
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-stone-600">Emoji Icon (Fallback)</Label>
                  <Input
                    value={newCatIcon}
                    onChange={(e) => setNewCatIcon(e.target.value)}
                    placeholder="e.g. 🎵"
                    className="mt-1 h-10 rounded-xl"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {["🚩", "🎙️", "🎤", "🪘", "🏛️", "🛕", "🎵", "🎭", "💃", "🎨", "🎪", "🎧", "🥁", "🎺", "🎻", "🎬"].map(
                      (emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setNewCatIcon(emoji)}
                          className="h-8 w-8 rounded-lg border border-stone-200 bg-stone-50 hover:bg-orange-100 hover:border-orange-300 text-sm flex items-center justify-center transition cursor-pointer"
                        >
                          {emoji}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleAdd}
                  disabled={!newCatName.trim()}
                  className="w-full h-11 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-md cursor-pointer"
                >
                  Create Category with Image
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ─── Search & Event Type Filters ─── */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Input
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search categories and subcategories..."
            className="pl-9 h-11 rounded-2xl bg-white border-stone-200"
          />
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-stone-400 pointer-events-none" />
        </div>

        <select
          value={selectedEventFilter}
          onChange={(e) => setSelectedEventFilter(e.target.value)}
          className="h-11 px-4 rounded-2xl border border-stone-200 bg-white text-xs font-bold uppercase tracking-wider text-stone-700 focus:outline-none focus:ring-2 focus:ring-orange-500 shrink-0 cursor-pointer"
        >
          <option value="All">All Event Types</option>
          <option value="Varkari Sampraday">Varkari Sampraday</option>
          <option value="Wedding & Reception">Wedding & Reception</option>
          <option value="Folk, Cultural & Festivals">Folk & Cultural</option>
          <option value="Corporate & Formal Events">Corporate</option>
        </select>
      </div>

      {/* ─── Edit Category Dialog ─── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold">Edit Category & Image</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-stone-600">Category Name</Label>
              <Input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. Spiritual Speakers"
                className="mt-1 h-11 rounded-xl"
              />
            </div>

            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-stone-600">Associated Event Type</Label>
              <select
                value={newCatEventType}
                onChange={(e) => setNewCatEventType(e.target.value)}
                className="w-full mt-1 h-11 px-3 rounded-xl border border-stone-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {EVENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Image Upload & URL */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-orange-600" /> Category Avatar Image (Circular)
              </Label>

              {/* Image Preview */}
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-orange-500 shadow-md shrink-0 bg-stone-200">
                  <img
                    src={getCategoryCircleImage(newCatName || "Category", newCatImage)}
                    alt="Preview"
                    className="h-full w-full object-cover object-center"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=400&q=80";
                    }}
                  />
                </div>
                <div className="flex-1 text-xs text-stone-600">
                  <p className="font-semibold text-stone-800">Circular Avatar Preview</p>
                  <p className="text-[11px] text-stone-500">Live preview of how this appears on user event pages.</p>
                  {newCatImage && (
                    <button
                      type="button"
                      onClick={() => setNewCatImage("")}
                      className="mt-1 text-red-600 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <X className="h-3 w-3" /> Remove Custom Image
                    </button>
                  )}
                </div>
              </div>

              {/* File Upload Button */}
              <div className="flex items-center gap-2">
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => editFileInputRef.current?.click()}
                  disabled={isUploading}
                  className="h-9 px-4 rounded-xl text-xs font-bold border-stone-300 hover:border-orange-400 cursor-pointer"
                >
                  {isUploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5 text-orange-600" />
                  ) : (
                    <Upload className="h-3.5 w-3.5 mr-1.5 text-orange-600" />
                  )}
                  Upload Image File
                </Button>
                <span className="text-xs text-stone-400">or paste URL below</span>
              </div>

              <Input
                value={newCatImage}
                onChange={(e) => setNewCatImage(e.target.value)}
                placeholder="https://... or /cultural/... image URL"
                className="h-10 text-xs rounded-xl bg-white"
              />

              {/* Sample Presets */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1.5">
                  Quick Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {CURATED_SAMPLE_IMAGES.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => setNewCatImage(preset.url)}
                      className="text-[11px] px-2.5 py-1 rounded-lg border border-stone-200 bg-white hover:bg-orange-50 hover:border-orange-300 font-medium text-stone-700 transition cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-stone-600">Emoji Icon (Fallback)</Label>
              <Input
                value={newCatIcon}
                onChange={(e) => setNewCatIcon(e.target.value)}
                placeholder="e.g. 🎵"
                className="mt-1 h-10 rounded-xl"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {["🚩", "🎙️", "🎤", "🪘", "🏛️", "🛕", "🎵", "🎭", "💃", "🎨", "🎪", "🎧", "🥁", "🎺", "🎻", "🎬"].map(
                  (emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewCatIcon(emoji)}
                      className="h-8 w-8 rounded-lg border border-stone-200 bg-stone-50 hover:bg-orange-100 hover:border-orange-300 text-sm flex items-center justify-center transition cursor-pointer"
                    >
                      {emoji}
                    </button>
                  )
                )}
              </div>
            </div>

            <Button
              onClick={handleUpdateCategory}
              disabled={!newCatName.trim()}
              className="w-full h-11 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-md cursor-pointer"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Loading State ─── */}
      {loading && (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      )}

      {/* ─── Categories List ─── */}
      <div className="grid gap-3">
        {filteredCats.map((cat) => {
          const circleImg = getCategoryCircleImage(cat.name, cat.image || cat.imageUrl);
          const isCustomImage = Boolean(cat.image || cat.imageUrl);

          return (
            <Card key={cat.id || cat.name} className="hover-lift border-stone-200/90 rounded-2xl overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => setExpanded(expanded === cat.id ? null : cat.id)}
                    className="flex items-center gap-3 text-left flex-1 min-w-0 cursor-pointer"
                  >
                    {expanded === cat.id ? (
                      <ChevronDown className="h-4 w-4 text-stone-400 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-stone-400 shrink-0" />
                    )}

                    {/* Circular Avatar Thumbnail */}
                    <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-stone-200 shrink-0 bg-stone-100 shadow-xs">
                      <img
                        src={circleImg}
                        alt={cat.name}
                        className="h-full w-full object-cover object-center"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=400&q=80";
                        }}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-stone-900 text-sm md:text-base">{cat.name}</span>
                        <span className="text-xs text-stone-400">{cat.icon}</span>

                        {isCustomImage && (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase tracking-wider"
                          >
                            Custom Image
                          </Badge>
                        )}

                        {cat.eventType && cat.eventType !== "General / All Events" && (
                          <Badge
                            variant="outline"
                            className="bg-stone-50 border-stone-200 text-stone-600 text-[9px] font-black uppercase"
                          >
                            {cat.eventType}
                          </Badge>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground mt-0.5">
                        {(cat.subcategories || []).length} subcategories
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCategory(cat);
                      }}
                      className="h-9 px-3 rounded-xl hover:bg-orange-50 hover:text-orange-600 text-xs font-bold cursor-pointer"
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(cat.id);
                      }}
                      className="h-9 w-9 rounded-xl hover:bg-red-50 hover:text-red-600 text-stone-400 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Subcategories Accordion */}
                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{ maxHeight: expanded === cat.id ? "2000px" : "0", opacity: expanded === cat.id ? 1 : 0 }}
                >
                  {expanded === cat.id && (
                    <div className="mt-4 pl-12 space-y-3 pt-2 border-t border-stone-100">
                      {(cat.subcategories || []).map((sub: string) => {
                        const types = cat.subcategoryTypes?.[sub] || [];
                        const isSubExpanded = expandedSub === `${cat.id}-${sub}`;
                        return (
                          <div key={sub} className="border border-stone-200/80 rounded-xl overflow-hidden">
                            <div className="flex items-center justify-between p-3 bg-stone-50/70">
                              <button
                                onClick={() => setExpandedSub(isSubExpanded ? null : `${cat.id}-${sub}`)}
                                className="flex items-center gap-2 text-left flex-1 cursor-pointer"
                              >
                                {isSubExpanded ? (
                                  <ChevronDown className="h-3 w-3 text-stone-400" />
                                ) : (
                                  <ChevronRight className="h-3 w-3 text-stone-400" />
                                )}
                                <span className="text-xs font-bold text-stone-800">{sub}</span>
                                {types.length > 0 && (
                                  <Badge variant="outline" className="text-[9px] ml-1 bg-white font-bold">
                                    {types.length} types
                                  </Badge>
                                )}
                              </button>
                              <button
                                onClick={() => handleRemoveSubcategory(cat.id, sub)}
                                className="p-1 rounded-lg hover:bg-red-50 hover:text-red-600 text-stone-400 transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            {isSubExpanded && (
                              <div className="p-3 space-y-3 bg-white">
                                <div className="flex flex-wrap gap-1.5">
                                  {types.map((type: string) => (
                                    <Badge key={type} variant="secondary" className="text-xs pl-2 pr-1 py-1 group">
                                      {type}
                                      <button
                                        onClick={() => handleRemoveType(cat.id, sub, type)}
                                        className="ml-1 p-0.5 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors opacity-50 group-hover:opacity-100 cursor-pointer"
                                      >
                                        ×
                                      </button>
                                    </Badge>
                                  ))}
                                  {types.length === 0 && (
                                    <span className="text-xs text-muted-foreground italic">No types added yet</span>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Add types (comma separated)"
                                    value={expandedSub === `${cat.id}-${sub}` ? newType : ""}
                                    onChange={(e) => setNewType(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleAddType(cat.id, sub);
                                      }
                                    }}
                                    className="max-w-xs text-xs h-8 rounded-lg"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleAddType(cat.id, sub)}
                                    disabled={!newType.trim()}
                                    className="h-8 rounded-lg text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white cursor-pointer"
                                  >
                                    <Plus className="h-3 w-3 mr-1" /> Add
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {(cat.subcategories || []).length === 0 && (
                        <span className="text-xs text-muted-foreground">No subcategories yet</span>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Input
                          placeholder="Add subcategory (e.g., Kirtankar, Gayak)"
                          value={newSubcategory}
                          onChange={(e) => setNewSubcategory(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleAddSubcategory(cat.id);
                            }
                          }}
                          className="max-w-xs h-9 text-xs rounded-xl"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleAddSubcategory(cat.id)}
                          disabled={!newSubcategory.trim()}
                          className="h-9 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" /> Add Subcategory
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredCats.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-3xl border border-stone-100 p-8">
            <p className="text-sm font-bold text-stone-500">No categories found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
