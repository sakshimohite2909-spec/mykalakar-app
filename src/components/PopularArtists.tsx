import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { ArtistCard } from "./FeaturedArtists";
import { useState, useEffect } from "react";
import { getActiveArtists } from "@/services/dataService";
import { buildArtistCards, type ArtistCardViewModel } from "@/services/marketplaceCards";

export default function PopularArtists() {
  const [artists, setArtists] = useState<ArtistCardViewModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getActiveArtists(10)
      .then((data) => {
        if (mounted) setArtists(buildArtistCards(data, 12));
      })
      .catch((error) => {
        console.warn("Popular artists unavailable.", error);
        if (mounted) setArtists([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
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
          <ArtistCard key={artist.cardId} artist={artist} index={i} />
        ))}
      </div>
    </section>
  );
}
