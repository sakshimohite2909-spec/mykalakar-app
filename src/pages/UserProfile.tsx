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
        setError("Could not load saved artists. Please try again.");
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
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
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
          <h3 className="font-display text-xl font-black text-slate-900">No saved artists yet</h3>
          <p className="mt-2 text-sm font-medium text-slate-500 max-w-xs">
            Hit the{" "}
            <Heart className="inline h-4 w-4 text-[#E25C1D] fill-[#E25C1D]" />{" "}
            <strong className="text-slate-700">SAVE</strong> button on any artist profile to
            bookmark them here for quick access.
          </p>
        </div>

        <Link to="/search">
          <Button className="mt-2 rounded-full bg-stone-950 hover:bg-orange-600 text-white font-bold px-6 transition-colors duration-200">
            <Compass className="mr-2 h-4 w-4" />
            Explore Artists
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
          {savedCards.length === 1 ? "artist" : "artists"} saved
        </p>
        <Link
          to="/search"
          className="text-xs font-extrabold uppercase tracking-widest text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
          Browse More
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
        ? "Artist"
        : liveApplicationStatus === "rejected"
          ? "Artist — Application Rejected"
          : "Artist — Pending Review"
      : userRole === "admin_request"
        ? "Admin Request Pending"
        : "Customer";

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
      phone: artistData?.mobileNumber || artistData?.phone || textValue(userProfile, "phone") || "",
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
      toast({ title: "Request Submitted", description: "Your admin access request has been submitted for review." });
    } catch (err) {
      toast({ variant: "destructive", title: "Request Failed", description: "Could not submit admin request. Please try again." });
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
      toast({ variant: "destructive", title: "Invalid File Type", description: "Only image files are allowed." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File Too Large", description: "Image size must be less than 5MB." });
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
      toast({ title: "Profile saved", description: "Your account profile is up to date." });
    } catch (error) {
      toast({ variant: "destructive", title: "Profile not saved", description: firebaseErrorMessage(error, "Could not save your profile.") });
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
          title: "Payment Order Created",
          description: `Escrow hold details updated. Booking confirmation is processing via webhook. (Order ID: ${order.orderId})`,
        });
      }
      setCheckoutBooking(null);
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Confirmation failed", description: "Could not confirm counter offer." });
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
      toast({ title: "Offer Rejected", description: "Booking request has been cancelled." });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Error", description: "Failed to reject counter offer." });
    }
  };

  const handleReleaseEscrow = async (booking: BookingEvent) => {
    try {
      await updateArtistBookingStatus(booking, "PAYOUT_RELEASED", {
        isEscrowReleased: true,
        escrowState: "RELEASED",
      });
      toast({ title: "Payout Released", description: "Escrow funds released to the artist." });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Error", description: "Failed to release payout." });
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
      toast({ title: "Cancellation Confirmed", description: `Hold released. Simulated refund of Rs ${calculatedRefund.amount.toLocaleString("en-IN")} initiated.` });
      setCancelBookingTarget(null);
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Cancellation failed", description: "Could not cancel request." });
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
      toast({ title: "Dispute Filed Successfully", description: "Escrow payment has been frozen. Admins are reviewing." });
      setDisputeBooking(null);
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Error", description: "Failed to file dispute." });
    }
  };

  const canViewPublicArtist = artistData && (artistData.status === "active" || artistData.status === "approved");

  // Tab configuration
  const tabs: { id: DashboardTab; label: string; icon: React.ReactNode; count?: number }[] = [
    {
      id: "profile",
      label: "My Profile",
      icon: <UserCircle className="h-4 w-4" />,
    },
    {
      id: "bookings",
      label: "My Bookings",
      icon: <Calendar className="h-4 w-4" />,
      count: bookings.length || undefined,
    },
    {
      id: "saved",
      label: "Saved Artists",
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
              <h1 className="font-display text-3xl font-black text-slate-950">My Account</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              {userRole === "admin" ? (
                <Link to="/admin">
                  <Button variant="outline"><ShieldCheck className="mr-2 h-4 w-4" /> Admin Console</Button>
                </Link>
              ) : null}
              {userRole === "artist" ? (
                <Link to="/artist/dashboard">
                  <Button variant="outline"><LayoutDashboard className="mr-2 h-4 w-4" /> Artist Dashboard</Button>
                </Link>
              ) : null}
              {canViewPublicArtist ? (
                <Link to={`/artist/${artistData.uid || artistData.id}`}>
                  <Button className="gradient-bg border-0 text-primary-foreground"><Eye className="mr-2 h-4 w-4" /> View Public Page</Button>
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
                          <Camera className="h-4 w-4" /> Change Photo
                        </span>
                      </button>
                    </div>

                    <div className="space-y-5">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="profile-name">Full Name</Label>
                          <Input id="profile-name" value={form.name} onChange={(event) => updateField("name", event.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="profile-username">Username</Label>
                          <Input id="profile-username" value={form.username} onChange={(event) => updateField("username", event.target.value)} />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="profile-phone">Phone</Label>
                          <Input id="profile-phone" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="profile-role">Access</Label>
                          <Input id="profile-role" value={roleLabel} disabled className="bg-slate-50 font-semibold" />
                        </div>
                      </div>

                      <Button onClick={handleSave} disabled={saving || !form.name.trim()} className="h-12 w-full gradient-bg border-0 font-bold text-primary-foreground md:w-auto md:px-8">
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Profile
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
                      Administration Access
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-800">Apply for Admin Access</p>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        Submit a request to be reviewed by the platform administrators for elevated permissions.
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
                        <><ShieldCheck className="mr-2 h-4 w-4" />Apply for Admin Access</>
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
                      My Event Bookings
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
                        No bookings found. Visit artist profiles to book calendar holds.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {bookings.map((booking) => {
                          const isPending = ["SOFT_HOLD_ACTIVE", "PAYMENT_AUTHORIZED", "PENDING_ARTIST_RESPONSE"].includes(booking.status);

                          return (
                            <div key={booking.id} className="border border-slate-200/80 rounded-2xl bg-white p-5 shadow-sm space-y-4 hover:shadow-md transition duration-200">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-slate-100 pb-3">
                                <div>
                                  <h3 className="font-display text-lg font-black text-slate-900">{booking.performanceType} with {booking.artistName || "Artist"}</h3>
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
                                  <span>Gateway: <strong className="text-stone-900 uppercase">{booking.paymentGateway || "Stripe"}</strong></span>
                                </div>
                                <div>
                                  <span>Escrow Hold: <strong className="text-[#FF6B00] text-sm font-black">Rs {(booking.authorizedAmount || 0).toLocaleString("en-IN")}</strong></span>
                                </div>
                                <div>
                                  <span>Escrow Payout: <strong className="text-stone-900 font-extrabold uppercase">{booking.escrowState || "AUTHORIZED"}</strong></span>
                                </div>
                              </div>

                              {/* COUNTER OFFER DIFF VIEW */}
                              {booking.status === "COUNTER_OFFER_SENT" && (
                                <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-4 space-y-3">
                                  <span className="flex items-center gap-1.5 font-black text-amber-900 text-xs uppercase tracking-wider">
                                    <RefreshCw className="h-4 w-4 text-amber-600 animate-spin" />
                                    Negotiation Counter-Offer Diff
                                  </span>
                                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                                    <div className="p-3 bg-white/70 border border-slate-100 rounded-xl">
                                      <p className="text-[10px] font-black uppercase text-stone-400 mb-2">Original Request</p>
                                      <p className="mb-1">Price: <strong className="text-stone-700">Rs {booking.authorizedAmount?.toLocaleString("en-IN")}</strong></p>
                                      <p className="mb-1">Date: <strong className="text-stone-700">{formatDate(booking.eventDate)}</strong></p>
                                      <p className="mb-1">Time: <strong className="text-stone-700">{booking.eventStartTime} - {booking.eventEndTime}</strong></p>
                                      <p>Location: <strong className="text-stone-700">{booking.venueLocation}</strong></p>
                                    </div>
                                    <div className="p-3 bg-amber-100/40 border border-amber-200/50 rounded-xl">
                                      <p className="text-[10px] font-black uppercase text-amber-600 mb-2">Counter Proposal</p>
                                      <p className="mb-1">Price: <strong className="text-amber-800 font-black">Rs {booking.counterOfferAmount?.toLocaleString("en-IN")}</strong></p>
                                      <p className="mb-1">Date: <strong className="text-amber-800 font-bold">{formatDate(booking.counterOfferDate || booking.eventDate)}</strong></p>
                                      <p className="mb-1">Time: <strong className="text-amber-800 font-bold">{booking.counterOfferStartTime || booking.eventStartTime} - {booking.counterOfferEndTime || booking.eventEndTime}</strong></p>
                                      <p>Location: <strong className="text-amber-800 font-bold">{booking.counterOfferLocation || booking.venueLocation}</strong></p>
                                    </div>
                                  </div>
                                  {booking.counterOfferNotes && (
                                    <p className="text-xs text-amber-800 italic pl-1.5 pt-1">Notes: "{booking.counterOfferNotes}"</p>
                                  )}
                                </div>
                              )}

                              {booking.status === "DISPUTE_OPENED" && (
                                <div className="border border-rose-200 bg-rose-50/50 rounded-xl p-3.5 text-xs text-rose-950 font-semibold">
                                  <span className="flex items-center gap-1.5 font-bold text-rose-700">
                                    <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                                    Dispute Filed:
                                  </span>
                                  <p className="pl-6 mt-1 text-stone-600 font-bold">{booking.disputeNotes}</p>
                                </div>
                              )}

                              {/* Customer Action buttons */}
                              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                                {booking.status === "CONFIRMED" && (
                                  <Button size="sm" variant="outline" className="border-stone-200 rounded-xl mr-auto font-bold text-stone-600" onClick={() => setAgreementBooking(booking)}>
                                    <FileText className="mr-1.5 h-4 w-4" /> View Agreement
                                  </Button>
                                )}
                                {isPending && (
                                  <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl" onClick={() => triggerCancelCancellation(booking)}>
                                    Cancel Request
                                  </Button>
                                )}
                                {booking.status === "COUNTER_OFFER_SENT" && (
                                  <>
                                    <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl" onClick={() => handleRejectCounter(booking)}>
                                      Decline Counter
                                    </Button>
                                    <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold px-4" onClick={() => handleAcceptCounterInit(booking)}>
                                      Accept & Confirm Hold
                                    </Button>
                                  </>
                                )}
                                {booking.status === "EVENT_COMPLETED" && (
                                  <>
                                    <Button variant="outline" size="sm" className="border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl" onClick={() => triggerDispute(booking)}>
                                      Open Dispute
                                    </Button>
                                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold px-5" onClick={() => handleReleaseEscrow(booking)}>
                                      Release Escrow Payout
                                    </Button>
                                  </>
                                )}
                                {booking.status === "CONFIRMED" && (
                                  <>
                                    <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl" onClick={() => triggerCancelCancellation(booking)}>
                                      Cancel Booking
                                    </Button>
                                    <Button variant="outline" size="sm" className="border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl" onClick={() => triggerDispute(booking)}>
                                      File Dispute
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
                      Saved Artists
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {currentUser ? (
                      <SavedArtistsTab uid={currentUser.uid} />
                    ) : (
                      <div className="py-12 text-center text-slate-400 font-semibold">
                        <AlertCircle className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                        Please sign in to view your saved artists.
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
              <XCircle className="h-5 w-5" /> Cancel Request & Refund Calculator
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm text-stone-600 font-semibold leading-relaxed">
            <p>Are you sure you want to cancel this booking?</p>
            {calculatedRefund && (
              <div className="p-3 bg-slate-50 border rounded-xl space-y-1.5 font-bold">
                <p className="flex justify-between">Refund Eligible Days: <span className="text-stone-900">{calculatedRefund.percentage}% refund</span></p>
                <p className="flex justify-between text-rose-600 text-md">Refund Amount: <span>Rs {calculatedRefund.amount.toLocaleString("en-IN")}</span></p>
              </div>
            )}
            <p className="text-xs text-stone-400">Funds will be returned to your payment account according to the artist's configured cancellation window policy.</p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCancelBookingTarget(null)}>No, Keep Hold</Button>
            <Button className="bg-rose-600 hover:bg-rose-700 text-white font-bold" onClick={confirmCancellation} disabled={cancelling}>
              {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispute filing popup */}
      <Dialog open={Boolean(disputeBooking)} onOpenChange={(open) => !open && setDisputeBooking(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-black text-rose-700 flex items-center gap-1.5">
              <AlertCircle className="h-5 w-5" /> File Booking Dispute
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-sm text-stone-600 font-semibold">
            <div className="space-y-1">
              <Label>Dispute Claim Category</Label>
              <select
                value={disputeCategory}
                onChange={(e) => setDisputeCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white font-semibold outline-none"
              >
                <option value="artist_no_show">Artist No-Show</option>
                <option value="late_arrival">Late Arrival</option>
                <option value="service_mismatch">Service Scope Mismatch</option>
                <option value="fraudulent_behavior">Fraudulent Behavior</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Detail Dispute Claims</Label>
              <Textarea
                placeholder="Describe specifically what went wrong (evidence details, scope discrepancy, etc.)"
                rows={4}
                value={disputeText}
                onChange={(e) => setDisputeText(e.target.value)}
                className="font-semibold"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDisputeBooking(null)}>Cancel</Button>
            <Button className="bg-rose-600 hover:bg-rose-700 text-white font-bold" onClick={submitDispute} disabled={!disputeText.trim()}>
              Submit Dispute Hold
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Counter Offer Price Increase Additional Auth Checkout popup */}
      <Dialog open={Boolean(checkoutBooking)} onOpenChange={(open) => !open && setCheckoutBooking(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-black text-stone-900 flex items-center gap-1.5">
              <CreditCard className="h-5 w-5 text-[#FF6B00]" /> Additional Payment Auth
            </DialogTitle>
          </DialogHeader>
          {checkoutBooking && (
            <div className="space-y-4 py-2 text-sm text-stone-600 font-semibold">
              <div className="p-3 bg-amber-50 rounded-xl space-y-1 font-bold">
                <p className="flex justify-between">Original Authorized Hold: <span>Rs {checkoutBooking.authorizedAmount?.toLocaleString("en-IN")}</span></p>
                <p className="flex justify-between">New Counter proposed Price: <span>Rs {checkoutBooking.counterOfferAmount?.toLocaleString("en-IN")}</span></p>
                <p className="flex justify-between text-amber-700 text-md border-t border-amber-200/50 pt-1.5 mt-1.5">
                  Extra Hold Amount to Authorize:
                  <span>Rs {((checkoutBooking.counterOfferAmount || 0) - (checkoutBooking.authorizedAmount || 0)).toLocaleString("en-IN")}</span>
                </p>
              </div>

              <div className="border border-slate-200 rounded-xl bg-slate-50 p-3.5 space-y-3">
                <h4 className="text-xs font-black uppercase text-stone-400 tracking-wider">Simulated {checkoutGateway.toUpperCase()} Gateway</h4>
                <div className="space-y-1">
                  <Label>Cardholder Name</Label>
                  <Input placeholder="Johnathan Doe" value={checkoutDetails.cardholderName} onChange={(e) => setCheckoutDetails(prev => ({ ...prev, cardholderName: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Card Number</Label>
                  <Input placeholder="4111 2222 3333 4444" value={checkoutDetails.cardNumber} onChange={(e) => setCheckoutDetails(prev => ({ ...prev, cardNumber: e.target.value }))} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCheckoutBooking(null)}>Cancel</Button>
            <Button className="bg-[#FF6B00] hover:bg-[#e86100] text-white font-bold" onClick={submitCheckoutDelta} disabled={completingCheckout}>
              {completingCheckout ? <Loader2 className="h-4 w-4 animate-spin" /> : "Authorize Extra Hold"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking Agreement modal */}
      <Dialog open={Boolean(agreementBooking)} onOpenChange={(open) => !open && setAgreementBooking(null)}>
        <DialogContent className="max-w-lg rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-black text-stone-900 flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
              <FileText className="h-5 w-5 text-orange-600" /> Booking Agreement
            </DialogTitle>
          </DialogHeader>
          {agreementBooking && (
            <div className="space-y-4 py-2 text-xs font-semibold text-stone-600 leading-relaxed">
              <div className="text-center bg-stone-50 border rounded-xl p-3 mb-4 space-y-1">
                <h3 className="font-display text-sm font-black text-stone-900">PERFORMANCE SERVICE CONTRACT</h3>
                <p className="text-[10px] text-stone-400">Contract ID: CONTRACT-{agreementBooking.id.slice(0, 8).toUpperCase()}</p>
              </div>

              <p>This document serves as a binding performance contract between the **Client ({agreementBooking.clientName})** and the **Artist ({agreementBooking.artistName})** under the following agreed-upon terms:</p>

              <div className="grid grid-cols-2 gap-4 bg-stone-50/70 p-3 rounded-xl border border-stone-100">
                <div>
                  <p className="text-[10px] font-black uppercase text-stone-400">Date of Performance</p>
                  <p className="font-bold text-stone-800">{formatDate(agreementBooking.eventDate)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-stone-400">Performance Hours</p>
                  <p className="font-bold text-stone-800">{agreementBooking.eventStartTime} - {agreementBooking.eventEndTime}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-stone-400">Function Location</p>
                  <p className="font-bold text-stone-800">{agreementBooking.venueLocation}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-stone-400">Performance Type</p>
                  <p className="font-bold text-stone-800">{agreementBooking.performanceType}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-stone-800">1. Escrow & Fees</h4>
                <p>The total performance rate is set at **Rs {agreementBooking.authorizedAmount?.toLocaleString("en-IN")}**. The Client has authorized this deposit in platform escrow. Payout will be released to the Artist upon event completion and dispute window resolution.</p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-stone-800">2. Cancellation Rules</h4>
                <p>Cancellations are subject to platform policy. Refund rates are adjusted based on remaining days before the event starts. No refunds are available for cancellations within 7 days of the date.</p>
              </div>

              <div className="border-t border-slate-100 pt-3 text-center space-y-1">
                <p className="font-extrabold text-stone-800">AUTHORIZED & CAPTURED IN ESCROW</p>
                <p className="text-[10px] text-stone-400">Approved via {agreementBooking.paymentGateway?.toUpperCase()} Gateway</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAgreementBooking(null)}>Close Agreement</Button>
            <Button className="bg-orange-600 text-white font-bold" onClick={() => window.print()}>Print Agreement</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
