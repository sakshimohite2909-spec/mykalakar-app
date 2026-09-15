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
import { parsePriceToNumber } from "@/components/BookingModal";

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
  customCommissionOverride?: boolean;
  adminCommissionNotes?: string;
  deleted?: boolean;
  isDeleted?: boolean;
  source: "website_inquiry" | "manual_phone_call";
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

const LEADS_COLLECTION = "telecaller_leads";
const LOCAL_LEADS_KEY = "mykalakar_local_telecaller_leads";
const DELETED_LEADS_KEY = "mykalakar_deleted_lead_ids";

export function getDeletedLeadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_LEADS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return new Set();
    // CRITICAL: Strip out any broad tombstone patterns like ph_*, cust_*, name_*, art_* that were recorded in earlier versions
    const cleaned = parsed.filter(
      (id: string) =>
        typeof id === "string" &&
        !id.startsWith("ph_") &&
        !id.startsWith("cust_") &&
        !id.startsWith("name_") &&
        !id.startsWith("art_")
    );
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(DELETED_LEADS_KEY, JSON.stringify(cleaned));
    }
    return new Set(cleaned);
  } catch {
    return new Set();
  }
}

export function recordDeletedLeadId(id: string) {
  try {
    if (!id) return;
    // Never record broad phone or customer name prefixes as global tombstones
    if (id.startsWith("ph_") || id.startsWith("cust_") || id.startsWith("name_") || id.startsWith("art_")) {
      return;
    }
    const set = getDeletedLeadIds();
    const cid = cleanId(id);
    set.add(id);
    if (cid) {
      set.add(cid);
      set.add(`booking_${cid}`);
      set.add(`lead_${cid}`);
      set.add(`brief_${cid}`);
      set.add(`inquiry_${cid}`);
    }
    localStorage.setItem(DELETED_LEADS_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.warn("Failed to cache deleted lead id:", e);
  }
}

export function isDummyLeadRecord(lead: any): boolean {
  if (!lead) return true;
  const rawPhone = lead.customerPhone || lead.clientPhone || lead.postedByPhone || "";
  const cleanPhone = rawPhone.replace(/\D/g, "").slice(-10);
  const name = (lead.customerName || lead.clientName || lead.postedByName || "").toLowerCase().trim();
  const artist = (
    lead.confirmedArtistName ||
    lead.requestedArtistName ||
    lead.artistName ||
    (lead.matchedArtists && lead.matchedArtists[0]?.artistName) ||
    ""
  ).toLowerCase().trim();
  const eventType = (lead.eventType || lead.category || lead.subCategory || "").toLowerCase().trim();
  const budget = Number(lead.budget || lead.amount || lead.price || 0);

  // If there's an actual phone number, or a customer name, or an artist, or an event type, or a budget > 0, it's valid
  if (cleanPhone && cleanPhone.length >= 7) return false;
  if (name && name !== "customer" && name !== "ग्राहक" && name.length >= 2) return false;
  if (artist && artist !== "कलाकार" && artist !== "artist" && artist.length >= 2) return false;
  if (budget > 0) return false;
  if (eventType && !eventType.includes("general") && eventType.length >= 3) return false;

  const isGenericName = !name || name === "customer" || name === "ग्राहक";
  const isGenericArtist = !artist || artist === "कलाकार" || artist === "artist";
  return isGenericName && isGenericArtist && (!cleanPhone || cleanPhone.length < 5);
}

function getLocalLeads(): TelecallerLead[] {
  try {
    const raw = localStorage.getItem(LOCAL_LEADS_KEY);
    const deleted = getDeletedLeadIds();
    const primaryList: any[] = raw ? JSON.parse(raw) : [];

    // Also collect local bookings & local inquiries for instant offline reactivity
    const extraKeys = [
      "mykalakar_local_bookings",
      "mykalakar_customer_bookings",
      "mykalakar_local_inquiries",
      "mykalakar_inquiries",
      "mykalakar_event_briefs",
    ];
    const extraItems: any[] = [];
    extraKeys.forEach((k) => {
      try {
        const extraRaw = localStorage.getItem(k);
        if (extraRaw) {
          const parsed = JSON.parse(extraRaw);
          if (Array.isArray(parsed)) {
            extraItems.push(...parsed);
          }
        }
      } catch {}
    });

    const allRaw = [...primaryList, ...extraItems];
    const seen = new Set<string>();
    const result: TelecallerLead[] = [];

    for (const item of allRaw) {
      if (!item || (!item.id && !item.bookingId)) continue;
      const sanitized = sanitizeLead(item.id || (item.bookingId ? `booking_${item.bookingId}` : ""), item);
      const cid = cleanId(sanitized.id);
      const dedupKey = getLeadDedupKey(sanitized);
      const bid = sanitized.bookingId ? cleanId(sanitized.bookingId) : "";

      if (
        deleted.has(sanitized.id) ||
        (cid && deleted.has(cid)) ||
        (dedupKey && deleted.has(dedupKey)) ||
        (bid && (deleted.has(bid) || deleted.has(`booking_${bid}`))) ||
        (cid && deleted.has(`booking_${cid}`)) ||
        (cid && deleted.has(`lead_${cid}`)) ||
        (cid && deleted.has(`brief_${cid}`)) ||
        (cid && deleted.has(`inquiry_${cid}`)) ||
        (item as any).deleted === true ||
        (item as any).isDeleted === true ||
        (item.status as string) === "deleted"
      ) {
        continue;
      }

      if (isDummyLeadRecord(sanitized)) {
        continue;
      }

      const deduplicationId = dedupKey || cid;
      if (seen.has(deduplicationId)) {
        const existingIdx = result.findIndex((r) => (getLeadDedupKey(r) || cleanId(r.id)) === deduplicationId);
        if (existingIdx >= 0) {
          result[existingIdx].budget = Math.max(Number(result[existingIdx].budget || 0), Number(sanitized.budget || 0));
          
          // Preserve explicit/verified artistOfferBudget instead of Math.max
          if (typeof sanitized.artistOfferBudget === "number" && sanitized.artistOfferBudget > 0 && sanitized.isVerifiedByTelecaller) {
            result[existingIdx].artistOfferBudget = sanitized.artistOfferBudget;
            result[existingIdx].artistPayout = sanitized.artistOfferBudget;
          } else if (typeof result[existingIdx].artistOfferBudget !== "number" || result[existingIdx].artistOfferBudget === 0) {
            result[existingIdx].artistOfferBudget = sanitized.artistOfferBudget || (result[existingIdx].budget ? Math.round(result[existingIdx].budget * 0.8) : undefined);
            result[existingIdx].artistPayout = result[existingIdx].artistOfferBudget;
          }

          if (!result[existingIdx].customerPhone && sanitized.customerPhone) result[existingIdx].customerPhone = sanitized.customerPhone;
          if (!result[existingIdx].customerEmail && sanitized.customerEmail) result[existingIdx].customerEmail = sanitized.customerEmail;
          if (!result[existingIdx].requestedArtistName && sanitized.requestedArtistName && sanitized.requestedArtistName !== "कलाकार") result[existingIdx].requestedArtistName = sanitized.requestedArtistName;
          if (!result[existingIdx].confirmedArtistName && sanitized.confirmedArtistName && sanitized.confirmedArtistName !== "कलाकार") result[existingIdx].confirmedArtistName = sanitized.confirmedArtistName;
        }
        continue;
      }

      seen.add(deduplicationId);
      result.push(sanitized);
    }

    return result;
  } catch {
    return [];
  }
}

function saveLocalLead(lead: TelecallerLead) {
  const deleted = getDeletedLeadIds();
  const cid = cleanId(lead.id);
  const dedupKey = getLeadDedupKey(lead);
  const bid = lead.bookingId ? cleanId(lead.bookingId) : "";

  if (
    deleted.has(lead.id) ||
    deleted.has(cid) ||
    (dedupKey && deleted.has(dedupKey)) ||
    (bid && (deleted.has(bid) || deleted.has(`booking_${bid}`))) ||
    lead.deleted === true ||
    lead.isDeleted === true ||
    (lead.status as string) === "deleted"
  ) {
    return;
  }
  try {
    const raw = localStorage.getItem(LOCAL_LEADS_KEY);
    const existing: TelecallerLead[] = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter((item) => {
      if (item.id === lead.id || cleanId(item.id) === cid) return false;
      if (dedupKey && getLeadDedupKey(item) === dedupKey) return false;
      if (bid && item.bookingId && cleanId(item.bookingId) === bid) return false;
      return true;
    });
    filtered.unshift(lead);
    localStorage.setItem(LOCAL_LEADS_KEY, JSON.stringify(filtered.slice(0, 100)));
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
    eventDate: toSafeString(data.eventDate || data.date || data.counterOfferDate, ""),
    eventTime: toSafeString(
      data.eventTime ||
      (data.eventStartTime ? `${data.eventStartTime}${data.eventEndTime ? ` - ${data.eventEndTime}` : ""}` : "") ||
      data.time ||
      data.timing,
      ""
    ),
    eventLocation: toSafeString(data.eventLocation || data.venueLocation || data.location || data.city || data.counterOfferLocation, ""),
    venueAddress: toSafeString(data.venueAddress || data.address || data.customerAddress || data.venue, ""),
    budget: (() => {
      let rawBudget = Number(
        data.budget ??
        data.authorizedAmount ??
        data.amount ??
        data.totalBudget ??
        data.price ??
        data.fee ??
        data.confirmedPrice ??
        data.counterOfferAmount ??
        data.originalAmount ??
        (typeof data.startingPrice === "string" ? parsePriceToNumber(data.startingPrice) : data.startingPrice) ??
        0
      );
      if (rawBudget > 10000000) {
        rawBudget = parsePriceToNumber(rawBudget);
      }
      if (rawBudget > 0) return rawBudget;
      if (data.artistOfferBudget && Number(data.artistOfferBudget) > 0) {
        const off = Number(data.artistOfferBudget);
        return Math.round((off > 10000000 ? parsePriceToNumber(off) : off) / 0.8);
      }
      if (Array.isArray(data.matchedArtists) && data.matchedArtists[0]?.quotedPrice) {
        const qp = Number(data.matchedArtists[0].quotedPrice);
        return Math.round((qp > 10000000 ? parsePriceToNumber(qp) : qp) / 0.8);
      }
      return 0;
    })(),
    artistOfferBudget: (() => {
      if (data.artistOfferBudget && Number(data.artistOfferBudget) > 0) {
        const off = Number(data.artistOfferBudget);
        return off > 10000000 ? parsePriceToNumber(off) : off;
      }
      if (data.confirmedPrice && Number(data.confirmedPrice) > 0) {
        const cp = Number(data.confirmedPrice);
        return cp > 10000000 ? parsePriceToNumber(cp) : cp;
      }
      if (Array.isArray(data.matchedArtists) && data.matchedArtists[0]?.quotedPrice) {
        const qp = Number(data.matchedArtists[0].quotedPrice);
        return qp > 10000000 ? parsePriceToNumber(qp) : qp;
      }
      let rawBudget = Number(
        data.budget ??
        data.authorizedAmount ??
        data.amount ??
        data.totalBudget ??
        data.price ??
        data.fee ??
        (typeof data.startingPrice === "string" ? parsePriceToNumber(data.startingPrice) : data.startingPrice) ??
        0
      );
      if (rawBudget > 10000000) {
        rawBudget = parsePriceToNumber(rawBudget);
      }
      if (rawBudget > 0) return Math.round(rawBudget * 0.8);
      return undefined;
    })(),
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
    bookingId: toSafeString(data.bookingId || data.artistBookingId || (safeId.startsWith("booking_") ? cleanId(safeId) : ""), "") || undefined,
    customerId: toSafeString(data.customerId || data.userId || data.clientUid, "") || undefined,
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

export function cleanId(id: string): string {
  if (!id) return "";
  return id.replace(/^(booking_|brief_|lead_|inquiry_)/, "").trim();
}

export function getLeadDedupKey(lead: Partial<TelecallerLead> & { id?: string }): string {
  if (!lead) return "";

  const rawBookingId = lead.bookingId || (lead as any).artistBookingId;
  const bid = rawBookingId ? cleanId(String(rawBookingId)) : (lead.id?.startsWith("booking_") ? cleanId(lead.id) : "");
  if (bid) {
    return `booking_${bid}`;
  }

  const rawPhone = lead.customerPhone || (lead as any).clientPhone || (lead as any).postedByPhone || (lead as any).phone || (lead as any).mobile || "";
  const phone = rawPhone.replace(/\D/g, "").slice(-10);

  const rawArtist = (
    lead.confirmedArtistName ||
    lead.requestedArtistName ||
    (lead as any).artistName ||
    (lead.matchedArtists && lead.matchedArtists[0]?.artistName) ||
    ""
  ).toLowerCase().trim();
  const artist = (rawArtist === "कलाकार" || rawArtist === "artist") ? "" : rawArtist.replace(/[^a-z0-9]/gi, "");

  const rawDate = (lead.eventDate || (lead as any).date || "").trim();
  const date = (rawDate === "तारीख TBD" || rawDate === "तारीख चर्चाधीन" || rawDate === "tbd") ? "" : rawDate.slice(0, 10).replace(/[^0-9]/g, "");

  const rawName = (lead.customerName || (lead as any).clientName || (lead as any).postedByName || "").toLowerCase().trim();
  const name = (rawName === "customer" || rawName === "ग्राहक") ? "" : rawName.replace(/[^a-z0-9]/gi, "");

  if (phone && phone.length >= 10) {
    if (artist) return `ph_${phone}_art_${artist}`;
    if (date) return `ph_${phone}_dt_${date}`;
    return `ph_${phone}`;
  }

  if (name && name.length >= 3) {
    if (artist) return `name_${name}_art_${artist}`;
    if (date) return `name_${name}_dt_${date}`;
    return `name_${name}`;
  }

  return lead.id ? cleanId(lead.id) : "";
}

export function subscribeTelecallerLeads(callback: (leads: TelecallerLead[]) => void) {
  let telecallerLeads: TelecallerLead[] = getLocalLeads().map((l) => sanitizeLead(l.id, l));
  let inquiryLeads: TelecallerLead[] = [];
  let bookingLeads: TelecallerLead[] = [];
  let artistBookingLeads: TelecallerLead[] = [];
  let eventBriefLeads: TelecallerLead[] = [];

  const publishCombined = () => {
    const map = new Map<string, TelecallerLead>();
    const deletedIds = getDeletedLeadIds();

    const isExcluded = (l: any): boolean => {
      if (!l || !l.id) return true;
      const cid = cleanId(l.id);
      const dedupKey = getLeadDedupKey(l);
      const bid = l.bookingId ? cleanId(l.bookingId) : "";

      if (
        deletedIds.has(l.id) ||
        (cid && deletedIds.has(cid)) ||
        (Boolean(dedupKey) && deletedIds.has(dedupKey)) ||
        (Boolean(bid) && (deletedIds.has(bid) || deletedIds.has(`booking_${bid}`))) ||
        (cid && deletedIds.has(`booking_${cid}`)) ||
        (cid && deletedIds.has(`lead_${cid}`)) ||
        (cid && deletedIds.has(`brief_${cid}`)) ||
        (cid && deletedIds.has(`inquiry_${cid}`)) ||
        l.deleted === true ||
        (l as any).isDeleted === true ||
        l.status === "deleted"
      ) {
        return true;
      }

      if (isDummyLeadRecord(l)) {
        return true;
      }

      return false;
    };

    const findMatchingKey = (l: TelecallerLead): string | null => {
      const lBid = l.bookingId ? cleanId(l.bookingId) : (l.id.startsWith("booking_") ? cleanId(l.id) : cleanId(l.id));
      const lPhone = (l.customerPhone || "").replace(/\D/g, "").slice(-10);
      const lName = (l.customerName || "").toLowerCase().trim();
      const lArtist = (l.confirmedArtistName || l.requestedArtistName || "").toLowerCase().trim();
      const lDate = (l.eventDate || "").slice(0, 10).replace(/[^0-9]/g, "");
      const dedupKey = getLeadDedupKey(l);

      if (map.has(dedupKey)) return dedupKey;

      for (const [key, existing] of map.entries()) {
        const exBid = existing.bookingId ? cleanId(existing.bookingId) : (existing.id.startsWith("booking_") ? cleanId(existing.id) : cleanId(existing.id));
        const exPhone = (existing.customerPhone || "").replace(/\D/g, "").slice(-10);
        const exName = (existing.customerName || "").toLowerCase().trim();
        const exArtist = (existing.confirmedArtistName || existing.requestedArtistName || "").toLowerCase().trim();
        const exDate = (existing.eventDate || "").slice(0, 10).replace(/[^0-9]/g, "");

        // 1. Clean ID or Booking ID matches
        if (lBid && exBid && (lBid === exBid || l.id === existing.id || cleanId(l.id) === cleanId(existing.id))) {
          return key;
        }

        // 2. Phone match (10 digits)
        if (lPhone && lPhone.length >= 10 && exPhone && exPhone.length >= 10 && lPhone === exPhone) {
          const artistMatches = !lArtist || !exArtist || lArtist === exArtist || lArtist === "कलाकार" || exArtist === "कलाकार";
          const dateMatches = !lDate || !exDate || lDate === exDate;
          if (artistMatches || dateMatches) {
            return key;
          }
        }

        // 3. Customer name match + artist or date match
        if (
          lName &&
          lName.length >= 3 &&
          lName !== "customer" &&
          lName !== "ग्राहक" &&
          exName &&
          exName === lName
        ) {
          const artistMatches = lArtist && exArtist && (lArtist === exArtist || lArtist === "कलाकार" || exArtist === "कलाकार");
          const dateMatches = lDate && exDate && lDate === exDate;
          if (artistMatches || dateMatches) {
            return key;
          }
        }
      }

      return null;
    };

    const setMapLead = (l: TelecallerLead) => {
      if (isExcluded(l)) return;

      const targetKey = findMatchingKey(l) || getLeadDedupKey(l) || cleanId(l.id);
      const existing = map.get(targetKey);

      if (!existing) {
        map.set(targetKey, l);
      } else {
        const statusPriority: Record<LeadStatus, number> = {
          booked: 5,
          artist_confirmed: 4,
          quote_sent: 3,
          contacting_artists: 2,
          new: 1,
          cancelled: 0,
        };

        const effectiveStatus = (statusPriority[l.status] || 0) >= (statusPriority[existing.status] || 0)
          ? l.status
          : existing.status;

        const bestBudget = Math.max(Number(l.budget || 0), Number(existing.budget || 0));
        
        // Preserve explicit/verified artistOfferBudget
        const bestArtistOffer = (typeof l.artistOfferBudget === "number" && l.artistOfferBudget > 0 && l.isVerifiedByTelecaller)
          ? l.artistOfferBudget
          : (typeof existing.artistOfferBudget === "number" && existing.artistOfferBudget > 0 && existing.isVerifiedByTelecaller)
          ? existing.artistOfferBudget
          : (typeof l.artistOfferBudget === "number" && l.artistOfferBudget > 0 && l.artistOfferBudget < bestBudget)
          ? l.artistOfferBudget
          : (typeof existing.artistOfferBudget === "number" && existing.artistOfferBudget > 0 && existing.artistOfferBudget < bestBudget)
          ? existing.artistOfferBudget
          : (typeof l.artistOfferBudget === "number" && l.artistOfferBudget > 0)
          ? l.artistOfferBudget
          : (typeof existing.artistOfferBudget === "number" && existing.artistOfferBudget > 0)
          ? existing.artistOfferBudget
          : (bestBudget > 0 ? Math.round(bestBudget * 0.8) : undefined);
        const bestPhone = (l.customerPhone && l.customerPhone.replace(/\D/g, "").length >= 10) ? l.customerPhone : (existing.customerPhone || l.customerPhone);
        const bestEmail = l.customerEmail || existing.customerEmail;
        const bestDate = (l.eventDate && l.eventDate !== "तारीख TBD" && l.eventDate !== "तारीख चर्चाधीन") ? l.eventDate : existing.eventDate;
        const bestTime = l.eventTime || existing.eventTime;
        const bestLocation = (l.eventLocation && l.eventLocation !== "महाराष्ट्र") ? l.eventLocation : (existing.eventLocation || l.eventLocation);
        const bestVenue = l.venueAddress || existing.venueAddress;
        const bestNotes = l.telecallerNotes || existing.telecallerNotes || l.specialNotes || existing.specialNotes;
        const bestBookingId = l.bookingId || existing.bookingId;
        const bestCustomerId = l.customerId || existing.customerId;

        const isGenericName = (n?: string) => !n || n.toLowerCase() === "customer" || n.toLowerCase() === "ग्राहक";
        const bestCustomerName = !isGenericName(l.customerName)
          ? l.customerName
          : !isGenericName(existing.customerName)
          ? existing.customerName
          : l.customerName || existing.customerName || "Customer";

        const isGenericArtist = (a?: string) => !a || a.toLowerCase() === "कलाकार" || a.toLowerCase() === "artist";
        const bestArtist = !isGenericArtist(l.confirmedArtistName)
          ? l.confirmedArtistName
          : !isGenericArtist(l.requestedArtistName)
          ? l.requestedArtistName
          : !isGenericArtist(existing.confirmedArtistName)
          ? existing.confirmedArtistName
          : !isGenericArtist(existing.requestedArtistName)
          ? existing.requestedArtistName
          : l.confirmedArtistName || existing.confirmedArtistName || l.requestedArtistName || existing.requestedArtistName;

        const bestEventType = (l.eventType && l.eventType !== "General Event" && l.eventType !== "Event Requirement")
          ? l.eventType
          : (existing.eventType && existing.eventType !== "General Event" && existing.eventType !== "Event Requirement")
          ? existing.eventType
          : l.eventType || existing.eventType;

        const bestSubCategory = (l.subCategory && !l.subCategory.includes("General") && !l.subCategory.includes("Event Requirement"))
          ? l.subCategory
          : (existing.subCategory && !existing.subCategory.includes("General") && !existing.subCategory.includes("Event Requirement"))
          ? existing.subCategory
          : l.subCategory || existing.subCategory;

        // Merge matchedArtists list without duplicate artists
        const combinedArtists = [...(existing.matchedArtists || []), ...(l.matchedArtists || [])];
        const uniqueArtistsMap = new Map<string, MatchedArtistCall>();
        combinedArtists.forEach((a) => {
          const aKey = a.artistId || a.artistName;
          if (aKey) {
            uniqueArtistsMap.set(aKey, { ...(uniqueArtistsMap.get(aKey) || {}), ...a });
          }
        });

        map.set(targetKey, {
          ...existing,
          ...l,
          id: existing.id || l.id,
          bookingId: bestBookingId,
          customerId: bestCustomerId,
          customerName: bestCustomerName,
          budget: bestBudget,
          artistOfferBudget: bestArtistOffer,
          customerPhone: bestPhone,
          customerEmail: bestEmail,
          eventType: bestEventType,
          subCategory: bestSubCategory,
          eventDate: bestDate,
          eventTime: bestTime,
          eventLocation: bestLocation,
          venueAddress: bestVenue,
          requestedArtistName: bestArtist,
          confirmedArtistName: l.confirmedArtistName || existing.confirmedArtistName || (!isGenericArtist(bestArtist) ? bestArtist : undefined),
          confirmedArtistId: l.confirmedArtistId || existing.confirmedArtistId,
          confirmedPrice: l.confirmedPrice || existing.confirmedPrice || l.budget || existing.budget,
          leadType: l.leadType === "book_artist" || existing.leadType === "book_artist" ? "book_artist" : l.leadType,
          status: effectiveStatus,
          telecallerNotes: l.telecallerNotes || existing.telecallerNotes,
          specialNotes: l.specialNotes || existing.specialNotes,
          isVerifiedByTelecaller: Boolean(l.isVerifiedByTelecaller || existing.isVerifiedByTelecaller),
          matchedArtists: Array.from(uniqueArtistsMap.values()),
        });
      }
    };

    // Process collections in consistent hierarchy: telecaller_leads -> bookings -> artist_bookings -> inquiries -> briefs -> local
    telecallerLeads.forEach(setMapLead);
    bookingLeads.forEach(setMapLead);
    artistBookingLeads.forEach(setMapLead);
    inquiryLeads.forEach(setMapLead);
    eventBriefLeads.forEach(setMapLead);

    // Apply local overrides
    getLocalLeads().forEach((l) => {
      if (isExcluded(l)) return;
      const sanitized = sanitizeLead(l.id, l);
      setMapLead(sanitized);
    });

    const combined = Array.from(map.values())
      .filter((l) => !isExcluded(l))
      .sort((a, b) => getTimeMs(b.createdAt) - getTimeMs(a.createdAt));

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

  // 4. Real-time sync listener for artist_bookings
  const qArtistBookings = query(collection(db, "artist_bookings"), limit(50));
  const unsubArtistBookings = onSnapshot(
    qArtistBookings,
    (snapshot) => {
      artistBookingLeads = snapshot.docs.map((docSnap) => sanitizeLead(`booking_${docSnap.id}`, docSnap.data()));
      publishCombined();
    },
    () => {
      publishCombined();
    }
  );

  // 5. Real-time sync listener for eventBriefs
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

  // 6. Listen for custom window events & storage events for instantaneous local sync
  const handleLocalEvent = () => {
    publishCombined();
  };

  window.addEventListener("mykalakar_booking_created", handleLocalEvent);
  window.addEventListener("mykalakar_lead_created", handleLocalEvent);
  window.addEventListener("mykalakar_lead_updated", handleLocalEvent);
  window.addEventListener("mykalakar_lead_status_changed", handleLocalEvent);
  window.addEventListener("storage", handleLocalEvent);

  return () => {
    unsubLeads();
    unsubInquiries();
    unsubBookings();
    unsubArtistBookings();
    unsubBriefs();
    window.removeEventListener("mykalakar_booking_created", handleLocalEvent);
    window.removeEventListener("mykalakar_lead_created", handleLocalEvent);
    window.removeEventListener("mykalakar_lead_updated", handleLocalEvent);
    window.removeEventListener("mykalakar_lead_status_changed", handleLocalEvent);
    window.removeEventListener("storage", handleLocalEvent);
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
  eventTime?: string;
  eventLocation: string;
  venueAddress?: string;
  budget?: number;
  artistOfferBudget?: number;
  message?: string;
  artistId?: string;
  artistName?: string;
}): Promise<void> {
  const createdAtIso = new Date().toISOString();
  const leadId = inquiry.id || (inquiry.bookingId ? `booking_${inquiry.bookingId}` : `lead_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);

  const effectiveCategory = inquiry.serviceCategory || inquiry.category || inquiry.eventType || "General Event";
  const effectiveSubCategory = inquiry.selectedService || inquiry.subCategory || (inquiry.artistName ? `Artist Booking (${inquiry.artistName})` : "General Inquiry");

  const rawBudget = Number(inquiry.budget || 0);
  const budget = rawBudget > 0 ? rawBudget : 0;
  const artistOfferBudget = inquiry.artistOfferBudget && Number(inquiry.artistOfferBudget) > 0
    ? Number(inquiry.artistOfferBudget)
    : (budget > 0 ? Math.round(budget * 0.8) : 0);

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
    eventTime: inquiry.eventTime || "",
    eventLocation: inquiry.eventLocation || "",
    venueAddress: inquiry.venueAddress || "",
    budget,
    artistOfferBudget,
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
            quotedPrice: artistOfferBudget,
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

  // 2. Write to Firestore telecaller_leads using setDoc so deterministic ID is preserved
  try {
    await setDoc(doc(db, LEADS_COLLECTION, leadId), {
      ...newLead,
      createdAt: createdAtIso,
    });
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
        if (confirmedArtist.price > 0) {
          lead.confirmedPrice = confirmedArtist.price;
        }
      }
    }
  });

  // If not found in localList or budget is missing, check other local storages
  if (!targetLead || !targetLead.budget) {
    try {
      const extraKeys = [
        "mykalakar_local_bookings",
        "mykalakar_customer_bookings",
        "mykalakar_local_inquiries",
        "mykalakar_inquiries",
      ];
      for (const k of extraKeys) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            const found = list.find((item: any) => item && (item.id === leadId || cleanId(item.id) === cleanId(leadId) || item.bookingId === leadId || cleanId(item.bookingId) === cleanId(leadId)));
            if (found) {
              const bgt = Number(found.budget || found.amount || found.authorizedAmount || found.confirmedPrice || 0);
              if (!targetLead) {
                targetLead = sanitizeLead(leadId, found);
                targetLead.status = status;
                targetLead.telecallerStatus = status;
                localList.push(targetLead);
              } else if (bgt > 0 && (!targetLead.budget || targetLead.budget === 0)) {
                targetLead.budget = bgt;
                targetLead.confirmedPrice = targetLead.confirmedPrice || bgt;
              }
              break;
            }
          }
        }
      }
    } catch {}
  }

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

  const effectiveBudget = Number(targetLead?.budget || targetLead?.bookingAmount || 0);
  const effectivePrice = Number(
    (confirmedArtist && confirmedArtist.price > 0 ? confirmedArtist.price : undefined) ||
    (targetLead?.confirmedPrice && targetLead.confirmedPrice > 0 ? targetLead.confirmedPrice : undefined) ||
    (effectiveBudget > 0 ? effectiveBudget : undefined) ||
    0
  );

  const updatePayload: Record<string, any> = {
    status,
    telecallerStatus: status,
    bookingStatus: bookingStatusToSet,
    updatedAt: serverTimestamp(),
  };
  if (confirmedArtist) {
    updatePayload.confirmedArtistId = confirmedArtist.artistId;
    updatePayload.confirmedArtistName = confirmedArtist.artistName;
    if (effectivePrice > 0) {
      updatePayload.confirmedPrice = effectivePrice;
    }
  }

  // Calculate Commission & Profit Split if deal has value or is being closed
  const bookingAmt = Number(effectiveBudget || effectivePrice || 0);
  const artistAmt = Number((confirmedArtist && confirmedArtist.price > 0 ? confirmedArtist.price : undefined) || targetLead?.artistOfferBudget || (bookingAmt > 0 ? Math.round(bookingAmt * 0.8) : 0));

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
    updatedAt: serverTimestamp(),
  };
  if (effectivePrice > 0) {
    bookingDocPayload.confirmedPrice = effectivePrice;
  }
  if (effectiveBudget > 0) {
    bookingDocPayload.budget = effectiveBudget;
    bookingDocPayload.amount = effectiveBudget;
    bookingDocPayload.authorizedAmount = effectiveBudget;
    if (!bookingDocPayload.confirmedPrice) {
      bookingDocPayload.confirmedPrice = effectiveBudget;
    }
  } else if (effectivePrice > 0) {
    bookingDocPayload.budget = effectivePrice;
    bookingDocPayload.amount = effectivePrice;
    bookingDocPayload.authorizedAmount = effectivePrice;
  }
  if (confirmedArtist) {
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

  // 1. Calculate live commission split & artist payout
  const localList = getLocalLeads();
  const existingLead = localList.find((l) => cleanId(l.id) === cid || l.id === leadId);

  const finalBudget = Number(
    (typeof updatedData.budget === "number" && updatedData.budget > 0 ? updatedData.budget : undefined) ||
    existingLead?.budget ||
    0
  );

  const finalArtistPayout = Number(
    (typeof updatedData.artistOfferBudget === "number" && updatedData.artistOfferBudget > 0 ? updatedData.artistOfferBudget : undefined) ||
    (typeof updatedData.artistPayout === "number" && updatedData.artistPayout > 0 ? updatedData.artistPayout : undefined) ||
    existingLead?.artistOfferBudget ||
    existingLead?.artistPayout ||
    (finalBudget > 0 ? Math.round(finalBudget * 0.8) : 0)
  );

  let splitData: Partial<TelecallerLead> = {};
  if (finalBudget > 0) {
    const split = calculateCommissionSplit(finalBudget, finalArtistPayout);
    splitData = {
      bookingAmount: split.bookingAmount,
      artistPayout: split.artistPayout,
      grossMargin: split.grossMargin,
      telecallerCommission: split.telecallerCommission,
      telecallerCommissionPct: split.telecallerCommissionPct,
      ownerProfit: split.ownerProfit,
      ownerProfitPct: split.ownerProfitPct,
      commissionSplitType: split.splitType,
    };
  }

  const mergedData: Partial<TelecallerLead> = {
    ...splitData,
    ...updatedData,
    artistOfferBudget: finalArtistPayout,
    artistPayout: finalArtistPayout,
    isVerifiedByTelecaller: true,
  };

  // 2. Immediately update local storage cache
  let found = false;
  localList.forEach((l) => {
    if (cleanId(l.id) === cid || l.id === leadId) {
      Object.assign(l, mergedData);
      found = true;
    }
  });

  if (!found) {
    localList.push({
      id: leadId,
      ...mergedData,
    } as any);
  }

  try {
    localStorage.setItem(LOCAL_LEADS_KEY, JSON.stringify(localList.slice(0, 100)));
  } catch (e) {
    console.warn("Local storage update warning:", e);
  }

  // 3. Write to Firestore
  const updatePayload: Record<string, any> = {
    ...mergedData,
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

export async function deleteLead(leadOrId: string | TelecallerLead): Promise<void> {
  const leadObj: Partial<TelecallerLead> = typeof leadOrId === "object" ? leadOrId : { id: leadOrId };
  const leadId = leadObj.id || "";
  const cid = cleanId(leadId);
  const realDocId = cid || leadId;
  const dedupKey = getLeadDedupKey(leadObj);
  const bookingId = leadObj.bookingId ? cleanId(leadObj.bookingId) : "";

  // 1. Record in persistent tombstone blacklist (specific IDs only)
  if (leadId) recordDeletedLeadId(leadId);
  if (cid) recordDeletedLeadId(cid);
  if (dedupKey) recordDeletedLeadId(dedupKey);
  if (bookingId) {
    recordDeletedLeadId(bookingId);
    recordDeletedLeadId(`booking_${bookingId}`);
  }

  // 2. Remove from all local storage keys
  const storageKeys = [
    LOCAL_LEADS_KEY,
    "mykalakar_local_telecaller_leads",
    "mykalakar_telecaller_leads",
    "mykalakar_local_bookings",
    "mykalakar_customer_bookings",
    "mykalakar_local_inquiries",
    "mykalakar_inquiries",
    "mykalakar_event_briefs",
  ];

  storageKeys.forEach((key) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((item: any) => {
            if (!item) return false;
            const itemId = String(item.id || "");
            const itemCid = cleanId(itemId);
            const itemBookingId = String(item.bookingId || item.artistBookingId || "");
            const itemBookingCid = cleanId(itemBookingId);
            const itemDedupKey = getLeadDedupKey(item);

            if (leadId && (itemId === leadId || itemCid === cid)) return false;
            if (bookingId && (itemBookingId === bookingId || itemBookingCid === bookingId)) return false;
            if (dedupKey && itemDedupKey === dedupKey) return false;
            return true;
          });
          localStorage.setItem(key, JSON.stringify(filtered));
        }
      }
    } catch {
      // Ignore
    }
  });

  // 3. Update Firestore with deleted tombstone flags AND delete doc
  const collections = [LEADS_COLLECTION, "inquiries", "bookings", "artist_bookings", "eventBriefs", "event_briefs"];
  const tombstonePayload = { deleted: true, isDeleted: true, status: "deleted" };

  const deletePromises: Promise<any>[] = [];

  // Direct doc deletes
  collections.forEach((col) => {
    if (realDocId) {
      deletePromises.push(setDoc(doc(db, col, realDocId), tombstonePayload, { merge: true }).catch(() => {}));
      deletePromises.push(deleteDoc(doc(db, col, realDocId)).catch(() => {}));
    }
    if (leadId && leadId !== realDocId) {
      deletePromises.push(setDoc(doc(db, col, leadId), tombstonePayload, { merge: true }).catch(() => {}));
      deletePromises.push(deleteDoc(doc(db, col, leadId)).catch(() => {}));
    }
  });

  // Query and delete related docs by bookingId
  if (bookingId) {
    ["bookings", "artist_bookings", "inquiries", LEADS_COLLECTION].forEach((col) => {
      deletePromises.push(
        getDocs(query(collection(db, col), where("bookingId", "==", bookingId)))
          .then((snap) => {
            snap.forEach((d) => {
              recordDeletedLeadId(d.id);
              setDoc(d.ref, tombstonePayload, { merge: true }).catch(() => {});
              deleteDoc(d.ref).catch(() => {});
            });
          })
          .catch(() => {})
      );
      if (col === "inquiries") {
        deletePromises.push(
          getDocs(query(collection(db, "inquiries"), where("artistBookingId", "==", bookingId)))
            .then((snap) => {
              snap.forEach((d) => {
                recordDeletedLeadId(d.id);
                setDoc(d.ref, tombstonePayload, { merge: true }).catch(() => {});
                deleteDoc(d.ref).catch(() => {});
              });
            })
            .catch(() => {})
        );
      }
    });
  }

  await Promise.allSettled(deletePromises);

  // 4. Dispatch global window event so open pages instantly remove this lead
  window.dispatchEvent(
    new CustomEvent("mykalakar_lead_deleted", {
      detail: { leadId, cleanId: cid, dedupKey, bookingId },
    })
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

export async function updateLeadCustomCommission(
  leadId: string,
  commissionData: {
    telecallerCommission: number;
    telecallerCommissionPct: number;
    ownerProfit: number;
    ownerProfitPct: number;
    commissionSplitType?: CommissionSplitType;
    artistPayout?: number;
    grossMargin?: number;
    customCommissionOverride: boolean;
    adminCommissionNotes?: string;
  }
): Promise<void> {
  const localList = getLocalLeads();
  const realDocId = cleanId(leadId);

  localList.forEach((lead) => {
    if (lead.id === leadId || cleanId(lead.id) === realDocId) {
      Object.assign(lead, commissionData);
    }
  });

  try {
    localStorage.setItem(LOCAL_LEADS_KEY, JSON.stringify(localList.slice(0, 100)));
  } catch (e) {
    console.warn("Local storage commission update warning:", e);
  }

  const updatePayload: Record<string, any> = {
    ...commissionData,
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, LEADS_COLLECTION, realDocId), updatePayload, { merge: true });
    await setDoc(doc(db, LEADS_COLLECTION, leadId), updatePayload, { merge: true });
    if (leadId.startsWith("booking_")) {
      await setDoc(doc(db, "bookings", realDocId), updatePayload, { merge: true });
    } else if (leadId.startsWith("brief_")) {
      await setDoc(doc(db, "eventBriefs", realDocId), updatePayload, { merge: true });
    } else {
      await setDoc(doc(db, "inquiries", realDocId), updatePayload, { merge: true });
    }
  } catch (e) {
    console.warn("Firestore custom commission error:", e);
  }
}


