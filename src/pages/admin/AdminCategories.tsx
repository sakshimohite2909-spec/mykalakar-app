import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Loader2, Database } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, doc, addDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp, orderBy } from "firebase/firestore";
import { initialCategories, platformCategories } from "@/data/mockData";
import { firebaseErrorMessage, toastForFirestoreError } from "@/lib/firebaseSafe";


export default function AdminCategories() {
  const [cats, setCats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("🎵");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [newSubcategory, setNewSubcategory] = useState("");
  const [expandedSub, setExpandedSub] = useState<string | null>(null);
  const [newType, setNewType] = useState("");

  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("sortOrder"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCats(data.length > 0 ? data : platformCategories);
      setLoading(false);
    }, (error) => {
      console.error(error);
      toastForFirestoreError(error, "Categories unavailable", "Could not load categories.", toast);
      setCats(platformCategories);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAdd = async () => {
    if (!newCatName.trim()) return;
    try {
      await addDoc(collection(db, "categories"), {
        name: newCatName,
        icon: newCatIcon,
        slug: newCatName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        image: "",
        subcategories: [],
        subcategoryTypes: {},
        count: 0,
        sortOrder: cats.length + 1,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setNewCatName("");
      setNewCatIcon("🎵");
      setDialogOpen(false);
      toast({ title: "Category Added", description: `${newCatName} has been created.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not add category." });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    try {
      await deleteDoc(doc(db, "categories", id));
      toast({ title: "Category Deleted" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error" });
    }
  };

  const handleEditCategory = (cat: any) => {
    setEditingCategory(cat);
    setNewCatName(cat.name);
    setNewCatIcon(cat.icon);
    setEditDialogOpen(true);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !newCatName.trim()) return;
    try {
      await updateDoc(doc(db, "categories", editingCategory.id), {
        name: newCatName,
        slug: newCatName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        icon: newCatIcon,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Category Updated" });
      setEditDialogOpen(false);
      setEditingCategory(null);
      setNewCatName("");
      setNewCatIcon("🎵");
    } catch (error) {
      toast({ variant: "destructive", title: "Error" });
    }
  };

  const handleAddSubcategory = async (categoryId: string) => {
    if (!newSubcategory.trim()) return;
    const category = cats.find(c => c.id === categoryId);
    if (!category) return;

    try {
      const updatedSubcategories = [...(category.subcategories || []), newSubcategory];
      await updateDoc(doc(db, "categories", categoryId), {
        subcategories: updatedSubcategories,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Subcategory Added", description: `${newSubcategory} added to ${category.name}` });
      setNewSubcategory("");
    } catch (error) {
      toast({ variant: "destructive", title: "Error" });
    }
  };

  const handleRemoveSubcategory = async (categoryId: string, subcategory: string) => {
    const category = cats.find(c => c.id === categoryId);
    if (!category) return;

    try {
      const updatedSubcategories = (category.subcategories || []).filter((s: string) => s !== subcategory);
      // Also remove types for this subcategory
      const updatedTypes = { ...(category.subcategoryTypes || {}) };
      delete updatedTypes[subcategory];
      await updateDoc(doc(db, "categories", categoryId), {
        subcategories: updatedSubcategories,
        subcategoryTypes: updatedTypes,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Subcategory Removed" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error" });
    }
  };

  const handleAddType = async (categoryId: string, subcategory: string) => {
    const raw = newType.trim();
    if (!raw) return;
    const category = cats.find(c => c.id === categoryId);
    if (!category) return;
    const names = raw.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
    const existingTypes = category.subcategoryTypes?.[subcategory] || [];
    const toAdd = names.filter(n => !existingTypes.includes(n));
    if (toAdd.length === 0) {
      toast({ variant: "destructive", title: "Duplicates", description: "All types already exist." });
      return;
    }
    try {
      const updatedTypes = { ...(category.subcategoryTypes || {}) };
      updatedTypes[subcategory] = [...existingTypes, ...toAdd].sort();
      await updateDoc(doc(db, "categories", categoryId), {
        subcategoryTypes: updatedTypes,
        updatedAt: serverTimestamp()
      });
      toast({ title: `${toAdd.length} type(s) added to ${subcategory}` });
      setNewType("");
    } catch (error) {
      toast({ variant: "destructive", title: "Error" });
    }
  };

  const handleRemoveType = async (categoryId: string, subcategory: string, type: string) => {
    const category = cats.find(c => c.id === categoryId);
    if (!category) return;
    try {
      const updatedTypes = { ...(category.subcategoryTypes || {}) };
      updatedTypes[subcategory] = (updatedTypes[subcategory] || []).filter((t: string) => t !== type);
      await updateDoc(doc(db, "categories", categoryId), {
        subcategoryTypes: updatedTypes,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Type Removed" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error" });
    }
  };

  const seedCategories = async () => {
    if (cats.length > 0) {
      toast({ title: "Categories already exist", description: "Delete them first if you want to re-seed." });
      return;
    }
    setLoading(true);
    try {
      const batch = writeBatch(db);
      platformCategories.forEach((cat) => {
        const docRef = doc(db, "categories", cat.id);
        batch.set(docRef, {
          ...cat,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
      await batch.commit();
      toast({ title: "Categories Seeded ✅", description: "Database has been populated with default categories and types." });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Seeding failed" });
    } finally {
      setLoading(false);
    }
  };

  const updateTypesData = async () => {
    setLoading(true);
    try {
      const batch = writeBatch(db);
      let updated = 0;
      cats.forEach((cat) => {
        const matchingData = initialCategories.find(ic => ic.name === cat.name);
        if (matchingData?.subcategoryTypes) {
          const mergedTypes = { ...(cat.subcategoryTypes || {}), ...matchingData.subcategoryTypes };
          batch.update(doc(db, "categories", cat.id), { subcategoryTypes: mergedTypes, updatedAt: serverTimestamp() });
          updated++;
        }
      });
      await batch.commit();
      toast({ title: "Types Updated ✅", description: `${updated} categories updated with types data.` });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Update failed" });
    } finally {
      setLoading(false);
    }
  };

  // Fix old Lucide-name icons (e.g. "Music") → proper emoji in Firestore
  const ICON_EMOJI_MAP: Record<string, string> = {
    Music: "🎵", Dancer: "💃", Masks: "🎭", Camera: "🎨",
    Flag: "🥁", Hands: "🛕", PartyPopper: "🎊",
  };

  const fixCategoryIcons = async () => {
    setLoading(true);
    try {
      const batch = writeBatch(db);
      let fixed = 0;
      cats.forEach((cat) => {
        const rawIcon = cat.icon || "";
        // Only needs fixing if icon is a word (Lucide name), not an emoji
        const needsFix = rawIcon.length <= 15 && !rawIcon.match(/\p{Emoji}/u);
        const correctEmoji = ICON_EMOJI_MAP[rawIcon] || platformCategories.find(p => p.name === cat.name)?.icon || "🎭";
        if (needsFix) {
          batch.update(doc(db, "categories", cat.id), { icon: correctEmoji, updatedAt: serverTimestamp() });
          fixed++;
        }
      });
      await batch.commit();
      if (fixed > 0) {
        toast({ title: "Icons Fixed ✅", description: `${fixed} category icons updated to emoji.` });
      } else {
        toast({ title: "All icons are already correct ✅" });
      }
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Fix failed", description: "Could not update category icons." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold mb-1">Categories</h1>
          <p className="text-sm text-muted-foreground">{cats.length} categories</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={seedCategories} variant="outline" size="sm" className="hidden md:flex">
            <Database className="h-4 w-4 mr-2" /> Seed Defaults
          </Button>
          <Button onClick={updateTypesData} variant="outline" size="sm" className="hidden md:flex">
            <Database className="h-4 w-4 mr-2" /> Update Types
          </Button>
          <Button onClick={fixCategoryIcons} variant="outline" size="sm" className="hidden md:flex" title="Fix category icons to use emoji (repairs old Firestore data)">
            <span className="mr-2 text-base">🎭</span> Fix Icons
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-bg border-0 text-primary-foreground"><Plus className="h-4 w-4 mr-2" /> Add Category</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">New Category</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Icon (emoji)</Label><Input value={newCatIcon} onChange={(e) => setNewCatIcon(e.target.value)} /></div>
                <div><Label>Category Name</Label><Input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="e.g. Music Artists" /></div>
                <Button onClick={handleAdd} className="w-full gradient-bg border-0 text-primary-foreground">Create Category</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Category Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Edit Category</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Icon (emoji)</Label><Input value={newCatIcon} onChange={(e) => setNewCatIcon(e.target.value)} /></div>
            <div><Label>Category Name</Label><Input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="e.g. Music Artists" /></div>
            <Button onClick={handleUpdateCategory} className="w-full gradient-bg border-0 text-primary-foreground">Update Category</Button>
          </div>
        </DialogContent>
      </Dialog>

      {loading && (
        <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      )}

      <div className="grid gap-3">
        {cats.map((cat) => (
          <Card key={cat.id} className="hover-lift">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setExpanded(expanded === cat.id ? null : cat.id)}
                  className="flex items-center gap-3 text-left flex-1"
                >
                  {expanded === cat.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <span className="text-2xl">{cat.icon}</span>
                  <div>
                    <span className="font-medium">{cat.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">({(cat.subcategories || []).length} subcategories)</span>
                  </div>
                </button>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEditCategory(cat)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
              {expanded === cat.id && (
                <div className="mt-4 pl-10 space-y-3">
                  {(cat.subcategories || []).map((sub: string) => {
                    const types = cat.subcategoryTypes?.[sub] || [];
                    const isSubExpanded = expandedSub === `${cat.id}-${sub}`;
                    return (
                      <div key={sub} className="border rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between p-3 bg-secondary/20">
                          <button
                            onClick={() => setExpandedSub(isSubExpanded ? null : `${cat.id}-${sub}`)}
                            className="flex items-center gap-2 text-left flex-1"
                          >
                            {isSubExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            <span className="text-sm font-medium">{sub}</span>
                            {types.length > 0 && (
                              <Badge variant="outline" className="text-[10px] ml-1">{types.length} types</Badge>
                            )}
                          </button>
                          <button
                            onClick={() => handleRemoveSubcategory(cat.id, sub)}
                            className="p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {isSubExpanded && (
                          <div className="p-3 space-y-3 bg-background">
                            <div className="flex flex-wrap gap-1.5">
                              {types.map((type: string) => (
                                <Badge key={type} variant="secondary" className="text-xs pl-2 pr-1 py-1 group">
                                  {type}
                                  <button
                                    onClick={() => handleRemoveType(cat.id, sub, type)}
                                    className="ml-1 p-0.5 rounded-full hover:bg-destructive hover:text-foreground transition-colors opacity-50 group-hover:opacity-100"
                                  >
                                    ×
                                  </button>
                                </Badge>
                              ))}
                              {types.length === 0 && <span className="text-xs text-muted-foreground italic">No types added yet</span>}
                            </div>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Add types (comma separated)"
                                value={expandedSub === `${cat.id}-${sub}` ? newType : ""}
                                onChange={(e) => setNewType(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddType(cat.id, sub);
                                  }
                                }}
                                className="max-w-xs text-sm h-8"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleAddType(cat.id, sub)}
                                disabled={!newType.trim()}
                                className="h-8"
                              >
                                <Plus className="h-3 w-3 mr-1" /> Add
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {(cat.subcategories || []).length === 0 && <span className="text-sm text-muted-foreground">No subcategories yet</span>}

                  <div className="flex gap-2 pt-2">
                    <Input
                      placeholder="Add subcategory (e.g., Classical Singer)"
                      value={newSubcategory}
                      onChange={(e) => setNewSubcategory(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddSubcategory(cat.id);
                        }
                      }}
                      className="max-w-xs"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddSubcategory(cat.id)}
                      disabled={!newSubcategory.trim()}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
