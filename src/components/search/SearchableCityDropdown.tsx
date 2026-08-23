import { useState, useMemo, useRef, useEffect } from "react";
import { MapPin, Search, ChevronDown, Check, X } from "lucide-react";
import { extractArtistLocations, matchesArtistCity } from "@/constants/artistSystem";

const MASTER_CITIES = [
  "Pune",
  "Mumbai",
  "Sangli",
  "Nashik",
  "Kolhapur",
  "Thane",
  "Satara",
  "Nagpur",
  "Aurangabad",
  "Solapur",
  "Ratnagiri",
  "Sindhudurg",
  "Latur",
  "Jalgaon",
  "Ahmednagar",
  "Nanded",
  "Amravati",
];

interface SearchableCityDropdownProps {
  selectedCity: string;
  onSelectCity: (city: string) => void;
  availableArtists?: Array<Record<string, any>>;
  className?: string;
}

export function SearchableCityDropdown({
  selectedCity = "All Cities",
  onSelectCity,
  availableArtists = [],
  className = "",
}: SearchableCityDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Dynamically extract unique cities from master list & registered artist profiles
  const cityOptions = useMemo(() => {
    const citySet = new Set<string>(MASTER_CITIES);

    // Extract dynamic cities from passed artists
    if (availableArtists && availableArtists.length > 0) {
      availableArtists.forEach((artist) => {
        const locations = extractArtistLocations(artist);
        locations.forEach((loc) => {
          const trimmed = loc.trim();
          if (trimmed && trimmed.length > 1) {
            const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
            citySet.add(formatted);
          }
        });
      });
    }

    const sortedCities = Array.from(citySet).sort((a, b) => a.localeCompare(b));
    return ["All Cities", ...sortedCities];
  }, [availableArtists]);

  // Calculate matching artist count per city
  const cityArtistCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    cityOptions.forEach((city) => {
      if (city === "All Cities") {
        counts[city] = availableArtists.length;
      } else {
        counts[city] = availableArtists.filter((artist) => matchesArtistCity(artist, city)).length;
      }
    });
    return counts;
  }, [cityOptions, availableArtists]);

  // Filter cities based on search input
  const filteredCities = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return cityOptions;
    return cityOptions.filter((city) =>
      city.toLowerCase().includes(query)
    );
  }, [cityOptions, searchQuery]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSelect = (city: string) => {
    onSelectCity(city);
    setIsOpen(false);
    setSearchQuery("");
  };

  const isAllCitiesSelected = !selectedCity || selectedCity === "All" || selectedCity === "All Cities" || selectedCity === "all";
  const currentLabel = isAllCitiesSelected ? "All Cities" : selectedCity;

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Location Trigger Pill (Preserves existing MyKalakar style) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative inline-flex items-center gap-1.5 rounded-full bg-white border border-stone-200 px-3.5 py-1.5 text-xs font-bold text-stone-700 shadow-2xs hover:border-stone-400 transition cursor-pointer select-none"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <MapPin className="h-3.5 w-3.5 text-orange-600 shrink-0" />
        <span className="truncate max-w-[120px] text-stone-900">{currentLabel}</span>
        <ChevronDown className={`h-3 w-3 text-stone-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Floating Dropdown Panel (Ultra-compact & sleek to prevent card overlap) */}
      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-52 sm:w-56 rounded-xl border border-stone-200 bg-white p-1.5 shadow-lg animate-in fade-in-50 zoom-in-95">
          {/* Compact Search Input Box */}
          <div className="relative mb-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-stone-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setIsOpen(false);
                  setSearchQuery("");
                }
              }}
              placeholder="Search city..."
              className="w-full h-7 pl-7 pr-6 text-[11px] font-semibold rounded-lg border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 outline-none focus:border-orange-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Cities List */}
          <div className="max-h-40 overflow-y-auto space-y-0.5 pr-0.5 scrollbar-thin">
            {/* Always show "All Cities" option */}
            <button
              type="button"
              onClick={() => handleSelect("All Cities")}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                isAllCitiesSelected
                  ? "bg-orange-500 text-white font-extrabold shadow-2xs"
                  : "text-stone-700 hover:bg-stone-100 hover:text-stone-900"
              }`}
            >
              <span className="truncate">All Cities</span>
              {isAllCitiesSelected && <Check className="h-3 w-3 shrink-0" />}
            </button>

            {/* If a specific city is currently selected and search query is empty, show selected city */}
            {!isAllCitiesSelected && !searchQuery.trim() && (
              <button
                type="button"
                onClick={() => handleSelect(selectedCity)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-extrabold rounded-lg bg-orange-500 text-white shadow-2xs cursor-pointer"
              >
                <span className="truncate">{selectedCity}</span>
                <div className="flex items-center gap-1 shrink-0 ml-1">
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-white/25 text-white">
                    {cityArtistCounts[selectedCity] ?? 0} {(cityArtistCounts[selectedCity] ?? 0) === 1 ? "Artist" : "Artists"}
                  </span>
                  <Check className="h-3 w-3 shrink-0" />
                </div>
              </button>
            )}

            {/* When user types in search query, show matching cities */}
            {searchQuery.trim() ? (
              filteredCities.filter((c) => c !== "All Cities").length > 0 ? (
                filteredCities
                  .filter((c) => c !== "All Cities")
                  .map((city) => {
                    const isSelected = city.toLowerCase() === selectedCity.toLowerCase();
                    const count = cityArtistCounts[city] ?? 0;

                    return (
                      <button
                        key={city}
                        type="button"
                        onClick={() => handleSelect(city)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition cursor-pointer ${
                          isSelected
                            ? "bg-orange-500 text-white font-extrabold shadow-2xs"
                            : "text-stone-700 hover:bg-stone-100 hover:text-stone-900"
                        }`}
                      >
                        <span className="truncate">{city}</span>
                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                              isSelected ? "bg-white/25 text-white" : "bg-stone-100 text-stone-500"
                            }`}
                          >
                            {count} {count === 1 ? "Artist" : "Artists"}
                          </span>
                          {isSelected && <Check className="h-3 w-3 shrink-0" />}
                        </div>
                      </button>
                    );
                  })
              ) : (
                <button
                  type="button"
                  onClick={() => handleSelect(searchQuery.trim())}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-semibold rounded-lg text-stone-700 hover:bg-stone-100 cursor-pointer"
                >
                  <span className="truncate">Select "{searchQuery.trim()}"</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-stone-100 text-stone-500">
                    0 Artists
                  </span>
                </button>
              )
            ) : (
              <div className="py-1 text-center text-[10px] font-medium text-stone-400 border-t border-stone-100/80 mt-1">
                Type city name to search...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
