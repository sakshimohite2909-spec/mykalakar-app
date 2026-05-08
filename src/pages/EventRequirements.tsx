/**
 * EventRequirements.tsx
 *
 * Fixes applied:
 *  1. Removed `overflow-y-auto` from root div (conflicted with Lenis smooth scroll → blank screen)
 *  2. Fixed the "event not found" early-return layout (Navbar was inside flex center)
 *  3. Categories now come from useMasterData() → Firestore master_data with hardcoded fallback
 *  4. Added a solid light background so the page is never transparent-white
 */
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Loader2, Sparkles, ArrowLeft } from "lucide-react";
import { useMasterData } from "@/contexts/MasterDataContext";

const EVENTS = [
  { id: "1", name: "Marriage",            icon: "💍", description: "Complete wedding celebration with all traditional ceremonies" },
  { id: "2", name: "Birthday Party",      icon: "🎂", description: "Memorable birthday celebrations for all ages" },
  { id: "3", name: "Corporate Event",     icon: "🏢", description: "Professional events, conferences, and company celebrations" },
  { id: "4", name: "Festival Celebration",icon: "🎊", description: "Traditional and cultural festival celebrations" },
  { id: "5", name: "Engagement Ceremony", icon: "💍", description: "Beautiful engagement ceremonies with music and photography" },
];

const EventRequirements = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const eventId  = searchParams.get("eventId");
  const district = searchParams.get("district") || "";
  const state    = searchParams.get("state")    || "";

  const { categoryGroups, loading: masterLoading } = useMasterData();

  // Brief shimmer delay so the Lenis animation has time to settle
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 150);
    return () => window.clearTimeout(t);
  }, []);

  const selectedEvent = EVENTS.find((e) => e.id === eventId);

  const handleCategoryClick = (categoryName: string) => {
    const params = new URLSearchParams({ category: categoryName, district, state, eventId: eventId ?? "" });
    navigate(`/artists?${params.toString()}`);
  };

  // ── NOT FOUND ────────────────────────────────────────────────────────────────
  if (!selectedEvent) {
    return (
      <div className="min-h-screen w-full flex flex-col relative font-sans" style={{ background: "var(--app-background)" }}>
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-6 py-32 px-4">
          <div className="text-6xl">🎭</div>
          <h1 className="text-2xl font-black text-[#1A1A1A] tracking-tight">Event not found</h1>
          <p className="text-slate-500 text-sm text-center max-w-xs">
            We couldn't find that event. Please go back and select a valid event type.
          </p>
          <button
            type="button"
            onClick={() => navigate("/events")}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full gradient-bg text-white text-sm font-bold tracking-wide shadow-md hover:opacity-90 transition-opacity"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Events
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  // ── NORMAL RENDER ────────────────────────────────────────────────────────────
  const isLoading = !ready || masterLoading;

  return (
    // KEY FIX: removed `overflow-y-auto` — Lenis controls document scroll globally.
    // Using bg-[var(--app-background)] so the page is never a blank white screen.
    <div className="min-h-screen w-full flex flex-col relative font-sans" style={{ background: "var(--app-background)" }}>
      <Navbar />

      <section className="flex-1 py-28 px-4 relative z-10">
        <div className="container mx-auto max-w-6xl">

          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "circOut" }}
            className="text-center mb-14"
          >
            <div className="text-7xl mb-5">{selectedEvent.icon}</div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-200 bg-orange-50 text-orange-600 backdrop-blur-md shadow-sm text-xs font-black tracking-[0.2em] uppercase mb-5">
              <Sparkles className="h-3 w-3" /> Select Artist Category
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-[#1A1A1A] tracking-tight mb-3">
              {selectedEvent.name}{" "}
              <span className="gradient-text-primary">in {district || "your area"}</span>
            </h1>
            <p className="text-slate-500 max-w-xl mx-auto text-base font-medium leading-relaxed">
              {selectedEvent.description}. Choose an artist category below to discover available talent in your area.
            </p>
          </motion.div>

          {/* ── Loading ── */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
              <p className="text-orange-600 text-[10px] font-black tracking-[0.2em] uppercase">
                Curating categories…
              </p>
            </div>
          ) : (
            <>
              {/* ── Section divider ── */}
              <div className="mb-8 flex items-center gap-3">
                <span className="h-px flex-1 bg-gradient-to-r from-transparent via-orange-200 to-transparent" />
                <span className="text-[10px] font-black tracking-[0.25em] uppercase text-slate-400">
                  All Categories
                </span>
                <span className="h-px flex-1 bg-gradient-to-l from-transparent via-rose-200 to-transparent" />
              </div>

              {/* ── Category grid ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
                {categoryGroups.map((group, index) => (
                  <motion.button
                    type="button"
                    key={group.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.06, ease: "circOut" }}
                    onClick={() => handleCategoryClick(group.name)}
                    className="group relative cursor-pointer rounded-[1.75rem] border border-white/60 bg-white/55 backdrop-blur-xl p-6 text-center shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(255,107,0,0.18)] hover:border-orange-300 hover:bg-white/75 transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 rounded-[1.75rem] bg-gradient-to-br from-white/60 to-transparent pointer-events-none" />
                    <div className="absolute inset-0 rounded-[1.75rem] bg-gradient-to-br from-orange-100/0 to-amber-100/0 group-hover:from-orange-100/40 group-hover:to-amber-100/30 transition-all duration-500 pointer-events-none" />

                    <div className="relative z-10">
                      <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300 inline-block">
                        {group.icon || "✨"}
                      </div>
                      <h3 className="text-sm font-black text-[#1A1A1A] tracking-wide uppercase leading-tight mb-2">
                        {group.name}
                      </h3>
                      <p className="text-[10px] text-slate-500 font-medium mb-4 leading-relaxed">
                        {group.categories.slice(0, 4).join(" · ")}
                        {group.categories.length > 4 ? ` · +${group.categories.length - 4} more` : ""}
                      </p>
                      <div className="w-full py-2.5 rounded-xl border border-orange-200 bg-orange-50/80 text-orange-700 text-[9px] font-black uppercase tracking-widest group-hover:bg-orange-500 group-hover:text-white group-hover:border-transparent transition-all duration-300">
                        View Artists
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* ── Browse all button ── */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/artists?district=${encodeURIComponent(district)}&state=${encodeURIComponent(state)}&eventId=${eventId ?? ""}`
                    )
                  }
                  className="inline-flex items-center gap-2 px-10 py-4 rounded-full border border-white/60 bg-white/50 backdrop-blur-xl text-[11px] font-black uppercase tracking-widest text-[#1A1A1A] hover:bg-white/80 hover:border-orange-200 shadow-sm hover:shadow-md transition-all"
                >
                  Browse All Artists in {district || "your area"}
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default EventRequirements;
