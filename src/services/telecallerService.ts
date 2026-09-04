import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import {
  calculateCommissionSplit,
  getLocalCommissionConfig,
  type CommissionSplitType,
} from "@/services/commissionSettingsService";

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
  telecallerStatus?: LeadStatus;
  matchedArtists: MatchedArtistCall[];
  confirmedArtistId?: string;
  confirmedArtistName?: string;
  requestedArtistName?: string;
  bookingId?: string;
  customerId?: string;
  artistPhone?: string;
  artistContactNumber?: string;
  leadType: LeadType;
  confirmedPrice?: number;
  // Commission & Profit Split Fields
  bookingAmount?: number;
  artistPayout?: number;
  grossMargin?: number;
  telecallerCommission?: number;
  telecallerCommissionPct?: number;
  ownerProfit?: number;
  ownerProfitPct?: number;
  commissionSplitType?: CommissionSplitType;
  commissionPayoutStatus?: "pending" | "paid" | "cancelled";
  commissionSettledAt?: string;
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
    data.artistName ||
    data.requestedArtistName ||
    data.confirmedArtistName ||
    data.artist?.name ||
    data.artist?.fullName ||
    data.artistDisplayName ||
    (data.matchedArtists && data.matchedArtists[0]?.artistName),
    ""
  );

  const isBooking =
    safeId.startsWith("booking_") ||
    Boolean(data.artistName) ||
    Boolean(data.artistId) ||
    Boolean(data.artistUid) ||
    Boolean(data.artistBookingId) ||
    Boolean(requestedArtist) ||
    data.leadType === "book_artist" ||
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
    // Commission Fields
    bookingAmount: data.bookingAmount ? Number(data.bookingAmount) : undefined,
    artistPayout: data.artistPayout ? Number(data.artistPayout) : undefined,
    grossMargin: data.grossMargin ? Number(data.grossMargin) : undefined,
    telecallerCommission: data.telecallerCommission ? Number(data.telecallerCommission) : undefined,
    telecallerCommissionPct: data.telecallerCommissionPct ? Number(data.telecallerCommissionPct) : undefined,
    ownerProfit: data.ownerProfit ? Number(data.ownerProfit) : undefined,
    ownerProfitPct: data.ownerProfitPct ? Number(data.ownerProfitPct) : undefined,
    commissionSplitType: data.commissionSplitType,
    commissionPayoutStatus: (data.commissionPayoutStatus as any) || (data.telecallerCommission ? "pending" : undefined),
    commissionSettledAt: data.commissionSettledAt ? toSafeString(data.commissionSettledAt, "") : undefined,
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
          requestedArtistName: l.requestedArtistName || existing.requestedArtistName,
          confirmedArtistName: l.confirmedArtistName || existing.confirmedArtistName,
          leadType: l.leadType === "book_artist" || existing.leadType === "book_artist" ? "book_artist" : l.leadType,
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
  id?: string;
  bookingId?: string;
  customerId?: string;
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
  const leadId = inquiry.id || (inquiry.bookingId ? `booking_${inquiry.bookingId}` : `lead_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);

  const effectiveCategory = inquiry.serviceCategory || inquiry.category || inquiry.eventType || "General Event";
  const effectiveSubCategory = inquiry.selectedService || inquiry.subCategory || (inquiry.artistName ? `Artist Booking (${inquiry.artistName})` : "General Inquiry");

  const newLead: TelecallerLead = {
    id: leadId,
    bookingId: inquiry.bookingId,
    customerId: inquiry.customerId,
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
  confirmedArtist?: {
    artistId: string;
    artistName: string;
    price: number;
  }
): Promise<void> {
  const localList = getLocalLeads();
  let targetLead: TelecallerLead | undefined;

  localList.forEach((lead) => {
    if (lead.id === leadId || cleanId(lead.id) === cleanId(leadId)) {
      lead.status = status;
      lead.telecallerStatus = status;
      targetLead = lead;
      if (confirmedArtist) {
        lead.confirmedArtistId = confirmedArtist.artistId;
        lead.confirmedArtistName = confirmedArtist.artistName;
        lead.confirmedPrice = confirmedArtist.price;
      }
    }
  });

  if (!targetLead) {
    targetLead = {
      id: leadId,
      status,
      telecallerStatus: status,
    } as any;
    localList.push(targetLead!);
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

  // Calculate Commission & Profit Split if deal has value or is being closed
  const bookingAmt = Number(targetLead?.budget || confirmedArtist?.price || 0);
  const artistAmt = Number(confirmedArtist?.price || targetLead?.artistOfferBudget || (bookingAmt > 0 ? Math.round(bookingAmt * 0.8) : 0));

  if (bookingAmt > 0 && (status === "booked" || status === "artist_confirmed" || confirmedArtist)) {
    const split = calculateCommissionSplit(bookingAmt, artistAmt);
    updatePayload.bookingAmount = split.bookingAmount;
    updatePayload.artistPayout = split.artistPayout;
    updatePayload.grossMargin = split.grossMargin;
    updatePayload.telecallerCommission = split.telecallerCommission;
    updatePayload.telecallerCommissionPct = split.telecallerCommissionPct;
    updatePayload.ownerProfit = split.ownerProfit;
    updatePayload.ownerProfitPct = split.ownerProfitPct;
    updatePayload.commissionSplitType = split.splitType;
    updatePayload.commissionPayoutStatus = targetLead?.commissionPayoutStatus || "pending";

    if (targetLead) {
      targetLead.bookingAmount = split.bookingAmount;
      targetLead.artistPayout = split.artistPayout;
      targetLead.grossMargin = split.grossMargin;
      targetLead.telecallerCommission = split.telecallerCommission;
      targetLead.telecallerCommissionPct = split.telecallerCommissionPct;
      targetLead.ownerProfit = split.ownerProfit;
      targetLead.ownerProfitPct = split.ownerProfitPct;
      targetLead.commissionSplitType = split.splitType;
      targetLead.commissionPayoutStatus = targetLead.commissionPayoutStatus || "pending";
    }
  }

  // 2. Write/Upsert to telecaller_leads AND target source collection
  const realDocId = cleanId(leadId);

  try {
    await setDoc(doc(db, LEADS_COLLECTION, realDocId), updatePayload, { merge: true });
    await setDoc(doc(db, LEADS_COLLECTION, leadId), updatePayload, { merge: true });
  } catch {
    // Ignore permissions or network fallback
  }

  const bookingDocPayload: Record<string, any> = {
    ...updatePayload,
    status: bookingStatusToSet,
  };
  if (confirmedArtist) {
    bookingDocPayload.confirmedPrice = confirmedArtist.price;
    bookingDocPayload.confirmedArtistName = confirmedArtist.artistName;
  }

  try {
    // 1. Direct doc write by ID
    await setDoc(doc(db, "bookings", realDocId), bookingDocPayload, { merge: true });

    if (leadId.startsWith("brief_")) {
      await updateDoc(doc(db, "eventBriefs", realDocId), updatePayload).catch(() => {});
    } else {
      await setDoc(doc(db, "inquiries", realDocId), updatePayload, { merge: true }).catch(() => {});
    }

    // 2. Query and sync matching bookings by customer phone or customerId
    const customerPhone = targetLead?.customerPhone;
    const customerId = targetLead?.customerId;

    const queriesToRun = [];
    if (customerPhone) {
      queriesToRun.push(query(collection(db, "bookings"), where("clientPhone", "==", customerPhone)));
      queriesToRun.push(query(collection(db, "bookings"), where("customerPhone", "==", customerPhone)));
    }
    if (customerId) {
      queriesToRun.push(query(collection(db, "bookings"), where("customerId", "==", customerId)));
    }

    if (queriesToRun.length > 0) {
      const results = await Promise.allSettled(queriesToRun.map((q) => getDocs(q)));
      results.forEach((res) => {
        if (res.status === "fulfilled") {
          res.value.forEach((d) => {
            setDoc(d.ref, bookingDocPayload, { merge: true }).catch(() => {});
          });
        }
      });
    }

    // Trigger local broadcast so client profile refreshes immediately
    window.dispatchEvent(new CustomEvent("mykalakar_lead_status_changed", { detail: { leadId, status: bookingStatusToSet } }));
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

export async function deleteLead(leadId: string): Promise<void> {
  // 1. Remove from local storage cache
  const localList = getLocalLeads();
  const filtered = localList.filter((l) => l.id !== leadId && cleanId(l.id) !== cleanId(leadId));
  try {
    localStorage.setItem(LOCAL_LEADS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn("Local storage delete warning:", e);
  }

  // 2. Delete from Firestore collections
  const realDocId = cleanId(leadId);
  const collections = [LEADS_COLLECTION, "inquiries", "bookings", "eventBriefs", "event_briefs"];

  await Promise.allSettled(
    collections.flatMap((col) => [
      deleteDoc(doc(db, col, realDocId)),
      deleteDoc(doc(db, col, leadId)),
    ])
  );
}

export async function settleLeadCommission(leadId: string, status: "pending" | "paid" | "cancelled"): Promise<void> {
  const localList = getLocalLeads();
  const realDocId = cleanId(leadId);
  const settledAt = status === "paid" ? new Date().toISOString() : undefined;

  localList.forEach((lead) => {
    if (lead.id === leadId || cleanId(lead.id) === realDocId) {
      lead.commissionPayoutStatus = status;
      if (settledAt) lead.commissionSettledAt = settledAt;
    }
  });

  try {
    localStorage.setItem(LOCAL_LEADS_KEY, JSON.stringify(localList.slice(0, 100)));
  } catch (e) {
    console.warn("Local storage commission update warning:", e);
  }

  const updatePayload: Record<string, any> = {
    commissionPayoutStatus: status,
    commissionSettledAt: settledAt || null,
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, LEADS_COLLECTION, realDocId), updatePayload, { merge: true });
    await setDoc(doc(db, LEADS_COLLECTION, leadId), updatePayload, { merge: true });
  } catch (e) {
    console.warn("Firestore commission settlement error:", e);
  }
}

