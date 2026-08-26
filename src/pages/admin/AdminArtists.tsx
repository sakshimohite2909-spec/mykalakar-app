import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Search,
  Edit,
  Trash2,
  BadgeCheck,
  Eye,
  Loader2,
  Database,
  Star,
  TrendingUp,
  Plus,
  Layers,
  ShieldCheck,
  ShieldAlert,
  Ban,
  CheckCircle2,
  UserCheck,
  AlertTriangle,
  Sparkles,
  Filter,
  X,
  Phone,
  MapPin,
  Award,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  firebaseErrorMessage,
  logFirebaseError,
  requireAuthUid,
  sanitizePayload,
  toastForFirestoreError,
} from "@/lib/firebaseSafe";
import { getIndiaDistrictsByStateName, getIndiaStates } from "@/lib/indiaLocations";
import {
  CATEGORY_STRUCTURE,
  MAIN_CATEGORIES,
  normalizeArtistRecord,
  extractArtistServices,
} from "@/constants/artistSystem";
import { imageRegistry } from "@/services/ImageRegistryService";
import { useAuth } from "@/contexts/AuthContext";
import { getUsableImageUrl } from "@/utils/fallbackImages";
import { VerificationBadge } from "@/components/verification/VerificationBadge";
import { AdminEditArtistModal } from "@/components/AdminEditArtistModal";
import { logAdminActivity } from "@/services/artistBookingService";
import { cn } from "@/lib/utils";

