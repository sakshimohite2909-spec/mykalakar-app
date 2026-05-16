import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, CalendarDays, Search, Sparkles, UsersRound } from "lucide-react";
import { LayoutGroup, motion } from "framer-motion";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SmartImage } from "@/components/SmartImage";
import { ImageRegistryService } from "@/services/ImageRegistryService";
import { getActiveArtistsPage, getApprovedEvents } from "@/services/dataService";
import { filterEvents } from "@/services/filterEngine";
import { useMarketplaceFilters } from "@/hooks/useMarketplaceFilters";
import { buildArtistCards, filterArtistCards, type ArtistCardViewModel } from "@/services/marketplaceCards";
import {
  AnimatePresence,
  LuxuryArtistCard,
  LuxuryEmptyState,
  LuxuryEventCard,
  LuxuryFilterBar,
} from "@/components/discovery/LuxuryDiscovery";

type ExploreTab = "artists" | "events";
type EventRecord = Record<string, unknown>;

const DEFAULT_EVENT_TYPES = ["Wedding", "Festival", "Corporate", "Spiritual", "Birthday"];

function getHeroImage(tab: ExploreTab) {
  return ImageRegistryService.getMappedImage(tab === "events" ? "Marriage" : "Kirtankar") || ImageRegistryService.getBestImage("Kirtankar", "artist");
}

