import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  ChevronRight,
  BadgeCheck,
  Star,
  Heart,
  Clock,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NewRequirementModal from "@/components/NewRequirementModal";
import {
  getSubcategoriesForCategory,
  getCategoriesForEvent,
  CATEGORY_GROUP_OPTIONS,
  extractArtistServices,
  matchesArtistCity,
} from "@/constants/artistSystem";
import { SearchableCityDropdown } from "@/components/search/SearchableCityDropdown";
import { getActiveArtistsPage, clearDataCache } from "@/services/dataService";
import { resolveArtistProfilePhoto } from "@/services/dataNormalizer";
import { imageRegistry } from "@/services/ImageRegistryService";
import { useI18n } from "@/i18n/I18nProvider";
import { getArtLabel } from "@/lib/artLabels";

const isServiceCategory = (cat: string) =>
  /services|venues|decoration|catering|hospitality|transportation|setup|sound|mandap|stage|photo/i.test(cat || "");
const isOrganizationCategory = (cat: string) =>
  /organization|sanstha|troupe|academy/i.test(cat || "");

const getSectionHeading = (categoryName: string, subName: string) => {
  if (isServiceCategory(categoryName) || isServiceCategory(subName)) {
    return subName === "All" ? `Available ${categoryName}` : `${subName} Services`;
  }
  if (isOrganizationCategory(categoryName) || isOrganizationCategory(subName)) {
    return subName === "All" ? `Organizations in ${categoryName}` : `${subName} Organizations`;
  }
  return `Artists in ${subName === "All" ? categoryName : subName}`;
};

const getHeroSubtitle = (categoryName: string) => {
  if (isServiceCategory(categoryName)) {
    return "Find and book verified event service providers and vendors for your event.";
  }
  if (isOrganizationCategory(categoryName)) {
    return "Discover registered organizations, troupes, and groups for your event.";
  }
  return "Find and book verified professional artists for your event.";
};

const getEmptyTitle = (categoryName: string, subName: string, selectedCity?: string) => {
  if (selectedCity && selectedCity !== "All Cities") {
    return isServiceCategory(categoryName)
      ? `No services available in ${selectedCity}`
      : `No artists available in ${selectedCity}`;
  }
  if (subName && subName !== "All") {
    return isServiceCategory(categoryName) || isServiceCategory(subName)
      ? `No ${subName} services available right now`
      : `No ${subName} artists available right now`;
  }
  return isServiceCategory(categoryName)
    ? "Currently no services available"
    : "Currently no artists available";
};

const getExploreButtonText = (categoryName: string) => {
  if (isServiceCategory(categoryName)) {
    return `View All ${categoryName.replace(/\s*services?$/i, "").trim()} Services`;
  }
  if (isOrganizationCategory(categoryName)) {
    return `View All ${categoryName.replace(/\s*organizations?$/i, "").trim()} Organizations`;
  }
  return `View All ${categoryName.replace(/\s*artists?$/i, "").trim()} Artists`;
};

interface ArtistCardData {
  id: string;
  name: string;
  isVerified: boolean;
  rating: number;
  reviewsCount: number;
  location: string;
  experience: string;
  startingPrice: string;
  image: string;
  subCategory: string;
  categoryGroup?: string;
  servicesList?: string[];
}

