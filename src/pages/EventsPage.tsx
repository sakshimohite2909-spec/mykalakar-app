/**
 * EventsPage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 3 – Public Events / Live Briefs landing page with the
 * "Create Event Brief" overlay modal workflow.
 *
 * Design system: ultra-premium light glassmorphism — pearl/off-white frosted
 * cards, backdrop-blur, high-contrast typography, accent #E25C1D orange.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  Calendar as CalendarIcon,
  MapPin,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Sparkles,
  Clock,
  IndianRupee,
  Mic2,
  Music,
  Camera,
  Star,
  Users,
  Search,
  Filter,
  ArrowUpRight,
  Flame,
} from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { postEventBrief, subscribeApprovedEvents } from "@/services/dataService";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EventBriefForm {
  eventName: string;
  budget: string;
  location: string;
  eventDate: Date | undefined;
  performanceType: string;
  selectedChips: Set<string>;
  requirements: string;
}

interface FormErrors {
  eventName?: string;
  budget?: string;
  location?: string;
  eventDate?: string;
  performanceType?: string;
  selectedChips?: string;
}

type LiveBrief = Record<string, unknown>;

// ─── Chip data (canonical MyKalakar taxonomy) ────────────────────────────────

const CHIP_GROUPS: { heading: string; icon: React.ReactNode; tags: string[] }[] = [
  {
    heading: "Performers",
    icon: <Mic2 className="h-3.5 w-3.5" />,
    tags: ["Karaoke Singers", "Orchestra", "Magicians", "DJs", "Live Bands"],
  },
  {
    heading: "Event Services",
    icon: <Camera className="h-3.5 w-3.5" />,
    tags: ["Photography", "Videography", "Makeup Artists", "Sound & Lighting", "Anchors/Hosts"],
  },
  {
    heading: "Folk & Traditional Arts",
    icon: <Music className="h-3.5 w-3.5" />,
    tags: ["Gondhal", "Jagran", "Bharud", "Lavani Performers", "Dhol Tasha Pathak"],
  },
  {
    heading: "Spiritual & Varkari Sampraday",
    icon: <Star className="h-3.5 w-3.5" />,
    tags: ["Kirtankar", "Pravachankar", "Bhajan Mandal"],
  },
];

const PERFORMANCE_TYPES = [
  "Solo Performance",
  "Duet",
  "Group Performance",
  "Orchestra / Ensemble",
  "DJ Set",
  "Live Band",
  "Folk Troupe",
];


// ─── Helpers ──────────────────────────────────────────────────────────────────

function validateForm(form: EventBriefForm): FormErrors {
  const errors: FormErrors = {};
  if (!form.eventName.trim()) errors.eventName = "Event name is required.";
  if (!form.budget.trim()) {
    errors.budget = "Please enter a budget.";
  } else if (isNaN(Number(form.budget)) || Number(form.budget) <= 0) {
    errors.budget = "Enter a valid positive amount.";
  }
  if (!form.location.trim()) errors.location = "Location is required.";
  if (!form.eventDate) errors.eventDate = "Please select a date.";
  if (!form.performanceType) errors.performanceType = "Select a performance type.";
  if (form.selectedChips.size === 0) {
    errors.selectedChips = "Please select at least one Performer or Service tag.";
  }
  return errors;
}

const INITIAL_FORM: EventBriefForm = {
  eventName: "",
  budget: "",
  location: "",
  eventDate: undefined,
  performanceType: "",
  selectedChips: new Set<string>(),
  requirements: "",
};

// ─── Brief Card ───────────────────────────────────────────────────────────────

function BriefCard({ brief, index }: { brief: LiveBrief; index: number }) {
  const name = String(brief.name || brief.title || brief.eventName || "Unnamed Brief");
  const location = String(brief.location || brief.city || brief.district || "Maharashtra");
  const date = String(brief.eventDate || brief.date || "");
  const budget = Number(brief.budget || brief.totalBudget || 0);
  const type = String(brief.performanceType || brief.type || brief.eventType || "Performance");
  const categories: string[] = Array.isArray(brief.categories)
    ? (brief.categories as string[]).slice(0, 3)
    : [];

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.2), ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-[0_8px_32px_rgba(226,92,29,0.07)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(226,92,29,0.14)] hover:border-orange-200/80"
    >
      {/* Top accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-[#E25C1D] to-amber-400" />

      <div className="flex flex-1 flex-col p-5 gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-extrabold text-stone-900 leading-tight line-clamp-2 group-hover:text-[#E25C1D] transition-colors">
            {name}
          </h3>
          <span className="shrink-0 flex items-center gap-1 rounded-full bg-orange-50 border border-orange-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#E25C1D]">
            <Flame className="h-3 w-3" /> Live
          </span>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-stone-500">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-[#E25C1D]" />
            {location.split(",")[0]}
          </span>
          {date && (
            <span className="flex items-center gap-1">
              <CalendarIcon className="h-3.5 w-3.5 text-[#E25C1D]" />
              {date}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Mic2 className="h-3.5 w-3.5 text-[#E25C1D]" />
            {type}
          </span>
        </div>

        {/* Budget */}
        {budget > 0 && (
          <div className="inline-flex items-center gap-1 rounded-xl bg-stone-50 border border-stone-100 px-3 py-1.5 w-fit">
            <IndianRupee className="h-3.5 w-3.5 text-stone-500" />
            <span className="text-sm font-black text-stone-900">{budget.toLocaleString("en-IN")}</span>
            <span className="text-[10px] font-semibold text-stone-400 ml-0.5">budget</span>
          </div>
        )}

        {/* Category chips */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
            {categories.map((cat) => (
              <span
                key={cat}
                className="rounded-full bg-orange-50 border border-orange-100/80 px-2.5 py-0.5 text-[10px] font-bold text-orange-700"
              >
                {cat}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="border-t border-stone-100 px-5 py-3 flex items-center justify-between bg-stone-50/50">
        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
          Open Brief
        </span>
        <button className="flex items-center gap-1 text-xs font-extrabold text-[#E25C1D] hover:gap-2 transition-all">
          View Details <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.article>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function BriefSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-stone-100 bg-white overflow-hidden">
          <div className="h-1 w-full bg-stone-100" />
          <div className="p-5 space-y-3">
            <div className="h-5 w-3/4 rounded-full bg-stone-100 animate-pulse" />
            <div className="h-4 w-1/2 rounded-full bg-stone-100 animate-pulse" />
            <div className="h-8 w-1/3 rounded-xl bg-stone-100 animate-pulse" />
          </div>
          <div className="border-t border-stone-100 px-5 py-3 bg-stone-50/50">
            <div className="h-3 w-1/4 rounded-full bg-stone-100 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Create Event Brief Modal ─────────────────────────────────────────────────

interface CreateBriefModalProps {
  open: boolean;
  onClose: () => void;
}

function CreateBriefModal({ open, onClose }: CreateBriefModalProps) {
  const { currentUser } = useAuth();
  const [form, setForm] = useState<EventBriefForm>({ ...INITIAL_FORM, selectedChips: new Set() });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [perfOpen, setPerfOpen] = useState(false);
  const [requirementsTab, setRequirementsTab] = useState<"write" | "preview">("write");
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Lock background scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      const timer = setTimeout(() => firstInputRef.current?.focus(), 120);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = "";
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [open]);

  // Keyboard: Escape closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) handleClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const handleClose = useCallback(() => {
    if (submitting) return;
    setForm({ ...INITIAL_FORM, selectedChips: new Set() });
    setErrors({});
    setSubmitted(false);
    setPerfOpen(false);
    setRequirementsTab("write");
    onClose();
  }, [submitting, onClose]);

  const setField = useCallback(
    <K extends keyof Omit<EventBriefForm, "selectedChips">>(
      key: K,
      value: EventBriefForm[K]
    ) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      if (errors[key as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [key]: undefined }));
      }
    },
    [errors]
  );

  // O(1) chip toggle
  const toggleChip = useCallback((tag: string) => {
    setForm((prev) => {
      const next = new Set(prev.selectedChips);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return { ...prev, selectedChips: next };
    });
    setErrors((prev) => ({ ...prev, selectedChips: undefined }));
  }, []);

  const handleSubmit = async () => {
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Scroll to first error
      const firstErrorEl = document.querySelector("[data-field-error]");
      if (firstErrorEl) firstErrorEl.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);
    try {
      await postEventBrief({
        eventName: form.eventName.trim(),
        budget: Number(form.budget),
        location: form.location.trim(),
        eventDate: form.eventDate as Date,
        performanceType: form.performanceType,
        categories: Array.from(form.selectedChips),
        requirements: form.requirements.trim(),
        postedBy: currentUser!.uid,
        postedByName: currentUser!.displayName ?? currentUser!.email ?? "Anonymous",
        postedByEmail: currentUser!.email ?? "",
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: "Could not post your requirement. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const inputBase =
    "w-full rounded-xl border px-4 py-3 text-sm font-semibold text-stone-800 outline-none transition-all duration-200 bg-white/70 backdrop-blur-sm placeholder:text-stone-400 focus:ring-2 focus:ring-[#E25C1D]/30 focus:border-[#E25C1D]";
  const inputError = "border-red-300 bg-red-50/50 focus:ring-red-200 focus:border-red-400";
  const inputNormal = "border-stone-200 hover:border-stone-300";

  // Simple Markdown Parser
  const parseMarkdown = (text: string) => {
    if (!text.trim()) {
      return <p className="text-stone-400 italic text-xs">Nothing to preview yet. Start typing your requirements in markdown format.</p>;
    }
    const lines = text.split("\n");
    return (
      <div className="space-y-2 text-stone-700 text-xs leading-relaxed">
        {lines.map((line, idx) => {
          let cleanLine = line;
          
          // Handle list item
          const isList = cleanLine.startsWith("- ") || cleanLine.startsWith("* ");
          if (isList) {
            cleanLine = cleanLine.substring(2);
          }
          
          // Handle headers
          let isHeader = false;
          let headerLevel = 0;
          if (cleanLine.startsWith("# ")) {
            isHeader = true;
            headerLevel = 1;
            cleanLine = cleanLine.substring(2);
          } else if (cleanLine.startsWith("## ")) {
            isHeader = true;
            headerLevel = 2;
            cleanLine = cleanLine.substring(3);
          } else if (cleanLine.startsWith("### ")) {
            isHeader = true;
            headerLevel = 3;
            cleanLine = cleanLine.substring(4);
          }
          
          // Replace bold (**text**) and italic (*text*)
          const boldRegex = /\*\*(.*?)\*\*/g;
          const italicRegex = /\*(.*?)\*/g;
          
          const renderedText = cleanLine
            .replace(boldRegex, "<strong>$1</strong>")
            .replace(italicRegex, "<em>$1</em>");
            
          if (isHeader) {
            if (headerLevel === 1) {
              return <h1 key={idx} className="text-sm font-extrabold text-stone-900 border-b border-stone-100 pb-1 mt-3" dangerouslySetInnerHTML={{ __html: renderedText }} />;
            }
            if (headerLevel === 2) {
              return <h2 key={idx} className="text-xs font-bold text-stone-900 mt-2" dangerouslySetInnerHTML={{ __html: renderedText }} />;
            }
            return <h3 key={idx} className="text-[11px] font-bold text-stone-800 mt-2" dangerouslySetInnerHTML={{ __html: renderedText }} />;
          }
          
          if (isList) {
            return (
              <ul key={idx} className="list-disc pl-5 space-y-1">
                <li dangerouslySetInnerHTML={{ __html: renderedText }} />
              </ul>
            );
          }
          
          if (cleanLine.trim() === "") {
            return <div key={idx} className="h-2" />;
          }
          
          return <p key={idx} dangerouslySetInnerHTML={{ __html: renderedText }} />;
        })}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-md"
            aria-hidden="true"
            onClick={handleClose}
          />

          {/* Modal panel */}
          <motion.div
            key="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Create Event Brief"
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-3 bottom-0 top-16 z-50 mx-auto flex max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-white/60 bg-white/90 shadow-[0_-8px_48px_rgba(226,92,29,0.12)] backdrop-blur-xl sm:inset-x-4 sm:inset-y-8 sm:rounded-3xl md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:rounded-3xl"
          >
            {/* ── Modal header ───────────────────────────────────────────── */}
            <div className="flex shrink-0 items-center justify-between border-b border-stone-100 bg-white/80 px-6 py-4 backdrop-blur-sm">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#E25C1D]">
                  Post a Requirement
                </p>
                <h2 className="text-lg font-extrabold text-stone-950 leading-tight">
                  Create Event Brief
                </h2>
              </div>
              <button
                type="button"
                id="modal-close-btn"
                onClick={handleClose}
                disabled={submitting}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 transition hover:bg-stone-50 hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E25C1D]/40 disabled:opacity-50"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ── Scrollable form body ────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {submitted ? (
                // ─── Success state ─────────────────────────────────────────
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-20 px-8 text-center gap-5"
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 border-2 border-emerald-200">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-stone-900">Brief Posted!</h3>
                    <p className="mt-2 text-sm font-medium text-stone-500 max-w-xs">
                      Your event requirement is now live. Artists will start responding shortly.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="mt-2 h-11 rounded-full bg-stone-950 px-8 text-sm font-extrabold text-white transition hover:bg-[#E25C1D]"
                  >
                    Done
                  </button>
                </motion.div>
              ) : (
                <div className="space-y-7 px-6 py-6">

                  {/* ── A. Master Logistic Credentials ────────────────────── */}
                  <section className="space-y-5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E25C1D] text-[10px] font-black text-white">A</span>
                      <h3 className="text-xs font-extrabold uppercase tracking-widest text-stone-500">
                        Event Logistics
                      </h3>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Event Name */}
                      <div>
                        <label htmlFor="brief-event-name" className="mb-1.5 block text-xs font-extrabold text-stone-600 uppercase tracking-wider">
                          Event Name <span className="text-[#E25C1D]">*</span>
                        </label>
                        <input
                          ref={firstInputRef}
                          id="brief-event-name"
                          type="text"
                          placeholder="Royal Wedding Reception"
                          value={form.eventName}
                          onChange={(e) => setField("eventName", e.target.value)}
                          className={`${inputBase} ${errors.eventName ? inputError : inputNormal}`}
                          autoComplete="off"
                        />
                        {errors.eventName && (
                          <p data-field-error className="mt-1.5 text-xs font-semibold text-rose-500 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                            {errors.eventName}
                          </p>
                        )}
                      </div>

                      {/* Budget */}
                      <div>
                        <label htmlFor="brief-budget" className="mb-1.5 block text-xs font-extrabold text-stone-600 uppercase tracking-wider">
                          Total Budget <span className="text-[#E25C1D]">*</span>
                        </label>
                        <div className={`relative flex rounded-xl border overflow-hidden transition-all duration-200 ${errors.budget ? "border-red-300 bg-red-50/50 focus-within:ring-2 focus-within:ring-red-200" : "border-stone-200 bg-white/70 focus-within:ring-2 focus-within:ring-[#E25C1D]/30 focus-within:border-[#E25C1D]"}`}>
                          <input
                            id="brief-budget"
                            type="number"
                            min="0"
                            placeholder="50000"
                            value={form.budget}
                            onChange={(e) => setField("budget", e.target.value)}
                            className="w-full bg-transparent px-4 py-3 text-sm font-semibold text-stone-800 outline-none placeholder:text-stone-400"
                          />
                          <span className="flex items-center justify-center border-l border-stone-200 bg-stone-50 px-4 text-sm font-extrabold text-stone-600 select-none shrink-0">
                            ₹
                          </span>
                        </div>
                        {errors.budget && (
                          <p data-field-error className="mt-1.5 text-xs font-semibold text-rose-500 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                            {errors.budget}
                          </p>
                        )}
                      </div>

                      {/* Location & Schedule Card */}
                      <div>
                        <label className="mb-1.5 block text-xs font-extrabold text-stone-600 uppercase tracking-wider">
                          Location & Schedule <span className="text-[#E25C1D]">*</span>
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl border border-stone-200/80 bg-white/60 backdrop-blur-sm shadow-sm">
                          {/* Location Input */}
                          <div className="space-y-3">
                            <div>
                              <label htmlFor="brief-location" className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                                Where will the event be held?
                              </label>
                              <div className="relative">
                                <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                                <input
                                  id="brief-location"
                                  type="text"
                                  placeholder="Pune, Maharashtra"
                                  value={form.location}
                                  onChange={(e) => setField("location", e.target.value)}
                                  className={`${inputBase} pl-10 ${errors.location ? inputError : inputNormal}`}
                                />
                              </div>
                              {errors.location && (
                                <p data-field-error className="mt-1.5 text-xs font-semibold text-rose-500 flex items-center gap-1">
                                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                                  {errors.location}
                                </p>
                              )}
                            </div>

                            <div className="pt-1">
                              <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                                Selected Date
                              </span>
                              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${form.eventDate ? "bg-orange-50/50 border-orange-200 text-[#E25C1D]" : "bg-stone-50 border-stone-200 text-stone-500"}`}>
                                <CalendarIcon className="h-4 w-4 shrink-0 text-[#E25C1D]" />
                                {form.eventDate ? format(form.eventDate, "PPP") : "No date selected"}
                              </div>
                              {errors.eventDate && (
                                <p data-field-error className="mt-1.5 text-xs font-semibold text-rose-500 flex items-center gap-1">
                                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                                  {errors.eventDate}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Calendar Picker Inline */}
                          <div className="flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-stone-100 pt-4 md:pt-0 md:pl-4">
                            <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2 self-start md:self-center">
                              Select Event Date
                            </span>
                            <div className="rounded-xl border border-stone-200/50 bg-white shadow-sm p-1 max-w-[270px]">
                              <Calendar
                                mode="single"
                                selected={form.eventDate}
                                onSelect={(date) => setField("eventDate", date)}
                                disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                                className="rounded-lg scale-90 sm:scale-95"
                                classNames={{
                                  day_selected: "bg-[#E25C1D] text-white hover:bg-[#c94d17] hover:text-white focus:bg-[#E25C1D] focus:text-white",
                                  day_today: "border border-[#E25C1D]/30 text-stone-900 bg-[#E25C1D]/5",
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Performance Type stylized select */}
                      <div>
                        <label className="mb-1.5 block text-xs font-extrabold text-stone-600 uppercase tracking-wider">
                          Performance Type <span className="text-[#E25C1D]">*</span>
                        </label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setPerfOpen(!perfOpen)}
                            className={`${inputBase} text-left flex items-center justify-between ${errors.performanceType ? inputError : inputNormal}`}
                          >
                            <span className="flex items-center gap-2">
                              <Mic2 className="h-4 w-4 text-stone-400" />
                              {form.performanceType || "Select performance type..."}
                            </span>
                            <ChevronRight className={`h-4 w-4 text-stone-400 transition-transform duration-200 ${perfOpen ? "rotate-90" : ""}`} />
                          </button>
                          
                          <AnimatePresence>
                            {perfOpen && (
                              <motion.ul
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className="absolute z-20 mt-1 w-full rounded-xl border border-stone-200 bg-white/95 shadow-lg max-h-48 overflow-y-auto"
                              >
                                {PERFORMANCE_TYPES.map((type) => (
                                  <li key={type}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setField("performanceType", type);
                                        setPerfOpen(false);
                                      }}
                                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-orange-50 hover:text-[#E25C1D] transition-colors"
                                    >
                                      {type}
                                    </button>
                                  </li>
                                ))}
                              </motion.ul>
                            )}
                          </AnimatePresence>
                        </div>
                        {errors.performanceType && (
                          <p data-field-error className="mt-1.5 text-xs font-semibold text-rose-500 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                            {errors.performanceType}
                          </p>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* ── Divider ────────────────────────────────────────────── */}
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-stone-200 to-transparent" />

                  {/* ── B. Category Chip Groups ────────────────────────────── */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E25C1D] text-[10px] font-black text-white">B</span>
                      <h3 className="text-xs font-extrabold uppercase tracking-widest text-stone-500">
                        What are you looking for? <span className="text-[#E25C1D]">*</span>
                      </h3>
                    </div>

                    <div className="space-y-5">
                      {CHIP_GROUPS.map((group) => (
                        <div key={group.heading}>
                          <p className="mb-2.5 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-stone-400">
                            <span className="text-[#E25C1D]">{group.icon}</span>
                            {group.heading}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {group.tags.map((tag) => {
                              const active = form.selectedChips.has(tag);
                              return (
                                <motion.button
                                  key={tag}
                                  type="button"
                                  onClick={() => toggleChip(tag)}
                                  whileTap={{ scale: 0.94 }}
                                  aria-pressed={active}
                                  className={[
                                    "rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E25C1D]/40",
                                    active
                                      ? "border-[#E25C1D] bg-[#E25C1D] text-white shadow-[0_2px_12px_rgba(226,92,29,0.3)]"
                                      : "border-stone-200 bg-white text-stone-600 hover:border-[#E25C1D]/50 hover:text-[#E25C1D] hover:bg-orange-50/50",
                                  ].join(" ")}
                                >
                                  {active && (
                                    <motion.span
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="mr-1 inline-block"
                                    >
                                      ✓
                                    </motion.span>
                                  )}
                                  {tag}
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {errors.selectedChips && (
                      <p data-field-error className="mt-1.5 text-xs font-semibold text-rose-500 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                        {errors.selectedChips}
                      </p>
                    )}

                    {form.selectedChips.size > 0 && (
                      <p className="mt-3 text-[11px] font-semibold text-[#E25C1D]">
                        {form.selectedChips.size} categor{form.selectedChips.size === 1 ? "y" : "ies"} selected
                      </p>
                    )}
                  </section>

                  {/* ── Divider ────────────────────────────────────────────── */}
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-stone-200 to-transparent" />

                  {/* ── C. Professional Requirements ──────────────────────── */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E25C1D] text-[10px] font-black text-white">C</span>
                      <h3 className="text-xs font-extrabold uppercase tracking-widest text-stone-500">
                        Professional Requirements
                      </h3>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                          Markdown is supported (**bold**, *italic*, - lists, # headings)
                        </span>
                        <div className="flex rounded-lg border border-stone-200 p-0.5 bg-stone-50 text-[10px] font-bold">
                          <button
                            type="button"
                            onClick={() => setRequirementsTab("write")}
                            className={`px-3 py-1 rounded-md transition-colors ${requirementsTab === "write" ? "bg-white text-stone-800 shadow-sm" : "text-stone-400 hover:text-stone-600"}`}
                          >
                            Write
                          </button>
                          <button
                            type="button"
                            onClick={() => setRequirementsTab("preview")}
                            className={`px-3 py-1 rounded-md transition-colors ${requirementsTab === "preview" ? "bg-white text-stone-800 shadow-sm" : "text-stone-400 hover:text-stone-600"}`}
                          >
                            Preview
                          </button>
                        </div>
                      </div>

                      {requirementsTab === "write" ? (
                        <textarea
                          id="brief-requirements"
                          rows={5}
                          placeholder={`Describe specific needs, rituals, language preferences, stage requirements, logistics or any special dependencies…\n\nE.g.\n**Rituals:** Gondhal to be performed in the morning.\n**Folk Group:** Minimum 5 members.\n- Must provide own traditional costumes.`}
                          value={form.requirements}
                          onChange={(e) => setForm((prev) => ({ ...prev, requirements: e.target.value }))}
                          className={`${inputBase} resize-none leading-relaxed`}
                        />
                      ) : (
                        <div className="w-full min-h-[130px] rounded-xl border border-stone-200 bg-stone-50/50 p-4 overflow-y-auto">
                          {parseMarkdown(form.requirements)}
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Bottom padding so footer doesn't overlap last input on mobile */}
                  <div className="h-4" />
                </div>
              )}
            </div>

            {/* ── Sticky footer ──────────────────────────────────────────────── */}
            {!submitted && (
              <div className="shrink-0 border-t border-stone-100 bg-white/80 px-6 py-4 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    id="modal-cancel-btn"
                    onClick={handleClose}
                    disabled={submitting}
                    className="text-sm font-bold text-stone-500 transition hover:text-stone-800 disabled:opacity-50 px-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    id="modal-post-btn"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className={[
                      "flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-extrabold text-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E25C1D]/50 focus-visible:ring-offset-2",
                      "bg-[#E25C1D] hover:bg-[#c94d17] active:scale-[0.98] shadow-[0_4px_16px_rgba(226,92,29,0.35)] hover:shadow-[0_6px_24px_rgba(226,92,29,0.45)]",
                      submitting ? "opacity-80 cursor-not-allowed" : "",
                    ].join(" ")}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Posting…
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Post Requirement
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Stat Badge ───────────────────────────────────────────────────────────────

function StatBadge({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/60 px-4 py-3 backdrop-blur-sm shadow-sm">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-[#E25C1D]">
        {icon}
      </span>
      <div>
        <p className="text-lg font-extrabold text-stone-950 leading-none">{value}</p>
        <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EventsPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [briefs, setBriefs] = useState<LiveBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    // Subscribe to real-time updates — newly posted briefs appear instantly
    // without the user needing to refresh the page.
    const unsubscribe = subscribeApprovedEvents(
      undefined,
      (data) => {
        setBriefs(data as LiveBrief[]);
        setLoading(false);
      },
      () => {
        setBriefs([]);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  const filteredBriefs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return briefs;
    return briefs.filter((brief) => {
      const searchable = [brief.name, brief.title, brief.eventName, brief.location, brief.city, brief.type, brief.eventType]
        .map((v) => String(v ?? "").toLowerCase())
        .join(" ");
      return searchable.includes(q);
    });
  }, [briefs, searchQuery]);

  const openModal = () => {
    if (!currentUser) {
      toast({
        title: "Sign in required",
        description: "Please sign in to post an event requirement.",
      });
      navigate("/login");
      return;
    }
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-24 md:pb-0">
      <Navbar />

      <main className="container-shell pt-24 animate-fade-in">

        {/* ── Top Navigation Header Section ─────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 bg-white/50 border border-white/80 backdrop-blur-md rounded-2xl px-6 py-4 shadow-[0_4px_20px_rgba(226,92,29,0.03)]">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#E25C1D]">MyKalakar Live</span>
            <h2 className="text-xl font-black text-stone-900 leading-none mt-1">Events & Live Briefs</h2>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            {/* Explore All */}
            <Link
              to="/search"
              id="top-explore-all-btn"
              className="text-xs font-bold text-stone-500 hover:text-[#E25C1D] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E25C1D]/40 px-3 py-2 rounded-lg"
            >
              Explore All
            </Link>
            {/* Create Event Brief */}
            <motion.button
              type="button"
              id="top-create-brief-btn"
              onClick={openModal}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-1.5 rounded-full bg-[#E25C1D] px-5 py-2.5 text-xs font-extrabold text-white shadow-[0_4px_16px_rgba(226,92,29,0.25)] hover:shadow-[0_6px_20px_rgba(226,92,29,0.35)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E25C1D] focus-visible:ring-offset-2"
            >
              <Plus className="h-4 w-4" />
              Create Event Brief
            </motion.button>
          </div>
        </div>

        {/* ── Hero section ─────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-3xl border border-white/80 bg-white/70 shadow-[0_8px_48px_rgba(226,92,29,0.10)] backdrop-blur-xl mb-10 px-6 py-10 sm:px-10 sm:py-12">
          {/* Background glow blobs */}
          <div aria-hidden className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-orange-100/60 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-amber-50/80 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#E25C1D] mb-2">
                Live Event Marketplace
              </p>
              <h1 className="text-4xl font-extrabold text-stone-950 leading-[1.08] sm:text-5xl">
                Find the Perfect<br />
                <span className="bg-gradient-to-r from-[#E25C1D] to-amber-500 bg-clip-text text-transparent">
                  Artist for Your Event
                </span>
              </h1>
              <p className="mt-4 max-w-md text-sm font-medium leading-relaxed text-stone-500">
                Browse live event briefs or post your own requirement. Connect directly with
                verified performers, folk artists, and event specialists across Maharashtra.
              </p>

              {/* CTA button row */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                {/* PRIMARY: Create Event Brief */}
                <motion.button
                  type="button"
                  id="hero-create-brief-btn"
                  onClick={openModal}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 rounded-full bg-[#E25C1D] px-6 py-3 text-sm font-extrabold text-white shadow-[0_4px_20px_rgba(226,92,29,0.38)] transition-shadow duration-200 hover:shadow-[0_6px_28px_rgba(226,92,29,0.52)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E25C1D] focus-visible:ring-offset-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Event Brief
                </motion.button>

                {/* SECONDARY: Explore All */}
                <Link
                  to="/search"
                  id="hero-explore-all-btn"
                  className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-white/80 px-5 py-3 text-sm font-bold text-stone-700 backdrop-blur-sm transition hover:border-stone-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/40"
                >
                  Explore All
                  <ArrowUpRight className="h-3.5 w-3.5 text-stone-400" />
                </Link>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <StatBadge icon={<Users className="h-4 w-4" />} label="Verified Artists" value="500+" />
              <StatBadge icon={<Flame className="h-4 w-4" />} label="Live Briefs" value={loading ? "…" : briefs.length || "0"} />
              <StatBadge icon={<Star className="h-4 w-4" />} label="Events Completed" value="1,200+" />
              <StatBadge icon={<Clock className="h-4 w-4" />} label="Avg. Response" value="< 2 hrs" />
            </div>
          </div>
        </section>

        {/* ── Live Briefs section ────────────────────────────────────────────── */}
        <section className="mb-12">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#E25C1D]">
                Open Requirements
              </p>
              <h2 className="text-2xl font-extrabold text-stone-950 leading-tight">
                Live Event Briefs
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="search"
                  id="briefs-search"
                  placeholder="Search briefs…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-48 rounded-full border border-stone-200 bg-white pl-9 pr-4 text-xs font-semibold text-stone-700 outline-none placeholder:text-stone-400 focus:border-[#E25C1D]/60 focus:ring-1 focus:ring-[#E25C1D]/20 transition sm:w-56"
                />
              </div>

              {/* Post a brief shortcut */}
              <button
                type="button"
                id="section-create-brief-btn"
                onClick={openModal}
                className="flex h-9 items-center gap-1.5 rounded-full bg-[#E25C1D] px-4 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#c94d17] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E25C1D]/40"
              >
                <Plus className="h-3.5 w-3.5" />
                Post Brief
              </button>
            </div>
          </div>

          {loading ? (
            <BriefSkeleton />
          ) : filteredBriefs.length > 0 ? (
            <motion.div
              layout
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              <AnimatePresence mode="popLayout">
                {filteredBriefs.map((brief, idx) => (
                  <BriefCard
                    key={String(brief.id || idx)}
                    brief={brief}
                    index={idx}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center gap-5 rounded-3xl border border-dashed border-stone-200 bg-white/50 py-20 text-center backdrop-blur-sm"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 border border-orange-100">
                <Sparkles className="h-7 w-7 text-[#E25C1D]" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-stone-900">
                  {searchQuery ? "No briefs match your search" : "No live briefs yet"}
                </h3>
                <p className="mt-1 text-sm font-medium text-stone-400 max-w-xs">
                  {searchQuery
                    ? "Try a different search term or clear the filter."
                    : "Be the first to post an event requirement and connect with top artists."}
                </p>
              </div>
              <button
                type="button"
                onClick={searchQuery ? () => setSearchQuery("") : openModal}
                className="mt-1 flex items-center gap-2 rounded-full bg-[#E25C1D] px-6 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#c94d17]"
              >
                {searchQuery ? (
                  <><Filter className="h-4 w-4" /> Clear Filter</>
                ) : (
                  <><Plus className="h-4 w-4" /> Post the First Brief</>
                )}
              </button>
            </motion.div>
          )}
        </section>

        {/* ── Event type selector section (preserve existing flow) ─────────── */}
        <section className="mb-16">
          <div className="mb-5">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#E25C1D]">
              Browse by Type
            </p>
            <h2 className="text-2xl font-extrabold text-stone-950">Start with Event Type</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {[
              { label: "Wedding", href: "/location-select?eventType=Wedding&type=artist", emoji: "💍" },
              { label: "Birthday", href: "/location-select?eventType=Birthday+Party&type=artist", emoji: "🎂" },
              { label: "Corporate", href: "/location-select?eventType=Corporate+Event&type=artist", emoji: "🏢" },
              { label: "Festival", href: "/location-select?eventType=Festival+Celebration&type=artist", emoji: "🎉" },
              { label: "Spiritual", href: "/location-select?eventType=Spiritual+Event&type=artist", emoji: "🙏" },
            ].map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white/80 py-6 text-center transition-all duration-200 hover:-translate-y-1 hover:border-orange-200 hover:shadow-[0_8px_24px_rgba(226,92,29,0.10)] backdrop-blur-sm"
              >
                <span className="text-3xl">{item.emoji}</span>
                <span className="text-xs font-extrabold text-stone-700 group-hover:text-[#E25C1D] transition-colors uppercase tracking-wide">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />

      {/* ── Create Brief Modal ────────────────────────────────────────────────── */}
      <CreateBriefModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
