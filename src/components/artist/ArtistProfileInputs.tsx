import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const LANGUAGE_OPTIONS = [
  "Marathi",
  "Hindi",
  "English",
  "Sanskrit",
  "Gujarati",
  "Kannada",
  "Telugu",
  "Tamil",
  "Malayalam",
  "Punjabi",
  "Bengali",
  "Urdu",
  "Konkani",
  "Rajasthani",
  "Odia",
  "Other",
];

export const INDIAN_BANK_OPTIONS = [
  "State Bank of India",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Bank of Baroda",
  "Punjab National Bank",
  "Kotak Mahindra Bank",
  "Canara Bank",
  "Union Bank of India",
  "IDFC First Bank",
  "IndusInd Bank",
  "Yes Bank",
  "AU Small Finance Bank",
  "Bank of India",
  "Central Bank of India",
  "Indian Bank",
  "Indian Overseas Bank",
  "UCO Bank",
  "Bank of Maharashtra",
  "Punjab & Sind Bank",
  "Federal Bank",
  "South Indian Bank",
  "Karnataka Bank",
  "Karur Vysya Bank",
  "City Union Bank",
  "Tamilnad Mercantile Bank",
  "RBL Bank",
  "Bandhan Bank",
  "CSB Bank",
  "DCB Bank",
  "Dhanlaxmi Bank",
  "Jammu & Kashmir Bank",
  "Nainital Bank",
  "IDBI Bank",
  "Ujjivan Small Finance Bank",
  "Equitas Small Finance Bank",
  "Suryoday Small Finance Bank",
  "ESAF Small Finance Bank",
  "Utkarsh Small Finance Bank",
  "Fincare Small Finance Bank",
  "North East Small Finance Bank",
  "Jana Small Finance Bank",
  "Capital Small Finance Bank",
  "India Post Payments Bank",
  "Airtel Payments Bank",
  "Paytm Payments Bank",
  "Other",
];

const MONTHS = [
  { value: "01", label: "Jan" },
  { value: "02", label: "Feb" },
  { value: "03", label: "Mar" },
  { value: "04", label: "Apr" },
  { value: "05", label: "May" },
  { value: "06", label: "Jun" },
  { value: "07", label: "Jul" },
  { value: "08", label: "Aug" },
  { value: "09", label: "Sep" },
  { value: "10", label: "Oct" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dec" },
];

function pad2(value: number | string) {
  return String(value).padStart(2, "0");
}

function daysInMonth(year: string, month: string) {
  if (!year || !month) return 31;
  return new Date(Number(year), Number(month), 0).getDate();
}

function splitDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
  if (!match) return { year: "", month: "", day: "" };
  return { year: match[1], month: match[2], day: match[3] };
}

type DateOfBirthSelectProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
};

