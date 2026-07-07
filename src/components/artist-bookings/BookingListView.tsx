import { useState } from "react";
import { CalendarDays, Check, Eye, Loader2, MapPin, Music2, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import type { BookingEvent, BookingStatus } from "@/types/booking";
import { BookingStatusBadge } from "@/components/artist-bookings/BookingStatusBadge";

function formatDate(date: string) {
  if (!date) return "Date not provided";
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function BookingListView({
  bookings,
  loading,
  emptyTitle,
  emptyDescription,
  onBookingSelect,
  onStatusChange,
  showActions = true,
}: {
  bookings: BookingEvent[];
  loading?: boolean;
  emptyTitle: string;
  emptyDescription: string;
  onBookingSelect: (booking: BookingEvent) => void;
  onStatusChange: (booking: BookingEvent, status: BookingStatus) => Promise<{ success: boolean; message: string }>;
  showActions?: boolean;
}) {
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);

  const handleStatus = async (booking: BookingEvent, status: BookingStatus) => {
    setUpdatingKey(`${booking.id}:${status}`);
    const result = await onStatusChange(booking, status);
    setUpdatingKey(null);
    toast({
      variant: result.success ? "default" : "destructive",
      title: result.success ? "Booking updated" : "Could not update booking",
      description: result.message,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-border/60 bg-card/60 p-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B00]" />
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card className="border-dashed border-border/70 bg-card/60">
        <CardContent className="p-10 text-center">
          <CalendarDays className="mx-auto mb-3 h-12 w-12 text-muted-foreground/35" />
          <h3 className="text-lg font-semibold">{emptyTitle}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{emptyDescription}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {bookings.map((booking) => (
        <Card key={booking.id} className="border-border/60 bg-card/75 shadow-sm backdrop-blur-xl transition hover:border-[#FF6B00]/30">
          <CardContent className="p-4 lg:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg font-bold">{booking.clientName || "Client"}</h3>
                  <BookingStatusBadge status={booking.status} />
                </div>
                <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 flex-shrink-0 text-[#FF6B00]" />
                    {formatDate(booking.eventDate)}
                  </span>
                  <span className="flex min-w-0 items-center gap-2">
                    <Music2 className="h-4 w-4 flex-shrink-0 text-[#FF6B00]" />
                    <span className="truncate">{booking.performanceType || "Performance"}</span>
                  </span>
                  <span className="flex min-w-0 items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#FF6B00]" />
                    <span className="break-words">{booking.venueLocation || "Venue not provided"}</span>
                  </span>
                  <span className="flex min-w-0 items-center gap-2">
                    <Phone className="h-4 w-4 flex-shrink-0 text-[#FF6B00]" />
                    <span className="truncate">{booking.clientPhone || "Phone not provided"}</span>
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row lg:flex-shrink-0">
                <Button variant="outline" onClick={() => onBookingSelect(booking)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Button>
                {showActions && booking.status === "pending" && (
                  <>
                    <Button
                      className="bg-[#FF6B00] text-white hover:bg-[#e86100]"
                      disabled={Boolean(updatingKey)}
                      onClick={() => handleStatus(booking, "confirmed")}
                    >
                      {updatingKey === `${booking.id}:confirmed` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      disabled={Boolean(updatingKey)}
                      onClick={() => handleStatus(booking, "cancelled")}
                    >
                      {updatingKey === `${booking.id}:cancelled` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                      Decline
                    </Button>
                  </>
                )}
                {showActions && booking.status === "confirmed" && (
                  <Button
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                    disabled={Boolean(updatingKey)}
                    onClick={() => handleStatus(booking, "completed")}
                  >
                    {updatingKey === `${booking.id}:completed` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                    Complete
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
