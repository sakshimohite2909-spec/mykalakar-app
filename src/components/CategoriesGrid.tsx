import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronRight, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";

const pastelColors = [
  "bg-orange-50 border-orange-100/50 text-orange-500",
  "bg-amber-50 border-amber-100/50 text-amber-500",
  "bg-pink-50 border-pink-100/50 text-pink-500",
  "bg-emerald-50 border-emerald-100/50 text-emerald-500",
  "bg-rose-50 border-rose-100/50 text-rose-500",
  "bg-yellow-50 border-yellow-100/50 text-yellow-600",
];

const iconMap: any = {
  Music: "🎵",
  Hands: "🙏",
  Dancer: "💃",
  Palette: "🎨",
  Masks: "🎭",
  Flag: "🚩",
  Amphora: "🏺",
  PartyPopper: "🥳",
  Clapperboard: "🎬",
  Camera: "📷",
};

export default function CategoriesGrid() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qCats = query(collection(db, "categories"), orderBy("name"));
    const unsubCats = onSnapshot(qCats, (catSnap) => {
      const cats = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(cats);
      setLoading(false);
    });
    return () => unsubCats();
  }, []);

  return (
    <section className="py-20 bg-transparent relative z-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
             <div className="h-2 w-10 rounded-full bg-pink-400" />
             <span className="text-pink-500 font-bold tracking-widest uppercase text-xs">Categories</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
             Explore <span className="gradient-text italic">Specialties</span>
          </h2>
        </div>
        <Link to="/search" className="font-bold text-slate-400 hover:text-orange-500 transition-colors flex items-center gap-2">
           Browse all categories <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-orange-400" /></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {categories.map((cat, i) => {
            const colorClass = pastelColors[i % pastelColors.length];
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
                whileHover={{ y: -10 }}
              >
                <Link
                  to={`/search?category=${cat.name}`}
                  className={`flex flex-col items-center justify-center p-8 rounded-[2.5rem] border transition-all group relative overflow-hidden h-64 ${colorClass.split(' ').slice(0, 2).join(' ')}`}
                >
                  <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="z-10 flex flex-col items-center gap-4 text-center">
                     <span className="text-5xl group-hover:scale-125 transition-transform duration-500 transform-gpu group-hover:rotate-6">{iconMap[cat.icon] || cat.icon || "✨"}</span>
                     <div className="space-y-1">
                        <h3 className={`font-black text-xl tracking-tight transition-colors ${colorClass.split(' ').slice(2).join(' ')}`}>{cat.name}</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Creative Hub</p>
                     </div>
                  </div>

                  <div className="absolute bottom-6 right-6 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                     <div className="p-3 rounded-2xl bg-white shadow-lg shadow-black/5">
                        <ChevronRight className={`h-4 w-4 ${colorClass.split(' ').slice(2).join(' ')}`} />
                     </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
}
