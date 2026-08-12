import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Sparkles } from "lucide-react";
import type { HeroSlide } from "./sliderData";
import { useI18n } from "@/i18n/I18nProvider";
import NewRequirementModal from "@/components/NewRequirementModal";

type GlassSlidePanelProps = {
  slide?: HeroSlide;
  activeIndex?: number;
  slideCount?: number;
};

export function GlassSlidePanel({ slide, activeIndex, slideCount }: GlassSlidePanelProps) {
  const { t } = useI18n();
  const [modalOpen, setModalOpen] = useState(false);

  const headingText = slide?.heading || "";
  const words = headingText.trim().split(" ");
  const lastWord = words.length > 1 ? words.pop() : "";
  const remainingText = words.join(" ");

  return (
    <>
      <div
        data-slide-panel
        className="w-full space-y-4"
      >
        {/* Mobile Heading Block (Clean Frameless Overlay for Mobile View) */}
        {slide && (
          <div className="md:hidden space-y-2 pb-1">
            {/* 1. Category Eyebrow Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 text-[11px] font-bold tracking-wider uppercase backdrop-blur-md">
              <Sparkles className="h-3 w-3 text-orange-400" />
              <span>{slide.eyebrow}</span>
            </div>

            {/* 2. Headline: Line 1 (White Bold) & Line 2 (Orange Italic) */}
            <h2 className="text-[clamp(1.4rem,6.5vw,2.2rem)] font-extrabold leading-[0.98] tracking-tight uppercase">
              <span className="block text-white font-extrabold">{remainingText}</span>
              {lastWord && (
                <span className="block italic font-black text-orange-500 tracking-[0.05em] mt-0.5">
                  {lastWord}
                </span>
              )}
            </h2>
          </div>
        )}

        {/* CTA Buttons */}
        <div data-slide-detail className="flex flex-col sm:flex-row gap-3 pt-1">
          <Link
            to="/artists"
            data-slide-cta
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 px-5 text-xs font-extrabold text-white shadow-[0_8px_22px_rgba(249,115,22,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-orange-500 w-full sm:w-auto"
          >
            {t("nav.exploreArtists")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            data-slide-cta
            onClick={() => setModalOpen(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 text-xs font-extrabold text-white shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:border-white/40 hover:bg-white/20 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer w-full sm:w-auto"
          >
            {t("cta.artist.eventButton")}
            <CalendarDays className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <NewRequirementModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
