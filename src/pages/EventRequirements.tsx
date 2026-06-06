import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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

export default function EventRequirements() {
  const { formatNumber, t } = useI18n(); // ADDED FOR i18n
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { categoryGroups, loading: masterLoading } = useMasterData();
  const [ready, setReady] = useState(false);
  const [artists, setArtists] = useState<Record<string, unknown>[]>([]);
  const [artistsLoading, setArtistsLoading] = useState(true);

  const eventId = searchParams.get("eventId") || "";
  const district = searchParams.get("district") || "";
  const state = searchParams.get("state") || "";
  const selectedEvent = EVENTS.find((event) => event.id === eventId);

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
          const page = await getActiveArtistsPage(50, cursor || undefined);
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
    () => filterArtistCardsForEvent(artistCards, eventId, selectedEvent?.name),
    [artistCards, eventId, selectedEvent?.name]
  );
  const locationMatchedArtists = useMemo(
    () => filterArtistCardsByLocation(eventMatchedArtists, state, district),
    [district, eventMatchedArtists, state]
  );
  const requirementGroups = useMemo(
    () => buildEventRequirementGroups(locationMatchedArtists, categoryGroups),
    [categoryGroups, locationMatchedArtists]
  );

  const buildArtistUrl = (categoryName?: string, subCategory?: string) => {
    const params = new URLSearchParams();
    if (categoryName) params.set("category", categoryName);
    if (subCategory) params.set("subcategory", subCategory);
    if (district) params.set("district", district);
    if (state) params.set("state", state);
    if (eventId) params.set("eventId", eventId);
    return `/artists?${params.toString()}`;
  };

  if (!selectedEvent) {
    return (
      <div className="event-requirements-page min-h-screen w-full font-sans" style={{ background: "var(--app-background)" }}>
        <Navbar />
        <main className="page-shell container-shell flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
          <Sparkles className="h-10 w-10 text-orange-600" />
          <h1 className="text-2xl font-black text-stone-950">{t("event.notFoundTitle")}</h1> {/* ADDED FOR i18n */}
          <p className="max-w-sm text-sm font-semibold leading-6 text-stone-500">
            {t("requirements.invalidEventText")} {/* ADDED FOR i18n */}
          </p>
          <button
            type="button"
            onClick={() => navigate("/events")}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-orange-600 px-5 text-xs font-extrabold text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("event.backToEvents")} {/* ADDED FOR i18n */}
          </button>
        </main>
        <Footer />
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
              {t("requirements.title", { event: getArtLabel(t, selectedEvent.name), location: district || t("location.yourArea") })} {/* ADDED FOR i18n */}
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-stone-600">
              {t(`requirements.event.${selectedEvent.id}.description`)} {t("requirements.subtitle")} {/* ADDED FOR i18n */}
            </p>
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
    </div>
  );
}
