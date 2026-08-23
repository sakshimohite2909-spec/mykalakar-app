import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import {
  Camera,
  Sparkles,
  Flower2,
  Building2,
  Utensils,
  Paintbrush,
  Car,
  Mail,
  Gift,
  ShoppingBag,
  Search,
  ShieldCheck,
  UserCheck,
  Briefcase,
  Headphones,
  PlusCircle,
  Clock,
  Music2,
  ChevronRight,
  Mic,
  Radio,
  BookOpen,
  Tv,
  MapPin,
  BadgeCheck,
  Star,
  Heart,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NewRequirementModal from "@/components/NewRequirementModal";
import { getCategoriesForEvent, MAIN_EVENT_CARDS, matchesArtistCity } from "@/constants/artistSystem";
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

const CATEGORY_ICON_MAP: Record<string, any> = {
  "Spiritual Speakers": Mic,
  "Vocal Artists": Music2,
  "Instrumental Artists": Radio,
  "Organizations": Building2,
  "Event Services": Sparkles,
  "Venues": Building2,
  "Bridal & Groom Services": Paintbrush,
  "Photography & Videography": Camera,
  "Entertainment": Sparkles,
  "Catering": Utensils,
  "Decoration": Flower2,
  "Event Setup": Building2,
  "Transportation": Car,
  "Guest Hospitality": Building2,
  "Invitations": Mail,
  "Wedding Essentials": Gift,
  "Shopping": ShoppingBag,
};

const CATEGORY_BANNER_IMAGES: Record<string, string> = {
  "Spiritual Speakers": "https://images.pexels.com/photos/34193177/pexels-photo-34193177.jpeg?auto=compress&cs=tinysrgb&w=800&fit=crop",
  "Vocal Artists": "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800&auto=format&fit=crop",
  "Instrumental Artists": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop",
  "Organizations": "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=800&auto=format&fit=crop",
  "Event Services": "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=800&auto=format&fit=crop",
  "Venues": "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=800&auto=format&fit=crop",
  "Bridal & Groom Services": "https://images.pexels.com/photos/33986816/pexels-photo-33986816.jpeg?auto=compress&cs=tinysrgb&w=800&fit=crop",
  "Photography & Videography": "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=800&auto=format&fit=crop",
  "Entertainment": "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800&auto=format&fit=crop",
  "Catering": "https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=800&auto=format&fit=crop",
  "Decoration": "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop",
  "Event Setup": "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=800&auto=format&fit=crop",
  "Transportation": "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=800&auto=format&fit=crop",
  "Guest Hospitality": "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop",
  "Invitations": "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=800&auto=format&fit=crop",
  "Wedding Essentials": "https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=800&auto=format&fit=crop",
  "Shopping": "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop",
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
  rawItem?: any;
}

export default function EventLevel1Page() {
  const { eventName } = useParams<{ eventName: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showRequirementModal, setShowRequirementModal] = useState(false);
  const { t } = useI18n();

  const decodedName = eventName ? decodeURIComponent(eventName) : "Wedding";
  const cardMeta = MAIN_EVENT_CARDS.find((c) => c.name.toLowerCase() === decodedName.toLowerCase());
  const eventMeta = {
    title: decodedName,
    subtitle: cardMeta?.description || `Explore top artists and vendors for ${decodedName}.`,
    heroImage: cardMeta?.image || "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=1200&auto=format&fit=crop",
  };

  const dynamicCategories = getCategoriesForEvent(decodedName);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>(
    dynamicCategories[0]?.name || "Spiritual Speakers"
  );
  const [activeSubcategory, setActiveSubcategory] = useState<string>("All");

  const [selectedCity, setSelectedCity] = useState<string>("All Cities");
  const [selectedSort, setSelectedSort] = useState<string>("Recommended");
  const [selectedPrice, setSelectedPrice] = useState<string>("All");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const [realArtists, setRealArtists] = useState<ArtistCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const locParam = searchParams.get("location") || searchParams.get("city");
    if (locParam) {
      setSelectedCity(locParam);
    } else {
      setSelectedCity("All Cities");
    }
  }, [searchParams]);

  useEffect(() => {
    if (dynamicCategories.length > 0 && !dynamicCategories.some((c) => c.name === selectedCategoryName)) {
      setSelectedCategoryName(dynamicCategories[0].name);
      setActiveSubcategory("All");
    }
  }, [decodedName, dynamicCategories, selectedCategoryName]);

  const activeCategory = dynamicCategories.find((c) => c.name === selectedCategoryName) || dynamicCategories[0];

  // Fetch real artists
  useEffect(() => {
    let isMounted = true;
    clearDataCache();
    getActiveArtistsPage(50)
      .then((res) => {
        if (!isMounted) return;
        if (res.items && res.items.length > 0) {
          const mapped: ArtistCardData[] = res.items.map((item: any) => {
            const subCat = item.subCategory || item.subcategory || item.artForm || item.category || "Artist";
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

  // Filtered Artists calculation
  const displayedArtists = useMemo(() => {
    let list = [...realArtists];

    if (!activeCategory) return list;

    // Filter by active category group subcategories
    const categorySubSet = new Set((activeCategory.subcategories || []).map((s) => s.toLowerCase()));
    const catGroupLower = activeCategory.name.toLowerCase();

    list = list.filter((a) => {
      const subLower = a.subCategory.toLowerCase();
      const groupLower = (a.categoryGroup || "").toLowerCase();
      return categorySubSet.has(subLower) || subLower.includes(catGroupLower) || groupLower.includes(catGroupLower);
    });

    // Subcategory Filter tab selection
    if (activeSubcategory && activeSubcategory !== "All") {
      const subLower = activeSubcategory.toLowerCase();
      list = list.filter((a) => a.subCategory.toLowerCase().includes(subLower));
    }

    // City Filter
    if (selectedCity && selectedCity !== "All Cities") {
      list = list.filter((a) => matchesArtistCity(a.rawItem || a, selectedCity));
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

    // Sorting Order
    if (selectedSort === "Rating") {
      list.sort((a, b) => b.rating - a.rating);
    } else if (selectedSort === "PriceLow") {
      list.sort((a, b) => parseInt(a.startingPrice.replace(/\D/g, ""), 10) - parseInt(b.startingPrice.replace(/\D/g, ""), 10));
    } else if (selectedSort === "PriceHigh") {
      list.sort((a, b) => parseInt(b.startingPrice.replace(/\D/g, ""), 10) - parseInt(a.startingPrice.replace(/\D/g, ""), 10));
    }

    return list;
  }, [realArtists, activeCategory, activeSubcategory, selectedCity, selectedPrice, selectedSort]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col font-sans antialiased pt-20">
      <Navbar />

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 md:px-6 py-4 md:py-6">
        {/* Single-Line Breadcrumb Header */}
        <div className="flex items-center justify-between py-2 border-b border-stone-200/60 mb-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 overflow-x-auto whitespace-nowrap scrollbar-none pr-2">
            <Link to="/" className="hover:text-stone-900 transition-colors shrink-0">
              {t("nav.home") || "Home"}
            </Link>
            <span className="shrink-0">&gt;</span>
            <span className="text-stone-600 shrink-0">{eventMeta.title}</span>
            {activeCategory && (
              <>
                <span className="shrink-0">&gt;</span>
                <span className="text-stone-900 font-bold shrink-0">{activeCategory.name}</span>
              </>
            )}
          </div>
          <button
            onClick={() => navigate("/search")}
            className="p-1.5 rounded-full hover:bg-stone-200/60 text-stone-500 transition shrink-0 ml-2"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        {/* Mobile Category Navigation Pills */}
        {dynamicCategories.length > 0 && (
          <div className="flex md:hidden items-center gap-2 overflow-x-auto scrollbar-none py-1 mb-4">
            {dynamicCategories.map((cat) => {
              const isSelected = activeCategory?.name === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => {
                    setSelectedCategoryName(cat.name);
                    setActiveSubcategory("All");
                  }}
                  className={`shrink-0 px-4 py-2 rounded-full text-xs font-extrabold transition-all border ${
                    isSelected
                      ? "bg-orange-600 text-white border-orange-600 shadow-2xs"
                      : "bg-white text-stone-700 border-stone-200/80 hover:border-orange-300"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Main 2-Column Grid Layout */}
        {dynamicCategories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-[270px_1fr] gap-6 md:gap-8 mb-10">
            {/* ─── LEFT SIDEBAR (Desktop) ─── */}
            <div className="hidden md:flex flex-col gap-6 shrink-0">
              <div className="bg-white rounded-2xl border border-stone-200/80 p-3 shadow-2xs">
                <h2 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider px-3 py-2">
                  {eventMeta.title} Categories
                </h2>

                <div className="mt-1 space-y-1">
                  {dynamicCategories.map((cat) => {
                    const isSelected = activeCategory?.name === cat.name;
                    const Icon = CATEGORY_ICON_MAP[cat.name] || Sparkles;

                    return (
                      <button
                        key={cat.name}
                        onClick={() => {
                          setSelectedCategoryName(cat.name);
                          setActiveSubcategory("All");
                        }}
                        className={`w-full text-left px-3.5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-between group cursor-pointer border-l-4 ${
                          isSelected
                            ? "bg-orange-50/80 text-orange-600 border-orange-500 font-extrabold shadow-2xs"
                            : "bg-white text-stone-800 border-transparent hover:bg-stone-50 hover:text-orange-600"
                        }`}
                      >
                        <span className="flex items-center gap-3 truncate">
                          <Icon
                            className={`h-4 w-4 shrink-0 stroke-[2] ${
                              isSelected ? "text-orange-600" : "text-stone-500 group-hover:text-orange-600"
                            }`}
                          />
                          <span className="truncate">{cat.name}</span>
                        </span>
                        <ChevronRight
                          className={`h-4 w-4 shrink-0 transition-transform ${
                            isSelected
                              ? "text-orange-600 translate-x-0.5"
                              : "text-stone-400 group-hover:text-orange-600 group-hover:translate-x-0.5"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar Artist Registration CTA Card */}
              <div className="rounded-2xl bg-gradient-to-b from-orange-50/90 to-amber-50/60 border border-orange-200/70 p-5 text-center shadow-2xs flex flex-col items-center">
                <div className="h-12 w-12 rounded-2xl bg-orange-100/80 text-orange-600 flex items-center justify-center mb-3 shadow-2xs">
                  <UserCheck className="h-6 w-6 stroke-[2]" />
                </div>
                <h3 className="text-sm font-extrabold text-stone-900 leading-tight">
                  Are you an Artist?
                </h3>
                <p className="mt-1 text-xs font-medium text-stone-600 leading-relaxed max-w-[200px]">
                  Join MyKalakar and grow your reach.
                </p>
                <button
                  onClick={() => navigate("/register")}
                  className="mt-4 w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95"
                >
                  Join as Artist
                </button>
              </div>
            </div>

            {/* ─── RIGHT CONTENT AREA ─── */}
            <div className="flex flex-col gap-5">
              {activeCategory ? (
                <>
                  {/* Category Hero / Header */}
                  <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-stone-950 via-stone-900 to-stone-800 text-white p-6 sm:p-7 flex items-center shadow-md min-h-[140px]">
                    <div className="relative z-10 max-w-lg">
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                        {activeCategory.name}
                      </h1>
                      <p className="mt-1.5 text-xs sm:text-sm text-stone-300 font-medium leading-relaxed">
                        {getHeroSubtitle(activeCategory.name)}
                      </p>
                    </div>

                    <div className="absolute right-0 top-0 bottom-0 w-1/2 md:w-5/12 overflow-hidden pointer-events-none">
                      <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/60 to-transparent z-10" />
                      <img
                        src={
                          CATEGORY_BANNER_IMAGES[activeCategory.name] ||
                          eventMeta.heroImage
                        }
                        alt={activeCategory.name}
                        className="h-full w-full object-cover object-center"
                      />
                    </div>
                  </div>

                  {/* SUBCATEGORY FILTERS (Horizontal Scrollable Chips/Tabs) */}
                  <div className="my-1">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
                      {/* "All" Filter Chip */}
                      <button
                        type="button"
                        onClick={() => setActiveSubcategory("All")}
                        className={`h-9 px-4 rounded-full text-xs font-extrabold transition-all duration-200 shrink-0 cursor-pointer flex items-center gap-1.5 ${
                          activeSubcategory === "All"
                            ? "bg-orange-600 text-white shadow-md shadow-orange-600/20 scale-[1.02]"
                            : "bg-white border border-stone-200/90 text-stone-700 hover:bg-stone-100 hover:border-stone-300"
                        }`}
                      >
                        <span>{t("common.all") || "All"}</span>
                      </button>

                      {/* Dynamic Subcategory Chips */}
                      {activeCategory.subcategories.map((subName) => {
                        const isSelected = activeSubcategory.toLowerCase() === subName.toLowerCase();

                        return (
                          <button
                            key={subName}
                            type="button"
                            onClick={() => setActiveSubcategory(subName)}
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

                  {/* Filter Controls Row (Location, Price, Sort) */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Location Selector */}
                    <SearchableCityDropdown
                      selectedCity={selectedCity}
                      onSelectCity={setSelectedCity}
                      availableArtists={realArtists.map((a) => a.rawItem || a)}
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
                  <h2 className="text-sm font-extrabold text-stone-900 tracking-tight">
                    {getSectionHeading(activeCategory.name, activeSubcategory)}
                    <span className="text-stone-400 font-semibold ml-2">({displayedArtists.length})</span>
                  </h2>

                  {/* Empty State */}
                  {displayedArtists.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center py-10 text-center bg-white rounded-3xl border border-stone-200 p-6 shadow-xs my-2">
                      <div className="h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 mb-3">
                        <MapPin className="h-6 w-6 stroke-[1.75]" />
                      </div>
                      <h3 className="text-base font-extrabold text-stone-900 mb-1">
                        {getEmptyTitle(activeCategory.name, activeSubcategory, selectedCity)}
                      </h3>
                      <p className="text-xs font-medium text-stone-500 max-w-sm mb-4">
                        {selectedCity && selectedCity !== "All Cities"
                          ? "Try another city or select All Cities to browse available options."
                          : activeSubcategory && activeSubcategory !== "All"
                          ? `Try exploring other styles or ${getExploreButtonText(activeCategory.name).toLowerCase()}.`
                          : "We're continuously onboarding new providers. Please check back soon or explore other categories."}
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
                          onClick={() => setActiveSubcategory("All")}
                          className="px-4 py-2 rounded-full bg-stone-900 text-white font-extrabold text-xs shadow-xs hover:bg-orange-600 transition"
                        >
                          {getExploreButtonText(activeCategory.name)}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => navigate("/events")}
                          className="px-4 py-2 rounded-full bg-stone-900 text-white font-extrabold text-xs shadow-xs hover:bg-orange-600 transition"
                        >
                          Explore Other Events
                        </button>
                      )}
                    </div>
                  )}

                  {/* ARTISTS GRID ON THE SAME PAGE (Compact Grid) */}
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

                              <p className="text-[11px] font-semibold text-stone-500 mb-1.5 truncate">
                                {getArtLabel(t, artist.subCategory)}
                              </p>

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

                  {/* Bottom Requirement CTA Banner */}
                  <div className="rounded-2xl bg-gradient-to-r from-orange-50/90 via-amber-50/80 to-orange-50/90 border border-orange-200/70 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 shadow-2xs">
                        <Clock className="h-5 w-5 stroke-[2]" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-extrabold text-stone-900 leading-tight">
                          Can't find what you're looking for?
                        </h4>
                        <p className="text-xs font-medium text-stone-600 mt-0.5">
                          Post your requirement and we'll help you find the perfect match.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowRequirementModal(true)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white border-2 border-orange-500 text-orange-600 font-extrabold text-xs shadow-2xs hover:bg-orange-600 hover:text-white transition-all duration-300 cursor-pointer active:scale-95 shrink-0"
                    >
                      Post Requirement
                    </button>
                  </div>
                </>
              ) : (
                <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-2xs">
                  <p className="text-sm text-stone-500 font-medium">No categories available for this event.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-2xs my-10">
            <p className="text-sm text-stone-500 font-medium">No details found for this event category.</p>
          </div>
        )}
      </main>

      <Footer />

      <NewRequirementModal
        open={showRequirementModal}
        onClose={() => setShowRequirementModal(false)}
      />
    </div>
  );
}
