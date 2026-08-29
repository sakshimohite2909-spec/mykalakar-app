import React, { useState } from "react";
import {
  getVerificationTier,
  getVerificationChecklist,
  calculateTrustScore,
  CHECKLIST_ITEMS,
} from "@/constants/verificationSystem";
import { ShieldCheck, CheckCircle2, Lock, Award, ChevronDown, ChevronUp } from "lucide-react";
import { VerificationBadge } from "@/components/verification/VerificationBadge";
import { cn } from "@/lib/utils";

interface TrustBreakdownCardProps {
  artist: Record<string, any>;
  className?: string;
}

export function TrustBreakdownCard({ artist, className }: TrustBreakdownCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const tier = getVerificationTier(artist);
  const checklist = getVerificationChecklist(artist);
  const trustScore = calculateTrustScore(artist);

  const passedCount = Object.values(checklist).filter(Boolean).length;
  const totalCount = Object.keys(checklist).length;

  return (
    <div
      className={cn(
        "rounded-2xl border border-emerald-100 bg-white p-3.5 sm:p-4 shadow-xs transition-shadow hover:shadow-sm",
        className
      )}
    >
      {/* Top Compact Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-stone-900 truncate">Verified Artist</span>
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md shrink-0">
                {trustScore}%
              </span>
            </div>
            <p className="text-[10px] font-medium text-stone-500">
              {passedCount}/{totalCount} Checkpoints Passed
            </p>
          </div>
        </div>
        <VerificationBadge artist={artist} tier={tier} size="sm" />
      </div>

      {/* Mini Progress Bar */}
      <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden mt-2.5">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${trustScore}%` }}
        />
      </div>

      {/* Quick compact chips */}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {CHECKLIST_ITEMS.map((item) => {
          const isPassed = checklist[item.key];
          if (!isPassed && !isExpanded) return null;
          return (
            <span
              key={item.key}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors",
                isPassed
                  ? "bg-emerald-50/70 border-emerald-200/80 text-emerald-800"
                  : "bg-stone-50 border-stone-200 text-stone-400"
              )}
            >
              {isPassed ? (
                <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600 shrink-0" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-stone-300 shrink-0" />
              )}
              <span>{item.label.split("/")[0].trim()}</span>
            </span>
          );
        })}
      </div>

      {/* Optional expand toggle */}
      {totalCount > passedCount && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 flex items-center gap-1 text-[10px] font-bold text-stone-400 hover:text-emerald-700 cursor-pointer"
        >
          {isExpanded ? (
            <>
              Hide details <ChevronUp className="h-3 w-3" />
            </>
          ) : (
            <>
              +{totalCount - passedCount} more checks <ChevronDown className="h-3 w-3" />
            </>
          )}
        </button>
      )}

      {/* Micro footer guarantee line */}
      <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-[10px] font-semibold text-stone-500">
        <span className="flex items-center gap-1">
          <Lock className="h-3 w-3 text-orange-500" /> Escrow Protected
        </span>
        <span className="text-stone-300">•</span>
        <span className="flex items-center gap-1">
          <Award className="h-3 w-3 text-purple-600" /> Authentic Talent
        </span>
      </div>
    </div>
  );
}

