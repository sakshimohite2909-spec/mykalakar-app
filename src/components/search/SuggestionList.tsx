import { SuggestionItem, type SpotlightSuggestion } from "@/components/search/SuggestionItem";
import { MapPin, ArrowRight, SearchX } from "lucide-react";

export function SuggestionList({
  suggestions,
  query,
  activeIndex,
  onSelect,
  selectedCategoryForLocation,
  onSelectLocation,
}: {
  suggestions: SpotlightSuggestion[];
  query: string;
  activeIndex: number;
  onSelect: (suggestion: SpotlightSuggestion) => void;
  selectedCategoryForLocation?: string | null;
  onSelectLocation?: (location: string) => void;
}) {
  const topCities = ["Pune", "Mumbai", "Kolhapur", "Sangli", "Satara", "All Cities"];

  // CRITICAL RULE: When search input is empty and no location step is active, DO NOT show dropdown!
  if (!query.trim() && !selectedCategoryForLocation) return null;

  return (
    <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-45 w-full max-w-[600px] mx-auto max-h-[300px] overflow-y-auto rounded-2xl border border-stone-200/90 bg-white p-1.5 shadow-[0_20px_45px_-10px_rgba(0,0,0,0.22)] scrollbar-thin">
      {selectedCategoryForLocation && onSelectLocation ? (
        /* Step 2: Location Selection */
        <div className="p-2 space-y-2">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <span className="text-xs font-extrabold text-stone-900 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-orange-500" />
              Select Location for "{selectedCategoryForLocation}"
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {topCities.map((city) => (
              <button
                key={city}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelectLocation(city);
                }}
                className="flex items-center justify-between h-9 px-3 rounded-xl border border-stone-200/90 bg-stone-50 text-xs font-bold text-stone-800 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition cursor-pointer group"
              >
                <span>{city}</span>
                <ArrowRight className="h-3 w-3 text-stone-400 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        </div>
      ) : suggestions.length > 0 ? (
        /* Step 1: Matching Suggestions List */
        suggestions.map((suggestion, index) => (
          <SuggestionItem
            key={suggestion.id}
            suggestion={suggestion}
            query={query}
            active={index === activeIndex}
            onSelect={onSelect}
          />
        ))
      ) : (
        /* No Matches State */
        <div className="py-4 px-3 text-center">
          <p className="text-xs font-bold text-stone-500">
            No results found
          </p>
        </div>
      )}
    </div>
  );
}
