import type { HeroSlide } from "./sliderData";

type SliderBackgroundProps = {
  slides: HeroSlide[];
  activeIndex: number;
};

// Slide mood color grading filters
const MOOD_FILTERS: Record<number, { active: string; inactive: string }> = {
  1: {
    // Platform Spotlight
    active: "brightness(1.08) contrast(1.08) saturate(1.12)",
    inactive: "brightness(1.00) contrast(1.02) saturate(1.04)",
  },
  2: {
    // Folk Energy (Warm energetic gold)
    active: "brightness(1.09) contrast(1.07) saturate(1.16) sepia(0.08)",
    inactive: "brightness(1.01) contrast(1.02) saturate(1.06)",
  },
  3: {
    // Classical Excellence (Soulful warm gold)
    active: "brightness(1.07) contrast(1.09) saturate(1.10) sepia(0.06)",
    inactive: "brightness(0.99) contrast(1.03) saturate(1.04)",
  },
  4: {
    // Heritage Strings (Deep acoustic warmth)
    active: "brightness(1.08) contrast(1.08) saturate(1.14)",
    inactive: "brightness(1.00) contrast(1.02) saturate(1.05)",
  },
  5: {
    // Cultural Processions (Vibrant festive)
    active: "brightness(1.10) contrast(1.06) saturate(1.18)",
    inactive: "brightness(1.01) contrast(1.02) saturate(1.08)",
  },
};

export function SliderBackground({ slides, activeIndex }: SliderBackgroundProps) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0f0b07]" aria-hidden="true">
      {/* Slide Track Wrapper */}
      <div
        data-slider-track
        data-slide-count={slides.length}
        className="flex h-full transition-none"
        style={{
          width: `${slides.length * 100}%`,
        }}
      >
        {slides.map((slide, index) => {
          const isActive = index === activeIndex;
          const mood = MOOD_FILTERS[slide.id] || MOOD_FILTERS[1];
          const filterValue = isActive ? mood.active : mood.inactive;

          return (
            <div
              key={slide.id}
              className="h-full relative overflow-hidden"
              style={{
                width: `${100 / slides.length}%`,
              }}
            >
              <img
                src={slide.image}
                alt=""
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-[5000ms] ease-out"
                style={{
                  objectPosition: slide.objectPosition,
                  imageRendering: "auto",
                  filter: filterValue,
                  transform: isActive ? "scale(1.05)" : "scale(1.0)",
                  transitionProperty: "transform, filter",
                  transitionTimingFunction: "cubic-bezier(0.25, 1, 0.5, 1)",
                  willChange: "transform, filter",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Layer 1: Left Directional Gradient Overlay (Darker behind heading, clear on right) */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            "linear-gradient(90deg, rgba(15,11,7,0.76) 0%, rgba(15,11,7,0.52) 40%, rgba(15,11,7,0.18) 75%, rgba(15,11,7,0.04) 100%)",
        }}
      />

      {/* Layer 2: Warm Ambient Glow Highlight (MyKalakar signature warmth) */}
      <div
        className="absolute inset-0 pointer-events-none z-10 opacity-70 transition-opacity duration-1000"
        style={{
          background: "radial-gradient(circle at 18% 45%, rgba(249,115,22,0.12) 0%, transparent 60%)",
        }}
      />

      {/* Layer 3: Transition Sweep Curtain Element */}
      <div
        data-slider-sweep
        className="absolute inset-0 pointer-events-none z-15 bg-gradient-to-r from-orange-600/10 via-amber-500/15 to-transparent opacity-0 translate-x-[-100%]"
      />

      {/* Layer 4: Subtle Top & Bottom Vignettes for Edge Protection */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/35 via-black/10 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/40 to-transparent pointer-events-none z-10" />
    </div>
  );
}
