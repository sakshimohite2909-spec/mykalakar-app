import { MapPin, Music2, Search, UserRound } from "lucide-react";

export type SpotlightSuggestion = {
  id: string;
  label: string;
  type: "category" | "subcategory" | "location" | "artist" | "query";
  value: string;
  score?: number;
  location?: string;
  image?: string;
  subLabel?: string;
};

const icons = {
  category: Music2,
  subcategory: Music2,
  location: MapPin,
  artist: UserRound,
  query: Search,
};

function highlight(label: string, query: string) {
  const clean = query.trim();
  if (!clean) return label;
  const index = label.toLowerCase().indexOf(clean.toLowerCase());
  if (index < 0) return label;
  return (
    <>
      {label.slice(0, index)}
      <mark className="rounded bg-orange-100/90 px-0.5 text-orange-700 font-extrabold">{label.slice(index, index + clean.length)}</mark>
      {label.slice(index + clean.length)}
    </>
  );
}

export function SuggestionItem({
  suggestion,
  query,
  active,
  onSelect,
}: {
  suggestion: SpotlightSuggestion;
  query: string;
  active: boolean;
  onSelect: (suggestion: SpotlightSuggestion) => void;
}) {
  const Icon = icons[suggestion.type] || Music2;

  return (
    <button
      type="button"
      onMouseDown={(event) => {
        event.preventDefault();
        onSelect(suggestion);
      }}
      className={`flex h-12 w-full items-center gap-3 rounded-xl px-3 text-left transition-all duration-150 cursor-pointer ${
        active ? "bg-stone-900 text-white shadow-xs" : "text-stone-800 hover:bg-orange-50/70"
      }`}
    >
      {/* Small Relevant Icon or Artist Thumbnail */}
      {suggestion.type === "artist" && suggestion.image ? (
        <img
          src={suggestion.image}
          alt=""
          className="h-7 w-7 rounded-full object-cover shrink-0 border border-stone-200"
        />
      ) : (
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
            active ? "bg-white/15 text-orange-400" : "bg-orange-100/80 text-orange-600"
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
      )}

      {/* Result Name & Secondary Metadata */}
      <div className="min-w-0 flex-1">
        <span className="block truncate text-xs sm:text-sm font-semibold leading-snug">
          {highlight(suggestion.label, query)}
        </span>
        {suggestion.type === "artist" && suggestion.location && (
          <span
            className={`block truncate text-[11px] font-normal ${
              active ? "text-stone-300" : "text-stone-400"
            }`}
          >
            {suggestion.location}
          </span>
        )}
      </div>
    </button>
  );
}
