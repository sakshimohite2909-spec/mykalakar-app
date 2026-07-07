import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CalendarDays, ChevronLeft, Loader2, MapPin, Send, Tag, Users, Wallet } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { firebaseErrorMessage, logFirebaseError, requireAuthUid } from "@/lib/firebaseSafe";
import { submitEventApplication } from "@/lib/eventMatching";
import { SmartImage } from "@/components/SmartImage";
import { subscribeEventById } from "@/services/dataService";
import { getEventCategory } from "@/services/filterEngine";
import { languageToLocale, useI18n } from "@/i18n/I18nProvider";
import { getArtLabel } from "@/lib/artLabels";

type EventRecord = Record<string, any>;

function imageForEvent(event?: EventRecord) {
  if (event?.image || event?.imageUrl || event?.coverImage) return event.image || event.imageUrl || event.coverImage;
  const artType = event?.artType || event?.performanceType || event?.subCategory || event?.category || "Event";
  const category = event ? getEventCategory(event) || "Default" : "Default";
  return "";
}

function formatDate(value: unknown, fallback: string, locale: string) { // ADDED FOR i18n
  if (typeof value === "string" && value.trim()) return value;
  const timestamp = value as { toDate?: () => Date };
  if (value && typeof value === "object" && typeof timestamp.toDate === "function") {
    return timestamp.toDate().toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" }); // ADDED FOR i18n
  }
  return fallback;
}

