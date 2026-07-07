/**
 * SYSTEM 3 — DATA NORMALIZATION ENGINE
 *
 * Single source of truth for all text/data normalization at render time.
 * Prevents typos, category mismatches, and undefined data from reaching the UI.
 *
 * Rules:
 *  - All text values are trimmed and whitespace-normalized.
 *  - Known typos are silently corrected via the TYPO_MAP.
 *  - Category values are resolved through a canonical alias map.
 *  - Subcategory values fall back through a priority chain.
 *  - Any missing required field triggers a console.warn (never a crash).
 */

import { getCategoryGroupForArtistType } from "../constants/artistSystem";

// ─── TYPO CORRECTION MAP ────────────────────────────────────────────────────
// Add any known data-entry errors here. These are corrected globally at render.
const TYPO_MAP: Record<string, string> = {
  // Spelling fixes
  "marraige": "Marriage",
  "marrige": "Marriage",
  "mariage": "Marriage",
  // Category casing fixes
  "dj's": "DJs",
  "dj s": "DJs",
  "d.j.": "DJs",
  // Subcategory aliases
  "bhajan mandal": "Bhajani Mandal",
  "tabla player": "Tabla Vadak",
  "kirtan group": "Kirtankar",
  "dhol group": "Dhol Pathak",
  "lezim group": "Lezim Pathak",
  // Event type fixes
  "corporate event": "Corporate",
  "birthday party": "Birthday",
  "festival event": "Festival",
  "spiritual event": "Spiritual",
};

// ─── CATEGORY CANONICAL NAMES ────────────────────────────────────────────────
const CATEGORY_CANONICAL: Record<string, string> = {
  "performers": "Performers",
  "performer": "Performers",
  "event services": "Event Services",
  "event service": "Event Services",
  "services": "Event Services",
  "folk traditional arts": "Folk & Traditional Arts",
  "folk & traditional arts": "Folk & Traditional Arts",
  "folk and traditional arts": "Folk & Traditional Arts",
  "folk traditional": "Folk & Traditional Arts",
  "spiritual varkari sampraday": "Spiritual & Varkari Sampraday",
  "spiritual & varkari sampraday": "Spiritual & Varkari Sampraday",
  "spiritual and varkari sampraday": "Spiritual & Varkari Sampraday",
  "varkari": "Spiritual & Varkari Sampraday",
  "spiritual": "Spiritual & Varkari Sampraday",
};

