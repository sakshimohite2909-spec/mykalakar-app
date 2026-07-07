import type { BookingEvent, BookingStatus } from "@/types/booking";
import { BookingListView } from "@/components/artist-bookings/BookingListView";

export function UpcomingEvents({
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
      emptyTitle="No upcoming performances scheduled."
      emptyDescription="Confirmed future bookings will appear here."
      onBookingSelect={onBookingSelect}
      onStatusChange={onStatusChange}
    />
  );
}
