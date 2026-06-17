import { addDoc, collection, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, startAfter, where, type QueryDocumentSnapshot } from "firebase/firestore";
import { CATEGORY_GROUP_OPTIONS, normalizeArtistRecord } from "@/constants/artistSystem";
import { db } from "@/lib/firebase";
import { FIREBASE_READ_TIMEOUT_MS, FIREBASE_WRITE_TIMEOUT_MS, withTimeout } from "@/lib/firebaseSafe";
import { normalizeRecord, isRenderSafe } from "@/services/dataNormalizer";

type CacheEntry<T> = {
  value?: T;
  promise?: Promise<T>;
  expiresAt: number;
};

export type DataState<T> = {
  data: T;
  loading: boolean;
  error: string | null;
};

const FIVE_MINUTES = 5 * 60 * 1000;
const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 50;
const EVENT_BRIEF_COLLECTION = "eventBriefs";
const cache = new Map<string, CacheEntry<unknown>>();

function now() {
  return Date.now();
}

function isFresh(entry?: CacheEntry<unknown>) {
  return Boolean(entry && entry.value !== undefined && entry.expiresAt > now());
}

async function cached<T>(key: string, fetcher: () => Promise<T>, ttl = FIVE_MINUTES): Promise<T> {
  const existing = cache.get(key) as CacheEntry<T> | undefined;
  if (isFresh(existing as CacheEntry<unknown>)) return existing!.value as T;
  if (existing?.promise) return existing.promise;

  const promise = fetcher()
    .then((value) => {
      cache.set(key, { value, expiresAt: now() + ttl });
      return value;
    })
    .catch((error) => {
      cache.delete(key);
      throw error;
    });

  cache.set(key, { promise, expiresAt: now() + ttl });
  return promise;
}

function docData<T>(snap: { id: string; data: () => Record<string, unknown> }) {
  return { id: snap.id, ...snap.data() } as T;
}

function isPublicEvent(event: Record<string, any>) {
  const status = String(event.status || "").toLowerCase();
  return status === "active";
}

function readyArtistMedia(artist: Record<string, any>) {
  if (!isRenderSafe(artist, "readyArtistMedia")) return {} as Record<string, any>;
  const profilePhoto = artist.media?.profilePhoto || artist.profilePhoto || artist.profilePicUrl || "";
  const coverPhoto = artist.media?.coverPhoto || artist.coverPhoto || artist.coverImages?.[0] || "";
  const galleryPhotos: string[] = artist.media?.galleryPhotos || artist.galleryPhotos || [];
  const base = normalizeArtistRecord({ ...artist, profilePhoto, coverPhoto, galleryPhotos });
  return { ...base, ...normalizeRecord(base) };
}

function readyEventMedia(event: Record<string, any>) {
  if (!isRenderSafe(event, "readyEventMedia")) return {} as Record<string, any>;
  const eventDate = normalizeEventDate(event.eventDate || event.date);
  const base = {
    ...event,
    title: event.title || event.eventName || event.name || "Event Brief",
    name: event.name || event.eventName || event.title || "Event Brief",
    budget: Number(event.budget ?? event.totalBudget ?? 0),
    totalBudget: Number(event.totalBudget ?? event.budget ?? 0),
    eventDate,
    date: event.date || eventDate,
    performanceType: event.performanceType || event.type || "",
    type: event.type || event.performanceType || "",
    requirements: event.requirements || event.professionalRequirements || "",
    professionalRequirements: event.professionalRequirements || event.requirements || "",
    postedBy: event.postedBy || event.createdBy || "",
    createdBy: event.createdBy || event.postedBy || "",
    image: event.image || event.imageUrl || event.coverImage || "",
  };
  return { ...base, ...normalizeRecord(base) };
}

function normalizeEventDate(value: any) {
  if (!value) return "";
  if (typeof value === "string") return value.includes("T") ? value.slice(0, 10) : value;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object" && typeof value.toDate === "function") {
    return value.toDate().toISOString().slice(0, 10);
  }
  if (typeof value === "object" && typeof value.seconds === "number") {
    return new Date(value.seconds * 1000).toISOString().slice(0, 10);
  }
  return "";
}

