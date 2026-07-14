import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  MapPin,
  IndianRupee,
  Mic2,
  Tag,
  ClipboardList,
  X,
  Loader2,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Clock,
  SlidersHorizontal,
  Inbox,
  AlertTriangle,
  FileText,
} from "lucide-react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ImageRegistryService } from "@/services/ImageRegistryService";
import { useI18n } from "@/i18n/I18nProvider";

const PERFORMANCE_TYPES = [
  "Singer",
  "Dancer",
  "DJ",
  "Band",
  "Anchor",
  "Other",
];

import { useCategories } from "@/hooks/useCategories";

interface NewBriefModalProps {
  open: boolean;
  onClose: () => void;
}

function NewBriefModal({ open, onClose }: NewBriefModalProps) {
  const { currentUser, userRole } = useAuth();
  const { categories } = useCategories();
  const { t } = useI18n();
  const [eventName, setEventName] = useState("");
  const [totalBudget, setTotalBudget] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [performanceType, setPerformanceType] = useState("");
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [requirements, setRequirements] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const toggleChip = (tag: string) => {
    setSelectedChips((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleClose = () => {
    if (submitting) return;
    setEventName("");
    setTotalBudget("");
    setLocation("");
    setEventDate("");
    setPerformanceType("");
    setSelectedChips([]);
    setRequirements("");
    setSuccess(false);
    onClose();
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast({
        variant: "destructive",
        title: t("events.toast.signinRequired"),
        description: t("events.toast.signinRequiredText"),
      });
      return;
    }

    if (userRole === "artist") {
      toast({
        variant: "destructive",
        title: t("events.toast.failed") || "Restricted Action",
        description: t("events.toast.artistCannotPost"),
      });
      return;
    }

    setSubmitting(true);
    toast({
      title: t("events.toast.submitting"),
      description: t("events.toast.connecting"),
    });

    try {
      const budgetNum = Number(totalBudget) || 0;
      let dateTimestamp: Timestamp;
      if (eventDate) {
        dateTimestamp = Timestamp.fromDate(new Date(eventDate));
      } else {
        dateTimestamp = Timestamp.fromDate(new Date());
      }

      const payload = {
        eventName: eventName.trim(),
        title: eventName.trim(),
        name: eventName.trim(),
        totalBudget: budgetNum,
        budget: budgetNum,
        location: location.trim(),
        city: location.trim(),
        eventDate: dateTimestamp,
        date: eventDate,
        performanceType: performanceType,
        type: performanceType,
        categories: selectedChips,
        requirements: requirements.trim(),
        professionalRequirements: requirements.trim(),
        postedBy: currentUser.uid,
        createdBy: currentUser.uid,
        postedByName: currentUser.displayName || currentUser.email || "Anonymous",
        postedByEmail: currentUser.email || "",
        status: "pending", // submitted briefs must be pending admin approval
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "eventBriefs"), payload);

      setSuccess(true);
      toast({
        title: t("events.toast.success"),
        description: t("events.toast.successText"),
      });
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      console.error("Firebase write error:", err);
      toast({
        variant: "destructive",
        title: t("events.toast.failed"),
        description: err?.message || t("events.toast.failedText"),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/30 backdrop-blur-md"
            onClick={handleClose}
          />

          {/* Dialog Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-xl rounded-3xl border border-white/60 bg-white/90 p-6 shadow-2xl backdrop-blur-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Accent Line */}
            <div className="absolute top-0 inset-x-0 h-1 w-full bg-gradient-to-r from-[#E25C1D] to-orange-400 rounded-t-3xl" />

            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#E25C1D]" />
                <h3 className="text-base font-extrabold text-stone-900">{t("events.modal.title")}</h3>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full p-1 text-stone-400 hover:bg-stone-50 hover:text-stone-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {success ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-250">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 animate-bounce" />
                </div>
                <h4 className="mt-4 text-lg font-black text-stone-900">{t("events.modal.successTitle")}</h4>
                <p className="mt-1 text-xs font-semibold text-stone-550 max-w-xs">
                  {t("events.modal.successText")}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-left">
                {/* Event Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 flex items-center gap-1">
                    {t("events.modal.eventName")} <span className="text-[#E25C1D]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t("events.modal.eventNamePlaceholder")}
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="w-full h-10 rounded-xl border border-stone-200 bg-white/50 px-3.5 text-xs font-semibold text-stone-900 outline-none focus:border-[#E25C1D] focus:ring-2 focus:ring-[#E25C1D]/20 transition"
                  />
                </div>

                {/* Budget + Location */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 flex items-center gap-1">
                      {t("events.modal.totalBudget")} <span className="text-[#E25C1D]">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-xs font-bold text-stone-500">₹</span>
                      <input
                        type="number"
                        required
                        min="0"
                        placeholder={t("events.modal.totalBudgetPlaceholder")}
                        value={totalBudget}
                        onChange={(e) => setTotalBudget(e.target.value)}
                        className="w-full h-10 rounded-xl border border-stone-200 bg-white/50 pl-7 pr-3.5 text-xs font-semibold text-stone-900 outline-none focus:border-[#E25C1D] focus:ring-2 focus:ring-[#E25C1D]/20 transition"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 flex items-center gap-1">
                      {t("events.modal.location")} <span className="text-[#E25C1D]">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <MapPin className="absolute left-3.5 h-3.5 w-3.5 text-stone-400" />
                      <input
                        type="text"
                        required
                        placeholder={t("events.modal.locationPlaceholder")}
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full h-10 rounded-xl border border-stone-200 bg-white/50 pl-9 pr-3.5 text-xs font-semibold text-stone-900 outline-none focus:border-[#E25C1D] focus:ring-2 focus:ring-[#E25C1D]/20 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Date + Performance Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 flex items-center gap-1">
                      {t("events.modal.date")} <span className="text-[#E25C1D]">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <Calendar className="absolute left-3.5 h-3.5 w-3.5 text-stone-450" />
                      <input
                        type="date"
                        required
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full h-10 rounded-xl border border-stone-200 bg-white/50 pl-9 pr-3.5 text-xs font-semibold text-stone-900 outline-none focus:border-[#E25C1D] focus:ring-2 focus:ring-[#E25C1D]/20 transition"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 flex items-center gap-1">
                      {t("events.modal.performanceType")} <span className="text-[#E25C1D]">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <Mic2 className="absolute left-3.5 h-3.5 w-3.5 text-stone-450" />
                      <select
                        required
                        value={performanceType}
                        onChange={(e) => setPerformanceType(e.target.value)}
                        className="w-full h-10 rounded-xl border border-stone-200 bg-white/50 pl-9 pr-3.5 text-xs font-semibold text-stone-900 outline-none focus:border-[#E25C1D] focus:ring-2 focus:ring-[#E25C1D]/20 transition cursor-pointer"
                      >
                        <option value="">{t("events.modal.selectType")}</option>
                        {PERFORMANCE_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Categorized Chips */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5 text-[#E25C1D]" />
                    {t("events.modal.categories")}
                  </label>
                  <div className="space-y-3 mt-1.5 max-h-[160px] overflow-y-auto border border-stone-100/80 rounded-2xl p-3 bg-stone-50/50">
                    {categories.map((group) => (
                      <div key={group.heading} className="space-y-1">
                        <span className="block text-[9px] font-extrabold text-stone-400 uppercase tracking-wider">
                          {group.heading}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {group.tags?.map((tag) => {
                            const isSelected = selectedChips.includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => toggleChip(tag)}
                                className={`rounded-full border px-4 py-1 text-[10px] font-extrabold transition-all duration-150 ${
                                  isSelected
                                    ? "bg-[#E25C1D] text-white border-[#E25C1D] shadow-sm"
                                    : "bg-white text-stone-600 border-stone-200 hover:border-orange-300"
                                }`}
                              >
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Professional Requirements */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 flex items-center gap-1">
                    <ClipboardList className="h-3.5 w-3.5 text-[#E25C1D]" />
                    {t("events.modal.requirements")} <span className="text-[#E25C1D]">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder={t("events.modal.requirementsPlaceholder")}
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-white/50 p-3 text-xs font-semibold text-stone-900 outline-none focus:border-[#E25C1D] focus:ring-2 focus:ring-[#E25C1D]/20 transition resize-none leading-relaxed"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex h-11 items-center justify-center gap-2 rounded-xl bg-[#E25C1D] text-xs font-extrabold uppercase tracking-widest text-white shadow-lg shadow-orange-500/25 hover:bg-[#c94e17] transition active:scale-[0.98]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("events.modal.submitting")}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      {t("events.modal.submit")}
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Stat badge helper
function StatBadge({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/70 px-4.5 py-3.5 backdrop-blur-sm shadow-sm transition hover:shadow-md hover:border-orange-100">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-[#E25C1D]">
        {icon}
      </span>
      <div>
        <p className="text-lg font-black text-stone-900 leading-none">{value}</p>
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">{label}</p>
      </div>
    </div>
  );
}

// Glassmorphic Skeleton Loader
function EventsSkeleton() {
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-3xl border border-white/50 bg-white/60 p-5 shadow-sm backdrop-blur-md overflow-hidden animate-pulse flex flex-col gap-3.5"
        >
          <div className="w-full aspect-[4/3] rounded-2xl bg-stone-150" />
          <div className="h-4 w-3/4 rounded-full bg-stone-150" />
          <div className="h-3.5 w-1/2 rounded-full bg-stone-150" />
          <div className="h-8 w-1/3 rounded-xl bg-stone-150" />
          <div className="flex gap-1.5">
            <div className="h-5 w-16 rounded-full bg-stone-150" />
            <div className="h-5 w-20 rounded-full bg-stone-150" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Inner component wrapper for safety and state
function EventsInner() {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);

  // Mount log
  useEffect(() => {
    console.log("Events Page Mounted");
  }, []);

  // Real-time synchronization
  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "eventBriefs"),
      where("status", "==", "approved")
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const list: Record<string, any>[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            list.push({ id: doc.id, ...data });
          });
          // Sort client-side to prevent composite index errors
          list.sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
            const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
            return bTime - aTime;
          });
          setEvents(list);
        } catch (err) {
          console.error("Data parsing error", err);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Firestore onSnapshot error:", error);
        toast({
          variant: "destructive",
          title: t("events.toast.dbIssue"),
          description: t("events.toast.dbIssueText"),
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredEvents = events || [];

  const handleCreateBriefClick = () => {
    if (!currentUser) {
      toast({
        title: t("events.toast.authRequired"),
        description: t("events.toast.authRequiredText"),
      });
      navigate("/login");
      return;
    }
    if (userRole === "artist") {
      toast({
        variant: "destructive",
        title: t("events.toast.failed") || "Restricted Action",
        description: t("events.toast.artistCannotPost"),
      });
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 pt-28 pb-16">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-8 shadow-xl backdrop-blur-sm lg:p-12 mb-10 text-left">
        {/* Glow Effects */}
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-orange-100/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-amber-100/40 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#E25C1D]">
              <Sparkles className="h-3 w-3" /> {t("events.hero.badge")}
            </span>
            <h1 className="mt-4 text-3xl font-extrabold text-stone-900 tracking-tight sm:text-5xl leading-tight">
              {t("events.hero.title")}
            </h1>
            <p className="mt-4 text-sm font-semibold text-stone-500 leading-relaxed max-w-xl">
              {t("events.hero.subtitle")}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCreateBriefClick}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-[#E25C1D] hover:bg-[#c94e17] px-6 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35 transition active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                {t("events.hero.createButton")}
              </button>
              <Link
                to="/artists"
                className="inline-flex h-11 items-center gap-1.5 rounded-full border border-stone-200 hover:border-stone-300 bg-white px-5 text-xs font-bold text-stone-700 shadow-sm transition hover:bg-stone-50 active:scale-[0.98]"
              >
                {t("events.hero.exploreAll")}
                <ArrowRight className="h-4 w-4 text-stone-400" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* High-Impact 4K Visual Wrapper */}
      <div className="relative w-full h-[400px] md:h-[500px] rounded-3xl shadow-lg border border-white/20 mb-10 overflow-hidden bg-stone-100 flex items-center justify-center">
        <img
          src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=2000&auto=format&fit=crop"
          alt="Premium Cultural Event Setup"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-8 left-8 right-8 md:bottom-12 md:left-12 z-10">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 md:p-8 max-w-2xl shadow-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E25C1D] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white mb-4">
              <Sparkles className="h-3 w-3" /> {t("events.hero.featuredExperience")}
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight drop-shadow-sm">
              {t("events.hero.featuredTitle")}
            </h2>
          </div>
        </div>
      </div>

      {/* Main Grid Feed */}
      <section className="min-h-[300px]">
        {loading ? (
          <EventsSkeleton />
        ) : filteredEvents?.length > 0 ? (
          <motion.div
            layout
            className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence mode="popLayout">
              {filteredEvents.map((ev, index) => {
                const title = String(ev?.eventName || ev?.title || ev?.name || "Event Brief");
                const budgetVal = Number(ev?.totalBudget || ev?.budget || 0);
                const locStr = String(ev?.location || ev?.city || "India");
                const categoriesList = Array.isArray(ev?.categories) ? ev.categories : [];

                // Safe Date parsing
                let dateStr = "";
                if (ev?.eventDate) {
                  try {
                    if (ev.eventDate instanceof Timestamp) {
                      dateStr = ev.eventDate.toDate().toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      });
                    } else if (ev.eventDate?.seconds) {
                      dateStr = new Date(ev.eventDate.seconds * 1000).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      });
                    } else {
                      dateStr = new Date(String(ev.eventDate)).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      });
                    }
                  } catch (e) {
                    dateStr = String(ev.eventDate);
                  }
                } else if (ev?.date) {
                  dateStr = String(ev.date);
                } else {
                  dateStr = "Date flexible";
                }

                // Curated background cover matching category
                const coverImage = ImageRegistryService.getBestImage(ev?.performanceType || "Marriage", "event");

                return (
                  <Link
                    key={ev.id || index}
                    to={`/event/${ev.id}`}
                    className="group block h-full focus-visible:outline-none"
                  >
                    <motion.article
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.2) }}
                      className="flex flex-col rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_8px_32px_rgba(226,92,29,0.04)] backdrop-blur-sm transition-all duration-300 md:group-hover:-translate-y-1 md:group-hover:shadow-xl md:group-hover:border-orange-100 h-full"
                    >
                      {/* Cover image header */}
                      <div className="relative w-full aspect-[16/10] overflow-hidden rounded-2xl bg-stone-50 border border-stone-100/50 mb-4 select-none">
                        <img
                          src={coverImage}
                          alt={title}
                          loading="lazy"
                          className="w-full h-full object-cover object-center md:group-hover:scale-103 transition duration-700"
                        />
                        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm shadow-sm rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-[#E25C1D] border border-orange-50">
                          {ev?.performanceType || t("events.card.performance")}
                        </span>
                      </div>

                      {/* Details content */}
                      <div className="flex flex-col flex-1 gap-2.5 text-left">
                        {/* Header Tier */}
                        <h3 className="text-xl font-extrabold text-stone-900 leading-snug line-clamp-1 md:group-hover:text-[#E25C1D] transition">
                          {title}
                        </h3>

                        {/* Financial Tier */}
                        <div className="inline-flex items-center gap-1 rounded-xl bg-orange-50/50 border border-orange-100/50 px-3 py-1.5 w-fit mt-1">
                          <IndianRupee className="h-4 w-4 text-[#E25C1D]" />
                          <span className="text-lg font-black text-[#E25C1D]">
                            {budgetVal > 0 ? budgetVal.toLocaleString("en-IN") : t("events.card.flexible")}
                          </span>
                          <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wide ml-1 select-none">
                            {t("events.card.budget")}
                          </span>
                        </div>

                        {/* Logistics Line */}
                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-stone-500 mt-2">
                          <span className="flex items-center gap-1.5 shrink-0">
                            <MapPin className="h-4 w-4 text-stone-400" />
                            {locStr.split(",")[0]}
                          </span>
                          <span className="flex items-center gap-1.5 shrink-0">
                            <Calendar className="h-4 w-4 text-stone-400" />
                            {dateStr}
                          </span>
                        </div>

                        {/* Tag Array */}
                        {categoriesList.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-auto pt-4 border-t border-stone-100/80">
                            {categoriesList.map((cat: string) => (
                              <span
                                key={cat}
                                className="rounded-full bg-stone-50 border border-stone-150 px-3 py-1 text-[10px] font-black text-stone-600 uppercase tracking-wider"
                              >
                                {cat}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.article>
                  </Link>
                );
              })}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center gap-5 rounded-3xl border border-white/40 bg-gradient-to-b from-stone-50/50 to-stone-100/30 py-24 text-center backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50/50 border border-orange-100 shadow-inner">
              <Sparkles className="h-8 w-8 text-[#E25C1D]/80" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-stone-900 tracking-tight drop-shadow-sm">
                {t("events.empty.title")}
              </h3>
              <p className="mt-2 text-sm font-semibold text-stone-500 max-w-md mx-auto leading-relaxed">
                {t("events.empty.text")}
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#E25C1D] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-md transition hover:bg-[#EA580C] hover:shadow-lg active:scale-95"
            >
              {t("events.empty.button")}
            </button>
          </motion.div>
        )}
      </section>

      {/* New Requirement Modal */}
      <NewBriefModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

// Re-wrapped with ErrorBoundary for step 3
export default function Events() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#FAFAF8] antialiased">
        <Navbar />
        <main>
          <EventsInner />
        </main>
        <Footer />
      </div>
    </ErrorBoundary>
  );
}
