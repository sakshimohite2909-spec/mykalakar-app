import { motion } from "framer-motion";
import { ArtistAvailability } from "@/components/artist-bookings/ArtistAvailability";
import { useArtistBookings } from "@/hooks/useArtistBookings";

export default function ArtistAvailabilityPage() {
  const { artistId, availability, loadingAvailability } = useArtistBookings();

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold">Availability</h1>
        <p className="mt-1 text-sm text-muted-foreground">Block dates, vacation days, and unavailable windows before they become conflicts.</p>
      </motion.div>

      <ArtistAvailability artistId={artistId} availability={availability} loading={loadingAvailability} />
    </div>
  );
}
