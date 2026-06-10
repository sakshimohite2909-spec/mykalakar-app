import { useEffect, useMemo, useRef, useState } from "react";
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
import { CATEGORY_GROUP_OPTIONS } from "@/constants/artistSystem";
import {
  buildEventFilterGroups,
  filterEvents,
  getActiveCategories,
  getActiveEventTypes,
  getActiveSubCategories,
  resetSmartFilters,
  syncSmartFilters,
  type SmartFilters,
} from "@/services/filterEngine";
import { useMarketplaceFilters } from "@/hooks/useMarketplaceFilters";
import {
  buildEventRequirementGroups,
  filterArtistCardsByLocation,
  filterArtistCardsForEvent,
  filterAvailableArtistCards,
} from "@/services/eventArtistFiltering";
import { buildArtistCards, filterArtistCards } from "@/services/marketplaceCards";
import {
  AnimatePresence,
  LuxuryArtistCard,
  LuxuryEmptyState,
  LuxuryEventCard,
  LuxuryFilterBar,
} from "@/components/discovery/LuxuryDiscovery";
import { useI18n } from "@/i18n/I18nProvider";

type ExploreTab = "artists" | "events";
type EventRecord = Record<string, unknown>;

const DEFAULT_EVENT_TYPES = ["Wedding", "Festival", "Corporate", "Spiritual", "Birthday"];
const EVENT_NAME_BY_ID: Record<string, string> = {
  "1": "Wedding",
  "2": "Birthday Party",
  "3": "Corporate Event",
  "4": "Festival Celebration",
  "5": "Spiritual Event",
};
const NON_EVENT_TYPE_PARAMS = new Set(["artist", "artists", "event", "events"]);

function getHeroImage(tab: ExploreTab) {
  return ImageRegistryService.getMappedImage(tab === "events" ? "Marriage" : "Kirtankar") || ImageRegistryService.getBestImage("Kirtankar", "artist");
}

