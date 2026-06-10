import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
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
  if (typeof status !== "string") return "PENDING_ARTIST_RESPONSE";
  const upper = status.toUpperCase();
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
  return {
    id,
    artistId: String(data.artistId || data.artistUid || ""),
    clientName: String(data.clientName || data.customerName || ""),
    clientPhone: String(data.clientPhone || data.customerPhone || data.phone || ""),
    clientAddress: String(data.clientAddress || data.customerAddress || ""),
    venueLocation: String(data.venueLocation || data.eventLocation || data.location || ""),
    eventDate: normalizeDateOnly(String(data.eventDate || data.date || "")),
    performanceType: String(data.performanceType || data.eventType || ""),
    additionalNotes: String(data.additionalNotes || data.message || ""),
    status: normalizeStatus(data.status),
    createdAt: dateToIso(data.createdAt),
    updatedAt: dateToIso(data.updatedAt),
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
    isEscrowReleased: data.isEscrowReleased !== undefined ? Boolean(data.isEscrowReleased) : undefined,
    counterOfferAmount: data.counterOfferAmount ? Number(data.counterOfferAmount) : undefined,
    counterOfferNotes: data.counterOfferNotes ? String(data.counterOfferNotes) : undefined,
    originalAmount: data.originalAmount ? Number(data.originalAmount) : undefined,
    disputeNotes: data.disputeNotes ? String(data.disputeNotes) : undefined,
    counterOfferDate: data.counterOfferDate ? String(data.counterOfferDate) : undefined,
    counterOfferStartTime: data.counterOfferStartTime ? String(data.counterOfferStartTime) : undefined,
    counterOfferEndTime: data.counterOfferEndTime ? String(data.counterOfferEndTime) : undefined,
    counterOfferLocation: data.counterOfferLocation ? String(data.counterOfferLocation) : undefined,
    isPaymentCaptured: data.isPaymentCaptured !== undefined ? Boolean(data.isPaymentCaptured) : undefined,
    escrowState: data.escrowState || undefined,
    disputedBy: data.disputedBy || undefined,
    disputeCategory: data.disputeCategory || undefined,
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

import { getDocs } from "firebase/firestore";

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

export async function checkArtistAvailability(
  artistId: string,
  eventDate: string,
  eventStartTime?: string,
  eventEndTime?: string
) {
  const normalizedDate = normalizeDateOnly(eventDate);

  // 1. Check blocked dates
  const blockQuery = query(
    collection(db, AVAILABILITY_COLLECTION),
    where("artistId", "==", artistId),
    where("blockedDate", "==", normalizedDate)
  );
  const blockSnap = await getDocs(blockQuery);
  if (!blockSnap.empty) {
    return { available: false, reason: "The artist has blocked this date for events." };
  }

  // 2. Check bookings on the same date
  const bookingQuery = query(
    collection(db, BOOKING_COLLECTION),
    where("artistId", "==", artistId),
    where("eventDate", "==", normalizedDate)
  );
  const bookingSnap = await getDocs(bookingQuery);
  const bookings = bookingSnap.docs.map((doc) => normalizeBooking(doc.id, doc.data()));
  
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
        return {
          available: false,
          reason: `The artist already has a ${statusText} on this date at that time (${booking.eventStartTime || "All Day"} - ${booking.eventEndTime || "All Day"}).`
        };
      }
    }
  }

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

  const newBookingRef = doc(collection(db, BOOKING_COLLECTION));
  bookingPayload.id = newBookingRef.id;

  const artistRef = doc(db, "artists", input.artistId);

  await withTimeout(
    runTransaction(db, async (transaction) => {
      // 1. Transactional read of the artist profile to lock it and serialize writes
      await transaction.get(artistRef);

      // 2. Perform availability check inside transaction block
      const availability = await checkArtistAvailability(
        input.artistId,
        input.eventDate,
        input.eventStartTime,
        input.eventEndTime
      );
      if (!availability.available) {
        throw new Error(availability.reason || "The selected time slot is no longer available.");
      }

      // 3. Write booking document and update artist lock
      transaction.set(newBookingRef, sanitizePayload(bookingPayload));
      transaction.set(artistRef, { lastBookingTimestamp: now }, { merge: true });
    }),
    FIREBASE_WRITE_TIMEOUT_MS,
    "Creating the booking is taking too long due to high load. Please try again."
  );

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

export function subscribeArtistBookings(
  artistId: string,
  onData: (bookings: BookingEvent[]) => void,
  onError?: (error: unknown) => void
) {
  const bookingsQuery = query(collection(db, BOOKING_COLLECTION), where("artistId", "==", artistId));
  return onSnapshot(
    bookingsQuery,
    (snapshot) => {
      const bookings = mapSnapshot(snapshot, normalizeBooking).sort(
        (a, b) => new Date(a.eventDate || a.createdAt).getTime() - new Date(b.eventDate || b.createdAt).getTime()
      );
      checkAndReleaseExpiredHolds(bookings).catch(console.error);
      onData(bookings);
    },
    onError
  );
}

export function subscribeCustomerBookings(
  customerId: string,
  onData: (bookings: BookingEvent[]) => void,
  onError?: (error: unknown) => void
) {
  const bookingsQuery = query(collection(db, BOOKING_COLLECTION), where("customerId", "==", customerId));
  return onSnapshot(
    bookingsQuery,
    (snapshot) => {
      const bookings = mapSnapshot(snapshot, normalizeBooking).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      checkAndReleaseExpiredHolds(bookings).catch(console.error);
      onData(bookings);
    },
    onError
  );
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
  switch (status) {
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
  await withTimeout(
    updateDoc(doc(db, BOOKING_COLLECTION, booking.id), {
      status,
      updatedAt: now,
      ...extraFields,
    }),
    FIREBASE_WRITE_TIMEOUT_MS,
    "Updating the booking is taking too long. Please try again."
  );

  // Sync confirmed bookings to public availability node for masking
  if (status === "CONFIRMED" || status === "EVENT_COMPLETED") {
    try {
      await setDoc(doc(db, AVAILABILITY_COLLECTION, `booking_${booking.id}`), {
        artistId: booking.artistId,
        blockedDate: booking.eventDate,
        reason: "Booked",
        createdAt: now,
        updatedAt: now,
      });
    } catch (err) {
      console.warn("Failed to sync availability block:", err);
    }
  } else if (["CANCELLED_BY_ARTIST", "CANCELLED_BY_CLIENT", "REJECTED"].includes(status)) {
    try {
      await deleteDoc(doc(db, AVAILABILITY_COLLECTION, `booking_${booking.id}`));
    } catch (err) {
      // Ignore if it doesn't exist
    }
  }

  const notification = notificationForStatus(status);
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
  } catch (err) {
    console.error("Error fetching refund policy:", err);
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
