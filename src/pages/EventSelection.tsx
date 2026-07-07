import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { LayoutGroup, motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { SmartImage } from "@/components/SmartImage";
import { ImageRegistryService } from "@/services/ImageRegistryService";
import { getApprovedEvents } from "@/services/dataService";
import { buildEventFilterGroups, filterEvents, type SmartFilters } from "@/services/filterEngine";
import { useMarketplaceFilters } from "@/hooks/useMarketplaceFilters";
import { AnimatePresence, LuxuryEmptyState, LuxuryEventCard, LuxuryFilterBar } from "@/components/discovery/LuxuryDiscovery";
import { useI18n } from "@/i18n/I18nProvider";
import { getArtLabel } from "@/lib/artLabels";
import NewRequirementModal from "@/components/NewRequirementModal";
import LiveBriefsFeed from "@/components/LiveBriefsFeed";

type EventOption = {
  id: string;
  name: string;
  image: string;
  description: string;
};

type LiveEvent = Record<string, unknown>;

const PAGE_SIZE = 9;

// Each imgSrc is a unique, 4K Unsplash close-up — zero duplication across the array.
const eventOptions: EventOption[] = [
  {
    id: "1",
    name: "Marriage",
    image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop",
    description: "Artists, rituals, hosts, and media teams.",
  },
  {
    id: "2",
    name: "Birthday",
    // Red concert lighting
    image: "https://images.unsplash.com/photo-1598285526019-20412e8c2ec6?q=80&w=2000&auto=format&fit=crop",
    description: "Performers and entertainers for family events.",
  },
  {
    id: "3",
    name: "Corporate",
    // 4K corporate stage spotlight close-up
    image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=2070&auto=format&fit=crop",
    description: "Anchors, speakers, and stage-ready acts.",
  },
  {
    id: "4",
    name: "Festival",
    // 4K festival stage lights close-up
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=2070&auto=format&fit=crop",
    description: "Dhol, lezim, zanj, and folk ensembles.",
  },
  {
    id: "5",
    name: "Spiritual",
    // Close-up of traditional Maharashtrian singer / cymbals details
    image: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80",
    description: "Kirtan, bhajan, pravachan, and varkari groups.",
  },
];
const EVENT_TYPE_BY_ID: Record<string, string> = {
  "1": "Wedding",
  "2": "Birthday Party",
  "3": "Corporate Event",
  "4": "Festival Celebration",
  "5": "Spiritual Event",
};

function withoutEventFacetFilters(filters: SmartFilters): SmartFilters {
  return {
    ...filters,
    category: null,
    subCategory: null,
    categories: [],
    subCategories: [],
  };
}

function getForcedEventImage(...categories: unknown[]) {
  for (const category of categories) {
    const image = ImageRegistryService.getMappedImage(category);
    if (image) return image;
  }

  return ImageRegistryService.getBestImage(String(categories.find(Boolean) || "Marriage"), "event");
}

function getLiveEventMappedImage(event: LiveEvent) {
  return getForcedEventImage(
    event.artType,
    event.subCategory,
    event.subcategory,
    event.category,
    event.type,
    event.eventType,
    event.occasion,
  );
}

function EventSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="compact-card skeleton-card">
          <div className="image-wrapper skeleton-shimmer" />
          <div className="card-content">
            <div className="h-5 w-2/3 rounded-full skeleton-shimmer" />
            <div className="h-4 rounded-full skeleton-shimmer" />
            <div className="h-8 rounded-full skeleton-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}


const EventSelection = () => {
  const { formatNumber, t } = useI18n(); // ADDED FOR i18n
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [briefModalOpen, setBriefModalOpen] = useState(false);
  const { filters, debouncedFilters, applyFilters, resetFilters } = useMarketplaceFilters({}, 150);

  useEffect(() => {
    let mounted = true;
    getApprovedEvents()
      .then((events) => {
        if (mounted) setLiveEvents(events as LiveEvent[]);
      })
      .catch((error) => {
        console.warn("Event previews unavailable.", error);
        if (mounted) setLiveEvents([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedFilters]);

  const filteredEvents = useMemo(() => filterEvents(liveEvents, debouncedFilters), [liveEvents, debouncedFilters]);
  const eventFacetFilters = useMemo(() => withoutEventFacetFilters(debouncedFilters), [debouncedFilters]);
  const eventFacetBase = useMemo(() => filterEvents(liveEvents, eventFacetFilters), [eventFacetFilters, liveEvents]);
  const eventCategoryFacets = useMemo(() => buildEventFilterGroups(eventFacetBase), [eventFacetBase]);
  const pageCount = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
  const pageEvents = filteredEvents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const handleContinue = () => {
    if (!selectedEvent) return;
    const next = new URLSearchParams();
    next.set("eventId", selectedEvent);
    next.set("eventType", EVENT_TYPE_BY_ID[selectedEvent] || selectedEvent);
    next.set("type", "artist");
    navigate(`/location-select?${next.toString()}`);
  };

  const tagOptions = useMemo(() => {
    const seen = new Set<string>();
    return liveEvents
      .flatMap((event) => [event.tags, event.keywords])
      .flat()
      .map((value) => String(value ?? "").trim())
      .filter((value) => {
        const key = value.toLowerCase();
        if (!value || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [liveEvents]);
  const eventTypeOptions = useMemo(() => {
    const seen = new Set<string>();
    return [
      "Wedding",
      "Festival",
      "Corporate",
      "Spiritual",
      "Birthday",
      ...liveEvents.flatMap((event) => [event.type, event.eventType, event.eventTypes, event.occasion, event.occasionType]).flat(),
    ]
      .map((value) => String(value ?? "").trim())
      .filter((value) => {
        const key = value.toLowerCase();
        if (!value || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [liveEvents]);

  return (
    <div className="luxury-page events-page min-h-screen w-full pb-24 font-sans md:pb-0">
      <Navbar />

      <main className="container-shell" style={{ paddingBottom: '64px' }}>
        <section className="page-hero events-hero grid max-h-[340px] gap-4 overflow-hidden rounded-lg border border-stone-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_320px] md:p-5">
            <div>
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-orange-600">{t("events.eyebrow")}</p> {/* ADDED FOR i18n */}
            <h1 className="mt-1 text-3xl font-extrabold text-stone-950 md:text-[40px]">{t("events.heroTitle")}</h1> {/* ADDED FOR i18n */}
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-stone-600">
              {t("events.heroSubtitle")} {/* ADDED FOR i18n */}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                id="open-new-requirement-modal"
                onClick={() => setBriefModalOpen(true)}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-stone-950 px-4 text-xs font-extrabold text-white hover:bg-[#E25C1D] transition-colors"
              >
                <Plus className="h-4 w-4" />
                {t("events.createBrief")} {/* ADDED FOR i18n */}
              </button>
              <Link to="/explore?tab=events" className="inline-flex h-10 items-center rounded-full border border-stone-200 bg-white px-4 text-xs font-extrabold text-stone-700">
                {t("footer.exploreAll")} {/* ADDED FOR i18n */}
              </Link>
            </div>
          </div>
          <SmartImage src={getForcedEventImage("Marriage")} alt={t("events.eyebrow")} priority usageId="events:hero" category="Marriage" orientation="landscape" aspectRatio="aspect-video" containerClassName="hidden rounded-lg md:block" /> {/* ADDED FOR i18n */}
        </section>

        <section className="app-section">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-orange-600">{t("events.publicBriefs")}</p> {/* ADDED FOR i18n */}
            </div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-stone-400">{loading ? t("events.loadingBriefs") : t("events.matchingBriefs", { count: formatNumber(filteredEvents.length) })}</p> {/* ADDED FOR i18n */}
          </div>

          <LayoutGroup>
            <LuxuryFilterBar
              filters={filters}
              onChange={applyFilters}
              onReset={resetFilters}
              resultCount={filteredEvents.length}
              loading={loading}
              placeholder={t("events.filterPlaceholder")}
              tagOptions={tagOptions}
              eventTypeOptions={eventTypeOptions}
              categoryFacets={eventCategoryFacets}
            />
          </LayoutGroup>

          {loading ? (
            <EventSkeleton />
          ) : pageEvents.length > 0 ? (
            <>
              <motion.div layout className="luxury-results-grid event-grid">
                <AnimatePresence mode="popLayout">
                  {pageEvents.map((event, index) => (
                    <LuxuryEventCard key={event.id} event={{ ...event, image: getLiveEventMappedImage(event) }} index={index} />
                  ))}
                </AnimatePresence>
              </motion.div>
              {pageCount > 1 ? (
                <div className="mt-5 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page === 1}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="rounded-full bg-white px-4 py-2 text-xs font-extrabold text-stone-600 shadow-sm">
                    {t("pagination.pageOf", { page: formatNumber(page), total: formatNumber(pageCount) })} {/* ADDED FOR i18n */}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                    disabled={page === pageCount}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <LuxuryEmptyState label="events" onReset={resetFilters} />
          )}
        </section>

        {/* Phase 5 — Live approved briefs feed */}
        <LiveBriefsFeed className="app-section" />

        <section id="create-event" className="app-section pb-20">
          <div className="mb-4">
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-orange-600">{t("events.createEyebrow")}</p> {/* ADDED FOR i18n */}
            <h2 className="mt-1 text-2xl font-extrabold text-stone-950 md:text-[32px]">{t("events.startType")}</h2> {/* ADDED FOR i18n */}
          </div>

          {/* event-type-options-grid shares the same auto-fill token as luxury-results-grid */}
          <div className="scrollbar-none flex overflow-x-auto snap-x snap-mandatory gap-3 pb-4 md:pb-0 md:grid md:grid-cols-3 lg:grid-cols-5 md:gap-4 lg:gap-6 md:overflow-visible">
            {eventOptions.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => setSelectedEvent(event.id)}
                className={`relative flex flex-col h-full w-[38%] shrink-0 snap-start md:w-auto md:shrink overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-300 hover:border-orange-300 hover:shadow-md hover:-translate-y-1 group text-left ${
                  selectedEvent === event.id ? "ring-2 ring-orange-500 ring-offset-2 border-orange-500" : "border-stone-200"
                }`}
              >
                {/* Image area (aspect-[4/3]) */}
                <div className="w-full aspect-[4/3] relative overflow-hidden bg-stone-50 rounded-t-xl">
                  <SmartImage
                    src={event.image}
                    alt={event.name}
                    usageId={`events-option:${event.id}`}
                    category={event.name}
                    orientation="landscape"
                    aspectRatio="aspect-auto"
                    containerClassName="h-full w-full transition duration-300 group-hover:scale-105"
                    imageClassName="object-center"
                  />
                </div>

                {/* Text area */}
                <div className="p-4 md:p-5 flex-grow flex flex-col justify-between bg-white border-t border-stone-100">
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-orange-600">
                      {t("events.eyebrow")}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1 leading-snug">
                      {getArtLabel(t, event.name)}
                    </h3>
                    <p className="text-sm font-normal text-gray-500 line-clamp-3 leading-relaxed">
                      {t(`eventOption.${event.id}.description`)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {selectedEvent ? (
            <div className="sticky bottom-20 z-30 mt-5 flex justify-center md:static">
              <Button size="lg" onClick={handleContinue} className="h-11 rounded-full bg-orange-600 px-7 text-xs font-extrabold uppercase tracking-widest text-white hover:bg-orange-500">
                {t("common.continue")} {/* ADDED FOR i18n */}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </section>
      </main>

      <Footer />

      {/* Phase 4 — New Requirement submission modal */}
      <NewRequirementModal
        open={briefModalOpen}
        onClose={() => setBriefModalOpen(false)}
      />
    </div>
  );
};

export default EventSelection;
