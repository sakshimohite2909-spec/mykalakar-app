import {
  collection,
  doc,
  getDocs,
  increment,
  query,
  runTransaction,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getArtistArtForms, normalizeArtistType } from "@/constants/artistSystem";
import { sanitizePayload } from "@/lib/firebaseSafe";

export type EventStatus = "PENDING" | "APPROVED" | "REJECTED";
export type PerformanceType = "solo" | "group" | "";

export interface CulturalEventPayload {
  title?: string;
  name?: string;
  artType?: string;
  performanceType?: PerformanceType;
  requirements?: string;
  budget?: number;
  location?: string;
  eventDate?: string;
  createdBy?: string;
  status?: EventStatus | string;
  applicationsCount?: number;
}

export function normalizeArtForm(value: unknown) {
  return normalizeArtistType(value) ?? String(value ?? "").trim();
}

export function getEventArtType(event: CulturalEventPayload) {
  return normalizeArtForm(event.artType);
}

export function artistMatchesEvent(event: CulturalEventPayload, artistProfile: Record<string, any>) {
  const artType = getEventArtType(event);
  if (!artType || event.status !== "APPROVED") return false;
  return getArtistArtForms(artistProfile).includes(artType);
}

export async function submitEventApplication({
  eventId,
  artistId,
  message = "",
}: {
  eventId: string;
  artistId: string;
  message?: string;
}) {
  if (!artistId) throw new Error("User not authenticated");
  return runTransaction(db, async (transaction) => {
    const eventRef = doc(db, "events", eventId);
    const userRef = doc(db, "users", artistId);
    const eventSnap = await transaction.get(eventRef);
    const userSnap = await transaction.get(userRef);

    if (!eventSnap.exists()) throw new Error("Event not found.");
    if (!userSnap.exists()) throw new Error("Artist profile not found.");

    const event = eventSnap.data() as CulturalEventPayload;
    const userProfile = userSnap.data();
    if (!artistMatchesEvent(event, userProfile)) {
      throw new Error("This event is not open for your registered art forms.");
    }

    const artType = getEventArtType(event);
    const applicationRef = doc(collection(db, "event_applications"));
    transaction.set(applicationRef, sanitizePayload({
      eventId,
      artistId,
      artType,
      message,
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));
    transaction.update(eventRef, sanitizePayload({
      applicationsCount: increment(1),
      updatedAt: serverTimestamp(),
    }));

    return applicationRef.id;
  });
}

export async function notifyArtistsForApprovedEvent(eventId: string, event: CulturalEventPayload) {
  const artType = getEventArtType(event);
  if (!artType || event.status !== "APPROVED") return 0;

  const matchingArtists = await getDocs(
    query(collection(db, "users"), where("artistProfile.artForms", "array-contains", artType))
  );
  if (matchingArtists.empty) return 0;

  const batch = writeBatch(db);
  let count = 0;
  matchingArtists.docs.forEach((artistDoc) => {
    const data = artistDoc.data();
    if (data.role !== "artist" || !["active", "approved"].includes(data.status)) return;
    const notificationRef = doc(collection(db, "notifications"));
    batch.set(notificationRef, sanitizePayload({
      userId: artistDoc.id,
      type: "EVENT_MATCH",
      title: event.title || event.name || "New cultural event opportunity",
      message: `${artType} opportunity${event.location ? ` in ${event.location}` : ""}`,
      eventId,
      artType,
      read: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));
    count += 1;
  });

  if (count > 0) await batch.commit();
  return count;
}
