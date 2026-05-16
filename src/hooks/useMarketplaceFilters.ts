import { useCallback, useMemo, useState } from "react";
import {
  getActiveCategories,
  getActiveEventTypes,
  getActiveSubCategories,
  getActiveTags,
  getInjectedSubcategories,
  hasActiveSmartFilters,
  resetSmartFilters,
  syncSmartFilters,
  type SmartFilters,
} from "@/services/filterEngine";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

type FilterPatch = Partial<SmartFilters>;

export function useMarketplaceFilters(initialFilters: FilterPatch = {}, debounceMs = 160) {
  const [filters, setFiltersState] = useState<SmartFilters>(() => syncSmartFilters(initialFilters));
  const debouncedFilters = useDebouncedValue(filters, debounceMs);

  const applyFilters = useCallback((next: FilterPatch) => {
    setFiltersState((current) => syncSmartFilters(next, current));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(resetSmartFilters());
  }, []);

  const filterState = useMemo(
    () => ({
      activeCategories: getActiveCategories(filters),
      activeSubCategories: getActiveSubCategories(filters),
      activeTags: getActiveTags(filters),
      activeEventTypes: getActiveEventTypes(filters),
      injectedSubcategories: getInjectedSubcategories(filters),
      hasActiveFilters: hasActiveSmartFilters(filters),
    }),
    [filters],
  );

  return {
    filters,
    debouncedFilters,
    applyFilters,
    resetFilters,
    setFilters: setFiltersState,
    ...filterState,
  };
}
