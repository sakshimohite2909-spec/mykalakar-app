import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export function useHeroSlideAnimation(activeIndex: number) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const container = scope.current;
      if (!container) return;

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // 1. Horizontal track movement
      const track = container.querySelector("[data-slider-track]") as HTMLElement;
      if (track) {
        const slideCount = Number(track.dataset.slideCount || 5);
        tl.to(
          track,
          {
            xPercent: -activeIndex * (100 / slideCount),
            duration: 0.9,
            ease: "power3.inOut",
          },
          0
        );
      }

      // 2. Curtain Sweep Effect (Layered Reveal)
      const sweep = container.querySelector("[data-slider-sweep]") as HTMLElement;
      if (sweep) {
        tl.fromTo(
          sweep,
          { opacity: 0.6, xPercent: -100 },
          {
            opacity: 0,
            xPercent: 100,
            duration: 0.85,
            ease: "power2.inOut",
          },
          0.05
        );
      }

      // 3. Heading line-by-line staggered entry
      const lines = container.querySelectorAll("[data-heading-line]");
      if (lines.length > 0) {
        tl.fromTo(
          lines,
          { autoAlpha: 0, y: 28 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.65,
            stagger: 0.1,
            ease: "power3.out",
          },
          0.2
        );
      }

      // 4. Highlighted orange word delayed reveal
      const highlights = container.querySelectorAll("[data-highlight-word]");
      if (highlights.length > 0) {
        tl.fromTo(
          highlights,
          { autoAlpha: 0, y: 12, scale: 0.95 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            stagger: 0.08,
            ease: "back.out(1.4)",
          },
          0.35
        );
      }

      // 5. Signature Trail Wave Reveal
      const signatureTrail = container.querySelector("[data-signature-trail]") as HTMLElement;
      if (signatureTrail) {
        tl.fromTo(
          signatureTrail,
          { opacity: 0, strokeDashoffset: 300 },
          { opacity: 1, strokeDashoffset: 0, duration: 1.2, ease: "power2.out" },
          0.3
        );
      }

      // 6. CTA buttons & details staggered entry
      const ctas = container.querySelectorAll("[data-slide-cta]");
      if (ctas.length > 0) {
        tl.fromTo(
          ctas,
          { autoAlpha: 0, y: 16 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.55,
            stagger: 0.08,
            ease: "power2.out",
          },
          0.45
        );
      }
    },
    { scope, dependencies: [activeIndex] }
  );

  return scope;
}
