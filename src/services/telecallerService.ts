import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  setDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

export type LeadStatus =
  | "new"
  | "contacting_artists"
  | "artist_confirmed"
  | "quote_sent"
  | "booked"
  | "cancelled";

export type ArtistCallOutcome =
  | "pending"
  | "agreed"
  | "busy_booked"
  | "no_answer"
  | "price_too_high"
  | "rejected";

export type MatchedArtistCall = {
  artistId: string;
  artistName: string;
  artistPhone: string;
  category: string;
  subCategory: string;
  callOutcome: ArtistCallOutcome;
  quotedPrice?: number;
  callNotes?: string;
  updatedAt?: string;
};

export type LeadType = "book_artist" | "post_requirement";

export type TelecallerLead = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  eventType: string;
  category: string;
  subCategory: string;
  eventDate: string;
  eventTime?: string;
  eventLocation: string;
  venueAddress?: string;
  district?: string;
  budget: number;
  artistOfferBudget?: number;
  soundRequired?: boolean;
  isVerifiedByTelecaller?: boolean;
  telecallerNotes?: string;
  specialNotes?: string;
  assignedTelecallerId?: string;
  assignedTelecallerName?: string;
  status: LeadStatus;
  matchedArtists: MatchedArtistCall[];
  confirmedArtistId?: string;
  confirmedArtistName?: string;
  requestedArtistName?: string;
  leadType: LeadType;
  confirmedPrice?: number;
  source: "website_inquiry" | "manual_phone_call";
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

const LEADS_COLLECTION = "telecaller_leads";
const LOCAL_LEADS_KEY = "mykalakar_local_telecaller_leads";

