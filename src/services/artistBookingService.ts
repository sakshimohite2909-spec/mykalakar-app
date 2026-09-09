import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  onSnapshot,
  query,
  updateDoc,
  where,
  runTransaction,
  type DocumentData,
  type QuerySnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  FIREBASE_WRITE_TIMEOUT_MS,
  sanitizePayload,
  withTimeout,
} from "@/lib/firebaseSafe";
import type {
  ArtistAvailabilityBlock,
  BookingEvent,
  BookingNotification,
  BookingNotificationType,
  BookingStatus,
  FirestoreDateLike,
  RefundPolicy,
} from "@/types/booking";

export interface CreateBookingInput {
  artistId: string;
  artistName?: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  venueLocation: string;
  eventDate: string;
  performanceType: string;
  additionalNotes: string;
  customerId?: string;
  customerEmail?: string;
  clientWhatsapp?: string;
  eventStartTime?: string;
  eventEndTime?: string;
  specialRequirements?: string;
  holdExpiryTime?: string;
  paymentGateway?: "stripe" | "razorpay" | "paypal" | "adyen";
  authorizedAmount?: number;
  status?: BookingStatus;
  paymentStatus?: string;
  selectedService?: string;
  serviceCategory?: string;
  serviceEvent?: string;
}

const BOOKING_COLLECTION = "bookings";
const AVAILABILITY_COLLECTION = "artist_availability";
const NOTIFICATION_COLLECTION = "notifications";

function generatedId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function dateToIso(value: FirestoreDateLike): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return "";
}

function normalizeDateOnly(value: string) {
  if (!value) return "";
  return value.includes("T") ? value.slice(0, 10) : value;
}

function normalizeStatus(status: unknown): BookingStatus {
  if (typeof status !== "string") return "PENDING_TELECALLER_VERIFICATION";
  const upper = status.toUpperCase();
  if (upper === "PENDING_TELECALLER_VERIFICATION") return "PENDING_TELECALLER_VERIFICATION";
  if (upper === "PAYMENT_PENDING") return "PAYMENT_PENDING";
  if (upper === "PENDING" || upper === "PENDING_ARTIST_RESPONSE") return "PENDING_ARTIST_RESPONSE";
  if (upper === "CONFIRMED") return "CONFIRMED";
  if (upper === "COMPLETED" || upper === "EVENT_COMPLETED") return "EVENT_COMPLETED";
  if (upper === "CANCELLED" || upper === "CANCELLED_BY_ARTIST") return "CANCELLED_BY_ARTIST";
  if (upper === "ACCEPTED") return "CONFIRMED";
  if (upper === "DECLINED" || upper === "REJECTED") return "REJECTED";
  return upper as BookingStatus;
}

function mapSnapshot<T>(snapshot: QuerySnapshot<DocumentData>, mapper: (id: string, data: DocumentData) => T) {
  return snapshot.docs.map((item) => mapper(item.id, item.data()));
}

export function normalizeBooking(id: string, data: DocumentData): BookingEvent {
  const status = normalizeStatus(data.status);
  const eventDate = normalizeDateOnly(String(data.eventDate || ""));
  const createdDate = dateToIso(data.createdAt || data.date);
  const updatedDate = dateToIso(data.updatedAt) || createdDate;

  return {
    id,
    artistId: String(data.artistId || data.artistUID || ""),
    clientName: String(data.clientName || data.name || data.customerName || "Customer"),
    clientPhone: String(data.clientPhone || data.phone || data.customerPhone || "Phone not provided"),
    clientAddress: String(data.clientAddress || data.address || data.customerAddress || ""),
    venueLocation: String(data.venueLocation || data.location || data.eventLocation || "Location not provided"),
    eventDate,
    performanceType: String(data.performanceType || data.artForm || data.service || data.eventType || "Performance"),
    additionalNotes: String(data.additionalNotes || data.message || data.notes || ""),
    status,
    createdAt: createdDate,
    updatedAt: updatedDate,
    customerId: data.customerId ? String(data.customerId) : undefined,
    customerEmail: data.customerEmail ? String(data.customerEmail) : undefined,
    artistName: data.artistName ? String(data.artistName) : undefined,
    inquiryId: data.inquiryId ? String(data.inquiryId) : undefined,
    clientWhatsapp: data.clientWhatsapp ? String(data.clientWhatsapp) : undefined,
    eventStartTime: data.eventStartTime ? String(data.eventStartTime) : undefined,
    eventEndTime: data.eventEndTime ? String(data.eventEndTime) : undefined,
    specialRequirements: data.specialRequirements ? String(data.specialRequirements) : undefined,
    holdExpiryTime: data.holdExpiryTime ? String(data.holdExpiryTime) : undefined,
    paymentGateway: data.paymentGateway || undefined,
    authorizedAmount: data.authorizedAmount ? Number(data.authorizedAmount) : undefined,
    confirmedPrice: data.confirmedPrice ? Number(data.confirmedPrice) : undefined,
    telecallerStatus: data.telecallerStatus ? String(data.telecallerStatus) : undefined,
    isEscrowReleased: Boolean(data.isEscrowReleased),
    selectedService: data.selectedService ? String(data.selectedService) : undefined,
    serviceCategory: data.serviceCategory ? String(data.serviceCategory) : undefined,
    serviceEvent: data.serviceEvent ? String(data.serviceEvent) : undefined,
    counterOfferAmount: data.counterOfferAmount ? Number(data.counterOfferAmount) : undefined,
    counterOfferNotes: data.counterOfferNotes ? String(data.counterOfferNotes) : undefined,
    originalAmount: data.originalAmount ? Number(data.originalAmount) : undefined,
    disputeNotes: data.disputeNotes ? String(data.disputeNotes) : undefined,
    counterOfferDate: data.counterOfferDate ? normalizeDateOnly(String(data.counterOfferDate)) : undefined,
    counterOfferStartTime: data.counterOfferStartTime ? String(data.counterOfferStartTime) : undefined,
    counterOfferEndTime: data.counterOfferEndTime ? String(data.counterOfferEndTime) : undefined,
    counterOfferLocation: data.counterOfferLocation ? String(data.counterOfferLocation) : undefined,
    isPaymentCaptured: Boolean(data.isPaymentCaptured),
    escrowState: data.escrowState || undefined,
    disputedBy: data.disputedBy || undefined,
    disputeCategory: data.disputeCategory ? String(data.disputeCategory) : undefined,
    refundPolicy: (data.refundPolicy as RefundPolicy) || undefined,
    refundAmount: data.refundAmount ? Number(data.refundAmount) : undefined,
    disputeEvidenceUrl: data.disputeEvidenceUrl || undefined,
    splitRefundAmount: data.splitRefundAmount ? Number(data.splitRefundAmount) : undefined,
    slaStartTime: data.slaStartTime ? String(data.slaStartTime) : undefined,
    slaDeadlineTime: data.slaDeadlineTime ? String(data.slaDeadlineTime) : undefined,
  };
}

export function normalizeAvailability(id: string, data: DocumentData): ArtistAvailabilityBlock {
  return {
    id,
    artistId: String(data.artistId || ""),
    blockedDate: normalizeDateOnly(String(data.blockedDate || "")),
    reason: String(data.reason || ""),
    createdAt: dateToIso(data.createdAt),
    updatedAt: dateToIso(data.updatedAt),
  };
}

