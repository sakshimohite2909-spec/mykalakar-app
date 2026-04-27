import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronRight, Sparkles, UserPlus } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-24 bg-white/40 relative overflow-hidden">
      {/* Soft Background Glows */}
      <div className="absolute top-0 right-0 w-[40%] h-full bg-orange-100/30 blur-[100px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[40%] h-full bg-amber-100/30 blur-[100px] -z-10" />

      <div className="container mx-auto px-6 max-w-6xl">
        <div className="pastel-card p-12 md:p-20 text-center relative overflow-hidden bg-white shadow-2xl shadow-sky-100/50">
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-10 relative z-10"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-50 text-emerald-500 text-xs font-black uppercase tracking-widest border border-emerald-100">
               <Sparkles className="h-4 w-4" /> Joining Hub Today
            </div>

            <h2 className="text-4xl md:text-7xl font-black text-slate-900 tracking-tight leading-none mx-auto max-w-4xl">
              Ready to <span className="gradient-text italic">experience</span> world-class talent?
            </h2>
            
            <p className="text-xl md:text-2xl text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
              The largest network of professional artists is just a click away. Book now or showcase your talent.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
              <Link to="/register" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-12 py-6 bg-slate-900 text-foreground rounded-[2rem] font-black text-2xl shadow-2xl shadow-slate-200 transition-all hover:scale-105 active:scale-95 hover:bg-orange-500 flex items-center justify-center gap-3">
                  Register <ChevronRight className="h-8 w-8" />
                </button>
              </Link>
              
              <Link to="/artist-login" className="w-full sm:w-auto group">
                <div className="glass-button px-12 py-6 text-2xl flex items-center justify-center gap-3 group-hover:bg-white text-slate-500 hover:text-slate-900 border-2 border-slate-50">
                   <UserPlus className="h-6 w-6" /> Artist Login
                </div>
              </Link>
            </div>
            
            <div className="pt-6 flex flex-col items-center gap-4">
               <div className="h-px w-20 bg-slate-100" />
               <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">
                 No upfront fees for clients • Pay only for the talent
               </p>
            </div>
          </motion.div>

          {/* Decorative small shapes */}
          <div className="absolute top-10 left-10 w-4 h-4 rounded-full bg-sky-200/50 animate-pulse" />
          <div className="absolute bottom-20 right-20 w-8 h-8 rounded-full bg-pink-200/50 animate-bounce" style={{ animationDuration: '3s' }} />
          <div className="absolute top-1/2 left-4 w-2 h-2 rounded-full bg-amber-200/50" />
        </div>
      </div>
    </section>
  );
}
