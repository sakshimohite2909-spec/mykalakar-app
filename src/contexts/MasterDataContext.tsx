/**
 * MasterDataContext
 *
 * Provides real-time master data (categories, category groups, states, districts)
 * fetched from Firestore master_data subcollections, with automatic fallback to
 * hardcoded constants when the database is empty or unreachable.
 *
 * Priority:  Firestore master_data  →  Firestore categories/states  →  Local constants
 *
 * Usage:
 *   const { categoryGroups, states, getDistrictsByState } = useMasterData();
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  ReactNode,
} from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import {
  CATEGORY_GROUP_OPTIONS,
  CATEGORY_GROUP_ICONS,
  CATEGORY_GROUPS,
  CategoryGroupName,
  normalizeCategoryKey,
} from "@/constants/artistSystem";
import {
  getIndiaStates,
  getIndiaDistrictsByStateName,
} from "@/lib/indiaLocations";
import type { MdCategoryGroup, MdCategory, MdState } from "@/lib/masterDataService";
import { MD_ROOT, MD_DOC } from "@/lib/masterDataService";

// ─── Fallback data ────────────────────────────────────────────────────────────

const FALLBACK_GROUPS: MdCategoryGroup[] = CATEGORY_GROUP_OPTIONS.map((g) => ({
  id: g.id,
  name: g.name,
  icon: g.icon || CATEGORY_GROUP_ICONS[g.name as CategoryGroupName] || "✨",
  categories: g.subcategories as string[],
  isActive: true,
}));

const FALLBACK_CATEGORIES: MdCategory[] = FALLBACK_GROUPS.flatMap((g) =>
  g.categories.map((cat) => ({
    id: normalizeCategoryKey(cat).replace(/\s/g, "-"),
    name: cat,
    group: g.name,
    isActive: true,
  }))
);

const FALLBACK_STATES: MdState[] = getIndiaStates().map((s) => ({
  id: s.isoCode,
  name: s.name,
  code: s.isoCode,
  isActive: true,
}));

// ─── Context type ─────────────────────────────────────────────────────────────

interface MasterDataContextType {
  /** Individual artist-type categories (e.g. Singer, DJ, Dancer) */
  categories: MdCategory[];
  /** Category groups shown on EventRequirements (e.g. Music Artists, Dance Artists) */
  categoryGroups: MdCategoryGroup[];
  /** Indian states */
  states: MdState[];
  /**
   * Resolve districts for a state name.
   * Returns Firestore data when available, otherwise local static fallback.
   */
  getDistrictsByState: (stateName: string) => Promise<string[]>;
  /** True while the first Firestore snapshot is loading */
  loading: boolean;
  /** True when at least one data source was resolved from Firestore */
  isFromFirestore: boolean;
}

const MasterDataContext = createContext<MasterDataContextType | null>(null);

export function useMasterData(): MasterDataContextType {
  const ctx = useContext(MasterDataContext);
  if (!ctx) throw new Error("useMasterData must be used within <MasterDataProvider>");
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function MasterDataProvider({ children }: { children: ReactNode }) {
  const [categoryGroups, setCategoryGroups] = useState<MdCategoryGroup[]>(FALLBACK_GROUPS);
  const [categories, setCategories] = useState<MdCategory[]>(FALLBACK_CATEGORIES);
  const [states, setStates] = useState<MdState[]>(FALLBACK_STATES);
  // Stores districts from Firestore `states` collection keyed by state name
  const [firestoreDistricts, setFirestoreDistricts] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [isFromFirestore, setIsFromFirestore] = useState(false);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // We wait for 2 primary listeners (groups + categories) before clearing loading
    let resolved = 0;
    const REQUIRED = 2;
    const onReady = () => {
      resolved++;
      if (resolved >= REQUIRED && mountedRef.current) setLoading(false);
    };

    // ── 1. master_data/v1/category_groups ─────────────────────────────────
    const groupsUnsub = onSnapshot(
      query(
        collection(db, MD_ROOT, MD_DOC, "category_groups"),
        where("isActive", "==", true)
      ),
      (snap) => {
        if (!mountedRef.current) return;
        if (!snap.empty) {
          const data = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as MdCategoryGroup[];
          setCategoryGroups(data);
          setIsFromFirestore(true);
        }
        onReady();
      },
      (err) => {
        console.warn("[MasterData] category_groups:", err.message);
        onReady();
      }
    );

    // ── 2. master_data/v1/categories ──────────────────────────────────────
    const catsUnsub = onSnapshot(
      query(
        collection(db, MD_ROOT, MD_DOC, "categories"),
        where("isActive", "==", true)
      ),
      (snap) => {
        if (!mountedRef.current) return;
        if (!snap.empty) {
          const data = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as MdCategory[];
          setCategories(data);
          setIsFromFirestore(true);
        }
        onReady();
      },
      (err) => {
        console.warn("[MasterData] categories:", err.message);
        onReady();
      }
    );

    // ── 3. Fallback: legacy `categories` collection (if master_data empty) ─
    //      Only used for category group display on EventRequirements
    const legacyCatsUnsub = onSnapshot(
      query(collection(db, "categories"), orderBy("sortOrder")),
      (snap) => {
        if (!mountedRef.current) return;
        if (!snap.empty && categoryGroups === FALLBACK_GROUPS) {
          // Map legacy category docs → MdCategoryGroup shape
          const groups = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              name: data.name || "",
              icon: data.icon || "✨",
              categories: Array.isArray(data.subcategories) ? data.subcategories : [],
              isActive: data.isActive !== false,
            } as MdCategoryGroup;
          });
          setCategoryGroups((prev) =>
            prev === FALLBACK_GROUPS ? groups : prev
          );
          setIsFromFirestore(true);
        }
      },
      (err) => console.warn("[MasterData] legacy categories:", err.message)
    );

    // ── 4. States: legacy `states` collection (read districts from here) ───
    const statesUnsub = onSnapshot(
      query(collection(db, "states"), orderBy("name")),
      (snap) => {
        if (!mountedRef.current) return;
        if (!snap.empty) {
          const mdStates: MdState[] = snap.docs.map((d) => ({
            id: d.id,
            name: d.data().name || "",
            code: d.data().isoCode || d.id,
            isActive: true,
          }));
          setStates(mdStates);
          // Cache districts from Firestore
          const distMap: Record<string, string[]> = {};
          snap.docs.forEach((d) => {
            const data = d.data();
            if (data.name && Array.isArray(data.districts) && data.districts.length > 0) {
              distMap[data.name] = data.districts;
            }
          });
          setFirestoreDistricts(distMap);
        }
      },
      (err) => console.warn("[MasterData] states:", err.message)
    );

    return () => {
      mountedRef.current = false;
      groupsUnsub();
      catsUnsub();
      legacyCatsUnsub();
      statesUnsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Resolve districts — Firestore first, then local static fallback */
  const getDistrictsByState = async (stateName: string): Promise<string[]> => {
    if (firestoreDistricts[stateName]?.length) {
      return firestoreDistricts[stateName];
    }
    return getIndiaDistrictsByStateName(stateName);
  };

  const value = useMemo<MasterDataContextType>(
    () => ({
      categories,
      categoryGroups,
      states,
      getDistrictsByState,
      loading,
      isFromFirestore,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [categories, categoryGroups, states, firestoreDistricts, loading, isFromFirestore]
  );

  return (
    <MasterDataContext.Provider value={value}>
      {children}
    </MasterDataContext.Provider>
  );
}
