import { useState, useEffect } from "react";
import { X, Save, Edit3, Image as ImageIcon, ShieldCheck, CheckCircle2, Star, Award, Smartphone, UserCheck, MapPin, Video, Sparkles, Building2, UserPlus, Camera, CreditCard, Eye, ExternalLink } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { clearDataCache } from "@/services/dataService";
import {
  VerificationTier,
  VerificationChecklist,
  VERIFICATION_TIERS_CONFIG,
  getVerificationTier,
  getVerificationChecklist,
  CHECKLIST_ITEMS,
} from "@/constants/verificationSystem";
import { cn } from "@/lib/utils";

interface AdminEditArtistModalProps {
  artist: Record<string, any>;
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (updatedData: Record<string, any>) => void;
}

export function AdminEditArtistModal({ artist, isOpen, onClose, onSaveSuccess }: AdminEditArtistModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [verificationTier, setVerificationTier] = useState<VerificationTier>("basic");
  const [checklist, setChecklist] = useState<VerificationChecklist>({
    mobileVerified: false,
    identityVerified: false,
    locationVerified: false,
    portfolioVerified: false,
    performanceVerified: false,
    referenceVerified: false,
    affiliationVerified: false,
  });
  const [affiliationName, setAffiliationName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [previewImageModal, setPreviewImageModal] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    if (isOpen && artist) {
      const currentTier = getVerificationTier(artist);
      const currentChecklist = getVerificationChecklist(artist);

      setFormData({
        name: artist.name || artist.professionalName || "",
        bio: artist.bio || artist.description || artist.artistProfile?.bio || "",
        categoriesArray: Array.isArray(artist.categoriesArray)
          ? artist.categoriesArray.join(", ")
          : Array.isArray(artist.artsList)
          ? artist.artsList.join(", ")
          : Array.isArray(artist.categories)
          ? artist.categories.join(", ")
          : artist.categoriesArray || "",
        phone: artist.phone || artist.mobileNumber || "",
        email: artist.email || artist.contactEmail || "",
        profilePhoto: artist.media?.profilePhoto || artist.profilePhoto || artist.profileImageUrl || "",
        coverPhoto: artist.media?.coverPhoto || artist.coverPhoto || artist.coverImageUrl || "",
      });

      setVerificationTier(currentTier);
      setChecklist(currentChecklist);
      setAffiliationName(artist.verification?.affiliationName || artist.affiliationName || "");
    }
  }, [artist, isOpen]);

  const handleToggleChecklist = (key: keyof VerificationChecklist) => {
    setChecklist((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleTierChange = (newTier: VerificationTier) => {
    setVerificationTier(newTier);
    // Auto-fill checklist defaults when tier is upgraded
    if (newTier === "trusted_artist") {
      setChecklist({
        mobileVerified: true,
        identityVerified: true,
        locationVerified: true,
        portfolioVerified: true,
        performanceVerified: true,
        referenceVerified: true,
        affiliationVerified: true,
      });
    } else if (newTier === "artist_verified") {
      setChecklist((prev) => ({
        ...prev,
        mobileVerified: true,
        identityVerified: true,
        locationVerified: true,
        portfolioVerified: true,
      }));
    } else if (newTier === "identity_verified") {
      setChecklist((prev) => ({
        ...prev,
        mobileVerified: true,
        identityVerified: true,
        locationVerified: true,
      }));
    } else {
      setChecklist((prev) => ({
        ...prev,
        mobileVerified: true,
      }));
    }
  };

  const handleSave = async () => {
    if (!artist?.id) return;
    setIsSaving(true);

    try {
      const categoriesArray = typeof formData.categoriesArray === "string"
        ? formData.categoriesArray.split(",").map((c: string) => c.trim()).filter(Boolean)
        : [];

      const updatedPayload: Record<string, any> = {
        name: formData.name,
        professionalName: formData.name,
        bio: formData.bio,
        phone: formData.phone,
        mobileNumber: formData.phone,
        email: formData.email,
        categories: categoriesArray,
        categoriesArray: categoriesArray,
        artsList: categoriesArray,
        verified: verificationTier !== "basic",
        verificationTier: verificationTier,
        verification: {
          tier: verificationTier,
          verified: verificationTier !== "basic",
          checklist: checklist,
          affiliationName: affiliationName.trim() || undefined,
          verifiedAt: new Date().toISOString(),
          verifiedBy: "admin",
        },
      };

      if (formData.profilePhoto) {
        updatedPayload["profilePhoto"] = formData.profilePhoto;
        updatedPayload["media.profilePhoto"] = formData.profilePhoto;
      }
      if (formData.coverPhoto) {
        updatedPayload["coverPhoto"] = formData.coverPhoto;
        updatedPayload["media.coverPhoto"] = formData.coverPhoto;
      }

      await updateDoc(doc(db, "artists", artist.id), updatedPayload);
      clearDataCache();

      toast({
        title: "Artist Profile Updated ✅",
        description: `Verification Tier set to "${VERIFICATION_TIERS_CONFIG[verificationTier].name}".`,
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

  const liveSelfie = artist.media?.liveFacePhoto || artist.liveFacePhoto || artist.selfiePhoto || "";
  const aadharPhoto = artist.media?.aadharPhoto || artist.aadharPhoto || artist.idProofPhoto || "";
  const profilePhoto = formData.profilePhoto || artist.profilePhoto || artist.media?.profilePhoto || "";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-white/20">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-100 bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-stone-900 tracking-tight">Admin Profile & Verification Control</h2>
              <p className="text-xs text-stone-500 font-medium">Manage credentials, verification level, and profile details</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* ── SECTION 0: LIVE FACE SELFIE & KYC DOCUMENTS VERIFICATION ── */}
          <div className="rounded-2xl border-2 border-emerald-200/80 bg-emerald-50/30 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-stone-900 font-extrabold text-sm">
                <Camera className="h-4 w-4 text-emerald-600" />
                <span>KYC Identity & Live Face Capture Inspection</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                Verification Proofs
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {/* 1. Live Face Capture (Selfie) */}
              <div className="space-y-1.5">
                <p className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                  <Camera className="h-3.5 w-3.5 text-emerald-600" /> Live Face Selfie
                </p>
                {liveSelfie ? (
                  <div
                    onClick={() => setPreviewImageModal({ url: liveSelfie, title: `${artist.name} - Live Selfie Capture` })}
                    className="relative rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md aspect-square bg-black group cursor-pointer"
                  >
                    <img src={liveSelfie} alt="Live Selfie" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <span className="absolute bottom-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow">
                      Live Selfie ✅
                    </span>
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1">
                      <Eye className="h-4 w-4" /> Click to Enlarge
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square rounded-2xl border-2 border-dashed border-stone-200 bg-white/70 flex flex-col items-center justify-center p-3 text-center text-stone-400">
                    <Camera className="h-6 w-6 text-stone-300 mb-1" />
                    <span className="text-[11px] font-bold text-stone-500">No live selfie</span>
                    <span className="text-[9px] text-stone-400">Legacy / Direct profile</span>
                  </div>
                )}
              </div>

              {/* 2. Aadhaar / Govt ID */}
              <div className="space-y-1.5">
                <p className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-blue-600" /> Aadhaar / Govt ID
                </p>
                {aadharPhoto ? (
                  <div
                    onClick={() => setPreviewImageModal({ url: aadharPhoto, title: `${artist.name} - Aadhaar ID Document` })}
                    className="relative rounded-2xl overflow-hidden border-2 border-blue-400 shadow-md aspect-square bg-white group cursor-pointer"
                  >
                    <img src={aadharPhoto} alt="Aadhaar ID" className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300" />
                    <span className="absolute bottom-1.5 left-1.5 bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow">
                      Aadhaar Card 🪪
                    </span>
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1">
                      <Eye className="h-4 w-4" /> Click to Enlarge
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square rounded-2xl border-2 border-dashed border-stone-200 bg-white/70 flex flex-col items-center justify-center p-3 text-center text-stone-400">
                    <CreditCard className="h-6 w-6 text-stone-300 mb-1" />
                    <span className="text-[11px] font-bold text-stone-500">No ID uploaded</span>
                    <span className="text-[9px] text-stone-400">Aadhaar pending</span>
                  </div>
                )}
              </div>

              {/* 3. Stage / Profile Photo */}
              <div className="space-y-1.5">
                <p className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-orange-600" /> Stage / Profile Photo
                </p>
                {profilePhoto ? (
                  <div
                    onClick={() => setPreviewImageModal({ url: profilePhoto, title: `${artist.name} - Stage Profile Photo` })}
                    className="relative rounded-2xl overflow-hidden border-2 border-orange-400 shadow-md aspect-square bg-stone-100 group cursor-pointer"
                  >
                    <img src={profilePhoto} alt="Stage Profile" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <span className="absolute bottom-1.5 left-1.5 bg-orange-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow">
                      Profile Photo 🎭
                    </span>
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1">
                      <Eye className="h-4 w-4" /> Click to Enlarge
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square rounded-2xl border-2 border-dashed border-stone-200 bg-white/70 flex flex-col items-center justify-center p-3 text-center text-stone-400">
                    <ImageIcon className="h-6 w-6 text-stone-300 mb-1" />
                    <span className="text-[11px] font-bold text-stone-500">No profile photo</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── SECTION 1: VERIFICATION USP CONTROLS ── */}
          <div className="rounded-2xl border-2 border-orange-200/70 bg-orange-50/20 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-stone-900 font-extrabold text-sm">
                <ShieldCheck className="h-4 w-4 text-orange-600" />
                <span>MyKalakar Verification Tier (USP)</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                Manual Admin Authority
              </span>
            </div>

            {/* Verification Tier Radio Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(Object.keys(VERIFICATION_TIERS_CONFIG) as VerificationTier[]).map((tierKey) => {
                const conf = VERIFICATION_TIERS_CONFIG[tierKey];
                const isSelected = verificationTier === tierKey;
                const TierIcon = conf.icon;

                return (
                  <button
                    key={tierKey}
                    type="button"
                    onClick={() => handleTierChange(tierKey)}
                    className={cn(
                      "flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all",
                      isSelected
                        ? "bg-white border-2 border-orange-500 shadow-md ring-2 ring-orange-500/20"
                        : "bg-white/70 border-stone-200 hover:border-stone-300 hover:bg-white"
                    )}
                  >
                    <div className={cn("p-2 rounded-xl shrink-0 mt-0.5", conf.bgLight, conf.textColor)}>
                      <TierIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-stone-900 flex items-center justify-between">
                        <span>{conf.name}</span>
                        {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-orange-600 shrink-0" />}
                      </p>
                      <p className="text-[11px] text-stone-500 font-medium leading-tight mt-1 line-clamp-2">
                        {conf.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 7-Point Checklist Switches */}
            <div className="mt-4 pt-4 border-t border-orange-200/50 space-y-2.5">
              <p className="text-[11px] font-black uppercase tracking-wider text-stone-600">
                Verified Checkpoints (Toggle verified parameters)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CHECKLIST_ITEMS.map((item) => {
                  const ItemIcon = item.icon;
                  const isChecked = Boolean(checklist[item.key]);

                  return (
                    <div
                      key={item.key}
                      onClick={() => handleToggleChecklist(item.key)}
                      className={cn(
                        "flex items-center justify-between p-2.5 rounded-xl border cursor-pointer select-none transition-colors",
                        isChecked ? "bg-emerald-50 border-emerald-200 text-stone-900" : "bg-white border-stone-200 text-stone-500 opacity-80"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <ItemIcon className={cn("h-3.5 w-3.5 shrink-0", isChecked ? "text-emerald-600" : "text-stone-400")} />
                        <span className="text-xs font-bold truncate">{item.label}</span>
                      </div>
                      <Switch
                        checked={isChecked}
                        onCheckedChange={() => handleToggleChecklist(item.key)}
                        className="data-[state=checked]:bg-emerald-600 shrink-0"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Affiliation text field */}
              <div className="pt-2">
                <Label className="text-xs font-bold text-stone-700 mb-1 block">
                  Mandir / Trust / Academy / Organization Affiliation (Optional)
                </Label>
                <input
                  type="text"
                  value={affiliationName}
                  onChange={(e) => setAffiliationName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none text-xs font-semibold text-stone-900"
                  placeholder="e.g. Alandi Devasthan, Akhil Bharatiya Gandharva Mahavidyalaya"
                />
              </div>
            </div>
          </div>

          {/* ── SECTION 2: PROFILE OVERRIDE DETAILS ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-stone-900 font-extrabold text-sm border-b border-stone-100 pb-2">
              <Edit3 className="h-4 w-4 text-stone-400" />
              <span>Artist Profile Details</span>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-stone-500 mb-1.5">Full Name / Stage Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition text-sm font-semibold text-stone-900"
                placeholder="Artist Name"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-stone-500 mb-1.5">Biography</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition text-sm font-semibold text-stone-900 min-h-[90px]"
                placeholder="Artist Biography"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-stone-500 mb-1.5">Categories (Comma Separated)</label>
              <input
                type="text"
                value={formData.categoriesArray}
                onChange={(e) => setFormData({ ...formData, categoriesArray: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition text-sm font-semibold text-stone-900"
                placeholder="e.g. Kirtan, Classical Singer, Dholki"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-stone-500 mb-1.5">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition text-sm font-semibold text-stone-900"
                  placeholder="Phone Number"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-stone-500 mb-1.5">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition text-sm font-semibold text-stone-900"
                  placeholder="Email Address"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-stone-500 mb-1.5">
                  <ImageIcon className="h-3.5 w-3.5" /> Profile Image URL
                </label>
                <input
                  type="text"
                  value={formData.profilePhoto}
                  onChange={(e) => setFormData({ ...formData, profilePhoto: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition text-xs font-medium text-stone-600"
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
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition text-xs font-medium text-stone-600"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-stone-100 bg-stone-50/70 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSaving} className="rounded-xl px-6 font-bold">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="rounded-xl px-7 font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-md">
            {isSaving ? "Saving..." : "Save Credentials & Profile"}
          </Button>
        </div>
      </div>

      {/* Enlarged Photo Preview Modal */}
      {previewImageModal && (
        <div
          onClick={() => setPreviewImageModal(null)}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 cursor-zoom-out"
        >
          <div className="relative max-w-xl max-h-[85vh] bg-white rounded-3xl overflow-hidden shadow-2xl p-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-stone-100">
              <span className="text-xs font-black text-stone-900">{previewImageModal.title}</span>
              <button
                onClick={() => setPreviewImageModal(null)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center bg-stone-950/5 rounded-2xl overflow-hidden max-h-[70vh]">
              <img src={previewImageModal.url} alt={previewImageModal.title} className="max-h-[65vh] w-auto object-contain rounded-xl shadow" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