function splitParam(value: string | null) {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeLocation(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function compact(values: unknown[]) {
  const seen = new Set<string>();
  return values
    .flat()
    .map((value) => String(value ?? "").trim())
    .filter((value) => {
      const key = value.toLowerCase();
      if (!value || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function artistMatchesLocation(artist: ArtistCardViewModel, state: string, district: string) {
  const values = [
    artist.location,
    artist.artist?.location,
    artist.artist?.district,
    artist.artist?.city,
    artist.artist?.state,
    artist.artist?.artistProfile?.location,
  ].map(normalizeLocation).filter(Boolean);

  const matchesState = !state || values.some((value) => value.includes(normalizeLocation(state)));
  const matchesDistrict = !district || values.some((value) => value.includes(normalizeLocation(district)));
  return matchesState && matchesDistrict;
}

async function getInitialArtistCollection() {
  const firstPage = await getActiveArtistsPage(50);
  const items = [...(firstPage.items as Record<string, unknown>[])];
  let cursor = firstPage.nextCursor;
  let hasMore = firstPage.hasMore;
  let pageCount = 1;

  while (hasMore && cursor && pageCount < 4) {
    const nextPage = await getActiveArtistsPage(50, cursor);
    items.push(...(nextPage.items as Record<string, unknown>[]));
    cursor = nextPage.nextCursor;
    hasMore = nextPage.hasMore;
    pageCount += 1;
  }

  return { items, cursor, hasMore };
}

function ResultSkeleton({ type }: { type: ExploreTab }) {
  return (
    <div className="luxury-results-grid">
      {Array.from({ length: type === "artists" ? 8 : 6 }).map((_, index) => (
        <div key={index} className="luxury-card luxury-skeleton-card">
          <div />
          <span />
          <strong />
          <p />
        </div>
      ))}
    </div>
  );
}

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const routeState = params.get("state") || "";
  const routeDistrict = params.get("district") || "";
  const routeEventId = params.get("eventId") || "";
  const routeType = params.get("type") || "";
  const [activeTab, setActiveTab] = useState<ExploreTab>(() => (params.get("tab") === "events" ? "events" : "artists"));
  const { filters, debouncedFilters, applyFilters, resetFilters } = useMarketplaceFilters(
    {
      query: params.get("q") || "",
      category: params.get("category"),
      subCategory: params.get("subcategory"),
      categories: compact([params.get("category"), ...splitParam(params.get("categories"))]),
      subCategories: compact([params.get("subcategory"), ...splitParam(params.get("subcategories"))]),
      tags: splitParam(params.get("tags")),
      eventTypes: compact([routeType, ...splitParam(params.get("eventTypes"))]),
    },
    150,
  );
  const [artists, setArtists] = useState<Record<string, unknown>[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [artistCursor, setArtistCursor] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMoreArtists, setHasMoreArtists] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const next = new URLSearchParams();
    if (activeTab === "events") next.set("tab", "events");
    if (filters.query) next.set("q", filters.query);
    if (filters.category) next.set("category", filters.category);
    if (filters.subCategory) next.set("subcategory", filters.subCategory);
    if (filters.categories?.length) next.set("categories", filters.categories.join(","));
    if (filters.subCategories?.length) next.set("subcategories", filters.subCategories.join(","));
    if (filters.tags?.length) next.set("tags", filters.tags.join(","));
    if (filters.eventTypes?.length) next.set("eventTypes", filters.eventTypes.join(","));
    if (routeState) next.set("state", routeState);
    if (routeDistrict) next.set("district", routeDistrict);
    if (routeEventId) next.set("eventId", routeEventId);
    if (routeType) next.set("type", routeType);
    setParams(next, { replace: true });
  }, [activeTab, filters, routeDistrict, routeEventId, routeState, routeType, setParams]);

  useEffect(() => {
    let mounted = true;
    Promise.all([getInitialArtistCollection(), getApprovedEvents()])
      .then(([artistPage, eventData]) => {
        if (!mounted) return;
        setArtists(artistPage.items);
        setArtistCursor(artistPage.cursor);
        setHasMoreArtists(artistPage.hasMore);
        setEvents(eventData as EventRecord[]);
        setError(null);
      })
      .catch((err) => {
        console.warn("Explore data unavailable.", err);
        if (mounted) setError("Discovery data is unavailable right now.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const loadMoreArtists = async () => {
    if (!hasMoreArtists || loadingMore) return;
    setLoadingMore(true);
    try {
      const artistPage = await getActiveArtistsPage(50, artistCursor);
      setArtists((current) => [...current, ...(artistPage.items as Record<string, unknown>[])]);
      setArtistCursor(artistPage.nextCursor);
      setHasMoreArtists(artistPage.hasMore);
    } catch (err) {
      console.warn("More artists unavailable.", err);
      setError("More artists are unavailable right now.");
    } finally {
      setLoadingMore(false);
    }
  };

  const artistCards = useMemo(() => buildArtistCards(artists), [artists]);
  const filteredArtists = useMemo(() => filterArtistCards(artistCards, debouncedFilters), [artistCards, debouncedFilters]);
  const locationMatchedArtists = useMemo(
    () => filteredArtists.filter((artist) => artistMatchesLocation(artist, routeState, routeDistrict)),
    [filteredArtists, routeDistrict, routeState],
  );
  const hasLocationContext = Boolean(routeState || routeDistrict);
  const isLocationFallback = hasLocationContext && locationMatchedArtists.length === 0 && filteredArtists.length > 0;
  const visibleArtists = isLocationFallback ? filteredArtists : locationMatchedArtists;
  const filteredEvents = useMemo(() => filterEvents(events, debouncedFilters), [events, debouncedFilters]);
  const resultCount = activeTab === "artists" ? visibleArtists.length : filteredEvents.length;
  const tagOptions = useMemo(
    () =>
      compact([
        ...artistCards.flatMap((artist) => artist.tags),
        ...events.flatMap((event) => [event.tags, event.keywords]),
      ]),
    [artistCards, events],
  );
  const eventTypeOptions = useMemo(
    () =>
      compact([
        ...DEFAULT_EVENT_TYPES,
        ...artistCards.flatMap((artist) => artist.eventTypes),
        ...events.flatMap((event) => [event.type, event.eventType, event.eventTypes, event.occasion, event.occasionType]),
      ]),
    [artistCards, events],
  );

  return (
    <div className="luxury-page explore-page min-h-screen antialiased">
      <Navbar />

      <main className="container-shell" style={{ paddingBottom: "64px" }}>
        <section className="page-hero events-hero grid max-h-none gap-4 overflow-hidden rounded-2xl bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md md:max-h-[340px] md:grid-cols-[1fr_360px] md:p-5 lg:grid-cols-[1fr_420px]">
          <div className="flex min-w-0 flex-col justify-center">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex w-max items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-orange-700"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Artists
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.04, ease: [0.16, 1, 0.3, 1] }}
              className="mt-2 max-w-3xl text-3xl font-extrabold leading-[1.08] text-stone-950 md:text-[40px]"
            >
              Connect with precise artists for every occasion.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-stone-600"
            >
              Browse native art forms, locations, tags, and occasions in one clean discovery flow.
            </motion.p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/events" className="inline-flex h-10 items-center gap-2 rounded-full bg-orange-600 px-4 text-xs font-extrabold uppercase tracking-widest text-white shadow-sm transition hover:bg-orange-700 hover:shadow-md">
                <CalendarDays className="h-4 w-4" />
                Post an Event
              </Link>
              <Link to="/register?role=artist" className="inline-flex h-10 items-center gap-2 rounded-full border border-stone-200 bg-white px-4 text-xs font-extrabold uppercase tracking-widest text-stone-700 shadow-sm transition hover:border-orange-200 hover:text-orange-600">
                <UsersRound className="h-4 w-4" />
                Join as Artist
              </Link>
            </div>
          </div>
          <div className="relative min-h-[210px] overflow-hidden rounded-xl bg-stone-100 md:min-h-0">
            <SmartImage
              src={getHeroImage(activeTab)}
              alt="Curated artist discovery"
              priority
              usageId="artists:compact-hero"
              category={activeTab === "events" ? "Marriage" : "Kirtankar"}
              orientation="landscape"
              aspectRatio="aspect-video"
              sizes="(max-width: 768px) 100vw, 420px"
              containerClassName="h-full w-full"
              imageClassName="object-cover object-center"
            />
            <div className="absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 text-xs font-extrabold text-stone-900 shadow-sm backdrop-blur">
              <Search className="h-4 w-4 text-orange-600" />
              <span>{loading ? "Building the collection" : `${resultCount} refined matches`}</span>
            </div>
          </div>
        </section>

        <LayoutGroup>
          <LuxuryFilterBar
            filters={filters}
            onChange={applyFilters}
            onReset={resetFilters}
            resultCount={resultCount}
            loading={loading}
            tagOptions={tagOptions}
            eventTypeOptions={eventTypeOptions}
          />

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ExploreTab)}>
            <div className="luxury-results-toolbar">
              <TabsList className="luxury-tabs">
                <TabsTrigger value="artists">Artists</TabsTrigger>
                <TabsTrigger value="events">Events</TabsTrigger>
              </TabsList>
              <p>
                {loading ? "Loading the collection" : error ? "Discovery paused" : resultCount === 0 ? "No matches" : `${resultCount} curated match${resultCount === 1 ? "" : "es"}`}
              </p>
            </div>

            {activeTab === "artists" && isLocationFallback ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="luxury-notice">
                No exact match was found in {routeDistrict || routeState}. Showing artists that match the selected art form.
              </motion.div>
            ) : null}

            {loading ? (
              <ResultSkeleton type={activeTab} />
            ) : error ? (
              <LuxuryEmptyState label={activeTab} onReset={resetFilters} />
            ) : activeTab === "artists" ? (
              visibleArtists.length > 0 ? (
                <>
                  <motion.div layout className="luxury-results-grid">
                    <AnimatePresence mode="popLayout">
                      {visibleArtists.map((artist, index) => (
                        <LuxuryArtistCard key={artist.cardId} artist={artist} index={index} />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                  {hasMoreArtists ? (
                    <div className="luxury-load-more">
                      <button type="button" onClick={loadMoreArtists} disabled={loadingMore}>
                        {loadingMore ? "Loading..." : "Load More Artists"}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                </>
              ) : (
                <LuxuryEmptyState label="artists" onReset={resetFilters} />
              )
            ) : filteredEvents.length > 0 ? (
              <motion.div layout className="luxury-results-grid event-grid">
                <AnimatePresence mode="popLayout">
                  {filteredEvents.map((event, index) => (
                    <LuxuryEventCard key={event.id} event={event} index={index} />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <LuxuryEmptyState label="events" onReset={resetFilters} />
            )}
          </Tabs>
        </LayoutGroup>
      </main>

      <Footer />
    </div>
  );
}
