import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, ChevronLeft, ChevronRight, Heart, MapPin, Star } from "lucide-react";
import { getCategoryGroupForArtistType } from "@/constants/artistSystem";
import { getActiveArtists } from "@/services/dataService";
import { SmartImage } from "@/components/SmartImage";
import { buildArtistCards, type ArtistCardViewModel } from "@/services/marketplaceCards";

interface ArtistCardProps {
  artist: ArtistCardViewModel;
  index?: number;
}

export function ArtistCard({ artist, index = 0 }: ArtistCardProps) {
  const artType = artist.subCategory || "Artist";
  const categoryGroup = getCategoryGroupForArtistType(artType) || artist.category || "Default";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.25), ease: [0.16, 1, 0.3, 1] }}
      className="relative min-w-[320px] snap-center py-6"
    >
      <Link to={`/artist/${artist.artistId}`} className="block h-full">
        <div className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-stone-100 bg-white shadow-[0_18px_50px_rgba(28,25,23,0.08)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_28px_70px_rgba(28,25,23,0.14)]">
          <div className="relative h-48 overflow-hidden">
            <SmartImage
              src={artist.image}
              alt={artist.name || artType}
              usageId={`featured:${artist.cardId}`}
              category={artType || categoryGroup}
              orientation="landscape"
              priority={index < 3}
              aspectRatio="aspect-auto"
              sizes="(max-width: 768px) 320px, 360px"
              containerClassName="h-full w-full transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-60" />
            <div className="absolute bottom-4 left-4 flex flex-col">
              <span className="mb-1 w-fit rounded-lg border border-orange-100 bg-white/90 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-orange-500 backdrop-blur-md">
                {categoryGroup}
              </span>
              <div className="flex w-fit items-center gap-1.5 rounded-lg border border-stone-100 bg-white/90 px-2 py-1 backdrop-blur-md">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="text-xs font-black tracking-tighter text-stone-800">
                  {artist.rating.toFixed(1)} ({artist.reviews} Reviews)
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col space-y-4 p-7">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="flex min-w-0 items-center gap-2">
                  <h3 className="truncate text-2xl font-black leading-none tracking-tight text-stone-950 transition-colors group-hover:text-orange-600">
                    {artist.name || "Premium Artist"}
                  </h3>
                  {artist.verified ? <BadgeCheck className="h-4 w-4 shrink-0 text-orange-500" /> : null}
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-stone-400">{artType}</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-sm bg-stone-50 px-2 py-1 text-xs font-black text-stone-400">
                <MapPin className="h-3.5 w-3.5 text-orange-600" />
                {artist.location.split(",")[0] || "MH"}
              </div>
            </div>

            <p className="line-clamp-3 flex-1 text-sm font-medium leading-relaxed text-stone-500">
              {artist.artist.bio || `Professional ${artType} from ${artist.location}, ready for premium events.`}
            </p>

            <div className="mt-auto flex items-center justify-between border-t border-stone-100 pt-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Event Booking</span>
                <span className="text-2xl font-black text-stone-950">
                  {artist.priceRange}
                </span>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-950 shadow-lg transition-all group-hover:-translate-y-1 group-hover:bg-orange-600">
                <ArrowRight className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <button className="absolute right-4 top-4 rounded-2xl border border-white/40 bg-white/50 p-3 text-stone-700 opacity-0 shadow-2xl backdrop-blur-xl transition-all hover:bg-white hover:text-pink-500 group-hover:translate-y-0 group-hover:opacity-100">
            <Heart className="h-5 w-5" />
          </button>
        </div>
      </Link>
    </motion.div>
  );
}

export default function FeaturedArtists() {
  const [artists, setArtists] = useState<ArtistCardViewModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getActiveArtists(10)
      .then((data) => {
        if (mounted) setArtists(buildArtistCards(data, 12));
      })
      .catch((error) => {
        console.warn("Featured artists unavailable.", error);
        if (mounted) setArtists([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex gap-6 overflow-hidden py-20">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="min-w-[320px] rounded-[32px] border border-stone-100 bg-white">
            <div className="h-48 rounded-t-[32px] skeleton-shimmer" />
            <div className="space-y-4 p-7">
              <div className="h-7 w-2/3 rounded-full skeleton-shimmer" />
              <div className="h-4 w-1/2 rounded-full skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (artists.length === 0) return null;

  return (
    <section className="relative z-10 bg-transparent py-20">
      <div className="mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-1 rounded-full bg-orange-400" />
            <span className="text-sm font-black uppercase tracking-widest text-orange-500">Curated Selection</span>
          </div>
          <h2 className="text-4xl font-black tracking-tight text-stone-950 md:text-5xl">
            Featured <span className="text-orange-600 italic">Artists</span>
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 border-r border-stone-200 pr-4">
            <button className="rounded-full border border-stone-200 p-4 transition-all hover:border-orange-200 hover:bg-orange-50 active:scale-90">
              <ChevronLeft className="h-5 w-5 text-stone-400" />
            </button>
            <button className="rounded-full border border-stone-200 p-4 transition-all hover:border-orange-200 hover:bg-orange-50 active:scale-90">
              <ChevronRight className="h-5 w-5 text-stone-400" />
            </button>
          </div>
          <Link to="/search" className="group flex items-center gap-2 font-bold text-stone-950 transition-colors hover:text-orange-500">
            View all superstars <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      <div className="no-scrollbar flex snap-x gap-6 overflow-x-auto">
        {artists.map((artist, index) => (
          <ArtistCard key={artist.cardId} artist={artist} index={index} />
        ))}
        <div className="min-w-[100px]" />
      </div>
    </section>
  );
}