export function normalizeNotification(id: string, data: DocumentData): BookingNotification {
  return {
    id,
    artistId: String(data.artistId || ""),
    bookingId: data.bookingId ? String(data.bookingId) : undefined,
    recipientId: data.recipientId ? String(data.recipientId) : undefined,
    type: String(data.type || "new_inquiry") as BookingNotificationType,
    title: String(data.title || "Notification"),
    message: String(data.message || ""),
    read: Boolean(data.read),
    createdAt: dateToIso(data.createdAt),
  };
}

export function buildBookingPayload(input: CreateBookingInput): BookingEvent {
  const now = new Date().toISOString();
  return {
    id: generatedId(),
    artistId: input.artistId,
    clientName: input.clientName,
    clientPhone: input.clientPhone,
    clientAddress: input.clientAddress,
    venueLocation: input.venueLocation,
    eventDate: normalizeDateOnly(input.eventDate),
    performanceType: input.performanceType,
    additionalNotes: input.additionalNotes,
    status: input.status || "PENDING_ARTIST_RESPONSE",
    createdAt: now,
    updatedAt: now,
    customerId: input.customerId,
    customerEmail: input.customerEmail,
    artistName: input.artistName,
    clientWhatsapp: input.clientWhatsapp,
    eventStartTime: input.eventStartTime,
    eventEndTime: input.eventEndTime,
    specialRequirements: input.specialRequirements,
    holdExpiryTime: input.holdExpiryTime,
    paymentGateway: input.paymentGateway,
    authorizedAmount: input.authorizedAmount,
    selectedService: input.selectedService,
    serviceCategory: input.serviceCategory,
    serviceEvent: input.serviceEvent,
    slaStartTime: input.status === "PENDING_ARTIST_RESPONSE" ? now : undefined,
    slaDeadlineTime: input.status === "PENDING_ARTIST_RESPONSE" ? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() : undefined,
  };
}

export async function checkAndReleaseExpiredHolds(bookings: BookingEvent[]) {
  const now = new Date().toISOString();
  const expiredHoldStatuses: BookingStatus[] = ["SOFT_HOLD_ACTIVE", "PAYMENT_AUTHORIZED", "PENDING_ARTIST_RESPONSE"];
  
  for (const booking of bookings) {
    const isHoldExpired = expiredHoldStatuses.includes(booking.status) &&
      booking.holdExpiryTime &&
      booking.holdExpiryTime < now;

    const isSlaExpired = booking.status === "PENDING_ARTIST_RESPONSE" &&
      booking.slaDeadlineTime &&
      booking.slaDeadlineTime < now;

    if (isHoldExpired || isSlaExpired) {
      console.log(`Booking ${booking.id} expired (Hold: ${isHoldExpired}, SLA: ${isSlaExpired}). Auto-expiring...`);
      try {
        await updateArtistBookingStatus(booking, "AUTO_EXPIRED");
      } catch (e) {
        console.error(`Failed to auto-expire booking ${booking.id}:`, e);
      }
    }
  }
}

function parseTimeToMinutes(timeStr?: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(":");
  if (parts.length < 2) return 0;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return hours * 60 + minutes;
}

export function checkTimeOverlap(
  start1?: string,
  end1?: string,
  start2?: string,
  end2?: string
): boolean {
  if (!start1 || !end1 || !start2 || !end2) {
    return true; // Assume overlap if times are unspecified (takes full day)
  }
  const s1 = parseTimeToMinutes(start1);
  const e1 = parseTimeToMinutes(end1);
  const s2 = parseTimeToMinutes(start2);
  const e2 = parseTimeToMinutes(end2);
  return s1 < e2 && s2 < e1;
}

export interface ArtistMatchCriteria {
  artistId?: string;
  artistName?: string;
  ids?: string[];
  names?: string[];
  emails?: string[];
  phones?: string[];
  categories?: string[];
}

export async function checkArtistAvailability(
  artistId: string,
  eventDate: string,
  eventStartTime?: string,
  eventEndTime?: string
) {
  const normalizedDate = normalizeDateOnly(eventDate);

  console.log("checkArtistAvailability input params:", {
    artistId,
    selectedDate: normalizedDate,
    startTime: eventStartTime || "unspecified",
    endTime: eventEndTime || "unspecified",
  });

  // 1. Check blocked dates
  try {
    const blockQuery = query(
      collection(db, AVAILABILITY_COLLECTION),
      where("artistId", "==", artistId),
      where("blockedDate", "==", normalizedDate)
    );
    const blockSnap = await getDocs(blockQuery);
    if (!blockSnap.empty) {
      const blockData = blockSnap.docs[0].data();
      const isBooked = blockData.reason === "Booked";
      const reason = isBooked
        ? "The artist is already booked on this date."
        : (blockData.reason || "The artist has blocked this date for events.");
      console.log("checkArtistAvailability result: Artist unavailable due to block:", {
        reason,
        blockData
      });
      return { available: false, reason };
    }
  } catch (err) {
    console.warn("Could not check blocked availability from Firestore:", err);
  }

  // 2. Check bookings on the same date
  let bookings: BookingEvent[] = [];
  try {
    const bookingQuery = query(
      collection(db, BOOKING_COLLECTION),
      where("artistId", "==", artistId),
      where("eventDate", "==", normalizedDate)
    );
    const bookingSnap = await getDocs(bookingQuery);
    bookings = bookingSnap.docs.map((doc) => normalizeBooking(doc.id, doc.data()));
    console.log("checkArtistAvailability fetched bookings:", bookings);
  } catch (error) {
    console.warn("Could not fetch bookings from Firestore (likely due to security rules):", error);
  }
  
  const now = new Date().toISOString();
  for (const booking of bookings) {
    const isConfirmed = booking.status === "CONFIRMED";
    const activeHoldStatuses: BookingStatus[] = ["SOFT_HOLD_ACTIVE", "PAYMENT_AUTHORIZED", "PENDING_ARTIST_RESPONSE"];
    const isHoldActive = activeHoldStatuses.includes(booking.status) &&
      booking.holdExpiryTime &&
      booking.holdExpiryTime > now;

    if (isConfirmed || isHoldActive) {
      if (checkTimeOverlap(eventStartTime, eventEndTime, booking.eventStartTime, booking.eventEndTime)) {
        const statusText = isConfirmed ? "confirmed booking" : "pending hold";
        const reason = `The artist already has a ${statusText} on this date at that time (${booking.eventStartTime || "All Day"} - ${booking.eventEndTime || "All Day"}).`;
        console.log("checkArtistAvailability result: Time overlap conflict detected:", {
          booking,
          reason,
        });
        return {
          available: false,
          reason
        };
      }
    }
  }

  console.log("checkArtistAvailability result: Artist is available.");
  return { available: true };
}

