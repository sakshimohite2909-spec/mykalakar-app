import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export function useHeroSlideAnimation(activeIndex: number) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // 1. Animate horizontal slide track
      const track = scope.current?.querySelector("[data-slider-track]") as HTMLElement;
      if (track) {
        const slideCount = Number(track.dataset.slideCount || 5);
        gsap.to(track, {
          xPercent: -activeIndex * (100 / slideCount),
          duration: 0.8,
          ease: "power3.out",
        });
      }

      // 2. Animate details panel (staggered entry)
      const details = scope.current?.querySelectorAll("[data-slide-detail]");
      if (details && details.length > 0) {
        gsap.killTweensOf(details);
        gsap.fromTo(
          details,
          { autoAlpha: 0, y: 15 },
          { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power2.out", delay: 0.1 }
        );
      }
    },
    { scope, dependencies: [activeIndex] }
  );

  return scope;
}
