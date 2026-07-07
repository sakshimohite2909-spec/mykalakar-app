import type { Timestamp } from "firebase/firestore";

export type BookingStatus =
  | "DRAFT"
  | "PAYMENT_AUTHORIZED"
  | "PENDING_ARTIST_RESPONSE"
  | "ARTIST_REVIEW"
  | "CONFIRMED"
  | "REJECTED"
  | "COUNTER_OFFER_SENT"
  | "EVENT_COMPLETED"
  | "PAYOUT_RELEASED"
  | "SOFT_HOLD_ACTIVE"
  | "PENDING_CLIENT_APPROVAL"
  | "CANCELLED_BY_CLIENT"
  | "CANCELLED_BY_ARTIST"
  | "AUTO_EXPIRED"
  | "REFUND_PROCESSED"
  | "DISPUTE_OPENED"
  | "DISPUTE_RESOLVED"
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled";

export interface BookingEvent {
  id: string;
  artistId: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  venueLocation: string;
  eventDate: string;
  performanceType: string;
  additionalNotes: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  customerId?: string;
  customerEmail?: string;
  artistName?: string;
  inquiryId?: string;
  clientWhatsapp?: string;
  eventStartTime?: string;
  eventEndTime?: string;
  specialRequirements?: string;
  holdExpiryTime?: string;
  paymentGateway?: "stripe" | "razorpay" | "paypal" | "adyen";
  authorizedAmount?: number;
  isEscrowReleased?: boolean;
  counterOfferAmount?: number;
  counterOfferNotes?: string;
  originalAmount?: number;
  disputeNotes?: string;
  
  // Phase 2 Counter Offer adjustments:
  counterOfferDate?: string;
  counterOfferStartTime?: string;
  counterOfferEndTime?: string;
  counterOfferLocation?: string;

  // Phase 2 Escrow & disputes:
  isPaymentCaptured?: boolean;
  escrowState?: "HELD" | "RELEASED" | "LOCKED";
  disputedBy?: "client" | "artist";
  disputeCategory?: string;
  disputeEvidenceUrl?: string;
  splitRefundAmount?: number;

  // Phase 3 SLA deadlines:
  slaStartTime?: string;
  slaDeadlineTime?: string;
}

export interface RefundPolicy {
  thirtyPlusDays: number;
  fifteenToThirtyDays: number;
  sevenToFourteenDays: number;
  lessThanSevenDays: number;
}

export interface ArtistAvailabilityBlock {
  id: string;
  artistId: string;
  blockedDate: string;
  reason: string;
  createdAt?: string;
  updatedAt?: string;
}

export type BookingNotificationType =
  | "new_inquiry"
  | "booking_accepted"
  | "booking_declined"
  | "booking_completed";

export interface BookingNotification {
  id: string;
  artistId: string;
  bookingId?: string;
  recipientId?: string;
  type: BookingNotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export type FirestoreDateLike = string | Date | Timestamp | null | undefined;

export interface AdminAuditLog {
  id: string;
  adminEmail: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface NotificationLog {
  id: string;
  bookingId: string;
  recipient: string;
  channel: "IN_APP" | "PUSH" | "EMAIL" | "SMS" | "WHATSAPP";
  message: string;
  status: "SENT" | "DELIVERED";
  timestamp: string;
  priority: "NORMAL" | "HIGH";
}