export async function createArtistBooking(input: CreateBookingInput) {
  const now = new Date().toISOString();
  const slaDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  
  const bookingPayload = buildBookingPayload({
    ...input,
    status: input.status || "PENDING_ARTIST_RESPONSE",
  });
  bookingPayload.slaStartTime = now;
  bookingPayload.slaDeadlineTime = slaDeadline;

  // 1. Perform availability check completely before initiating the transaction block
  try {
    const availability = await checkArtistAvailability(
      input.artistId,
      input.eventDate,
      input.eventStartTime,
      input.eventEndTime
    );
    if (!availability.available) {
      throw new Error(availability.reason || "The selected time slot is no longer available.");
    }
  } catch (availErr: any) {
    if (availErr?.message?.includes("longer available") || availErr?.message?.includes("booked")) {
      throw availErr;
    }
    console.warn("Availability pre-check bypassed due to network/permission warning:", availErr);
  }

  const newBookingRef = doc(collection(db, BOOKING_COLLECTION));
  bookingPayload.id = newBookingRef.id;

  const artistRef = doc(db, "artists", input.artistId);
  const reservationRef = doc(db, "booking_reservations", `${input.artistId}_${normalizeDateOnly(input.eventDate)}`);

  try {
    await withTimeout(
      runTransaction(db, async (transaction) => {
        // 1. Transactional read of the artist profile
        const aSnap = await transaction.get(artistRef);

        // 2. Perform direct get on reservation ledger to assert lock safety
        const reservationSnap = await transaction.get(reservationRef);

        // 3. Write/update reservation ledger inside transaction to serialize concurrent bookings
        if (!reservationSnap.exists()) {
          transaction.set(reservationRef, {
            artistId: input.artistId,
            reservationDate: normalizeDateOnly(input.eventDate),
            holds: [bookingPayload.id],
            customerIds: [input.customerId || ""],
            updatedAt: now,
          });
        } else {
          const resData = reservationSnap.data() || {};
          const holds = resData.holds || [];
          const customerIds = resData.customerIds || [];
          if (!holds.includes(bookingPayload.id)) {
            holds.push(bookingPayload.id);
          }
          const custId = input.customerId || "";
          if (custId && !customerIds.includes(custId)) {
            customerIds.push(custId);
          }
          transaction.update(reservationRef, {
            holds,
            customerIds,
            updatedAt: now,
          });
        }

        // 4. Write booking document and update artist lock
        transaction.set(newBookingRef, sanitizePayload(bookingPayload));
        if (aSnap.exists()) {
          transaction.set(artistRef, { lastBookingTimestamp: now }, { merge: true });
        }
      }),
      FIREBASE_WRITE_TIMEOUT_MS,
      "Creating the booking is taking too long due to high load. Please try again."
    );
  } catch (txErr) {
    console.warn("Transaction failed or was denied permissions, writing booking directly:", txErr);
    // Write directly to bookings collection so booking is never lost
    await setDoc(newBookingRef, sanitizePayload(bookingPayload)).catch((directErr) => {
      console.warn("Direct booking setDoc warning:", directErr);
    });
  }

  // Cache in local storage for instant offline & cross-tab sync
  try {
    const localKey = "mykalakar_local_bookings";
    const existingRaw = localStorage.getItem(localKey);
    const existing = existingRaw ? JSON.parse(existingRaw) : [];
    const filtered = existing.filter((b: any) => b.id !== bookingPayload.id);
    filtered.unshift(bookingPayload);
    localStorage.setItem(localKey, JSON.stringify(filtered.slice(0, 100)));
    window.dispatchEvent(new CustomEvent("mykalakar_booking_created", { detail: bookingPayload }));
  } catch (e) {
    // Ignore local storage error
  }

  await createBookingNotification({
    artistId: input.artistId,
    bookingId: bookingPayload.id,
    recipientId: input.artistId,
    type: "new_inquiry",
    title: "New Booking Request Received",
    message: `${input.clientName || "A customer"} requested ${input.performanceType || "a performance"} on ${normalizeDateOnly(input.eventDate)}.`,
    priority: "HIGH",
  }).catch((error) => {
    console.warn("New inquiry notification could not be created:", error);
  });

  return bookingPayload;
}

export async function deleteArtistBooking(bookingId: string, booking?: BookingEvent) {
  const cleanId = bookingId.replace(/^(booking_|brief_|lead_|inquiry_)/, "");
  const collectionsToTry = [BOOKING_COLLECTION, "inquiries", "telecaller_leads", "artist_bookings"];
  const deletePromises: Promise<any>[] = [];

  // 1. Delete direct document IDs
  collectionsToTry.forEach((col) => {
    deletePromises.push(deleteDoc(doc(db, col, cleanId)).catch(() => {}));
    deletePromises.push(deleteDoc(doc(db, col, bookingId)).catch(() => {}));
  });

  // 2. Query and delete any matching documents in all collections by phone/clientName
  if (booking?.clientPhone && booking.clientPhone !== "Phone not provided") {
    const phone = booking.clientPhone.trim();
    collectionsToTry.forEach((col) => {
      const q = query(collection(db, col), where("clientPhone", "==", phone));
      const qCust = query(collection(db, col), where("customerPhone", "==", phone));
      const qPhone = query(collection(db, col), where("phone", "==", phone));
      [q, qCust, qPhone].forEach((subQ) => {
        deletePromises.push(
          getDocs(subQ).then((snap) => {
            snap.forEach((d) => deleteDoc(d.ref).catch(() => {}));
          }).catch(() => {})
        );
      });
    });
  }

  await Promise.allSettled(deletePromises);

  // 3. Clear from all local storage caches
  try {
    const storageKeys = [
      "mykalakar_local_telecaller_leads",
      "mykalakar_telecaller_leads",
      "mykalakar_local_bookings",
      "mykalakar_local_inquiries",
      "mykalakar_inquiries",
      "mykalakar_customer_bookings",
    ];
    storageKeys.forEach((key) => {
      const rawLocal = localStorage.getItem(key);
      if (rawLocal) {
        const parsed = JSON.parse(rawLocal);
        const filtered = parsed.filter((l: any) => {
          const lId = String(l.id || "");
          const lPhone = String(l.clientPhone || l.customerPhone || l.phone || "").trim();
          if (lId === bookingId || lId === cleanId) return false;
          if (booking?.clientPhone && lPhone && lPhone === booking.clientPhone.trim()) return false;
          return true;
        });
        localStorage.setItem(key, JSON.stringify(filtered));
      }
    });
    window.dispatchEvent(new CustomEvent("mykalakar_booking_created"));
  } catch (e) {
    // Ignore error
  }
}

