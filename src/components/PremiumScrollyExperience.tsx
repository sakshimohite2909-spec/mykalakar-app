import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  Camera,
  Drum,
  Headphones,
  Mic2,
  Music2,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import HeroCarousel from "./HeroCarousel";
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

const HERO_SLIDE_INTERVAL_MS = 4000;

function HeroSlider({ images }: { images: string[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
    }, HERO_SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden" aria-hidden="true">
      {images.map((src, index) => (
        <img
          key={src}
          src={src}
          alt=""
          loading={index === 0 ? "eager" : "lazy"}
          decoding="async"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center center",
            opacity: index === activeIndex ? 1 : 0,
            transition: "opacity 1.2s cubic-bezier(0.4,0,0.2,1)",
            willChange: "opacity",
          }}
        />
      ))}
      {/* Slider dot indicators */}
      <div
        style={{
          position: "absolute",
          bottom: "1.25rem",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "0.5rem",
          zIndex: 5,
        }}
      >
        {images.map((_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            onClick={() => setActiveIndex(index)}
            style={{
              width: index === activeIndex ? "1.75rem" : "0.5rem",
              height: "0.5rem",
              borderRadius: "9999px",
              background: index === activeIndex ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.4)",
              border: "none",
              cursor: "pointer",
              transition: "width 0.4s cubic-bezier(0.4,0,0.2,1), background 0.3s ease",
              padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function Hero() {
  const { t } = useI18n(); // ADDED FOR i18n
  const heroImages = useMemo(
    () => [STATIC_IMAGES.heroDhol, STATIC_IMAGES.heroKirtan, STATIC_IMAGES.heroTabla, STATIC_IMAGES.heroZanj],
    []
  );

  const showcaseSlides = useMemo(() => [
    {
      cards: [
        {
          image: "/assets/curated/dhol-passion.jpg",
          title: t("home.hero.tile.liveBriefs"),
          category: "dhol",
          link: "/artists?category=Folk%20%26%20Traditional%20Arts"
        },
        {
          image: "/assets/curated/manjira-hands.jpg",
          title: t("home.hero.tile.verifiedArtists"),
          category: "manjira",
          link: "/artists?category=Spiritual%20%26%20Varkari%20Sampraday"
        },
        {
          image: "/assets/curated/tabla-hands.jpg",
          title: t("home.hero.tile.culturalDepth"),
          category: "tabla",
          link: "/artists?category=Performers"
        }
      ]
    },
    {
      cards: [
        {
          image: "/assets/curated/tanpura-singer-1.jpg",
          title: t("home.hero.tile.liveBriefs"),
          category: "singers",
          link: "/artists?category=Performers"
        },
        {
          image: "/assets/curated/tanpura-singer-2.jpg",
          title: t("home.hero.tile.verifiedArtists"),
          category: "singers",
          link: "/artists?category=Performers"
        },
        {
          image: STATIC_IMAGES.heroKirtan,
          title: t("home.hero.tile.culturalDepth"),
          category: "kirtan",
          link: "/artists?category=Spiritual%20%26%20Varkari%20Sampraday"
        }
      ]
    },
    {
      cards: [
        {
          image: STATIC_IMAGES.heroDhol,
          title: t("home.hero.tile.liveBriefs"),
          category: "dhol",
          link: "/artists?category=Folk%20%26%20Traditional%20Arts"
        },
        {
          image: STATIC_IMAGES.heroTabla,
          title: t("home.hero.tile.verifiedArtists"),
          category: "tabla",
          link: "/artists?category=Performers"
        },
        {
          image: STATIC_IMAGES.heroZanj,
          title: t("home.hero.tile.culturalDepth"),
          category: "zanj",
          link: "/artists?category=Spiritual%20%26%20Varkari%20Sampraday"
        }
      ]
    }
  ], [t]);

  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % showcaseSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [showcaseSlides.length]);

  return (
    <section className="luxury-home-hero mt-6">
      {/* Auto-playing 4K hero image slider */}
      <div className="luxury-home-hero-bg" aria-hidden="true" style={{ position: "relative" }}>
        <HeroSlider images={heroImages} />
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
          className="w-full flex flex-col justify-end"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="luxury-home-hero-showcase w-full"
            >
              {showcaseSlides[activeSlide].cards.map((card, index) => (
                <Link
                  key={card.image}
                  to={card.link}
                  className="luxury-showcase-tile group hover:scale-[1.015] active:scale-[0.99] transition duration-300"
                >
                  <SmartImage
                    src={card.image}
                    alt={card.title}
                    usageId={`home:luxury-hero:curated-tile:${activeSlide}-${index}`}
                    category={card.category}
                    orientation="portrait"
                    priority={index === 0}
                    aspectRatio="aspect-auto"
                    containerClassName="h-full w-full transition duration-700"
                    imageClassName="object-cover object-center"
                  />
                  <span>{card.title}</span>
                </Link>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Elegant slider indicators */}
          <div className="flex justify-center gap-2 mt-4 md:mt-6 z-10">
            {showcaseSlides.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActiveSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === activeSlide
                    ? "w-8 bg-gradient-to-r from-orange-500 to-amber-500 shadow-md"
                    : "w-2 bg-stone-500/30 hover:bg-stone-500/50"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
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
      <div className="scrollbar-none flex overflow-x-auto snap-x snap-mandatory gap-3 pb-4 md:pb-0 md:grid md:grid-cols-3 lg:grid-cols-4 md:gap-4 lg:gap-6 md:overflow-visible">
        {CATEGORY_GROUP_OPTIONS.map((group, index) => {
          const Icon = categoryIcons[group.name] || Sparkles;
          const groupLabel = getArtLabel(t, group.name); // ADDED FOR i18n
          return (
            <Link
              key={group.id}
              to={`/artists?category=${encodeURIComponent(group.name)}`}
              className="relative flex flex-col h-full w-[38%] shrink-0 snap-start md:w-auto md:shrink overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-all duration-300 hover:border-orange-300 hover:shadow-md hover:-translate-y-1 group"
            >
              {/* Image area (aspect-[4/3]) */}
              <div className="w-full aspect-[4/3] relative overflow-hidden bg-stone-50 rounded-t-xl">
                <SmartImage
                  src={group.image}
                  alt={group.name}
                  usageId={`home-category:${group.id}`}
                  category={group.name}
                  orientation="landscape"
                  priority={index < 2}
                  aspectRatio="aspect-auto"
                  containerClassName="h-full w-full transition duration-300 group-hover:scale-105"
                  imageClassName="object-center"
                />
                <div className="absolute top-2.5 left-2.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm border border-stone-100 text-orange-600 transition-transform duration-300 group-hover:scale-110">
                  <Icon className="h-3 w-3" />
                </div>
              </div>

              {/* Text content area */}
              <div className="p-4 md:p-5 flex-grow flex flex-col justify-between bg-white border-t border-stone-100 text-left">
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-1 leading-snug">
                    {groupLabel}
                  </h3>
                  <p className="text-sm font-normal text-gray-500 line-clamp-3 leading-relaxed">
                    {group.subcategories.map((item) => getArtLabel(t, item)).join(" / ")}
                  </p>
                </div>
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
              <LuxuryEventCard key={(event.id as string) || index} event={event} index={index} />
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
    <section className="home-cta-section container-shell app-section rhythm-full pb-24 relative overflow-hidden">
      {/* Ambient glowing gradient orbs */}
      <div className="absolute left-[10%] top-[10%] h-[240px] w-[240px] rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.18)_0%,rgba(245,158,11,0.08)_50%,transparent_100%)] blur-2xl pointer-events-none -z-10" />
      <div className="absolute right-[15%] bottom-[5%] h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.18)_0%,rgba(234,88,12,0.06)_50%,transparent_100%)] blur-2xl pointer-events-none -z-10" />

      <div className="home-cta-panel grid gap-4 rounded-3xl p-6 md:p-10 shadow-lg md:grid-cols-[1fr_340px] relative z-10">
        <div className="py-3">
          <p className="eyebrow-text text-[11px] font-extrabold uppercase tracking-widest text-orange-600">{t("home.cta.eyebrow")}</p> {/* ADDED FOR i18n */}
          <h2 className="mt-2 max-w-2xl text-3xl font-extrabold leading-tight text-stone-900 md:text-[36px]">{t("home.cta.title")}</h2> {/* ADDED FOR i18n */}
          <p className="sub-text mt-3 max-w-xl text-sm font-semibold leading-6 text-stone-600">
            {t("home.cta.text")} {/* ADDED FOR i18n */}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/register?role=artist" className="btn-join-artist inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-extrabold text-orange-600 border border-orange-200/50 shadow-sm transition-all duration-300 hover:bg-orange-600 hover:text-white hover:border-orange-600 hover:shadow-lg hover:shadow-orange-500/20 active:scale-[0.98]">
              <Users className="h-4 w-4" />
              {t("nav.joinArtist")} {/* ADDED FOR i18n */}
            </Link>
            <Link to="/events" className="btn-post-event inline-flex h-11 items-center gap-2 rounded-full border border-stone-200 bg-stone-100/40 px-5 text-sm font-extrabold text-stone-900 transition-all duration-300 hover:bg-stone-200/60 active:scale-[0.98]">
              {t("events.postEvent")} {/* ADDED FOR i18n */}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <SmartImage src={STATIC_IMAGES.profileCover} alt={t("home.hero.altArtist")} usageId="home:cta" category="hero" orientation="landscape" aspectRatio="aspect-video" containerClassName="self-center rounded-2xl overflow-hidden shadow-lg border border-white/20" /> {/* ADDED FOR i18n */}
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
        <title>{t("home.meta.title")}</title>
      </Helmet>
      <Navbar />
      <main>
        <HeroCarousel />
        <FeaturesBanner />
        <FeaturedArtistsSection artists={artists} loading={loading} />
        <UpcomingEventsSection events={events} loading={loading} />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

function FeaturesBanner() {
  const { t } = useI18n();
  return (
    <section className="mx-auto mt-6 w-full max-w-[1240px] px-4 md:px-6">
      <div className="bg-white border border-stone-200 shadow-sm rounded-[20px] px-6 py-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {/* Col 1 */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-650 shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-stone-900 leading-tight">
              {t("features.artists.title")}
            </h4>
            <p className="text-[11px] text-stone-500 font-semibold mt-0.5">
              {t("features.artists.desc")}
            </p>
          </div>
        </div>

        {/* Col 2 */}
        <div className="flex items-center gap-3 border-t sm:border-t-0 md:border-l border-stone-100 pt-4 sm:pt-0 md:pl-6">
          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-650 shrink-0">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-stone-900 leading-tight">
              {t("features.events.title")}
            </h4>
            <p className="text-[11px] text-stone-500 font-semibold mt-0.5">
              {t("features.events.desc")}
            </p>
          </div>
        </div>

        {/* Col 3 */}
        <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-stone-100 pt-4 md:pt-0 md:pl-6">
          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-650 shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-stone-900 leading-tight">
              {t("features.platform.title")}
            </h4>
            <p className="text-[11px] text-stone-500 font-semibold mt-0.5">
              {t("features.platform.desc")}
            </p>
          </div>
        </div>

        {/* Col 4 */}
        <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-stone-100 pt-4 md:pt-0 md:pl-6">
          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-650 shrink-0">
            <Headphones className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-stone-900 leading-tight">
              {t("features.support.title")}
            </h4>
            <p className="text-[11px] text-stone-500 font-semibold mt-0.5">
              {t("features.support.desc")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
