import { collection, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, startAfter, where, type QueryDocumentSnapshot } from "firebase/firestore";
import { CATEGORY_GROUP_OPTIONS, normalizeArtistRecord } from "@/constants/artistSystem";
import { db } from "@/lib/firebase";
import { FIREBASE_READ_TIMEOUT_MS, withTimeout } from "@/lib/firebaseSafe";
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
  return !status || status === "approved" || status === "active";
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
  const base = {
    ...event,
    image: event.image || event.imageUrl || event.coverImage || "",
  };
  return { ...base, ...normalizeRecord(base) };
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
  return cached(`artists:active:${pageSize}`, async () => {
    const artistsQuery = query(
      collection(db, "artists"),
      where("status", "==", "active"),
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );
    const snap = await withTimeout(getDocs(artistsQuery), FIREBASE_READ_TIMEOUT_MS, "Artists are taking too long to load.");
    return snap.docs.map((artist) => readyArtistMedia(docData<Record<string, any>>(artist)));
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
}

export async function getApprovedEvents(maxCount?: number) {
  const pageSize = clampPageSize(maxCount);
  return cached(`events:approved:${pageSize}`, async () => {
    const eventsQuery = query(collection(db, "events"), orderBy("createdAt", "desc"), limit(pageSize * 3));
    const snap = await withTimeout(getDocs(eventsQuery), FIREBASE_READ_TIMEOUT_MS, "Events are taking too long to load.");
    const events = snap.docs.map((event) => docData<Record<string, any>>(event)).filter(isPublicEvent);
    const hydrated = events.map(readyEventMedia);
    return typeof maxCount === "number" ? hydrated.slice(0, maxCount) : hydrated;
  });
}

export function subscribeApprovedEvents(maxCount: number | undefined, onData: (events: Record<string, any>[]) => void, onError?: (error: unknown) => void) {
  const pageSize = clampPageSize(maxCount);
  const eventsQuery = query(collection(db, "events"), orderBy("createdAt", "desc"), limit(pageSize * 3));
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
    const snap = await withTimeout(getDoc(doc(db, "events", id)), FIREBASE_READ_TIMEOUT_MS, "Event details are taking too long to load.");
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Record<string, any>) : null;
  });
}

export function subscribeEventById(id: string, onData: (event: Record<string, any> | null) => void, onError?: (error: unknown) => void) {
  return onSnapshot(
    doc(db, "events", id),
    (snap) => onData(snap.exists() ? ({ id: snap.id, ...snap.data() } as Record<string, any>) : null),
    onError
  );
}
