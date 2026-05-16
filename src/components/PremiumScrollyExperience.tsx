import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  Camera,
  Drum,
  Mic2,
  Music2,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { CATEGORY_GROUP_OPTIONS } from "@/constants/artistSystem";
import { SmartImage } from "./SmartImage";
import { STATIC_IMAGES } from "@/services/ImageRegistryService";
import { getActiveArtists, getApprovedEvents } from "@/services/dataService";
import { buildArtistCards } from "@/services/marketplaceCards";
import { SpotlightSearch } from "@/components/search/SpotlightSearch";
import { AnimatePresence, LuxuryArtistCard, LuxuryEventCard } from "@/components/discovery/LuxuryDiscovery";

type ShowcaseArtist = Record<string, unknown>;
type CulturalEvent = Record<string, unknown>;

const categoryIcons: Record<string, typeof Music2> = {
  Performers: Mic2,
  "Event Services": Camera,
  "Folk & Traditional Arts": Drum,
  "Spiritual & Varkari Sampraday": Music2,
};

function SectionHeading({ eyebrow, title, action, to }: { eyebrow: string; title: string; action?: string; to?: string }) {
  return (
    <div className="section-heading mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-orange-600">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-extrabold leading-tight text-stone-950 md:text-[30px]">{title}</h2>
      </div>
      {action && to ? (
        <Link to={to} className="inline-flex h-10 w-max items-center gap-2 rounded-full border border-stone-200 bg-white px-4 text-xs font-extrabold text-stone-700 shadow-sm transition hover:border-orange-300 hover:text-orange-600">
          {action}
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

function Hero() {
  const heroImages = useMemo(
    () => [STATIC_IMAGES.heroDhol, STATIC_IMAGES.heroKirtan, STATIC_IMAGES.heroTabla, STATIC_IMAGES.heroZanj],
    []
  );

  return (
    <section className="luxury-home-hero">
      <div className="luxury-home-hero-bg" aria-hidden="true">
        <SmartImage
          src={heroImages[0]}
          alt=""
          usageId="home:luxury-hero:bg"
          category="dhol"
          orientation="landscape"
          priority
          aspectRatio="aspect-auto"
          containerClassName="h-full w-full"
        />
      </div>
      <div className="luxury-home-hero-inner">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="luxury-home-hero-copy"
        >
          <span className="luxury-eyebrow">
            <Zap className="h-4 w-4" />
            Maharashtra artist network
          </span>
          <h1>MyKalakar</h1>
          <p>
            A premium discovery platform for verified artists, cultural mandals, and event-ready creative teams across Maharashtra.
          </p>
          <SpotlightSearch className="luxury-spotlight-search" />
          <div className="luxury-hero-actions">
            <Link to="/artists">
              Discover Artists
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/events">
              Post an Event
              <CalendarDays className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 36, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="luxury-home-hero-showcase"
        >
          {heroImages.slice(1).map((image, index) => (
            <Link key={image} to={index === 0 ? "/events" : "/artists"} className="luxury-showcase-tile">
              <SmartImage
                src={image}
                alt={index === 0 ? "Kirtan performance" : "Artist performance"}
                usageId={`home:luxury-hero:tile:${index}`}
                category={index === 0 ? "kirtan" : "performer"}
                orientation="portrait"
                priority={index === 0}
                aspectRatio="aspect-auto"
                containerClassName="h-full w-full transition duration-700"
              />
              <span>{index === 0 ? "Live briefs" : index === 1 ? "Verified artists" : "Cultural depth"}</span>
            </Link>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function CategoryGrid() {
  return (
    <section className="container-shell app-section content-section rhythm-right">
      <SectionHeading eyebrow="Categories" title="A mosaic of event-ready specialties" action="View all" to="/explore" />
      <div className="category-mosaic">
        {CATEGORY_GROUP_OPTIONS.map((group, index) => {
          const Icon = categoryIcons[group.name] || Sparkles;
          const tileClass = index === 0 ? "mosaic-large" : index < 3 ? "mosaic-medium" : "mosaic-small";
          return (
            <Link
              key={group.id}
              to={`/artists?category=${encodeURIComponent(group.name)}`}
              className={`compact-card category-card group ${tileClass}`}
            >
              <div className="image-wrapper">
                <SmartImage
                  src=""
                  alt={group.name}
                  usageId={`home-category:${group.id}`}
                  category={group.name}
                  orientation="landscape"
                  priority={index < 2}
                  aspectRatio="aspect-auto"
                  containerClassName="h-full w-full transition duration-300 group-hover:scale-[1.03]"
                />
                <div className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white/92 text-orange-600 shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="card-content">
                <h3 className="line-clamp-1 text-lg font-extrabold text-stone-950">{group.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-stone-500">{group.subcategories.slice(0, 4).join(" / ")}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function FeaturedArtistsSection({ artists, loading }: { artists: ShowcaseArtist[]; loading: boolean }) {
  const cards = useMemo(() => buildArtistCards(artists, 8), [artists]);

  return (
    <section className="container-shell app-section content-section rhythm-left luxury-section">
      <SectionHeading eyebrow="Featured Artists" title="Verified talent, ready to book" action="Explore artists" to="/artists" />
      {loading ? (
        <div className="luxury-results-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="luxury-card luxury-skeleton-card">
              <div />
              <span />
              <strong />
              <p />
            </div>
          ))}
        </div>
      ) : cards.length > 0 ? (
        <div className="luxury-results-grid">
          <AnimatePresence mode="popLayout">
            {cards.map((artist, index) => (
              <LuxuryArtistCard key={artist.cardId} artist={artist} index={index} />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-bold text-stone-600">Featured artists are refreshing. Browse the full collection while the spotlight updates.</p>
          <Link to="/artists" className="mt-4 inline-flex h-10 items-center rounded-full bg-stone-950 px-5 text-xs font-extrabold text-white">
            Browse Artists
          </Link>
        </div>
      )}
    </section>
  );
}

function UpcomingEventsSection({ events, loading }: { events: CulturalEvent[]; loading: boolean }) {
  return (
    <section className="container-shell app-section content-section rhythm-right luxury-section">
      <SectionHeading eyebrow="Events" title="Live event briefs ready for artists" action="See events" to="/events" />
      {loading ? (
        <div className="luxury-results-grid event-grid">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="luxury-card luxury-skeleton-card">
              <div />
              <span />
              <strong />
              <p />
            </div>
          ))}
        </div>
      ) : events.length > 0 ? (
        <div className="luxury-results-grid event-grid">
          <AnimatePresence mode="popLayout">
            {events.slice(0, 4).map((event, index) => (
              <LuxuryEventCard key={event.id} event={event} index={index} />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="rounded-lg border border-stone-200 bg-white p-5 text-center shadow-sm">
          <p className="text-sm font-bold text-stone-600">No public briefs are active right now.</p>
          <Link to="/events" className="mt-4 inline-flex h-10 items-center rounded-full bg-orange-600 px-5 text-xs font-extrabold text-white">
            Create an Event
          </Link>
        </div>
      )}
    </section>
  );
}

function CTASection() {
  return (
    <section className="home-cta-section container-shell app-section rhythm-full pb-24">
      <div className="home-cta-panel grid gap-4 overflow-hidden rounded-lg bg-stone-950 p-5 text-white shadow-sm md:grid-cols-[1fr_340px]">
        <div className="py-3">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-orange-300">For artists and organizers</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-extrabold leading-tight text-white md:text-[36px]">One polished profile. Faster event discovery.</h2>
          <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-white/72">
            Build a credible artist presence or publish an event brief and let the platform connect the flow.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/register?role=artist" className="inline-flex h-11 items-center gap-2 rounded-full bg-orange-600 px-5 text-sm font-extrabold text-white transition hover:bg-orange-500">
              <Users className="h-4 w-4" />
              Join as Artist
            </Link>
            <Link to="/events" className="inline-flex h-11 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 text-sm font-extrabold text-white transition hover:bg-white/15">
              Post Event
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <SmartImage src={STATIC_IMAGES.profileCover} alt="Artist performance" usageId="home:cta" category="hero" orientation="landscape" aspectRatio="aspect-video" containerClassName="self-center rounded-lg" />
      </div>
    </section>
  );
}

export default function PremiumScrollyExperience() {
  const [artists, setArtists] = useState<ShowcaseArtist[]>([]);
  const [events, setEvents] = useState<CulturalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([getActiveArtists(8), getApprovedEvents(3)])
      .then(([artistData, eventData]) => {
        if (!mounted) return;
        setArtists(artistData as ShowcaseArtist[]);
        setEvents(eventData as CulturalEvent[]);
      })
      .catch((error) => {
        console.warn("Homepage Firebase data unavailable.", error);
        if (!mounted) return;
        setArtists([]);
        setEvents([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="luxury-page home-page min-h-screen font-sans antialiased">
      <Helmet>
        <title>MyKalakar | Premium Artist Marketplace</title>
        <link rel="preload" as="image" href={STATIC_IMAGES.heroDhol} />
        <link rel="preload" as="image" href={STATIC_IMAGES.heroKirtan} />
      </Helmet>
      <Navbar />
      <main>
        <Hero />
        <CategoryGrid />
        <FeaturedArtistsSection artists={artists} loading={loading} />
        <UpcomingEventsSection events={events} loading={loading} />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
