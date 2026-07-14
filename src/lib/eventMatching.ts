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
import {
  getArtistArtForms,
  normalizeArtistType,
  CATEGORY_GROUPS,
  getCategoryGroupForArtistType,
} from "@/constants/artistSystem";
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
  subCategory?: string;
  subcategory?: string;
  category?: string;
  categories?: string[];
}

export function normalizeArtForm(value: unknown) {
  return normalizeArtistType(value) ?? String(value ?? "").trim();
}

export function getEventArtForms(event: CulturalEventPayload): string[] {
  const candidates = [
    ...(Array.isArray(event.categories) ? event.categories : []),
    event.artType,
    event.subCategory,
    event.subcategory,
    event.category,
  ];
  const forms = Array.from(new Set(candidates.map(c => normalizeArtForm(c)).filter(Boolean)));
  if (forms.length === 0 && event.performanceType) {
    forms.push(normalizeArtForm(event.performanceType));
  }
  return forms;
}

export function getEventArtType(event: CulturalEventPayload) {
  const forms = getEventArtForms(event);
  return forms[0] || "";
}

export function getAllRelatedArtForms(form: string): string[] {
  const trimmed = String(form || "").trim();
  if (!trimmed) return [];

  const results = [trimmed.toLowerCase()];

  // Check if it matches a parent group name case-insensitively
  for (const [groupName, group] of Object.entries(CATEGORY_GROUPS)) {
    if (groupName.toLowerCase() === trimmed.toLowerCase()) {
      for (const sub of group.subcategories) {
        results.push(sub.toLowerCase());
      }
    }
  }

  // Check if it's a subcategory of a parent group
  const parentGroup = getCategoryGroupForArtistType(trimmed);
  if (parentGroup) {
    results.push(parentGroup.toLowerCase());
  }

  return Array.from(new Set(results));
}

export function artistMatchesEvent(event: CulturalEventPayload, artistProfile: Record<string, any>) {
  const status = String(event.status || "").toUpperCase();
  if (status !== "APPROVED") return false;

  const eventArtForms = getEventArtForms(event);
  if (eventArtForms.length === 0) return false;

  const artistArtForms = getArtistArtForms(artistProfile);
  if (artistArtForms.length === 0) return false;

  // Expand event art forms to all related categories and subcategories
  const expandedEventForms = new Set(
    eventArtForms.flatMap(form => getAllRelatedArtForms(form))
  );

  // Expand artist art forms to all related categories and subcategories
  const expandedArtistForms = new Set(
    artistArtForms.flatMap(form => getAllRelatedArtForms(form))
  );

  // Check if there is any intersection between expanded forms
  for (const artistForm of expandedArtistForms) {
    if (expandedEventForms.has(artistForm)) {
      return true;
    }
  }

  return false;
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
    const eventRef = doc(db, "eventBriefs", eventId);
    const userRef = doc(db, "users", artistId);
    const artistRef = doc(db, "artists", artistId);
    const eventSnap = await transaction.get(eventRef);
    const userSnap = await transaction.get(userRef);
    const artistSnap = await transaction.get(artistRef);

    if (!eventSnap.exists()) throw new Error("Event not found.");
    if (!userSnap.exists() && !artistSnap.exists()) {
      throw new Error("Artist profile not found.");
    }

    const event = eventSnap.data() as CulturalEventPayload;
    const userProfile = userSnap.exists() ? userSnap.data() : {};
    const artistProfile = artistSnap.exists() ? artistSnap.data() : {};

    const role = userProfile.role || artistProfile.role || "";
    if (role !== "artist") {
      throw new Error("Only registered artists can apply for events.");
    }

    // Merge user and artist documents to capture all potential art forms and profile details
    const mergedArtist = {
      ...userProfile,
      ...artistProfile,
      artistProfile: {
        ...(userProfile?.artistProfile || {}),
        ...(artistProfile?.artistProfile || {}),
      },
    };

    const eventStatus = String(event.status || "").toUpperCase();
    if (eventStatus !== "APPROVED") {
      throw new Error("This event is not open for applications yet.");
    }

    if (!artistMatchesEvent(event, mergedArtist)) {
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
  const status = String(event.status || "").toUpperCase();
  if (!artType || status !== "APPROVED") return 0;

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