function splitParam(value: string | null) {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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

function isLegacyEventTypeParam(value: string | null) {
  const clean = String(value || "").trim().toLowerCase();
  return Boolean(clean && !NON_EVENT_TYPE_PARAMS.has(clean));
}

function buildRouteFilters(params: URLSearchParams): SmartFilters {
  const eventId = params.get("eventId") || "";
  const legacyType = params.get("type");
  return syncSmartFilters({
    query: params.get("q") || "",
    category: params.get("category"),
    subCategory: params.get("subcategory"),
    categories: compact([params.get("category"), ...splitParam(params.get("categories"))]),
    subCategories: compact([params.get("subcategory"), ...splitParam(params.get("subcategories"))]),
    tags: splitParam(params.get("tags")),
    eventTypes: compact([
      params.get("event"),
      params.get("eventType"),
      ...splitParam(params.get("eventTypes")),
      isLegacyEventTypeParam(legacyType) ? legacyType : "",
      EVENT_NAME_BY_ID[eventId],
    ]),
  });
}

function filterStateKey(filters: SmartFilters) {
  return JSON.stringify({
    query: filters.query || "",
    categories: getActiveCategories(filters),
    subCategories: getActiveSubCategories(filters),
    tags: filters.tags || [],
    eventTypes: getActiveEventTypes(filters),
  });
}

function setSingleOrMultiple(next: URLSearchParams, singleKey: string, multipleKey: string, values: string[]) {
  if (values.length === 1) {
    next.set(singleKey, values[0]);
  } else if (values.length > 1) {
    next.set(multipleKey, values.join(","));
  }
}

function buildSearchParams(filters: SmartFilters, context: { activeTab: ExploreTab; eventId: string; state: string; city: string }) {
  const next = new URLSearchParams();
  const categories = getActiveCategories(filters);
  const subCategories = getActiveSubCategories(filters);
  const eventTypes = getActiveEventTypes(filters);

  if (context.activeTab === "events") next.set("tab", "events");
  if (filters.query) next.set("q", filters.query);
  setSingleOrMultiple(next, "category", "categories", categories);
  setSingleOrMultiple(next, "subcategory", "subcategories", subCategories);
  if (filters.tags?.length) next.set("tags", filters.tags.join(","));
  setSingleOrMultiple(next, "eventType", "eventTypes", eventTypes);
  if (eventTypes.length && context.eventId) next.set("eventId", context.eventId);
  if (context.state) next.set("state", context.state);
  if (context.city) next.set("city", context.city);

  return next;
}

function withoutArtistFacetFilters(filters: SmartFilters): SmartFilters {
  return {
    ...filters,
    category: null,
    subCategory: null,
    categories: [],
    subCategories: [],
  };
}

async function getInitialArtistCollection(loadAll = false) {
  const firstPage = await getActiveArtistsPage(50);
  const items = [...(firstPage.items as Record<string, unknown>[])];
  let cursor = firstPage.nextCursor;
  let hasMore = firstPage.hasMore;
  let pageCount = 1;

  while (hasMore && cursor && (loadAll || pageCount < 4)) {
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
  const { formatNumber, t } = useI18n(); // ADDED FOR i18n
  const [params, setParams] = useSearchParams();
  const paramsKey = params.toString();
  const resettingFiltersRef = useRef(false);
  const routeState = params.get("state") || "";
  const routeCity = params.get("city") || params.get("district") || "";
  const routeEventId = params.get("eventId") || "";
  const [activeTab, setActiveTab] = useState<ExploreTab>(() => (params.get("tab") === "events" ? "events" : "artists"));
  const routeFilters = useMemo(() => buildRouteFilters(new URLSearchParams(paramsKey)), [paramsKey]);
  const routeFilterKey = useMemo(() => filterStateKey(routeFilters), [routeFilters]);
  const { filters, debouncedFilters, applyFilters, resetFilters, setFilters } = useMarketplaceFilters(routeFilters, 150);
  const [artists, setArtists] = useState<Record<string, unknown>[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [artistCursor, setArtistCursor] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMoreArtists, setHasMoreArtists] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (resettingFiltersRef.current) {
      if (!paramsKey) {
        resettingFiltersRef.current = false;
      } else {
        return;
      }
    }
    setFilters((current) => (filterStateKey(current) === routeFilterKey ? current : routeFilters));
  }, [paramsKey, routeFilterKey, routeFilters, setFilters]);

  useEffect(() => {
    if (resettingFiltersRef.current) return;
    const routeTab = new URLSearchParams(paramsKey).get("tab") === "events" ? "events" : "artists";
    setActiveTab((current) => (current === routeTab ? current : routeTab));
  }, [paramsKey]);

  useEffect(() => {
    if (resettingFiltersRef.current) return;
    const next = buildSearchParams(filters, {
      activeTab,
      eventId: routeEventId,
      state: routeState,
      city: routeCity,
    });
    if (next.toString() !== paramsKey) {
      setParams(next, { replace: true });
    }
  }, [activeTab, filters, paramsKey, routeCity, routeEventId, routeState, setParams]);

  useEffect(() => {
    let mounted = true;
    Promise.all([getInitialArtistCollection(true), getApprovedEvents()])
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
        if (mounted) setError(t("explore.dataUnavailable")); // ADDED FOR i18n
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [t]); // ADDED FOR i18n

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
      setError(t("explore.moreArtistsUnavailable")); // ADDED FOR i18n
    } finally {
      setLoadingMore(false);
    }
  };

  const artistCards = useMemo(() => buildArtistCards(artists), [artists]);
  const availableArtistCards = useMemo(() => filterAvailableArtistCards(artistCards), [artistCards]);
  const debouncedEventTypes = useMemo(() => getActiveEventTypes(debouncedFilters), [debouncedFilters]);
  const eventMatchedArtists = useMemo(
    () => filterArtistCardsForEvent(availableArtistCards, debouncedEventTypes.length ? routeEventId : "", debouncedEventTypes[0] || ""),
    [availableArtistCards, debouncedEventTypes, routeEventId],
  );
  const locationMatchedArtists = useMemo(
    () => filterArtistCardsByLocation(eventMatchedArtists, routeState, routeCity),
    [eventMatchedArtists, routeCity, routeState],
  );
  const artistFacetFilters = useMemo(() => withoutArtistFacetFilters(debouncedFilters), [debouncedFilters]);
  const artistFacetBase = useMemo(
    () => filterArtistCards(locationMatchedArtists, artistFacetFilters),
    [artistFacetFilters, locationMatchedArtists],
  );
  const categoryFacets = useMemo(
    () => buildEventRequirementGroups(artistFacetBase, CATEGORY_GROUP_OPTIONS),
    [artistFacetBase],
  );
  const visibleArtists = useMemo(
    () => filterArtistCards(locationMatchedArtists, debouncedFilters),
    [debouncedFilters, locationMatchedArtists],
  );
  const eventFacetFilters = useMemo(() => withoutArtistFacetFilters(debouncedFilters), [debouncedFilters]);
  const eventFacetBase = useMemo(() => filterEvents(events, eventFacetFilters), [eventFacetFilters, events]);
  const eventCategoryFacets = useMemo(() => buildEventFilterGroups(eventFacetBase), [eventFacetBase]);
  const filteredEvents = useMemo(() => filterEvents(events, debouncedFilters), [events, debouncedFilters]);
  const resultCount = activeTab === "artists" ? visibleArtists.length : filteredEvents.length;
  const tagOptions = useMemo(
    () =>
      compact([
        ...availableArtistCards.flatMap((artist) => artist.tags),
        ...events.flatMap((event) => [event.tags, event.keywords]),
      ]),
    [availableArtistCards, events],
  );
  const eventTypeOptions = useMemo(
    () =>
      compact([
        ...DEFAULT_EVENT_TYPES,
        ...availableArtistCards.flatMap((artist) => artist.eventTypes),
        ...events.flatMap((event) => [event.type, event.eventType, event.eventTypes, event.occasion, event.occasionType]),
      ]),
    [availableArtistCards, events],
  );
  const handleResetFilters = () => {
    resettingFiltersRef.current = true;
    resetFilters();
    setFilters(resetSmartFilters());
    setActiveTab("artists");
    setParams(new URLSearchParams(), { replace: true });
  };

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
              {t("explore.tabs.artists")} {/* ADDED FOR i18n */}
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.04, ease: [0.16, 1, 0.3, 1] }}
              className="mt-2 max-w-3xl text-3xl font-extrabold leading-[1.08] text-stone-950 md:text-[40px]"
            >
              {t("explore.heroTitle")} {/* ADDED FOR i18n */}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-stone-600"
            >
              {t("explore.heroSubtitle")} {/* ADDED FOR i18n */}
            </motion.p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/events" className="inline-flex h-10 items-center gap-2 rounded-full bg-orange-600 px-4 text-xs font-extrabold uppercase tracking-widest text-white shadow-sm transition hover:bg-orange-700 hover:shadow-md">
                <CalendarDays className="h-4 w-4" />
                {t("events.postEvent")} {/* ADDED FOR i18n */}
              </Link>
              <Link to="/register?role=artist" className="inline-flex h-10 items-center gap-2 rounded-full border border-stone-200 bg-white px-4 text-xs font-extrabold uppercase tracking-widest text-stone-700 shadow-sm transition hover:border-orange-200 hover:text-orange-600">
                <UsersRound className="h-4 w-4" />
                {t("nav.joinArtist")} {/* ADDED FOR i18n */}
              </Link>
            </div>
          </div>
          <div className="relative min-h-[210px] overflow-hidden rounded-xl bg-stone-100 md:min-h-0">
            <SmartImage
              src={getHeroImage(activeTab)}
              alt={t("explore.heroAlt")} // ADDED FOR i18n
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
              <span>{loading ? t("explore.buildingCollection") : t("explore.refinedMatches", { count: formatNumber(resultCount) })}</span> {/* ADDED FOR i18n */}
            </div>
          </div>
        </section>

        <LayoutGroup>
          <LuxuryFilterBar
            filters={filters}
            onChange={applyFilters}
            onReset={handleResetFilters}
            resultCount={resultCount}
            loading={loading}
            tagOptions={tagOptions}
            eventTypeOptions={eventTypeOptions}
            categoryFacets={activeTab === "artists" ? categoryFacets : eventCategoryFacets}
          />

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ExploreTab)}>
            <div className="luxury-results-toolbar">
              <TabsList className="luxury-tabs">
                <TabsTrigger value="artists">{t("explore.tabs.artists")}</TabsTrigger> {/* ADDED FOR i18n */}
                <TabsTrigger value="events">{t("explore.tabs.events")}</TabsTrigger> {/* ADDED FOR i18n */}
              </TabsList>
              <p>
                {loading ? t("explore.loadingCollection") : error ? t("explore.paused") : resultCount === 0 ? t("explore.noMatches") : t("explore.curatedMatches", { count: formatNumber(resultCount) })} {/* ADDED FOR i18n */}
              </p>
            </div>

            {loading ? (
              <ResultSkeleton type={activeTab} />
            ) : error ? (
              <LuxuryEmptyState label={activeTab} onReset={handleResetFilters} />
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
                        {loadingMore ? t("common.loading") : t("explore.loadMoreArtists")} {/* ADDED FOR i18n */}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                </>
              ) : (
                <LuxuryEmptyState label="artists" onReset={handleResetFilters} />
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
              <LuxuryEmptyState label="events" onReset={handleResetFilters} />
            )}
          </Tabs>
        </LayoutGroup>
      </main>

      <Footer />
    </div>
  );
}