export function subscribeArtistBookings(
  artistIdOrCriteria: string | ArtistMatchCriteria,
  artistNameOrCb?: string | ((bookings: BookingEvent[]) => void),
  onDataOrErr?: ((bookings: BookingEvent[]) => void) | ((error: unknown) => void),
  onError?: (error: unknown) => void
) {
  const isCriteriaObj = typeof artistIdOrCriteria === "object" && artistIdOrCriteria !== null;
  const criteria: ArtistMatchCriteria = isCriteriaObj
    ? artistIdOrCriteria
    : {
        artistId: typeof artistIdOrCriteria === "string" ? artistIdOrCriteria : "",
        artistName: typeof artistNameOrCb === "string" ? artistNameOrCb : "",
      };

  const onData: ((bookings: BookingEvent[]) => void) | undefined =
    typeof artistNameOrCb === "function"
      ? artistNameOrCb
      : typeof onDataOrErr === "function"
      ? (onDataOrErr as any)
      : undefined;

  const actualOnError: ((error: unknown) => void) | undefined =
    typeof artistNameOrCb === "function"
      ? (onDataOrErr as any)
      : typeof onDataOrErr === "function" && !onError
      ? undefined
      : onError;

  let firestoreBookings: BookingEvent[] = [];
  let inquiryBookings: BookingEvent[] = [];
  let telecallerBookings: BookingEvent[] = [];
  let legacyArtistBookings: BookingEvent[] = [];

  // Build match sets
  const criteriaIds: string[] = [];
  if (criteria.artistId) criteriaIds.push(criteria.artistId.trim().toLowerCase());
  if (Array.isArray(criteria.ids)) {
    criteria.ids.forEach((id) => {
      const trimmed = String(id || "").trim().toLowerCase();
      if (trimmed && !criteriaIds.includes(trimmed)) criteriaIds.push(trimmed);
    });
  }

  const criteriaNames: string[] = [];
  if (criteria.artistName) criteriaNames.push(criteria.artistName.trim());
  if (Array.isArray(criteria.names)) {
    criteria.names.forEach((name) => {
      const trimmed = String(name || "").trim();
      if (trimmed && !criteriaNames.includes(trimmed)) criteriaNames.push(trimmed);
    });
  }

  const nameTokens: string[] = [];
  criteriaNames.forEach((n) => {
    const parts = n.toLowerCase().split(/[\s,._\-/()]+/);
    parts.forEach((p) => {
      const clean = p.trim();
      if (clean.length >= 3 && !nameTokens.includes(clean)) {
        nameTokens.push(clean);
      }
    });
  });

  const criteriaEmails: string[] = [];
  if (Array.isArray(criteria.emails)) {
    criteria.emails.forEach((email) => {
      const clean = String(email || "").trim().toLowerCase();
      if (clean && !criteriaEmails.includes(clean)) criteriaEmails.push(clean);
    });
  }

  const criteriaPhones: string[] = [];
  if (Array.isArray(criteria.phones)) {
    criteria.phones.forEach((phone) => {
      const digits = String(phone || "").replace(/\D/g, "").slice(-10);
      if (digits && !criteriaPhones.includes(digits)) criteriaPhones.push(digits);
    });
  }

  const criteriaCategories: string[] = [];
  if (Array.isArray(criteria.categories)) {
    criteria.categories.forEach((cat) => {
      const clean = String(cat || "").trim().toLowerCase();
      if (clean && !criteriaCategories.includes(clean)) criteriaCategories.push(clean);
    });
  }

  const isMatchForArtist = (data: any, docId: string) => {
    if (!data) return false;
    // Reject dummy/empty docs that have no client info at all
    const clientName = data.clientName || data.customerName;
    const clientPhone = data.clientPhone || data.customerPhone || data.phone;
    const eventDate = data.eventDate || data.date;
    const venue = data.venueLocation || data.eventLocation || data.location;
    if (!clientName && !clientPhone && !eventDate && !venue) {
      return false;
    }

    const docIdLower = docId.toLowerCase();
    const dArtistId = String(data.artistId || data.artistUid || data.confirmedArtistId || data.assignedArtistId || "").toLowerCase().trim();
    const dArtistName = String(data.artistName || data.requestedArtistName || data.confirmedArtistName || data.assignedArtistName || "").toLowerCase().trim();
    const dSubCat = String(data.subCategory || data.selectedService || data.serviceCategory || data.performanceType || "").toLowerCase().trim();
    const dMessage = String(data.message || data.specialNotes || data.specialRequirements || data.additionalNotes || "").toLowerCase().trim();
    const dEmail = String(data.artistEmail || data.assignedArtistEmail || "").toLowerCase().trim();
    const dPhone = String(data.artistPhone || data.artistContactNumber || data.assignedArtistPhone || "").replace(/\D/g, "").slice(-10);

    // 1. Direct ID match
    if (dArtistId && criteriaIds.some((id) => id === dArtistId || dArtistId.includes(id) || id.includes(dArtistId))) {
      return true;
    }
    if (criteriaIds.some((id) => id && (docIdLower.includes(id) || id.includes(docIdLower)))) {
      return true;
    }

    // 2. Email match
    if (dEmail && criteriaEmails.some((email) => email === dEmail)) {
      return true;
    }

    // 3. Phone match
    if (dPhone && criteriaPhones.some((phone) => phone === dPhone)) {
      return true;
    }

    // 4. Exact or substring Name Match
    for (const name of criteriaNames) {
      const lower = name.toLowerCase().trim();
      if (!lower) continue;
      if (dArtistName && (dArtistName.includes(lower) || lower.includes(dArtistName))) {
        return true;
      }
      if (dSubCat && dSubCat.includes(lower)) {
        return true;
      }
      if (dMessage && dMessage.includes(lower)) {
        return true;
      }
    }

    // 5. Tokenized word match (e.g. "Samruddhi" inside "Samruddhi Kirtankar" or "Book Samruddhi")
    for (const token of nameTokens) {
      if (token.length >= 3) {
        if (dArtistName.includes(token) || dSubCat.includes(token) || docIdLower.includes(token)) {
          return true;
        }
      }
    }

    // 6. Matched artists array (from telecaller leads)
    const matchedArr = Array.isArray(data.matchedArtists) ? data.matchedArtists : [];
    for (const m of matchedArr) {
      const mId = String(m.artistId || m.id || "").toLowerCase().trim();
      const mName = String(m.artistName || m.name || "").toLowerCase().trim();
      const mPhone = String(m.artistPhone || m.phone || "").replace(/\D/g, "").slice(-10);

      if (mId && criteriaIds.some((id) => id === mId || mId.includes(id))) return true;
      if (mPhone && criteriaPhones.some((phone) => phone === mPhone)) return true;
      for (const token of nameTokens) {
        if (token.length >= 3 && mName.includes(token)) return true;
      }
      for (const name of criteriaNames) {
        const lower = name.toLowerCase().trim();
        if (lower && (mName.includes(lower) || lower.includes(mName))) return true;
      }
    }

    // 7. Category match if artist name is not specified or generic
    if (!dArtistName || dArtistName === "artist" || dArtistName === "unassigned") {
      for (const cat of criteriaCategories) {
        if (cat.length >= 3 && (dSubCat.includes(cat) || dMessage.includes(cat))) {
          return true;
        }
      }
    }

    return false;
  };

  const publishMerged = () => {
    const map = new Map<string, BookingEvent>();
    const all: BookingEvent[] = [];

    // Local storage leads and bookings override for instant offline/local syncing
    const storageKeys = [
      "mykalakar_local_bookings",
      "mykalakar_local_telecaller_leads",
      "mykalakar_telecaller_leads",
      "mykalakar_local_inquiries",
      "mykalakar_inquiries",
      "mykalakar_customer_bookings",
    ];
    storageKeys.forEach((key) => {
      try {
        const rawLocal = localStorage.getItem(key);
        if (rawLocal) {
          const parsed = JSON.parse(rawLocal);
          if (Array.isArray(parsed)) {
            parsed.forEach((l: any) => {
              if (l && isMatchForArtist(l, String(l.id || ""))) {
                all.push(normalizeBooking(String(l.id || `local_${Date.now()}`), l));
              }
            });
          }
        }
      } catch (e) {
        // Ignore local storage error
      }
    });

    [...firestoreBookings, ...inquiryBookings, ...telecallerBookings, ...legacyArtistBookings, ...all].forEach((b) => {
      // Create canonical deduplication key based on clientPhone + eventDate
      const phoneDigits = (b.clientPhone || "").replace(/\D/g, "").slice(-10);
      const dateKey = (b.eventDate || "").trim();
      const nameKey = (b.clientName || "").trim().toLowerCase();

      const dedupeKey = phoneDigits && dateKey
        ? `${phoneDigits}_${dateKey}`
        : (phoneDigits ? `${phoneDigits}_${nameKey}` : (dateKey && nameKey ? `${nameKey}_${dateKey}` : b.id.replace(/^(booking_|brief_|lead_|inquiry_)/, "")));

      const existing = map.get(dedupeKey);
      if (!existing) {
        map.set(dedupeKey, b);
      } else {
        const priorityB = getStatusPriority(b.status);
        const priorityExisting = getStatusPriority(existing.status);
        const mergedStatus = priorityB >= priorityExisting ? b.status : existing.status;

        const counterOfferAmount = b.counterOfferAmount || existing.counterOfferAmount;
        const counterOfferNotes = b.counterOfferNotes || existing.counterOfferNotes;
        const counterOfferDate = b.counterOfferDate || existing.counterOfferDate;
        const counterOfferStartTime = b.counterOfferStartTime || existing.counterOfferStartTime;
        const counterOfferEndTime = b.counterOfferEndTime || existing.counterOfferEndTime;
        const counterOfferLocation = b.counterOfferLocation || existing.counterOfferLocation;

        map.set(dedupeKey, {
          ...existing,
          ...b,
          status: mergedStatus,
          counterOfferAmount,
          counterOfferNotes,
          counterOfferDate,
          counterOfferStartTime,
          counterOfferEndTime,
          counterOfferLocation,
          clientName: (existing.clientName && existing.clientName !== "Client") ? existing.clientName : b.clientName,
          clientPhone: (existing.clientPhone && existing.clientPhone !== "Phone not provided") ? existing.clientPhone : b.clientPhone,
          venueLocation: (existing.venueLocation && existing.venueLocation !== "Venue not provided") ? existing.venueLocation : b.venueLocation,
        });
      }
    });

    const result = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime()
    );
    if (onData) onData(result);
  };

  // 1. Subscribe to bookings collection
  const unsubBookings = onSnapshot(
    collection(db, BOOKING_COLLECTION),
    (snapshot) => {
      firestoreBookings = snapshot.docs
        .filter((docSnap) => isMatchForArtist(docSnap.data(), docSnap.id))
        .map((docSnap) => normalizeBooking(docSnap.id, docSnap.data()));
      publishMerged();
    },
    (err) => {
      if (actualOnError) actualOnError(err);
      publishMerged();
    }
  );

  // 2. Subscribe to inquiries collection
  const unsubInquiries = onSnapshot(
    collection(db, "inquiries"),
    (snapshot) => {
      inquiryBookings = snapshot.docs
        .filter((docSnap) => isMatchForArtist(docSnap.data(), docSnap.id))
        .map((docSnap) => normalizeBooking(`inquiry_${docSnap.id}`, docSnap.data()));
      publishMerged();
    },
    () => publishMerged()
  );

  // 3. Subscribe to telecaller_leads collection
  const unsubLeads = onSnapshot(
    collection(db, "telecaller_leads"),
    (snapshot) => {
      telecallerBookings = snapshot.docs
        .filter((docSnap) => isMatchForArtist(docSnap.data(), docSnap.id))
        .map((docSnap) => normalizeBooking(`lead_${docSnap.id}`, docSnap.data()));
      publishMerged();
    },
    () => publishMerged()
  );

  // 4. Subscribe to legacy artist_bookings collection
  const unsubLegacy = onSnapshot(
    collection(db, "artist_bookings"),
    (snapshot) => {
      legacyArtistBookings = snapshot.docs
        .filter((docSnap) => isMatchForArtist(docSnap.data(), docSnap.id))
        .map((docSnap) => normalizeBooking(docSnap.id, docSnap.data()));
      publishMerged();
    },
    () => publishMerged()
  );

  const handleLocalChange = () => {
    publishMerged();
  };

  window.addEventListener("storage", handleLocalChange);
  window.addEventListener("mykalakar_booking_created", handleLocalChange);
  window.addEventListener("mykalakar_lead_created", handleLocalChange);
  window.addEventListener("mykalakar_lead_updated", handleLocalChange);

  // Initial local publish
  publishMerged();

  return () => {
    unsubBookings();
    unsubInquiries();
    unsubLeads();
    unsubLegacy();
    window.removeEventListener("storage", handleLocalChange);
    window.removeEventListener("mykalakar_booking_created", handleLocalChange);
    window.removeEventListener("mykalakar_lead_created", handleLocalChange);
    window.removeEventListener("mykalakar_lead_updated", handleLocalChange);
  };
}

