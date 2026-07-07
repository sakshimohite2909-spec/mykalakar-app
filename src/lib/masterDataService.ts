/**
 * masterDataService.ts
 *
 * Centralized master data layer — categories, category_groups, states, districts.
 *
 * Structure:
 *   master_data/          (collection)
 *     v1/                 (document — fixed root)
 *       category_groups/  (subcollection)
 *       categories/       (subcollection)
 *       states/           (subcollection)
 *       districts/        (subcollection)
 *
 * Existing `categories` and `states` top-level collections are kept intact.
 * master_data acts as the authoritative source; existing collections remain
 * as cached / legacy layers.
 */

import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import {
  CATEGORY_GROUPS,
  CATEGORY_GROUP_ICONS,
  CATEGORY_GROUP_OPTIONS,
  CategoryGroupName,
  normalizeCategoryKey,
} from "@/constants/artistSystem";
import { getIndiaStates, getIndiaDistrictsByStateCode } from "@/lib/indiaLocations";
import { FIREBASE_WRITE_TIMEOUT_MS, withTimeout } from "@/lib/firebaseSafe";

// ─── Collection path helpers ─────────────────────────────────────────────────

export const MD_ROOT = "master_data";
export const MD_DOC  = "v1";

export const mdCol = (sub: string) =>
  collection(db, MD_ROOT, MD_DOC, sub);