function getLocalLeads(): TelecallerLead[] {
  try {
    const raw = localStorage.getItem(LOCAL_LEADS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalLead(lead: TelecallerLead) {
  try {
    const current = getLocalLeads().filter((item) => item.id !== lead.id);
    current.unshift(lead);
    localStorage.setItem(LOCAL_LEADS_KEY, JSON.stringify(current.slice(0, 100)));
  } catch (e) {
    console.warn("Failed to cache lead locally:", e);
  }
}

function getTimeMs(val: any): number {
  if (!val) return 0;
  if (typeof val === "number") return val;
  if (typeof val === "string") return new Date(val).getTime() || 0;
  if (val instanceof Date) return val.getTime();
  if (typeof val === "object" && typeof val.toDate === "function") {
    return val.toDate().getTime();
  }
  return 0;
}

function toSafeString(val: any, fallback: string = ""): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (typeof val === "object") {
    if (val instanceof Date) return val.toISOString().split("T")[0];
    if (typeof val.toDate === "function") {
      try {
        return val.toDate().toISOString().split("T")[0];
      } catch {
        return fallback;
      }
    }
    if ("seconds" in val && typeof val.seconds === "number") {
      try {
        return new Date(val.seconds * 1000).toISOString().split("T")[0];
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
  return String(val);
}

function sanitizeLead(id: string, data: any): TelecallerLead {
  const safeId = toSafeString(id, `lead_${Date.now()}`);
  const requestedArtist = toSafeString(
    data.artistName || data.requestedArtistName || (data.matchedArtists && data.matchedArtists[0]?.artistName),
    ""
  );

  const isBooking =
    safeId.startsWith("booking_") ||
    Boolean(data.artistName) ||
    Boolean(data.artistId) ||
    toSafeString(data.subCategory).toLowerCase().includes("booking") ||
    toSafeString(data.subCategory).toLowerCase().includes("artist");

  const leadType: LeadType = isBooking ? "book_artist" : "post_requirement";

  const VALID_LEAD_STATUSES: LeadStatus[] = [
    "new",
    "contacting_artists",
    "artist_confirmed",
    "quote_sent",
    "booked",
    "cancelled",
  ];

  const rawStatus = toSafeString(data.telecallerStatus || data.status, "new").toLowerCase();
  const status: LeadStatus = VALID_LEAD_STATUSES.includes(rawStatus as LeadStatus)
    ? (rawStatus as LeadStatus)
    : "new";

  return {
    id: safeId,
    customerName: toSafeString(data.customerName || data.clientName || data.postedByName, "Customer"),
    customerPhone: toSafeString(data.customerPhone || data.clientPhone || data.postedByPhone, ""),
    customerEmail: toSafeString(data.customerEmail || data.postedByEmail, ""),
    eventType: toSafeString(data.eventType || data.performanceType || data.eventName, "General Event"),
    category: toSafeString(data.category || data.eventType || data.performanceType, "General Event"),
    subCategory: toSafeString(
      data.subCategory || (requestedArtist ? `Artist Booking (${requestedArtist})` : isBooking ? "Artist Booking" : "Event Requirement"),
      isBooking ? "Artist Booking" : "Event Requirement"
    ),
    eventDate: toSafeString(data.eventDate || data.date, ""),
    eventTime: toSafeString(data.eventTime || data.time || data.timing, ""),
    eventLocation: toSafeString(data.eventLocation || data.venueLocation || data.location || data.city, ""),
    venueAddress: toSafeString(data.venueAddress || data.address || data.venue, ""),
    budget: Number(data.authorizedAmount || data.budget || data.totalBudget || 0) || 0,
    artistOfferBudget: data.artistOfferBudget ? Number(data.artistOfferBudget) : undefined,
    soundRequired: typeof data.soundRequired === "boolean" ? data.soundRequired : undefined,
    isVerifiedByTelecaller: Boolean(data.isVerifiedByTelecaller || data.isVerified),
    telecallerNotes: toSafeString(data.telecallerNotes || data.verifiedNotes, ""),
    specialNotes: toSafeString(data.specialNotes || data.message || data.requirements || data.additionalNotes, ""),
    status,
    matchedArtists: Array.isArray(data.matchedArtists)
      ? data.matchedArtists.map((a: any) => ({
          artistId: toSafeString(a.artistId, ""),
          artistName: toSafeString(a.artistName, "Artist"),
          artistPhone: toSafeString(a.artistPhone, ""),
          category: toSafeString(a.category, ""),
          subCategory: toSafeString(a.subCategory, ""),
          callOutcome: (toSafeString(a.callOutcome, "pending") as ArtistCallOutcome) || "pending",
          quotedPrice: a.quotedPrice ? Number(a.quotedPrice) : undefined,
          callNotes: toSafeString(a.callNotes, ""),
          updatedAt: toSafeString(a.updatedAt, ""),
        }))
      : requestedArtist
      ? [
          {
            artistId: toSafeString(data.artistId || requestedArtist, ""),
            artistName: requestedArtist,
            artistPhone: "",
            category: toSafeString(data.eventType || data.performanceType, ""),
            subCategory: toSafeString(data.subCategory, ""),
            callOutcome: "pending" as ArtistCallOutcome,
          },
        ]
      : [],
    confirmedArtistName: data.confirmedArtistName ? toSafeString(data.confirmedArtistName, "") : undefined,
    confirmedArtistId: data.confirmedArtistId ? toSafeString(data.confirmedArtistId, "") : undefined,
    requestedArtistName: requestedArtist || undefined,
    leadType,
    confirmedPrice: data.confirmedPrice ? Number(data.confirmedPrice) : undefined,
    source: (data.source === "manual_phone_call" ? "manual_phone_call" : "website_inquiry") as any,
    createdAt: toSafeString(data.createdAt, new Date().toISOString()),
    updatedAt: toSafeString(data.updatedAt, ""),
  };
}

function cleanId(id: string): string {
  if (!id) return "";
  return id.replace(/^(booking_|brief_|lead_|inquiry_)/, "");
}

export function subscribeTelecallerLeads(callback: (leads: TelecallerLead[]) => void) {
  let telecallerLeads: TelecallerLead[] = getLocalLeads().map((l) => sanitizeLead(l.id, l));
  let inquiryLeads: TelecallerLead[] = [];
  let bookingLeads: TelecallerLead[] = [];
  let eventBriefLeads: TelecallerLead[] = [];

  const publishCombined = () => {
    const map = new Map<string, TelecallerLead>();

    const setMapLead = (l: TelecallerLead) => {
      const cid = cleanId(l.id);
      const existing = map.get(cid);
      if (!existing) {
        map.set(cid, l);
      } else {
        const effectiveStatus = l.status !== "new" ? l.status : existing.status;
        map.set(cid, {
          ...existing,
          ...l,
          status: effectiveStatus,
        });
      }
    };

    telecallerLeads.forEach(setMapLead);
    eventBriefLeads.forEach(setMapLead);
    bookingLeads.forEach(setMapLead);
    inquiryLeads.forEach(setMapLead);

    // Apply local overrides
    getLocalLeads().forEach((l) => {
      const cid = cleanId(l.id);
      const existing = map.get(cid);
      if (existing) {
        if (l.status && l.status !== "new") {
          existing.status = l.status as LeadStatus;
        }
        if (l.confirmedArtistName) existing.confirmedArtistName = l.confirmedArtistName;
      } else {
        map.set(cid, sanitizeLead(l.id, l));
      }
    });

    const combined = Array.from(map.values()).sort(
      (a, b) => getTimeMs(b.createdAt) - getTimeMs(a.createdAt)
    );

    callback(combined);
  };

  // Immediate initial publish from local cache
  publishCombined();

  // 1. Primary real-time listener for telecaller_leads
  const qLeads = query(collection(db, LEADS_COLLECTION), limit(100));
  const unsubLeads = onSnapshot(
    qLeads,
    (snapshot) => {
      telecallerLeads = snapshot.docs.map((docSnap) => sanitizeLead(docSnap.id, docSnap.data()));
      publishCombined();
    },
    () => {
      publishCombined();
    }
  );

  // 2. Real-time sync listener for inquiries
  const qInquiries = query(collection(db, "inquiries"), limit(50));
  const unsubInquiries = onSnapshot(
    qInquiries,
    (snapshot) => {
      inquiryLeads = snapshot.docs.map((docSnap) => sanitizeLead(docSnap.id, docSnap.data()));
      publishCombined();
    },
    () => {
      publishCombined();
    }
  );

  // 3. Real-time sync listener for bookings
  const qBookings = query(collection(db, "bookings"), limit(50));
  const unsubBookings = onSnapshot(
    qBookings,
    (snapshot) => {
      bookingLeads = snapshot.docs.map((docSnap) => sanitizeLead(`booking_${docSnap.id}`, docSnap.data()));
      publishCombined();
    },
    () => {
      publishCombined();
    }
  );

  // 4. Real-time sync listener for eventBriefs
  const qBriefs = query(collection(db, "eventBriefs"), limit(50));
  const unsubBriefs = onSnapshot(
    qBriefs,
    (snapshot) => {
      eventBriefLeads = snapshot.docs.map((docSnap) => sanitizeLead(`brief_${docSnap.id}`, docSnap.data()));
      publishCombined();
    },
    () => {
      publishCombined();
    }
  );

  return () => {
    unsubLeads();
    unsubInquiries();
    unsubBookings();
    unsubBriefs();
  };
}

export async function saveCustomerInquiryLead(inquiry: {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  eventType: string;
  category?: string;
  subCategory?: string;
  selectedService?: string;
  serviceCategory?: string;
  serviceEvent?: string;
  eventDate: string;
  eventLocation: string;
  budget?: number;
  message?: string;
  artistId?: string;
  artistName?: string;
}): Promise<void> {
  const createdAtIso = new Date().toISOString();
  const leadId = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const effectiveCategory = inquiry.serviceCategory || inquiry.category || inquiry.eventType || "General Event";
  const effectiveSubCategory = inquiry.selectedService || inquiry.subCategory || (inquiry.artistName ? `Artist Booking (${inquiry.artistName})` : "General Inquiry");

  const newLead: TelecallerLead = {
    id: leadId,
    customerName: inquiry.customerName || "Customer",
    customerPhone: inquiry.customerPhone || "",
    customerEmail: inquiry.customerEmail || "",
    eventType: inquiry.serviceEvent || inquiry.eventType || "General Event",
    category: effectiveCategory,
    subCategory: effectiveSubCategory,
    eventDate: inquiry.eventDate || "",
    eventLocation: inquiry.eventLocation || "",
    budget: Number(inquiry.budget || 0),
    specialNotes: inquiry.message || "",
    status: "new",
    matchedArtists: inquiry.artistName
      ? [
          {
            artistId: inquiry.artistId || inquiry.artistName,
            artistName: inquiry.artistName,
            artistPhone: "",
            category: effectiveCategory,
            subCategory: effectiveSubCategory,
            callOutcome: "pending",
          },
        ]
      : [],
    requestedArtistName: inquiry.artistName || undefined,
    leadType: inquiry.artistName ? "book_artist" : "post_requirement",
    source: "website_inquiry",
    createdAt: createdAtIso,
  };

  // 1. Immediately cache locally for offline/instant availability
  saveLocalLead(newLead);

  // 2. Write to Firestore telecaller_leads
  try {
    const docRef = await addDoc(collection(db, LEADS_COLLECTION), {
      ...newLead,
      createdAt: createdAtIso,
    });
    newLead.id = docRef.id;
    saveLocalLead(newLead);
  } catch (error) {
    console.warn("Failed to save customer inquiry lead to telecaller_leads, preserved in local cache:", error);
  }
}

export async function fetchTelecallerLeads(): Promise<TelecallerLead[]> {
  try {
    const q = query(collection(db, LEADS_COLLECTION), limit(50));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return getLocalLeads();
    }

    const list = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as TelecallerLead[];

    return list.sort((a, b) => getTimeMs(b.createdAt) - getTimeMs(a.createdAt));
  } catch (error) {
    console.warn("Could not fetch leads from Firestore, returning local cache:", error);
    return getLocalLeads();
  }
}

export async function createManualLead(leadData: Omit<TelecallerLead, "id" | "createdAt" | "status" | "matchedArtists">): Promise<TelecallerLead> {
  const createdAtIso = new Date().toISOString();
  const leadId = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const newLead: TelecallerLead = {
    ...leadData,
    id: leadId,
    leadType: leadData.leadType || "post_requirement",
    status: "new",
    matchedArtists: [],
    source: "manual_phone_call",
    createdAt: createdAtIso,
  };

  // 1. Instantly cache in localStorage
  saveLocalLead(newLead);

  try {
    const docRef = await addDoc(collection(db, LEADS_COLLECTION), {
      ...newLead,
      createdAt: createdAtIso,
    });
    const saved = { ...newLead, id: docRef.id };
    saveLocalLead(saved);
    return saved;
  } catch (error) {
    console.warn("Error saving manual lead to Firestore, using local lead:", error);
    return newLead;
  }
}

export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus,
  confirmedArtist?: { artistId: string; artistName: string; price: number }
): Promise<void> {
  const cid = cleanId(leadId);

  // 1. Immediately update local storage cache with normalized ID matching
  const localList = getLocalLeads();
  let found = false;
  localList.forEach((l) => {
    if (cleanId(l.id) === cid || l.id === leadId) {
      l.status = status;
      (l as any).telecallerStatus = status;
      if (confirmedArtist) {
        l.confirmedArtistId = confirmedArtist.artistId;
        l.confirmedArtistName = confirmedArtist.artistName;
        l.confirmedPrice = confirmedArtist.price;
      }
      found = true;
    }
  });

  if (!found) {
    localList.push({
      id: leadId,
      status,
      telecallerStatus: status,
    } as any);
  }

  try {
    localStorage.setItem(LOCAL_LEADS_KEY, JSON.stringify(localList.slice(0, 100)));
  } catch (e) {
    console.warn("Local storage status save warning:", e);
  }

  const bookingStatusToSet =
    status === "artist_confirmed" || status === "quote_sent"
      ? "PAYMENT_PENDING"
      : status === "booked"
      ? "CONFIRMED"
      : status === "cancelled"
      ? "CANCELLED_BY_CLIENT"
      : status;

  const updatePayload: Record<string, any> = {
    status,
    telecallerStatus: status,
    bookingStatus: bookingStatusToSet,
    updatedAt: serverTimestamp(),
  };
  if (confirmedArtist) {
    updatePayload.confirmedArtistId = confirmedArtist.artistId;
    updatePayload.confirmedArtistName = confirmedArtist.artistName;
    updatePayload.confirmedPrice = confirmedArtist.price;
  }

  // 2. Write/Upsert to telecaller_leads AND target source collection
  const realDocId = cleanId(leadId);

  try {
    await setDoc(doc(db, LEADS_COLLECTION, realDocId), updatePayload, { merge: true });
    await setDoc(doc(db, LEADS_COLLECTION, leadId), updatePayload, { merge: true });
  } catch {
    // Ignore permissions or network fallback
  }

  const bookingDocPayload = {
    ...updatePayload,
    status: bookingStatusToSet,
  };

  try {
    if (leadId.startsWith("booking_")) {
      await setDoc(doc(db, "bookings", realDocId), bookingDocPayload, { merge: true });
    } else if (leadId.startsWith("brief_")) {
      await updateDoc(doc(db, "eventBriefs", realDocId), updatePayload);
    } else {
      try {
        await setDoc(doc(db, LEADS_COLLECTION, leadId), updatePayload, { merge: true });
        // Also update any matching booking in bookings collection
        await setDoc(doc(db, "bookings", realDocId), bookingDocPayload, { merge: true });
      } catch {
        await setDoc(doc(db, "inquiries", realDocId), updatePayload, { merge: true });
      }
    }
  } catch (error: any) {
    if (error?.code !== "permission-denied") {
      console.warn(`Firestore status update warning for ${leadId} -> ${status}:`, error?.message || error);
    }
  }
}

export async function logArtistCall(
  leadId: string,
  artistCall: MatchedArtistCall,
  existingMatchedArtists: MatchedArtistCall[]
): Promise<MatchedArtistCall[]> {
  const updatedList = existingMatchedArtists.filter(
    (item) => item.artistId !== artistCall.artistId
  );
  updatedList.push({
    ...artistCall,
    updatedAt: new Date().toISOString(),
  });

  // Update local storage cache
  const localList = getLocalLeads();
  const targetLocal = localList.find((l) => l.id === leadId);
  if (targetLocal) {
    targetLocal.matchedArtists = updatedList;
    saveLocalLead(targetLocal);
  }

  const updatePayload = {
    matchedArtists: updatedList,
    updatedAt: serverTimestamp(),
  };

  try {
    if (leadId.startsWith("booking_")) {
      await updateDoc(doc(db, "bookings", leadId.replace("booking_", "")), updatePayload);
    } else if (leadId.startsWith("brief_")) {
      await updateDoc(doc(db, "eventBriefs", leadId.replace("brief_", "")), updatePayload);
    } else {
      try {
        await updateDoc(doc(db, LEADS_COLLECTION, leadId), updatePayload);
      } catch {
        await updateDoc(doc(db, "inquiries", leadId), updatePayload);
      }
    }
  } catch (error) {
    console.warn(`Firestore call outcome update warning for ${leadId}:`, error);
  }

  return updatedList;
}

export async function updateLeadDetails(
  leadId: string,
  updatedData: Partial<TelecallerLead>
): Promise<void> {
  const cid = cleanId(leadId);

  // 1. Immediately update local storage cache
  const localList = getLocalLeads();
  let found = false;
  localList.forEach((l) => {
    if (cleanId(l.id) === cid || l.id === leadId) {
      Object.assign(l, updatedData);
      l.isVerifiedByTelecaller = true;
      found = true;
    }
  });

  if (!found) {
    localList.push({
      id: leadId,
      ...updatedData,
      isVerifiedByTelecaller: true,
    } as any);
  }

  try {
    localStorage.setItem(LOCAL_LEADS_KEY, JSON.stringify(localList.slice(0, 100)));
  } catch (e) {
    console.warn("Local storage update warning:", e);
  }

  // 2. Write to Firestore
  const updatePayload: Record<string, any> = {
    ...updatedData,
    isVerifiedByTelecaller: true,
    updatedAt: serverTimestamp(),
  };

  const realDocId = cleanId(leadId);
  try {
    await setDoc(doc(db, LEADS_COLLECTION, realDocId), updatePayload, { merge: true });
    await setDoc(doc(db, LEADS_COLLECTION, leadId), updatePayload, { merge: true });
  } catch (e) {
    console.warn("Firestore lead details update error:", e);
  }

  try {
    if (leadId.startsWith("booking_")) {
      await setDoc(doc(db, "bookings", realDocId), updatePayload, { merge: true });
    } else if (leadId.startsWith("brief_")) {
      await setDoc(doc(db, "eventBriefs", realDocId), updatePayload, { merge: true });
    } else {
      await setDoc(doc(db, "inquiries", realDocId), updatePayload, { merge: true });
    }
  } catch {
    // Ignore permissions or collection mismatch
  }
}