function getStatusPriority(status: string): number {
  const s = String(status || "").toUpperCase();
  if (["EVENT_COMPLETED", "COMPLETED", "PAYOUT_RELEASED"].includes(s)) return 100;
  if (["CONFIRMED", "BOOKED", "ARTIST_CONFIRMED", "ACCEPTED"].includes(s)) return 90;
  if (["COUNTER_OFFER_SENT"].includes(s)) return 80;
  if (["PAYMENT_PENDING", "QUOTE_SENT", "PAYMENT_AUTHORIZED"].includes(s)) return 70;
  if (["PENDING_ARTIST_RESPONSE", "PENDING_TELECALLER_VERIFICATION", "SOFT_HOLD_ACTIVE", "ARTIST_REVIEW"].includes(s)) return 60;
  if (["PENDING", "NEW", "CONTACTING_ARTISTS"].includes(s)) return 50;
  if (["CANCELLED_BY_ARTIST", "CANCELLED_BY_CLIENT", "REJECTED", "CANCELLED"].includes(s)) return 40;
  return 10;
}

export interface CustomerMatchCriteria {
  customerId?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
  ids?: string[];
  emails?: string[];
  phones?: string[];
  names?: string[];
}

export function subscribeCustomerBookings(
  customerIdOrCriteria: string | CustomerMatchCriteria,
  onData: (bookings: BookingEvent[]) => void,
  onError?: (error: unknown) => void
) {
  const isCriteriaObj = typeof customerIdOrCriteria === "object" && customerIdOrCriteria !== null;
  const criteria: CustomerMatchCriteria = isCriteriaObj
    ? customerIdOrCriteria
    : { customerId: String(customerIdOrCriteria || "") };

  const criteriaIds: string[] = [];
  if (criteria.customerId) criteriaIds.push(criteria.customerId.trim().toLowerCase());
  if (Array.isArray(criteria.ids)) {
    criteria.ids.forEach((id) => {
      const clean = String(id || "").trim().toLowerCase();
      if (clean && !criteriaIds.includes(clean)) criteriaIds.push(clean);
    });
  }

  const criteriaEmails: string[] = [];
  if (criteria.customerEmail) criteriaEmails.push(criteria.customerEmail.trim().toLowerCase());
  if (Array.isArray(criteria.emails)) {
    criteria.emails.forEach((email) => {
      const clean = String(email || "").trim().toLowerCase();
      if (clean && !criteriaEmails.includes(clean)) criteriaEmails.push(clean);
    });
  }

  const criteriaPhones: string[] = [];
  if (criteria.customerPhone) {
    const digits = String(criteria.customerPhone).replace(/\D/g, "").slice(-10);
    if (digits) criteriaPhones.push(digits);
  }
  if (Array.isArray(criteria.phones)) {
    criteria.phones.forEach((phone) => {
      const digits = String(phone || "").replace(/\D/g, "").slice(-10);
      if (digits && !criteriaPhones.includes(digits)) criteriaPhones.push(digits);
    });
  }

  const criteriaNames: string[] = [];
  if (criteria.customerName) criteriaNames.push(criteria.customerName.trim());
  if (Array.isArray(criteria.names)) {
    criteria.names.forEach((name) => {
      const clean = String(name || "").trim();
      if (clean && !criteriaNames.includes(clean)) criteriaNames.push(clean);
    });
  }

  const nameTokens: string[] = [];
  criteriaNames.forEach((n) => {
    const parts = n.toLowerCase().split(/[\s,._\-/()]+/);
    parts.forEach((p) => {
      const clean = p.trim();
      if (clean.length >= 3 && !nameTokens.includes(clean)) {
        nameTokens.push(clean);
      }
    });
  });

  let firestoreBookings: BookingEvent[] = [];
  let inquiryBookings: BookingEvent[] = [];
  let telecallerBookings: BookingEvent[] = [];
  let legacyArtistBookings: BookingEvent[] = [];

  const isMatchForCustomer = (data: any, docId: string) => {
    if (!data) return false;
    const docIdLower = docId.toLowerCase();
    const dCustId = String(data.customerId || data.customerUid || data.userId || data.uid || data.clientId || "").toLowerCase().trim();
    const dEmail = String(data.customerEmail || data.clientEmail || data.email || "").toLowerCase().trim();
    const dPhone = String(data.clientPhone || data.customerPhone || data.phone || data.clientWhatsapp || "").replace(/\D/g, "").slice(-10);
    const dName = String(data.clientName || data.customerName || data.name || "").toLowerCase().trim();

    // 1. Direct ID match
    if (dCustId && criteriaIds.some((id) => id === dCustId || dCustId.includes(id) || id.includes(dCustId))) {
      return true;
    }
    if (criteriaIds.some((id) => id && (docIdLower.includes(id) || id.includes(docIdLower)))) {
      return true;
    }

    // 2. Email match
    if (dEmail && criteriaEmails.some((email) => email === dEmail)) {
      return true;
    }

    // 3. Phone match
    if (dPhone && criteriaPhones.some((phone) => phone === dPhone)) {
      return true;
    }

    // 4. Exact Name Match
    for (const name of criteriaNames) {
      const lower = name.toLowerCase().trim();
      if (lower && dName && (dName === lower || dName.includes(lower) || lower.includes(dName))) {
        return true;
      }
    }

    // 5. Tokenized Name Match
    for (const token of nameTokens) {
      if (token.length >= 3 && dName && dName.includes(token)) {
        return true;
      }
    }

    return false;
  };

  const publishMerged = () => {
    const map = new Map<string, BookingEvent>();
    const all: BookingEvent[] = [];

    // Local storage overrides
    const storageKeys = [
      "mykalakar_local_bookings",
      "mykalakar_local_telecaller_leads",
      "mykalakar_telecaller_leads",
      "mykalakar_local_inquiries",
      "mykalakar_inquiries",
      "mykalakar_customer_bookings",
    ];
    storageKeys.forEach((key) => {
      try {
        const rawLocal = localStorage.getItem(key);
        if (rawLocal) {
          const parsed = JSON.parse(rawLocal);
          if (Array.isArray(parsed)) {
            parsed.forEach((l: any) => {
              if (l && isMatchForCustomer(l, String(l.id || ""))) {
                all.push(normalizeBooking(String(l.id || `local_${Date.now()}`), l));
              }
            });
          }
        }
      } catch (e) {
        // Ignore JSON error
      }
    });

    [...firestoreBookings, ...inquiryBookings, ...telecallerBookings, ...legacyArtistBookings, ...all].forEach((b) => {
      const phoneDigits = (b.clientPhone || "").replace(/\D/g, "").slice(-10);
      const dateKey = (b.eventDate || "").trim();
      const nameKey = (b.clientName || "").trim().toLowerCase();

      const dedupeKey = phoneDigits && dateKey
        ? `${phoneDigits}_${dateKey}`
        : (phoneDigits ? `${phoneDigits}_${nameKey}` : (dateKey && nameKey ? `${nameKey}_${dateKey}` : b.id.replace(/^(booking_|brief_|lead_|inquiry_)/, "")));

      const existing = map.get(dedupeKey);
      if (!existing) {
        map.set(dedupeKey, b);
      } else {
        const priorityB = getStatusPriority(b.status);
        const priorityExisting = getStatusPriority(existing.status);
        const mergedStatus = priorityB >= priorityExisting ? b.status : existing.status;

        const counterOfferAmount = b.counterOfferAmount || existing.counterOfferAmount;
        const counterOfferNotes = b.counterOfferNotes || existing.counterOfferNotes;
        const counterOfferDate = b.counterOfferDate || existing.counterOfferDate;
        const counterOfferStartTime = b.counterOfferStartTime || existing.counterOfferStartTime;
        const counterOfferEndTime = b.counterOfferEndTime || existing.counterOfferEndTime;
        const counterOfferLocation = b.counterOfferLocation || existing.counterOfferLocation;

        map.set(dedupeKey, {
          ...existing,
          ...b,
          status: mergedStatus,
          counterOfferAmount,
          counterOfferNotes,
          counterOfferDate,
          counterOfferStartTime,
          counterOfferEndTime,
          counterOfferLocation,
          clientName: (existing.clientName && existing.clientName !== "Client") ? existing.clientName : b.clientName,
          clientPhone: (existing.clientPhone && existing.clientPhone !== "Phone not provided") ? existing.clientPhone : b.clientPhone,
          venueLocation: (existing.venueLocation && existing.venueLocation !== "Venue not provided") ? existing.venueLocation : b.venueLocation,
        });
      }
    });

    const result = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime()
    );
    checkAndReleaseExpiredHolds(result).catch(() => {});
    if (onData) onData(result);
  };

  // 1. Subscribe to bookings collection
  const unsubBookings = onSnapshot(
    collection(db, BOOKING_COLLECTION),
    (snapshot) => {
      firestoreBookings = snapshot.docs
        .filter((docSnap) => isMatchForCustomer(docSnap.data(), docSnap.id))
        .map((docSnap) => normalizeBooking(docSnap.id, docSnap.data()));
      publishMerged();
    },
    (err) => {
      if (onError) onError(err);
      publishMerged();
    }
  );

  // 2. Subscribe to inquiries collection
  const unsubInquiries = onSnapshot(
    collection(db, "inquiries"),
    (snapshot) => {
      inquiryBookings = snapshot.docs
        .filter((docSnap) => isMatchForCustomer(docSnap.data(), docSnap.id))
        .map((docSnap) => normalizeBooking(`inquiry_${docSnap.id}`, docSnap.data()));
      publishMerged();
    },
    () => publishMerged()
  );

  // 3. Subscribe to telecaller_leads collection
  const unsubLeads = onSnapshot(
    collection(db, "telecaller_leads"),
    (snapshot) => {
      telecallerBookings = snapshot.docs
        .filter((docSnap) => isMatchForCustomer(docSnap.data(), docSnap.id))
        .map((docSnap) => normalizeBooking(`lead_${docSnap.id}`, docSnap.data()));
      publishMerged();
    },
    () => publishMerged()
  );

  // 4. Subscribe to legacy artist_bookings collection
  const unsubLegacy = onSnapshot(
    collection(db, "artist_bookings"),
    (snapshot) => {
      legacyArtistBookings = snapshot.docs
        .filter((docSnap) => isMatchForCustomer(docSnap.data(), docSnap.id))
        .map((docSnap) => normalizeBooking(docSnap.id, docSnap.data()));
      publishMerged();
    },
    () => publishMerged()
  );

  const handleLocalChange = () => {
    publishMerged();
  };

  window.addEventListener("storage", handleLocalChange);
  window.addEventListener("mykalakar_booking_created", handleLocalChange);
  window.addEventListener("mykalakar_lead_created", handleLocalChange);
  window.addEventListener("mykalakar_lead_updated", handleLocalChange);
  window.addEventListener("mykalakar_lead_status_changed", handleLocalChange);

  // Initial local publish
  publishMerged();

  return () => {
    unsubBookings();
    unsubInquiries();
    unsubLeads();
    unsubLegacy();
    window.removeEventListener("storage", handleLocalChange);
    window.removeEventListener("mykalakar_booking_created", handleLocalChange);
    window.removeEventListener("mykalakar_lead_created", handleLocalChange);
    window.removeEventListener("mykalakar_lead_updated", handleLocalChange);
    window.removeEventListener("mykalakar_lead_status_changed", handleLocalChange);
  };
}

