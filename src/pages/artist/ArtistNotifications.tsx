import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { NotificationsPanel } from "@/components/artist-bookings/NotificationsPanel";
import { useArtistBookings } from "@/hooks/useArtistBookings";

export default function ArtistNotifications() {
  const { notifications, summary, loadingNotifications } = useArtistBookings();

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold">Notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">Live updates for new inquiries and booking lifecycle changes.</p>
      </motion.div>

      <Card className="border-border/60 bg-card/75 shadow-sm backdrop-blur-xl">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FF6B00]/10">
            <Bell className="h-5 w-5 text-[#FF6B00]" />
          </div>
          <div>
            <p className="text-2xl font-bold">{summary.unreadNotifications}</p>
            <p className="text-sm text-muted-foreground">Unread notifications</p>
          </div>
        </CardContent>
      </Card>

      <NotificationsPanel notifications={notifications} loading={loadingNotifications} />
    </div>
  );
}
