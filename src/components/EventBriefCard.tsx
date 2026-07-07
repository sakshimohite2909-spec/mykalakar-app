/**
 * EventBriefCard.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 5 — Premium reusable Event Brief card component.
 *
 * Renders a single approved event brief with:
 *  • Pearl-white translucent glass canvas
 *  • Brand-orange (#E25C1D) budget accent & top stripe
 *  • Category pill badges in a flex-wrap row
 *  • Smooth entrance animation via framer-motion
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { motion } from "framer-motion";
import {
  CalendarDays,
  MapPin,
  IndianRupee,
  Music2,
  Tag,
  ClipboardList,
  Zap,
} from "lucide-react";
import type { ApprovedEventBrief } from "@/hooks/useApprovedBriefs";
import type { Timestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTs(ts: Timestamp | null): string {
  if (!ts) return "—";
  return new Date(ts.seconds * 1000).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatBudget(amount: number): string {
  if (!amount || amount <= 0) return "On Request";
  return `₹${amount.toLocaleString("en-IN")}`;
}

// ── Card skeleton (reusable) ──────────────────────────────────────────────────

export function EventBriefCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-stone-100 bg-white/90 p-5 shadow-sm">
      {/* Top stripe */}
      <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-stone-100 animate-pulse" />
      <div className="mt-2 space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-orange-50 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded-full bg-stone-100 animate-pulse" />
            <div className="h-3 w-1/3 rounded-full bg-orange-50 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-3 w-full rounded-full bg-stone-50 animate-pulse" />
          ))}
        </div>
        <div className="flex gap-1.5">
          <div className="h-5 w-16 rounded-full bg-orange-50 animate-pulse" />
          <div className="h-5 w-20 rounded-full bg-stone-50 animate-pulse" />
          <div className="h-5 w-14 rounded-full bg-orange-50 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// ── Main Card Component ───────────────────────────────────────────────────────

interface EventBriefCardProps {
  brief: ApprovedEventBrief;
  index?: number;
}

export default function EventBriefCard({ brief, index = 0 }: EventBriefCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{
        duration: 0.38,
        delay: index * 0.055,
        ease: [0.22, 1, 0.36, 1],
      }}
      layout
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl",
        "border border-stone-100 bg-white/90 shadow-sm backdrop-blur-sm",
        "transition-all duration-300 hover:shadow-md hover:border-orange-200",
        "hover:-translate-y-0.5"
      )}
    >
      {/* Brand-orange top stripe */}
      <div className="h-[3px] w-full bg-gradient-to-r from-[#E25C1D] via-orange-400 to-orange-200 rounded-t-2xl" />

      <div className="flex flex-col gap-4 p-5">
        {/* Header — Event name + Live badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 min-w-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 mt-0.5">
              <Zap className="h-5 w-5 text-[#E25C1D]" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-black leading-snug text-stone-950 line-clamp-2">
                {brief.eventName}
              </h3>
              <p className="mt-0.5 text-[10px] font-extrabold uppercase tracking-widest text-[#E25C1D]">
                Live Requirement
              </p>
            </div>
          </div>

          {/* Budget — prominent accent */}
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-stone-400">
              Budget
            </p>
            <p className="text-base font-black text-[#E25C1D] leading-tight">
              {formatBudget(brief.totalBudget)}
            </p>
          </div>
        </div>

        {/* Detail pills row */}
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
          {[
            { icon: MapPin, value: brief.location },
            { icon: CalendarDays, value: formatTs(brief.eventDate) },
            { icon: Music2, value: brief.performanceType },
          ]
            .filter((item) => item.value && item.value !== "—")
            .map(({ icon: Icon, value }) => (
              <li
                key={value}
                className="flex items-center gap-1 text-xs font-semibold text-stone-600"
              >
                <Icon className="h-3.5 w-3.5 text-[#E25C1D] shrink-0" />
                <span className="truncate max-w-[140px]">{value}</span>
              </li>
            ))}
        </ul>

        {/* Category badges */}
        {brief.categories?.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Tag className="h-3 w-3 text-stone-400 shrink-0" />
            {brief.categories.slice(0, 5).map((cat) => (
              <span
                key={cat}
                className={cn(
                  "rounded-full border border-orange-100 bg-orange-50",
                  "px-2.5 py-0.5 text-[10px] font-extrabold text-[#E25C1D]",
                  "transition-colors group-hover:bg-orange-100"
                )}
              >
                {cat}
              </span>
            ))}
            {brief.categories.length > 5 && (
              <span className="rounded-full border border-stone-100 bg-stone-50 px-2.5 py-0.5 text-[10px] font-extrabold text-stone-400">
                +{brief.categories.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Professional requirements — truncated */}
        {brief.professionalRequirements && (
          <div className="rounded-xl border border-stone-50 bg-stone-50/70 px-3 py-2">
            <div className="flex items-center gap-1.5 mb-1">
              <ClipboardList className="h-3 w-3 text-stone-400" />
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">
                Requirements
              </p>
            </div>
            <p className="text-xs font-semibold leading-relaxed text-stone-600 line-clamp-2">
              {brief.professionalRequirements}
            </p>
          </div>
        )}

        {/* Footer — Posted date */}
        <p className="text-[10px] font-bold text-stone-300 mt-auto pt-1 border-t border-stone-50">
          Posted {formatTs(brief.createdAt)}
        </p>
      </div>
    </motion.article>
  );
}
