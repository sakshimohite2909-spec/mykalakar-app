import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { CATEGORY_GROUP_OPTIONS } from "@/constants/artistSystem";
import { getActiveArtists } from "@/services/dataService";
import { resolveArtistProfilePhoto } from "@/services/dataNormalizer";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { SuggestionList } from "@/components/search/SuggestionList";
import type { SpotlightSuggestion } from "@/components/search/SuggestionItem";
import { useI18n } from "@/i18n/I18nProvider";
import { getArtLabel } from "@/lib/artLabels";

const TOP_LOCATIONS = ["Mumbai", "Pune", "Kolhapur", "Sangli", "Satara", "Nashik"];

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function rankSuggestion(label: string, type: SpotlightSuggestion["type"], query: string) {
  const cleanLabel = normalize(label);
  const cleanQuery = normalize(query);
  if (!cleanQuery) return 0; // CRITICAL: Empty search input MUST NOT return any default items!
  
  if (cleanLabel === cleanQuery) return 100; // EXACT MATCH
  if (cleanLabel.startsWith(cleanQuery)) return 90; // STARTS WITH MATCH
  if (cleanLabel.includes(cleanQuery)) return 70; // CONTAINS MATCH
  return 0;
}

export function SpotlightSearch({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedCategoryForLocation, setSelectedCategoryForLocation] = useState<string | null>(null);
  const [topArtists, setTopArtists] = useState<Array<Record<string, any>>>([]);
  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    let mounted = true;
    getActiveArtists(12)
      .then((artists) => {
        if (mounted) setTopArtists(artists as Array<Record<string, any>>);
      })
      .catch((error) => console.warn("Spotlight artist cache unavailable.", error));
    return () => {
      mounted = false;
    };
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setFocused(false);
        setSelectedCategoryForLocation(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const suggestions = useMemo<SpotlightSuggestion[]>(() => {
    const categorySuggestions: SpotlightSuggestion[] = CATEGORY_GROUP_OPTIONS.flatMap((group) => [
      { id: `cat:${group.name}`, label: getArtLabel(t, group.name), type: "category" as const, value: group.name },
      ...group.subcategories.slice(0, 8).map((sub) => ({
        id: `sub:${group.name}:${sub}`,
        label: getArtLabel(t, sub),
        type: "subcategory" as const,
        value: sub,
        subLabel: group.name,
      })),
    ]);
    const locationSuggestions: SpotlightSuggestion[] = TOP_LOCATIONS.map((location) => ({
      id: `loc:${location}`,
      label: location,
      type: "location" as const,
      value: location,
    }));
    const artistSuggestions: SpotlightSuggestion[] = topArtists.map((artist) => ({
      id: `artist:${artist.id}`,
      label: String(artist.name || artist.professionalName || "Artist"),
      type: "artist" as const,
      value: String(artist.name || artist.professionalName || ""),
      location: artist.city || artist.location || "Pune, Maharashtra",
      image: resolveArtistProfilePhoto(artist) || undefined,
    }));

    const ranked = [...categorySuggestions, ...locationSuggestions, ...artistSuggestions]
      .map((suggestion) => ({
        ...suggestion,
        score: Math.max(
          rankSuggestion(suggestion.label, suggestion.type, debouncedQuery),
          rankSuggestion(suggestion.value, suggestion.type, debouncedQuery)
        ),
      }))
      .filter((suggestion) => (suggestion.score ?? 0) > 0)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || a.label.localeCompare(b.label));

    // Deduplicate by unique type + value
    const seen = new Set<string>();
    const deduplicated: SpotlightSuggestion[] = [];
    for (const item of ranked) {
      const key = `${item.type}:${normalize(item.value)}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(item);
      }
    }

    return deduplicated.slice(0, 6);
  }, [debouncedQuery, t, topArtists]);

  useEffect(() => {
    setActiveIndex(0);
    setSelectedCategoryForLocation(null);
  }, [debouncedQuery]);

  const search = (value = query, location?: string) => {
    const clean = value.trim();
    if (!clean) return;
    const locParam = location && location !== "All Cities" ? `&location=${encodeURIComponent(location)}` : "";
    navigate(`/search?q=${encodeURIComponent(clean)}${locParam}`);
    setFocused(false);
  };

  const selectSuggestion = (suggestion: SpotlightSuggestion) => {
    if (suggestion.type === "category" || suggestion.type === "subcategory") {
      // Step 2: Prompt Location selection inline inside compact dropdown
      setSelectedCategoryForLocation(suggestion.value);
      return;
    }
    if (suggestion.type === "location") {
      search(query || suggestion.value, suggestion.value);
      return;
    }
    search(suggestion.value);
  };

  const handleSelectLocation = (location: string) => {
    if (selectedCategoryForLocation) {
      const locParam = location && location !== "All Cities" ? `&location=${encodeURIComponent(location)}` : "";
      navigate(`/search?subCategory=${encodeURIComponent(selectedCategoryForLocation)}${locParam}`);
      setFocused(false);
      setSelectedCategoryForLocation(null);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-stone-400" />
      <input
        value={query}
        onFocus={() => setFocused(true)}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((current) => Math.min(current + 1, suggestions.length - 1));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((current) => Math.max(current - 1, 0));
          } else if (event.key === "Enter") {
            event.preventDefault();
            const active = suggestions[activeIndex];
            if (active) selectSuggestion(active);
            else search();
          } else if (event.key === "Escape") {
            setFocused(false);
            setSelectedCategoryForLocation(null);
          }
        }}
        placeholder={t("spotlight.placeholder")}
        className="h-14 w-full rounded-2xl border border-stone-200 bg-stone-50 pl-11 pr-4 text-sm font-extrabold text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
      />
      {focused && (query.trim() || selectedCategoryForLocation) ? (
        <SuggestionList
          suggestions={suggestions}
          query={debouncedQuery}
          activeIndex={activeIndex}
          onSelect={selectSuggestion}
          selectedCategoryForLocation={selectedCategoryForLocation}
          onSelectLocation={handleSelectLocation}
        />
      ) : null}
    </div>
  );
}
