import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, Sparkles, X } from "lucide-react";
import { getAllMasterArtOptions, type MasterArtOption } from "@/constants/artistSystem";
import { useI18n } from "@/i18n/I18nProvider";
import { getArtLabel } from "@/lib/artLabels";

interface SearchableArtSelectorProps {
  label?: string;
  value: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  onSelect: (option: MasterArtOption) => void;
}

export function SearchableArtSelector({
  label = "What do you offer?",
  value,
  placeholder = "Search or select your art / service...",
  error,
  disabled = false,
  onSelect,
}: SearchableArtSelectorProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const masterOptions = useMemo(() => getAllMasterArtOptions(), []);

  // Filter options based on user search query
  const filteredOptions = useMemo(() => {
    if (!query.trim()) {
      return masterOptions;
    }
    const q = query.trim().toLowerCase();
    return masterOptions.filter((opt) => {
      const localized = getArtLabel(t, opt.name).toLowerCase();
      const raw = opt.name.toLowerCase();
      return raw.includes(q) || localized.includes(q);
    });
  }, [masterOptions, query, t]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSelect = (option: MasterArtOption) => {
    onSelect(option);
    setQuery("");
    setIsOpen(false);
  };

  const handleCustomSubmit = () => {
    if (!query.trim()) return;
    const customName = query.trim();
    const customOption: MasterArtOption = {
      name: customName,
      icon: "✨",
      primaryCategory: "General Services",
      allCategories: ["General Services"],
      defaultEventTypes: ["Wedding", "Birthday", "Cultural Event"],
    };
    onSelect(customOption);
    setQuery("");
    setIsOpen(false);
  };

  const selectedOption = useMemo(() => {
    if (!value) return null;
    return masterOptions.find((opt) => opt.name.toLowerCase() === value.toLowerCase()) || {
      name: value,
      icon: "✨",
      primaryCategory: "General Services",
      allCategories: ["General Services"],
      defaultEventTypes: ["Wedding", "Birthday", "Cultural Event"],
    };
  }, [value, masterOptions]);

  return (
    <div ref={containerRef} className="relative w-full space-y-1.5">
      {label && (
        <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700">
          <Sparkles className="h-3.5 w-3.5 text-orange-500" />
          {label}
        </label>
      )}

      {/* Trigger Button / Input Display */}
      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setTimeout(() => inputRef.current?.focus(), 50);
            }
          }
        }}
        className={`flex min-h-[46px] w-full items-center justify-between gap-2 rounded-xl border bg-white px-3.5 py-2 text-left transition-all ${
          disabled
            ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
            : isOpen
            ? "border-orange-500 ring-2 ring-orange-400/20 shadow-sm cursor-pointer"
            : error
            ? "border-red-400 focus:border-red-500 cursor-pointer"
            : "border-slate-200 hover:border-orange-300 cursor-pointer shadow-sm"
        }`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {selectedOption ? (
            <>
              <span className="text-lg leading-none shrink-0">{selectedOption.icon}</span>
              <span className="truncate text-sm font-black text-slate-900">
                {getArtLabel(t, selectedOption.name)}
              </span>
            </>
          ) : (
            <span className="truncate text-xs font-medium text-slate-400">
              {placeholder}
            </span>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-180 text-orange-500" : ""}`} />
      </div>

      {error && <p className="text-[11px] font-bold text-red-500">{error}</p>}

      {/* Dropdown Popover */}
      {isOpen && !disabled && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-full rounded-2xl border border-orange-100 bg-white p-2 shadow-2xl backdrop-blur-xl">
          {/* Search Box */}
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (filteredOptions.length > 0) {
                    handleSelect(filteredOptions[0]);
                  } else if (query.trim()) {
                    handleCustomSubmit();
                  }
                }
              }}
              placeholder="Type to search (e.g. Singer, Kirtankar, DJ)..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2 pl-9 pr-8 text-xs font-semibold text-slate-900 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-400/20"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Suggestions List */}
          <div className="max-h-60 overflow-y-auto no-scrollbar space-y-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = value && opt.name.toLowerCase() === value.toLowerCase();
                return (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left transition-all ${
                      isSelected
                        ? "bg-orange-50 text-orange-950 font-black"
                        : "hover:bg-slate-50 text-slate-700 font-semibold"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base shrink-0">{opt.icon}</span>
                      <span className="text-xs truncate">{getArtLabel(t, opt.name)}</span>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-orange-600 shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-center">
                <p className="text-xs text-slate-500">No art form found matching &ldquo;{query}&rdquo;.</p>
                <button
                  type="button"
                  onClick={handleCustomSubmit}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-orange-600 shadow-sm"
                >
                  <Sparkles className="h-3 w-3" />
                  Add &ldquo;{query}&rdquo; as Custom Art
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
