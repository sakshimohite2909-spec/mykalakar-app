import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, PlayCircle } from "lucide-react";
import { Suspense } from "react";
import ErrorBoundary from "./ErrorBoundary";
import FluidCanvas from "./FluidCanvas";

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative w-full bg-transparent overflow-hidden">
      {/* ── Continuous 3D Background (Active Canvas) ── */}
      <ErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <FluidCanvas />
        </Suspense>
      </ErrorBoundary>

      <div className="relative z-10 w-full pointer-events-none">
        
        {/* ROW 1: TOP PANELS (1, 2, 3) */}
        <div className="min-h-screen w-full flex items-center justify-center container mx-auto px-4 pt-24 font-sans">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full h-full pb-10 pointer-events-auto">
            {/* Panel 1: Top-Left (Hero Text) */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, margin: "-20%" }}
              transition={{ duration: 1 }}
              className="flex flex-col justify-center h-full max-w-sm"
            >
              <h3 className="text-[10px] font-bold tracking-[0.4em] uppercase text-foreground/50 mb-4 opacity-70">
                WHO ARE WE?
              </h3>
              <h1 className="text-4xl lg:text-5xl font-light tracking-tight text-foreground leading-[1.1] mb-6">
                HERO VIEW <br />
                <span className="font-serif italic font-medium text-foreground/90">&</span> KINETIC DANCER
              </h1>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group flex w-max items-center justify-center gap-3 px-6 py-3 rounded-full font-semibold text-xs tracking-widest uppercase
                  bg-white text-black shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] transition-all duration-300"
              >
                <PlayCircle className="h-4 w-4" />
                Launch Demo
              </motion.button>
            </motion.div>
            
            {/* Panel 2: Top-Middle (Empty DOM to show particle swarms) */}
            <div className="relative h-full flex items-center justify-center pointer-events-none" />

            {/* Panel 3: Top-Right (Empty DOM to show Masks and brush) */}
            <div className="relative h-full flex items-center justify-center pointer-events-none" />
          </div>
        </div>

        {/* ROW 2: MIDDLE PANELS (4, 5, 6) */}
        <div className="min-h-screen w-full flex items-center justify-center container mx-auto px-4 font-sans">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full h-full pointer-events-auto">
            {/* Panel 4: Middle-Left (UI Cards side by side/stacked) */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-20%" }}
              transition={{ duration: 1 }}
              className="flex flex-col justify-center h-full"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                {/* Apply Card */}
                <div className="p-6 rounded-3xl bg-white/5 backdrop-blur-3xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] group hover:bg-white/10 transition-colors">
                  <h3 className="text-sm font-bold tracking-widest text-foreground mb-3 uppercase">Platform Access</h3>
                  <ul className="text-foreground/50 text-[10px] space-y-2 mb-6 font-mono">
                    <li>• Global Reach</li>
                    <li>• Negotiation</li>
                  </ul>
                  <button 
                    onClick={() => navigate("/register")}
                    className="w-full py-2.5 rounded-full font-bold text-[10px] tracking-widest uppercase bg-white/10 text-foreground hover:bg-white hover:text-black group-hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all"
                  >
                    Apply
                  </button>
                </div>
                {/* Music Card */}
                <div className="p-6 rounded-3xl bg-white/5 backdrop-blur-3xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold tracking-widest text-foreground mb-2 uppercase">MUSIC EXPLOSION</h3>
                    <p className="text-foreground/40 font-light text-[10px] leading-relaxed mb-4">
                      Explore zero-gravity acoustics.
                    </p>
                  </div>
                  <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full font-bold text-[10px] tracking-widest uppercase bg-transparent border border-white/20 text-foreground hover:bg-white/20 transition-all">
                    Learn More <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1 opacity-60">
                <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-foreground font-sans">
                  HERO VIEW & KINETIC DANCER
                </p>
                <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-foreground/50 font-sans">
                  RHYTHMIC MUSIC EXPLOSION
                </p>
              </div>
            </motion.div>

            {/* Panel 5: Middle-Middle (Empty DOM to show Instrument Explosion) */}
            <div className="relative h-full flex items-center justify-center pointer-events-none" />

            {/* Panel 6: Middle-Right (Empty DOM to show fluid close up) */}
            <div className="relative h-full flex items-center justify-center pointer-events-none" />
          </div>
        </div>

        {/* ROW 3: BOTTOM PANELS (7, 8, 9) */}
        <div className="min-h-screen w-full flex items-center justify-center container mx-auto px-4 pb-24 font-sans relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full h-full pointer-events-auto">
            {/* Panel 7: Bottom-Left (Empty DOM to show Masks & Fluid) */}
            <div className="relative h-full flex items-center justify-center pointer-events-none" />

            {/* Panel 8: Bottom-Middle (Empty DOM to show Fluid Path close up) */}
            <div className="relative h-full flex items-center justify-center pointer-events-none" />

            {/* Panel 9: Bottom-Right (Visual Arts Spline Text + Button) */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, margin: "-20%" }}
              transition={{ duration: 1 }}
              className="flex flex-col items-start justify-center h-full"
            >
              <h2 className="text-xl font-sans font-light tracking-widest text-foreground mb-6 uppercase">
                THE VISUAL ARTS <span className="font-serif italic font-semibold">SPLINE</span>
              </h2>
              <div className="p-8 rounded-[2rem] bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl w-full">
                <p className="text-foreground/60 font-light text-xs leading-relaxed mb-8">
                  A massive, elegant, translucent glowing paint and particle spline winding
                  gracefully down through the depth of the interface, linking elements.
                </p>
                <button 
                  onClick={() => navigate("/search")}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-full font-bold text-[10px] tracking-widest uppercase
                    bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.5)] transition-all duration-300"
                >
                  Explore All Art
                </button>
              </div>
            </motion.div>
          </div>
          
          {/* Diamond Icon Bottom Right */}
          <div className="absolute bottom-10 right-12 opacity-50 flex flex-col items-center">
            <div className="w-2 h-2 bg-white rotate-45" />
          </div>
        </div>

      </div>
    </section>
  );
}
