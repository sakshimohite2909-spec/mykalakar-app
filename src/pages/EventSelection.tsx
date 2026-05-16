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
import { filterEvents } from "@/services/filterEngine";
import { useMarketplaceFilters } from "@/hooks/useMarketplaceFilters";
import { AnimatePresence, LuxuryEmptyState, LuxuryEventCard, LuxuryFilterBar } from "@/components/discovery/LuxuryDiscovery";

type EventOption = {
  id: string;
  name: string;
  image: string;
  description: string;
};

type LiveEvent = Record<string, unknown>;

const PAGE_SIZE = 9;

const eventOptions: EventOption[] = [
  { id: "1", name: "Marriage", image: "", description: "Artists, rituals, hosts, and media teams." },
  { id: "2", name: "Birthday", image: "", description: "Performers and entertainers for family events." },
  { id: "3", name: "Corporate", image: "", description: "Anchors, speakers, and stage-ready acts." },
  { id: "4", name: "Festival", image: "", description: "Dhol, lezim, zanj, and folk ensembles." },
  { id: "5", name: "Spiritual", image: "", description: "Kirtan, bhajan, pravachan, and varkari groups." },
];

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
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
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
  const pageCount = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
  const pageEvents = filteredEvents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const handleContinue = () => {
    if (selectedEvent) navigate(`/location-select?eventId=${selectedEvent}`);
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
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-orange-600">Events</p>
            <h1 className="mt-1 text-3xl font-extrabold text-stone-950 md:text-[40px]">Live briefs and quick event setup.</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-stone-600">
              Browse public event briefs or create a compact request for artists to respond to.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a href="#create-event" className="inline-flex h-10 items-center gap-2 rounded-full bg-stone-950 px-4 text-xs font-extrabold text-white">
                <Plus className="h-4 w-4" />
                Create Brief
              </a>
              <Link to="/explore?tab=events" className="inline-flex h-10 items-center rounded-full border border-stone-200 bg-white px-4 text-xs font-extrabold text-stone-700">
                Explore All
              </Link>
            </div>
          </div>
          <SmartImage src={getForcedEventImage("Marriage")} alt="Events" priority usageId="events:hero" category="Marriage" orientation="landscape" aspectRatio="aspect-video" containerClassName="hidden rounded-lg md:block" />
        </section>

        <section className="app-section">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-orange-600">Public Briefs</p>
            </div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-stone-400">{loading ? "Loading briefs" : `${filteredEvents.length} matching briefs`}</p>
          </div>

          <LayoutGroup>
            <LuxuryFilterBar
              filters={filters}
              onChange={applyFilters}
              onReset={resetFilters}
              resultCount={filteredEvents.length}
              loading={loading}
              placeholder="Filter briefs by art form, category, occasion, location"
              tagOptions={tagOptions}
              eventTypeOptions={eventTypeOptions}
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
                    Page {page} of {pageCount}
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

        <section id="create-event" className="app-section pb-20">
          <div className="mb-4">
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-orange-600">Create</p>
            <h2 className="mt-1 text-2xl font-extrabold text-stone-950 md:text-[32px]">Start with an event type</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {eventOptions.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => setSelectedEvent(event.id)}
                className={`compact-card option-card group text-left ${
                  selectedEvent === event.id ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-[#FAFAFA]" : ""
                }`}
              >
                <div className="image-wrapper">
                  <SmartImage src={getForcedEventImage(event.name)} alt={event.name} usageId={`events-option:${event.id}`} category={event.name} orientation="landscape" aspectRatio="aspect-auto" containerClassName="h-full w-full transition duration-300 group-hover:scale-[1.03]" />
                </div>
                <div className="card-content">
                  <h3 className="text-lg font-extrabold text-stone-950">{event.name}</h3>
                  <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-stone-500">{event.description}</p>
                </div>
              </button>
            ))}
          </div>

          {selectedEvent ? (
            <div className="sticky bottom-20 z-30 mt-5 flex justify-center md:static">
              <Button size="lg" onClick={handleContinue} className="h-11 rounded-full bg-orange-600 px-7 text-xs font-extrabold uppercase tracking-widest text-white hover:bg-orange-500">
                Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default EventSelection;
