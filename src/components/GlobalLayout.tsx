import React, { Suspense, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Leva } from "leva";
import { AnimatePresence, motion } from "framer-motion";
import GlobalVoidCanvas from "./GlobalVoidCanvas";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Auth pages that should shift the 3D objects to the side
const AUTH_PATHS = ["/register", "/artist-register", "/admin-register", "/user-register", "/login", "/artist-login", "/admin-login", "/user-login"];

interface GlobalLayoutProps {
  children: React.ReactNode;
}

export default function GlobalLayout({ children }: GlobalLayoutProps) {
  const location = useLocation();
  const isAuthPage = AUTH_PATHS.includes(location.pathname);
  const lenisRef = useRef<Lenis | null>(null);

  // Lenis smooth scroll — attach globally, persist across route changes
  useEffect(() => {
    if (isAuthPage) {
      lenisRef.current?.destroy();
      lenisRef.current = null;
      return;
    }

    const lenis = new Lenis({
      duration: 0.85,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.4,
    });

    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);

    const tickerFn = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tickerFn);
    gsap.ticker.lagSmoothing(0, 0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(tickerFn);
      if (lenisRef.current === lenis) lenisRef.current = null;
    };
  }, [isAuthPage]);

  // Reset scroll on route change
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true });
  }, [location.pathname]);

  const isHomePage = location.pathname === "/";

  return (
    <>
      {/* ── LEVA PANEL (Only show on /antigravity) ── */}
      <Leva hidden={location.pathname !== "/antigravity"} />

      {/* ── PERSISTENT 3D VOID — fixed, never reloads ── */}
      <GlobalVoidCanvas isAuthPage={isAuthPage} isHomePage={isHomePage} />

      {/* ── PAGE CONTENT CROSSFADE ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 min-h-screen"
        >
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="glass-panel rounded-2xl px-8 py-6 flex items-center gap-4">
                <div className="w-6 h-6 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                <span className="text-sm font-bold text-slate-600 tracking-wider">Loading…</span>
              </div>
            </div>
          }>
            {children}
          </Suspense>
        </motion.div>
      </AnimatePresence>

      {/* ── FILM GRAIN ── */}
      <div
        className="film-grain"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
    </>
  );
}