function clampPageSize(pageSize?: number) {
  return Math.min(Math.max(pageSize || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
}

export function clearDataCache() {
  cache.clear();
}

export async function getCategoryGroups() {
  return CATEGORY_GROUP_OPTIONS;
}

export async function getActiveArtists(maxCount?: number) {
  const pageSize = clampPageSize(maxCount);
  // Cache busting: Append timestamp to force hitting Firebase instead of returning stale empty array
  return cached(`artists:active:verified:${pageSize}:${Date.now()}`, async () => {
    try {
      const artistsQuery = query(
        collection(db, "artists"),
        where("status", "==", "active"),
        orderBy("createdAt", "desc"),
        limit(pageSize)
      );
      const snap = await withTimeout(getDocs(artistsQuery), FIREBASE_READ_TIMEOUT_MS, "Artists are taking too long to load.");
      return snap.docs.map((artist) => readyArtistMedia(docData<Record<string, any>>(artist)));
    } catch (error: any) {
      console.error("Data Fetch Failure (getActiveArtists). Error Code:", error?.code, error);
      if (error?.code === 'failed-precondition' && String(error?.message).includes('index')) {
        console.error("CRITICAL: Missing Firestore Index. Click the link below to build it:");
        console.error(error.message); // This contains the clickable Firebase console link
      }
      return [];
    } finally {
      // The calling components (e.g., FeaturedArtists, PopularArtists, SearchPage) MUST
      // chain a .finally() or similar to ensure their isLoading state is set to false.
    }
  });
}

export function subscribeActiveArtists(maxCount: number | undefined, onData: (artists: Record<string, any>[]) => void, onError?: (error: unknown) => void) {
  const pageSize = clampPageSize(maxCount);
  const artistsQuery = query(
    collection(db, "artists"),
    where("status", "==", "active"),
    orderBy("createdAt", "desc"),
    limit(pageSize)
  );
  return onSnapshot(
    artistsQuery,
    (snap) => onData(snap.docs.map((artist) => readyArtistMedia(docData<Record<string, any>>(artist)))),
    onError
  );
}

export async function getActiveArtistsPage(pageSize?: number, cursor?: QueryDocumentSnapshot) {
  const boundedPageSize = clampPageSize(pageSize);
  try {
    const constraints = [
      where("status", "==", "active"),
      orderBy("createdAt", "desc"),
      ...(cursor ? [startAfter(cursor)] : []),
      limit(boundedPageSize),
    ];
    const snap = await withTimeout(
      getDocs(query(collection(db, "artists"), ...constraints)),
      FIREBASE_READ_TIMEOUT_MS,
      "Artists are taking too long to load."
    );

    return {
      items: snap.docs.map((artist) => readyArtistMedia(docData<Record<string, any>>(artist))),
      nextCursor: snap.docs.at(-1) ?? null,
      hasMore: snap.docs.length === boundedPageSize,
    };
  } catch (error: any) {
    console.error("Data Fetch Failure (getActiveArtistsPage). Error Code:", error?.code, error);
    if (error?.code === 'failed-precondition' && String(error?.message).includes('index')) {
      console.error("CRITICAL: Missing Firestore Index. Click the link below to build it:");
      console.error(error.message); // This contains the clickable Firebase console link
    }
    return { items: [], nextCursor: null, hasMore: false };
  } finally {
    // Calling components must handle their own isLoading = false
  }
}

export async function getApprovedEvents(maxCount?: number) {
  const pageSize = clampPageSize(maxCount);
  try {
    const eventsQuery = query(
      collection(db, EVENT_BRIEF_COLLECTION),
      where("status", "==", "active"),
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );
    const snap = await getDocs(eventsQuery);
    
    const events = snap.docs.map((event) => docData<Record<string, any>>(event));
    const hydrated = events.map(readyEventMedia);
    return typeof maxCount === "number" ? hydrated.slice(0, maxCount) : hydrated;
  } catch (error: any) {
    console.error("Events Fetch Critical Failure. Error Code:", error?.code, error);
    return [];
  } finally {
    // Calling components must handle their own isLoading = false
  }
}

export function subscribeApprovedEvents(maxCount: number | undefined, onData: (events: Record<string, any>[]) => void, onError?: (error: unknown) => void) {
  const pageSize = clampPageSize(maxCount);
  const eventsQuery = query(
    collection(db, EVENT_BRIEF_COLLECTION),
    where("status", "==", "active"),
    orderBy("createdAt", "desc"),
    limit(pageSize)
  );
  return onSnapshot(
    eventsQuery,
    (snap) => {
      const events = snap.docs.map((event) => docData<Record<string, any>>(event)).filter(isPublicEvent);
      const hydrated = events.map(readyEventMedia);
      onData(typeof maxCount === "number" ? hydrated.slice(0, maxCount) : hydrated);
    },
    onError
  );
}

export async function getArtistById(id: string) {
  return cached(`artist:${id}`, async () => {
    const snap = await withTimeout(getDoc(doc(db, "artists", id)), FIREBASE_READ_TIMEOUT_MS, "Artist profile is taking too long to load.");
    return snap.exists() ? readyArtistMedia({ id: snap.id, ...snap.data() } as Record<string, any>) : null;
  });
}

export function subscribeArtistById(id: string, onData: (artist: Record<string, any> | null) => void, onError?: (error: unknown) => void) {
  return onSnapshot(
    doc(db, "artists", id),
    (snap) => onData(snap.exists() ? readyArtistMedia({ id: snap.id, ...snap.data() } as Record<string, any>) : null),
    onError
  );
}

export async function getEventById(id: string) {
  return cached(`event:${id}`, async () => {
    const snap = await withTimeout(getDoc(doc(db, EVENT_BRIEF_COLLECTION, id)), FIREBASE_READ_TIMEOUT_MS, "Event details are taking too long to load.");
    return snap.exists() ? readyEventMedia({ id: snap.id, ...snap.data() } as Record<string, any>) : null;
  });
}

export function subscribeEventById(id: string, onData: (event: Record<string, any> | null) => void, onError?: (error: unknown) => void) {
  return onSnapshot(
    doc(db, EVENT_BRIEF_COLLECTION, id),
    (snap) => onData(snap.exists() ? readyEventMedia({ id: snap.id, ...snap.data() } as Record<string, any>) : null),
    onError
  );
}

// ─── Event Brief Submission ───────────────────────────────────────────────────

export interface EventBriefPayload {
  eventName: string;
  budget: number;
  location: string;
  eventDate: Date;
  performanceType: string;
  categories: string[];
  requirements: string;
  postedBy: string;
  postedByName: string;
  postedByEmail: string;
}

/**
 * Writes a new event brief to the Firestore `eventBriefs` collection.
 * Status is forced to "pending"; admin moderation promotes it to "active".
 */
export async function postEventBrief(payload: EventBriefPayload): Promise<{ id: string }> {
  const eventDate = payload.eventDate.toISOString().split("T")[0];
  const docRef = await withTimeout(
    addDoc(collection(db, EVENT_BRIEF_COLLECTION), {
      // Core fields (multiple aliases so BriefCard's fallback chain always finds them)
      eventName:       payload.eventName,
      title:           payload.eventName,
      name:            payload.eventName,
      budget:          payload.budget,
      totalBudget:     payload.budget,
      location:        payload.location,
      city:            payload.location,
      eventDate,
      date:            eventDate,
      performanceType: payload.performanceType,
      type:            payload.performanceType,
      categories:      payload.categories,
      requirements:    payload.requirements,
      professionalRequirements: payload.requirements,
      // Ownership
      createdBy:       payload.postedBy,
      postedBy:        payload.postedBy,
      postedByName:    payload.postedByName,
      postedByEmail:   payload.postedByEmail,
      status:          "pending",
      // Server-side timestamps
      createdAt:       serverTimestamp(),
      updatedAt:       serverTimestamp(),
    }),
    FIREBASE_WRITE_TIMEOUT_MS,
    "Could not post your event brief. Please check your connection and try again."
  );

  // Bust the read-cache so stale data is never served after a write
  clearDataCache();

  return { id: docRef.id };
}
