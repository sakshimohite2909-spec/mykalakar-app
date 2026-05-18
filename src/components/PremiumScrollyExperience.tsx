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
import { useI18n } from "@/i18n/I18nProvider";
import { getArtLabel } from "@/lib/artLabels";

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
  const { t } = useI18n(); // ADDED FOR i18n
  const heroImages = useMemo(
    () => [STATIC_IMAGES.heroDhol, STATIC_IMAGES.heroKirtan, STATIC_IMAGES.heroTabla, STATIC_IMAGES.heroZanj],
    []
  );
  const tileLabels = [t("home.hero.tile.liveBriefs"), t("home.hero.tile.verifiedArtists"), t("home.hero.tile.culturalDepth")]; // ADDED FOR i18n

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
            {t("brand.tagline")} {/* ADDED FOR i18n */}
          </span>
          <h1>{t("brand.name")}</h1> {/* ADDED FOR i18n */}
          <p>
            {t("home.hero.subtitle")} {/* ADDED FOR i18n */}
          </p>
          <SpotlightSearch className="luxury-spotlight-search" />
          <div className="luxury-hero-actions">
            <Link to="/artists">
              {t("home.hero.discoverArtists")} {/* ADDED FOR i18n */}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/events">
              {t("events.postEvent")} {/* ADDED FOR i18n */}
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
                alt={index === 0 ? t("home.hero.altKirtan") : t("home.hero.altArtist")} // ADDED FOR i18n
                usageId={`home:luxury-hero:tile:${index}`}
                category={index === 0 ? "kirtan" : "performer"}
                orientation="portrait"
                priority={index === 0}
                aspectRatio="aspect-auto"
                containerClassName="h-full w-full transition duration-700"
              />
              <span>{tileLabels[index]}</span> {/* ADDED FOR i18n */}
            </Link>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function CategoryGrid() {
  const { t } = useI18n(); // ADDED FOR i18n
  return (
    <section className="container-shell app-section content-section rhythm-right">
      <SectionHeading eyebrow={t("home.categories.eyebrow")} title={t("home.categories.title")} action={t("common.viewAll")} to="/explore" /> {/* ADDED FOR i18n */}
      <div className="category-mosaic">
        {CATEGORY_GROUP_OPTIONS.map((group, index) => {
          const Icon = categoryIcons[group.name] || Sparkles;
          const tileClass = index === 0 ? "mosaic-large" : index < 3 ? "mosaic-medium" : "mosaic-small";
          const groupLabel = getArtLabel(t, group.name); // ADDED FOR i18n
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
                <h3 className="line-clamp-1 text-lg font-extrabold text-stone-950">{groupLabel}</h3> {/* ADDED FOR i18n */}
                <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-stone-500">{group.subcategories.slice(0, 4).map((item) => getArtLabel(t, item)).join(" / ")}</p> {/* ADDED FOR i18n */}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function FeaturedArtistsSection({ artists, loading }: { artists: ShowcaseArtist[]; loading: boolean }) {
  const { t } = useI18n(); // ADDED FOR i18n
  const cards = useMemo(() => buildArtistCards(artists, 8), [artists]);

  return (
    <section className="container-shell app-section content-section rhythm-left luxury-section">
      <SectionHeading eyebrow={t("home.featured.eyebrow")} title={t("home.featured.title")} action={t("home.featured.action")} to="/artists" /> {/* ADDED FOR i18n */}
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
          <p className="text-sm font-bold text-stone-600">{t("home.featured.empty")}</p> {/* ADDED FOR i18n */}
          <Link to="/artists" className="mt-4 inline-flex h-10 items-center rounded-full bg-stone-950 px-5 text-xs font-extrabold text-white">
            {t("home.featured.browse")} {/* ADDED FOR i18n */}
          </Link>
        </div>
      )}
    </section>
  );
}

function UpcomingEventsSection({ events, loading }: { events: CulturalEvent[]; loading: boolean }) {
  const { t } = useI18n(); // ADDED FOR i18n
  return (
    <section className="container-shell app-section content-section rhythm-right luxury-section">
      <SectionHeading eyebrow={t("events.availableEyebrow")} title={t("home.events.title")} action={t("home.events.action")} to="/events" /> {/* ADDED FOR i18n */}
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
          <p className="text-sm font-bold text-stone-600">{t("home.events.empty")}</p> {/* ADDED FOR i18n */}
          <Link to="/events" className="mt-4 inline-flex h-10 items-center rounded-full bg-orange-600 px-5 text-xs font-extrabold text-white">
            {t("home.events.create")} {/* ADDED FOR i18n */}
          </Link>
        </div>
      )}
    </section>
  );
}

function CTASection() {
  const { t } = useI18n(); // ADDED FOR i18n
  return (
    <section className="home-cta-section container-shell app-section rhythm-full pb-24">
      <div className="home-cta-panel grid gap-4 overflow-hidden rounded-lg bg-stone-950 p-5 text-white shadow-sm md:grid-cols-[1fr_340px]">
        <div className="py-3">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-orange-300">{t("home.cta.eyebrow")}</p> {/* ADDED FOR i18n */}
          <h2 className="mt-2 max-w-2xl text-3xl font-extrabold leading-tight text-white md:text-[36px]">{t("home.cta.title")}</h2> {/* ADDED FOR i18n */}
          <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-white/72">
            {t("home.cta.text")} {/* ADDED FOR i18n */}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/register?role=artist" className="inline-flex h-11 items-center gap-2 rounded-full bg-orange-600 px-5 text-sm font-extrabold text-white transition hover:bg-orange-500">
              <Users className="h-4 w-4" />
              {t("nav.joinArtist")} {/* ADDED FOR i18n */}
            </Link>
            <Link to="/events" className="inline-flex h-11 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 text-sm font-extrabold text-white transition hover:bg-white/15">
              {t("events.postEvent")} {/* ADDED FOR i18n */}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <SmartImage src={STATIC_IMAGES.profileCover} alt={t("home.hero.altArtist")} usageId="home:cta" category="hero" orientation="landscape" aspectRatio="aspect-video" containerClassName="self-center rounded-lg" /> {/* ADDED FOR i18n */}
      </div>
    </section>
  );
}

export default function PremiumScrollyExperience() {
  const { t } = useI18n(); // ADDED FOR i18n
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
        <title>{t("home.meta.title")}</title> {/* ADDED FOR i18n */}
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
