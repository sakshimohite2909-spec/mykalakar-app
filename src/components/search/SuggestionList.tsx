import { SuggestionItem, type SpotlightSuggestion } from "@/components/search/SuggestionItem";

export function SuggestionList({
  suggestions,
  query,
  activeIndex,
  onSelect,
}: {
  suggestions: SpotlightSuggestion[];
  query: string;
  activeIndex: number;
  onSelect: (suggestion: SpotlightSuggestion) => void;
}) {
  if (!suggestions.length) return null;

  return (
    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 rounded-2xl border border-stone-200 bg-white p-2 shadow-[0_24px_80px_rgba(28,25,23,0.16)]">
      {suggestions.map((suggestion, index) => (
        <SuggestionItem
          key={suggestion.id}
          suggestion={suggestion}
          query={query}
          active={index === activeIndex}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
