import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays } from "lucide-react";
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

  return (
    <>
      <article
        data-slide-panel
        className="w-full rounded-[28px] border border-white/15 bg-black/30 p-6 text-white shadow-[0_25px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-500 hover:border-white/25 sm:p-8 relative overflow-hidden group"
      >
        <div data-slide-detail className="flex flex-wrap gap-3">
          <Link
            to="/artists"
            data-slide-cta
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 px-5 text-xs font-extrabold text-white shadow-[0_8px_22px_rgba(249,115,22,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_12px_28px_rgba(249,115,22,0.5)] active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {t("nav.exploreArtists")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            data-slide-cta
            onClick={() => setModalOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 text-xs font-extrabold text-white shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:border-white/40 hover:bg-white/20 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
          >
            {t("cta.artist.eventButton")}
            <CalendarDays className="h-3.5 w-3.5" />
          </button>
        </div>
      </article>

      <NewRequirementModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