export default function EventDetails() {
  const { formatCurrency, formatNumber, language, t } = useI18n(); // ADDED FOR i18n
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, artistData, isArtist } = useAuth();
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!id) return;
    const unsub = subscribeEventById(
      id,
      (data) => {
        setEvent(data as EventRecord | null);
        setLoading(false);
      },
      (error) => {
        logFirebaseError(error);
        setEvent(null);
        setLoading(false);
      }
    );
    return unsub;
  }, [id]);

  const title = event?.title || event?.name || t("event.defaultTitle"); // ADDED FOR i18n
  const category = event ? getEventCategory(event) || event.category || t("event.defaultArtType") : t("event.defaultArtType"); // ADDED FOR i18n
  const artType = event?.artType || event?.performanceType || event?.subCategory || event?.subcategory || category;
  const categoryLabel = getArtLabel(t, category); // ADDED FOR i18n
  const artTypeLabel = getArtLabel(t, artType); // ADDED FOR i18n
  const description = event?.description || event?.requirements || t("event.verifiedBrief"); // ADDED FOR i18n
  const image = useMemo(() => imageForEvent(event || undefined), [event]);

  const handleApply = async () => {
    if (!event || !id) return;
    if (!currentUser) {
      navigate("/login");
      return;
    }
    if (!isArtist || !artistData?.id) {
      toast({ variant: "destructive", title: t("event.applyArtistOnlyTitle"), description: t("event.applyArtistOnlyText") }); // ADDED FOR i18n
      return;
    }

    setApplying(true);
    try {
      const uid = requireAuthUid(currentUser);
      await submitEventApplication({ eventId: id, artistId: artistData.id || uid, message: message.trim() });
      toast({ title: t("event.applySuccessTitle"), description: t("event.applySuccessText") }); // ADDED FOR i18n
      navigate("/artist/dashboard/bookings");
    } catch (error: any) {
      logFirebaseError(error);
      toast({ variant: "destructive", title: t("event.applyFailedTitle"), description: firebaseErrorMessage(error, t("event.applyFailedText")) }); // ADDED FOR i18n
      throw error;
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <Navbar />
        <main className="container-shell flex min-h-[70vh] items-center justify-center" style={{ paddingTop: 'calc(var(--navbar-h, 72px) + 8px)' }}>
          <Loader2 className="h-9 w-9 animate-spin text-orange-600" />
        </main>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <Navbar />
        <main className="container-shell flex min-h-[70vh] flex-col items-center justify-center text-center" style={{ paddingTop: 'calc(var(--navbar-h, 72px) + 8px)' }}>
          <h1 className="text-2xl font-extrabold text-stone-950">{t("event.notFoundTitle")}</h1> {/* ADDED FOR i18n */}
          <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-stone-500">{t("event.notFoundText")}</p> {/* ADDED FOR i18n */}
          <Link to="/explore?tab=events" className="mt-5 inline-flex h-10 items-center rounded-full bg-stone-950 px-5 text-xs font-extrabold text-white">
            {t("common.viewAllEvents")} {/* ADDED FOR i18n */}
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24 md:pb-0">
      <Helmet>
        <title>MyKalakar | {title}</title>
        <meta property="og:title" content={`MyKalakar | ${title}`} />
        <meta property="og:description" content={description.slice(0, 160)} />
        <meta property="og:image" content={image} />
      </Helmet>
      <Navbar />

      <main className="event-details-shell container-shell" style={{ paddingTop: 'calc(var(--navbar-h, 72px) + 8px)', paddingBottom: '80px' }}>
        <Link to="/explore?tab=events" className="mb-3 inline-flex h-9 items-center gap-2 rounded-full border border-stone-200 bg-white px-3 text-xs font-extrabold text-stone-700 shadow-sm hover:text-orange-600">
          <ChevronLeft className="h-4 w-4" />
          {t("nav.events")} {/* ADDED FOR i18n */}
        </Link>

        <section className="grid gap-5 overflow-hidden rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:grid-cols-[420px_1fr] md:p-5">
          <SmartImage src={image} alt={title} usageId={`event-detail:${event.id}`} category={artType || category} orientation="landscape" priority aspectRatio="aspect-[4/3]" containerClassName="rounded-2xl" />
          <div className="flex flex-col justify-center">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-orange-700">{categoryLabel}</span> {/* ADDED FOR i18n */}
              <span className="inline-flex rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-[11px] font-extrabold text-stone-600">{artTypeLabel}</span> {/* ADDED FOR i18n */}
            </div>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight text-stone-950 md:text-[44px]">{title}</h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-stone-600">{description}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Info icon={CalendarDays} label={t("event.date")} value={formatDate(event.eventDate, t("event.dateFlexible"), languageToLocale(language))} /> {/* ADDED FOR i18n */}
              <Info icon={MapPin} label={t("event.location")} value={event.location || t("location.maharashtra")} /> {/* ADDED FOR i18n */}
              <Info icon={Tag} label={t("event.performanceType")} value={categoryLabel} /> {/* ADDED FOR i18n */}
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="space-y-6">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-extrabold text-stone-950">{t("event.requirements")}</h2> {/* ADDED FOR i18n */}
              <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-7 text-stone-600">{event.requirements || description}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {event.budget ? <Info icon={Wallet} label={t("event.budget")} value={formatCurrency(Number(event.budget))} /> : null} {/* ADDED FOR i18n */}
              {event.performanceType ? <Info icon={Users} label={t("event.performanceType")} value={getArtLabel(t, event.performanceType)} /> : null} {/* ADDED FOR i18n */}
              {event.applicationsCount !== undefined ? <Info icon={Users} label={t("event.applications")} value={formatNumber(Number(event.applicationsCount))} /> : null} {/* ADDED FOR i18n */}
            </div>
          </section>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-extrabold text-stone-950">{t("event.applyTitle")}</h2> {/* ADDED FOR i18n */}
              <p className="mt-1 text-xs font-semibold leading-5 text-stone-500">{t("event.applyText")}</p> {/* ADDED FOR i18n */}
              <Textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={t("event.applyMessagePlaceholder")}
                className="mt-4 min-h-28 rounded-2xl border-stone-200 bg-stone-50 text-sm font-semibold"
              />
              <Button onClick={handleApply} disabled={applying} className="mt-4 h-11 w-full rounded-full bg-orange-600 text-xs font-extrabold uppercase tracking-widest text-white hover:bg-orange-500">
                {applying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {t("event.applyNow")} {/* ADDED FOR i18n */}
              </Button>
            </div>
          </aside>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 p-3 shadow-[0_-10px_28px_rgba(28,25,23,0.10)] backdrop-blur-xl md:hidden">
        <Button onClick={handleApply} disabled={applying} className="h-11 w-full rounded-full bg-orange-600 text-xs font-extrabold uppercase tracking-widest text-white hover:bg-orange-500">
          {applying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          {t("event.applyNow")} {/* ADDED FOR i18n */}
        </Button>
      </div>

      <Footer />
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <Icon className="h-4 w-4 text-orange-600" />
      <p className="mt-2 text-[11px] font-extrabold uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-1 line-clamp-2 text-sm font-extrabold text-stone-950">{value}</p>
    </div>
  );
}
