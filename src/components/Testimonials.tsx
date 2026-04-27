import { motion } from "framer-motion";
import { Star, MessageSquare, Quote, Heart } from "lucide-react";

const testimonials = [
  { 
    name: "Ravi Patel", 
    role: "Wedding Organizer", 
    text: "ArtistHub found me the perfect singer for our high-profile wedding. Unmatched quality and professionalism.", 
    rating: 5, 
    year: "2025",
    color: "bg-orange-50 outline-orange-100 text-orange-500"
  },
  { 
    name: "Pooja Shah", 
    role: "Event Manager", 
    text: "The artists were top-notch and the booking process was incredibly smooth. Our clients were thrilled!", 
    rating: 5, 
    year: "2026",
    color: "bg-pink-50 outline-pink-100 text-pink-500"
  },
  { 
    name: "Anil Deshmukh", 
    role: "College Committee", 
    text: "Our college fest performers were a huge hit. Reliable and easy to coordinate. Highly recommended!", 
    rating: 5, 
    year: "2026",
    color: "bg-emerald-50 outline-emerald-100 text-emerald-500"
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 bg-transparent relative z-20 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-20">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
             <div className="h-2 w-10 rounded-full bg-orange-400" />
             <span className="text-orange-500 font-bold tracking-widest uppercase text-xs">Testimonials</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-none">
             Trusted by <span className="gradient-text italic">Organizers</span>
          </h2>
        </div>
        <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-slate-100 shadow-sm">
           <Heart className="h-4 w-4 text-pink-400 fill-pink-400" />
           <span className="text-slate-400 font-bold text-sm">Join +5,000 happy clients</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {testimonials.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15, duration: 0.6 }}
            className="pastel-card p-10 relative group overflow-hidden bg-white"
          >
            {/* Background Icon Watermark */}
            <div className={`absolute top-10 right-10 opacity-10 group-hover:scale-125 transition-transform duration-700 ${t.color.split(' ').slice(2)[0]}`}>
               <Quote className="h-16 w-16" />
            </div>

            <div className="flex items-center gap-1.5 mb-8">
               {[1,2,3,4,5].map(idx => (
                 <Star key={idx} className="h-3 w-3 fill-amber-400 text-amber-400" />
               ))}
               <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest ml-2 italic">Verified Review</span>
            </div>

            <p className="text-xl text-slate-900 font-bold mb-10 leading-relaxed italic relative z-10">
              "{t.text}"
            </p>

            <div className="flex items-center gap-4 pt-10 border-t border-slate-50 relative z-10">
               <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-black/5 overflow-hidden ${t.color.split(' ').slice(0, 1)[0]}`}>
                  <img src={`https://i.pravatar.cc/150?u=${t.name}`} alt="" className="w-full h-full object-cover" />
               </div>
               <div className="flex-1">
                  <p className="font-black text-slate-900 text-lg tracking-tight leading-none mb-1">{t.name}</p>
                  <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">{t.role}</p>
               </div>
               <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-orange-50 group-hover:scale-110 transition-all">
                  <MessageSquare className="h-4 w-4 text-slate-300 group-hover:text-orange-400" />
               </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
