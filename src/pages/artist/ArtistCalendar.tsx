import { useState } from "react";
import { motion } from "framer-motion";
import { ArtistCalendarView } from "@/components/artist-bookings/ArtistCalendarView";
import { BookingDetailModal } from "@/components/artist-bookings/BookingDetailModal";
import { useArtistBookings } from "@/hooks/useArtistBookings";
import type { BookingEvent } from "@/types/booking";

export default function ArtistCalendar() {
  const { bookings, availability, updateStatus } = useArtistBookings();
  const [selectedBooking, setSelectedBooking] = useState<BookingEvent | null>(null);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold">Calendar</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track pending, confirmed, completed, and cancelled bookings by event date.</p>
      </motion.div>

      <ArtistCalendarView bookings={bookings} availability={availability} onBookingSelect={setSelectedBooking} />

      <BookingDetailModal
        booking={selectedBooking}
        open={Boolean(selectedBooking)}
        onOpenChange={(open) => !open && setSelectedBooking(null)}
        onStatusChange={updateStatus}
      />
    </div>
  );
}
