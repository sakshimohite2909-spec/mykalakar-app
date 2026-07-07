/**
 * NewRequirementModal.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 4 — "New Requirement" event brief creation modal.
 *
 * Integrates with `eventBriefService.submitEventBrief()` to write a
 * validated, sanitised document to Firestore's `eventBriefs` collection.
 *
 * Design: premium light-themed glassmorphism, branded with #E25C1D orange.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Loader2,
  CheckCircle2,
  CalendarDays,
  MapPin,
  IndianRupee,
  Music2,
  ClipboardList,
  Tag,
  FileText,
} from "lucide-react";
import { submitEventBrief, type EventBriefFormData } from "@/services/eventBriefService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────────────────────

const PERFORMANCE_TYPES = [
  "Live Music",
  "DJ",
  "Dance Performance",
  "Stand-up Comedy",
  "Anchor / Host",
  "Classical Music",
  "Folk Performance",
  "Magic Show",
  "Photography",
  "Videography",
  "Catering",
  "Decoration",
  "Other",
];

const CATEGORY_OPTIONS = [
  "Wedding",
  "Birthday",
  "Corporate",
  "Festival",
  "Spiritual",
  "Concert",
  "Conference",
  "Workshop",
  "Private Party",
  "Award Ceremony",
];

// ── Form state ────────────────────────────────────────────────────────────────

const EMPTY_FORM: EventBriefFormData = {
  eventName: "",
  totalBudget: "",
  location: "",
  eventDate: "",
  performanceType: "",
  categories: [],
  professionalRequirements: "",
};

// ── Sub-components ────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  icon?: React.ElementType;
}

function Field({ label, required, children, icon: Icon }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-stone-500">
        {Icon && <Icon className="h-3.5 w-3.5 text-[#E25C1D]" />}
        {label}
        {required && <span className="text-[#E25C1D]">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = cn(
  "h-10 w-full rounded-xl border border-stone-200 bg-white/80 px-3",
  "text-sm font-semibold text-stone-900 placeholder:text-stone-400",
  "outline-none transition focus:border-[#E25C1D] focus:ring-2 focus:ring-[#E25C1D]/20"
);

// ── Main Component ────────────────────────────────────────────────────────────

interface NewRequirementModalProps {
  open: boolean;
  onClose: () => void;
}

export default function NewRequirementModal({ open, onClose }: NewRequirementModalProps) {
  const { currentUser } = useAuth();
  const [form, setForm] = useState<EventBriefFormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // ── Helpers ────────────────────────────────────────────────────────────
  const set = useCallback(
    <K extends keyof EventBriefFormData>(key: K, value: EventBriefFormData[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    []
  );

  const toggleCategory = useCallback((cat: string) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  }, []);

  const handleClose = useCallback(() => {
    if (submitting) return;
    setForm(EMPTY_FORM);
    setSuccess(false);
    onClose();
  }, [submitting, onClose]);

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      toast({
        variant: "destructive",
        title: "Sign in required",
        description: "Please log in to submit an event brief.",
      });
      return;
    }

    // ── Phase 5 toast chain: pending → success | error ─────────────────
    setSubmitting(true);

    // 1. Pending toast — shows immediately on submit
    toast({
      title: "📋 Submitting brief…",
      description: "Connecting to MyKalakar — please wait.",
    });

    const result = await submitEventBrief(form);
    setSubmitting(false);

    if (result.success) {
      setSuccess(true);

      // 2. Success toast — replaces the pending one
      toast({
        title: "Brief submitted for review! 🎉",
        description:
          "Your requirement is pending admin approval. Once approved it appears in the live feed.",
      });

      // Auto-close modal after 2 s to let the user read the success state
      setTimeout(() => {
        handleClose();
      }, 2000);
    } else {
      // 3. Error toast — network or rules rejection
      toast({
        variant: "destructive",
        title: "Submission failed ⚠️",
        description:
          result.error ??
          "Could not reach the database. Check your connection and try again.",
      });
    }
  };


  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "fixed inset-x-4 bottom-0 z-50 mx-auto max-w-xl overflow-hidden",
              "rounded-t-3xl border border-stone-200/80 bg-white/95 shadow-2xl backdrop-blur-xl",
              "sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
              "sm:rounded-3xl sm:max-h-[90vh] overflow-y-auto"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Orange accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-[#E25C1D] to-orange-300" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50">
                  <FileText className="h-4.5 w-4.5 text-[#E25C1D]" />
                </span>
                <div>
                  <h2 className="text-base font-black text-stone-950">
                    Post a New Requirement
                  </h2>
                  <p className="text-[11px] font-semibold text-stone-500">
                    Describe your event — we'll match the best artists.
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close modal"
                onClick={handleClose}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 text-stone-500 transition hover:bg-stone-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Success state */}
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
                  <CheckCircle2 className="h-9 w-9 text-emerald-500" />
                </span>
                <h3 className="text-xl font-black text-stone-950">
                  Requirement Submitted!
                </h3>
                <p className="max-w-xs text-sm font-semibold text-stone-500">
                  Our team will review and approve your brief shortly. You'll
                  receive updates once it goes live.
                </p>
              </motion.div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-5">
                {/* Row 1 — Event Name */}
                <Field label="Event Name" required icon={FileText}>
                  <input
                    id="brief-event-name"
                    type="text"
                    required
                    placeholder="e.g. Sharma Family Wedding Reception"
                    value={form.eventName}
                    onChange={(e) => set("eventName", e.target.value)}
                    className={inputCls}
                  />
                </Field>

                {/* Row 2 — Budget + Location */}
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Total Budget (₹)" required icon={IndianRupee}>
                    <input
                      id="brief-budget"
                      type="number"
                      required
                      min={0}
                      placeholder="50000"
                      value={form.totalBudget}
                      onChange={(e) => set("totalBudget", e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Location / City" required icon={MapPin}>
                    <input
                      id="brief-location"
                      type="text"
                      required
                      placeholder="e.g. Pune, Maharashtra"
                      value={form.location}
                      onChange={(e) => set("location", e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                </div>

                {/* Row 3 — Event Date + Performance Type */}
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Event Date" required icon={CalendarDays}>
                    <input
                      id="brief-event-date"
                      type="date"
                      required
                      value={form.eventDate as string}
                      onChange={(e) => set("eventDate", e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Performance Type" required icon={Music2}>
                    <select
                      id="brief-performance-type"
                      required
                      value={form.performanceType}
                      onChange={(e) => set("performanceType", e.target.value)}
                      className={cn(inputCls, "cursor-pointer")}
                    >
                      <option value="">Select type…</option>
                      {PERFORMANCE_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                {/* Row 4 — Categories (tag chips) */}
                <Field label="Event Categories" icon={Tag}>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {CATEGORY_OPTIONS.map((cat) => {
                      const selected = form.categories.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleCategory(cat)}
                          className={cn(
                            "rounded-full border px-3 py-1 text-[11px] font-extrabold transition",
                            selected
                              ? "border-[#E25C1D] bg-[#E25C1D] text-white"
                              : "border-stone-200 bg-white text-stone-600 hover:border-[#E25C1D] hover:text-[#E25C1D]"
                          )}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                {/* Row 5 — Professional Requirements */}
                <Field label="Professional Requirements" icon={ClipboardList}>
                  <textarea
                    id="brief-requirements"
                    rows={3}
                    placeholder="Describe what you need — skills, experience, special setups, or any specific artist preferences…"
                    value={form.professionalRequirements}
                    onChange={(e) => set("professionalRequirements", e.target.value)}
                    className={cn(
                      inputCls,
                      "h-auto resize-none py-2.5 leading-relaxed"
                    )}
                  />
                </Field>

                {/* Auth warning */}
                {!currentUser && (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-700">
                    ⚠️ You must be signed in to post a requirement.
                  </p>
                )}

                {/* Submit CTA */}
                <button
                  id="brief-submit-btn"
                  type="submit"
                  disabled={submitting || !currentUser}
                  className={cn(
                    "mt-1 flex h-11 w-full items-center justify-center gap-2",
                    "rounded-xl bg-[#E25C1D] text-[12px] font-black uppercase tracking-widest text-white",
                    "shadow-sm transition-all hover:bg-[#c94e17] hover:shadow-md",
                    (submitting || !currentUser) && "cursor-not-allowed opacity-60"
                  )}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    "Submit Requirement"
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
