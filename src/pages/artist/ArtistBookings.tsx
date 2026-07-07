import { useState } from "react";
import { motion } from "framer-motion";
import { useArtistBookings } from "@/hooks/useArtistBookings";
import { BookingSummaryCards } from "@/components/artist-bookings/BookingSummaryCards";
import { BookingListView } from "@/components/artist-bookings/BookingListView";
import { BookingDetailModal } from "@/components/artist-bookings/BookingDetailModal";
import type { BookingEvent } from "@/types/booking";

export default function ArtistBookings() {
  const { bookings, summary, loadingBookings, updateStatus } = useArtistBookings();
  const [selectedBooking, setSelectedBooking] = useState<BookingEvent | null>(null);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold">My Bookings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review inquiries, manage booking status, and keep your events moving.</p>
      </motion.div>

      <BookingSummaryCards summary={summary} loading={loadingBookings} />

      <BookingListView
        bookings={bookings}
        loading={loadingBookings}
        emptyTitle="No bookings yet."
        emptyDescription="When a customer sends an inquiry, it will appear here instantly."
        onBookingSelect={setSelectedBooking}
        onStatusChange={updateStatus}
      />

      <BookingDetailModal
        booking={selectedBooking}
        open={Boolean(selectedBooking)}
        onOpenChange={(open) => !open && setSelectedBooking(null)}
        onStatusChange={updateStatus}
      />
    </div>
  );
}
