import { useState } from "react";
import { motion } from "framer-motion";
import { BookingDetailModal } from "@/components/artist-bookings/BookingDetailModal";
import { UpcomingEvents } from "@/components/artist-bookings/UpcomingEvents";
import { useArtistBookings } from "@/hooks/useArtistBookings";
import type { BookingEvent } from "@/types/booking";

export default function ArtistUpcomingEvents() {
  const { upcomingEvents, loadingBookings, updateStatus } = useArtistBookings();
  const [selectedBooking, setSelectedBooking] = useState<BookingEvent | null>(null);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold">Upcoming Events</h1>
        <p className="mt-1 text-sm text-muted-foreground">Confirmed future performances are listed here by date.</p>
      </motion.div>

      <UpcomingEvents
        bookings={upcomingEvents}
        loading={loadingBookings}
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
