/**
 * savedArtistService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 2 – Saved Artists ecosystem
 *
 * All persistence for the "Save Artist" feature routes through this module.
 * The canonical schema stores saved artist UIDs as a top-level array field on
 * the authenticated user's document:
 *
 *   users/{uid} → { savedArtists: string[] }
 *
 * Writes use Firestore's atomic array helpers (arrayUnion / arrayRemove) so
 * concurrent multi-device saves never clobber each other.
 */

import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  updateDoc,
  where,
  documentId,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  FIREBASE_READ_TIMEOUT_MS,
  FIREBASE_WRITE_TIMEOUT_MS,
  withTimeout,
} from "@/lib/firebaseSafe";

// ─── Constants ──────────────────────────────────────────────────────────────

/** Firestore `in` queries are capped at 30 elements per call. */
const FIRESTORE_IN_LIMIT = 30;

const USERS_COLLECTION = "users";
const ARTISTS_COLLECTION = "artists";

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Splits an array into chunks of at most `size` elements.
 * Used to paginate `where(documentId(), 'in', …)` queries.
 */
function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// ─── Read Operations ─────────────────────────────────────────────────────────

/**
 * Returns the list of artist UIDs that a user has saved.
 * Reads from `users/{uid}.savedArtists`.
 *
 * @param uid - The authenticated user's UID.
 * @returns Array of artist UIDs (may be empty).
 */
export async function getSavedArtistIds(uid: string): Promise<string[]> {
  if (!uid) return [];

  const snap = await withTimeout(
    getDoc(doc(db, USERS_COLLECTION, uid)),
    FIREBASE_READ_TIMEOUT_MS,
    "Could not load saved artists. Please check your connection."
  );

  if (!snap.exists()) return [];

  const data = snap.data();
  const raw = data?.savedArtists;
  if (!Array.isArray(raw)) return [];

  // Filter to non-empty strings only.
  return raw.filter((id): id is string => typeof id === "string" && id.trim().length > 0);
}

/**
 * Checks whether a specific artist is in the user's saved list.
 * Reads from `users/{uid}.savedArtists`.
 *
 * @param uid      - The authenticated user's UID.
 * @param artistId - The artist's UID to check.
 */
export async function isArtistSaved(uid: string, artistId: string): Promise<boolean> {
  const ids = await getSavedArtistIds(uid);
  return ids.includes(artistId);
}

/**
 * Fetches full public artist profiles for every ID in `savedArtistIds`.
 *
 * Uses Firestore's `where(documentId(), 'in', …)` for a single-pass batch
 * fetch. Chunks automatically when the list exceeds the 30-item `in` limit.
 *
 * @param savedArtistIds - Array of artist UIDs to fetch.
 * @returns Array of raw artist Firestore documents (unsorted).
 */
export async function fetchSavedArtistProfiles(
  savedArtistIds: string[]
): Promise<Record<string, unknown>[]> {
  if (!savedArtistIds.length) return [];

  const validIds = savedArtistIds.filter((id) => typeof id === "string" && id.trim().length > 0);
  if (!validIds.length) return [];

  const artistsRef = collection(db, ARTISTS_COLLECTION);

  // Chunk the IDs to respect Firestore's 30-item `in` limit.
  const idChunks = chunk(validIds, FIRESTORE_IN_LIMIT);

  const chunkResults = await Promise.all(
    idChunks.map((ids) =>
      withTimeout(
        getDocs(query(artistsRef, where(documentId(), "in", ids))),
        FIREBASE_READ_TIMEOUT_MS,
        "Could not load saved artist profiles. Please try again."
      )
    )
  );

  const profiles: Record<string, unknown>[] = [];
  for (const snap of chunkResults) {
    snap.forEach((docSnap) => {
      if (docSnap.exists()) {
        profiles.push({ id: docSnap.id, uid: docSnap.id, ...docSnap.data() });
      }
    });
  }

  return profiles;
}

// ─── Write Operations ─────────────────────────────────────────────────────────

/**
 * Atomically adds an artist's UID to the user's `savedArtists` array.
 * Uses `arrayUnion` — safe against concurrent multi-device writes.
 *
 * If the user document does not yet have a `savedArtists` field, Firestore
 * will create it via the merge-safe `setDoc` fallback.
 *
 * @param uid      - The authenticated user's UID.
 * @param artistId - The artist UID to add.
 */
export async function saveArtist(uid: string, artistId: string): Promise<void> {
  if (!uid || !artistId) throw new Error("User UID and artist ID are required.");

  const userRef = doc(db, USERS_COLLECTION, uid);

  await withTimeout(
    updateDoc(userRef, {
      savedArtists: arrayUnion(artistId),
      savedArtistsUpdatedAt: serverTimestamp(),
    }),
    FIREBASE_WRITE_TIMEOUT_MS,
    "Could not save artist. Please try again."
  ).catch(async (error: unknown) => {
    // If the user document does not exist yet, create it with just the array.
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: unknown }).code)
        : "";

    if (code === "not-found" || code === "permission-denied") {
      // Re-throw for caller to handle — don't silently swallow auth issues.
      throw error;
    }

    // Document exists but updateDoc might fail on first-time field creation
    // in some emulator configurations. Fall back to setDoc with merge.
    await withTimeout(
      setDoc(
        userRef,
        { savedArtists: arrayUnion(artistId), savedArtistsUpdatedAt: serverTimestamp() },
        { merge: true }
      ),
      FIREBASE_WRITE_TIMEOUT_MS,
      "Could not save artist. Please try again."
    );
  });
}

/**
 * Atomically removes an artist's UID from the user's `savedArtists` array.
 * Uses `arrayRemove` — safe against concurrent multi-device writes.
 *
 * @param uid      - The authenticated user's UID.
 * @param artistId - The artist UID to remove.
 */
export async function unsaveArtist(uid: string, artistId: string): Promise<void> {
  if (!uid || !artistId) throw new Error("User UID and artist ID are required.");

  const userRef = doc(db, USERS_COLLECTION, uid);

  await withTimeout(
    updateDoc(userRef, {
      savedArtists: arrayRemove(artistId),
      savedArtistsUpdatedAt: serverTimestamp(),
    }),
    FIREBASE_WRITE_TIMEOUT_MS,
    "Could not unsave artist. Please try again."
  );
}