export function subscribeArtistAvailability(
  artistId: string,
  onData: (blocks: ArtistAvailabilityBlock[]) => void,
  onError?: (error: unknown) => void
) {
  const availabilityQuery = query(collection(db, AVAILABILITY_COLLECTION), where("artistId", "==", artistId));
  return onSnapshot(
    availabilityQuery,
    (snapshot) => {
      const blocks = mapSnapshot(snapshot, normalizeAvailability).sort(
        (a, b) => new Date(a.blockedDate).getTime() - new Date(b.blockedDate).getTime()
      );
      onData(blocks);
    },
    onError
  );
}

export function subscribeArtistNotifications(
  artistId: string,
  onData: (notifications: BookingNotification[]) => void,
  onError?: (error: unknown) => void
) {
  const notificationsQuery = query(collection(db, NOTIFICATION_COLLECTION), where("artistId", "==", artistId));
  return onSnapshot(
    notificationsQuery,
    (snapshot) => {
      const notifications = mapSnapshot(snapshot, normalizeNotification).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      onData(notifications);
    },
    onError
  );
}

export function getAvailabilityConflict(
  eventDate: string,
  availability: ArtistAvailabilityBlock[]
) {
  const date = normalizeDateOnly(eventDate);
  return availability.find((block) => block.blockedDate === date) || null;
}

