import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  BadgeCheck,
  Calendar,
  ChevronLeft,
  Clock,
  Heart,
  IndianRupee,
  MapPin,
  Share2,
  Sparkles,
  Star,
  User,
  Youtube,
  ChevronRight,
  ShieldCheck,
  Edit3,
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { saveArtist, unsaveArtist, getSavedArtistIds } from "@/services/savedArtistService";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BookingModal from "@/components/BookingModal";
import ArtistCalendar from "@/components/artist-bookings/ArtistCalendar";
import { ArtistVideoEmbed } from "@/components/ArtistVideoEmbed";
import { AdminEditArtistModal } from "@/components/AdminEditArtistModal";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { getYouTubeVideoId, getYoutubeThumbnailUrl, getExternalUrl } from "@/lib/youtube";
import { FIREBASE_READ_TIMEOUT_MS, FIREBASE_WRITE_TIMEOUT_MS, firebaseErrorMessage, logFirebaseError, requireAuthUid, withTimeout } from "@/lib/firebaseSafe";
import { getArtistArtForms } from "@/constants/artistSystem";
import { ImageRegistryService, STATIC_IMAGES } from "@/services/ImageRegistryService";
import { SmartImage } from "@/components/SmartImage";
import { getArtistCategory, getArtistSubCategory, getParentCategoryForSubCategory } from "@/services/filterEngine";
import { useI18n } from "@/i18n/I18nProvider";
import { getArtLabel } from "@/lib/artLabels";
import { getFallbackImageForArt, getFallbackImagesForArt, getUsableImageUrl } from "@/utils/fallbackImages";
import { getUserArtistRating, submitArtistRating } from "@/services/ratingService";
import { getArtistRatingSummary, hasRatings } from "@/services/ratingUtils";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isToday,
  startOfMonth,
  subMonths,
} from "date-fns";
import {
  subscribeArtistBookings,
  subscribeArtistAvailability,
} from "@/services/artistBookingService";
import type { BookingEvent, ArtistAvailabilityBlock, BookingStatus } from "@/types/booking";

function compactLocation(artist: Record<string, any>) {
  return [artist.district || artist.city, artist.state].filter(Boolean).join(", ") || artist.location || "Maharashtra";
}

function getVideoUrl(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const item = value as Record<string, unknown>;
    return typeof item.url === "string" ? item.url : typeof item.link === "string" ? item.link : "";
  }
  return "";
}

