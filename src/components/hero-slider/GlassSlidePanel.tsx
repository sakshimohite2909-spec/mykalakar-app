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

  const titleText = t(`hero.slide${slide.id}.title`, { defaultValue: slide.heading });

  const formatTitle = (text: string) => {
    if (text.includes(".")) {
      const parts = text.split(".");
      const firstPart = parts[0].trim();
      const restPart = parts.slice(1).join(".").trim();
      return (
        <>
          {firstPart}. <span className="text-orange-500">{restPart}</span>
        </>
      );
    }
    
    const words = text.split(" ");
    if (words.length <= 1) return text;
    
    let splitIndex = 1;
    if (text.startsWith("India's No. 1")) {
      splitIndex = 3;
    } else if (text.startsWith("Echoes of")) {
      splitIndex = 2;
    }
    
    const firstPart = words.slice(0, splitIndex).join(" ");
    const restPart = words.slice(splitIndex).join(" ");
    return (
      <>
        {firstPart} <span className="text-orange-500">{restPart}</span>
      </>
    );
  };

  return (
    <article
      data-slide-panel
      className="w-full rounded-[28px] border border-white/10 bg-black/35 p-6 text-white shadow-[0_25px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-500 hover:border-white/15 sm:p-8 relative overflow-hidden group"
    >
      <div data-slide-detail className="flex items-center justify-between gap-3">
        <span className="inline-flex min-w-0 items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
          </span>
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-orange-500 animate-pulse" />
          <span className="truncate">{t(`hero.slide${slide.id}.eyebrow`, { defaultValue: slide.eyebrow })}</span>
        </span>
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-[11px] font-extrabold text-white/50">
            {String(activeIndex + 1).padStart(2, "0")} / {String(slideCount).padStart(2, "0")}
          </span>
          <Equalizer />
        </div>
      </div>

      <h1 data-slide-detail className="mt-5 text-2xl font-black leading-[1.08] tracking-tight text-white sm:text-3xl md:text-3xl lg:text-4xl xl:text-[42px]">
        {formatTitle(titleText)}
      </h1>

      <p data-slide-detail className="mt-4 max-w-xl text-stone-300 text-xs font-medium leading-5 sm:text-sm sm:leading-6">
        {t(`hero.slide${slide.id}.text`, { defaultValue: slide.subheading })}
      </p>

      <div data-slide-detail className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/artists"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-orange-600 px-5 text-xs font-extrabold text-white shadow-md shadow-orange-600/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-orange-700 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-orange-600"
        >
          {t("nav.exploreArtists")}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link
          to="/events"
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 text-xs font-extrabold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/10 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          {t("cta.artist.eventButton")}
          <CalendarDays className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