export function getConfirmedBookingConflict(
  booking: BookingEvent,
  bookings: BookingEvent[]
) {
  return bookings.find(
    (item) =>
      item.id !== booking.id &&
      item.artistId === booking.artistId &&
      item.eventDate === booking.eventDate &&
      item.status === "CONFIRMED" &&
      checkTimeOverlap(booking.eventStartTime, booking.eventEndTime, item.eventStartTime, item.eventEndTime)
  ) || null;
}

function notificationForStatus(status: BookingStatus) {
  const norm = normalizeStatus(status);
  switch (norm) {
    case "CONFIRMED":
      return {
        type: "booking_accepted" as const,
        title: "Your booking has been confirmed.",
        message: "The artist accepted your booking request.",
      };
    case "REJECTED":
    case "CANCELLED_BY_ARTIST":
      return {
        type: "booking_declined" as const,
        title: "Your booking request has been declined.",
        message: "The artist declined or cancelled your booking request.",
      };
    case "EVENT_COMPLETED":
      return {
        type: "booking_completed" as const,
        title: "Performance marked as completed.",
        message: "The artist marked this booking as completed.",
      };
    case "COUNTER_OFFER_SENT":
      return {
        type: "new_inquiry" as const,
        title: "New Counter Offer",
        message: "The artist has proposed a counter-offer.",
      };
    default:
      return null;
  }
}

export async function updateArtistBookingStatus(
  booking: BookingEvent,
  status: BookingStatus,
  extraFields: Partial<BookingEvent> = {}
) {
  const now = new Date().toISOString();
  const cleanDocId = booking.id.replace(/^(booking_|brief_|lead_|inquiry_)/, "");
  const normalizedBookingStatus = normalizeStatus(status);

  // 1. Prepare booking update payload
  const bookingPayload = sanitizePayload({
    ...booking,
    status: normalizedBookingStatus,
    updatedAt: now,
    ...extraFields,
  });

  // Determine telecaller lead status mapping
  const upperStatus = String(normalizedBookingStatus).toUpperCase();
  const telecallerStatus =
    upperStatus === "CONFIRMED" || upperStatus === "ACCEPTED"
      ? "artist_confirmed"
      : upperStatus === "PAYMENT_PENDING" || upperStatus === "COUNTER_OFFER_SENT"
      ? "quote_sent"
      : upperStatus === "EVENT_COMPLETED" || upperStatus === "COMPLETED"
      ? "booked"
      : upperStatus.includes("CANCEL") || upperStatus === "REJECTED" || upperStatus === "DECLINED"
      ? "cancelled"
      : "in_progress";

  const leadPayload = sanitizePayload({
    status: telecallerStatus,
    telecallerStatus: telecallerStatus,
    bookingStatus: normalizedBookingStatus,
    updatedAt: now,
    ...extraFields,
  });

  // 2. Perform upserts across Firestore collections safely using setDoc with merge: true
  const writePromises: Promise<any>[] = [];

  // Bookings collection (update clean ID and prefixed ID)
  writePromises.push(
    setDoc(doc(db, BOOKING_COLLECTION, cleanDocId), bookingPayload, { merge: true }).catch(() => {})
  );
  if (booking.id !== cleanDocId) {
    writePromises.push(
      setDoc(doc(db, BOOKING_COLLECTION, booking.id), bookingPayload, { merge: true }).catch(() => {})
    );
  }

  // Telecaller leads collection
  writePromises.push(
    setDoc(doc(db, "telecaller_leads", cleanDocId), leadPayload, { merge: true }).catch(() => {})
  );
  if (booking.id !== cleanDocId) {
    writePromises.push(
      setDoc(doc(db, "telecaller_leads", booking.id), leadPayload, { merge: true }).catch(() => {})
    );
  }

  // Inquiries collection
  writePromises.push(
    setDoc(doc(db, "inquiries", cleanDocId), leadPayload, { merge: true }).catch(() => {})
  );
  if (booking.id !== cleanDocId) {
    writePromises.push(
      setDoc(doc(db, "inquiries", booking.id), leadPayload, { merge: true }).catch(() => {})
    );
  }

  // Also update any matching leads in telecaller_leads by client phone if present
  if (booking.clientPhone && booking.clientPhone !== "Phone not provided") {
    const phone = booking.clientPhone.trim();
    const phoneQueries = [
      query(collection(db, "telecaller_leads"), where("clientPhone", "==", phone)),
      query(collection(db, "telecaller_leads"), where("customerPhone", "==", phone)),
      query(collection(db, "telecaller_leads"), where("phone", "==", phone)),
      query(collection(db, "inquiries"), where("clientPhone", "==", phone)),
      query(collection(db, "inquiries"), where("phone", "==", phone)),
    ];
    phoneQueries.forEach((q) => {
      writePromises.push(
        getDocs(q).then((snap) => {
          snap.forEach((d) => {
            setDoc(d.ref, leadPayload, { merge: true }).catch(() => {});
          });
        }).catch(() => {})
      );
    });
  }

  await withTimeout(
    Promise.allSettled(writePromises),
    FIREBASE_WRITE_TIMEOUT_MS,
    "Updating the booking is taking too long. Please try again."
  );

  // Update local storage cache for all relevant keys
  try {
    const storageKeys = [
      "mykalakar_local_telecaller_leads",
      "mykalakar_telecaller_leads",
      "mykalakar_local_bookings",
      "mykalakar_local_inquiries",
      "mykalakar_inquiries",
      "mykalakar_customer_bookings",
    ];
    storageKeys.forEach((key) => {
      const rawLocal = localStorage.getItem(key);
      if (rawLocal) {
        const parsed = JSON.parse(rawLocal);
        if (Array.isArray(parsed)) {
          const updated = parsed.map((l: any) => {
            const lId = String(l.id || "");
            const lPhone = String(l.clientPhone || l.customerPhone || l.phone || "").trim();
            const matches =
              lId === booking.id ||
              lId === cleanDocId ||
              (booking.clientPhone && lPhone && lPhone === booking.clientPhone.trim());
            if (matches) {
              return {
                ...l,
                ...bookingPayload,
                status: normalizedBookingStatus,
                telecallerStatus,
                bookingStatus: normalizedBookingStatus,
                updatedAt: now,
                ...extraFields,
              };
            }
            return l;
          });
          localStorage.setItem(key, JSON.stringify(updated));
        }
      }
    });

    // Broadcast live event to all listeners
    window.dispatchEvent(new CustomEvent("mykalakar_booking_created", { detail: bookingPayload }));
    window.dispatchEvent(new CustomEvent("mykalakar_lead_status_changed", { detail: bookingPayload }));
    window.dispatchEvent(new CustomEvent("mykalakar_lead_updated", { detail: bookingPayload }));
  } catch (e) {
    // Ignore local storage error
  }

  // Sync confirmed bookings to public availability node for masking
  if (normalizedBookingStatus === "CONFIRMED" || normalizedBookingStatus === "EVENT_COMPLETED") {
    try {
      await setDoc(doc(db, AVAILABILITY_COLLECTION, `booking_${cleanDocId}`), {
        artistId: booking.artistId,
        blockedDate: booking.eventDate,
        reason: "Booked",
        createdAt: now,
        updatedAt: now,
      });
    } catch (err) {
      console.warn("Failed to sync availability block:", err);
    }
  } else if (["CANCELLED_BY_ARTIST", "CANCELLED_BY_CLIENT", "REJECTED"].includes(normalizedBookingStatus)) {
    try {
      await deleteDoc(doc(db, AVAILABILITY_COLLECTION, `booking_${cleanDocId}`));
      if (booking.id !== cleanDocId) {
        await deleteDoc(doc(db, AVAILABILITY_COLLECTION, `booking_${booking.id}`));
      }
    } catch (err) {
      // Ignore if it doesn't exist
    }
  }

  const notification = notificationForStatus(normalizedBookingStatus);
  if (notification) {
    await createBookingNotification({
      artistId: booking.artistId,
      bookingId: booking.id,
      recipientId: booking.customerId,
      ...notification,
    }).catch((error) => {
      console.warn("Booking notification could not be created:", error);
    });
  }
}

