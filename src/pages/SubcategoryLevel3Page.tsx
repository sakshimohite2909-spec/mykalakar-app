import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  BadgeCheck,
  Star,
  Target,
  Heart,
  X,
  Check,
  Sparkles,
  Filter,
  ArrowUpDown,
  Award,
  ShieldCheck,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getActiveArtistsPage, clearDataCache } from "@/services/dataService";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { resolveArtistProfilePhoto } from "@/services/dataNormalizer";
import { imageRegistry } from "@/services/ImageRegistryService";
import { extractArtistServices, matchesArtistCity } from "@/constants/artistSystem";
import { SearchableCityDropdown } from "@/components/search/SearchableCityDropdown";
import { useI18n } from "@/i18n/I18nProvider";
import { getArtLabel } from "@/lib/artLabels";
import { VerificationBadge } from "@/components/verification/VerificationBadge";

interface ArtistCardData {
  id: string;
  name: string;
  isVerified: boolean;
  rawItem?: any;
  rating: number;
  reviewsCount: number;
  location: string;
  experience: string;
  startingPrice: string;
  image: string;
  subCategory: string;
  servicesList?: string[];
}

const MOCK_ARTISTS: ArtistCardData[] = [];

export default function SubcategoryLevel3Page() {
  const { eventName, categoryName, subCategoryName } = useParams<{
    eventName?: string;
    categoryName?: string;
    subCategoryName?: string;
  }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useI18n();

  const rawEvent = eventName || searchParams.get("event") || searchParams.get("category");
  const rawCategory = categoryName || searchParams.get("group") || searchParams.get("categoryGroup");
  const rawSubcategory = subCategoryName || searchParams.get("subCategory") || searchParams.get("subcategory");

  const decodedEvent = rawEvent ? decodeURIComponent(rawEvent) : null;
  const decodedCategory = rawCategory ? decodeURIComponent(rawCategory) : null;
  const decodedSubcategory = rawSubcategory ? decodeURIComponent(rawSubcategory) : null;

  const initialLocation = searchParams.get("location") || searchParams.get("city") || "All Cities";
  const [selectedCity, setSelectedCity] = useState(initialLocation);
  const [selectedSort, setSelectedSort] = useState("Recommended");
  const [selectedPrice, setSelectedPrice] = useState("All");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Filter Drawer State (Zomato-style Slide-out)
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState(false);
  const [filterMinRating, setFilterMinRating] = useState<number>(0);
  const [filterMinExp, setFilterMinExp] = useState<number>(0);

  const [realArtists, setRealArtists] = useState<ArtistCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const locParam = searchParams.get("location") || searchParams.get("city");
    if (locParam) {
      setSelectedCity(locParam);
    } else {
      setSelectedCity("All Cities");
    }
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;
    clearDataCache();
    getActiveArtistsPage(30)
      .then((res) => {
        if (!isMounted) return;
        if (res.items && res.items.length > 0) {
          const mapped: (ArtistCardData & { rawItem: any })[] = res.items.map((item: any) => {
            const extracted = extractArtistServices(item);
            const servicesList = Array.from(new Set(extracted.map((s) => s.subcategory || s.artForm).filter(Boolean)));
            const subCat = servicesList[0] || item.subCategory || item.subcategory || item.artForm || item.category || "Artist";
            const uploadedImage = resolveArtistProfilePhoto(item);
            const fallbackImage = imageRegistry.getUniqueImage({
              category: subCat,
              type: "artist",
              key: item.uid || item.id || item.displayName || item.name || "artist-card",
            });

            return {
              id: item.uid || item.id || String(Math.random()),
              name: item.displayName || item.name || item.stageName || item.artistName || "Professional Artist",
              isVerified: Boolean(item.isVerified || item.verified),
              rating: item.rating ? Number(item.rating) : 4.8,
              reviewsCount: item.reviewsCount ? Number(item.reviewsCount) : 120,
              location: item.location || item.city || "Pune, Maharashtra",
              experience: item.experience ? `${item.experience}+ Years Experience` : "6+ Years Experience",
              startingPrice: item.startingPrice ? String(item.startingPrice) : "25,000",
              image: uploadedImage || fallbackImage,
              subCategory: subCat,
              servicesList: servicesList.length ? servicesList : [subCat],
              rawItem: item,
            };
          });
          setRealArtists(mapped);
        }
      })
      .catch((err) => {
        console.warn("Failed to load live artists for Level 3", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [decodedSubcategory, decodedCategory, decodedEvent]);

  const queryParam = searchParams.get("q") || searchParams.get("query") || "";

  const displayTitle = useMemo(() => {
    const locSuffix = selectedCity && selectedCity !== "All Cities" ? ` in ${selectedCity}` : "";
    if (queryParam) return `Artists matching "${queryParam}"${locSuffix}`;
    if (decodedSubcategory) return `${decodedSubcategory}${locSuffix}`;
    if (decodedCategory) return `${decodedCategory} Artists${locSuffix}`;
    if (decodedEvent) return `Artists in ${decodedEvent}${locSuffix}`;
    return `All Artists${locSuffix}`;
  }, [queryParam, decodedSubcategory, decodedCategory, decodedEvent, selectedCity]);

  const displayArtists = useMemo(() => {
    const combined = [...realArtists];
    const unique = new Map<string, ArtistCardData & { rawItem?: any }>();
    combined.forEach((art) => {
      if (!unique.has(art.id)) unique.set(art.id, art);
    });

    let list = Array.from(unique.values());

    // Filter by 3-level Database Hierarchy (Subcategory / Category Group / Event Type)
    const categoryFilter = (decodedSubcategory || decodedCategory || decodedEvent || "").trim().toLowerCase();
    if (categoryFilter && categoryFilter !== "all" && categoryFilter !== "explore" && categoryFilter !== "artists") {
      list = list.filter((a) => {
        const item = a.rawItem || {};
        const allCategoryValues = [
          a.subCategory,
          item.subCategory,
          item.subcategory,
          item.artForm,
          item.primaryArtForm,
          item.category,
          item.mainCategory,
          item.discipline,
          item.eventType,
          ...(Array.isArray(item.eventTypes) ? item.eventTypes : []),
          ...(Array.isArray(item.categories) ? item.categories : []),
          ...(Array.isArray(item.services) ? item.services : []),
          ...(Array.isArray(item.artsList) ? item.artsList.flatMap((x: any) => [x.category, x.mainCategory]) : []),
        ]
          .filter(Boolean)
          .map((v) => String(v).trim().toLowerCase());

        if (allCategoryValues.length === 0) return true;

        return allCategoryValues.some(
          (v) => v === categoryFilter || v.includes(categoryFilter) || categoryFilter.includes(v)
        );
      });
    }

    if (queryParam) {
      const qLower = queryParam.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(qLower) ||
          a.subCategory.toLowerCase().includes(qLower) ||
          a.location.toLowerCase().includes(qLower)
      );
    }

    if (selectedCity && selectedCity !== "All Cities") {
      list = list.filter((a) => matchesArtistCity(a.rawItem || a, selectedCity));
    }

    // Advanced Drawer Filter Logic
    if (filterVerifiedOnly) {
      list = list.filter((a) => a.isVerified);
    }
    if (filterMinRating > 0) {
      list = list.filter((a) => a.rating >= filterMinRating);
    }
    if (filterMinExp > 0) {
      list = list.filter((a) => {
        const expNum = parseInt(a.experience.replace(/\D/g, ""), 10) || 0;
        return expNum >= filterMinExp;
      });
    }

    // Price Filter
    if (selectedPrice === "Under20k") {
      list = list.filter((a) => parseInt(a.startingPrice.replace(/\D/g, ""), 10) < 20000);
    } else if (selectedPrice === "20kTo30k") {
      list = list.filter((a) => {
        const price = parseInt(a.startingPrice.replace(/\D/g, ""), 10);
        return price >= 20000 && price <= 30000;
      });
    } else if (selectedPrice === "Above30k") {
      list = list.filter((a) => parseInt(a.startingPrice.replace(/\D/g, ""), 10) > 30000);
    }

    // Sorting Logic
    if (selectedSort === "Rating") {
      list.sort((a, b) => b.rating - a.rating);
    } else if (selectedSort === "PriceLow") {
      list.sort((a, b) => parseInt(a.startingPrice.replace(/\D/g, ""), 10) - parseInt(b.startingPrice.replace(/\D/g, ""), 10));
    } else if (selectedSort === "PriceHigh") {
      list.sort((a, b) => parseInt(b.startingPrice.replace(/\D/g, ""), 10) - parseInt(a.startingPrice.replace(/\D/g, ""), 10));
    }

    return list;
  }, [realArtists, decodedSubcategory, decodedCategory, selectedCity, queryParam, filterVerifiedOnly, filterMinRating, filterMinExp, selectedPrice, selectedSort]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const resetAllFilters = () => {
    setFilterVerifiedOnly(false);
    setFilterMinRating(0);
    setFilterMinExp(0);
    setSelectedPrice("All");
    setSelectedSort("Recommended");
  };

  return (
    <div className="min-h-screen bg-stone-50/50 flex flex-col font-sans antialiased pt-20">
      <Navbar />

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 md:px-6 py-4 md:py-6">
        {/* ─── Mobile-Optimized Single-Line Horizontal Scrollable Breadcrumb Header ─── */}
        <div className="flex items-center justify-between py-2 border-b border-stone-200/60 mb-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 overflow-x-auto whitespace-nowrap no-scrollbar pr-2">
            <Link to="/" className="hover:text-stone-900 transition-colors shrink-0">
              {t("nav.home") || "Home"}
            </Link>
            {decodedEvent && (
              <>
                <span className="shrink-0">&gt;</span>
                <Link to={`/events/${encodeURIComponent(decodedEvent)}`} className="hover:text-stone-900 transition-colors shrink-0">
                  {decodedEvent}
                </Link>
              </>
            )}
            {decodedCategory && (
              <>
                <span className="shrink-0">&gt;</span>
                <Link to={`/events/${encodeURIComponent(decodedEvent || "Wedding")}/${encodeURIComponent(decodedCategory)}`} className="hover:text-stone-900 transition-colors shrink-0">
                  {decodedCategory}
                </Link>
              </>
            )}
            {decodedSubcategory ? (
              <>
                <span className="shrink-0">&gt;</span>
                <span className="text-stone-900 font-bold shrink-0">{decodedSubcategory}</span>
              </>
            ) : !decodedEvent && !decodedCategory ? (
              <>
                <span className="shrink-0">&gt;</span>
                <span className="text-stone-900 font-bold shrink-0">{t("common.viewAllArtists") || "All Artists"}</span>
              </>
            ) : null}
          </div>
          <button
            onClick={() => navigate("/search")}
            className="p-1.5 rounded-full hover:bg-stone-200/60 text-stone-500 transition shrink-0 ml-2"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        {/* ─── Filter Pills Bar ─── */}
        <div className="flex flex-wrap items-center gap-2.5 mb-6">
          {/* Location Pill */}
          <SearchableCityDropdown
            selectedCity={selectedCity}
            onSelectCity={setSelectedCity}
            availableArtists={realArtists.map((a) => a.rawItem || a)}
          />

          {/* Filters Pill Button (Triggers Slide-out Drawer) */}
          <button
            onClick={() => setIsFilterDrawerOpen(true)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition shadow-2xs ${
              filterVerifiedOnly || filterMinRating > 0 || filterMinExp > 0
                ? "bg-orange-50 border-orange-500 text-orange-700"
                : "bg-white border-stone-200 text-stone-700 hover:border-stone-400"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-stone-500" />
            <span>{t("filters.title") || "Filters"}</span>
            {(filterVerifiedOnly || filterMinRating > 0 || filterMinExp > 0) && (
              <span className="h-2 w-2 rounded-full bg-orange-600" />
            )}
            <ChevronDown className="h-3 w-3 text-stone-400" />
          </button>

          {/* Sort By Pill */}
          <div className="relative inline-flex items-center rounded-full bg-white border border-stone-200 px-3.5 py-1.5 text-xs font-bold text-stone-700 shadow-2xs hover:border-stone-400 cursor-pointer">
            <span className="text-stone-400 font-normal mr-1">Sort By:</span>
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="bg-transparent border-none outline-none cursor-pointer pr-3 font-bold text-stone-800"
            >
              <option value="Recommended">{t("sort.relevant") || "Recommended"}</option>
              <option value="Rating">Rating: High to Low</option>
              <option value="PriceLow">Price: Low to High</option>
              <option value="PriceHigh">Price: High to Low</option>
            </select>
          </div>

          {/* Price Pill */}
          <div className="relative inline-flex items-center rounded-full bg-white border border-stone-200 px-3.5 py-1.5 text-xs font-bold text-stone-700 shadow-2xs hover:border-stone-400 cursor-pointer">
            <span className="text-stone-400 font-normal mr-1">{t("filters.budget") || "Price:"}</span>
            <select
              value={selectedPrice}
              onChange={(e) => setSelectedPrice(e.target.value)}
              className="bg-transparent border-none outline-none cursor-pointer pr-3 font-bold text-stone-800"
            >
              <option value="All">All Prices</option>
              <option value="Under20k">Under ₹20,000</option>
              <option value="20kTo30k">₹20,000 - ₹30,000</option>
              <option value="Above30k">Above ₹30,000</option>
            </select>
          </div>
        </div>

        {/* ─── Count Subheading ─── */}
        <h2 className="text-base sm:text-lg font-extrabold text-stone-900 mb-5 tracking-tight">
          {displayArtists.length > 0 ? `${displayArtists.length} ${t("category.verified") || "Verified"}` : t("common.all")} {displayTitle} {selectedCity && selectedCity !== "All Cities" ? `${t("common.in") || "in"} ${selectedCity}` : ""}
        </h2>

        {/* ─── Empty State if No Database Artists ─── */}
        {displayArtists.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-3xl border border-stone-200 p-8 sm:p-12 my-6 shadow-xs">
            <div className="h-16 w-16 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 mb-4">
              <MapPin className="h-8 w-8 stroke-[1.75]" />
            </div>
            <h3 className="text-xl font-extrabold text-stone-900 mb-2">
              {selectedCity && selectedCity !== "All Cities"
                ? t("category.noArtistsInCity", { city: selectedCity })
                : t("category.noArtistsAvailable", { name: displayTitle })}
            </h3>
            <p className="text-sm font-medium text-stone-500 max-w-md mb-6 leading-relaxed">
              {selectedCity && selectedCity !== "All Cities"
                ? t("empty.tryAnotherCity") || "Try another city or select All Cities to browse available artists."
                : t("empty.noArtistsInSubcategory", { name: displayTitle }) || `There are currently no active artists registered under ${displayTitle}.`}
            </p>
            {selectedCity && selectedCity !== "All Cities" ? (
              <button
                type="button"
                onClick={() => setSelectedCity("All Cities")}
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                {t("search.allCities") || "Show All Cities"}
              </button>
            ) : (
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                {t("cta.artist.button") || "Be the first artist to register"}
              </Link>
            )}
          </div>
        )}

        {/* ─── Artist Result Cards (Compact Responsive Grid: 2 cols mobile, 3-5 cols desktop) ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 mb-10">
          {displayArtists.map((artist) => {
            const isFav = favorites.has(artist.id);
            return (
              <div
                key={artist.id}
                onClick={() => navigate(`/artist/${artist.id}`)}
                className="group relative flex flex-col justify-between p-3 rounded-2xl bg-white border border-stone-200/80 shadow-xs hover:border-orange-500 hover:shadow-md transition-all duration-300 cursor-pointer select-none"
              >
                {/* Top Image & Favorite Heart */}
                <div className="relative h-32 sm:h-36 w-full overflow-hidden rounded-xl bg-stone-100 mb-2.5 shrink-0">
                  <img
                    src={artist.image}
                    alt={artist.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      const fallback = imageRegistry.getUniqueImage({
                        category: artist.subCategory || "Performers",
                        type: "artist",
                        key: artist.id,
                      });
                      if (target.src !== fallback) {
                        target.src = fallback;
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(artist.id);
                    }}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition cursor-pointer"
                  >
                    <Heart
                      className={`h-3.5 w-3.5 ${
                        isFav ? "fill-rose-500 text-rose-500" : ""
                      }`}
                    />
                  </button>
                </div>

                {/* Content Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h3 className="text-xs sm:text-sm font-extrabold text-stone-900 group-hover:text-orange-600 transition-colors truncate">
                        {artist.name}
                      </h3>
                      <VerificationBadge artist={artist.rawItem || artist} size="compact" />
                    </div>

                    {/* Service Badges */}
                    <div className="flex flex-wrap gap-1 mb-1.5 min-h-[22px]">
                      {(artist.servicesList && artist.servicesList.length > 0 ? artist.servicesList : [artist.subCategory]).slice(0, 2).map((srv) => (
                        <span key={srv} className="inline-block rounded-md bg-orange-50 text-orange-700 border border-orange-100/60 px-1.5 py-0.5 text-[9px] font-extrabold truncate max-w-[110px]">
                          {getArtLabel(t, srv)}
                        </span>
                      ))}
                      {(artist.servicesList?.length || 1) > 2 && (
                        <span className="inline-block rounded-md bg-stone-100 text-stone-600 px-1.5 py-0.5 text-[9px] font-extrabold">
                          +{(artist.servicesList?.length || 1) - 2} more
                        </span>
                      )}
                    </div>

                    {/* Rating & Location */}
                    <div className="flex items-center justify-between text-[11px] font-semibold text-stone-600 pt-1.5 border-t border-stone-100">
                      <div className="flex items-center gap-0.5 text-amber-500">
                        <Star className="h-3 w-3 fill-current" />
                        <span className="font-extrabold text-stone-900">{artist.rating}</span>
                      </div>
                      <div className="flex items-center gap-0.5 text-stone-500 truncate max-w-[90px]">
                        <MapPin className="h-3 w-3 text-stone-400 shrink-0" />
                        <span className="truncate">{artist.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Price & View Action */}
                  <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-stone-400 block font-medium leading-none">{t("category.startingFrom") || "Starts from"}</span>
                      <span className="font-extrabold text-stone-900 text-xs mt-0.5 block">
                        ₹{artist.startingPrice}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-extrabold text-orange-600 group-hover:translate-x-0.5 transition-transform">
                      {t("category.viewProfile") || "Profile"} <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── Pagination Bar ─── */}
        <div className="flex items-center justify-center gap-1.5 mt-8 mb-6">
          <button
            onClick={() => setCurrentPage(1)}
            className={`h-9 w-9 rounded-lg font-extrabold text-xs transition ${
              currentPage === 1
                ? "bg-orange-600 text-white shadow-sm"
                : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
            }`}
          >
            1
          </button>
          <button
            onClick={() => setCurrentPage(2)}
            className={`h-9 w-9 rounded-lg font-extrabold text-xs transition ${
              currentPage === 2
                ? "bg-orange-600 text-white shadow-sm"
                : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
            }`}
          >
            2
          </button>
          <button
            onClick={() => setCurrentPage(3)}
            className={`h-9 w-9 rounded-lg font-extrabold text-xs transition ${
              currentPage === 3
                ? "bg-orange-600 text-white shadow-sm"
                : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
            }`}
          >
            3
          </button>
          <button
            onClick={() => setCurrentPage(4)}
            className={`h-9 w-9 rounded-lg font-extrabold text-xs transition ${
              currentPage === 4
                ? "bg-orange-600 text-white shadow-sm"
                : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
            }`}
          >
            4
          </button>
          <span className="px-1 text-stone-400 font-bold text-xs">...</span>
          <button
            onClick={() => setCurrentPage(20)}
            className={`h-9 w-9 rounded-lg font-extrabold text-xs transition ${
              currentPage === 20
                ? "bg-orange-600 text-white shadow-sm"
                : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
            }`}
          >
            20
          </button>
        </div>

        {/* ─── Zomato-style Slide-out Filter Drawer Modal ─── */}
        <Dialog open={isFilterDrawerOpen} onOpenChange={setIsFilterDrawerOpen}>
          <DialogContent className="sm:max-w-md bg-white border-stone-200 p-5 rounded-3xl shadow-2xl">
            <DialogHeader className="border-b border-stone-100 pb-3">
              <DialogTitle className="text-lg font-black text-stone-900 flex items-center justify-between">
                <span>{t("search.filterArtists") || "Filter Artists"}</span>
                <button
                  onClick={resetAllFilters}
                  className="text-xs font-bold text-orange-600 hover:underline"
                >
                  {t("search.clearFilters") || "Reset All"}
                </button>
              </DialogTitle>
              <DialogDescription className="text-xs font-medium text-stone-500">
                {t("search.refineSearch") || "Refine your search with specific artist criteria"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-3">
              {/* Verified Artists Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-200/80">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-blue-500 fill-blue-500/10" />
                  <span className="text-xs font-extrabold text-stone-800">
                    {t("search.verifiedOnly") || "Verified Artists Only"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFilterVerifiedOnly((prev) => !prev)}
                  className={`h-6 w-11 rounded-full p-1 transition-colors ${
                    filterVerifiedOnly ? "bg-orange-600" : "bg-stone-300"
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded-full bg-white transition-transform ${
                      filterVerifiedOnly ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="text-xs font-extrabold text-stone-800 block mb-2">
                  {t("filter.rating") || "Minimum Rating"}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[4.8, 4.5, 4.0].map((ratingVal) => (
                    <button
                      key={ratingVal}
                      onClick={() =>
                        setFilterMinRating((prev) =>
                          prev === ratingVal ? 0 : ratingVal
                        )
                      }
                      className={`h-9 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition ${
                        filterMinRating === ratingVal
                          ? "border-orange-600 bg-orange-50 text-orange-700"
                          : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                      }`}
                    >
                      <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
                      <span>{ratingVal}+</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience Filter */}
              <div>
                <label className="text-xs font-extrabold text-stone-800 block mb-2">
                  {t("filter.experience") || "Experience"}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 8, 10].map((expVal) => (
                    <button
                      key={expVal}
                      onClick={() =>
                        setFilterMinExp((prev) => (prev === expVal ? 0 : expVal))
                      }
                      className={`h-9 rounded-xl border text-xs font-bold transition ${
                        filterMinExp === expVal
                          ? "border-orange-600 bg-orange-50 text-orange-700"
                          : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                      }`}
                    >
                      {expVal}+ {t("common.years") || "Years"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100">
              <button
                onClick={() => setIsFilterDrawerOpen(false)}
                className="w-full h-11 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-extrabold text-xs shadow-md transition"
              >
                {t("filter.apply") || "Apply Filters"} ({displayArtists.length})
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </main>

      <Footer />
    </div>
  );
}
