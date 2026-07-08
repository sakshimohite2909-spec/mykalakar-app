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
        className="relative flex flex-col md:flex-row w-full md:h-[65vh] min-h-[580px] md:min-h-[520px] max-h-[700px] overflow-hidden rounded-[24px] border border-white/55 bg-[#faf6ef] shadow-[0_30px_100px_rgba(30,19,9,0.22)] select-none"
        onMouseEnter={() => slider.setIsPaused(true)}
        onMouseLeave={() => slider.setIsPaused(false)}
        onFocus={() => slider.setIsPaused(true)}
        onBlur={() => slider.setIsPaused(false)}
        {...slider.touchHandlers}
      >
        {/* Left Side: Image Slider (60% width on desktop, 320px height on mobile) */}
        <div className="relative w-full md:w-[60%] h-[320px] md:h-full overflow-hidden shrink-0">
          <SliderBackground slides={HERO_SLIDES} activeIndex={slider.activeIndex} />
          
          <SliderControls
            activeIndex={slider.activeIndex}
            slideCount={HERO_SLIDES.length}
            onPrev={slider.goPrev}
            onNext={slider.goNext}
            onGoTo={slider.goTo}
          />
        </div>

        {/* Right Side: Vibrant Light Glassmorphism text panel (40% width on desktop, auto height on mobile) */}
        <div className="relative w-full md:w-[40%] flex flex-col justify-center p-5 sm:p-8 md:p-10 lg:p-12 overflow-hidden bg-[#faf8f5] border-t md:border-t-0 md:border-l border-white/60">
          {/* Ambient colorful gradient orbs behind the layout with slow pulse */}
          <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-gradient-to-tr from-pink-400/25 via-orange-400/20 to-amber-300/20 blur-3xl pointer-events-none z-0 animate-pulse" style={{ animationDuration: "8s" }} />
          <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-gradient-to-bl from-indigo-400/20 via-purple-400/20 to-cyan-400/20 blur-3xl pointer-events-none z-0 animate-pulse" style={{ animationDuration: "10s" }} />
          
          <div className="relative z-10 w-full">
            <GlassSlidePanel slide={activeSlide} activeIndex={slider.activeIndex} slideCount={HERO_SLIDES.length} />
          </div>
        </div>
      </div>
    </section>
  );
}
