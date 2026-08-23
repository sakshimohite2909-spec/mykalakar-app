import { ChevronDown, Globe2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { languageToLocale, type Language, useI18n } from "@/i18n/I18nProvider";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, languages, setLanguage, t } = useI18n();
  const currentLanguage = languages.find((item) => item.code === language)?.label ?? "English";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center justify-center gap-1.5 h-8.5 rounded-full border border-stone-200/90 bg-white/95 text-xs font-bold text-stone-700 hover:text-stone-950 hover:bg-stone-50 hover:border-stone-300 transition-all shadow-xs shrink-0 cursor-pointer ${
            compact ? "w-8.5 px-0" : "px-2.5"
          }`}
          aria-label={t("nav.languageWithCurrent", { language: currentLanguage })}
          title={t("nav.languageWithCurrent", { language: currentLanguage })}
        >
          <Globe2 className="h-3.5 w-3.5 text-stone-500 shrink-0" />
          {!compact && <span className="text-xs font-bold tracking-tight">{currentLanguage}</span>}
          {!compact && <ChevronDown className="h-3 w-3 text-stone-400 shrink-0" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        aria-label={t("nav.changeLanguage")}
        className="min-w-[110px] rounded-xl border border-stone-200/90 bg-white/98 p-1 shadow-lg backdrop-blur-md z-50 animate-in fade-in-50 zoom-in-95 duration-100"
      >
        {languages.map((item) => (
          <DropdownMenuItem
            key={item.code}
            onSelect={() => setLanguage(item.code as Language)}
            aria-current={item.code === language ? "true" : undefined}
            lang={languageToLocale(item.code)}
            className={`cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors ${
              item.code === language
                ? "bg-orange-50 text-orange-600 font-extrabold"
                : "text-stone-700 hover:bg-stone-100/80 hover:text-stone-950"
            }`}
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

