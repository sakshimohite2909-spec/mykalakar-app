import type { HeroSlide } from "./sliderData";

type SliderBackgroundProps = {
  slides: HeroSlide[];
  activeIndex: number;
};

export function SliderBackground({ slides, activeIndex }: SliderBackgroundProps) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0f0b07]" aria-hidden="true">
      {/* Slide track wrapper */}
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
                className="h-full w-full object-cover transition-all duration-800 ease-out"
                style={{
                  objectPosition: slide.objectPosition,
                  imageRendering: "auto",
                  filter: isActive
                    ? "brightness(1.08) contrast(1.08) saturate(1.12)"
                    : "brightness(1.02) contrast(1.02) saturate(1.05)",
                  transform: isActive ? "scale(1.04)" : "scale(1.0)",
                  willChange: "transform, filter",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Directional Gradient Overlay (Left dark for text readability, Right clear & vibrant) */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.18) 70%, rgba(0,0,0,0.08) 100%)",
        }}
      />

      {/* Subtle top and bottom vignette overlays for edge contrast */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/35 via-black/10 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/40 to-transparent pointer-events-none z-10" />
    </div>
  );
}
