import { useState, useEffect } from "react";
import { X, Save, Edit3, Image as ImageIcon } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { clearDataCache } from "@/services/dataService";

interface AdminEditArtistModalProps {
  artist: Record<string, any>;
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (updatedData: Record<string, any>) => void;
}

export function AdminEditArtistModal({ artist, isOpen, onClose, onSaveSuccess }: AdminEditArtistModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && artist) {
      setFormData({
        name: artist.name || artist.professionalName || "",
        bio: artist.bio || artist.description || artist.artistProfile?.bio || "",
        categoriesArray: artist.categoriesArray?.join(", ") || artist.artsList?.join(", ") || artist.categories?.join(", ") || "",
        phone: artist.phone || artist.mobileNumber || "",
        email: artist.email || artist.contactEmail || "",
        profilePhoto: artist.media?.profilePhoto || artist.profilePhoto || artist.profileImageUrl || "",
        coverPhoto: artist.media?.coverPhoto || artist.coverPhoto || artist.coverImageUrl || "",
      });
    }
  }, [artist, isOpen]);

  const handleSave = async () => {
    if (!artist?.id) return;
    setIsSaving(true);
    
    try {
      const categoriesArray = typeof formData.categoriesArray === "string" 
        ? formData.categoriesArray.split(",").map((c: string) => c.trim()).filter(Boolean)
        : formData.categoriesArray;

      const updatedPayload = {
        name: formData.name,
        bio: formData.bio,
        categoriesArray,
        phone: formData.phone,
        email: formData.email,
        media: {
          ...(artist.media || {}),
          profilePhoto: formData.profilePhoto,
          coverPhoto: formData.coverPhoto,
        },
        profilePhoto: formData.profilePhoto,
        coverPhoto: formData.coverPhoto,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, "artists", artist.id), updatedPayload);
      clearDataCache();

      toast({
        title: "Profile Updated",
        description: "Admin override successful. The profile has been updated.",
      });

      onSaveSuccess({ ...artist, ...updatedPayload });
      onClose();
    } catch (error: any) {
      console.error("Admin edit save failed:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Could not save profile changes.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-white/20">
        <div className="flex items-center justify-between p-6 border-b border-stone-100 bg-stone-50/50">
          <div className="flex items-center gap-2 text-[#E25C1D]">
            <Edit3 className="h-5 w-5" />
            <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">Admin Profile Override</h2>
          </div>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-stone-500 mb-1.5">Full Name / Stage Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-[#E25C1D] focus:ring-2 focus:ring-[#E25C1D]/20 outline-none transition text-sm font-semibold text-stone-900"
                placeholder="Artist Name"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-stone-500 mb-1.5">Biography</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-[#E25C1D] focus:ring-2 focus:ring-[#E25C1D]/20 outline-none transition text-sm font-semibold text-stone-900 min-h-[120px]"
                placeholder="Artist Biography"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-stone-500 mb-1.5">Categories (Comma Separated)</label>
              <input
                type="text"
                value={formData.categoriesArray}
                onChange={(e) => setFormData({ ...formData, categoriesArray: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-[#E25C1D] focus:ring-2 focus:ring-[#E25C1D]/20 outline-none transition text-sm font-semibold text-stone-900"
                placeholder="e.g. Singer, Dancer, Band"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-stone-500 mb-1.5">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-[#E25C1D] focus:ring-2 focus:ring-[#E25C1D]/20 outline-none transition text-sm font-semibold text-stone-900"
                  placeholder="Phone Number"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-stone-500 mb-1.5">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-[#E25C1D] focus:ring-2 focus:ring-[#E25C1D]/20 outline-none transition text-sm font-semibold text-stone-900"
                  placeholder="Email Address"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-stone-100">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-stone-500 mb-1.5">
                  <ImageIcon className="h-3.5 w-3.5" /> Profile Image URL
                </label>
                <input
                  type="text"
                  value={formData.profilePhoto}
                  onChange={(e) => setFormData({ ...formData, profilePhoto: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-[#E25C1D] focus:ring-2 focus:ring-[#E25C1D]/20 outline-none transition text-xs font-medium text-stone-600"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-stone-500 mb-1.5">
                  <ImageIcon className="h-3.5 w-3.5" /> Cover Image URL
                </label>
                <input
                  type="text"
                  value={formData.coverPhoto}
                  onChange={(e) => setFormData({ ...formData, coverPhoto: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-[#E25C1D] focus:ring-2 focus:ring-[#E25C1D]/20 outline-none transition text-xs font-medium text-stone-600"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-stone-100 bg-stone-50/50 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSaving} className="rounded-xl px-6 font-bold">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="rounded-xl px-6 font-bold bg-[#E25C1D] hover:bg-[#EA580C] text-white shadow-md">
            {isSaving ? "Saving Override..." : "Save Override"}
          </Button>
        </div>
      </div>
    </div>
  );
}
