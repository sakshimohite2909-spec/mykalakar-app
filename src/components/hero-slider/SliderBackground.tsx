import type { HeroSlide } from "./sliderData";

type SliderBackgroundProps = {
  slides: HeroSlide[];
  activeIndex: number;
};

export function SliderBackground({ slides, activeIndex }: SliderBackgroundProps) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#faf8f5]" aria-hidden="true">
      {/* Slide track wrapper */}
      <div
        data-slider-track
        data-slide-count={slides.length}
        className="flex h-full transition-none"
        style={{
          width: `${slides.length * 100}%`,
        }}
      >
        {slides.map((slide, index) => (
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
              className="h-full w-full object-cover"
              style={{
                objectPosition: slide.objectPosition,
                imageRendering: "high-quality",
              }}
            />
          </div>
        ))}
      </div>
      
      {/* Ambient gradient overlay for depth and text readability */}
      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-black/60 via-black/15 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-black/25 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/35 to-transparent pointer-events-none" />
    </div>
  );
}
