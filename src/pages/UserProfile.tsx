import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Eye,
  LayoutDashboard,
  Loader2,
  Save,
  ShieldCheck,
  UserCircle,
  Calendar,
  MapPin,
  CreditCard,
  Clock,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  XCircle,
  FileText,
  Heart,
  Compass,
  Search,
  BookmarkX,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { addDoc, collection, doc, limit, onSnapshot, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { uploadImageFile } from "@/lib/uploadService";
import { FIREBASE_WRITE_TIMEOUT_MS, firebaseErrorMessage, withTimeout } from "@/lib/firebaseSafe";
import { subscribeCustomerBookings, updateArtistBookingStatus, fetchRefundPolicy, calculateRefundPercentage } from "@/services/artistBookingService";
import { BookingStatusBadge } from "@/components/artist-bookings/BookingStatusBadge";
import type { BookingEvent, RefundPolicy } from "@/types/booking";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getSavedArtistIds, fetchSavedArtistProfiles } from "@/services/savedArtistService";
import { ArtistCard } from "@/components/FeaturedArtists";
import { buildArtistCards, type ArtistCardViewModel } from "@/services/marketplaceCards";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n/I18nProvider";

// ─── Tab type ──────────────────────────────────────────────────────────────
type DashboardTab = "profile" | "bookings" | "saved";

async function mockCreatePaymentOrder(bookingId: string, finalAmount: number) {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  console.log(`[Mock Cloud Function] Initiated payment order for booking ${bookingId} with amount INR ${finalAmount}`);
  return { success: true, orderId: `m_ord_${Math.random().toString(36).slice(2, 9)}` };
}

// ─── Helper utilities ──────────────────────────────────────────────────────