export async function addAvailabilityBlock(artistId: string, blockedDate: string, reason: string) {
  const now = new Date().toISOString();
  await withTimeout(
    addDoc(collection(db, AVAILABILITY_COLLECTION), sanitizePayload({
      artistId,
      blockedDate: normalizeDateOnly(blockedDate),
      reason,
      createdAt: now,
      updatedAt: now,
    })),
    FIREBASE_WRITE_TIMEOUT_MS,
    "Saving availability is taking too long. Please try again."
  );
}

export async function deleteAvailabilityBlock(blockId: string) {
  await withTimeout(
    deleteDoc(doc(db, AVAILABILITY_COLLECTION, blockId)),
    FIREBASE_WRITE_TIMEOUT_MS,
    "Removing availability is taking too long. Please try again."
  );
}

export async function markNotificationRead(notificationId: string) {
  await withTimeout(
    updateDoc(doc(db, NOTIFICATION_COLLECTION, notificationId), { read: true }),
    FIREBASE_WRITE_TIMEOUT_MS,
    "Updating the notification is taking too long. Please try again."
  );
}

export async function createBookingNotification(input: {
  artistId: string;
  bookingId?: string;
  recipientId?: string;
  type: BookingNotificationType;
  title: string;
  message: string;
  priority?: "NORMAL" | "HIGH";
}) {
  const now = new Date().toISOString();
  await withTimeout(
    addDoc(collection(db, NOTIFICATION_COLLECTION), sanitizePayload({
      artistId: input.artistId,
      bookingId: input.bookingId || "",
      recipientId: input.recipientId || "",
      type: input.type,
      title: input.title,
      message: input.message,
      read: false,
      createdAt: now,
    })),
    FIREBASE_WRITE_TIMEOUT_MS,
    "Creating notification is taking too long. Please try again."
  );

  // Simulate dispatching multi-channel notifications
  const isHighPriority = input.priority === "HIGH" || [
    "new_inquiry",
    "booking_accepted",
    "booking_declined",
    "booking_completed"
  ].includes(input.type);

  const channelsToSend: ("IN_APP" | "PUSH" | "EMAIL" | "SMS" | "WHATSAPP")[] = ["IN_APP", "EMAIL"];
  if (isHighPriority) {
    channelsToSend.push("PUSH", "SMS", "WHATSAPP");
  }

  for (const channel of channelsToSend) {
    const logPayload = {
      id: generatedId(),
      bookingId: input.bookingId || "unknown",
      recipient: input.recipientId || input.artistId,
      channel,
      message: `[${channel}] ${input.title}: ${input.message}`,
      status: "DELIVERED",
      timestamp: now,
      priority: isHighPriority ? "HIGH" : "NORMAL",
    };
    await withTimeout(
      addDoc(collection(db, "notification_logs"), logPayload),
      FIREBASE_WRITE_TIMEOUT_MS,
      "Creating notification logs failed."
    ).catch((err) => console.warn("Simulated notification log write failed:", err));
  }
}

export async function logAdminActivity(adminEmail: string, action: string, details: string) {
  const now = new Date().toISOString();
  await withTimeout(
    addDoc(collection(db, "admin_audit_logs"), sanitizePayload({
      id: generatedId(),
      adminEmail,
      action,
      details,
      timestamp: now,
    })),
    FIREBASE_WRITE_TIMEOUT_MS,
    "Creating audit log failed."
  ).catch((err) => console.warn("Audit log write failed:", err));
}

export async function fetchRefundPolicy(): Promise<RefundPolicy> {
  const defaultPolicy: RefundPolicy = {
    thirtyPlusDays: 100,
    fifteenToThirtyDays: 75,
    sevenToFourteenDays: 50,
    lessThanSevenDays: 0,
  };
  try {
    const policyDoc = await getDoc(doc(db, "platform_settings", "refund_policy"));
    if (policyDoc.exists()) {
      const data = policyDoc.data();
      return {
        thirtyPlusDays: Number(data.thirtyPlusDays ?? 100),
        fifteenToThirtyDays: Number(data.fifteenToThirtyDays ?? 75),
        sevenToFourteenDays: Number(data.sevenToFourteenDays ?? 50),
        lessThanSevenDays: Number(data.lessThanSevenDays ?? 0),
      };
    }
  } catch (err: any) {
    if (err?.code !== "permission-denied") {
      console.warn("Error fetching refund policy:", err?.message || err);
    }
  }
  return defaultPolicy;
}

export async function saveRefundPolicy(policy: RefundPolicy) {
  await withTimeout(
    setDoc(doc(db, "platform_settings", "refund_policy"), policy, { merge: true }),
    FIREBASE_WRITE_TIMEOUT_MS,
    "Saving refund policy is taking too long."
  );
}

export function calculateRefundPercentage(eventDateStr: string, policy: RefundPolicy): number {
  if (!eventDateStr) return 100;
  const eventDate = new Date(`${eventDateStr}T00:00:00`);
  const today = new Date();
  
  eventDate.setHours(0,0,0,0);
  today.setHours(0,0,0,0);
  
  const diffTime = eventDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays >= 30) {
    return policy.thirtyPlusDays;
  } else if (diffDays >= 15) {
    return policy.fifteenToThirtyDays;
  } else if (diffDays >= 7) {
    return policy.sevenToFourteenDays;
  } else {
    return policy.lessThanSevenDays;
  }
}
