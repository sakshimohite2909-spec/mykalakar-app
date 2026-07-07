import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import enMessages from "@/locales/en/common.json";
import mrMessages from "@/locales/mr/common.json";
import hiMessages from "@/locales/hi/common.json";

export type Language = "en" | "mr" | "hi";
export type Locale = "en-IN" | "mr-IN" | "hi-IN"; // ADDED FOR i18n

type Messages = Record<string, string>;

type TranslateOptions = Record<string, string | number>;

interface LanguageOption {
  code: Language;
  label: string;
}

interface I18nContextValue {
  language: Language;
  languages: LanguageOption[];
  setLanguage: (language: Language) => void;
  t: (key: string, options?: TranslateOptions) => string;
  formatNumber: (value: number) => string;
  formatCurrency: (value: number) => string;
  isLoading: boolean;
}

const STORAGE_KEY = "mykalakar-language";

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "en", label: "English" },
  { code: "mr", label: "मराठी" },
  { code: "hi", label: "हिंदी" },
];

const allMessages: Record<Language, Messages> = {
  en: enMessages as unknown as Messages,
  mr: mrMessages as unknown as Messages,
  hi: hiMessages as unknown as Messages,
};

export function languageToLocale(language: Language): Locale { // ADDED FOR i18n
  return language === "mr" ? "mr-IN" : language === "hi" ? "hi-IN" : "en-IN";
}

const I18nContext = createContext<I18nContextValue | null>(null);

function isLanguage(value: string | null | undefined): value is Language {
  return value === "en" || value === "mr" || value === "hi";
}

function readStoredLanguage(): Language | null { // ADDED FOR i18n
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") return null;

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return isLanguage(saved) ? saved : null;
  } catch {
    return null;
  }
}

function persistLanguage(language: Language) { // ADDED FOR i18n
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Browser storage can be blocked in private or embedded contexts.
  }
}

function detectLanguage(): Language {
  if (typeof window === "undefined") return "en";

  const saved = readStoredLanguage(); // ADDED FOR i18n
  if (saved) return saved;

  const browserLanguages = navigator.languages?.length ? navigator.languages : [navigator.language];
  const normalized = browserLanguages.map((lang) => lang.toLowerCase());

  if (normalized.some((lang) => lang.startsWith("mr"))) return "mr";
  if (normalized.some((lang) => lang.startsWith("hi"))) return "hi";

  return "en";
}

function interpolate(text: string, options?: TranslateOptions) {
  if (!options) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => String(options[key] ?? ""));
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => detectLanguage());
  const locale = languageToLocale(language); // ADDED FOR i18n

  useEffect(() => { // ADDED FOR i18n
    document.documentElement.lang = locale;
    document.documentElement.dir = "ltr";
    document.documentElement.dataset.language = language;
  }, [language, locale]);

  const setLanguage = useCallback((nextLanguage: Language) => {
    persistLanguage(nextLanguage); // ADDED FOR i18n
    setLanguageState(nextLanguage);
  }, []);

  const messages = allMessages[language];
  const fallbackMessages = allMessages.en;

  const t = useCallback(
    (key: string, options?: TranslateOptions) => {
      const value = messages[key] ?? fallbackMessages[key] ?? key;
      return interpolate(value, options);
    },
    [fallbackMessages, messages],
  );

  const formatNumber = useCallback(
    (value: number) => new Intl.NumberFormat(locale).format(value),
    [locale],
  );

  const formatCurrency = useCallback(
    (value: number) =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(value),
    [locale],
  );

  const value = useMemo(
    () => ({
      language,
      languages: LANGUAGE_OPTIONS,
      setLanguage,
      t,
      formatNumber,
      formatCurrency,
      isLoading: false,
    }),
    [formatCurrency, formatNumber, language, setLanguage, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
