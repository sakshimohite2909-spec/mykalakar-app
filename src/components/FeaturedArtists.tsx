import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Star, Play, Plus, ThumbsUp, ChevronDown, BadgeCheck, Loader2, ChevronRight, Heart, MapPin, Share2 } from "lucide-react";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, limit, onSnapshot } from "firebase/firestore";

interface ArtistCardProps {
  artist: any;
  index?: number;
}

export function ArtistCard({ artist, index = 0 }: ArtistCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="relative min-w-[320px] snap-center py-6"
    >
      <Link to={`/artist/${artist.id}`} className="block h-full">
        <div className="pastel-card h-full flex flex-col group bg-white shadow-xl hover:shadow-2xl hover:shadow-sky-100 transition-all duration-500 overflow-hidden rounded-[2rem] border-white ring-1 ring-slate-100">
          
          {/* Cover Media */}
          <div className="relative h-48 overflow-hidden">
            <img
              src={artist.coverPhoto || artist.profilePhoto || `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop`}
              alt={artist.name}
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-60" />
            
            <div className="absolute bottom-4 left-4 flex flex-col">
               <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg w-fit mb-1 border border-orange-100">
                  {artist.category}
               </span>
               <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/90 backdrop-blur-md border border-slate-100 w-fit">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-black text-slate-800 tracking-tighter">4.9 (24 Reviews)</span>
               </div>
            </div>
          </div>

          <div className="p-7 space-y-4 flex-1 flex flex-col">
             <div className="flex items-start justify-between">
                <div className="space-y-1">
                   <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none group-hover:text-primary transition-colors">
                         {artist.name}
                      </h3>
                      {artist.verified && (
                        <div className="p-0.5 rounded-full bg-orange-50 border border-orange-100">
                           <BadgeCheck className="h-4 w-4 text-orange-500 fill-orange-100" />
                        </div>
                      )}
                   </div>
                   <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{artist.subcategory}</p>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-black bg-slate-50 px-2 py-1 rounded-sm">
                   <MapPin className="h-3.5 w-3.5 text-primary" />
                   {artist.district?.split(' ')[0]}
                </div>
             </div>
             
             {/* Bio Section */}
             <p className="text-slate-500 text-sm font-medium line-clamp-3 leading-relaxed flex-1">
                {artist.bio || `Professional ${artist.subcategory} from ${artist.district}, bringing a unique energy to every event with years of expertise.`}
             </p>

             <div className="pt-6 mt-auto border-t border-slate-50 flex items-center justify-between">
                <div className="flex flex-col">
                   <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">Event Booking</span>
                   <span className="text-2xl font-black text-slate-900">₹{artist.startingPrice || "5,000"}<span className="text-xs text-slate-400 ml-1">/ session</span></span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center group-hover:bg-primary transition-all shadow-lg group-hover:shadow-primary/30 translate-y-0 group-hover:-translate-y-1">
                   <ArrowRight className="h-6 w-6 text-foreground" />
                </div>
             </div>
          </div>

          {/* Side floating heart */}
          <button className="absolute top-4 right-4 p-3 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/40 text-foreground hover:bg-white hover:text-pink-500 transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 shadow-2xl">
             <Heart className="h-5 w-5" />
          </button>
        </div>
      </Link>
    </motion.div>
  );
}

export default function FeaturedArtists() {
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "pending_registrations"),
      where("status", "==", "approved"),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setArtists(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return (
    <div className="py-20 flex justify-center bg-transparent">
      <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
    </div>
  );

  if (artists.length === 0) return null;

  return (
    <section className="py-20 bg-transparent relative z-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="h-10 w-1 rounded-full bg-orange-400" />
             <span className="text-orange-500 font-black tracking-widest uppercase text-sm">Curated Selection</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-none">
             Featured <span className="gradient-text italic">Artists</span>
          </h2>
        </div>
        
        <div className="flex items-center gap-4">
           {/* Slider Controls */}
           <div className="flex items-center gap-2 pr-4 border-r border-slate-200">
              <button className="p-4 rounded-full border border-slate-200 hover:border-orange-200 hover:bg-orange-50 transition-all group active:scale-90">
                 <ChevronLeft className="h-5 w-5 text-slate-400 group-hover:text-orange-500" />
              </button>
              <button className="p-4 rounded-full border border-slate-200 hover:border-orange-200 hover:bg-orange-50 transition-all group active:scale-90">
                 <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-orange-500" />
              </button>
           </div>
           <Link to="/search" className="font-bold text-slate-900 group flex items-center gap-2 hover:text-orange-500 transition-colors">
              View all superstars <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
           </Link>
        </div>
      </div>

      <div className="row-slider">
        {artists.map((artist, i) => (
          <ArtistCard key={artist.id} artist={artist} index={i} />
        ))}
        {/* Placeholder for more spacing at the end */}
        <div className="min-w-[100px]" />
      </div>
    </section>
  );
}

import { ChevronLeft, ArrowRight as ArrowRightIcon } from "lucide-react";
const ArrowRight = ArrowRightIcon;
