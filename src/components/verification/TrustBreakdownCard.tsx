import React from "react";
import {
  VerificationTier,
  VERIFICATION_TIERS_CONFIG,
  getVerificationTier,
  getVerificationChecklist,
  calculateTrustScore,
  CHECKLIST_ITEMS,
} from "@/constants/verificationSystem";
import { ShieldCheck, CheckCircle2, Lock, Award, Sparkles, Star, ChevronRight } from "lucide-react";
import { VerificationBadge } from "@/components/verification/VerificationBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TrustBreakdownCardProps {
  artist: Record<string, any>;
  className?: string;
}

export function TrustBreakdownCard({ artist, className }: TrustBreakdownCardProps) {
  const tier = getVerificationTier(artist);
  const config = VERIFICATION_TIERS_CONFIG[tier] || VERIFICATION_TIERS_CONFIG.basic;
  const checklist = getVerificationChecklist(artist);
  const trustScore = calculateTrustScore(artist);

  const passedCount = Object.values(checklist).filter(Boolean).length;
  const totalCount = Object.keys(checklist).length;

  return (
    <Card className={cn("overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-sm hover:shadow-md transition-shadow", className)}>
      {/* Header Banner */}
      <div className={cn("p-5 border-b relative overflow-hidden", config.bgLight, config.borderLight)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-xs border border-white/80">
              <ShieldCheck className={cn("h-5 w-5", config.textColor)} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-stone-500">MyKalakar Assurance</span>
              <h3 className="font-extrabold text-base text-stone-950 leading-tight">Verified Artist Guarantee</h3>
            </div>
          </div>
          <VerificationBadge artist={artist} tier={tier} size="sm" />
        </div>

        {/* Trust score meter */}
        <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-stone-900">Trust Score</span>
            <Badge variant="outline" className="bg-white/80 font-black text-xs text-stone-900 border-stone-200">
              {trustScore}% Verified
            </Badge>
          </div>
          <span className="text-[11px] font-bold text-stone-600">
            {passedCount} of {totalCount} Checkpoints Passed
          </span>
        </div>

        {/* Mini progress bar */}
        <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden mt-2">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-purple-500 to-amber-500 rounded-full transition-all duration-500"
            style={{ width: `${trustScore}%` }}
          />
        </div>
      </div>

      {/* Checkpoints Grid */}
      <CardContent className="p-5 space-y-3">
        <p className="text-[11px] font-black uppercase tracking-wider text-stone-400">
          Verification Breakdown
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CHECKLIST_ITEMS.map((item) => {
            const isPassed = checklist[item.key];
            const ItemIcon = item.icon;

            return (
              <div
                key={item.key}
                className={cn(
                  "flex items-center justify-between p-2.5 rounded-xl border text-xs transition-colors",
                  isPassed
                    ? "bg-emerald-50/30 border-emerald-100 text-stone-900 font-semibold"
                    : "bg-stone-50/50 border-stone-100 text-stone-400 font-normal"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ItemIcon className={cn("h-3.5 w-3.5 shrink-0", isPassed ? "text-emerald-600" : "text-stone-400")} />
                  <span className="truncate">{item.label}</span>
                </div>
                {isPassed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <span className="text-[10px] text-stone-400 shrink-0">Pending</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Trust Badges footer */}
        <div className="mt-4 pt-3 border-t border-stone-100 grid grid-cols-2 gap-3 text-center">
          <div className="p-2.5 rounded-2xl bg-stone-50 border border-stone-100">
            <Lock className="h-4 w-4 text-orange-600 mx-auto mb-1" />
            <p className="text-[11px] font-black text-stone-900 leading-tight">Escrow Protected</p>
            <p className="text-[10px] text-stone-500 font-medium mt-0.5">Pay only on confirmation</p>
          </div>
          <div className="p-2.5 rounded-2xl bg-stone-50 border border-stone-100">
            <Award className="h-4 w-4 text-purple-600 mx-auto mb-1" />
            <p className="text-[11px] font-black text-stone-900 leading-tight">Authentic Talent</p>
            <p className="text-[10px] text-stone-500 font-medium mt-0.5">Direct artist pricing</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
