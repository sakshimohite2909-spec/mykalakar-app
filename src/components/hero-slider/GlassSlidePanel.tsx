import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Sparkles } from "lucide-react";
import type { HeroSlide } from "./sliderData";
import { useI18n } from "@/i18n/I18nProvider";
import { Equalizer } from "./MyKalakarHeroSlider";

type GlassSlidePanelProps = {
  slide: HeroSlide;
  activeIndex: number;
  slideCount: number;
};

export function GlassSlidePanel({ slide, activeIndex, slideCount }: GlassSlidePanelProps) {
  const { t } = useI18n();

  return (
    <article
      data-slide-panel
      className="w-full rounded-3xl border border-white/50 bg-white/60 p-6 text-stone-950 shadow-[0_25px_60px_rgba(249,115,22,0.08)] backdrop-blur-xl transition-all duration-500 hover:shadow-[0_30px_70px_rgba(249,115,22,0.14)] sm:p-8 relative overflow-hidden group"
    >
      <div data-slide-detail className="flex items-center justify-between gap-3">
        <span className="inline-flex min-w-0 items-center gap-2 rounded-full border border-orange-200/80 bg-white/90 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-orange-750 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
          </span>
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-orange-600 animate-pulse" />
          <span className="truncate">{t(`hero.slide${slide.id}.eyebrow`, { defaultValue: slide.eyebrow })}</span>
        </span>
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-[11px] font-extrabold text-stone-500">
            {String(activeIndex + 1).padStart(2, "0")} / {String(slideCount).padStart(2, "0")}
          </span>
          <Equalizer />
        </div>
      </div>

      <h1 data-slide-detail className="mt-5 text-2xl font-black leading-[1.08] tracking-tight bg-gradient-to-r from-stone-950 via-orange-600 to-amber-600 bg-clip-text text-transparent sm:text-3xl md:text-3xl lg:text-4xl xl:text-[42px]">
        {t(`hero.slide${slide.id}.title`, { defaultValue: slide.heading })}
      </h1>

      <p data-slide-detail className="mt-4 max-w-xl text-stone-700 text-xs font-semibold leading-5 sm:text-sm sm:leading-6">
        {t(`hero.slide${slide.id}.text`, { defaultValue: slide.subheading })}
      </p>

      <div data-slide-detail className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/artists"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-stone-900 px-5 text-xs font-extrabold text-white shadow-md shadow-stone-900/10 transition-all duration-300 hover:-translate-y-0.5 hover:from-orange-600 hover:to-amber-500 hover:bg-gradient-to-r hover:shadow-lg hover:shadow-orange-500/20 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          {t("nav.exploreArtists")}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link
          to="/events"
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-stone-250 bg-white/80 px-5 text-xs font-extrabold text-stone-850 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50/20 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          {t("cta.artist.eventButton")}
          <CalendarDays className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
