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
  @keyframes hero-progress {
    0% { width: 0%; }
    100% { width: 100%; }
  }
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
    <section className="relative w-full h-auto md:h-screen flex flex-col md:block overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: heroSliderStyles }} />

      {/* Background Glowing Ambient Orbs */}
      <div className="absolute -top-10 left-10 w-96 h-96 rounded-full bg-gradient-to-tr from-orange-500/25 to-amber-400/25 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-10 right-10 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-pink-500/25 to-purple-500/25 blur-[120px] pointer-events-none" />

      {/* Top Part: Image Slider (Mobile: h-[210px] sm:h-[230px], Desktop: fullscreen absolute) */}
      <div
        ref={scope}
        className="relative w-full h-[210px] sm:h-[230px] md:h-full md:aspect-none overflow-hidden select-none"
        {...slider.touchHandlers}
      >
        {/* Fullscreen Background Slider */}
        <div className="absolute inset-0 w-full h-full z-0">
          <SliderBackground slides={HERO_SLIDES} activeIndex={slider.activeIndex} />
        </div>

        {/* Previous Button (Left Margin of Image) */}
        <button
          type="button"
          onClick={slider.goPrev}
          className="absolute left-3 top-1/2 z-35 flex h-10 w-10 md:h-12 md:w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-orange-600 hover:text-white hover:border-orange-500 hover:shadow-[0_0_20px_rgba(249,115,22,0.5)] active:scale-95 sm:left-5 cursor-pointer"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Next Button (Right Margin of Image) */}
        <button
          type="button"
          onClick={slider.goNext}
          className="absolute right-3 top-1/2 z-35 flex h-10 w-10 md:h-12 md:w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-orange-600 hover:text-white hover:border-orange-500 hover:shadow-[0_0_20px_rgba(249,115,22,0.5)] active:scale-95 sm:right-5 cursor-pointer"
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Thumbnails Row - DESKTOP ONLY here (at bottom of fullscreen) */}
        <div className="hidden md:flex absolute bottom-6 left-4 right-4 z-20 overflow-visible gap-3 py-1 scrollbar-none">
          {HERO_SLIDES.map((slide, index) => {
            const isActive = index === slider.activeIndex;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => slider.goTo(index)}
                className={`relative flex-1 min-w-0 flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                  isActive
                    ? "bg-[#1f150e]/95 border-orange-500 shadow-[0_0_22px_rgba(249,115,22,0.45)] ring-2 ring-orange-500/50 scale-[1.02]"
                    : "bg-black/40 border-white/10 opacity-75 hover:opacity-100 hover:border-white/25 hover:bg-black/60 hover:scale-[1.01]"
                }`}
              >
                {/* Mini Thumbnail Image */}
                <div className="w-12 h-10 rounded-lg overflow-hidden shrink-0">
                  <img
                    src={slide.image}
                    alt=""
                    className={`w-full h-full object-cover transition-all duration-300 ${
                      isActive ? "brightness-110 saturate-115 scale-105" : "brightness-90 opacity-80"
                    }`}
                  />
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

                {/* Animated Autoplay Progress Bar */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3.5px] bg-stone-900/60 rounded-b-[14px] overflow-hidden">
                    <div
                      key={`progress-${slider.activeIndex}-${slider.isPaused}`}
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                      style={{
                        animation: slider.isPaused
                          ? "none"
                          : `hero-progress ${HERO_SLIDE_INTERVAL_MS}ms linear forwards`,
                      }}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Progress Indicators - DESKTOP ONLY here */}
        <div className="hidden md:flex absolute bottom-2 left-6 right-6 z-30 items-center gap-2 justify-center">
          {HERO_SLIDES.map((_, index) => (
            <div
              key={index}
              className={`h-[3px] rounded-full transition-all duration-500 ${
                index === slider.activeIndex ? "w-12 bg-orange-500 shadow-[0_0_8px_#f97316]" : "w-6 bg-stone-700/60"
              }`}
            />
          ))}
        </div>

        {/* DESKTOP ONLY Content Wrapper (Guaranteed clearance below 80px Navbar) */}
        <div className="hidden md:flex absolute top-20 md:top-24 bottom-0 left-0 right-0 z-20 flex-row w-full justify-between items-start pt-4 lg:pt-8 px-12 lg:px-20 pb-20 gap-12">
          {/* Left Side: Headline Text & Signature Visual Element */}
          <div className="relative flex w-full md:w-[54%] flex-col justify-center text-white pointer-events-none select-none">
            {/* MyKalakar Signature Visual Ribbon Trail SVG (Desktop ONLY) */}
            <svg
              data-signature-trail
              className="hidden md:block absolute -left-12 -bottom-12 w-[560px] h-[90px] pointer-events-none z-0 opacity-50"
              viewBox="0 0 560 90"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M 10 70 C 140 90, 240 30, 390 60 C 470 80, 520 50, 550 20"
                stroke="url(#mykalakar-gold-ribbon)"
                strokeWidth="2"
                strokeLinecap="round"
                className="drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]"
              />
              <defs>
                <linearGradient id="mykalakar-gold-ribbon" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.85" />
                  <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#ea580c" stopOpacity="0.2" />
                </linearGradient>
              </defs>
            </svg>

            {HERO_SLIDES.map((slide, index) => {
              if (index !== slider.activeIndex) return null;
              const overlayText = t(`hero.slide${slide.id}.overlay`, { defaultValue: slide.heading });
              const parts = overlayText.includes(",") ? overlayText.split(",") : [overlayText];
              return (
                <div
                  key={slide.id}
                  className="relative z-10 max-w-[460px] lg:max-w-[560px] text-white font-sans space-y-2"
                >
                  {/* Eyebrow Pill Badge */}
                  <div
                    data-heading-line
                    className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/15 border border-orange-500/35 text-orange-400 text-xs font-black tracking-widest uppercase mb-1 backdrop-blur-md shadow-sm"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-orange-400 animate-pulse" />
                    <span>{slide.eyebrow}</span>
                  </div>

                  {/* Main Headline */}
                  <h2 className="text-xl sm:text-2xl md:text-[28px] lg:text-[34px] font-black leading-[1.18] tracking-tight uppercase">
                    {parts.map((part, idx) => {
                      const words = part.trim().split(" ");
                      if (idx === 0 && words.length > 1) {
                        const lastWord = words.pop();
                        const remaining = words.join(" ");
                        return (
                          <span key={idx} data-heading-line className="block mb-0.5">
                            <span className="block text-white font-black">{remaining}</span>
                            <span
                              data-highlight-word
                              className="block italic font-black text-orange-500 text-[1.12em] tracking-[0.05em] mt-0.5"
                            >
                              {lastWord}
                            </span>
                          </span>
                        );
                      }
                      return (
                        <span
                          key={idx}
                          data-heading-line
                          className={`block ${
                            idx === 1
                              ? "text-stone-200 mt-1 font-medium text-xs sm:text-sm md:text-base normal-case tracking-normal"
                              : "text-white font-black"
                          }`}
                        >
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
          <div className="w-full md:w-[45%] lg:w-[42%] flex flex-col justify-center relative z-30">
            <div className="relative z-30 w-full">
              <GlassSlidePanel slide={activeSlide} activeIndex={slider.activeIndex} slideCount={HERO_SLIDES.length} />
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE ONLY Content Wrapper (flowing below the image slider) */}
      <div className="md:hidden w-full bg-[#0f0b07] px-4 pt-3 pb-4 flex flex-col gap-3 relative z-20">
        <GlassSlidePanel slide={activeSlide} activeIndex={slider.activeIndex} slideCount={HERO_SLIDES.length} />

        {/* Mobile Thumbnails Row */}
        <div className="w-full flex overflow-x-auto gap-2 py-0.5 scrollbar-none snap-x snap-mandatory">
          {HERO_SLIDES.map((slide, index) => {
            const isActive = index === slider.activeIndex;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => slider.goTo(index)}
                className={`relative flex-shrink-0 w-[105px] sm:w-[125px] flex items-center gap-1.5 p-2 rounded-xl border transition-all duration-300 snap-start overflow-hidden ${
                  isActive
                    ? "bg-[#1f150e]/95 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                    : "bg-black/30 border-white/10"
                }`}
              >
                <div className="w-9 h-8 rounded-md overflow-hidden shrink-0">
                  <img src={slide.image} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-stone-500">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {isActive && <Equalizer />}
                  </div>
                  <p className={`text-[10px] font-black truncate mt-0.5 ${isActive ? "text-white" : "text-stone-400"}`}>
                    {t(`hero.slide${slide.id}.thumbnail`)}
                  </p>
                </div>

                {/* Mobile Active Progress Bar */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-stone-900/60 rounded-b-xl overflow-hidden">
                    <div
                      key={`mob-prog-${slider.activeIndex}-${slider.isPaused}`}
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                      style={{
                        animation: slider.isPaused
                          ? "none"
                          : `hero-progress ${HERO_SLIDE_INTERVAL_MS}ms linear forwards`,
                      }}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile Progress indicators */}
        <div className="flex items-center gap-1.5 justify-center mt-1">
          {HERO_SLIDES.map((_, index) => (
            <div
              key={index}
              className={`h-[3px] rounded-full transition-all duration-500 ${
                index === slider.activeIndex ? "w-10 bg-orange-500 shadow-[0_0_6px_#f97316]" : "w-4 bg-stone-700/60"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
