import React, { useLayoutEffect, useRef, useState, useEffect } from "react";
import { Sparkles as SparklesIcon, ArrowRight, Star, Users, Zap, Search } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";

gsap.registerPlugin(ScrollTrigger);

// ── GLASS UI PANEL ──────────────────────────────────────────────────────────
function GlassPanel({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!panelRef.current) return;
    gsap.to(panelRef.current, {
      y: "+=5",
      duration: 3.5 + delay * 0.3,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });
  }, [delay]);

  return (
    <div
      ref={panelRef}
      className={`glass-panel rounded-3xl p-8 fade-in-panel border-white/75 bg-white/60 shadow-[0_24px_90px_rgba(184,92,122,0.14),0_10px_36px_rgba(232,111,58,0.10),inset_0_1px_0_rgba(255,255,255,0.78)] ${className}`}
    >
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/72 via-white/26 to-rose-50/18 pointer-events-none opacity-70" />
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// ── STAT CHIP ───────────────────────────────────────────────────────────────
function StatChip({ icon: Icon, value, label }: { icon: any; value: string; label: string }) {
  return (
    <div className="glass-card rounded-2xl px-5 py-4 flex items-center gap-3 fade-in-panel">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center flex-shrink-0 shadow-sm shadow-orange-200">
        <Icon className="w-4 h-4 text-foreground" />
      </div>
      <div>
        <p className="text-lg font-black text-[#1A1A1A] leading-none tracking-tight">{value}</p>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{label}</p>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function PremiumScrollyExperience() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrolled, setScrolled] = useState(false);

  // Simple scroll listener for navbar header styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      });
      if (cursorRef.current) {
        gsap.to(cursorRef.current, { x: e.clientX, y: e.clientY, duration: 0.7, ease: "power4.out" });
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Scroll-driven panel fade-ins
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panels = gsap.utils.toArray(".fade-in-panel") as HTMLElement[];
      panels.forEach((panel) => {
        gsap.to(panel, {
          opacity: 1,
          y: 0,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: panel,
            start: "top 88%",
            toggleActions: "play none none reverse",
          },
        });
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleMagneticEnter = (e: React.MouseEvent<HTMLElement>) =>
    gsap.to(e.currentTarget, { scale: 1.05, duration: 0.3, ease: "power2.out" });
  const handleMagneticLeave = (e: React.MouseEvent<HTMLElement>) =>
    gsap.to(e.currentTarget, { x: 0, y: 0, scale: 1, duration: 0.6, ease: "elastic.out(1, 0.4)" });
  const handleMagneticMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.25;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.25;
    gsap.to(e.currentTarget, { x, y, duration: 0.3, ease: "power2.out" });
  };

  const tiltStyle = {
    transform: `perspective(1200px) rotateX(${mousePos.y * 2.5}deg) rotateY(${mousePos.x * 2.5}deg)`,
    transition: "transform 0.12s ease-out",
  };

  return (
    <>
      {/* ── CURSOR GLOW ── */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 w-[500px] h-[500px] -ml-[250px] -mt-[250px] rounded-full pointer-events-none z-[9990] select-none"
        style={{ background: "radial-gradient(circle, rgba(232, 111, 58, 0.10) 0%, rgba(184, 92, 122, 0.06) 48%, transparent 70%)" }}
      />

      {/* ── PAGE WRAPPER ── */}
      <div ref={containerRef} className="relative w-full overflow-hidden flex flex-col font-sans bg-transparent">

        {/* ── HEADER ── */}
        <Navbar />        {/* ── SECTION 1: HERO ── */}
        <section id="section-hero" className="min-h-screen w-full flex flex-col justify-center px-[5%] lg:px-[8%] relative py-32 z-10">
          <div className="flex flex-col gap-6 max-w-2xl">
            {/* Badge */}
            <div className="fade-in-panel inline-flex self-start items-center gap-2 px-5 py-2.5 glass-card rounded-full bg-white/50 border border-orange-100">
              <SparklesIcon className="w-4 h-4 text-orange-500" />
              <span className="text-[10px] font-black tracking-[0.25em] uppercase text-orange-600">India's Premier Artist Platform</span>
            </div>

            {/* Headline */}
            <div className="fade-in-panel">
              <h1 className="text-5xl lg:text-7xl font-black text-[#1A1A1A] leading-[1.05] tracking-tight">
                They won't just come,<br />
                <span className="gradient-text-primary">they'll be drawn in.</span>
              </h1>
            </div>

            {/* Subline */}
            <p className="fade-in-panel text-base md:text-lg text-slate-500 font-medium leading-relaxed max-w-lg mt-2">
              Discover India's most elite performing artists. Book seamlessly. Experience the extraordinary under total glassmorphic clarity.
            </p>

            {/* CTAs */}
            <div className="fade-in-panel flex flex-wrap items-center gap-4 mt-4">
              <Link
                to="/artists"
                onMouseEnter={handleMagneticEnter}
                onMouseLeave={handleMagneticLeave}
                onMouseMove={handleMagneticMove}
                className="btn-glass-primary rounded-2xl px-9 py-4 text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-orange-200 text-foreground"
              >
                Explore Artists <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/register"
                onMouseEnter={handleMagneticEnter}
                onMouseLeave={handleMagneticLeave}
                onMouseMove={handleMagneticMove}
                className="btn-glass-secondary bg-white/50 border-white/60 rounded-2xl px-9 py-4 text-xs font-black uppercase tracking-widest text-[#1A1A1A] hover:bg-white/80"
              >
                Join as Artist
              </Link>
            </div>

            {/* Stats row */}
            <div className="fade-in-panel flex flex-wrap gap-3 mt-10">
              <StatChip icon={Users} value="2,400+" label="Verified Artists" />
              <StatChip icon={Star} value="4.9★" label="Avg. Rating" />
              <StatChip icon={Zap} value="24h" label="Booking Speed" />
            </div>
          </div>
        </section>

        {/* ── SECTION 1.5: MANIFESTO ── */}
        <section id="section-manifesto" className="w-full flex items-center justify-center px-[5%] lg:px-[10%] py-32 relative z-10">
          <GlassPanel className="w-full max-w-4xl pointer-events-auto text-center" delay={0.5}>
            <div className="inline-flex self-start items-center gap-2 px-5 py-2.5 glass-card rounded-full bg-white/50 border border-orange-100 mb-6">
              <SparklesIcon className="w-4 h-4 text-orange-500" />
              <span className="text-[10px] font-black tracking-[0.25em] uppercase text-orange-600">✦ OUR ARCHITECTURE</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-[#1A1A1A] tracking-tight mb-6">
              The Architecture of <span className="gradient-text-primary">Awe.</span>
            </h2>
          </GlassPanel>
        </section>

        {/* ── SECTION 2: ORCHESTRA ── */}
        <section id="section-act2" className="min-h-screen w-full flex items-center justify-start px-[5%] lg:px-[10%] relative z-10 py-20">
          <GlassPanel className="w-full max-w-md pointer-events-auto shadow-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-orange-400 to-amber-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-600">Act II</span>
            </div>
            <h2 className="text-4xl font-black text-[#1A1A1A] tracking-tight leading-tight mb-4">
              Kinetic Orchestra<br /><span className="gradient-text-primary">Re-Assembly.</span>
            </h2>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Feel the resonance of raw energy — musicians, dancers, and visual artists converging in zero gravity to create something entirely unprecedented.
            </p>

          </GlassPanel>
        </section>

        {/* ── SECTION 2.5: WHY US GRID ── */}
        <section id="section-features" className="w-full px-[5%] lg:px-[10%] py-32 relative z-10 flex flex-col items-center">
            <h2 className="text-3xl font-black text-[#1A1A1A] tracking-widest uppercase mb-12 fade-in-panel">Crystalline Curation.</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
               {/* Card 1 */}
               <GlassPanel className="flex flex-col items-start hover:-translate-y-2 transition-transform duration-500" delay={0}>
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center mb-6">
                     <Search className="w-5 h-5 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-black text-[#1A1A1A] mb-3">Zero-Friction Discovery</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">"Glide through our interactive roster. No clutter, just pure, authenticated performance data at your fingertips."</p>
               </GlassPanel>
               {/* Card 2 */}
               <GlassPanel className="flex flex-col items-start hover:-translate-y-2 transition-transform duration-500" delay={0.2}>
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center mb-6">
                     <Zap className="w-5 h-5 text-rose-600" />
                  </div>
                  <h3 className="text-xl font-black text-[#1A1A1A] mb-3">Intelligent Logistics</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">"From initial spark to final applause, smart contracts and automated payments operate seamlessly in the background."</p>
               </GlassPanel>
               {/* Card 3 */}
               <GlassPanel className="flex flex-col items-start hover:-translate-y-2 transition-transform duration-500" delay={0.4}>
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center mb-6">
                     <Star className="w-5 h-5 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-black text-[#1A1A1A] mb-3">Vetted Brilliance</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">"Access is a privilege. Every creator is strictly vetted for professionalism, punctuality, and undeniable talent."</p>
               </GlassPanel>
            </div>
        </section>

        {/* ── SECTION 3: VORTEX ── */}
        <section id="section-act3" className="min-h-screen w-full flex items-center justify-end px-[5%] lg:px-[10%] relative z-10 py-20">
          <GlassPanel className="w-full max-w-md pointer-events-auto shadow-xl" delay={1}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-orange-500 to-amber-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-500">Act III</span>
            </div>
            <h2 className="text-4xl font-black text-[#1A1A1A] tracking-tight leading-tight mb-4">
              The Kinetic<br /><span className="gradient-text-primary">Vortex.</span>
            </h2>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              A singular space where creativity and momentum converge. Define your rhythmic edge within the eternal golden spiral of artistic expression.
            </p>
            <div className="mt-8">
              <Link to="/events" className="btn-glass-primary rounded-xl px-6 py-3 text-[10px] font-black uppercase tracking-widest text-foreground shadow-md shadow-orange-200 inline-block">
                Explore Events
              </Link>
            </div>
          </GlassPanel>
        </section>

        {/* ── SECTION 4: CTA ── */}
        <section id="section-act4" className="min-h-[80vh] w-full flex items-center justify-center px-[5%] relative z-10 py-20 mb-20">
          <GlassPanel className="w-full max-w-xl pointer-events-auto text-center flex flex-col items-center shadow-xl" delay={2}>
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-orange-200">
              <SparklesIcon className="w-6 h-6 text-foreground" />
            </div>
            <h2 className="text-5xl font-black text-[#1A1A1A] mb-5 leading-[1.1] tracking-tight">
              The Visual <span className="gradient-text-primary">Arts Spline.</span>
            </h2>
            <p className="text-base text-slate-500 font-medium leading-relaxed max-w-md mb-10">
              You have traversed the canvas of continuous art. It is time to discover the elite talent holding the brush.
            </p>
            <Link
              to="/artists"
              onMouseEnter={handleMagneticEnter}
              onMouseLeave={handleMagneticLeave}
              onMouseMove={handleMagneticMove}
              className="btn-glass-primary rounded-2xl px-10 py-4 text-xs font-black uppercase tracking-widest text-foreground shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300"
            >
              Explore All Art
            </Link>
          </GlassPanel>
        </section>

        {/* ── SECTION 5: THE ECHOES (TESTIMONIALS) ── */}
        <section id="section-testimonials" className="w-full flex justify-start overflow-hidden px-[5%] py-32 relative z-10 flex-col">
            <h2 className="text-xs font-black text-slate-400 tracking-[0.25em] uppercase mb-8 md:ml-[10%] fade-in-panel">✦ THE ECHOES</h2>
            <div className="flex gap-8 overflow-x-auto pb-10 snap-x w-full max-w-[1400px] mx-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <GlassPanel className="min-w-[320px] md:min-w-[500px] snap-center shrink-0" delay={0}>
                   <p className="text-lg text-[#1A1A1A] font-medium leading-relaxed mb-6 italic">"It wasn't just a booking; it was the defining moment of our gala. The platform’s curation is absolutely flawless."</p>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">– Director of Events, Horizon Luxe</p>
                </GlassPanel>
                <GlassPanel className="min-w-[320px] md:min-w-[500px] snap-center shrink-0" delay={0.2}>
                   <p className="text-lg text-[#1A1A1A] font-medium leading-relaxed mb-6 italic">"Finally, a digital space that respects the art as much as the artist. The interface melts away, leaving only the performance."</p>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">– Avant-Garde Violinist, Collective Member</p>
                </GlassPanel>
            </div>
        </section>


        {/* ── FIXED SEARCH BAR ── */}
        <div className="fixed bottom-8 left-8 z-[100] pointer-events-none hidden lg:block">
          <Link to="/artists">
            <div
              style={tiltStyle}
              className="pointer-events-auto flex w-64 items-center gap-3 bg-white/60 backdrop-blur-2xl border border-white/60 rounded-full px-5 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:bg-white/80 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Search className="h-4 w-4 text-orange-600" />
              </div>
              <span className="text-xs font-bold text-[#1A1A1A] tracking-wider uppercase">Explore Artist</span>
            </div>
          </Link>
        </div>

      </div>
    </>
  );
}