// ── Smart Multi-Token Search Matcher (e.g. "Kirtankar + Sangli + Verified") ──
function matchesMultiTokenSearch(artist: any, queryString: string): boolean {
  if (!queryString.trim()) return true;

  const rawTokens = queryString
    .split(/[\+\,\s]+/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  if (rawTokens.length === 0) return true;

  const name = (artist.name || artist.professionalName || "").toLowerCase();
  const username = (artist.username || "").toLowerCase();
  const category = (artist.category || "").toLowerCase();
  const subcategory = (artist.subcategory || "").toLowerCase();
  const artForms = (artist.categoriesArray || artist.artsList || []).join(" ").toLowerCase();
  const district = (artist.district || artist.city || "").toLowerCase();
  const state = (artist.state || "").toLowerCase();
  const phone = (artist.phone || artist.mobileNumber || "").toLowerCase();
  const status = (artist.status || "active").toLowerCase();
  const isVerified = Boolean(
    artist.verified ||
      (artist.verificationTier && artist.verificationTier !== "basic") ||
      artist.isPremium
  );
  const tier = (artist.verificationTier || (isVerified ? "artist_verified" : "basic")).toLowerCase();

  return rawTokens.every((token) => {
    if (token === "verified") return isVerified;
    if (token === "unverified" || token === "basic") return !isVerified || tier === "basic";
    if (token === "trusted") return tier === "trusted_artist";
    if (token === "suspended" || token === "blocked") return status === "suspended" || status === "blocked";
    if (token === "active" || token === "approved") return status === "active" || status === "approved";

    return (
      name.includes(token) ||
      username.includes(token) ||
      category.includes(token) ||
      subcategory.includes(token) ||
      artForms.includes(token) ||
      district.includes(token) ||
      state.includes(token) ||
      phone.includes(token) ||
      status.includes(token) ||
      tier.includes(token)
    );
  });
}

export default function AdminArtists() {
  const { currentUser, isAdmin } = useAuth();
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [queryInput, setQueryInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "VERIFIED" | "ACTIVE" | "SUSPENDED" | "TRUSTED">("ALL");

  // Modals state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteConfirmArtist, setDeleteConfirmArtist] = useState<any | null>(null);
  const [suspendConfirmArtist, setSuspendConfirmArtist] = useState<any | null>(null);
  const [editingArtist, setEditingArtist] = useState<any>(null);

  const [newArtist, setNewArtist] = useState({
    name: "",
    mainCategory: "",
    category: "",
    state: "",
    district: "",
    bio: "",
    mobileNumber: "",
    experience: 0,
    profilePhoto: imageRegistry.getUniqueImage({ category: "Default", type: "ui" }),
    availability: "available",
    verified: false,
    trending: false,
  });

  const stateOptions = useMemo(() => getIndiaStates().map((state) => state.name), []);
  const [districtOptions, setDistrictOptions] = useState<string[]>([]);

  useEffect(() => {
    if (!newArtist.state) {
      setDistrictOptions([]);
      return;
    }
    getIndiaDistrictsByStateName(newArtist.state)
      .then(setDistrictOptions)
      .catch(() => setDistrictOptions([]));
  }, [newArtist.state]);

  useEffect(() => {
    if (!currentUser || !isAdmin) return;
    const unsub = onSnapshot(
      query(collection(db, "artists")),
      (snapshot) => {
        setArtists(snapshot.docs.map((doc) => normalizeArtistRecord({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        toastForFirestoreError(error, "Artists unavailable", "Could not load artists.", toast);
      }
    );
    return unsub;
  }, [currentUser, isAdmin]);

  // ── 6 Core Actions Implementation ──

  // 1. Approve / Activate
  const handleApproveArtist = async (artist: any) => {
    try {
      await updateDoc(doc(db, "artists", artist.id), {
        status: "active",
        updatedAt: serverTimestamp(),
      });
      await logAdminActivity(
        currentUser?.email || "admin@mykalakar.com",
        "APPROVE_ARTIST",
        `Artist ${artist.name} (${artist.id}) activated`
      );
      toast({
        title: "Artist Activated ✅",
        description: `${artist.name}'s profile is now active on the marketplace.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Activation failed",
        description: error.message,
      });
    }
  };

  // 2. Suspend / Unsuspend
  const handleToggleSuspend = async (artist: any) => {
    const isCurrentlySuspended = artist.status === "suspended" || artist.status === "blocked";
    const nextStatus = isCurrentlySuspended ? "active" : "suspended";

    try {
      await updateDoc(doc(db, "artists", artist.id), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
      if (artist.uid) {
        await updateDoc(doc(db, "users", artist.uid), { status: nextStatus }).catch(() => {});
      }
      await logAdminActivity(
        currentUser?.email || "admin@mykalakar.com",
        nextStatus === "suspended" ? "SUSPEND_ARTIST" : "UNSUSPEND_ARTIST",
        `Admin toggled status for ${artist.name} to ${nextStatus}`
      );
      toast({
        title: nextStatus === "suspended" ? "Artist Suspended 🚫" : "Artist Restored ✅",
        description: `${artist.name} is now ${nextStatus}.`,
      });
      setSuspendConfirmArtist(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Status update failed",
        description: error.message,
      });
    }
  };

  // 3. Remove (Permanent Deletion)
  const handleConfirmDelete = async () => {
    if (!deleteConfirmArtist?.id) return;
    try {
      await deleteDoc(doc(db, "artists", deleteConfirmArtist.id));
      await logAdminActivity(
        currentUser?.email || "admin@mykalakar.com",
        "DELETE_ARTIST",
        `Deleted artist record: ${deleteConfirmArtist.name} (${deleteConfirmArtist.id})`
      );
      toast({
        title: "Artist Removed 🗑️",
        description: `${deleteConfirmArtist.name} has been permanently deleted.`,
      });
      setDeleteConfirmArtist(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description: error.message,
      });
    }
  };

  // 4. Quick Verify / Edit Modal Trigger
  const handleOpenVerifyModal = (artist: any) => {
    setEditingArtist(artist);
    setEditModalOpen(true);
  };

  // Filter pipeline
  const filtered = useMemo(() => {
    return artists.filter((a) => {
      // 1. Status Filter Tab
      const isSuspended = a.status === "suspended" || a.status === "blocked";
      const isVerified = Boolean(
        a.verified || (a.verificationTier && a.verificationTier !== "basic") || a.isPremium
      );
      const isTrusted = a.verificationTier === "trusted_artist";

      if (statusFilter === "VERIFIED" && !isVerified) return false;
      if (statusFilter === "ACTIVE" && isSuspended) return false;
      if (statusFilter === "SUSPENDED" && !isSuspended) return false;
      if (statusFilter === "TRUSTED" && !isTrusted) return false;

      // 2. Multi-Token Search Matcher
      return matchesMultiTokenSearch(a, queryInput);
    });
  }, [artists, queryInput, statusFilter]);

  const verifiedCount = artists.filter(
    (a) => a.verified || (a.verificationTier && a.verificationTier !== "basic") || a.isPremium
  ).length;
  const suspendedCount = artists.filter((a) => a.status === "suspended" || a.status === "blocked").length;
  const activeCount = artists.length - suspendedCount;
  const trustedCount = artists.filter((a) => a.verificationTier === "trusted_artist").length;

  const handleAddArtist = async () => {
    if (!newArtist.name || !newArtist.category || !newArtist.mainCategory) {
      toast({ variant: "destructive", title: "Missing Required Fields" });
      return;
    }
    setLoading(true);
    try {
      requireAuthUid(currentUser);
      const docRef = doc(collection(db, "artists"));
      const payload = sanitizePayload({
        uid: docRef.id,
        ...newArtist,
        categories: [newArtist.category],
        artsList: [
          {
            category: newArtist.category,
            mainCategory: newArtist.mainCategory,
            soloPrice: 0,
            duoPrice: 0,
            teamPrice: 0,
          },
        ],
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await setDoc(docRef, payload);
      toast({ title: "Artist Onboarded ✅" });
      setAddModalOpen(false);
    } catch (error: any) {
      logFirebaseError(error);
      toast({
        variant: "destructive",
        title: "Error adding artist",
        description: firebaseErrorMessage(error, "Could not add this artist."),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Artist Management Control
            </h1>
            <span className="text-xs font-black px-2.5 py-1 rounded-full bg-orange-100 text-orange-700">
              {artists.length} Total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 font-semibold mt-1">
            Approve, Verify, Edit, Suspend, and Remove registered artists across Maharashtra
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setAddModalOpen(true)}
            className="h-11 px-6 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs shadow-md"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Onboard Artist
          </Button>
        </div>
      </div>

      {/* ── Smart Multi-Token Search Bar & Filter Tabs ── */}
      <Card className="rounded-3xl border-stone-200 shadow-sm overflow-hidden bg-white">
        <CardHeader className="p-6 border-b border-stone-100 bg-stone-50/50 space-y-4">
          {/* Search Box */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <Input
                placeholder="Smart Search: e.g. Kirtankar + Sangli + Verified OR Dholki Pune..."
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                className="h-12 pl-11 pr-10 rounded-2xl border-stone-200 bg-white font-semibold text-xs text-stone-900 shadow-inner focus:border-orange-500"
              />
              {queryInput && (
                <button
                  onClick={() => setQueryInput("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Quick search suggestions */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-[10px] font-black uppercase text-stone-400 whitespace-nowrap">Examples:</span>
              <button
                type="button"
                onClick={() => setQueryInput("Kirtankar + Sangli + Verified")}
                className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-orange-50 hover:text-orange-600 text-[11px] font-bold text-stone-600 transition whitespace-nowrap"
              >
                Kirtankar + Sangli + Verified
              </button>
              <button
                type="button"
                onClick={() => setQueryInput("Singer + Pune")}
                className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-orange-50 hover:text-orange-600 text-[11px] font-bold text-stone-600 transition whitespace-nowrap"
              >
                Singer + Pune
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-black transition",
                statusFilter === "ALL"
                  ? "bg-stone-900 text-white shadow-sm"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              )}
            >
              All ({artists.length})
            </button>
            <button
              onClick={() => setStatusFilter("VERIFIED")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1",
                statusFilter === "VERIFIED"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              )}
            >
              <Award className="h-3.5 w-3.5" /> Verified ({verifiedCount})
            </button>
            <button
              onClick={() => setStatusFilter("TRUSTED")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1",
                statusFilter === "TRUSTED"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-amber-50 text-amber-800 hover:bg-amber-100"
              )}
            >
              <Star className="h-3.5 w-3.5 fill-current" /> ⭐ Trusted ({trustedCount})
            </button>
            <button
              onClick={() => setStatusFilter("ACTIVE")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1",
                statusFilter === "ACTIVE"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              )}
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter("SUSPENDED")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1",
                statusFilter === "SUSPENDED"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-rose-50 text-rose-700 hover:bg-rose-100"
              )}
            >
              <Ban className="h-3.5 w-3.5" /> Suspended ({suspendedCount})
            </button>
          </div>
        </CardHeader>

        {/* ── Artists Table ── */}
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Search className="h-10 w-10 text-stone-300 mx-auto mb-2" />
              <p className="text-base font-black text-stone-700">No matching artists found</p>
              <p className="text-xs text-stone-400 font-semibold mt-1">
                Try refining your search terms or clear search filters.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQueryInput("");
                  setStatusFilter("ALL");
                }}
                className="mt-3 text-xs font-bold rounded-xl"
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-stone-50/70">
                  <TableRow className="border-stone-100">
                    <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400">
                      Artist Profile
                    </TableHead>
                    <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-stone-400">
                      Specialization
                    </TableHead>
                    <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-stone-400">
                      Location & Contact
                    </TableHead>
                    <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-stone-400">
                      Account Status
                    </TableHead>
                    <TableHead className="text-right px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400">
                      Admin Actions (6 Controls)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-stone-100">
                  {filtered.map((a) => {
                    const isSuspended = a.status === "suspended" || a.status === "blocked";

                    return (
                      <tr key={a.id} className="hover:bg-stone-50/40 transition-colors">
                        {/* Profile & Name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3.5">
                            <img
                              src={
                                getUsableImageUrl(a.media?.profilePhoto || a.profilePhoto) ||
                                imageRegistry.getUniqueImage({
                                  category: a.subcategory || a.artForm || a.category || "Default",
                                  type: "artist",
                                  key: a.id || a.name,
                                })
                              }
                              className="w-12 h-12 rounded-2xl object-cover shadow-sm border border-stone-200 shrink-0"
                              alt={a.name}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-black text-stone-900 text-sm">{a.name}</span>
                              </div>
                              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                <VerificationBadge artist={a} size="compact" />
                                {a.experience && (
                                  <span className="text-[10px] font-bold text-stone-400">
                                    • {a.experience} yrs exp
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Specialization */}
                        <td className="py-4">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {extractArtistServices(a).map((srv, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="bg-orange-50 text-orange-700 border-none font-black text-[9px] uppercase tracking-wider px-2 py-0.5"
                              >
                                {srv.subcategory || srv.category || srv.artForm}
                              </Badge>
                            ))}
                          </div>
                        </td>

                        {/* Location & Contact */}
                        <td className="py-4">
                          <div className="text-xs font-bold text-stone-800 flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                            <span>{a.district || a.city || "Maharashtra"}, {a.state || "India"}</span>
                          </div>
                          {(a.mobileNumber || a.phone) && (
                            <div className="text-[11px] font-semibold text-stone-400 flex items-center gap-1 mt-0.5">
                              <Phone className="h-3 w-3 text-stone-400 shrink-0" />
                              <span>{a.mobileNumber || a.phone}</span>
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-4">
                          {isSuspended ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black">
                              <Ban className="h-3 w-3" /> Suspended
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                              <CheckCircle2 className="h-3 w-3" /> Active
                            </span>
                          )}
                        </td>

                        {/* ── 6 Admin Actions ── */}
                        <td className="text-right px-6 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* 1. View Public Page */}
                            <Link to={`/artist/${a.id}`} target="_blank">
                              <Button
                                variant="ghost"
                                size="icon"
                                title="View Public Page"
                                className="h-8 w-8 rounded-xl text-stone-600 hover:bg-stone-100 hover:text-orange-600"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>

                            {/* 2. Verify & Audit Checkpoints */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenVerifyModal(a)}
                              title="Audit Verification Tier"
                              className="h-8 w-8 rounded-xl text-emerald-600 hover:bg-emerald-50"
                            >
                              <ShieldCheck className="h-4 w-4" />
                            </Button>

                            {/* 3. Edit Full Profile */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingArtist(a);
                                setEditModalOpen(true);
                              }}
                              title="Edit Details"
                              className="h-8 w-8 rounded-xl text-blue-600 hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>

                            {/* 4. Suspend / Unsuspend Toggle */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSuspendConfirmArtist(a)}
                              title={isSuspended ? "Activate Artist" : "Suspend Artist"}
                              className={cn(
                                "h-8 w-8 rounded-xl",
                                isSuspended
                                  ? "text-emerald-600 hover:bg-emerald-50"
                                  : "text-amber-600 hover:bg-amber-50"
                              )}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>

                            {/* 5. Remove / Delete */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteConfirmArtist(a)}
                              title="Delete Artist Permanently"
                              className="h-8 w-8 rounded-xl text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Suspend Confirmation Modal ── */}
      <Dialog open={Boolean(suspendConfirmArtist)} onOpenChange={(open) => !open && setSuspendConfirmArtist(null)}>
        <DialogContent className="max-w-md p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black text-stone-900">
              <Ban className="h-5 w-5 text-amber-600" />
              {suspendConfirmArtist?.status === "suspended" ? "Restore Artist Account?" : "Suspend Artist Account?"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-stone-600 font-medium mt-2 leading-relaxed">
            {suspendConfirmArtist?.status === "suspended"
              ? `Are you sure you want to activate ${suspendConfirmArtist?.name}? Their profile will be visible in search results again.`
              : `Are you sure you want to suspend ${suspendConfirmArtist?.name}? They will not appear in search results or receive new booking inquiries.`}
          </p>
          <DialogFooter className="mt-6 flex gap-2">
            <Button variant="outline" onClick={() => setSuspendConfirmArtist(null)} className="rounded-xl font-bold text-xs">
              Cancel
            </Button>
            <Button
              onClick={() => handleToggleSuspend(suspendConfirmArtist)}
              className={cn(
                "rounded-xl font-bold text-xs text-white",
                suspendConfirmArtist?.status === "suspended" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-600 hover:bg-amber-700"
              )}
            >
              {suspendConfirmArtist?.status === "suspended" ? "Activate Profile" : "Suspend Profile"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Modal ── */}
      <Dialog open={Boolean(deleteConfirmArtist)} onOpenChange={(open) => !open && setDeleteConfirmArtist(null)}>
        <DialogContent className="max-w-md p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              Permanently Remove Artist?
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-stone-600 font-medium mt-2 leading-relaxed">
            Are you sure you want to delete <strong className="text-stone-900">{deleteConfirmArtist?.name}</strong>? This action cannot be undone. All related reviews, reels, and profiles will be removed from the registry.
          </p>
          <DialogFooter className="mt-6 flex gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmArtist(null)} className="rounded-xl font-bold text-xs">
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              className="rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white"
            >
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Onboard New Talent Modal ── */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-[36px] border-none shadow-2xl">
          <div className="p-8 bg-stone-950 text-white flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black">Onboard New Talent</h2>
              <p className="text-xs text-stone-400 font-medium">Add verified heritage artists directly into the registry</p>
            </div>
            <Button variant="ghost" onClick={() => setAddModalOpen(false)} className="text-white hover:bg-white/10 rounded-full h-10 w-10 text-xl">
              ×
            </Button>
          </div>
          <div className="p-8 grid gap-6 md:grid-cols-2 max-h-[70vh] overflow-y-auto no-scrollbar bg-white">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Personal Info</Label>
              <Input
                placeholder="Full Name / Stage Name"
                value={newArtist.name}
                onChange={(e) => setNewArtist((p) => ({ ...p, name: e.target.value }))}
                className="h-12 rounded-xl bg-stone-50 border-stone-200 font-bold text-xs"
              />
              <Input
                placeholder="Mobile Number"
                value={newArtist.mobileNumber}
                onChange={(e) => setNewArtist((p) => ({ ...p, mobileNumber: e.target.value }))}
                className="h-12 rounded-xl bg-stone-50 border-stone-200 font-bold text-xs"
              />
            </div>
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Categorization</Label>
              <select
                value={newArtist.mainCategory}
                onChange={(e) => setNewArtist((p) => ({ ...p, mainCategory: e.target.value, category: "" }))}
                className="h-12 w-full rounded-xl bg-stone-50 border border-stone-200 px-4 font-bold text-xs text-stone-900"
              >
                <option value="">Select Main Category</option>
                {MAIN_CATEGORIES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <select
                value={newArtist.category}
                onChange={(e) => setNewArtist((p) => ({ ...p, category: e.target.value }))}
                disabled={!newArtist.mainCategory}
                className="h-12 w-full rounded-xl bg-stone-50 border border-stone-200 px-4 font-bold text-xs text-stone-900"
              >
                <option value="">Select Art Form</option>
                {newArtist.mainCategory &&
                  CATEGORY_STRUCTURE[newArtist.mainCategory as keyof typeof CATEGORY_STRUCTURE].subcategories.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
              </select>
            </div>
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Location</Label>
              <select
                value={newArtist.state}
                onChange={(e) => setNewArtist((p) => ({ ...p, state: e.target.value, district: "" }))}
                className="h-12 w-full rounded-xl bg-stone-50 border border-stone-200 px-4 font-bold text-xs text-stone-900"
              >
                <option value="">Select State</option>
                {stateOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select
                value={newArtist.district}
                onChange={(e) => setNewArtist((p) => ({ ...p, district: e.target.value }))}
                disabled={!newArtist.state}
                className="h-12 w-full rounded-xl bg-stone-50 border border-stone-200 px-4 font-bold text-xs text-stone-900"
              >
                <option value="">Select District</option>
                {districtOptions.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Experience & Bio</Label>
              <Input
                type="number"
                placeholder="Years of Experience"
                value={newArtist.experience}
                onChange={(e) => setNewArtist((p) => ({ ...p, experience: Number(e.target.value) }))}
                className="h-12 rounded-xl bg-stone-50 border-stone-200 font-bold text-xs"
              />
              <Textarea
                placeholder="Brief Professional Bio..."
                value={newArtist.bio}
                onChange={(e) => setNewArtist((p) => ({ ...p, bio: e.target.value }))}
                className="rounded-xl bg-stone-50 border-stone-200 font-medium text-xs min-h-[90px]"
              />
            </div>
          </div>
          <div className="p-6 border-t border-stone-100 bg-stone-50/70 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setAddModalOpen(false)} className="rounded-xl font-bold text-xs px-6">
              Cancel
            </Button>
            <Button
              onClick={handleAddArtist}
              disabled={loading}
              className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs px-8 shadow-md"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Complete Onboarding"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit & Verification 7-Point Audit Modal ── */}
      {editingArtist && (
        <AdminEditArtistModal
          artist={editingArtist}
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setEditingArtist(null);
          }}
          onSaveSuccess={(updated) => {
            setArtists((prev) =>
              prev.map((art) => (art.id === updated.id ? { ...art, ...updated } : art))
            );
          }}
        />
      )}
    </div>
  );
}
