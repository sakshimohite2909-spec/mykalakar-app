import { useState, useMemo } from "react";
import { CalendarDays, Check, Eye, Loader2, MapPin, Music2, Phone, Trash2, X, Sparkles, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import type { BookingEvent, BookingStatus } from "@/types/booking";
import { BookingStatusBadge } from "@/components/artist-bookings/BookingStatusBadge";
import { cn } from "@/lib/utils";

function formatDate(date: string) {
  if (!date) return "Date not provided";
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getArtEmoji(artName: string) {
  const lower = (artName || "").toLowerCase();
  if (lower.includes("comed") || lower.includes("हास्य")) return "🎭";
  if (lower.includes("sing") || lower.includes("गायक") || lower.includes("vocal") || lower.includes("music") || lower.includes("संगीत")) return "🎤";
  if (lower.includes("danc") || lower.includes("नृत्य")) return "💃";
  if (lower.includes("dj")) return "🎧";
  if (lower.includes("anchor") || lower.includes("सूत्रसंचालक") || lower.includes("host")) return "🎙️";
  if (lower.includes("mag") || lower.includes("जादू")) return "🪄";
  if (lower.includes("flute") || lower.includes("बासरी")) return "🪈";
  if (lower.includes("tabla") || lower.includes("तबल") || lower.includes("ढोलक")) return "🪘";
  if (lower.includes("kirtan") || lower.includes("कीर्तन") || lower.includes("bhajan") || lower.includes("भजन")) return "🪕";
  return "✨";
}

export function BookingListView({
  bookings,
  loading,
  emptyTitle,
  emptyDescription,
  onBookingSelect,
  onStatusChange,
  onDelete,
  showActions = true,
}: {
  bookings: BookingEvent[];
  loading?: boolean;
  emptyTitle: string;
  emptyDescription: string;
  onBookingSelect: (booking: BookingEvent) => void;
  onStatusChange: (booking: BookingEvent, status: BookingStatus) => Promise<{ success: boolean; message: string }>;
  onDelete?: (booking: BookingEvent) => Promise<{ success: boolean; message: string }> | void;
  showActions?: boolean;
}) {
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);
  const [selectedArtFilter, setSelectedArtFilter] = useState<string>("ALL");

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

  // Extract distinct Art Forms present across the bookings
  const distinctArtForms = useMemo(() => {
    const map = new Map<string, { label: string; count: number }>();
    bookings.forEach((b) => {
      const art = String(b.performanceType || (b as any).artForm || (b as any).subcategory || (b as any).category || "General").trim();
      const key = art.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { label: art, count: 1 });
      } else {
        map.get(key)!.count += 1;
      }
    });
    return Array.from(map.entries()).map(([key, data]) => ({
      key,
      label: data.label,
      count: data.count,
      emoji: getArtEmoji(data.label),
    }));
  }, [bookings]);

  // Filter bookings based on selected Art Form Tab
  const filteredBookings = useMemo(() => {
    if (selectedArtFilter === "ALL") return bookings;
    return bookings.filter((b) => {
      const art = String(b.performanceType || (b as any).artForm || (b as any).subcategory || (b as any).category || "General").trim().toLowerCase();
      return art === selectedArtFilter || art.includes(selectedArtFilter) || selectedArtFilter.includes(art);
    });
  }, [bookings, selectedArtFilter]);

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
    <div className="space-y-4">
      {/* ── Art Form Separation Switcher Tabs ── */}
      {distinctArtForms.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-stone-100/80 border border-stone-200/80">
          <button
            type="button"
            onClick={() => setSelectedArtFilter("ALL")}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer",
              selectedArtFilter === "ALL"
                ? "bg-white text-stone-950 shadow-sm border border-stone-200/80"
                : "text-stone-600 hover:text-stone-900 hover:bg-white/50"
            )}
          >
            <span>All Requests</span>
            <span className={cn(
              "px-1.5 py-0.2 rounded-md text-[10px] font-bold",
              selectedArtFilter === "ALL" ? "bg-orange-100 text-orange-700" : "bg-stone-200 text-stone-600"
            )}>
              {bookings.length}
            </span>
          </button>

          {distinctArtForms.map((art) => {
            const isActive = selectedArtFilter === art.key;
            return (
              <button
                key={art.key}
                type="button"
                onClick={() => setSelectedArtFilter(art.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer",
                  isActive
                    ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20"
                    : "text-stone-700 hover:text-stone-950 hover:bg-white/70"
                )}
              >
                <span>{art.emoji}</span>
                <span>{art.label}</span>
                <span className={cn(
                  "px-1.5 py-0.2 rounded-md text-[10px] font-bold",
                  isActive ? "bg-white/30 text-white" : "bg-stone-200 text-stone-700"
                )}>
                  {art.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Bookings List ── */}
      {filteredBookings.length === 0 ? (
        <Card className="border-dashed border-border/70 bg-card/60">
          <CardContent className="p-8 text-center">
            <Filter className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
            <h4 className="text-sm font-bold text-stone-800">No requests found for this art form</h4>
            <p className="text-xs text-muted-foreground mt-1">Select "All Requests" to view your full booking list.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredBookings.map((booking) => {
            const artType = String(booking.performanceType || (booking as any).artForm || (booking as any).subcategory || "Performance").trim();
            const emoji = getArtEmoji(artType);

            return (
              <Card key={booking.id} className="border-border/60 bg-card/75 shadow-sm backdrop-blur-xl transition hover:border-[#FF6B00]/30">
                <CardContent className="p-4 lg:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1 space-y-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-lg font-bold">{booking.clientName || "Client"}</h3>
                        
                        {/* Distinct Art Form Badge */}
                        <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-800 border border-orange-200/90 shadow-2xs">
                          <span>{emoji}</span>
                          <span>{artType}</span>
                        </span>

                        <BookingStatusBadge status={booking.status} />
                      </div>

                      <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
                        <span className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 flex-shrink-0 text-[#FF6B00]" />
                          {formatDate(booking.eventDate)}
                        </span>
                        <span className="flex min-w-0 items-center gap-2">
                          <Music2 className="h-4 w-4 flex-shrink-0 text-[#FF6B00]" />
                          <span className="truncate">{artType}</span>
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

                    <div className="flex flex-col gap-2 sm:flex-row lg:flex-shrink-0 items-center">
                      <Button variant="outline" onClick={() => onBookingSelect(booking)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                      {showActions &&
                        ["pending", "PENDING", "PENDING_ARTIST_RESPONSE", "PENDING_TELECALLER_VERIFICATION", "PAYMENT_PENDING", "SOFT_HOLD_ACTIVE", "ARTIST_REVIEW", "new", "inquiry", "contacting_artists"].includes(booking.status) && (
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
                      {showActions && ["confirmed", "CONFIRMED", "booked", "artist_confirmed"].includes(booking.status) && (
                        <Button
                          className="bg-emerald-600 text-white hover:bg-emerald-700"
                          disabled={Boolean(updatingKey)}
                          onClick={() => handleStatus(booking, "completed")}
                        >
                          {updatingKey === `${booking.id}:completed` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                          Complete
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-10 px-3 shrink-0"
                          disabled={Boolean(updatingKey)}
                          title="Delete Booking"
                          onClick={async () => {
                            setUpdatingKey(`${booking.id}:delete`);
                            const res = await onDelete(booking);
                            setUpdatingKey(null);
                            if (res) {
                              toast({
                                variant: res.success ? "default" : "destructive",
                                title: res.success ? "Booking Deleted" : "Could not delete",
                                description: res.message,
                              });
                            }
                          }}
                        >
                          {updatingKey === `${booking.id}:delete` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-red-500" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

