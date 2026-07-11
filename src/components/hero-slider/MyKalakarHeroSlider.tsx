import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { HERO_SLIDE_INTERVAL_MS, HERO_SLIDES } from "./sliderData";
import { GlassSlidePanel } from "./GlassSlidePanel";
import { SliderBackground } from "./SliderBackground";
import { useHeroSlideAnimation } from "./useHeroSlideAnimation";
import { useHeroSliderState } from "./useHeroSliderState";
import { useI18n } from "@/i18n/I18nProvider";

// Inline Equalizer component with custom animation styles
export function Equalizer() {
  return (
    <div className="flex items-end gap-[2px] h-3 w-4 shrink-0" aria-hidden="true">
      <span className="w-[2.5px] bg-orange-500 rounded-full animate-[eq-bar-1_0.9s_infinite_alternate]" style={{ height: "30%" }} />
      <span className="w-[2.5px] bg-orange-500 rounded-full animate-[eq-bar-2_0.7s_infinite_alternate]" style={{ height: "50%", animationDelay: "0.15s" }} />
      <span className="w-[2.5px] bg-orange-500 rounded-full animate-[eq-bar-3_1.1s_infinite_alternate]" style={{ height: "15%", animationDelay: "0.3s" }} />
      <span className="w-[2.5px] bg-orange-500 rounded-full animate-[eq-bar-4_0.8s_infinite_alternate]" style={{ height: "40%", animationDelay: "0.45s" }} />
    </div>
  );
}

// CSS keyframes and responsive styles injected inline
const heroSliderStyles = `
  @media (min-width: 768px) {
    .clip-curved-right {
      clip-path: ellipse(95% 135% at 5% 50%);
    }
  }
  @keyframes eq-bar-1 { 0% { height: 20%; } 100% { height: 100%; } }
  @keyframes eq-bar-2 { 0% { height: 30%; } 100% { height: 85%; } }
  @keyframes eq-bar-3 { 0% { height: 15%; } 100% { height: 95%; } }
  @keyframes eq-bar-4 { 0% { height: 25%; } 100% { height: 90%; } }
  .scrollbar-none::-webkit-scrollbar { display: none; }
  .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
`;

