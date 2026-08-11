import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, Plus, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NewRequirementModal from "@/components/NewRequirementModal";
import { useMasterData } from "@/contexts/MasterDataContext";
import { useI18n } from "@/i18n/I18nProvider";
import { getArtLabel } from "@/lib/artLabels";
import { getActiveArtistsPage } from "@/services/dataService";
import {
  buildEventRequirementGroups,
  filterArtistCardsByLocation,
  filterArtistCardsForEvent,
} from "@/services/eventArtistFiltering";
import { buildArtistCards } from "@/services/marketplaceCards";

const EVENTS = [
  { id: "1", name: "Wedding", icon: "💍", description: "Artists, rituals, hosts, and media teams for complete wedding celebrations" },
  { id: "2", name: "Birthday Party", icon: "🎂", description: "Performers, hosts, music, and entertainers for memorable family events" },
  { id: "3", name: "Corporate Event", icon: "🏢", description: "Anchors, speakers, stage artists, and production-ready event teams" },
  { id: "4", name: "Festival Celebration", icon: "🎊", description: "Dhol, lezim, zanj, folk ensembles, and cultural performance teams" },
  { id: "5", name: "Spiritual Event", icon: "🪔", description: "Kirtan, bhajan, pravachan, varkari groups, and devotional stage support" },
];

