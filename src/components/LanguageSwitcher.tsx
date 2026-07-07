import { ChevronDown, Globe2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { languageToLocale, type Language, useI18n } from "@/i18n/I18nProvider";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, languages, setLanguage, t } = useI18n(); // ADDED FOR i18n
  const currentLanguage = languages.find((item) => item.code === language)?.label ?? "English";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`nav-icon-button language-switcher-trigger ${compact ? "w-11 px-0" : "px-3"}`}
          aria-label={t("nav.languageWithCurrent", { language: currentLanguage })}
          title={t("nav.languageWithCurrent", { language: currentLanguage })}
        >
          <Globe2 className="h-4 w-4" />
          {!compact && <span>{currentLanguage}</span>}
          {!compact && <ChevronDown className="h-3.5 w-3.5 opacity-60" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" aria-label={t("nav.changeLanguage")} className="language-switcher-menu rounded-2xl border-orange-100/80 bg-[#fffaf2]/95 p-2 shadow-xl backdrop-blur-xl">
        {languages.map((item) => (
          <DropdownMenuItem
            key={item.code}
            onSelect={() => setLanguage(item.code as Language)}
            aria-current={item.code === language ? "true" : undefined}
            lang={languageToLocale(item.code)}
            className={`cursor-pointer rounded-xl px-3 py-2 text-sm font-semibold ${
              item.code === language ? "bg-orange-100 text-orange-700" : "text-stone-700"
            }`}
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