export default function MyKalakarHeroSlider() {
  const { t } = useI18n();
  const slider = useHeroSliderState({
    slideCount: HERO_SLIDES.length,
    intervalMs: HERO_SLIDE_INTERVAL_MS,
  });
  const scope = useHeroSlideAnimation(slider.activeIndex);
  const activeSlide = HERO_SLIDES[slider.activeIndex];

  return (
    <section className="relative w-full h-screen overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: heroSliderStyles }} />

      {/* Background Glowing Ambient Orbs */}
      <div className="absolute -top-10 left-10 w-96 h-96 rounded-full bg-gradient-to-tr from-orange-500/25 to-amber-400/25 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-10 right-10 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-pink-500/25 to-purple-500/25 blur-[120px] pointer-events-none" />

      <div
        ref={scope}
        className="relative w-full h-full overflow-hidden bg-[#0f0b07] select-none"
        onMouseEnter={() => slider.setIsPaused(true)}
        onMouseLeave={() => slider.setIsPaused(false)}
        onFocus={() => slider.setIsPaused(true)}
        onBlur={() => slider.setIsPaused(false)}
        {...slider.touchHandlers}
      >
        {/* Fullscreen Background Slider */}
        <div className="absolute inset-0 w-full h-full z-0">
          <SliderBackground slides={HERO_SLIDES} activeIndex={slider.activeIndex} />
          {/* Extra dark overlay to ensure readability */}
          <div className="absolute inset-0 bg-black/50 z-10" />
        </div>

        {/* Content Wrapper */}
        <div className="relative z-20 flex flex-col md:flex-row w-full h-full justify-between items-center px-6 sm:px-12 md:px-16 pt-24 pb-32 md:pb-24 gap-6 md:gap-12">
          {/* Left Side: Headline Text */}
          <div className="hidden md:flex w-full md:w-[50%] flex-col justify-center text-white pointer-events-none select-none">
            {HERO_SLIDES.map((slide, index) => {
              if (index !== slider.activeIndex) return null;
              const overlayText = t(`hero.slide${slide.id}.overlay`, { defaultValue: "" });
              if (!overlayText) return null;
              const parts = overlayText.includes(",") ? overlayText.split(",") : [overlayText];
              return (
                <div
                  key={slide.id}
                  data-slide-detail
                  className="max-w-[420px] md:max-w-[500px] text-white font-sans"
                >
                  <h2 className="text-3xl sm:text-4xl md:text-[42px] lg:text-[48px] font-black leading-[1.12] drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] uppercase tracking-wide">
                    {parts.map((part, idx) => {
                      const words = part.trim().split(" ");
                      if (idx === 0 && words.length > 1) {
                        const lastWord = words.pop();
                        const remaining = words.join(" ");
                        return (
                          <span key={idx} className="block mb-1">
                            {remaining} <span className="text-orange-500">{lastWord}</span>
                          </span>
                        );
                      }
                      return (
                        <span key={idx} className={`block ${idx === 1 ? 'text-stone-200 mt-2 font-semibold text-lg sm:text-xl md:text-2xl normal-case' : ''}`}>
                          {part.trim()}
                        </span>
                      );
                    })}
                  </h2>
                </div>
              );
            })}
          </div>

          {/* Right Side: Glass Slide Panel */}
          <div className="w-full md:w-[45%] lg:w-[42%] flex flex-col justify-center">
            <div className="relative z-10 w-full">
              <GlassSlidePanel slide={activeSlide} activeIndex={slider.activeIndex} slideCount={HERO_SLIDES.length} />
            </div>
          </div>
        </div>

        {/* Previous Button (Left Margin) */}
        <button
          type="button"
          onClick={slider.goPrev}
          className="absolute left-3 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white shadow-lg backdrop-blur-md transition-all duration-300 hover:bg-orange-600 hover:text-white hover:border-orange-500 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-orange-500 sm:left-5"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Next Button (Right Margin) */}
        <button
          type="button"
          onClick={slider.goNext}
          className="absolute right-3 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white shadow-lg backdrop-blur-md transition-all duration-300 hover:bg-orange-600 hover:text-white hover:border-orange-500 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-orange-500 sm:right-5"
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Thumbnails Row (Desktop bottom overlay, mobile horizontal scrollable) */}
        <div className="absolute bottom-[84px] md:bottom-6 left-4 right-4 z-30 flex overflow-x-auto md:overflow-visible gap-2 md:gap-3 py-1 scrollbar-none snap-x snap-mandatory">
          {HERO_SLIDES.map((slide, index) => {
            const isActive = index === slider.activeIndex;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => slider.goTo(index)}
                className={`flex-1 min-w-[140px] md:min-w-0 flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300 snap-start ${
                  isActive
                    ? "bg-[#25180f]/90 border-orange-500/80 shadow-[0_4px_25px_rgba(249,115,22,0.2)] scale-[1.03]"
                    : "bg-black/40 border-white/5 hover:border-white/15 hover:bg-black/55"
                }`}
              >
                {/* Mini Thumbnail Image */}
                <div className="w-12 h-10 rounded-lg overflow-hidden shrink-0">
                  <img src={slide.image} alt="" className="w-full h-full object-cover" />
                </div>
                
                {/* Thumbnail Info */}
                <div className="text-left min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-stone-500">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {isActive && <Equalizer />}
                  </div>
                  <p className={`text-xs font-extrabold truncate mt-0.5 ${isActive ? "text-white" : "text-stone-400"}`}>
                    {t(`hero.slide${slide.id}.thumbnail`)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Progress Indicator Lines (integrated below thumbnails) */}
        <div className="absolute bottom-[72px] md:bottom-2 left-6 right-6 z-30 flex items-center gap-2 justify-center">
          {HERO_SLIDES.map((_, index) => (
            <div
              key={index}
              className={`h-[3px] rounded-full transition-all duration-500 ${
                index === slider.activeIndex ? "w-12 bg-orange-500 shadow-[0_0_8px_#f97316]" : "w-6 bg-stone-700/60"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
