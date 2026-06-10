import { Badge } from "@/components/ui/badge";
import type { BookingStatus } from "@/types/booking";

const STATUS_META: Record<BookingStatus, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "#78716C" },
  PAYMENT_AUTHORIZED: { label: "Payment Authorized", color: "#6366F1" },
  PENDING_ARTIST_RESPONSE: { label: "Pending Response", color: "#8B5CF6" },
  ARTIST_REVIEW: { label: "Under Review", color: "#A855F7" },
  CONFIRMED: { label: "Confirmed", color: "#FF6B00" },
  REJECTED: { label: "Rejected", color: "#EF4444" },
  COUNTER_OFFER_SENT: { label: "Counter Offer", color: "#F59E0B" },
  EVENT_COMPLETED: { label: "Event Completed", color: "#10B981" },
  PAYOUT_RELEASED: { label: "Escrow Released", color: "#059669" },
  SOFT_HOLD_ACTIVE: { label: "Soft Hold Active", color: "#0EA5E9" },
  PENDING_CLIENT_APPROVAL: { label: "Pending Your Approval", color: "#F59E0B" },
  CANCELLED_BY_CLIENT: { label: "Cancelled by Client", color: "#F43F5E" },
  CANCELLED_BY_ARTIST: { label: "Cancelled by Artist", color: "#E11D48" },
  AUTO_EXPIRED: { label: "Expired", color: "#71717A" },
  REFUND_PROCESSED: { label: "Refunded", color: "#14B8A6" },
  DISPUTE_OPENED: { label: "Dispute Opened", color: "#DC2626" },
  DISPUTE_RESOLVED: { label: "Dispute Resolved", color: "#22C55E" },
  pending: { label: "Pending", color: "#A0A0A0" },
  confirmed: { label: "Confirmed", color: "#FF6B00" },
  completed: { label: "Completed", color: "#22C55E" },
  cancelled: { label: "Cancelled", color: "#EF4444" },
};

export function getStatusMeta(status: BookingStatus) {
  return STATUS_META[status] || STATUS_META.pending;
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const meta = getStatusMeta(status);

  return (
    <Badge
      variant="outline"
      className="rounded-full border px-2.5 py-1 text-xs font-semibold"
      style={{
        borderColor: `${meta.color}55`,
        backgroundColor: `${meta.color}1A`,
        color: meta.color,
      }}
    >
      {meta.label}
    </Badge>
  );
}