export default function CategoryLevel2Page() {
  const { eventName, categoryName } = useParams<{ eventName: string; categoryName: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useI18n();

  const decodedEvent = eventName ? decodeURIComponent(eventName) : "Wedding";
  const decodedCategory = categoryName ? decodeURIComponent(categoryName) : "Photography";

  // URL state synchronization
  const initialSubcategory = searchParams.get("subcategory") || searchParams.get("subCategory") || "All";
  const initialCity = searchParams.get("location") || searchParams.get("city") || "All Cities";

  const [activeSubcategory, setActiveSubcategory] = useState<string>(initialSubcategory);
  const [selectedCity, setSelectedCity] = useState<string>(initialCity);
  const [selectedSort, setSelectedSort] = useState("Recommended");
  const [selectedPrice, setSelectedPrice] = useState("All");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [briefModalOpen, setBriefModalOpen] = useState(false);

  useEffect(() => {
    const locParam = searchParams.get("location") || searchParams.get("city");
    if (locParam) {
      setSelectedCity(locParam);
    } else {
      setSelectedCity("All Cities");
    }
  }, [searchParams]);

  const [realArtists, setRealArtists] = useState<ArtistCardData[]>([]);
  const [loading, setLoading] = useState(true);

  // Dynamic subcategories from database / master system
  const masterSubcategories = useMemo(() => {
    return getSubcategoriesForCategory(decodedEvent, decodedCategory);
  }, [decodedEvent, decodedCategory]);

  // Sibling categories within the current event for navigation
  const siblingCategories = useMemo(() => {
    const categories = getCategoriesForEvent(decodedEvent);
    if (categories && categories.length > 0) return categories;
    return CATEGORY_GROUP_OPTIONS.map((c: any) => ({
      id: c.id,
      name: c.name,
      icon: c.icon || "✨",
      eventType: decodedEvent,
      subcategories: c.subcategories,
    }));
  }, [decodedEvent]);

  // Fetch real artists from database
  useEffect(() => {
    let isMounted = true;
    clearDataCache();
    getActiveArtistsPage(50)
      .then((res) => {
        if (!isMounted) return;
        if (res.items && res.items.length > 0) {
          const mapped: ArtistCardData[] = res.items.map((item: any) => {
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
              reviewsCount: item.reviewsCount ? Number(item.reviewsCount) : 24,
              location: item.city || item.location || "Pune, Maharashtra",
              experience: item.experience ? `${item.experience} Yrs Exp` : "5+ Yrs Exp",
              startingPrice: item.startingPrice
                ? String(item.startingPrice)
                : item.minPrice
                ? String(item.minPrice)
                : "15,000",
              image: uploadedImage || fallbackImage,
              subCategory: subCat,
              categoryGroup: item.categoryGroup || item.category || item.group || "",
              servicesList: servicesList.length ? servicesList : [subCat],
            };
          });
          setRealArtists(mapped);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Failed to fetch active artists:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync state when URL search params change
  useEffect(() => {
    const subParam = searchParams.get("subcategory") || searchParams.get("subCategory");
    if (subParam) {
      setActiveSubcategory(subParam);
    }
    const locParam = searchParams.get("location") || searchParams.get("city");
    if (locParam) {
      setSelectedCity(locParam);
    }
  }, [searchParams]);

  // Subcategory Chip Click Handler (Updates state + URL parameter without page navigation)
  const handleSubcategorySelect = (subName: string) => {
    setActiveSubcategory(subName);
    const newParams = new URLSearchParams(searchParams);
    if (subName === "All") {
      newParams.delete("subcategory");
      newParams.delete("subCategory");
    } else {
      newParams.set("subcategory", subName);
    }
    setSearchParams(newParams, { replace: true });
  };

  // Filtered artists calculation
  const displayedArtists = useMemo(() => {
    let list = [...realArtists];

    // Filter by Subcategory tab
    if (activeSubcategory && activeSubcategory !== "All") {
      const subLower = activeSubcategory.toLowerCase();
      list = list.filter((a) => {
        const subs = a.servicesList && a.servicesList.length ? a.servicesList : [a.subCategory];
        return subs.some((s) => s.toLowerCase().includes(subLower));
      });
    } else {
      // If "All", include artists matching any subcategory in this category group
      const masterSet = new Set(masterSubcategories.map((s) => s.toLowerCase()));
      const catLower = decodedCategory.toLowerCase();
      list = list.filter((a) => {
        const subs = a.servicesList && a.servicesList.length ? a.servicesList : [a.subCategory];
        const artistGroup = (a.categoryGroup || "").toLowerCase();
        return subs.some((s) => masterSet.has(s.toLowerCase()) || s.toLowerCase().includes(catLower)) || artistGroup.includes(catLower);
      });
    }

    // Filter by City/Location
    if (selectedCity && selectedCity !== "All Cities") {
      list = list.filter((a) => matchesArtistCity(a, selectedCity));
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

    // Sort Order
    if (selectedSort === "Rating") {
      list.sort((a, b) => b.rating - a.rating);
    } else if (selectedSort === "PriceLow") {
      list.sort((a, b) => parseInt(a.startingPrice.replace(/\D/g, ""), 10) - parseInt(b.startingPrice.replace(/\D/g, ""), 10));
    } else if (selectedSort === "PriceHigh") {
      list.sort((a, b) => parseInt(b.startingPrice.replace(/\D/g, ""), 10) - parseInt(a.startingPrice.replace(/\D/g, ""), 10));
    }

    return list;
  }, [
    realArtists,
    activeSubcategory,
    masterSubcategories,
    decodedCategory,
    selectedCity,
    selectedPrice,
    selectedSort,
  ]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-stone-50/50 flex flex-col font-sans antialiased pt-20">
      <Navbar />

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 md:px-6 py-4 md:py-6">
        {/* ─── 1. Single-Line Breadcrumb ─── */}
        <div className="flex items-center justify-between py-2 border-b border-stone-200/60 mb-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 overflow-x-auto whitespace-nowrap scrollbar-none pr-2">
            <Link to="/" className="hover:text-stone-900 transition-colors shrink-0">
              {t("nav.home") || "Home"}
            </Link>
            <span className="shrink-0">&gt;</span>
            <Link to={`/events/${encodeURIComponent(decodedEvent)}`} className="hover:text-stone-900 transition-colors shrink-0">
              {decodedEvent}
            </Link>
            <span className="shrink-0">&gt;</span>
            <span className="text-stone-900 font-bold shrink-0">{decodedCategory}</span>
          </div>
          <button
            onClick={() => navigate("/search")}
            className="p-1.5 rounded-full hover:bg-stone-200/60 text-stone-500 transition shrink-0 ml-2"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        {/* ─── 2. Category Hero / Header ─── */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-stone-950 via-stone-900 to-stone-800 text-white p-6 sm:p-8 mb-6 min-h-[160px] sm:min-h-[180px] flex items-center shadow-lg">
          <div className="relative z-10 max-w-xl">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
              {decodedCategory}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-stone-300 font-medium leading-relaxed">
              {getHeroSubtitle(decodedCategory)}
            </p>
          </div>

          <div className="absolute right-0 top-0 bottom-0 w-1/2 md:w-5/12 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/60 to-transparent z-10" />
            <img
              src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=1200&auto=format&fit=crop"
              alt={decodedCategory}
              className="h-full w-full object-cover object-center"
            />
          </div>
        </div>

        {/* ─── 3. SUBCATEGORY FILTERS (Horizontal Scrollable Chips/Tabs) ─── */}
        <div className="mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            {/* "All" Filter Chip */}
            <button
              type="button"
              onClick={() => handleSubcategorySelect("All")}
              className={`h-9 px-4 rounded-full text-xs font-extrabold transition-all duration-200 shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeSubcategory === "All"
                  ? "bg-orange-600 text-white shadow-md shadow-orange-600/20 scale-[1.02]"
                  : "bg-white border border-stone-200/90 text-stone-700 hover:bg-stone-100 hover:border-stone-300"
              }`}
            >
              <span>{t("common.all") || "All"}</span>
            </button>

            {/* Dynamic Subcategory Chips from Database / Master System */}
            {masterSubcategories.map((subName) => {
              const isSelected = activeSubcategory.toLowerCase() === subName.toLowerCase();
              return (
                <button
                  key={subName}
                  type="button"
                  onClick={() => handleSubcategorySelect(subName)}
                  className={`h-9 px-4 rounded-full text-xs font-extrabold transition-all duration-200 shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-orange-600 text-white shadow-md shadow-orange-600/20 scale-[1.02]"
                      : "bg-white border border-stone-200/90 text-stone-700 hover:bg-stone-100 hover:border-stone-300"
                  }`}
                >
                  <span>{getArtLabel(t, subName)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Main Content Section ─── */}
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 md:gap-8 mb-8">
          {/* Left Column: Event Categories Sidebar (Desktop Only) */}
          <div className="hidden md:block bg-white rounded-2xl border border-stone-200/80 p-4 shadow-xs h-fit">
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-stone-100">
              <h2 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider">
                {decodedEvent} {t("nav.categories") || "Categories"}
              </h2>
            </div>

            <ul className="space-y-1">
              {siblingCategories.map((cat: any) => {
                const catName = typeof cat === "string" ? cat : cat.name;
                const catIcon = cat.icon || "✨";
                const isActive = catName.toLowerCase() === decodedCategory.toLowerCase();

                return (
                  <li key={catName}>
                    <button
                      onClick={() =>
                        navigate(
                          `/events/${encodeURIComponent(decodedEvent)}/${encodeURIComponent(catName)}`
                        )
                      }
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all duration-200 flex items-center justify-between group cursor-pointer ${
                        isActive
                          ? "bg-orange-50 text-orange-600 font-extrabold border-l-3 border-orange-500 shadow-2xs"
                          : "text-stone-700 hover:text-orange-600 hover:bg-stone-50 font-semibold"
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span className="text-sm shrink-0">{catIcon}</span>
                        <span className="truncate">{catName}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Right Column: Artist Results Grid on the SAME Page */}
          <div>
            {/* Filter Controls Row (Location, Price, Sort) */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {/* Location Selector */}
              <SearchableCityDropdown
                selectedCity={selectedCity}
                onSelectCity={setSelectedCity}
                availableArtists={realArtists}
              />

              {/* Sort Selector */}
              <div className="relative inline-flex items-center rounded-full bg-white border border-stone-200 px-3 py-1.5 text-xs font-bold text-stone-700 shadow-2xs">
                <span className="text-stone-400 font-normal mr-1">Sort:</span>
                <select
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value)}
                  className="bg-transparent border-none outline-none cursor-pointer pr-2 font-bold text-stone-800"
                >
                  <option value="Recommended">Recommended</option>
                  <option value="Rating">Rating: High to Low</option>
                  <option value="PriceLow">Price: Low to High</option>
                  <option value="PriceHigh">Price: High to Low</option>
                </select>
              </div>

              {/* Price Selector */}
              <div className="relative inline-flex items-center rounded-full bg-white border border-stone-200 px-3 py-1.5 text-xs font-bold text-stone-700 shadow-2xs">
                <span className="text-stone-400 font-normal mr-1">Budget:</span>
                <select
                  value={selectedPrice}
                  onChange={(e) => setSelectedPrice(e.target.value)}
                  className="bg-transparent border-none outline-none cursor-pointer pr-2 font-bold text-stone-800"
                >
                  <option value="All">All Prices</option>
                  <option value="Under20k">Under ₹20,000</option>
                  <option value="20kTo30k">₹20,000 - ₹30,000</option>
                  <option value="Above30k">Above ₹30,000</option>
                </select>
              </div>
            </div>

            {/* Subheading Count */}
            <h2 className="text-sm sm:text-base font-extrabold text-stone-900 mb-4 tracking-tight">
              {getSectionHeading(decodedCategory, activeSubcategory)}
              <span className="text-stone-400 font-semibold ml-2">({displayedArtists.length})</span>
            </h2>

            {/* Empty State */}
            {displayedArtists.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-3xl border border-stone-200 p-6 shadow-xs my-4">
                <div className="h-14 w-14 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 mb-3">
                  <MapPin className="h-6 w-6 stroke-[1.75]" />
                </div>
                <h3 className="text-base font-extrabold text-stone-900 mb-1">
                  {getEmptyTitle(decodedCategory, activeSubcategory, selectedCity)}
                </h3>
                <p className="text-xs font-medium text-stone-500 max-w-sm mb-4">
                  {selectedCity && selectedCity !== "All Cities"
                    ? "Try another city or select All Cities to browse available options."
                    : activeSubcategory && activeSubcategory !== "All"
                    ? `Try exploring other styles or ${getExploreButtonText(decodedCategory).toLowerCase()}.`
                    : "We're continuously onboarding new talent. Please check back soon or explore other categories."}
                </p>
                {selectedCity && selectedCity !== "All Cities" ? (
                  <button
                    type="button"
                    onClick={() => setSelectedCity("All Cities")}
                    className="px-4 py-2 rounded-full bg-orange-600 text-white font-extrabold text-xs shadow-xs hover:bg-orange-700 transition"
                  >
                    Show All Cities
                  </button>
                ) : activeSubcategory && activeSubcategory !== "All" ? (
                  <button
                    type="button"
                    onClick={() => handleSubcategorySelect("All")}
                    className="px-4 py-2 rounded-full bg-stone-900 text-white font-extrabold text-xs shadow-xs hover:bg-orange-600 transition"
                  >
                    {getExploreButtonText(decodedCategory)}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate("/categories")}
                    className="px-4 py-2 rounded-full bg-stone-900 text-white font-extrabold text-xs shadow-xs hover:bg-orange-600 transition"
                  >
                    Explore Other Categories
                  </button>
                )}
              </div>
            )}

            {/* Artists Responsive Grid (Compact Responsive Grid) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {displayedArtists.map((artist) => {
                const isFav = favorites.has(artist.id);

                return (
                  <div
                    key={artist.id}
                    onClick={() => navigate(`/artist/${artist.id}`)}
                    className="group relative flex flex-col justify-between p-3 rounded-2xl bg-white border border-stone-200/80 shadow-xs hover:border-orange-500 hover:shadow-md transition-all duration-300 cursor-pointer"
                  >
                    {/* Top Image & Favorite */}
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
                          {artist.isVerified && (
                            <BadgeCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                          )}
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
                          <span className="text-[9px] text-stone-400 block font-medium leading-none">Starts from</span>
                          <span className="font-extrabold text-stone-900 text-xs mt-0.5 block">
                            ₹{artist.startingPrice}
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-extrabold text-orange-600 group-hover:translate-x-0.5 transition-transform">
                          Profile <ChevronRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── Bottom Callout Banner ─── */}
        <div className="rounded-2xl bg-gradient-to-r from-orange-50/90 via-amber-50/80 to-orange-50/90 border border-orange-200/70 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 shadow-2xs">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-stone-900 leading-tight">
                {t("home.cantFindService") || "Can't find what you're looking for?"}
              </h4>
              <p className="text-xs font-semibold text-stone-600 mt-0.5">
                {t("home.tellUsNeed") || "Tell us what you need."}
              </p>
            </div>
          </div>

          <button
            onClick={() => setBriefModalOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-white border border-stone-200 text-xs font-extrabold text-stone-800 shadow-2xs hover:bg-stone-950 hover:text-white hover:border-stone-950 transition-all duration-300 cursor-pointer"
          >
            {t("home.requestService") || "Request Service"}
          </button>
        </div>
      </main>

      <Footer />

      <NewRequirementModal
        open={briefModalOpen}
        onClose={() => setBriefModalOpen(false)}
      />
    </div>
  );
}
