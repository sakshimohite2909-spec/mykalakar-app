import { CalendarDays, Eye, MapPin, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BookingEvent } from "@/types/booking";
import { BookingStatusBadge } from "@/components/artist-bookings/BookingStatusBadge";

function formatDate(date: string) {
  if (!date) return "Date not provided";
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ArtistAgendaList({
  bookings,
  onBookingSelect,
  className,
}: {
  bookings: BookingEvent[];
  onBookingSelect: (booking: BookingEvent) => void;
  className?: string;
}) {
  const futureBookings = [...bookings].sort(
    (a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
  );

  if (futureBookings.length === 0) {
    return (
      <Card className={cn("border-dashed border-border/70 bg-card/60", className)}>
        <CardContent className="p-8 text-center">
          <CalendarDays className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <h3 className="font-semibold">No upcoming bookings yet.</h3>
          <p className="mt-1 text-sm text-muted-foreground">Future booking requests will appear in this agenda.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {futureBookings.map((booking) => (
        <Card key={booking.id} className="border-border/60 bg-card/75 shadow-sm backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-2">
                <p className="inline-flex items-center gap-2 text-sm font-bold">
                  <CalendarDays className="h-4 w-4 text-[#FF6B00]" />
                  {formatDate(booking.eventDate)}
                </p>
                <p className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#FF6B00]" />
                  <span className="min-w-0 break-words">{booking.venueLocation || "Venue not provided"}</span>
                </p>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Music2 className="h-4 w-4 text-[#FF6B00]" />
                  <span className="truncate">{booking.performanceType || "Performance"}</span>
                </p>
              </div>
              <BookingStatusBadge status={booking.status} />
            </div>
            <Button
              variant="outline"
              className="mt-4 w-full justify-center"
              onClick={() => onBookingSelect(booking)}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