function textValue(source: Record<string, unknown> | null, key: string) {
  const value = source?.[key];
  return typeof value === "string" ? value : "";
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function HoldTimer({ expiryTime }: { expiryTime?: string }) {
  const [timeText, setTimeText] = useState("");

  useEffect(() => {
    if (!expiryTime) return;
    const update = () => {
      const remaining = new Date(expiryTime).getTime() - Date.now();
      if (remaining <= 0) {
        setTimeText("Hold Expired");
      } else {
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        setTimeText(`${hours}h ${minutes}m remaining`);
      }
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [expiryTime]);

  if (!expiryTime) return null;
  return (
    <span className="text-[10px] font-black uppercase bg-amber-500 text-white px-2.5 py-1 rounded-full tracking-wider animate-pulse">
      Hold: {timeText}
    </span>
  );
}

function SlaTimer({ deadlineTime }: { deadlineTime?: string }) {
  const [timeText, setTimeText] = useState("");

  useEffect(() => {
    if (!deadlineTime) return;
    const update = () => {
      const remaining = new Date(deadlineTime).getTime() - Date.now();
      if (remaining <= 0) {
        setTimeText("SLA Expired");
      } else {
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        setTimeText(`${hours}h ${minutes}m remaining`);
      }
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [deadlineTime]);

  if (!deadlineTime) return null;
  return (
    <span className="text-[10px] font-black uppercase bg-rose-500 text-white px-2.5 py-1 rounded-full tracking-wider">
      SLA Response Limit: {timeText}
    </span>
  );
}

// ─── Tab: Saved Artists ───────────────────────────────────────────────────

interface SavedArtistsTabProps {
  uid: string;
}

function SavedArtistsTab({ uid }: SavedArtistsTabProps) {
  const { t } = useI18n();
  const [savedCards, setSavedCards] = useState<ArtistCardViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    async function loadSaved() {
      try {
        // Step 1: Read the savedArtists array from users/{uid}
        const ids = await getSavedArtistIds(uid);

        if (!mounted) return;

        if (!ids.length) {
          setSavedCards([]);
          setLoading(false);
          return;
        }

        // Step 2: Batch-fetch all artist profiles in a single network pass
        // (chunked internally to respect Firestore's 30-item `in` limit)
        const profiles = await fetchSavedArtistProfiles(ids);

        if (!mounted) return;

        // Step 3: Transform raw docs → typed ArtistCardViewModel[]
        const cards = buildArtistCards(profiles as Record<string, unknown>[]);
        setSavedCards(cards);
      } catch (err) {
        if (!mounted) return;
        setError(t("profile.saved.error"));
        console.error("SavedArtistsTab error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSaved();
    return () => {
      mounted = false;
    };
  }, [uid]);

  if (loading) {
    return (
      <div className="py-12">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-[20px] border border-stone-100 bg-white overflow-hidden">
              <div className="h-48 skeleton-shimmer" />
              <div className="space-y-4 p-6">
                <div className="h-6 w-3/4 rounded-full skeleton-shimmer" />
                <div className="h-4 w-1/2 rounded-full skeleton-shimmer" />
                <div className="h-4 w-2/3 rounded-full skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 flex flex-col items-center text-center gap-3">
        <AlertCircle className="h-10 w-10 text-rose-400" />
        <p className="font-bold text-slate-600">{error}</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> {t("profile.saved.retry")}
        </Button>
      </div>
    );
  }

  if (!savedCards.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-20 flex flex-col items-center text-center gap-5"
      >
        {/* Decorative pulsing heart */}
        <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-orange-50 border-2 border-orange-100">
          <Heart className="h-9 w-9 text-orange-300" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-400 opacity-80" />
          </span>
        </div>

        <div>
          <h3 className="font-display text-xl font-black text-slate-900">{t("profile.saved.emptyTitle")}</h3>
          <p className="mt-2 text-sm font-medium text-slate-500 max-w-xs">
            {t("profile.saved.emptyText")}
          </p>
        </div>

        <Link to="/search">
          <Button className="mt-2 rounded-full bg-stone-950 hover:bg-orange-600 text-white font-bold px-6 transition-colors duration-200">
            <Compass className="mr-2 h-4 w-4" />
            {t("profile.saved.explore")}
          </Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-500">
          <span className="font-black text-slate-900">{savedCards.length}</span>{" "}
          {savedCards.length === 1 ? t("profile.saved.savedCount").replace("{{count}}", "").trim() : t("profile.saved.savedCountPlural").replace("{{count}}", "").trim()}
        </p>
        <Link
          to="/search"
          className="text-xs font-extrabold uppercase tracking-widest text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
          {t("profile.saved.browseMore")}
        </Link>
      </div>

      {/* Responsive grid — identical layout to the main catalog view */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {savedCards.map((card, index) => (
          <ArtistCard key={card.cardId} artist={card} index={index} />
        ))}
      </div>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function UserProfile() {
  const { currentUser, userProfile, userRole, artistData, refreshRoleProfile, refreshArtistData } = useAuth();
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [form, setForm] = useState({
    name: "",
    username: "",
    phone: "",
  });

  // Active dashboard tab
  const [activeTab, setActiveTab] = useState<DashboardTab>("profile");

  // Bookings list state
  const [bookings, setBookings] = useState<BookingEvent[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Dispute states
  const [disputeBooking, setDisputeBooking] = useState<BookingEvent | null>(null);
  const [disputeText, setDisputeText] = useState("");
  const [disputeCategory, setDisputeCategory] = useState("service_mismatch");

  // Cancellation and Refund policy states
  const [cancelBookingTarget, setCancelBookingTarget] = useState<BookingEvent | null>(null);
  const [calculatedRefund, setCalculatedRefund] = useState<{ percentage: number; amount: number } | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Counter Offer Accept Checkout states
  const [checkoutBooking, setCheckoutBooking] = useState<BookingEvent | null>(null);
  const [checkoutGateway, setCheckoutGateway] = useState<"stripe" | "razorpay" | "paypal" | "adyen">("stripe");
  const [checkoutDetails, setCheckoutDetails] = useState({ cardholderName: "", cardNumber: "", expiryDate: "", cvv: "" });
  const [completingCheckout, setCompletingCheckout] = useState(false);

  // Agreement modal state
  const [agreementBooking, setAgreementBooking] = useState<BookingEvent | null>(null);

  // Admin access request state
  const [adminRequestStatus, setAdminRequestStatus] = useState<"none" | "pending" | null>(null);
  const [submittingAdminRequest, setSubmittingAdminRequest] = useState(false);

  // Live artist application status (updated in real-time when admin acts)
  const [liveApplicationStatus, setLiveApplicationStatus] = useState<string | null>(null);

  const roleLabel = userRole === "admin"
    ? "Admin"
    : userRole === "artist"
      ? (liveApplicationStatus === "approved" || liveApplicationStatus === "active")
        ? t("common.artist")
        : liveApplicationStatus === "rejected"
          ? t("profile.access.artistRejected")
          : t("profile.access.artistPending")
      : userRole === "admin_request"
        ? t("profile.access.adminPending")
        : t("profile.access.customer");

  const profilePhoto = useMemo(() => {
    if (photoPreview) return photoPreview;
    const artistMedia = typeof artistData?.media === "object" && artistData.media !== null
      ? artistData.media as Record<string, unknown>
      : null;
    return (
      (typeof artistMedia?.profilePhoto === "string" ? artistMedia.profilePhoto : "") ||
      (typeof artistData?.profilePhoto === "string" ? artistData.profilePhoto : "") ||
      textValue(userProfile, "profilePhoto") ||
      ""
    );
  }, [artistData, photoPreview, userProfile]);

  useEffect(() => {
    setForm({
      name: artistData?.name || textValue(userProfile, "name") || currentUser?.displayName || "",
      username: textValue(userProfile, "username") || currentUser?.email?.split("@")[0] || "",
      phone: (artistData?.mobileNumber as string) || (artistData?.phone as string) || textValue(userProfile, "phone") || "",
    });
  }, [artistData, currentUser, userProfile]);

  // Subscribe to logged in customer's bookings
  useEffect(() => {
    if (!currentUser) return;
    setLoadingBookings(true);
    const unsub = subscribeCustomerBookings(currentUser.uid, (data) => {
      setBookings(data);
      setLoadingBookings(false);
    }, (err) => {
      console.error(err);
      setLoadingBookings(false);
    });
    return unsub;
  }, [currentUser]);

  useEffect(() => {
    return () => {
      if (photoPreview.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  // ── Real-time admin request status ────────────────────────────────────────
  // Converted from getDocs (one-shot) to onSnapshot so the UI reflects admin
  // approval without requiring a page reload.
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "admin_requests"),
      where("uid", "==", currentUser.uid),
      limit(1)
    );
    const unsub = onSnapshot(
      q,
      (snap) => setAdminRequestStatus(snap.empty ? "none" : "pending"),
      () => setAdminRequestStatus("none") // silent catch — non-admins have no docs here
    );
    return unsub;
  }, [currentUser]);

  // ── Real-time artist application status ───────────────────────────────────
  // Provides direct component-level reactivity: the Pending Review badge
  // updates immediately when the admin approves or rejects an application.
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "artist_applications"),
      where("uid", "==", currentUser.uid),
      limit(1)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (!snap.empty) {
          const data = snap.docs[0].data();
          setLiveApplicationStatus((data.status as string) ?? null);
        } else {
          setLiveApplicationStatus(null);
        }
      },
      () => setLiveApplicationStatus(null) // silent catch — unapproved artist may lack permission
    );
    return unsub;
  }, [currentUser]);

  const handleAdminRequest = async () => {
    if (!currentUser || submittingAdminRequest || adminRequestStatus === "pending") return;
    setSubmittingAdminRequest(true);
    try {
      await addDoc(collection(db, "admin_requests"), {
        uid: currentUser.uid,
        email: currentUser.email || "",
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setAdminRequestStatus("pending");
      toast({ title: t("profile.toast.requestSubmitted"), description: t("profile.toast.requestSubmittedText") });
    } catch (err) {
      toast({ variant: "destructive", title: t("profile.toast.requestFailed"), description: t("profile.toast.requestFailedText") });
      console.error("Admin request error:", err);
    } finally {
      setSubmittingAdminRequest(false);
    }
  };

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handlePhotoChange = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: t("profile.toast.invalidType"), description: t("profile.toast.invalidTypeText") });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: t("profile.toast.tooLarge"), description: t("profile.toast.tooLargeText") });
      return;
    }
    if (photoPreview.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);

    try {
      const uploadedPhoto = photoFile
        ? await uploadImageFile(photoFile, `avatars/${currentUser.uid}`)
        : profilePhoto;

      if (userRole === "admin") {
        await withTimeout(
          setDoc(doc(db, "admins", currentUser.uid), {
            uid: currentUser.uid,
            name: form.name.trim(),
            username: form.username.trim().toLowerCase(),
            email: currentUser.email || "",
            role: "admin",
            status: textValue(userProfile, "status") || "active",
            profilePhoto: uploadedPhoto,
            updatedAt: serverTimestamp(),
          }, { merge: true }),
          FIREBASE_WRITE_TIMEOUT_MS,
          "Could not save admin profile."
        );
      } else {
        const role = userRole === "artist" ? "artist" : userRole === "admin_request" ? "admin_request" : "customer";
        const status = userRole === "artist"
          ? artistData?.status === "pending" ? "pending" : "active"
          : userRole === "admin_request"
            ? "pending"
          : textValue(userProfile, "status") || "active";

        await withTimeout(
          setDoc(doc(db, "users", currentUser.uid), {
            uid: currentUser.uid,
            name: form.name.trim(),
            username: form.username.trim().toLowerCase(),
            email: currentUser.email || "",
            phone: form.phone.trim(),
            role,
            status,
            profilePhoto: uploadedPhoto,
            updatedAt: serverTimestamp(),
          }, { merge: true }),
          FIREBASE_WRITE_TIMEOUT_MS,
          "Could not save user profile."
        );
      }

      await Promise.allSettled([refreshRoleProfile(), refreshArtistData()]);
      setPhotoFile(null);
      toast({ title: t("profile.toast.saveSuccess"), description: t("profile.toast.saveSuccessText") });
    } catch (error) {
      toast({ variant: "destructive", title: t("profile.toast.saveFailed"), description: firebaseErrorMessage(error, t("profile.toast.saveFailedText")) });
    } finally {
      setSaving(false);
    }
  };

  // Initiate Counter Offer Acceptance
  const handleAcceptCounterInit = (booking: BookingEvent) => {
    const isPriceIncrease = (booking.counterOfferAmount || 0) > (booking.authorizedAmount || 0);
    if (isPriceIncrease) {
      setCheckoutBooking(booking);
      setCheckoutGateway(booking.paymentGateway || "stripe");
      setCheckoutDetails({ cardholderName: "", cardNumber: "", expiryDate: "", cvv: "" });
    } else {
      processAcceptCounter(booking, booking.counterOfferAmount || booking.authorizedAmount || 0);
    }
  };

  // Process Counter Offer Accept
  const processAcceptCounter = async (booking: BookingEvent, finalAmount: number) => {
    try {
      console.log(`[Payment] Initiating secure capture for booking ${booking.id} of amount INR ${finalAmount}`);
      const order = await mockCreatePaymentOrder(booking.id, finalAmount);
      if (order.success) {
        toast({
          title: t("profile.bookings.toast.authSuccess"),
          description: `Escrow hold details updated. Booking confirmation is processing via webhook. (Order ID: ${order.orderId})`,
        });
      }
      setCheckoutBooking(null);
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: t("profile.bookings.toast.authFailed"), description: "Could not confirm counter offer." });
    }
  };

  const submitCheckoutDelta = async () => {
    if (!checkoutBooking) return;
    setCompletingCheckout(true);
    try {
      await processAcceptCounter(checkoutBooking, checkoutBooking.counterOfferAmount || 0);
    } finally {
      setCompletingCheckout(false);
    }
  };

  const handleRejectCounter = async (booking: BookingEvent) => {
    try {
      await updateArtistBookingStatus(booking, "CANCELLED_BY_CLIENT");
      toast({ title: t("profile.bookings.toast.rejectSuccess"), description: "Booking request has been cancelled." });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Error", description: t("profile.bookings.toast.rejectFailed") });
    }
  };

  const handleReleaseEscrow = async (booking: BookingEvent) => {
    try {
      await updateArtistBookingStatus(booking, "PAYOUT_RELEASED", {
        isEscrowReleased: true,
        escrowState: "RELEASED",
      });
      toast({ title: t("profile.bookings.toast.releaseSuccess"), description: "Escrow funds released to the artist." });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Error", description: t("profile.bookings.toast.releaseFailed") });
    }
  };

  // Trigger cancellation with policy refund lookup
  const triggerCancelCancellation = async (booking: BookingEvent) => {
    try {
      const policy = await fetchRefundPolicy();
      const pct = calculateRefundPercentage(booking.eventDate, policy);
      const amt = (booking.authorizedAmount || 0) * (pct / 100);
      setCalculatedRefund({ percentage: pct, amount: amt });
      setCancelBookingTarget(booking);
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Error", description: "Could not calculate cancellation policy." });
    }
  };

  const confirmCancellation = async () => {
    if (!cancelBookingTarget || !calculatedRefund) return;
    setCancelling(true);
    try {
      await updateArtistBookingStatus(cancelBookingTarget, "CANCELLED_BY_CLIENT", {
        splitRefundAmount: calculatedRefund.amount,
        escrowState: "RELEASED",
      });
      toast({ title: t("profile.bookings.toast.cancelConfirmed"), description: `Hold released. Simulated refund of Rs ${calculatedRefund.amount.toLocaleString("en-IN")} initiated.` });
      setCancelBookingTarget(null);
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: t("profile.bookings.toast.cancelFailed"), description: "Could not cancel request." });
    } finally {
      setCancelling(false);
    }
  };

  const triggerDispute = (booking: BookingEvent) => {
    setDisputeBooking(booking);
    setDisputeText("");
    setDisputeCategory("service_mismatch");
  };

  const submitDispute = async () => {
    if (!disputeBooking || !disputeText.trim()) return;
    try {
      await updateArtistBookingStatus(disputeBooking, "DISPUTE_OPENED", {
        disputeNotes: disputeText,
        disputedBy: "client",
        disputeCategory: disputeCategory,
        escrowState: "LOCKED",
      });
      toast({ title: t("profile.bookings.toast.disputeSuccess"), description: "Escrow payment has been frozen. Admins are reviewing." });
      setDisputeBooking(null);
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Error", description: t("profile.bookings.toast.disputeFailed") });
    }
  };

  const canViewPublicArtist = artistData && (artistData.status === "active" || artistData.status === "approved");

  // Tab configuration
  const tabs: { id: DashboardTab; label: string; icon: React.ReactNode; count?: number }[] = [
    {
      id: "profile",
      label: t("profile.tabs.profile"),
      icon: <UserCircle className="h-4 w-4" />,
    },
    {
      id: "bookings",
      label: t("profile.tabs.bookings"),
      icon: <Calendar className="h-4 w-4" />,
      count: bookings.length || undefined,
    },
    {
      id: "saved",
      label: t("profile.tabs.saved"),
      icon: <Heart className="h-4 w-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />
      <main className="profile-account-shell page-shell container mx-auto px-4 pb-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-5xl space-y-6">

          {/* ── Page header ────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <Badge variant="secondary" className="mb-3 border-orange-200 bg-orange-50 text-orange-700">
                {roleLabel}
              </Badge>
              <h1 className="font-display text-3xl font-black text-slate-950">{t("profile.title")}</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              {userRole === "admin" ? (
                <Link to="/admin">
                  <Button variant="outline"><ShieldCheck className="mr-2 h-4 w-4" /> {t("profile.buttons.adminConsole")}</Button>
                </Link>
              ) : null}
              {userRole === "artist" ? (
                <Link to="/artist/dashboard">
                  <Button variant="outline"><LayoutDashboard className="mr-2 h-4 w-4" /> {t("profile.buttons.artistDashboard")}</Button>
                </Link>
              ) : null}
              {canViewPublicArtist ? (
                <Link to={`/artist/${artistData.uid || artistData.id}`}>
                  <Button className="gradient-bg border-0 text-primary-foreground"><Eye className="mr-2 h-4 w-4" /> {t("profile.buttons.viewPublic")}</Button>
                </Link>
              ) : null}
            </div>
          </div>

          {/* ── Tab navigation ─────────────────────────────────────────────── */}
          <div className="flex items-center gap-1 rounded-2xl border border-white/70 bg-white/75 p-1.5 shadow-xl shadow-orange-900/5 backdrop-blur-2xl overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                id={`dashboard-tab-${tab.id}`}
                type="button"
                aria-selected={activeTab === tab.id}
                role="tab"
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200",
                  activeTab === tab.id
                    ? "bg-stone-950 text-white shadow-lg"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
                ].join(" ")}
              >
                {tab.icon}
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={[
                      "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-black",
                      activeTab === tab.id
                        ? "bg-white/20 text-white"
                        : "bg-orange-100 text-orange-700",
                    ].join(" ")}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Tab panels ─────────────────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {/* ── Profile Tab ──────────────────────────────────────────────── */}
            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-white/70 bg-white/75 shadow-xl shadow-orange-900/5 backdrop-blur-2xl">
                  <CardContent className="grid gap-8 p-6 md:grid-cols-[220px_1fr] md:p-8">
                    <div className="space-y-4">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => handlePhotoChange(event.target.files?.[0] || null)}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="group relative aspect-square w-full overflow-hidden rounded-2xl border border-orange-100 bg-orange-50"
                      >
                        {profilePhoto ? (
                          <img src={profilePhoto} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <UserCircle className="h-16 w-16 text-orange-300" />
                          </div>
                        )}
                        <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-slate-950/75 px-3 py-3 text-xs font-black uppercase tracking-widest text-white opacity-0 transition group-hover:opacity-100">
                          <Camera className="h-4 w-4" /> {t("profile.photo.change")}
                        </span>
                      </button>
                    </div>

                    <div className="space-y-5">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="profile-name">{t("profile.form.name")}</Label>
                          <Input id="profile-name" value={form.name} onChange={(event) => updateField("name", event.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="profile-username">{t("profile.form.username")}</Label>
                          <Input id="profile-username" value={form.username} onChange={(event) => updateField("username", event.target.value)} />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="profile-phone">{t("profile.form.phone")}</Label>
                          <Input id="profile-phone" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="profile-role">{t("profile.form.access")}</Label>
                          <Input id="profile-role" value={roleLabel} disabled className="bg-slate-50 font-semibold" />
                        </div>
                      </div>

                      <Button onClick={handleSave} disabled={saving || !form.name.trim()} className="h-12 w-full gradient-bg border-0 font-bold text-primary-foreground md:w-auto md:px-8">
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {saving ? t("profile.form.saving") : t("profile.form.save")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              {/* ── Admin Access Request Panel ────────────────────────────── */}
              {userRole === "customer" && (
                <Card className="mt-4 border-white/70 bg-white/75 shadow-xl shadow-orange-900/5 backdrop-blur-2xl">
                  <CardHeader className="border-b border-slate-100/60 pb-4">
                    <CardTitle className="font-display text-base font-black text-slate-950 flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-orange-500" />
                      {t("profile.access.adminTitle")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-800">{t("profile.access.adminApply")}</p>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        {t("profile.access.adminDesc")}
                      </p>
                    </div>
                    <Button
                      id="admin-access-request-btn"
                      variant="outline"
                      onClick={handleAdminRequest}
                      disabled={submittingAdminRequest || adminRequestStatus === "pending" || adminRequestStatus === null}
                      className="shrink-0 h-10 border-orange-200 text-orange-700 hover:bg-orange-50 font-bold disabled:opacity-60"
                    >
                      {submittingAdminRequest ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting…</>
                      ) : adminRequestStatus === "pending" ? (
                        <><ShieldCheck className="mr-2 h-4 w-4 text-green-600" />Request Pending</>
                      ) : (
                        <><ShieldCheck className="mr-2 h-4 w-4" />{t("profile.access.adminApply")}</>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}
              </motion.div>
            )}

            {/* ── Bookings Tab ──────────────────────────────────────────────── */}
            {activeTab === "bookings" && (
              <motion.div
                key="bookings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-white/70 bg-white/75 shadow-xl shadow-orange-900/5 backdrop-blur-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-orange-50/50 to-amber-50/50 border-b border-orange-100/30">
                    <CardTitle className="font-display text-xl font-black text-slate-950 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-orange-600" />
                      {t("profile.bookings.title")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {loadingBookings ? (
                      <div className="space-y-3 py-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="border border-slate-200/80 rounded-2xl p-5 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2 flex-1">
                                <Skeleton className="h-5 w-56" />
                                <Skeleton className="h-3 w-40" />
                              </div>
                              <Skeleton className="h-6 w-20 rounded-full" />
                            </div>
                            <div className="flex gap-3 pt-2 border-t border-slate-100">
                              <Skeleton className="h-8 w-24 rounded-lg" />
                              <Skeleton className="h-8 w-24 rounded-lg" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : bookings.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 font-semibold border border-dashed border-slate-200 rounded-2xl bg-slate-50/40">
                        <AlertCircle className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                        {t("profile.bookings.empty")}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {bookings.map((booking) => {
                          const isPending = ["SOFT_HOLD_ACTIVE", "PAYMENT_AUTHORIZED", "PENDING_ARTIST_RESPONSE"].includes(booking.status);

                          return (
                            <div key={booking.id} className="border border-slate-200/80 rounded-2xl bg-white p-5 shadow-sm space-y-4 hover:shadow-md transition duration-200">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-slate-100 pb-3">
                                <div>
                                  <h3 className="font-display text-lg font-black text-slate-900">{booking.performanceType} {t("profile.bookings.with", { defaultValue: "with" })} {booking.artistName || t("common.artist")}</h3>
                                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-stone-500">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3.5 w-3.5 text-stone-400" />
                                      {formatDate(booking.eventDate)} ({booking.eventStartTime || "18:00"} - {booking.eventEndTime || "22:00"})
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3.5 w-3.5 text-stone-400" />
                                      {booking.venueLocation}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  {isPending && booking.holdExpiryTime && (
                                    <HoldTimer expiryTime={booking.holdExpiryTime} />
                                  )}
                                  {booking.status === "PENDING_ARTIST_RESPONSE" && booking.slaDeadlineTime && (
                                    <SlaTimer deadlineTime={booking.slaDeadlineTime} />
                                  )}
                                  <BookingStatusBadge status={booking.status} />
                                </div>
                              </div>

                              {/* Booking pricing details */}
                              <div className="grid gap-3 sm:grid-cols-3 text-xs font-semibold text-stone-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-1.5">
                                  <CreditCard className="h-4 w-4 text-[#FF6B00]" />
                                  <span>{t("profile.bookings.gateway")} <strong className="text-stone-900 uppercase">{booking.paymentGateway || "Stripe"}</strong></span>
                                </div>
                                <div>
                                  <span>{t("profile.bookings.escrowHold")} <strong className="text-[#FF6B00] text-sm font-black">Rs {(booking.authorizedAmount || 0).toLocaleString("en-IN")}</strong></span>
                                </div>
                                <div>
                                  <span>{t("profile.bookings.escrowPayout")} <strong className="text-stone-900 font-extrabold uppercase">{booking.escrowState || "AUTHORIZED"}</strong></span>
                                </div>
                              </div>

                              {/* COUNTER OFFER DIFF VIEW */}
                              {booking.status === "COUNTER_OFFER_SENT" && (
                                <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-4 space-y-3">
                                  <span className="flex items-center gap-1.5 font-black text-amber-900 text-xs uppercase tracking-wider">
                                    <RefreshCw className="h-4 w-4 text-amber-600 animate-spin" />
                                    {t("profile.bookings.diffTitle")}
                                  </span>
                                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                                    <div className="p-3 bg-white/70 border border-slate-100 rounded-xl">
                                      <p className="text-[10px] font-black uppercase text-stone-400 mb-2">{t("profile.bookings.original")}</p>
                                      <p className="mb-1">{t("profile.bookings.price")} <strong className="text-stone-700">Rs {booking.authorizedAmount?.toLocaleString("en-IN")}</strong></p>
                                      <p className="mb-1">{t("profile.bookings.date")} <strong className="text-stone-700">{formatDate(booking.eventDate)}</strong></p>
                                      <p className="mb-1">{t("profile.bookings.time")} <strong className="text-stone-700">{booking.eventStartTime} - {booking.eventEndTime}</strong></p>
                                      <p>{t("profile.bookings.location")} <strong className="text-stone-700">{booking.venueLocation}</strong></p>
                                    </div>
                                    <div className="p-3 bg-amber-100/40 border border-amber-200/50 rounded-xl">
                                      <p className="text-[10px] font-black uppercase text-amber-600 mb-2">{t("profile.bookings.counter")}</p>
                                      <p className="mb-1">{t("profile.bookings.price")} <strong className="text-amber-800 font-black">Rs {booking.counterOfferAmount?.toLocaleString("en-IN")}</strong></p>
                                      <p className="mb-1">{t("profile.bookings.date")} <strong className="text-amber-800 font-bold">{formatDate(booking.counterOfferDate || booking.eventDate)}</strong></p>
                                      <p className="mb-1">{t("profile.bookings.time")} <strong className="text-amber-800 font-bold">{booking.counterOfferStartTime || booking.eventStartTime} - {booking.counterOfferEndTime || booking.eventEndTime}</strong></p>
                                      <p>{t("profile.bookings.location")} <strong className="text-amber-800 font-bold">{booking.counterOfferLocation || booking.venueLocation}</strong></p>
                                    </div>
                                  </div>
                                  {booking.counterOfferNotes && (
                                    <p className="text-xs text-amber-800 italic pl-1.5 pt-1">{t("profile.bookings.notes")} "{booking.counterOfferNotes}"</p>
                                  )}
                                </div>
                              )}

                              {booking.status === "DISPUTE_OPENED" && (
                                <div className="border border-rose-200 bg-rose-50/50 rounded-xl p-3.5 text-xs text-rose-950 font-semibold">
                                  <span className="flex items-center gap-1.5 font-bold text-rose-700">
                                    <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                                    {t("profile.bookings.disputeFiled")}
                                  </span>
                                  <p className="pl-6 mt-1 text-stone-600 font-bold">{booking.disputeNotes}</p>
                                </div>
                              )}

                              {/* Customer Action buttons */}
                              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                                {booking.status === "CONFIRMED" && (
                                  <Button size="sm" variant="outline" className="border-stone-200 rounded-xl mr-auto font-bold text-stone-600" onClick={() => setAgreementBooking(booking)}>
                                    <FileText className="mr-1.5 h-4 w-4" /> {t("profile.bookings.btnViewAgreement")}
                                  </Button>
                                )}
                                {isPending && (
                                  <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl" onClick={() => triggerCancelCancellation(booking)}>
                                    {t("profile.bookings.btnCancelRequest")}
                                  </Button>
                                )}
                                {booking.status === "COUNTER_OFFER_SENT" && (
                                  <>
                                    <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl" onClick={() => handleRejectCounter(booking)}>
                                      {t("profile.bookings.btnDeclineCounter")}
                                    </Button>
                                    <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold px-4" onClick={() => handleAcceptCounterInit(booking)}>
                                      {t("profile.bookings.btnAcceptCounter")}
                                    </Button>
                                  </>
                                )}
                                {booking.status === "EVENT_COMPLETED" && (
                                  <>
                                    <Button variant="outline" size="sm" className="border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl" onClick={() => triggerDispute(booking)}>
                                      {t("profile.bookings.btnOpenDispute")}
                                    </Button>
                                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold px-5" onClick={() => handleReleaseEscrow(booking)}>
                                      {t("profile.bookings.btnReleaseEscrow", { defaultValue: "Release Escrow Payout" })}
                                    </Button>
                                  </>
                                )}
                                {booking.status === "CONFIRMED" && (
                                  <>
                                    <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl" onClick={() => triggerCancelCancellation(booking)}>
                                      {t("profile.bookings.btnCancelBooking")}
                                    </Button>
                                    <Button variant="outline" size="sm" className="border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl" onClick={() => triggerDispute(booking)}>
                                      {t("profile.bookings.btnFileDispute", { defaultValue: "File Dispute" })}
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ── Saved Artists Tab ─────────────────────────────────────────── */}
            {activeTab === "saved" && (
              <motion.div
                key="saved"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-white/70 bg-white/75 shadow-xl shadow-orange-900/5 backdrop-blur-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-orange-50/50 to-red-50/30 border-b border-orange-100/30">
                    <CardTitle className="font-display text-xl font-black text-slate-950 flex items-center gap-2">
                      <Heart className="h-5 w-5 text-[#E25C1D] fill-[#E25C1D]" />
                      {t("profile.tabs.saved")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {currentUser ? (
                      <SavedArtistsTab uid={currentUser.uid} />
                    ) : (
                      <div className="py-12 text-center text-slate-400 font-semibold">
                        <AlertCircle className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                        {t("profile.saved.signinRequired")}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
      <Footer />

      {/* Cancellation policy refund dialog */}
      <Dialog open={Boolean(cancelBookingTarget)} onOpenChange={(open) => !open && setCancelBookingTarget(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-black text-rose-700 flex items-center gap-1.5">
              <XCircle className="h-5 w-5" /> {t("profile.cancelDialog.title")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm text-stone-600 font-semibold leading-relaxed">
            <p>{t("profile.cancelDialog.confirmMsg")}</p>
            {calculatedRefund && (
              <div className="p-3 bg-slate-50 border rounded-xl space-y-1.5 font-bold">
                <p className="flex justify-between">{t("profile.cancelDialog.eligibleDays")} <span className="text-stone-900">{calculatedRefund.percentage}% refund</span></p>
                <p className="flex justify-between text-rose-600 text-md">{t("profile.cancelDialog.refundAmount")} <span>Rs {calculatedRefund.amount.toLocaleString("en-IN")}</span></p>
              </div>
            )}
            <p className="text-xs text-stone-400">{t("profile.cancelDialog.policyNotice")}</p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCancelBookingTarget(null)}>{t("profile.cancelDialog.btnKeepHold")}</Button>
            <Button className="bg-rose-600 hover:bg-rose-700 text-white font-bold" onClick={confirmCancellation} disabled={cancelling}>
              {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : t("profile.cancelDialog.btnConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispute filing popup */}
      <Dialog open={Boolean(disputeBooking)} onOpenChange={(open) => !open && setDisputeBooking(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-black text-rose-700 flex items-center gap-1.5">
              <AlertCircle className="h-5 w-5" /> {t("profile.disputeDialog.title")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-sm text-stone-600 font-semibold">
            <div className="space-y-1">
              <Label>{t("profile.disputeDialog.categoryLabel")}</Label>
              <select
                value={disputeCategory}
                onChange={(e) => setDisputeCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white font-semibold outline-none"
              >
                <option value="artist_no_show">{t("profile.disputeDialog.options.artist_no_show")}</option>
                <option value="late_arrival">{t("profile.disputeDialog.options.late_arrival")}</option>
                <option value="service_mismatch">{t("profile.disputeDialog.options.service_mismatch")}</option>
                <option value="fraudulent_behavior">{t("profile.disputeDialog.options.fraudulent_behavior")}</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>{t("profile.disputeDialog.claimsLabel")}</Label>
              <Textarea
                placeholder={t("profile.disputeDialog.claimsPlaceholder")}
                rows={4}
                value={disputeText}
                onChange={(e) => setDisputeText(e.target.value)}
                className="font-semibold"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDisputeBooking(null)}>{t("profile.disputeDialog.btnCancel")}</Button>
            <Button className="bg-rose-600 hover:bg-rose-700 text-white font-bold" onClick={submitDispute} disabled={!disputeText.trim()}>
              {t("profile.disputeDialog.btnSubmit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Counter Offer Price Increase Additional Auth Checkout popup */}
      <Dialog open={Boolean(checkoutBooking)} onOpenChange={(open) => !open && setCheckoutBooking(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-black text-stone-900 flex items-center gap-1.5">
              <CreditCard className="h-5 w-5 text-[#FF6B00]" /> {t("profile.checkoutDialog.title")}
            </DialogTitle>
          </DialogHeader>
          {checkoutBooking && (
            <div className="space-y-4 py-2 text-sm text-stone-600 font-semibold">
              <div className="p-3 bg-amber-50 rounded-xl space-y-1 font-bold">
                <p className="flex justify-between">{t("profile.checkoutDialog.originalHold")} <span>Rs {checkoutBooking.authorizedAmount?.toLocaleString("en-IN")}</span></p>
                <p className="flex justify-between">{t("profile.checkoutDialog.newCounterPrice")} <span>Rs {checkoutBooking.counterOfferAmount?.toLocaleString("en-IN")}</span></p>
                <p className="flex justify-between text-amber-700 text-md border-t border-amber-200/50 pt-1.5 mt-1.5">
                  {t("profile.checkoutDialog.extraHoldToAuthorize")}
                  <span>Rs {((checkoutBooking.counterOfferAmount || 0) - (checkoutBooking.authorizedAmount || 0)).toLocaleString("en-IN")}</span>
                </p>
              </div>

              <div className="border border-slate-200 rounded-xl bg-slate-50 p-3.5 space-y-3">
                <h4 className="text-xs font-black uppercase text-stone-400 tracking-wider">{t("profile.checkoutDialog.simulatedGateway").replace("{{gateway}}", checkoutGateway.toUpperCase())}</h4>
                <div className="space-y-1">
                  <Label>{t("profile.checkoutDialog.cardholderName")}</Label>
                  <Input placeholder="Johnathan Doe" value={checkoutDetails.cardholderName} onChange={(e) => setCheckoutDetails(prev => ({ ...prev, cardholderName: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>{t("profile.checkoutDialog.cardNumber")}</Label>
                  <Input placeholder="4111 2222 3333 4444" value={checkoutDetails.cardNumber} onChange={(e) => setCheckoutDetails(prev => ({ ...prev, cardNumber: e.target.value }))} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCheckoutBooking(null)}>{t("profile.checkoutDialog.btnCancel")}</Button>
            <Button className="bg-[#FF6B00] hover:bg-[#e86100] text-white font-bold" onClick={submitCheckoutDelta} disabled={completingCheckout}>
              {completingCheckout ? <Loader2 className="h-4 w-4 animate-spin" /> : t("profile.checkoutDialog.btnAuthorizeExtra")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking Agreement modal */}
      <Dialog open={Boolean(agreementBooking)} onOpenChange={(open) => !open && setAgreementBooking(null)}>
        <DialogContent className="max-w-lg rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-black text-stone-900 flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
              <FileText className="h-5 w-5 text-orange-600" /> {t("profile.agreementDialog.title")}
            </DialogTitle>
          </DialogHeader>
          {agreementBooking && (
            <div className="space-y-4 py-2 text-xs font-semibold text-stone-600 leading-relaxed">
              <div className="text-center bg-stone-50 border rounded-xl p-3 mb-4 space-y-1">
                <h3 className="font-display text-sm font-black text-stone-900">{t("profile.agreementDialog.contractHeader")}</h3>
                <p className="text-[10px] text-stone-400">{t("profile.agreementDialog.contractId")} CONTRACT-{agreementBooking.id.slice(0, 8).toUpperCase()}</p>
              </div>

              <p>{t("profile.agreementDialog.introText").replace("{{client}}", agreementBooking.clientName || "Client").replace("{{artist}}", agreementBooking.artistName || "Artist")}</p>

              <div className="grid grid-cols-2 gap-4 bg-stone-50/70 p-3 rounded-xl border border-stone-100">
                <div>
                  <p className="text-[10px] font-black uppercase text-stone-400">{t("profile.agreementDialog.dateLabel")}</p>
                  <p className="font-bold text-stone-800">{formatDate(agreementBooking.eventDate)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-stone-400">{t("profile.agreementDialog.hoursLabel")}</p>
                  <p className="font-bold text-stone-800">{agreementBooking.eventStartTime} - {agreementBooking.eventEndTime}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-stone-400">{t("profile.agreementDialog.locationLabel")}</p>
                  <p className="font-bold text-stone-800">{agreementBooking.venueLocation}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-stone-400">{t("profile.agreementDialog.typeLabel")}</p>
                  <p className="font-bold text-stone-800">{agreementBooking.performanceType}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-stone-800">{t("profile.agreementDialog.escrowLabel")}</h4>
                <p>{t("profile.agreementDialog.escrowText").replace("{{amount}}", agreementBooking.authorizedAmount?.toLocaleString("en-IN") || "0")}</p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-stone-800">{t("profile.agreementDialog.cancelLabel")}</h4>
                <p>{t("profile.agreementDialog.cancelText")}</p>
              </div>

              <div className="border-t border-slate-100 pt-3 text-center space-y-1">
                <p className="font-extrabold text-stone-800">{t("profile.agreementDialog.authorizedText")}</p>
                <p className="text-[10px] text-stone-400">{t("profile.agreementDialog.approvedViaText").replace("{{gateway}}", agreementBooking.paymentGateway?.toUpperCase() || "STRIPE")}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAgreementBooking(null)}>{t("profile.agreementDialog.btnClose")}</Button>
            <Button className="bg-orange-600 text-white font-bold" onClick={() => window.print()}>{t("profile.agreementDialog.btnPrint")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
