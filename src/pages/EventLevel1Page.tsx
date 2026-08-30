import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import {
  Search,
  ChevronRight,
  MapPin,
  Heart,
  CheckCircle2,
  SlidersHorizontal,
  UserPlus,
  Clock,
  Sparkles,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NewRequirementModal from "@/components/NewRequirementModal";
import { getCategoriesForEvent, MAIN_EVENT_CARDS, matchesArtistCity, extractArtistServices } from "@/constants/artistSystem";
import { SearchableCityDropdown } from "@/components/search/SearchableCityDropdown";
import { getActiveArtistsPage, clearDataCache } from "@/services/dataService";
import { resolveArtistProfilePhoto } from "@/services/dataNormalizer";
import { imageRegistry } from "@/services/ImageRegistryService";
import { useI18n } from "@/i18n/I18nProvider";
import { getArtLabel } from "@/lib/artLabels";

import { getCategoryCircleImage } from "@/services/categoryImageService";

const isServiceCategory = (cat: string) => /services|venues|decoration|catering|hospitality|transportation|setup|sound|mandap|stage|photo/i.test(cat || "");
const isOrganizationCategory = (cat: string) => /organization|sanstha|troupe|academy/i.test(cat || "");

const getHeroSubtitle = (categoryName: string, t: (k: string) => string) => {
  if (isServiceCategory(categoryName)) return t("category.heroSubtitleService") || `Find and book verified professional ${categoryName.toLowerCase()} for your events and programs.`;
  if (isOrganizationCategory(categoryName)) return t("category.heroSubtitleOrg") || `Explore verified devotional and cultural organizations for your events.`;
  return `Find and book verified professional ${categoryName.toLowerCase()} for your events and programs.`;
};

interface ArtistCardData {
  id: string;
  name: string;
  isVerified: boolean;
  rating: number;
  reviewsCount: number;
  location: string;
  experience: string;
  languages: string;
  startingPrice: string;
  image: string;
  subCategory: string;
  categoryGroup?: string;
  servicesList?: string[];
  rawItem?: any;
}

export default function EventLevel1Page() {
  const { eventName } = useParams<{ eventName: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useI18n();

  const decodedName = eventName ? decodeURIComponent(eventName) : "Wedding";

  const eventMeta = useMemo(() => {
    const found = MAIN_EVENT_CARDS.find((c) => c.name.toLowerCase() === decodedName.toLowerCase() || c.id.toLowerCase() === decodedName.toLowerCase());
    if (found) return { title: found.name, icon: found.icon, heroImage: found.image, description: found.description };
    return { title: decodedName, icon: "🚩", heroImage: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=1200&auto=format&fit=crop", description: "Find and book verified artists for your event." };
  }, [decodedName]);

  const dynamicCategories = useMemo(() => getCategoriesForEvent(decodedName), [decodedName]);

  const [selectedCategoryName, setSelectedCategoryName] = useState<string>(dynamicCategories[0]?.name || "Venues");
  const [activeSubcategory, setActiveSubcategory] = useState<string>("All");
  const [selectedCity, setSelectedCity] = useState<string>("All Cities");
  const [selectedSort, setSelectedSort] = useState("Recommended");
  const [selectedPrice, setSelectedPrice] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showRequirementModal, setShowRequirementModal] = useState(false);
  const [realArtists, setRealArtists] = useState<ArtistCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (dynamicCategories.length > 0 && !dynamicCategories.some((c) => c.name === selectedCategoryName)) {
      setSelectedCategoryName(dynamicCategories[0].name);
    }
  }, [decodedName, dynamicCategories, selectedCategoryName]);

  const activeCategory = useMemo(() => dynamicCategories.find((c) => c.name.toLowerCase() === selectedCategoryName.toLowerCase()) || dynamicCategories[0], [dynamicCategories, selectedCategoryName]);

  useEffect(() => {
    let isMounted = true;
    clearDataCache();
    getActiveArtistsPage(50).then((res) => {
        if (!isMounted) return;
        if (res.items && res.items.length > 0) {
          const mapped: ArtistCardData[] = res.items.map((item: any) => {
            const extracted = extractArtistServices(item);
            const servicesList = Array.from(new Set(extracted.map((s) => s.subcategory || s.artForm).filter(Boolean)));
            const subCat = servicesList[0] || item.subCategory || item.subcategory || item.artForm || item.category || "Artist";
            const uploadedImage = resolveArtistProfilePhoto(item);
            const fallbackImage = imageRegistry.getUniqueImage({ category: subCat, type: "artist", key: item.uid || item.id || item.displayName || item.name || "artist-card" });
            const rawExp = item.experience || item.yearsOfExperience || item.exp;
            const expText = rawExp ? `${rawExp}+ Years Experience` : "5+ Years Experience";
            const langs = Array.isArray(item.languages) && item.languages.length > 0 ? item.languages.join(", ") : item.language || "Marathi, Hindi, English";
            return {
              id: item.uid || item.id || String(Math.random()),
              name: item.displayName || item.name || item.stageName || item.artistName || "Professional Artist",
              isVerified: item.isVerified !== false,
              rating: item.rating ? Number(item.rating) : 4.9,
              reviewsCount: item.reviewsCount ? Number(item.reviewsCount) : 28,
              location: item.city || item.location || "Maharashtra",
              experience: expText,
              languages: langs,
              startingPrice: item.startingPrice ? String(item.startingPrice) : item.minPrice ? String(item.minPrice) : item.soloPrice ? String(item.soloPrice) : "15,000",
              image: uploadedImage || fallbackImage,
              subCategory: subCat,
              categoryGroup: item.categoryGroup || item.category || item.group || "",
              servicesList: servicesList.length ? servicesList : [subCat],
              rawItem: item,
            };
          });
          setRealArtists(mapped);
        }
        setLoading(false);
      }).catch((err) => { console.warn(err); if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, [decodedName]);

  const displayedArtists = useMemo(() => {
    if (!activeCategory) return [];
    let list = [...realArtists];
    const categorySubSet = new Set((activeCategory.subcategories || []).map((s) => s.toLowerCase()));
    const catNameLower = activeCategory.name.toLowerCase();
    list = list.filter((a) => {
      const subs = a.servicesList && a.servicesList.length ? a.servicesList : [a.subCategory];
      const artistGroup = (a.categoryGroup || "").toLowerCase();
      return subs.some((s) => categorySubSet.has(s.toLowerCase()) || s.toLowerCase().includes(catNameLower)) || artistGroup.includes(catNameLower);
    });
    if (activeSubcategory && activeSubcategory !== "All") {
      const subLower = activeSubcategory.toLowerCase();
      list = list.filter((a) => {
        const subs = a.servicesList && a.servicesList.length ? a.servicesList : [a.subCategory];
        return subs.some((s) => s.toLowerCase().includes(subLower));
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((a) => a.name.toLowerCase().includes(q) || a.subCategory.toLowerCase().includes(q) || a.location.toLowerCase().includes(q));
    }
    if (selectedCity && selectedCity !== "All Cities") {
      list = list.filter((a) => matchesArtistCity(a, selectedCity));
    }
    if (selectedPrice === "Under20k") {
      list = list.filter((a) => parseInt(a.startingPrice.replace(/\D/g, ""), 10) < 20000);
    } else if (selectedPrice === "20kTo30k") {
      list = list.filter((a) => { const price = parseInt(a.startingPrice.replace(/\D/g, ""), 10); return price >= 20000 && price <= 30000; });
    } else if (selectedPrice === "Above30k") {
      list = list.filter((a) => parseInt(a.startingPrice.replace(/\D/g, ""), 10) > 30000);
    }
    if (selectedSort === "Rating") {
      list.sort((a, b) => b.rating - a.rating);
    } else if (selectedSort === "PriceLow") {
      list.sort((a, b) => parseInt(a.startingPrice.replace(/\D/g, ""), 10) - parseInt(b.startingPrice.replace(/\D/g, ""), 10));
    } else if (selectedSort === "PriceHigh") {
      list.sort((a, b) => parseInt(b.startingPrice.replace(/\D/g, ""), 10) - parseInt(a.startingPrice.replace(/\D/g, ""), 10));
    }
    return list;
  }, [realArtists, activeCategory, activeSubcategory, searchQuery, selectedCity, selectedPrice, selectedSort]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-stone-50/60 flex flex-col font-sans antialiased pt-20">
      <Navbar />
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 md:px-6 py-4 md:py-6 space-y-6">
        {/* ─── 1. Breadcrumb & Global Search ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-b border-stone-200/80">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 overflow-x-auto whitespace-nowrap scrollbar-none">
            <Link to="/" className="hover:text-stone-900 transition-colors shrink-0">Home</Link>
            <span className="shrink-0 text-stone-400">&gt;</span>
            <Link to={`/events/${encodeURIComponent(decodedName)}`} className="hover:text-stone-900 transition-colors shrink-0">{decodedName}</Link>
            {activeCategory && (
              <>
                <span className="shrink-0 text-stone-400">&gt;</span>
                <span className="text-orange-600 font-extrabold shrink-0">{activeCategory.name}</span>
              </>
            )}
          </div>
          <div className="relative w-full sm:w-72">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search artists, categories..." className="w-full h-9 pl-4 pr-9 rounded-full bg-white border border-stone-200/90 text-xs font-medium text-stone-800 placeholder-stone-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all" />
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-stone-400 pointer-events-none" />
          </div>
        </div>

        {/* ─── 2. HORIZONTAL CATEGORIES BAR (Circular Avatar Cards) ─── */}
        {dynamicCategories.length > 0 && (
          <section className="bg-white rounded-3xl border border-stone-200/80 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-xs font-black text-stone-900 uppercase tracking-wider flex items-center gap-2">
                <span>{eventMeta.title} Categories</span>
                <span className="text-stone-400 font-bold">({dynamicCategories.length})</span>
              </h2>
              <span className="text-[11px] font-bold text-stone-400 hidden sm:inline">Scroll horizontally &rarr;</span>
            </div>

            <div className="flex items-start gap-4 sm:gap-6 overflow-x-auto pb-2 pt-1 scrollbar-none -mx-2 px-2">
              {dynamicCategories.map((cat) => {
                const isActive = activeCategory?.name.toLowerCase() === cat.name.toLowerCase();
                const circleImage = getCategoryCircleImage(cat.name, (cat as any).image);

                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryName(cat.name);
                      setActiveSubcategory("All");
                    }}
                    className={`flex flex-col items-center gap-2 shrink-0 group cursor-pointer transition-all duration-200 w-20 sm:w-24 ${
                      isActive ? "scale-[1.03]" : "hover:scale-[1.02]"
                    }`}
                  >
                    {/* Circular Avatar */}
                    <div
                      className={`relative h-16 w-16 sm:h-20 sm:w-20 rounded-full overflow-hidden shrink-0 transition-all duration-300 ${
                        isActive
                          ? "ring-4 ring-orange-500 ring-offset-2 border-2 border-white shadow-md"
                          : "border-2 border-stone-200 group-hover:border-orange-400 group-hover:shadow-sm"
                      }`}
                    >
                      <img
                        src={circleImage}
                        alt=""
                        className="h-full w-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                        loading="eager"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.src = "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=400&q=80";
                        }}
                      />
                    </div>

                    {/* Category Title */}
                    <span
                      className={`text-[11px] sm:text-xs font-black text-center leading-tight line-clamp-2 transition-colors ${
                        isActive
                          ? "text-orange-600 font-black"
                          : "text-stone-700 group-hover:text-orange-600"
                      }`}
                    >
                      {getArtLabel(t, cat.name)}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ─── 3. FULL WIDTH MAIN CONTENT ─── */}
        {activeCategory ? (
          <div className="space-y-4">
            {/* Subcategory Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
              <button
                type="button"
                onClick={() => setActiveSubcategory("All")}
                className={`h-9 px-5 rounded-full text-xs font-black transition-all duration-200 shrink-0 cursor-pointer flex items-center justify-center ${
                  activeSubcategory === "All"
                    ? "bg-orange-600 text-white shadow-md shadow-orange-600/20 scale-[1.02]"
                    : "bg-white border border-stone-200/90 text-stone-700 hover:bg-stone-100 hover:border-stone-300 shadow-2xs"
                }`}
              >
                All
              </button>
              {(activeCategory.subcategories || []).map((subName) => {
                const isSelected = activeSubcategory.toLowerCase() === subName.toLowerCase();
                return (
                  <button
                    key={subName}
                    type="button"
                    onClick={() => setActiveSubcategory(subName)}
                    className={`h-9 px-4 rounded-full text-xs font-black transition-all duration-200 shrink-0 cursor-pointer flex items-center justify-center ${
                      isSelected
                        ? "bg-orange-600 text-white shadow-md shadow-orange-600/20 scale-[1.02]"
                        : "bg-white border border-stone-200/90 text-stone-700 hover:bg-stone-100 hover:border-stone-300 shadow-2xs"
                    }`}
                  >
                    {getArtLabel(t, subName)}
                  </button>
                );
              })}
            </div>

            {/* Filter Controls Row */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <SearchableCityDropdown selectedCity={selectedCity} onSelectCity={setSelectedCity} availableArtists={realArtists} />
                <div className="relative inline-flex items-center rounded-full bg-white border border-stone-200 px-3.5 py-1.5 text-xs font-bold text-stone-700 shadow-2xs">
                  <span className="text-stone-400 font-normal mr-1">Sort by:</span>
                  <select value={selectedSort} onChange={(e) => setSelectedSort(e.target.value)} className="bg-transparent border-none outline-none cursor-pointer pr-1 font-extrabold text-stone-900">
                    <option value="Recommended">Recommended</option>
                    <option value="Rating">Rating: High to Low</option>
                    <option value="PriceLow">Price: Low to High</option>
                    <option value="PriceHigh">Price: High to Low</option>
                  </select>
                </div>
                <div className="relative inline-flex items-center rounded-full bg-white border border-stone-200 px-3.5 py-1.5 text-xs font-bold text-stone-700 shadow-2xs">
                  <span className="text-stone-400 font-normal mr-1">Price:</span>
                  <select value={selectedPrice} onChange={(e) => setSelectedPrice(e.target.value)} className="bg-transparent border-none outline-none cursor-pointer pr-1 font-extrabold text-stone-900">
                    <option value="All">All</option>
                    <option value="Under20k">Under ₹20,000</option>
                    <option value="20kTo30k">₹20,000 - ₹30,000</option>
                    <option value="Above30k">Above ₹30,000</option>
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRequirementModal(true)}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-orange-500/80 bg-white hover:bg-orange-50 text-stone-800 hover:text-orange-600 text-xs font-black shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-orange-600" /> Filters
              </button>
            </div>

            {/* Section Heading & Count */}
            <div className="flex items-center justify-between pt-1">
              <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
                {getArtLabel(t, activeCategory.name)} near you <span className="text-stone-400 font-bold ml-1">({displayedArtists.length})</span>
              </h2>
            </div>

            {/* Empty State */}
            {displayedArtists.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-3xl border border-stone-200 p-6 shadow-xs">
                <div className="h-14 w-14 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 mb-3">
                  <MapPin className="h-6 w-6 stroke-[1.75]" />
                </div>
                <h3 className="text-base font-extrabold text-stone-900 mb-1">No artists found for selected filters</h3>
                <p className="text-xs font-medium text-stone-500 max-w-sm mb-4">
                  {selectedCity !== "All Cities" ? "Try choosing 'All Cities' to view all available verified artists." : "Try selecting 'All' in subcategories or explore other categories."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCity("All Cities");
                    setActiveSubcategory("All");
                    setSelectedPrice("All");
                  }}
                  className="px-5 py-2.5 rounded-full bg-orange-600 text-white font-black text-xs shadow-md shadow-orange-600/20 hover:bg-orange-700 transition"
                >
                  Reset All Filters
                </button>
              </div>
            )}

            {/* Full Width 4-Column Artist Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {displayedArtists.map((artist) => {
                const isFav = favorites.has(artist.id);

                return (
                  <div
                    key={artist.id}
                    onClick={() => navigate(`/artist/${artist.id}`)}
                    className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-3xl bg-white border border-stone-200/80 shadow-xs hover:shadow-lg hover:border-orange-300 transition-all duration-300 cursor-pointer text-center"
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(artist.id);
                      }}
                      className="absolute top-3.5 right-3.5 p-1 rounded-full text-stone-400 hover:text-rose-500 transition cursor-pointer z-10"
                      aria-label="Add to favorites"
                    >
                      <Heart className={`h-4 w-4 sm:h-5 sm:w-5 stroke-[1.75] transition-colors ${isFav ? "fill-rose-500 text-rose-500" : "text-stone-400 hover:text-stone-600"}`} />
                    </button>

                    <div className="flex flex-col items-center">
                      <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-stone-100 ring-4 ring-stone-50 shadow-xs mb-3 shrink-0 border border-stone-200/60">
                        <img
                          src={artist.image}
                          alt={artist.name}
                          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.currentTarget;
                            const fallback = imageRegistry.getUniqueImage({ category: artist.subCategory || "Performers", type: "artist", key: artist.id });
                            if (target.src !== fallback) target.src = fallback;
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-center gap-1 text-[11px] font-black text-emerald-600 mb-1">
                        <CheckCircle2 className="h-3.5 w-3.5 fill-emerald-500 text-white" />
                        <span>Verified</span>
                      </div>
                      <h3 className="text-sm sm:text-base font-black text-stone-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                        {artist.name}
                      </h3>
                      <p className="text-xs font-semibold text-stone-500 mt-0.5">{artist.experience}</p>
                      <p className="text-xs font-medium text-stone-500 mt-0.5 line-clamp-1">{artist.languages}</p>
                    </div>

                    <div className="mt-3.5 pt-3 border-t border-stone-100 flex flex-col items-center">
                      <p className="text-xs font-medium text-stone-600">
                        Starting from <strong className="font-black text-stone-950 text-xs sm:text-sm">₹{artist.startingPrice}</strong>
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/artist/${artist.id}`);
                        }}
                        className="w-full mt-3 py-2 px-4 rounded-xl border border-orange-500/80 bg-white hover:bg-orange-500 text-orange-600 hover:text-white font-black text-xs transition-all duration-200 shadow-2xs cursor-pointer"
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Artist Registration CTA */}
            <div className="rounded-3xl bg-gradient-to-r from-orange-500 to-amber-500 text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center shrink-0">
                  <UserPlus className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-base sm:text-lg font-black leading-tight">Are you an artist or service provider?</h4>
                  <p className="text-xs sm:text-sm text-orange-100 font-medium mt-0.5">Join MyKalakar today and get booked for weddings, events, and programs.</p>
                </div>
              </div>
              <Link
                to="/artist-register"
                className="px-6 py-3 rounded-2xl bg-white text-orange-600 font-black text-xs sm:text-sm hover:bg-stone-50 transition shadow-sm shrink-0"
              >
                Register as Artist
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-2xs my-10">
            <p className="text-sm text-stone-500 font-medium">No details found for this event category.</p>
          </div>
        )}
      </main>

      <Footer />
      <NewRequirementModal open={showRequirementModal} onClose={() => setShowRequirementModal(false)} />
    </div>
  );
}

