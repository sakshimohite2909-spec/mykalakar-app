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
import { createPortal } from "react-dom";
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
  ChevronDown,
  Image as ImageIcon,
} from "lucide-react";
import { submitEventBrief, type EventBriefFormData } from "@/services/eventBriefService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nProvider";
import { getArtLabel } from "@/lib/artLabels";

// ── Constants ─────────────────────────────────────────────────────────────────

const PERFORMANCE_TYPES = [
  "Singer",
  "Live Music",
  "DJ",
  "Dance Performance",
  "Stand-up Comedy",
  "Anchor / Host",
  "Classical Music",
  "Cultural Art",
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
  "Cultural Art",
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
  imageUrl: "",
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
      <label className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-stone-700">
        {Icon && <Icon className="h-3.5 w-3.5 text-[#E25C1D]" />}
        {label}
        {required && <span className="text-[#E25C1D] font-bold">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = cn(
  "h-11 w-full rounded-xl border border-stone-200/90 bg-stone-50/60 px-3.5",
  "text-sm font-medium text-stone-900 placeholder:font-normal placeholder:text-stone-400",
  "outline-none transition-all duration-200 focus:bg-white focus:border-[#E25C1D] focus:ring-4 focus:ring-[#E25C1D]/15"
);

// ── Main Component ────────────────────────────────────────────────────────────

interface NewRequirementModalProps {
  open: boolean;
  onClose: () => void;
}

export default function NewRequirementModal({ open, onClose }: NewRequirementModalProps) {
  const { currentUser } = useAuth();
  const { t } = useI18n();
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
        title: "Requirement Published! 🎉",
        description:
          "Your event brief is now live on the platform feed.",
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
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 pt-16 sm:p-6 sm:pt-20 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "relative z-[101] w-full max-w-xl max-h-[calc(100vh-5rem)] flex flex-col my-auto",
              "rounded-2xl sm:rounded-3xl border border-stone-200/90 bg-white shadow-2xl overflow-hidden"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header (Sticky) */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-stone-100 flex-shrink-0">
              {/* Orange accent bar */}
              <div className="h-1.5 w-full bg-gradient-to-r from-[#E25C1D] via-orange-400 to-amber-400" />
              
              <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-orange-50 border border-orange-100 text-[#E25C1D]">
                    <FileText className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                  </span>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-stone-900 tracking-tight">
                      {t("events.createTitle") || "Post a New Requirement"}
                    </h2>
                    <p className="text-[11px] sm:text-xs font-medium text-stone-500">
                      {t("events.createSubtitle") || "Describe your event — we'll match the best artists."}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Close modal"
                  onClick={handleClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 text-stone-400 transition-all hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-5">
              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center gap-4 py-12 text-center"
                >
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100">
                    <CheckCircle2 className="h-9 w-9 text-emerald-500" />
                  </span>
                  <h3 className="text-xl font-bold text-stone-900">
                    {t("event.applySuccessTitle") || "Requirement Published!"}
                  </h3>
                  <p className="max-w-xs text-sm font-medium text-stone-500">
                    {t("event.applySuccessText") || "Your event brief is now live! Artists can view and apply for your event opportunity."}
                  </p>
                </motion.div>
              ) : (
                /* Form */
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  {/* Row 1 — Event Name */}
                  <Field label={t("event.detailsTitle") || "Event Name"} required icon={FileText}>
                    <input
                      id="brief-event-name"
                      type="text"
                      required
                      placeholder={t("event.namePlaceholder") || "e.g. Cultural Folk Performance Event"}
                      value={form.eventName}
                      onChange={(e) => set("eventName", e.target.value)}
                      className={inputCls}
                    />
                  </Field>

                  {/* Row 1.5 — Event Cover Photo URL */}
                  <Field label={t("event.bannerPhotoUrl") || "Event Banner / Photo URL (Optional)"} icon={ImageIcon}>
                    <input
                      id="brief-event-image"
                      type="url"
                      placeholder="e.g. https://images.unsplash.com/... (Image URL for Event Banner)"
                      value={form.imageUrl || ""}
                      onChange={(e) => set("imageUrl", e.target.value)}
                      className={inputCls}
                    />
                  </Field>

                  {/* Row 2 — Budget + Location */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label={t("event.budget") || "Total Budget (₹)"} required icon={IndianRupee}>
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
                    <Field label={t("event.location") || "Location / City"} required icon={MapPin}>
                      <input
                        id="brief-location"
                        type="text"
                        required
                        placeholder={t("event.locationPlaceholder") || "e.g. Pune, Maharashtra"}
                        value={form.location}
                        onChange={(e) => set("location", e.target.value)}
                        className={inputCls}
                      />
                    </Field>
                  </div>

                  {/* Row 3 — Event Date + Performance Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label={t("event.date") || "Event Date"} required icon={CalendarDays}>
                      <input
                        id="brief-event-date"
                        type="date"
                        required
                        value={form.eventDate as string}
                        onChange={(e) => set("eventDate", e.target.value)}
                        className={cn(inputCls, "cursor-pointer")}
                      />
                    </Field>
                    <Field label={t("event.performanceType") || "Performance Type"} required icon={Music2}>
                      <div className="relative">
                        <select
                          id="brief-performance-type"
                          required
                          value={form.performanceType}
                          onChange={(e) => set("performanceType", e.target.value)}
                          className={cn(inputCls, "appearance-none pr-9 cursor-pointer")}
                        >
                          <option value="" disabled className="text-stone-400">
                            {t("booking.selectPerformanceType") || "Select type…"}
                          </option>
                          {PERFORMANCE_TYPES.map((pType) => (
                            <option key={pType} value={pType} className="text-stone-900 font-medium">
                              {getArtLabel(t, pType)}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                      </div>
                    </Field>
                  </div>

                  {/* Row 4 — Categories (tag chips) */}
                  <Field label={t("nav.categories") || "Event Categories"} icon={Tag}>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {CATEGORY_OPTIONS.map((cat) => {
                        const selected = form.categories.includes(cat);
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => toggleCategory(cat)}
                            className={cn(
                              "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer",
                              selected
                                ? "border-[#E25C1D] bg-[#E25C1D] text-white shadow-xs"
                                : "border-stone-200 bg-stone-50/80 text-stone-600 hover:border-orange-300 hover:bg-orange-50/50 hover:text-[#E25C1D]"
                            )}
                          >
                            {getArtLabel(t, cat)}
                          </button>
                        );
                      })}
                    </div>
                  </Field>

                  {/* Row 5 — Professional Requirements */}
                  <Field label={t("event.requirements") || "Professional Requirements"} icon={ClipboardList}>
                    <textarea
                      id="brief-requirements"
                      rows={3}
                      placeholder={t("event.requirementsPlaceholder") || "Describe what you need — skills, experience, special setups, or any specific artist preferences…"}
                      value={form.professionalRequirements}
                      onChange={(e) => set("professionalRequirements", e.target.value)}
                      className={cn(
                        inputCls,
                        "h-auto resize-none py-3 leading-relaxed"
                      )}
                    />
                  </Field>

                  {/* Auth warning */}
                  {!currentUser && (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-700">
                      ⚠️ {t("booking.loginRequiredText") || "You must be signed in to post a requirement."}
                    </p>
                  )}

                  {/* Submit CTA */}
                  <button
                    id="brief-submit-btn"
                    type="submit"
                    disabled={submitting || !currentUser}
                    className={cn(
                      "mt-2 flex h-12 w-full items-center justify-center gap-2 cursor-pointer",
                      "rounded-xl bg-[#E25C1D] text-xs font-bold uppercase tracking-wider text-white",
                      "shadow-md transition-all duration-200 hover:bg-[#c94e17] hover:shadow-lg active:scale-[0.99]",
                      (submitting || !currentUser) && "cursor-not-allowed opacity-60 hover:bg-[#E25C1D] hover:shadow-md"
                    )}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("booking.sending") || "Submitting…"}
                      </>
                    ) : (
                      t("events.postEvent") || "Submit Requirement"
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

