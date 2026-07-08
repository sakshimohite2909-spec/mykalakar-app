import { ChevronLeft, ChevronRight } from "lucide-react";

type SliderControlsProps = {
  activeIndex: number;
  slideCount: number;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (index: number) => void;
};

export function SliderControls({ activeIndex, slideCount, onPrev, onNext, onGoTo }: SliderControlsProps) {
  return (
    <>
      <button
        type="button"
        onClick={onPrev}
        className="absolute left-3 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-white/58 text-stone-950 shadow-lg backdrop-blur-xl transition-all duration-300 hover:bg-orange-600 hover:text-white hover:border-orange-500 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-orange-500 sm:left-5"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={onNext}
        className="absolute right-3 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-white/58 text-stone-950 shadow-lg backdrop-blur-xl transition-all duration-300 hover:bg-orange-600 hover:text-white hover:border-orange-500 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-orange-500 sm:right-5"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/50 bg-white/52 px-3 py-2 shadow-lg backdrop-blur-xl">
        {Array.from({ length: slideCount }).map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onGoTo(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === activeIndex ? "w-8 bg-orange-600" : "w-2 bg-stone-500/35 hover:bg-stone-700/55"
            }`}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === activeIndex ? "true" : undefined}
          />
        ))}
      </div>
    </>
  );
}
