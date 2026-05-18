import { MapPin, Music2, Search, UserRound } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";

export type SpotlightSuggestion = {
  id: string;
  label: string;
  type: "category" | "location" | "artist" | "query";
  value: string;
  score: number;
};

const icons = {
  category: Music2,
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
      <mark className="rounded bg-orange-100 px-0.5 text-orange-700">{label.slice(index, index + clean.length)}</mark>
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
  const { t } = useI18n(); // ADDED FOR i18n
  const Icon = icons[suggestion.type];
  return (
    <button
      type="button"
      onMouseDown={(event) => {
        event.preventDefault();
        onSelect(suggestion);
      }}
      className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left transition ${
        active ? "bg-stone-950 text-white" : "text-stone-700 hover:bg-stone-50"
      }`}
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? "bg-white/14" : "bg-orange-50 text-orange-600"}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-extrabold">{highlight(suggestion.label, query)}</span>
        <span className={`block text-[10px] font-black uppercase tracking-widest ${active ? "text-white/55" : "text-stone-400"}`}>
          {t(`spotlight.type.${suggestion.type}`)} {/* ADDED FOR i18n */}
        </span>
      </span>
    </button>
  );
}