// ─── PRIMITIVE NORMALIZER ───────────────────────────────────────────────────
function toSafeString(value: unknown): string {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function toLower(value: unknown): string {
  return toSafeString(value).toLowerCase();
}

// ─── TYPO CORRECTOR ──────────────────────────────────────────────────────────
/**
 * Corrects known misspellings/data-entry errors in a string.
 * Case-insensitive lookup; preserves the correct casing from TYPO_MAP.
 */
export function correctTypo(value: unknown): string {
  const raw = toSafeString(value);
  const key = toLower(raw);
  return TYPO_MAP[key] ?? raw;
}

// ─── CATEGORY NORMALIZER ─────────────────────────────────────────────────────
/**
 * Resolves a category string to its canonical platform name.
 * Falls back to the corrected typo, then the raw value.
 */
export function normalizeCategory(value: unknown): string {
  const corrected = correctTypo(value);
  const key = toLower(corrected);
  return CATEGORY_CANONICAL[key] ?? corrected;
}

// ─── SUBCATEGORY NORMALIZER ──────────────────────────────────────────────────
/**
 * Resolves the best available subcategory from a priority fallback chain.
 * This is the SINGLE SOURCE OF TRUTH for subcategory across the entire UI.
 */
export function resolveSubCategory(data: Record<string, unknown>): string {
  const firstCategory = Array.isArray(data.categories) && data.categories.length > 0 ? data.categories[0] : "";
  const raw =
    data.artType ||
    data.subCategory ||
    data.subcategory ||
    data.primaryArtForm ||
    firstCategory ||
    data.performanceType ||
    data.type ||
    data.category ||
    "";
  return correctTypo(toSafeString(raw));
}

// ─── CATEGORY RESOLVER ───────────────────────────────────────────────────────
/**
 * Resolves the best available primary category from a priority fallback chain.
 * This is the SINGLE SOURCE OF TRUTH for category across the entire UI.
 */
export function resolveCategory(data: Record<string, unknown>): string {
  let raw =
    data.primaryCategory ||
    data.mainCategory ||
    data.categoryGroup ||
    data.category ||
    "";

  if (!raw) {
    const sub = resolveSubCategory(data);
    if (sub) {
      const group = getCategoryGroupForArtistType(sub);
      if (group) {
        raw = group;
      }
    }
  }

  return normalizeCategory(raw);
}

// ─── FULL RECORD NORMALIZER ──────────────────────────────────────────────────
/**
 * Normalizes an entire data record (artist or event) at render time.
 * Applies typo correction, category normalization, and field coercion.
 * Safe to call on any record — undefined/null fields are converted to "".
 */
export function normalizeRecord<T extends Record<string, unknown>>(data: T): T & {
  _category: string;
  _subCategory: string;
  _title: string;
  _location: string;
} {
  if (!data || typeof data !== "object") {
    console.warn("[dataNormalizer] normalizeRecord received non-object:", data);
    return { ...({} as T), _category: "", _subCategory: "", _title: "", _location: "" };
  }

  const _category = resolveCategory(data);
  const _subCategory = resolveSubCategory(data);
  const _title = correctTypo(
    toSafeString(data.title || data.name || data.artistName || data.professionalName || "")
  );
  const _location = toSafeString(
    (data.location as string) ||
    [(data.district as string), (data.city as string), (data.state as string)].filter(Boolean).join(", ") ||
    "Maharashtra"
  );

  // Warn on structurally missing fields (never throw)
  if (!_category) {
    console.warn("[dataNormalizer] Missing category for record:", data.id || data.uid || "(unknown)");
  }
  if (!_title) {
    console.warn("[dataNormalizer] Missing title for record:", data.id || data.uid || "(unknown)");
  }

  return {
    ...data,
    _category,
    _subCategory,
    _title,
    _location,
  };
}

// ─── BATCH NORMALIZER ────────────────────────────────────────────────────────
/**
 * Maps an array of records through normalizeRecord.
 * Filters out any null/undefined entries before normalization.
 */
export function normalizeRecords<T extends Record<string, unknown>>(
  items: (T | null | undefined)[]
): ReturnType<typeof normalizeRecord<T>>[] {
  return items
    .filter((item): item is T => item !== null && item !== undefined)
    .map((item) => normalizeRecord(item));
}

// ─── RENDER GUARD ────────────────────────────────────────────────────────────
/**
 * System 9 — Render Guard.
 * Returns true if a record is safe to render.
 * Logs a warning and returns false for empty/corrupt records.
 */
export function isRenderSafe(data: unknown, context = "unknown"): data is Record<string, unknown> {
  if (!data || typeof data !== "object") {
    console.warn(`[renderGuard] Unsafe data in "${context}" — received:`, data);
    return false;
  }
  return true;
}

export function safeString(value: unknown, fallback = ""): string {
  const s = toSafeString(value);
  return s || fallback;
}

export function safeNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return isNaN(n) ? fallback : n;
}

export function safeBoolean(value: unknown): boolean {
  return Boolean(value);
}

export function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

// ─── RATING FLOOR NORMALIZER ─────────────────────────────────────────────────
/**
 * Issue #47: Artists with rating=0 should display "New" not "0.0".
 */
export function formatRating(value: unknown): string {
  const n = safeNumber(value, 0);
  if (n <= 0) return "New";
  return n.toFixed(1);
}

// ─── AVATAR INITIALS GENERATOR ───────────────────────────────────────────────
/**
 * Issue #54: "A.J. Singh" → "AS" not "A."
 * Strips dots/punctuation, takes first letter of each word.
 */
export function getInitials(name: unknown, max = 2): string {
  const cleaned = toSafeString(name).replace(/\./g, " ").replace(/\s+/g, " ").trim();
  const parts = cleaned.split(" ").filter(Boolean);
  return parts
    .slice(0, max)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "U";
}

// ─── PHONE NUMBER FORMATTER ───────────────────────────────────────────────────
/**
 * Issue #46: Normalise phone numbers to 10-digit strings (strip +91, 0 prefix).
 */
export function normalizePhone(value: unknown): string {
  const raw = toSafeString(value).replace(/\D/g, "");
  if (raw.startsWith("91") && raw.length === 12) return raw.slice(2);
  if (raw.startsWith("0") && raw.length === 11) return raw.slice(1);
  return raw.slice(-10);
}

// ─── DATE FORMATTER ───────────────────────────────────────────────────────────
/**
 * Issue #32: Normalise all dates to "14 May 2026" format.
 */
export function formatDate(value: unknown): string {
  if (!value) return "Flexible";
  if (typeof value === "string" && value.trim()) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    }
    return value;
  }
  const ts = value as { toDate?: () => Date };
  if (typeof ts?.toDate === "function") {
    return ts.toDate().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }
  return "Flexible";
}

// ─── BIO SANITIZER ────────────────────────────────────────────────────────────
/**
 * Issue #55: Strip raw HTML tags from bio text before rendering.
 */
export function sanitizeBio(value: unknown): string {
  return toSafeString(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .trim();
}