function normalize(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

export default function EventRequirements() {
  const { formatNumber, t } = useI18n(); // ADDED FOR i18n
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { categoryGroups, loading: masterLoading } = useMasterData();
  const [ready, setReady] = useState(false);
  const [artists, setArtists] = useState<Record<string, unknown>[]>([]);
  const [artistsLoading, setArtistsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(searchParams.get("openModal") === "true");

  const eventId = searchParams.get("eventId") || "";
  const eventType = searchParams.get("eventType") || searchParams.get("event") || "";
  const city = searchParams.get("city") || searchParams.get("district") || "";
  const state = searchParams.get("state") || "";
  const selectedEvent =
    EVENTS.find((event) => event.id === eventId) ||
    EVENTS.find((event) => {
      const eventName = normalize(event.name);
      const typeName = normalize(eventType);
      return Boolean(typeName && (eventName === typeName || eventName.includes(typeName) || typeName.includes(eventName)));
    });
  const selectedEventType = eventType || selectedEvent?.name || "";

  useEffect(() => {
    const timeout = window.setTimeout(() => setReady(true), 150);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadArtists() {
      setArtistsLoading(true);
      try {
        const items: Record<string, unknown>[] = [];
        let cursor: Awaited<ReturnType<typeof getActiveArtistsPage>>["nextCursor"] = null;
        let hasMore = true;

        while (hasMore) {
          const page = await getActiveArtistsPage(250, cursor || undefined);
          items.push(...(page.items as Record<string, unknown>[]));
          cursor = page.nextCursor;
          hasMore = page.hasMore && Boolean(cursor);
        }

        if (mounted) setArtists(items);
      } catch (error) {
        console.warn("Event requirement artists unavailable.", error);
        if (mounted) setArtists([]);
      } finally {
        if (mounted) setArtistsLoading(false);
      }
    }

    loadArtists();
    return () => {
      mounted = false;
    };
  }, []);

  const artistCards = useMemo(() => buildArtistCards(artists), [artists]);
  const eventMatchedArtists = useMemo(
    () => filterArtistCardsForEvent(artistCards, selectedEvent?.id || eventId, selectedEventType),
    [artistCards, eventId, selectedEvent?.id, selectedEventType]
  );
  const locationMatchedArtists = useMemo(
    () => filterArtistCardsByLocation(eventMatchedArtists, state, city),
    [city, eventMatchedArtists, state]
  );
  const requirementGroups = useMemo(
    () => buildEventRequirementGroups(locationMatchedArtists, categoryGroups),
    [categoryGroups, locationMatchedArtists]
  );

  const buildArtistUrl = (categoryName?: string, subCategory?: string) => {
    const params = new URLSearchParams();
    if (categoryName) params.set("category", categoryName);
    if (subCategory) params.set("subcategory", subCategory);
    if (city) params.set("city", city);
    if (state) params.set("state", state);
    if (selectedEvent?.id || eventId) params.set("eventId", selectedEvent?.id || eventId);
    if (selectedEventType) params.set("eventType", selectedEventType);
    return `/artists?${params.toString()}`;
  };

  if (!selectedEvent) {
    return (
      <div className="event-requirements-page min-h-screen w-full font-sans" style={{ background: "var(--app-background)" }}>
        <Navbar />
        <main className="page-shell container-shell py-12 px-4 max-w-5xl mx-auto min-h-[75vh]">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-orange-600">
              <Sparkles className="h-4 w-4 text-orange-600 animate-pulse" />
              Event Requirement
            </span>
            <h1 className="mt-3 text-3xl font-extrabold text-stone-950 sm:text-4xl">Select Event Type</h1>
            <p className="mt-2 text-sm font-semibold text-stone-600">
              Choose your event type to find verified artists, performers, and event services.
            </p>
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-3 text-xs font-extrabold text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700 active:scale-95 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Post Event Requirement Form
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {EVENTS.map((evt) => (
              <div
                key={evt.id}
                onClick={() => navigate(`/event-requirements?eventId=${evt.id}&eventType=${encodeURIComponent(evt.name)}`)}
                className="group relative cursor-pointer flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-orange-500 hover:shadow-xl hover:-translate-y-1"
              >
                <div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-3xl transition-transform duration-300 group-hover:scale-110">
                    {evt.icon}
                  </div>
                  <h3 className="mt-4 text-xl font-black text-stone-950 group-hover:text-orange-600 transition-colors">
                    {getArtLabel(t, evt.name)}
                  </h3>
                  <p className="mt-2 text-xs font-semibold leading-relaxed text-stone-500">
                    {evt.description}
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-2 text-xs font-extrabold text-orange-600">
                  Select Event
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>
        </main>
        <Footer />
        <NewRequirementModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </div>
    );
  }

  const isLoading = !ready || masterLoading || artistsLoading;

  return (
    <div className="event-requirements-page min-h-screen w-full font-sans" style={{ background: "var(--app-background)" }}>
      <Navbar />

      <main className="page-shell container-shell pb-16">
        <section className="page-hero grid gap-4 overflow-hidden rounded-lg border border-stone-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_280px]">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-orange-600">{t("requirements.eyebrow")}</p> {/* ADDED FOR i18n */}
            <h1 className="mt-1 text-3xl font-extrabold leading-tight text-stone-950 md:text-[40px]">
              {t("requirements.title", { event: getArtLabel(t, selectedEvent.name), location: city || t("location.yourArea") })} {/* ADDED FOR i18n */}
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-stone-600">
              {t(`requirements.event.${selectedEvent.id}.description`)} {t("requirements.subtitle")} {/* ADDED FOR i18n */}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-md shadow-orange-600/20 transition hover:bg-orange-700 active:scale-95 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Post Event Requirement Form
              </button>
            </div>
          </div>
          <div className="hidden items-center justify-center rounded-lg bg-orange-50 text-7xl md:flex">
            {selectedEvent.icon}
          </div>
        </section>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
            <p className="mt-3 text-[11px] font-black uppercase tracking-widest text-orange-600">{t("requirements.loadingCategories")}</p> {/* ADDED FOR i18n */}
          </div>
        ) : (
          <section className="app-section">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-orange-600">{t("requirements.chooseType")}</p> {/* ADDED FOR i18n */}
                <h2 className="mt-1 text-2xl font-extrabold text-stone-950 md:text-[32px]">{t("requirements.categoriesTitle")}</h2> {/* ADDED FOR i18n */}
              </div>
              <button
                type="button"
                onClick={() => navigate(buildArtistUrl())}
                className="inline-flex h-10 w-max items-center gap-2 rounded-lg border border-orange-100 bg-white px-4 text-xs font-extrabold text-stone-700 shadow-sm transition hover:border-orange-300 hover:text-orange-600"
              >
                {t("requirements.browseNearby")} {/* ADDED FOR i18n */}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="event-requirements-grid grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {requirementGroups.map((group, index) => {
                const subcategories = group.subcategories;
                return (
                  <motion.div
                    key={group.id || group.name}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: index * 0.05, ease: "circOut" }}
                    className="event-requirement-card relative flex min-h-[230px] flex-col gap-4 overflow-hidden rounded-lg border border-orange-100 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-2xl">
                          {group.icon || "✨"}
                        </span>
                        <div className="min-w-0">
                          <h3 className="text-base font-black tracking-tight text-stone-950">{getArtLabel(t, group.name)} ({formatNumber(group.count)})</h3> {/* ADDED FOR i18n */}
                          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-orange-600">
                            {t("requirements.artistCount", { count: formatNumber(group.count) })} {/* ADDED FOR i18n */}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(buildArtistUrl(group.name))}
                        className="shrink-0 rounded-lg border border-orange-100 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-orange-600 transition hover:bg-orange-50"
                      >
                        {t("filters.all")} {/* ADDED FOR i18n */}
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {subcategories.map((subCategory) => (
                        <button
                          key={subCategory.name}
                          type="button"
                          onClick={() => navigate(buildArtistUrl(group.name, subCategory.name))}
                          className="rounded-lg border border-orange-100 bg-[#fffaf6] px-3 py-2 text-[11px] font-extrabold text-stone-600 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                        >
                          {getArtLabel(t, subCategory.name)} ({formatNumber(subCategory.count)}) {/* ADDED FOR i18n */}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <Footer />
      <NewRequirementModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
