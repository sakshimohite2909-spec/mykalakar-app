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
        className="w-full rounded-[28px] border border-white/10 bg-black/35 p-6 text-white shadow-[0_25px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-500 hover:border-white/15 sm:p-8 relative overflow-hidden group"
      >
        <div data-slide-detail className="flex flex-wrap gap-3">
          <Link
            to="/artists"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-orange-600 px-5 text-xs font-extrabold text-white shadow-md shadow-orange-600/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-orange-700 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-orange-600"
          >
            {t("nav.exploreArtists")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 text-xs font-extrabold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/10 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
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