export function DateOfBirthSelect({
  label = "Date of Birth",
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
}: DateOfBirthSelectProps) {
  const [draft, setDraft] = useState(() => splitDate(value));
  const currentYear = new Date().getFullYear();
  const years = useMemo(
    () => Array.from({ length: currentYear - 1900 + 1 }, (_, index) => String(currentYear - index)),
    [currentYear],
  );
  const dayCount = daysInMonth(draft.year, draft.month);
  const days = useMemo(() => Array.from({ length: dayCount }, (_, index) => pad2(index + 1)), [dayCount]);
  const accessibleLabel = label || "Date of Birth";

  useEffect(() => {
    setDraft(splitDate(value));
  }, [value]);

  const updatePart = (part: "year" | "month" | "day", nextValue: string) => {
    const next = { ...draft, [part]: nextValue };
    const maxDay = daysInMonth(next.year, next.month);
    if (next.day && Number(next.day) > maxDay) next.day = pad2(maxDay);
    setDraft(next);

    if (next.year && next.month && next.day) {
      onChange(`${next.year}-${next.month}-${next.day}`);
    } else {
      onChange("");
    }
  };

  const selectClass = cn(
    "h-12 w-full rounded-xl border bg-white/80 px-3 text-sm font-bold text-slate-800 shadow-sm outline-none transition-all duration-200",
    "hover:border-orange-200 hover:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 active:scale-[0.99]",
    error ? "border-red-400 focus:border-red-500 focus:ring-red-200" : "border-orange-100",
    disabled && "cursor-not-allowed opacity-60",
  );

  return (
    <div>
      {label ? (
        <label className="mb-1.5 block text-sm font-bold text-slate-700">
          {label} {required ? <span className="text-red-500">*</span> : null}
        </label>
      ) : null}
      <div className="grid grid-cols-[1.05fr_1fr_1fr] gap-2 sm:grid-cols-3">
        <select
          value={draft.year}
          onChange={(event) => updatePart("year", event.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          className={selectClass}
          aria-label={`${accessibleLabel} year`}
        >
          <option value="">Year</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <select
          value={draft.month}
          onChange={(event) => updatePart("month", event.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          className={selectClass}
          aria-label={`${accessibleLabel} month`}
        >
          <option value="">Month</option>
          {MONTHS.map((month) => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </select>
        <select
          value={draft.day}
          onChange={(event) => updatePart("day", event.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          className={selectClass}
          aria-label={`${accessibleLabel} day`}
        >
          <option value="">Day</option>
          {days.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>
      </div>
      {error ? <p className="mt-1.5 text-xs font-semibold text-red-500">{error}</p> : null}
    </div>
  );
}

type SearchableSingleSelectProps = {
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  error?: string;
  disabled?: boolean;
  allowCustom?: boolean;
  onChange: (value: string) => void;
  onBlur?: () => void;
};

export function SearchableSingleSelect({
  label,
  value,
  options,
  placeholder,
  error,
  disabled = false,
  allowCustom = false,
  onChange,
  onBlur,
}: SearchableSingleSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const filteredOptions = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    const matches = query ? options.filter((option) => option.toLowerCase().includes(query)) : options;
    const customValue = searchValue.trim();
    const shouldAddCustom =
      allowCustom &&
      customValue.length > 1 &&
      !options.some((option) => option.toLowerCase() === customValue.toLowerCase());

    return shouldAddCustom ? [customValue, ...matches] : matches;
  }, [allowCustom, options, searchValue]);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setSearchValue("");
        onBlur?.();
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [onBlur]);

  useEffect(() => {
    if (open) {
      setActiveIndex(0);
      window.requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [searchValue]);

  const selectValue = (nextValue: string) => {
    onChange(nextValue);
    onBlur?.();
    setOpen(false);
    setSearchValue("");
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, Math.max(filteredOptions.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const next = filteredOptions[activeIndex];
      if (next) selectValue(next);
    } else if (event.key === "Escape") {
      setOpen(false);
      setSearchValue("");
      onBlur?.();
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      {label ? <label className="mb-1.5 block text-sm font-bold text-slate-700">{label}</label> : null}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((current) => !current)}
        onKeyDown={(event) => {
          if ((event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") && !open) {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          "input-glass flex h-[50px] w-full items-center justify-between px-4 text-left text-sm transition-all duration-200",
          "hover:border-orange-200 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/10 active:scale-[0.99]",
          disabled && "cursor-not-allowed opacity-60",
          error && "border-red-400 focus:border-red-500 focus:ring-red-200",
        )}
      >
        <span className={value ? "text-[#1A1A1A]" : "text-slate-400"}>{value || placeholder}</span>
        <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && !disabled ? (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
          <div className="sticky top-0 z-10 border-b border-slate-100 bg-white p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder={`Search ${(label || "options").toLowerCase()}`}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
              />
            </div>
          </div>
          <ul className="dropdown-scroll-area no-scrollbar pointer-events-auto max-h-[min(300px,50vh)] overflow-y-auto py-1" role="listbox">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => {
                const selected = option === value;
                const active = index === activeIndex;
                return (
                  <li key={`${option}-${index}`} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => selectValue(option)}
                      className={cn(
                        "flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-all duration-150",
                        selected && "bg-orange-50 font-black text-orange-700",
                        !selected && active && "bg-slate-50 text-slate-950",
                        !selected && !active && "text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      <span>{allowCustom && searchValue.trim() === option && !options.includes(option) ? `Add "${option}"` : option}</span>
                      {selected ? <Check className="h-4 w-4 text-orange-600" /> : null}
                    </button>
                  </li>
                );
              })
            ) : (
              <li className="px-4 py-3 text-sm text-slate-500">No results found.</li>
            )}
          </ul>
        </div>
      ) : null}
      {error ? <p className="mt-1.5 text-xs font-semibold text-red-500">{error}</p> : null}
    </div>
  );
}

type SearchableLanguageSelectProps = {
  label?: string;
  values: string[];
  options?: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
};

export function SearchableLanguageSelect({
  label = "Languages Spoken",
  values,
  options = LANGUAGE_OPTIONS,
  onChange,
  disabled = false,
}: SearchableLanguageSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const safeValues = useMemo(() => (Array.isArray(values) ? values : []), [values]);
  const selectedSet = useMemo(() => new Set(safeValues), [safeValues]);

  const filteredOptions = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    return query ? options.filter((option) => option.toLowerCase().includes(query)) : options;
  }, [options, searchValue]);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setSearchValue("");
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  useEffect(() => {
    if (open) window.requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const toggleValue = (option: string) => {
    onChange(selectedSet.has(option) ? safeValues.filter((item) => item !== option) : [...safeValues, option]);
  };

  const removeValue = (option: string) => {
    onChange(safeValues.filter((item) => item !== option));
  };

  return (
    <div ref={wrapperRef} className="relative">
      {label ? <label className="mb-2 block text-sm font-bold text-slate-700">{label}</label> : null}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((current) => !current)}
        className={cn(
          "min-h-[52px] w-full rounded-2xl border border-orange-100 bg-white/75 px-3 py-2 text-left shadow-sm backdrop-blur-md transition-all duration-200",
          "hover:border-orange-200 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/10 active:scale-[0.99]",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <span className="flex min-h-8 flex-wrap items-center gap-2">
          {safeValues.length ? (
            safeValues.map((value) => (
              <span
                key={value}
                className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-black text-orange-700 shadow-sm"
              >
                {value}
                <span
                  role="button"
                  tabIndex={-1}
                  onClick={(event) => {
                    event.stopPropagation();
                    removeValue(value);
                  }}
                  className="rounded-full p-0.5 text-orange-500 transition hover:bg-orange-100 hover:text-orange-700"
                  aria-label={`Remove ${value}`}
                >
                  <X className="h-3 w-3" />
                </span>
              </span>
            ))
          ) : (
            <span className="px-1 text-sm font-semibold text-slate-400">Search and select languages</span>
          )}
          <ChevronDown className={cn("ml-auto h-4 w-4 text-slate-400 transition-transform duration-200", open && "rotate-180")} />
        </span>
      </button>

      {open && !disabled ? (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="border-b border-slate-100 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search languages"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
              />
            </div>
          </div>
          <div className="dropdown-scroll-area no-scrollbar max-h-[min(320px,52vh)] overflow-y-auto p-2" role="listbox" aria-multiselectable="true">
            {filteredOptions.length ? (
              filteredOptions.map((option) => {
                const selected = selectedSet.has(option);
                return (
                  <button
                    key={option}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => toggleValue(option)}
                    className={cn(
                      "mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-all duration-150 last:mb-0",
                      selected
                        ? "bg-orange-50 text-orange-700 shadow-[inset_0_0_0_1px_rgba(251,146,60,0.25)]"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-950",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all duration-150",
                        selected ? "border-orange-500 bg-orange-500 text-white" : "border-slate-200 bg-white",
                      )}
                    >
                      {selected ? <Check className="h-3.5 w-3.5" /> : null}
                    </span>
                    {option}
                  </button>
                );
              })
            ) : (
              <p className="px-3 py-3 text-sm font-semibold text-slate-500">No matching languages.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

type PremiumCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  className?: string;
};

export function PremiumCheckbox({ checked, onChange, label, disabled = false, className }: PremiumCheckboxProps) {
  const isChecked = Boolean(checked);

  return (
    <label
      data-checked={isChecked ? "true" : "false"}
      className={cn(
        "group inline-flex min-h-10 cursor-pointer items-center gap-3 rounded-xl border px-4 text-sm font-bold transition-all duration-200",
        isChecked
          ? "border-orange-300 bg-orange-50 text-orange-700 shadow-[0_0_0_1px_rgba(251,146,60,0.22),0_12px_28px_rgba(251,146,60,0.22)]"
          : "border-orange-100 bg-white/75 text-slate-700 shadow-sm hover:border-orange-200 hover:bg-orange-50/70 hover:shadow-[0_8px_22px_rgba(251,146,60,0.16)]",
        "focus-within:ring-4 focus-within:ring-orange-500/20 active:scale-[0.99]",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      <input
        type="checkbox"
        checked={isChecked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all duration-200",
          isChecked
            ? "border-orange-600 bg-gradient-to-br from-orange-500 to-orange-700 text-white shadow-[0_0_0_4px_rgba(251,146,60,0.18),0_8px_18px_rgba(234,88,12,0.3)]"
            : "border-orange-300 bg-white text-transparent group-hover:border-orange-400 group-hover:shadow-[0_0_0_4px_rgba(251,146,60,0.1)]",
        )}
      >
        {isChecked ? <Check className="h-4 w-4 stroke-[3.5]" /> : null}
      </span>
      <span>{label}</span>
    </label>
  );
}
