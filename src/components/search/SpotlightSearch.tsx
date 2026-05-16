import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { CATEGORY_GROUP_OPTIONS } from "@/constants/artistSystem";
import { getActiveArtists } from "@/services/dataService";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { SuggestionList } from "@/components/search/SuggestionList";
import type { SpotlightSuggestion } from "@/components/search/SuggestionItem";

const TOP_LOCATIONS = ["Mumbai", "Pune", "Kolhapur", "Nashik", "Nagpur", "Satara"];

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function rankSuggestion(label: string, type: SpotlightSuggestion["type"], query: string) {
  const cleanLabel = normalize(label);
  const cleanQuery = normalize(query);
  if (!cleanQuery) return type === "category" ? 60 : type === "location" ? 45 : 30;
  if (cleanLabel === cleanQuery) return 100;
  if (cleanLabel.startsWith(cleanQuery)) return type === "category" || type === "location" ? 90 : 76;
  if (cleanLabel.includes(cleanQuery)) return type === "category" || type === "location" ? 72 : 58;
  return 0;
}

export function SpotlightSearch({ className = "" }: { className?: string }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
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

  const suggestions = useMemo<SpotlightSuggestion[]>(() => {
    const categorySuggestions = CATEGORY_GROUP_OPTIONS.flatMap((group) => [
      { id: `cat:${group.name}`, label: group.name, type: "category" as const, value: group.name },
      ...group.subcategories.slice(0, 8).map((sub) => ({ id: `cat:${sub}`, label: sub, type: "category" as const, value: sub })),
    ]);
    const locationSuggestions = TOP_LOCATIONS.map((location) => ({ id: `loc:${location}`, label: location, type: "location" as const, value: location }));
    const artistSuggestions = topArtists.map((artist) => ({
      id: `artist:${artist.id}`,
      label: String(artist.name || artist.professionalName || "Artist"),
      type: "artist" as const,
      value: String(artist.name || artist.professionalName || ""),
    }));

    const ranked = [...categorySuggestions, ...locationSuggestions, ...artistSuggestions]
      .map((suggestion) => ({ ...suggestion, score: rankSuggestion(suggestion.label, suggestion.type, debouncedQuery) }))
      .filter((suggestion) => suggestion.score > 0)
      .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
      .slice(0, 6);

    if (debouncedQuery.trim() && !ranked.some((item) => normalize(item.label) === normalize(debouncedQuery))) {
      ranked.push({ id: `query:${debouncedQuery}`, label: debouncedQuery, type: "query", value: debouncedQuery, score: 1 });
    }

    return ranked.slice(0, 6);
  }, [debouncedQuery, topArtists]);

  useEffect(() => {
    setActiveIndex(0);
  }, [debouncedQuery]);

  const search = (value = query) => {
    const clean = value.trim();
    if (!clean) return;
    navigate(`/search?q=${encodeURIComponent(clean)}`);
  };

  const selectSuggestion = (suggestion: SpotlightSuggestion) => {
    if (suggestion.type === "category") {
      const isCategoryGroup = CATEGORY_GROUP_OPTIONS.some((group) => normalize(group.name) === normalize(suggestion.value));
      const param = isCategoryGroup ? "category" : "subcategory";
      navigate(`/search?${param}=${encodeURIComponent(suggestion.value)}`);
      return;
    }
    search(suggestion.value);
  };

  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-stone-400" />
      <input
        value={query}
        onFocus={() => setFocused(true)}
        onBlur={() => window.setTimeout(() => setFocused(false), 120)}
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
          }
        }}
        placeholder="Search singer, dhol, city"
        className="h-14 w-full rounded-2xl border border-stone-200 bg-stone-50 pl-11 pr-4 text-sm font-extrabold text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
      />
      {focused ? (
        <SuggestionList suggestions={suggestions} query={debouncedQuery} activeIndex={activeIndex} onSelect={selectSuggestion} />
      ) : null}
    </div>
  );
}
