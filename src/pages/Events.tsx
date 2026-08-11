import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Calendar,
  MapPin,
  IndianRupee,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import {
  collection,
  onSnapshot,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ErrorBoundary from "@/components/ErrorBoundary";
import NewRequirementModal from "@/components/NewRequirementModal";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ImageRegistryService } from "@/services/ImageRegistryService";
import { useI18n } from "@/i18n/I18nProvider";

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
      where("status", "in", ["approved", "pending", "active"])
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
      {/* Premium Hero Banner Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-stone-950 via-stone-900 to-stone-800 p-8 sm:p-10 lg:p-12 shadow-xl mb-10 text-left text-white">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-orange-600/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/20 border border-orange-500/30 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-orange-400">
              <Sparkles className="h-3.5 w-3.5" /> Event Marketplace
            </span>
            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Live Briefs & Quick Event Setup
            </h1>
            <p className="mt-3.5 text-sm sm:text-base font-semibold text-stone-300 leading-relaxed max-w-xl">
              Create event requirements and connect with verified artists. Browse live event briefs or setup a quick brief for performers across India.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3.5">
              <button
                type="button"
                onClick={handleCreateBriefClick}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-orange-600 hover:bg-orange-500 px-6 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-orange-600/30 transition active:scale-[0.98]"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                + Create Event Brief
              </button>
              <Link
                to="/events/Wedding"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-stone-700 bg-stone-900/80 hover:bg-stone-800 px-6 text-xs font-extrabold uppercase tracking-wider text-stone-200 shadow-sm transition active:scale-[0.98]"
              >
                Browse by Event
                <ArrowRight className="h-4 w-4 text-orange-400" />
              </Link>
            </div>
          </div>

          {/* Right Hero Image Card */}
          <div className="relative w-full lg:w-[400px] h-[220px] sm:h-[260px] rounded-2xl overflow-hidden shadow-2xl border border-stone-800 shrink-0">
            <img
              src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop"
              alt="Live Event Setup"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <span className="text-[11px] font-extrabold text-orange-400 uppercase tracking-widest">
                Verified Requirements
              </span>
              <p className="text-xs font-bold text-stone-200 mt-0.5">
                Connect directly with top rated performers & service providers.
              </p>
            </div>
          </div>
        </div>
      </section>

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
                const coverImage = ev?.imageUrl || ev?.image || ImageRegistryService.getBestImage(ev?.performanceType || "Marriage", "event");

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
      <NewRequirementModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
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
