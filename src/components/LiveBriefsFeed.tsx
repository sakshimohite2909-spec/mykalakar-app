/**
 * LiveBriefsFeed.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 5 — Public-facing live feed of approved event briefs.
 *
 * Pipeline:
 *  useApprovedBriefs() → real-time onSnapshot (status == "approved", DESC)
 *  ├─ loading  → Glassmorphic skeleton grid
 *  ├─ error    → Animated error boundary card
 *  └─ success  → AnimatePresence grid of EventBriefCard components
 *
 * Zero hard reloads — the Firestore listener pushes diffs directly into React
 * state, so any admin approval appears instantly in the feed.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Radio, Inbox } from "lucide-react";
import { useApprovedBriefs } from "@/hooks/useApprovedBriefs";
import EventBriefCard, { EventBriefCardSkeleton } from "@/components/EventBriefCard";

// ── Skeleton grid ─────────────────────────────────────────────────────────────

function BriefsFeedSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <EventBriefCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ── Error state ───────────────────────────────────────────────────────────────

function BriefsFeedError({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/60 px-6 py-14 text-center"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100">
        <AlertTriangle className="h-7 w-7 text-red-500" />
      </span>
      <h3 className="mt-4 text-base font-black text-stone-800">
        Feed unavailable
      </h3>
      <p className="mt-2 max-w-xs text-sm font-semibold text-stone-500">
        {message}
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-5 inline-flex h-9 items-center gap-2 rounded-full border border-red-200 bg-white px-4 text-xs font-extrabold text-red-600 transition hover:bg-red-50"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Retry
      </button>
    </motion.div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function BriefsFeedEmpty() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-orange-200 bg-orange-50/30 px-6 py-16 text-center"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100">
        <Inbox className="h-7 w-7 text-[#E25C1D]" />
      </span>
      <h3 className="mt-4 text-base font-black text-stone-800">
        No approved briefs yet
      </h3>
      <p className="mt-2 max-w-xs text-sm font-semibold text-stone-500">
        Be the first to post a requirement — hit "Create Brief" above and our
        team will review it within 24 hours.
      </p>
    </motion.div>
  );
}

// ── Live indicator ────────────────────────────────────────────────────────────

function LiveIndicator({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E25C1D] opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#E25C1D]" />
      </span>
      <span className="text-[11px] font-extrabold uppercase tracking-widest text-stone-500">
        <Radio className="inline h-3 w-3 mr-1 text-[#E25C1D]" />
        {count} Live {count === 1 ? "Requirement" : "Requirements"}
      </span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface LiveBriefsFeedProps {
  /** Optional className for the outermost wrapper */
  className?: string;
}

export default function LiveBriefsFeed({ className }: LiveBriefsFeedProps) {
  const state = useApprovedBriefs();

  return (
    <section className={className}>
      {/* Section header */}
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#E25C1D]">
            Phase 5 · Real-time Feed
          </p>
          <h2 className="mt-1 text-2xl font-extrabold text-stone-950 md:text-[30px]">
            Live Event Requirements
          </h2>
          <p className="mt-1 text-sm font-semibold text-stone-500">
            Browse approved briefs — updated instantly as new ones are approved.
          </p>
        </div>

        {state.status === "success" && state.briefs.length > 0 && (
          <LiveIndicator count={state.briefs.length} />
        )}
      </div>

      {/* States */}
      {state.status === "loading" && <BriefsFeedSkeleton />}

      {state.status === "error" && <BriefsFeedError message={state.message} />}

      {state.status === "success" && state.briefs.length === 0 && (
        <BriefsFeedEmpty />
      )}

      {state.status === "success" && state.briefs.length > 0 && (
        <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {state.briefs.map((brief, i) => (
              <EventBriefCard key={brief.id} brief={brief} index={i} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </section>
  );
}
