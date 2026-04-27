import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { Loader2, Sparkles } from "lucide-react";

// Category icon map — falls back to emoji based on name keywords
const getCategoryIcon = (name: string): string => {
  const n = name.toLowerCase();
  if (n.includes("music")) return "🎵";
  if (n.includes("dance")) return "💃";
  if (n.includes("stage") || n.includes("entertainment") || n.includes("comedy")) return "🎭";
  if (n.includes("creative") || n.includes("photo") || n.includes("video")) return "📸";
  if (n.includes("dj")) return "🎧";
  if (n.includes("folk")) return "🪘";
  if (n.includes("classical")) return "🎼";
  if (n.includes("magic")) return "🪄";
  if (n.includes("anchor") || n.includes("host")) return "🎤";
  if (n.includes("decor") || n.includes("floral")) return "🌸";
  if (n.includes("mehndi") || n.includes("henna")) return "🌿";
  if (n.includes("balloon")) return "🎈";
  if (n.includes("fire") || n.includes("stunt")) return "🔥";
  if (n.includes("puppet")) return "🎎";
  if (n.includes("stand")) return "😂";
  return "✨";
};

const events = [
  { id: "1", name: "Marriage", icon: "💒", description: "Complete wedding celebration with all traditional ceremonies" },
  { id: "2", name: "Birthday Party", icon: "🎂", description: "Memorable birthday celebrations for all ages" },
  { id: "3", name: "Corporate Event", icon: "🏢", description: "Professional events, conferences, and company celebrations" },
  { id: "4", name: "Festival Celebration", icon: "🎊", description: "Traditional and cultural festival celebrations" },
  { id: "5", name: "Engagement Ceremony", icon: "💍", description: "Beautiful engagement ceremonies with music and photography" },
];

const EventRequirements = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const eventId = searchParams.get("eventId");
  const district = searchParams.get("district");
  const state = searchParams.get("state");

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedEvent = events.find((e) => e.id === eventId);

  // Fetch ALL categories live from Firestore
  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("name"));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCategories(data);
      setLoading(false);
    }, (err) => {
      console.warn("Categories fetch error:", err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleCategoryClick = (cat: any) => {
    navigate(`/artists?category=${encodeURIComponent(cat.name)}&district=${district}&state=${state}&eventId=${eventId}`);
  };

  if (!selectedEvent) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <Navbar />
        <p className="text-slate-500 text-sm">Event not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col relative bg-transparent font-sans">
      <Navbar />

      <section className="flex-1 py-28 px-4 relative z-10">
        <div className="container mx-auto max-w-6xl">

          {/* Header */}
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
              {selectedEvent.name} <span className="gradient-text-primary">in {district}</span>
            </h1>
            <p className="text-slate-500 max-w-xl mx-auto text-base font-medium leading-relaxed">
              {selectedEvent.description}. Choose an artist category below to discover available talent in your area.
            </p>
          </motion.div>

          {/* Category Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
              <p className="text-orange-600 text-[10px] font-black tracking-[0.2em] uppercase">Curating categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-500 text-sm">No categories found. Please add categories in the admin panel.</p>
            </div>
          ) : (
            <>
              <div className="mb-8 flex items-center gap-3">
                <span className="h-px flex-1 bg-gradient-to-r from-transparent via-orange-200 to-transparent" />
                <span className="text-[10px] font-black tracking-[0.25em] uppercase text-slate-400">All Categories</span>
                <span className="h-px flex-1 bg-gradient-to-l from-transparent via-cyan-200 to-transparent" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mb-12">
                {categories.map((cat, idx) => (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: idx * 0.06, ease: "circOut" }}
                    onClick={() => handleCategoryClick(cat)}
                    className="group relative cursor-pointer rounded-[1.75rem] border border-white/60 bg-white/50 backdrop-blur-xl p-6 text-center shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(255,107,0,0.18)] hover:border-orange-300 hover:bg-white/70 transition-all duration-300 overflow-hidden"
                  >
                    {/* Gloss */}
                    <div className="absolute inset-0 rounded-[1.75rem] bg-gradient-to-br from-white/60 to-transparent pointer-events-none" />
                    {/* Hover glow */}
                    <div className="absolute inset-0 rounded-[1.75rem] bg-gradient-to-br from-orange-100/0 to-amber-100/0 group-hover:from-orange-100/40 group-hover:to-amber-100/30 transition-all duration-500 pointer-events-none" />

                    <div className="relative z-10">
                      <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300 inline-block">
                        {getCategoryIcon(cat.name)}
                      </div>
                      <h3 className="text-sm font-black text-[#1A1A1A] tracking-wide uppercase leading-tight mb-2">
                        {cat.name}
                      </h3>
                      <p className="text-[10px] text-slate-500 font-medium mb-4 leading-relaxed">
                        Available in {district}
                      </p>
                      <div className="w-full py-2.5 rounded-xl border border-orange-200 bg-orange-50/80 text-orange-700 text-[9px] font-black uppercase tracking-widest group-hover:bg-orange-500 group-hover:text-foreground group-hover:border-transparent transition-all duration-300">
                        View Artists →
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Browse All */}
              <div className="text-center">
                <button
                  onClick={() => navigate(`/artists?district=${district}&state=${state}&eventId=${eventId}`)}
                  className="inline-flex items-center gap-2 px-10 py-4 rounded-full border border-white/60 bg-white/50 backdrop-blur-xl text-[11px] font-black uppercase tracking-widest text-[#1A1A1A] hover:bg-white/80 hover:border-orange-200 shadow-sm hover:shadow-md transition-all"
                >
                  Browse All Artists in {district}
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