function uniqueVideoLinks(values: unknown[]) {
  const seen = new Set<string>();
  return values
    .map(getVideoUrl)
    .map((link) => link.trim())
    .filter((link) => {
      const key = link.toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function getNumberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatPrice(value: unknown) {
  const amount = getNumberValue(value);
  return amount > 0 ? `Rs ${amount.toLocaleString("en-IN")}` : "On request";
}

function isPricingVisible(value: unknown) {
  if (value === true || value === 1) return true;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "visible";
  }
  return false;
}

function firstText(...values: unknown[]) {
  return values.map((value) => String(value || "").trim()).find(Boolean) || "";
}

function getPublicArtistName(artist: Record<string, any>, fallback: string) {
  return firstText(
    artist.nickName,
    artist.brandName,
    artist.stageName,
    artist.capName,
    artist.displayName,
    artist.professionalName,
    artist.name,
    artist.artistName,
    fallback,
  );
}

function getOfficialArtistName(artist: Record<string, any>, publicName: string) {
  const officialName = firstText(artist.fullName, artist.legalName, artist.name, artist.artistName);
  return officialName && officialName.toLowerCase() !== publicName.toLowerCase() ? officialName : "";
}

function getProfileImageUrl(artist: Record<string, any>) {
  return getUsableImageUrl(
    artist.media?.profilePhoto ||
    artist.media?.profileImageUrl ||
    artist.profilePhoto ||
    artist.profileImageUrl ||
    artist.artistProfile?.profileImage ||
    artist.profileImage?.url ||
    artist.profileImage?.thumbnail ||
    artist.profilePicUrl ||
    artist.imageUrl ||
    "",
  );
}

function getCoverImageUrl(artist: Record<string, any>) {
  return getUsableImageUrl(
    artist.media?.coverPhoto ||
    artist.media?.coverImageUrl ||
    artist.coverPhoto ||
    artist.coverImageUrl ||
    artist.artistProfile?.coverImage ||
    artist.coverImage?.url ||
    artist.coverImage?.thumbnail ||
    (typeof artist.coverImage === "string" ? artist.coverImage : "") ||
    artist.bannerImageUrl ||
    artist.coverImages?.[0] ||
    "",
  );
}

function getLinkArray(value: unknown) {
  return Array.isArray(value) ? uniqueVideoLinks(value) : [];
}

function getProfileCategories(artist: Record<string, any>) {
  const source = Array.isArray(artist.categoriesArray) && artist.categoriesArray.length
    ? artist.categoriesArray
    : Array.isArray(artist.artsList) && artist.artsList.length
      ? artist.artsList
      : Array.isArray(artist.categories)
        ? artist.categories
        : [];

  return source
    .map((entry: any, index: number) => {
      if (typeof entry === "string") {
        const artForm = entry.trim();
        if (!artForm) return null;
        return {
          id: `${artForm}-${index}`,
          mainCategory: getParentCategoryForSubCategory(artForm) || artist.mainCategory || artist.category || "Artist",
          artForm,
          soloPerformancePrice: index === 0 ? artist.soloPrice : 0,
          duoPerformancePrice: index === 0 ? artist.duoPrice : 0,
          teamPerformancePrice: index === 0 ? artist.teamPrice : 0,
          showPricingOnProfile: isPricingVisible(index === 0 ? artist.showPricingOnProfile ?? artist.showPriceOnProfile ?? artist.showPrice ?? artist.showPrices : false),
          youtubeLinks: index === 0 ? getLinkArray(artist.youtubeLinks) : [],
        };
      }

      const artForm = String(entry?.artForm || entry?.subcategory || entry?.subCategory || entry?.category || entry?.name || "").trim();
      if (!artForm) return null;
      const mainCategory = String(entry?.mainCategory || entry?.categoryGroup || getParentCategoryForSubCategory(artForm) || artist.mainCategory || "").trim();

      return {
        id: String(entry?.id || `${mainCategory || "category"}-${artForm}-${index}`),
        mainCategory: mainCategory || "Artist",
        artForm,
        soloPerformancePrice: entry?.soloPerformancePrice ?? entry?.soloPrice ?? entry?.price ?? 0,
        duoPerformancePrice: entry?.duoPerformancePrice ?? entry?.duoPrice ?? 0,
        teamPerformancePrice: entry?.teamPerformancePrice ?? entry?.teamPrice ?? 0,
        showPricingOnProfile: isPricingVisible(entry?.showPricingOnProfile ?? entry?.showPriceOnProfile ?? entry?.showPrice ?? entry?.showPrices),
        youtubeLinks: getLinkArray(entry?.youtubeLinks),
      };
    })
    .filter(Boolean);
}

function getLanguageList(artist: Record<string, any>) {
  const raw = Array.isArray(artist.languages)
    ? artist.languages
    : Array.isArray(artist.languagesSpoken)
      ? artist.languagesSpoken
      : typeof artist.languages === "string"
        ? artist.languages.split(",")
        : [];

  return Array.from(new Set(raw.map((value: unknown) => String(value || "").trim()).filter(Boolean)));
}

function getTravelLabel(value: unknown) {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "local") return "Local Only";
  if (normalized === "state") return "Within State";
  if (normalized === "all") return "All India";
  return String(value || "On request");
}

function getForcedMappedImage(...categories: unknown[]) {
  for (const category of categories) {
    const image = ImageRegistryService.getMappedImage(category);
    if (image) return image;
  }

  return ImageRegistryService.getBestImage(String(categories.find(Boolean) || "Artist"), "artist");
}

function mapArtistDocument(id: string, data: Record<string, any>) {
  const media = data.media && typeof data.media === "object" ? data.media : {};
  const artistProfile = data.artistProfile && typeof data.artistProfile === "object" ? data.artistProfile : {};
  return {
    ...data,
    id,
    name: data.name || data.professionalName || "Premium Artist",
    media: {
      ...media,
      profilePhoto:
        media.profilePhoto ||
        media.profileImageUrl ||
        data.profilePhoto ||
        data.profileImageUrl ||
        artistProfile.profileImage ||
        data.profileImage?.url ||
        data.profileImage?.thumbnail ||
        data.profilePicUrl ||
        data.imageUrl ||
        "",
      coverPhoto:
        media.coverPhoto ||
        media.coverImageUrl ||
        data.coverPhoto ||
        data.coverImageUrl ||
        artistProfile.coverImage ||
        data.coverImage?.url ||
        data.coverImage?.thumbnail ||
        (typeof data.coverImage === "string" ? data.coverImage : "") ||
        data.bannerImageUrl ||
        data.coverImages?.[0] ||
        "",
      galleryPhotos: media.galleryPhotos || data.galleryPhotos || [],
    },
  };
}

function ArtistProfileSkeleton() {
  return (
    <div className="profile-page min-h-screen bg-[#fbfaf8] pb-24">
      <Navbar />
      <main className="profile-shell container-shell">
        <div className="mb-4 h-9 w-28 animate-pulse rounded-full bg-orange-100" />

        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] items-stretch lg:h-[380px]">
            <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10 order-2 lg:order-1">
              <div className="h-5 w-28 animate-pulse rounded-full bg-orange-100" />
              <div className="mt-5 h-12 w-4/5 animate-pulse rounded-xl bg-stone-100 md:h-16" />
              <div className="mt-3 h-5 w-2/3 animate-pulse rounded-full bg-stone-100" />
              <div className="mt-6 flex gap-3">
                <div className="h-11 w-36 animate-pulse rounded-full bg-orange-100" />
                <div className="h-11 w-24 animate-pulse rounded-full bg-stone-100" />
              </div>
            </div>
            <div className="order-1 lg:order-2 w-full aspect-video lg:aspect-auto lg:h-full animate-pulse bg-stone-100 rounded-t-2xl lg:rounded-r-2xl lg:rounded-l-none" />
          </div>
        </section>

        <div className="profile-content-grid mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <div className="h-36 animate-pulse rounded-2xl bg-white shadow-sm" />
            <div className="h-[360px] animate-pulse rounded-2xl bg-white shadow-sm" />
          </div>
          <aside className="space-y-4 lg:col-span-1">
            <div className="h-72 animate-pulse rounded-2xl bg-white shadow-md" />
            <div className="h-28 animate-pulse rounded-2xl bg-white shadow-sm" />
          </aside>
        </div>
      </main>
    </div>
  );
}

