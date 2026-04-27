import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { TrendingUp, Loader2, ChevronRight } from "lucide-react";
import { ArtistCard } from "./FeaturedArtists";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, limit, onSnapshot } from "firebase/firestore";

export default function PopularArtists() {
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

  if (loading) return null;
  if (artists.length === 0) return null;

  return (
    <section className="py-10 bg-background relative z-10">
      <h2 className="section-title flex items-center gap-2 group cursor-pointer inline-flex">
        Top Picks for You
        <ChevronRight className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
      </h2>

      <div className="netflix-row">
        {artists.map((artist, i) => (
          <ArtistCard key={artist.id} artist={artist} index={i} />
        ))}
      </div>
    </section>
  );
}