export const mdRef = (sub: string, id: string) =>
  doc(db, MD_ROOT, MD_DOC, sub, id);

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MdCategoryGroup {
  id: string;
  name: string;
  icon: string;
  categories: string[];   // list of individual category names
  isActive: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface MdCategory {
  id: string;
  name: string;
  group: string;          // parent group name
  isActive: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface MdState {
  id: string;
  name: string;
  code: string;           // ISO code e.g. "MH"
  isActive: boolean;
  createdAt?: unknown;
}

export interface MdDistrict {
  id: string;
  name: string;
  state: string;          // state name
  stateCode: string;
  isActive: boolean;
  createdAt?: unknown;
}

// ─── Read helpers ────────────────────────────────────────────────────────────

export async function getMasterCategoryGroups(): Promise<MdCategoryGroup[]> {
  const snap = await getDocs(query(mdCol("category_groups"), where("isActive", "==", true)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MdCategoryGroup));
}

export async function getMasterCategories(): Promise<MdCategory[]> {
  const snap = await getDocs(query(mdCol("categories"), where("isActive", "==", true)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MdCategory));
}

export async function getMasterStates(): Promise<MdState[]> {
  const snap = await getDocs(query(mdCol("states"), where("isActive", "==", true), orderBy("name")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MdState));
}

export async function getMasterDistrictsByState(stateName: string): Promise<MdDistrict[]> {
  const snap = await getDocs(
    query(mdCol("districts"), where("state", "==", stateName), where("isActive", "==", true))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MdDistrict));
}

// ─── Admin CRUD ──────────────────────────────────────────────────────────────

// Category Groups
export async function addMasterCategoryGroup(data: Omit<MdCategoryGroup, "id">) {
  return addDoc(mdCol("category_groups"), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}
export async function updateMasterCategoryGroup(id: string, data: Partial<MdCategoryGroup>) {
  return updateDoc(mdRef("category_groups", id), { ...data, updatedAt: serverTimestamp() });
}
export async function deleteMasterCategoryGroup(id: string) {
  return deleteDoc(mdRef("category_groups", id));
}

// Categories
export async function addMasterCategory(data: Omit<MdCategory, "id">) {
  return addDoc(mdCol("categories"), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}
export async function updateMasterCategory(id: string, data: Partial<MdCategory>) {
  return updateDoc(mdRef("categories", id), { ...data, updatedAt: serverTimestamp() });
}
export async function deleteMasterCategory(id: string) {
  return deleteDoc(mdRef("categories", id));
}

// States
export async function addMasterState(data: Omit<MdState, "id">) {
  return addDoc(mdCol("states"), { ...data, createdAt: serverTimestamp() });
}
export async function updateMasterState(id: string, data: Partial<MdState>) {
  return updateDoc(mdRef("states", id), data);
}
export async function deleteMasterState(id: string) {
  return deleteDoc(mdRef("states", id));
}

// ─── Seed / Initialize ───────────────────────────────────────────────────────

/**
 * Seeds the master_data collection and the legacy `categories` + `states`
 * top-level collections.  Safe to run multiple times (uses setDoc with merge).
 */
export async function seedAllMasterData(
  onLog: (msg: string) => void = console.log
): Promise<void> {

  // ── 1. Ensure the root document exists ────────────────────────────────────
  await setDoc(doc(db, MD_ROOT, MD_DOC), { initialised: true, updatedAt: serverTimestamp() }, { merge: true });
  onLog("✅ master_data/v1 root document ready");

  // ── 2. Seed category_groups ───────────────────────────────────────────────
  {
    const batch = writeBatch(db);
    let count = 0;
    for (const [groupName, groupData] of Object.entries(CATEGORY_GROUPS)) {
      const id = normalizeCategoryKey(groupName).replace(/\s/g, "-");
      batch.set(mdRef("category_groups", id), {
        name: groupName,
        icon: CATEGORY_GROUP_ICONS[groupName as CategoryGroupName] ?? "✨",
        categories: [...groupData.subcategories],
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      count++;
    }
    await withTimeout(batch.commit(), FIREBASE_WRITE_TIMEOUT_MS, "Seeding category_groups timed out");
    onLog(`✅ Seeded ${count} category groups into master_data/v1/category_groups`);
  }

  // ── 3. Seed individual categories ─────────────────────────────────────────
  {
    const batch = writeBatch(db);
    let count = 0;
    for (const [groupName, groupData] of Object.entries(CATEGORY_GROUPS)) {
      for (const typeName of groupData.subcategories) {
        const id = normalizeCategoryKey(typeName).replace(/\s/g, "-");
        batch.set(mdRef("categories", id), {
          name: typeName,
          group: groupName,
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
        count++;
      }
    }
    await withTimeout(batch.commit(), FIREBASE_WRITE_TIMEOUT_MS, "Seeding categories timed out");
    onLog(`✅ Seeded ${count} categories into master_data/v1/categories`);
  }

  // ── 4. Seed legacy `categories` collection (UI uses this) ─────────────────
  {
    const batch = writeBatch(db);
    CATEGORY_GROUP_OPTIONS.forEach((cat) => {
      batch.set(doc(db, "categories", cat.id), {
        ...cat,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    });
    await withTimeout(batch.commit(), FIREBASE_WRITE_TIMEOUT_MS, "Seeding legacy categories timed out");
    onLog(`✅ Seeded ${CATEGORY_GROUP_OPTIONS.length} entries into legacy categories collection`);
  }

  // ── 5. Seed states into master_data ───────────────────────────────────────
  {
    const indiaStates = getIndiaStates();
    // Firestore batch max = 500 writes; states are < 40 so one batch is fine
    const batch = writeBatch(db);
    indiaStates.forEach((state) => {
      batch.set(mdRef("states", state.isoCode), {
        name: state.name,
        code: state.isoCode,
        isActive: true,
        createdAt: serverTimestamp(),
      }, { merge: true });
    });
    await withTimeout(batch.commit(), FIREBASE_WRITE_TIMEOUT_MS, "Seeding states timed out");
    onLog(`✅ Seeded ${indiaStates.length} states into master_data/v1/states`);
  }

  // ── 6. Seed legacy `states` collection ────────────────────────────────────
  {
    const indiaStates = getIndiaStates();
    const batch = writeBatch(db);
    indiaStates.forEach((state) => {
      const districts = getIndiaDistrictsByStateCode(state.isoCode);
      batch.set(doc(db, "states", state.isoCode), {
        name: state.name,
        isoCode: state.isoCode,
        districts,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    });
    await withTimeout(batch.commit(), FIREBASE_WRITE_TIMEOUT_MS, "Seeding legacy states timed out");
    onLog(`✅ Seeded ${indiaStates.length} states into legacy states collection`);
  }

  onLog("🎉 All master data seeded successfully!");
}
