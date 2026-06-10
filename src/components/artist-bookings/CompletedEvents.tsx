import type { BookingEvent, BookingStatus } from "@/types/booking";
import { BookingListView } from "@/components/artist-bookings/BookingListView";

export function CompletedEvents({
  bookings,
  loading,
  onBookingSelect,
  onStatusChange,
}: {
  bookings: BookingEvent[];
  loading?: boolean;
  onBookingSelect: (booking: BookingEvent) => void;
  onStatusChange: (booking: BookingEvent, status: BookingStatus) => Promise<{ success: boolean; message: string }>;
}) {
  return (
    <BookingListView
      bookings={bookings}
      loading={loading}
      emptyTitle="Completed events will appear here."
      emptyDescription="Once a confirmed event is marked completed, it moves into this history."
      onBookingSelect={onBookingSelect}
      onStatusChange={onStatusChange}
      showActions={false}
    />
  );
}
