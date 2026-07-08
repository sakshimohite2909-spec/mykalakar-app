import { HERO_SLIDE_INTERVAL_MS, HERO_SLIDES } from "./sliderData";
import { GlassSlidePanel } from "./GlassSlidePanel";
import { SliderBackground } from "./SliderBackground";
import { SliderControls } from "./SliderControls";
import { useHeroSlideAnimation } from "./useHeroSlideAnimation";
import { useHeroSliderState } from "./useHeroSliderState";

export default function MyKalakarHeroSlider() {
  const slider = useHeroSliderState({
    slideCount: HERO_SLIDES.length,
    intervalMs: HERO_SLIDE_INTERVAL_MS,
  });
  const scope = useHeroSlideAnimation(slider.activeIndex);
  const activeSlide = HERO_SLIDES[slider.activeIndex];

  return (
    <section className="relative mx-auto mt-6 w-full max-w-[1240px] px-4 pb-4 md:px-6">
      {/* Background Glowing Ambient Orbs */}
      <div className="absolute -top-10 left-10 w-72 h-72 rounded-full bg-gradient-to-tr from-orange-400/10 to-amber-300/10 blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-10 right-10 w-80 h-80 rounded-full bg-gradient-to-br from-pink-400/10 to-purple-400/10 blur-[90px] pointer-events-none" />

      <div
        ref={scope}
        className="relative w-full h-[65vh] min-h-[580px] md:min-h-[520px] max-h-[700px] overflow-hidden rounded-[24px] border border-white/55 bg-[#faf6ef] shadow-[0_30px_100px_rgba(30,19,9,0.22)] select-none"
        onMouseEnter={() => slider.setIsPaused(true)}
        onMouseLeave={() => slider.setIsPaused(false)}
        onFocus={() => slider.setIsPaused(true)}
        onBlur={() => slider.setIsPaused(false)}
        {...slider.touchHandlers}
      >
        {/* Full-bleed background image slider */}
        <div className="absolute inset-0 w-full h-full z-0">
          <SliderBackground slides={HERO_SLIDES} activeIndex={slider.activeIndex} />
          {/* Dark overlay gradient to make text more readable */}
          <div className="absolute inset-y-0 left-0 w-full md:w-[60%] bg-gradient-to-r from-black/40 via-black/15 to-transparent pointer-events-none z-10" />
        </div>

        {/* Floating text card over the image - Left side overlay */}
        <div className="absolute left-4 sm:left-6 md:left-10 top-1/2 -translate-y-1/2 z-20 w-[92%] sm:w-[85%] md:w-[42%] max-w-[480px]">
          <GlassSlidePanel slide={activeSlide} activeIndex={slider.activeIndex} slideCount={HERO_SLIDES.length} />
        </div>

        {/* Controls Pill */}
        <SliderControls
          activeIndex={slider.activeIndex}
          slideCount={HERO_SLIDES.length}
          onPrev={slider.goPrev}
          onNext={slider.goNext}
          onGoTo={slider.goTo}
        />
      </div>
    </section>
  );
}
