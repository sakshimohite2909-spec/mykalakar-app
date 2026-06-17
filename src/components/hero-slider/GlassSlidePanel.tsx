import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Sparkles } from "lucide-react";
import type { HeroSlide } from "./sliderData";

type GlassSlidePanelProps = {
  slide: HeroSlide;
  activeIndex: number;
  slideCount: number;
};

export function GlassSlidePanel({ slide, activeIndex, slideCount }: GlassSlidePanelProps) {
  return (
    <article
      data-slide-panel
      className="w-full rounded-2xl border border-white/85 bg-white/75 p-6 text-stone-950 shadow-[0_20px_50px_rgba(0,0,0,0.05)] backdrop-blur-md supports-[backdrop-filter]:bg-white/68 sm:p-8"
    >
      <div data-slide-detail className="flex items-center justify-between gap-3">
        <span className="inline-flex min-w-0 items-center gap-2 rounded-full border border-orange-200/80 bg-white/85 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-orange-700 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{slide.eyebrow}</span>
        </span>
        <span className="shrink-0 text-[11px] font-extrabold text-stone-500">
          {String(activeIndex + 1).padStart(2, "0")} / {String(slideCount).padStart(2, "0")}
        </span>
      </div>

      <h1 data-slide-detail className="mt-5 text-2xl font-black leading-[1.08] tracking-tight text-stone-900 sm:text-3xl md:text-3xl lg:text-4xl xl:text-[42px]">
        {slide.heading}
      </h1>

      <p data-slide-detail className="mt-4 max-w-xl text-stone-700 text-xs font-semibold leading-5 sm:text-sm sm:leading-6">
        {slide.subheading}
      </p>

      <div data-slide-detail className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/artists"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-stone-900 px-4 text-xs font-extrabold text-white shadow-md shadow-stone-900/10 transition hover:-translate-y-0.5 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 active:translate-y-0"
        >
          Explore Artists
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link
          to="/events"
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-stone-300/80 bg-white/70 px-4 text-xs font-extrabold text-stone-850 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-350 hover:text-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 active:translate-y-0"
        >
          Post an Event
          <CalendarDays className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