function RatingStarInput({
  value,
  disabled,
  onChange,
}: {
  value: number;
  disabled?: boolean;
  onChange: (rating: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          className="rounded-full p-1 text-orange-500 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`Rate ${star} out of 5`}
        >
          <Star className={`h-5 w-5 ${star <= value ? "fill-orange-500 text-orange-500" : "text-stone-300"}`} />
        </button>
      ))}
    </div>
  );
}

export default function ArtistProfile() {
  const { formatNumber, t } = useI18n(); // ADDED FOR i18n
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Determine privilege level for the current user
  const isPrivileged = Boolean(
    currentUser && (currentUser.uid === id || currentUser.role === "admin" || currentUser.email === "admin@mykalakar.com")
  );

  // New Phase 1 states
  const [artistBookings, setArtistBookings] = useState<BookingEvent[]>([]);
  const [artistAvailability, setArtistAvailability] = useState<ArtistAvailabilityBlock[]>([]);
  const [preselectedDate, setPreselectedDate] = useState<string>("");
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));

  // Subscriptions to bookings and availability blocks
  useEffect(() => {
    if (!id || id.startsWith("demo-")) return;

    let unsubBookings: (() => void) | undefined;
    if (isPrivileged) {
      unsubBookings = subscribeArtistBookings(id, (data) => {
        setArtistBookings(data);
      });
    }

    const unsubAvailability = subscribeArtistAvailability(id, (data) => {
      setArtistAvailability(data);
    });

    return () => {
      if (unsubBookings) unsubBookings();
      unsubAvailability();
    };
  }, [id, currentUser]);

  useEffect(() => {
    let mounted = true;
    if (!id) {
      setArtist(null);
      setLoading(false);
      return;
    }

    if (id.startsWith("demo-")) {
      setArtist(null);
      setLoading(false);
      return;
    }

    async function loadArtistProfile() {
      setLoading(true);
      try {
        const artistSnap = await withTimeout(
          getDoc(doc(db, "artists", id)),
          FIREBASE_READ_TIMEOUT_MS,
          "Artist profile is taking too long to load.",
        );

        if (!mounted) return;

        if (!artistSnap.exists()) {
          setArtist(null);
          setIsSaved(false);
          return;
        }

        const artistRecord = mapArtistDocument(artistSnap.id, artistSnap.data() as Record<string, any>);
        setArtist(artistRecord);

        if (currentUser) {
          const [savedIds, existingRating] = await Promise.all([
            getSavedArtistIds(currentUser.uid).catch(() => [] as string[]),
            withTimeout(getUserArtistRating(artistRecord.id, currentUser.uid), FIREBASE_READ_TIMEOUT_MS, "Artist rating is taking too long.").catch(() => null),
          ]);
          if (!mounted) return;
          setIsSaved(savedIds.includes(artistRecord.id));
          setUserRating(existingRating);
          setSelectedRating(existingRating || 0);
        } else {
          setIsSaved(false);
          setUserRating(null);
          setSelectedRating(0);
        }
      } catch (error) {
        logFirebaseError(error);
        if (mounted) {
          setArtist(null);
          setIsSaved(false);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadArtistProfile();

    return () => {
      mounted = false;
    };
  }, [currentUser, id]);

  useEffect(() => {
    setActiveVideoIndex(0);
  }, [id]);

  const artForms = useMemo(() => (artist ? getArtistArtForms(artist) : []), [artist]);

  useEffect(() => {
    if (!artist) return;

    const name = getPublicArtistName(artist, t("artist.premiumArtist")); // ADDED FOR i18n
    const title = `MyKalakar | ${name}`;
    const description = t("artist.metaDescription", { name }); // ADDED FOR i18n
    const image = getForcedMappedImage(
      artist.category,
      artist.subcategory,
      artist.artistProfile?.category,
      artist.artistProfile?.subcategory,
      artist.services?.[0],
    );

    const setMeta = (selector: string, attributes: Record<string, string>, content: string) => {
      const existing = Array.from(document.head.querySelectorAll<HTMLMetaElement>(selector));
      const targets = existing.length ? existing : [document.createElement("meta")];

      targets.forEach((element) => {
        Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
        element.setAttribute("content", content);
        if (!element.parentElement) document.head.appendChild(element);
      });
    };

    document.title = title;
    setMeta('meta[name="description"]', { name: "description" }, description);
    setMeta('meta[property="og:title"]', { property: "og:title" }, title);
    setMeta('meta[property="og:description"]', { property: "og:description" }, description);
    setMeta('meta[property="og:image"]', { property: "og:image" }, image);
    setMeta('meta[property="og:url"]', { property: "og:url" }, window.location.href);
    setMeta('meta[name="twitter:title"]', { name: "twitter:title" }, title);
    setMeta('meta[name="twitter:description"]', { name: "twitter:description" }, description);
  }, [artist, t]); // ADDED FOR i18n

  const profileCategories = artist ? getProfileCategories(artist) : [];

  const pricingRangeLabel = useMemo(() => {
    if (!profileCategories || profileCategories.length === 0) return "On Request";
    const prices = profileCategories
      .flatMap((entry: any) => [
        entry.soloPerformancePrice,
        entry.duoPerformancePrice,
        entry.teamPerformancePrice,
      ])
      .map(Number)
      .filter((p) => p > 0);
    if (prices.length === 0) return "On Request";
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    return minPrice === maxPrice
      ? `Rs ${minPrice.toLocaleString("en-IN")}`
      : `Rs ${minPrice.toLocaleString("en-IN")} - Rs ${maxPrice.toLocaleString("en-IN")}`;
  }, [profileCategories]);

  const coverageAreas = useMemo(() => {
    if (!artist) return "Mumbai, Pune, Thane, Navi Mumbai, Nagpur, Nashik";
    return Array.isArray(artist.coverageAreas) && artist.coverageAreas.length
      ? artist.coverageAreas.join(", ")
      : artist.districtsArray && Array.isArray(artist.districtsArray) && artist.districtsArray.length
        ? artist.districtsArray.join(", ")
        : "Mumbai, Pune, Thane, Navi Mumbai, Nagpur, Nashik";
  }, [artist]);

  const handleSaveArtist = async () => {
    if (!currentUser) {
      toast({ title: t("artist.loginRequiredTitle"), description: t("artist.loginRequiredText") }); // ADDED FOR i18n
      return;
    }
    if (!artist || isSaving) return;

    // ── Optimistic update: flip state immediately before the network call ──
    const previouslySaved = isSaved;
    const artistName = getPublicArtistName(artist, t("artist.fallbackName"));
    setIsSaved(!previouslySaved);
    setIsSaving(true);

    try {
      const uid = requireAuthUid(currentUser);

      if (previouslySaved) {
        // Un-save: atomic arrayRemove
        await unsaveArtist(uid, artist.id);
        toast({
          title: t("artist.removedTitle"),
          description: t("artist.removedText", { name: artistName }),
        }); // ADDED FOR i18n
      } else {
        // Save: atomic arrayUnion
        await saveArtist(uid, artist.id);
        toast({
          title: t("artist.savedTitle"),
          description: t("artist.savedText", { name: artistName }),
        }); // ADDED FOR i18n
      }
    } catch (error: any) {
      // ── Rollback on failure ──────────────────────────────────────────────
      setIsSaved(previouslySaved);
      logFirebaseError(error);
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: firebaseErrorMessage(error, t("artist.saveFailed")),
      }); // ADDED FOR i18n
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!currentUser) {
      toast({ title: t("artist.loginRequiredTitle"), description: t("artist.loginToRate") }); // ADDED FOR i18n
      return;
    }
    if (!artist) return;
    if (currentUser.uid === artist.id || currentUser.uid === artist.uid || currentUser.uid === artist.userId) {
      toast({ title: t("artist.selfRatingUnavailable") }); // ADDED FOR i18n
      return;
    }
    if (!selectedRating) {
      toast({ title: t("artist.selectRating") }); // ADDED FOR i18n
      return;
    }

    setIsRatingSubmitting(true);
    try {
      const uid = requireAuthUid(currentUser);
      const result = await withTimeout(
        submitArtistRating({ artistId: artist.id, userId: uid, rating: selectedRating }),
        FIREBASE_WRITE_TIMEOUT_MS,
        t("artist.ratingFailed"), // ADDED FOR i18n
      );

      setUserRating(result.rating);
      setSelectedRating(result.rating);
      setArtist((current: any) =>
        current
          ? {
              ...current,
              averageRating: result.averageRating,
              totalRatings: result.totalRatings,
              ratingSum: result.ratingSum,
              rating: result.averageRating,
              reviews: result.totalRatings,
              stats: {
                ...(current.stats || {}),
                rating: result.averageRating,
                reviews: result.totalRatings,
              },
            }
          : current
      );
      toast({ title: t("artist.ratingSubmittedTitle"), description: t("artist.ratingSubmittedText", { rating: result.rating }) }); // ADDED FOR i18n
    } catch (error: any) {
      logFirebaseError(error, "Submit artist rating");
      toast({ variant: "destructive", title: t("common.error"), description: firebaseErrorMessage(error, t("artist.ratingFailed")) }); // ADDED FOR i18n
    } finally {
      setIsRatingSubmitting(false);
    }
  };

  const handleShare = async () => {
    const artistName = artist ? getPublicArtistName(artist, t("artist.premiumArtist")) : t("artist.premiumArtist"); // ADDED FOR i18n
    const url = window.location.href;
    const sharePayload = {
      title: `MyKalakar | ${artistName}`,
      text: t("artist.metaDescription", { name: artistName }), // ADDED FOR i18n
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(sharePayload);
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: t("artist.linkCopiedTitle"), description: t("artist.linkCopiedText") }); // ADDED FOR i18n
      }
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        toast({ title: t("artist.shareUnavailableTitle"), description: t("artist.shareUnavailableText") }); // ADDED FOR i18n
      }
    }
  };

  if (loading) {
    return <ArtistProfileSkeleton />;
  }

  if (!artist) {
    return (
      <div className="profile-page min-h-screen bg-[#FAFAFA]">
        <Navbar />
        <main className="page-shell container-shell flex min-h-[70vh] flex-col items-center justify-center text-center">
          <h1 className="text-2xl font-extrabold text-stone-950">{t("artist.notFoundTitle")}</h1> {/* ADDED FOR i18n */}
          <p className="mt-2 max-w-sm text-sm font-semibold leading-6 text-stone-500">{t("artist.notFoundText")}</p> {/* ADDED FOR i18n */}
          <Link to="/artists" className="mt-5 inline-flex h-10 items-center rounded-full bg-stone-950 px-5 text-xs font-extrabold text-white">
            {t("artist.backToArtists")} {/* ADDED FOR i18n */}
          </Link>
        </main>
      </div>
    );
  }

  const primaryCategory = profileCategories[0];
  const artistName = getPublicArtistName(artist, t("artist.premiumArtist")); // ADDED FOR i18n
  const officialArtistName = getOfficialArtistName(artist, artistName);
  const category = primaryCategory?.mainCategory || getArtistCategory(artist) || "Artist";
  const artType = primaryCategory?.artForm || getArtistSubCategory(artist) || artForms[0] || category;
  const artTypeLabel = getArtLabel(t, artType); // ADDED FOR i18n
  const location = compactLocation(artist);
  const profileAvatarImage = getProfileImageUrl(artist);
  const customHeroImage = getCoverImageUrl(artist);
  const fallbackHeroImage = getFallbackImageForArt(
    [artType, category, artist.category, artist.subcategory, artist.mainCategory],
    `profile-hero:${artist.id || artistName}`,
  );
  const coverImage = customHeroImage || fallbackHeroImage || getForcedMappedImage(
    artist.category,
    artist.subcategory,
    artType,
    category,
    artForms[0],
    artist.services?.[0],
  );
  const avatarFallbackImage = getFallbackImageForArt(
    [artType, category, artist.category, artist.subcategory, artist.mainCategory],
    `profile-avatar:${artist.id || artistName}`,
  ) || getForcedMappedImage(artist.category, artist.subcategory, artType, category);
  const uploadedGallery =
    Array.isArray(artist.galleryPhotos) && artist.galleryPhotos.length
      ? artist.galleryPhotos
      : Array.isArray(artist.media?.galleryPhotos)
        ? artist.media.galleryPhotos
        : [];
  const uploadedGalleryPhotos = uploadedGallery.map((photo: unknown) => String(photo || "").trim()).filter(Boolean);
  const galleryPhotos = uploadedGalleryPhotos.length
    ? uploadedGalleryPhotos
    : getFallbackImagesForArt(artType, category, artist.category, artist.mainCategory).slice(0, 4);
  const categoryYoutubeLinks = profileCategories.flatMap((entry) => entry.youtubeLinks);
  const youtubeLinks = uniqueVideoLinks([
    artist.portfolioUrl,
    artist.videoLink,
    ...categoryYoutubeLinks,
    ...(Array.isArray(artist.youtubeLinks) ? artist.youtubeLinks.map(getVideoUrl) : []),
    ...(Array.isArray(artist.videos) ? artist.videos.map(getVideoUrl) : []),
    ...(Array.isArray(artist.socialLinks) ? artist.socialLinks.map(getVideoUrl) : []),
    ...(Array.isArray(artist.artistProfile?.youtubeLinks) ? artist.artistProfile.youtubeLinks.map(getVideoUrl) : []),
  ]);
  const portfolioVideos = youtubeLinks
    .map((link, index) => {
      const videoId = getYouTubeVideoId(link);
      const thumbnailUrl = getYoutubeThumbnailUrl(link);
      return videoId && thumbnailUrl
        ? { link, index, videoId, thumbnailUrl }
        : null;
    })
    .filter(Boolean) as Array<{ link: string; index: number; videoId: string; thumbnailUrl: string }>;
  const activeVideo = portfolioVideos[Math.min(activeVideoIndex, Math.max(portfolioVideos.length - 1, 0))];
  const services = Array.from(new Set([
    ...profileCategories.map((entry) => entry.artForm),
    ...(Array.isArray(artist.services) ? artist.services : []),
    ...artForms,
  ])).slice(0, 10);
  const experience = artist.experience || artist.artistProfile?.experience || 5;
  const ratingSummary = getArtistRatingSummary(artist);
  const hasArtistRatings = hasRatings(ratingSummary);
  const rating = hasArtistRatings ? ratingSummary.averageRating.toFixed(1) : t("artist.noRatingsYet"); // ADDED FOR i18n
  const ratingWithCount = hasArtistRatings
    ? `${rating} (${formatNumber(ratingSummary.totalRatings)} ${t("artist.ratings")})`
    : t("artist.noRatingsYet"); // ADDED FOR i18n
  const isOwnArtist = Boolean(currentUser && (currentUser.uid === artist.id || currentUser.uid === artist.uid || currentUser.uid === artist.userId));
  const ratingHelpText = isOwnArtist
    ? t("artist.selfRatingUnavailable")
    : userRating
      ? t("artist.yourRating", { rating: userRating })
      : currentUser
        ? t("artist.selectRating")
        : t("artist.loginToRate"); // ADDED FOR i18n
  const bio = artist.bio || artist.description || artist.artistProfile?.bio || t("artist.defaultBioWithLocation", { artType: artTypeLabel, location }); // ADDED FOR i18n
  const languages = getLanguageList(artist);
  const travelWillingness = getTravelLabel(artist.travelWillingness);
  
  const pageTitle = `MyKalakar | ${artistName}`;

  return (
    <div className="profile-page min-h-screen bg-[#F7F8F4] pb-24">
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>

      <Navbar />

      <main className="profile-shell container-shell">
        {/* Back link */}
        <Link
          to="/artists"
          className="mb-4 inline-flex h-9 items-center gap-1.5 rounded-full border border-stone-200 bg-white/90 px-3 text-xs font-extrabold text-stone-600 shadow-sm backdrop-blur-sm transition hover:border-orange-200 hover:text-orange-600"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("nav.artists")} {/* ADDED FOR i18n */}
        </Link>

        {/* Compact banner hero */}
        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] items-stretch lg:h-[340px]">
            <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10 order-2 lg:order-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-orange-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  {artTypeLabel} {/* ADDED FOR i18n */}
                </span>
                {artist.verified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-emerald-700">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    {t("artist.verified")} {/* ADDED FOR i18n */}
                  </span>
                ) : null}
              </div>

              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-white bg-stone-100 shadow-[0_12px_28px_rgba(28,25,23,0.14)] ring-1 ring-orange-100 sm:h-24 sm:w-24">
                  <SmartImage
                    src={profileAvatarImage || avatarFallbackImage || STATIC_IMAGES.profileCover}
                    alt={`${artistName} profile photo`}
                    usageId={`profile-avatar:${artist.id}`}
                    category={artType}
                    orientation="portrait"
                    priority
                    aspectRatio="aspect-auto"
                    sizes="96px"
                    containerClassName="h-full w-full overflow-hidden rounded-full"
                    imageClassName="h-full w-full object-cover object-center"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="max-w-3xl text-2xl font-extrabold leading-tight text-stone-950 sm:text-3xl lg:text-4xl">
                      {artistName}
                    </h1>
                    {isPrivileged && (
                      <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center gap-1.5 rounded-full bg-stone-950 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm transition hover:bg-stone-800 hover:shadow-md"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit Profile
                      </button>
                    )}
                  </div>
                  {officialArtistName ? (
                    <p className="mt-1 text-xs font-extrabold uppercase tracking-widest text-stone-400">
                      Official Name: <span className="normal-case tracking-normal text-stone-600">{officialArtistName}</span>
                    </p>
                  ) : null}
                  <p className="mt-1.5 max-w-2xl text-sm font-semibold leading-5 text-stone-600">
                    {t("artist.basedIn", { artType: artTypeLabel, location })} {/* ADDED FOR i18n */}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2.5 text-xs font-semibold text-stone-500">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-orange-500" />
                  {location}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-orange-500" />
                  {t("artist.experiencePlus", { years: formatNumber(Number(experience) || 0) })} {/* ADDED FOR i18n */}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
                  {ratingWithCount}
                </span>
                <span className="inline-flex items-center gap-1 font-bold text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-full text-xs">
                  <IndianRupee className="h-3 w-3 text-orange-600" />
                  {pricingRangeLabel}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  onClick={() => setBookingOpen(true)}
                  className="h-11 rounded-full bg-orange-600 px-5 text-xs font-extrabold uppercase tracking-widest text-white shadow-sm transition hover:bg-orange-700 hover:shadow-md"
                >
                  {t("artist.sendInquiry")} {/* ADDED FOR i18n */}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="h-11 rounded-full border-gray-200 bg-white px-4 text-xs font-extrabold uppercase tracking-widest text-stone-700 shadow-sm transition hover:border-orange-200 hover:text-orange-600"
                >
                  <Share2 className="mr-1.5 h-4 w-4" />
                  {t("artist.share")} {/* ADDED FOR i18n */}
                </Button>
                <Button
                  variant="outline"
                  disabled={isSaving}
                  onClick={handleSaveArtist}
                  aria-label={isSaved ? t("artist.saved") : t("artist.save")}
                  aria-pressed={isSaved}
                  className={[
                    "h-11 rounded-full px-4 text-xs font-extrabold uppercase tracking-widest shadow-sm",
                    "transition-all duration-200 ease-out",
                    isSaved
                      ? "border-[#E25C1D] bg-[#E25C1D]/8 text-[#E25C1D] hover:bg-[#E25C1D]/15 hover:border-[#E25C1D]"
                      : "border-gray-200 bg-white text-stone-700 hover:border-orange-200 hover:text-orange-600",
                    isSaving ? "opacity-70" : "",
                  ].join(" ")}
                >
                  <Heart
                    className={[
                      "mr-1.5 h-4 w-4 transition-all duration-200",
                      isSaved
                        ? "fill-[#E25C1D] text-[#E25C1D] scale-110"
                        : "scale-100",
                    ].join(" ")}
                  />
                  {isSaved ? t("artist.saved") : t("artist.save")} {/* ADDED FOR i18n */}
                </Button>
              </div>
            </div>

            <div className="relative order-1 lg:order-2 w-full aspect-video lg:aspect-auto lg:h-full lg:max-h-[340px] overflow-hidden bg-stone-100 rounded-t-2xl lg:rounded-r-2xl lg:rounded-l-none">
              <SmartImage
                src={coverImage || STATIC_IMAGES.profileCover}
                alt={`${artistName} cover image`}
                usageId={`profile-banner:${artist.id}`}
                category={artType}
                orientation="landscape"
                priority
                aspectRatio="aspect-auto"
                sizes="(max-width: 1024px) 100vw, 48vw"
                containerClassName="h-full w-full overflow-hidden rounded-none"
                imageClassName="w-full h-full object-cover object-center"
              />
            </div>

          </div>
        </section>

        {/* Main content + sticky sidebar */}
        <div className="profile-content-grid mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column */}
          <div className="space-y-5 lg:col-span-2">

            {/* Bio */}
            <section className="profile-panel rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <h2 className="profile-section-title flex items-center gap-2 text-base font-extrabold text-gray-900">
                <User className="h-4 w-4 text-orange-500" />
                {t("artist.about")} {/* ADDED FOR i18n */}
              </h2>
              <p className="mt-3 text-sm font-medium leading-7 text-stone-600">{bio}</p>
            </section>

            {profileCategories.length > 0 ? (
              <section className="profile-panel rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                <h2 className="profile-section-title flex items-center gap-2 text-base font-extrabold text-gray-900">
                  <Sparkles className="h-4 w-4 text-orange-500" />
                  Art Categories
                </h2>
                <div className="mt-4 grid gap-3">
                  {profileCategories.map((entry) => (
                    <article key={entry.id} className="rounded-xl border border-stone-100 bg-stone-50 p-4">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-extrabold text-stone-950">{getArtLabel(t, entry.artForm)}</p>
                          <p className="text-xs font-bold uppercase tracking-wide text-stone-400">{entry.mainCategory}</p>
                        </div>
                      </div>

                      {entry.showPricingOnProfile ? (
                        <div className="mt-3 grid gap-2 text-xs font-bold text-stone-600 sm:grid-cols-3">
                          {[
                            ["Solo", entry.soloPerformancePrice],
                            ["Duo", entry.duoPerformancePrice],
                            ["Team", entry.teamPerformancePrice],
                          ].map(([label, value]) => (
                            <div key={label} className="rounded-lg border border-white bg-white/80 px-3 py-2">
                              <span className="flex items-center gap-1 text-stone-400">
                                <IndianRupee className="h-3.5 w-3.5 text-orange-500" />
                                {label}
                              </span>
                              <p className="mt-1 text-sm text-stone-950">{formatPrice(value)}</p>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {entry.youtubeLinks.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {entry.youtubeLinks.map((link, index) => (
                            <a
                              key={`${entry.id}-youtube-${index}`}
                              href={getExternalUrl(link)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-white px-3 py-1.5 text-[11px] font-extrabold text-red-600 transition hover:border-red-200 hover:bg-red-50"
                            >
                              <Youtube className="h-3.5 w-3.5" />
                              YouTube {formatNumber(index + 1)}
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {/* YouTube Videos */}
            {portfolioVideos.length > 0 && activeVideo ? (
              <section className="profile-panel profile-media-panel rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                <h2 className="profile-section-title flex items-center gap-2 text-base font-extrabold text-gray-900">
                  <Youtube className="h-4 w-4 text-red-500" />
                  {t("artist.portfolioVideos")} {/* ADDED FOR i18n */}
                </h2>
                <p className="mt-1 text-xs font-semibold text-stone-400">{t("artist.portfolioText")}</p> {/* ADDED FOR i18n */}

                <ArtistVideoEmbed
                  key={activeVideo.videoId}
                  videoUrl={activeVideo.link}
                  title={`${artistName} performance ${activeVideo.index + 1}`}
                  className="mt-4"
                />

                {portfolioVideos.length > 1 ? (
                  <div className="profile-video-thumbs mt-4">
                    {portfolioVideos.slice(0, 6).map((video, index) => (
                      <button
                        key={video.videoId}
                        type="button"
                        data-active={video.videoId === activeVideo.videoId}
                        onClick={() => setActiveVideoIndex(index)}
                        className="profile-video-thumb group text-left"
                        aria-label={t("artist.playPerformance", { name: artistName, number: formatNumber(video.index + 1) })}
                      >
                        <SmartImage
                          src={video.thumbnailUrl}
                          alt={`${artistName} video ${video.index + 1}`}
                          usageId={`profile-video-thumb:${artist.id}:${video.videoId}`}
                          category={artType}
                          orientation="landscape"
                          aspectRatio="aspect-video"
                          containerClassName="h-full w-full transition duration-300 group-hover:scale-[1.03]"
                        />
                      </button>
                    ))}
                  </div>
                ) : null}
              </section>
            ) : null}

            {/* Gallery */}
            {galleryPhotos.length > 0 ? (
              <section className="profile-panel rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                <h2 className="profile-section-title flex items-center gap-2 text-base font-extrabold text-gray-900">
                  <Sparkles className="h-4 w-4 text-orange-500" />
                  {t("artist.gallery")} {/* ADDED FOR i18n */}
                </h2>
                <div className="profile-gallery mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-3">
                  {galleryPhotos.slice(0, 9).map((photo: string, index: number) => (
                    <div
                      key={`${photo}-${index}`}
                      className="gallery-tile group aspect-[4/3] overflow-hidden rounded-xl bg-stone-100"
                    >
                      <SmartImage
                        src={photo}
                        alt={t("artist.galleryAlt", { name: artistName, number: formatNumber(index + 1) })}
                        usageId={`profile-gallery:${artist.id}:${index}`}
                        category={artType}
                        orientation="landscape"
                        aspectRatio="aspect-auto"
                        containerClassName="h-full w-full transition duration-500 group-hover:scale-[1.06]"
                      />
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
            {/* Availability Calendar */}
            <section className="profile-panel rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md overflow-hidden">
              <ArtistCalendar 
                artistId={String(artist.uid || artist.userId || artist.id)}
                currentUser={currentUser}
                bookings={artistBookings}
                availability={artistAvailability}
                onBookingSelect={(booking) => {
                  console.log("Selected booking:", booking);
                  // Optional: open a modal to show booking details here if privileged
                }}
              />
            </section>
          </div>

          {/* Booking sidebar */}
          <aside className="space-y-4 lg:col-span-1 lg:sticky lg:top-24 lg:self-start">

            {/* Invite card */}
            <div className="booking-card overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
              {/* Orange accent bar */}
              <div className="h-1 w-full bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500" />
              <div className="p-5">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-orange-500">{t("artist.booking")}</p> {/* ADDED FOR i18n */}
                <h2 className="profile-section-title mt-1 text-xl font-extrabold text-gray-900">{t("artist.inviteArtist")}</h2> {/* ADDED FOR i18n */}
                <p className="mt-1.5 text-xs font-medium leading-5 text-stone-500">
                  {t("artist.inquiryText")} {/* ADDED FOR i18n */}
                </p>

                {/* Stats row */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { label: t("artist.rating"), value: rating }, // ADDED FOR i18n
                    { label: t("artist.expShort"), value: t("artist.yearsShort", { years: formatNumber(Number(experience) || 0) }) }, // ADDED FOR i18n
                    { label: t("nav.events"), value: "50+" }, // ADDED FOR i18n
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl border border-stone-100 bg-stone-50 p-2.5 text-center shadow-sm">
                      <p className="text-base font-extrabold text-orange-600">{value}</p>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-xl border border-stone-100 bg-stone-50 p-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-stone-400">{t("artist.rateArtist")}</p> {/* ADDED FOR i18n */}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <RatingStarInput value={selectedRating} disabled={isRatingSubmitting || isOwnArtist} onChange={setSelectedRating} />
                    <button
                      type="button"
                      disabled={isRatingSubmitting || isOwnArtist || !selectedRating}
                      onClick={handleSubmitRating}
                      className="rounded-lg bg-orange-600 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {userRating ? t("artist.updateRating") : t("artist.submitRating")} {/* ADDED FOR i18n */}
                    </button>
                  </div>
                  <p className="mt-2 text-xs font-semibold text-stone-500">{ratingHelpText}</p> {/* ADDED FOR i18n */}
                </div>

                {/* CTA */}
                <button
                  onClick={() => setBookingOpen(true)}
                  className="mt-4 w-full rounded-xl bg-orange-600 py-3 text-sm font-extrabold uppercase tracking-widest text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-orange-700 hover:shadow-md active:scale-[0.98]"
                >
                  {t("artist.sendInquiry")} {/* ADDED FOR i18n */}
                </button>

                {/* Secondary actions */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    disabled={isSaving}
                    onClick={handleSaveArtist}
                    className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white text-xs font-extrabold text-stone-600 transition hover:border-orange-200 hover:text-orange-600 disabled:opacity-50 shadow-sm"
                  >
                    <Heart className={`h-3.5 w-3.5 ${isSaved ? "fill-orange-500 text-orange-500" : ""}`} />
                    {isSaved ? t("artist.saved") : t("artist.save")} {/* ADDED FOR i18n */}
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white text-xs font-extrabold text-stone-600 transition hover:border-orange-200 hover:text-orange-600 shadow-sm"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    {t("artist.share")} {/* ADDED FOR i18n */}
                  </button>
                </div>
              </div>
            </div>

            {/* Services Card */}
            {services.length > 0 && (
              <div className="profile-side-panel rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                <h2 className="profile-section-title text-sm font-extrabold text-gray-900">{t("artist.servicesSpecialities")}</h2> {/* ADDED FOR i18n */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {services.map((service) => (
                    <span
                      key={String(service)}
                      className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-[11px] font-extrabold text-stone-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                    >
                      {getArtLabel(t, service)} {/* ADDED FOR i18n */}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="profile-side-panel rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <h2 className="profile-section-title text-sm font-extrabold text-gray-900">Profile Details</h2>
              <div className="mt-3 space-y-3">
                <div className="rounded-xl bg-stone-50 p-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-wide text-stone-400">Languages</p>
                  <p className="mt-1 text-sm font-extrabold text-stone-950">{languages.length ? languages.join(", ") : "On request"}</p>
                </div>
                <div className="rounded-xl bg-stone-50 p-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-wide text-stone-400">Travel</p>
                  <p className="mt-1 text-sm font-extrabold text-stone-950">{travelWillingness}</p>
                </div>
              </div>
            </div>
            {/* Location card */}
            <div className="profile-side-panel rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <h2 className="profile-section-title text-sm font-extrabold text-gray-900">{t("event.location")}</h2>
              <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-stone-50 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50">
                  <MapPin className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-stone-950">{location}</p>
                  <p className="text-xs font-semibold text-stone-500">Available across coverage areas</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-stone-400 mb-1">Coverage Areas</p>
                <div className="flex flex-wrap gap-1">
                  {coverageAreas.split(",").map((area) => (
                    <span key={area} className="text-[10px] font-bold bg-stone-100 px-2.5 py-1 rounded-full text-stone-600">
                      {area.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </aside>
        </div>
      </main>

      <Footer />
      <BookingModal
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        artistName={artistName}
        artistId={String(artist.uid || artist.userId || artist.id)}
        preselectedDate={preselectedDate}
      />
      <AdminEditArtistModal
        artist={artist}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSaveSuccess={(updatedData) => {
          setArtist((prev: any) => ({ ...prev, ...updatedData }));
        }}
      />
    </div>
  );
}
