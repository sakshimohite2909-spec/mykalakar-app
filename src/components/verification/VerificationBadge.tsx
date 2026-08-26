import React, { useState } from "react";
import {
  VerificationTier,
  VERIFICATION_TIERS_CONFIG,
  getVerificationTier,
  getVerificationChecklist,
  calculateTrustScore,
  CHECKLIST_ITEMS,
} from "@/constants/verificationSystem";
import { ShieldCheck, CheckCircle2, XCircle, ChevronRight, X, Info, Star, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VerificationBadgeProps {
  artist?: Record<string, any> | null;
  tier?: VerificationTier;
  size?: "sm" | "md" | "lg" | "compact";
  interactive?: boolean;
  className?: string;
  showDetailsText?: boolean;
}

export function VerificationBadge({
  artist,
  tier: propTier,
  size = "md",
  interactive = true,
  className,
  showDetailsText = false,
}: VerificationBadgeProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const tier = propTier || getVerificationTier(artist);
  const config = VERIFICATION_TIERS_CONFIG[tier] || VERIFICATION_TIERS_CONFIG.basic;
  const IconComponent = config.icon;
  const checklist = getVerificationChecklist(artist);
  const trustScore = calculateTrustScore(artist);

  const handleClick = (e: React.MouseEvent) => {
    if (!interactive) return;
    e.preventDefault();
    e.stopPropagation();
    setModalOpen(true);
  };

  // Compact icon-only badge
  if (size === "compact") {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          title={`${config.name} — Click to view verification checklist`}
          className={cn(
            "inline-flex items-center justify-center rounded-full p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2",
            config.bgLight,
            config.textColor,
            config.ringColor,
            interactive ? "cursor-pointer" : "cursor-default",
            className
          )}
        >
          <IconComponent className="h-4 w-4 shrink-0" />
        </button>

        {interactive && (
          <VerificationModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            artist={artist}
            tier={tier}
            config={config}
            checklist={checklist}
            trustScore={trustScore}
          />
        )}
      </>
    );
  }

  // Small badge (for artist cards & search results)
  if (size === "sm") {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          className={cn(
            "group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold tracking-tight transition-all duration-200",
            config.bgLight,
            config.borderLight,
            config.textColor,
            interactive ? "hover:shadow-sm hover:scale-[1.02] cursor-pointer" : "cursor-default",
            className
          )}
        >
          <IconComponent className="h-3 w-3 shrink-0" />
          <span>{config.badgeLabel}</span>
          {interactive && (
            <Info className="h-2.5 w-2.5 opacity-40 group-hover:opacity-100 transition-opacity ml-0.5" />
          )}
        </button>

        {interactive && (
          <VerificationModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            artist={artist}
            tier={tier}
            config={config}
            checklist={checklist}
            trustScore={trustScore}
          />
        )}
      </>
    );
  }

  // Large badge (for hero headers on artist profile)
  if (size === "lg") {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          className={cn(
            "group inline-flex items-center gap-2 rounded-2xl border-2 px-3.5 py-1.5 text-xs font-black shadow-sm transition-all duration-200",
            config.bgLight,
            config.borderLight,
            config.textColor,
            interactive ? "hover:shadow-md hover:scale-[1.02] cursor-pointer" : "cursor-default",
            className
          )}
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-xs">
            <IconComponent className="h-3.5 w-3.5" />
          </div>
          <span className="tracking-wide uppercase text-[11px] font-black">{config.badgeLabel}</span>
          {interactive && (
            <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold shadow-xs group-hover:bg-white transition-colors">
              Trust Score {trustScore}% <ChevronRight className="h-3 w-3" />
            </span>
          )}
        </button>

        {interactive && (
          <VerificationModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            artist={artist}
            tier={tier}
            config={config}
            checklist={checklist}
            trustScore={trustScore}
          />
        )}
      </>
    );
  }

  // Default Medium badge
  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "group inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black transition-all duration-200",
          config.bgLight,
          config.borderLight,
          config.textColor,
          interactive ? "hover:shadow-sm hover:scale-[1.02] cursor-pointer" : "cursor-default",
          className
        )}
      >
        <IconComponent className="h-3.5 w-3.5 shrink-0" />
        <span>{config.badgeLabel}</span>
        {showDetailsText && (
          <span className="ml-1 text-[10px] opacity-75 font-medium underline underline-offset-2">View Checklist</span>
        )}
      </button>

      {interactive && (
        <VerificationModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          artist={artist}
          tier={tier}
          config={config}
          checklist={checklist}
          trustScore={trustScore}
        />
      )}
    </>
  );
}

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  artist?: Record<string, any> | null;
  tier: VerificationTier;
  config: (typeof VERIFICATION_TIERS_CONFIG)[VerificationTier];
  checklist: ReturnType<typeof getVerificationChecklist>;
  trustScore: number;
}

function VerificationModal({
  isOpen,
  onClose,
  artist,
  tier,
  config,
  checklist,
  trustScore,
}: VerificationModalProps) {
  const IconComponent = config.icon;
  const artistName = artist?.name || artist?.artistName || "Artist";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-0 rounded-3xl shadow-2xl bg-white">
        {/* Header Hero */}
        <div className={cn("p-6 text-stone-900 border-b", config.bgLight, config.borderLight)}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-md border border-white/60">
                <IconComponent className={cn("h-6 w-6", config.textColor)} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-lg text-stone-950">{config.name}</h3>
                  <Badge variant="outline" className={cn("font-bold text-[10px]", config.borderLight, config.textColor)}>
                    {trustScore}% Authenticity
                  </Badge>
                </div>
                <p className="text-xs text-stone-600 font-medium mt-0.5">
                  MyKalakar Verified Credentials for <strong className="text-stone-900">{artistName}</strong>
                </p>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-stone-700 font-medium bg-white/70 backdrop-blur-xs p-2.5 rounded-xl border border-white/60">
            {config.description}
          </p>
        </div>

        {/* Verification Checkpoints Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-wider text-stone-400 mb-2">
              Verified Checkpoints (7-Point Audit)
            </h4>
            <div className="space-y-2">
              {CHECKLIST_ITEMS.map((item) => {
                const isPassed = checklist[item.key];
                const ItemIcon = item.icon;

                return (
                  <div
                    key={item.key}
                    className={cn(
                      "flex items-start justify-between p-3 rounded-2xl border transition-colors",
                      isPassed
                        ? "bg-emerald-50/40 border-emerald-100"
                        : "bg-stone-50/60 border-stone-100 opacity-60"
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={cn(
                          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg shadow-2xs",
                          isPassed ? "bg-emerald-600 text-white" : "bg-stone-200 text-stone-500"
                        )}
                      >
                        <ItemIcon className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className={cn("text-xs font-extrabold", isPassed ? "text-stone-900" : "text-stone-500")}>
                          {item.label}
                        </p>
                        <p className="text-[11px] text-stone-500 font-medium">{item.desc}</p>
                      </div>
                    </div>

                    {isPassed ? (
                      <span className="shrink-0 flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                      </span>
                    ) : (
                      <span className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                        Pending
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Guarantee Banner */}
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3.5 flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-black text-amber-950">100% Escrow & Booking Protection</p>
              <p className="text-[11px] text-amber-800/90 font-medium leading-tight">
                All bookings made with verified artists are backed by MyKalakar's advance safety guarantee.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-100 flex justify-end">
          <Button onClick={onClose} size="sm" className="rounded-xl px-5 font-bold text-xs">
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
