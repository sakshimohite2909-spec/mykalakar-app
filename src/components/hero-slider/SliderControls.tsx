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
    <div className="absolute bottom-6 right-6 md:right-10 z-30 flex items-center gap-3.5 rounded-full border border-white/20 bg-stone-950/60 px-4 py-2.5 shadow-xl backdrop-blur-md">
      <button
        type="button"
        onClick={onPrev}
        className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition-all duration-200 hover:bg-white/15 hover:text-white hover:scale-105 active:scale-95 focus:outline-none"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-4.5 w-4.5" />
      </button>

      <div className="flex items-center gap-1.5">
        {Array.from({ length: slideCount }).map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onGoTo(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === activeIndex ? "w-6 bg-orange-500" : "w-1.5 bg-white/40 hover:bg-white/70"
            }`}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === activeIndex ? "true" : undefined}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onNext}
        className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition-all duration-200 hover:bg-white/15 hover:text-white hover:scale-105 active:scale-95 focus:outline-none"
        aria-label="Next slide"
      >
        <ChevronRight className="h-4.5 w-4.5" />
      </button>
    </div>
  );
}
