import { useMemo, useState, useEffect } from "react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  format,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin, Sparkles, Inbox, Edit3, ShieldAlert, Ban } from "lucide-react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookingDetailModal } from "./BookingDetailModal";
import type { BookingEvent, ArtistAvailabilityBlock } from "@/types/booking";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dayKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

interface ArtistCalendarProps {
  artistId: string;
  currentUser?: any;
}

export default function ArtistCalendar({ artistId, currentUser: propUser }: ArtistCalendarProps) {
  const { currentUser: authUser } = useAuth();
  const currentUser = propUser || authUser;

  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => dayKey(new Date()));
  const [liveBookings, setLiveBookings] = useState<BookingEvent[]>([]);
  const [availabilityBlocks, setAvailabilityBlocks] = useState<ArtistAvailabilityBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookingForModal, setSelectedBookingForModal] = useState<BookingEvent | null>(null);

  // Determine privilege level for the calendar UI
  const isPrivileged = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.uid === artistId) return true;
    if (currentUser.role === "admin" || currentUser.email === "admin@mykalakar.com") return true;
    return false;
  }, [currentUser, artistId]);

  const isAdmin = useMemo(() => {
    if (!currentUser) return false;
    return currentUser.role === "admin" || currentUser.email === "admin@mykalakar.com";
  }, [currentUser]);

  // Task 2: Real-time Snapshot Sync to bookings collection where artistId == currentProfileId
  useEffect(() => {
    if (!artistId) return;

    if (!isPrivileged) {
      setLiveBookings([]);
      setLoading(false);
      return;
    }

    const bookingsQuery = query(
      collection(db, "bookings"),
      where("artistId", "==", artistId)
    );

    const unsubscribeBookings = onSnapshot(
      bookingsQuery,
      (snapshot) => {
        const bookingsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as BookingEvent[];
        setLiveBookings(bookingsList);
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to bookings:", error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeBookings();
    };
  }, [artistId, isPrivileged]);

  // Real-time Availability block synchronization
  useEffect(() => {
    if (!artistId) return;

    const availabilityQuery = query(
      collection(db, "artist_availability"),
      where("artistId", "==", artistId)
    );

    const unsubscribeAvailability = onSnapshot(
      availabilityQuery,
      (snapshot) => {
        const availabilityList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ArtistAvailabilityBlock[];
        setAvailabilityBlocks(availabilityList);
      },
      (error) => {
        console.error("Error listening to availability:", error);
      }
    );

    return () => {
      unsubscribeAvailability();
    };
  }, [artistId]);

  const daysInMonth = useMemo(() => {
    const monthStart = startOfMonth(visibleMonth);
    const monthEnd = endOfMonth(visibleMonth);
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [visibleMonth]);

  const blanksCount = getDay(startOfMonth(visibleMonth));

  return (
    <div className="space-y-6">
      {/* Calendar Header info */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
        <div>
          <h3 className="text-lg font-black text-stone-900 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-[#E25C1D]" />
            Live Artist Availability
          </h3>
          <p className="text-xs font-semibold text-stone-400">
            {isPrivileged ? "Privileged Access: All booking metadata visible" : "Public View: Protected profile masking active"}
          </p>
        </div>
      </div>

      {/* Task 1 & 4 Split Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Calendar Month Grid (Left/Center) */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Controls */}
          <div className="flex items-center justify-between bg-stone-50/50 p-3 rounded-2xl border border-stone-100">
            <div>
              <h4 className="text-base font-bold text-stone-900 tracking-tight">
                {format(visibleMonth, "MMMM yyyy")}
              </h4>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisibleMonth(subMonths(visibleMonth, 1))}
                className="h-8 w-8 p-0 rounded-lg hover:text-[#E25C1D]"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  setVisibleMonth(startOfMonth(today));
                  setSelectedDate(dayKey(today));
                }}
                className="h-8 px-3 rounded-lg text-xs font-bold hover:text-[#E25C1D]"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}
                className="h-8 w-8 p-0 rounded-lg hover:text-[#E25C1D]"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Weekday Headers - TASK 1.3 */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="text-xs font-semibold text-gray-500 uppercase py-2 tracking-wider whitespace-nowrap"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Date Cells Grid - TASK 1.2 & 1.4 */}
          <div className="grid grid-cols-7 gap-1 bg-stone-50/40 p-1.5 rounded-2xl border border-stone-100/60 shadow-inner">
            
            {/* Blanks */}
            {Array.from({ length: blanksCount }).map((_, index) => (
              <div
                key={`blank-${index}`}
                className="aspect-square w-full rounded-xl bg-transparent border border-transparent"
              />
            ))}

            {/* Actual Days */}
            {daysInMonth.map((date) => {
              const dateId = dayKey(date);
              const dateBookings = liveBookings.filter(
                (b) => b.eventDate === dateId && b.status !== "CANCELLED_BY_ARTIST" && b.status !== "REJECTED"
              );
              const availabilityBlock = availabilityBlocks.find((b) => b.blockedDate === dateId);
              const isDayBlocked = availabilityBlock && availabilityBlock.reason !== "Booked";
              const isDayBooked = availabilityBlock && availabilityBlock.reason === "Booked";
              const isSelected = selectedDate === dateId;
              const isCurrentDay = isToday(date);

              return (
                <button
                  key={dateId}
                  type="button"
                  onClick={() => setSelectedDate(dateId)}
                  className={cn(
                    "aspect-square w-full rounded-xl border p-1.5 text-left transition flex flex-col justify-between group",
                    isSelected
                      ? "border-[#E25C1D] bg-[#E25C1D]/5 shadow-sm"
                      : "border-stone-100/80 bg-white hover:bg-gray-50 hover:border-stone-200",
                    isCurrentDay && !isSelected && "ring-1 ring-[#E25C1D]/40 bg-orange-50/20"
                  )}
                >
                  {/* Date Number - TASK 1.5 */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-lg text-xs font-black",
                        isCurrentDay && "bg-[#E25C1D] text-white shadow-sm",
                        isSelected && !isCurrentDay && "text-[#E25C1D]",
                        !isCurrentDay && !isSelected && "text-stone-700"
                      )}
                    >
                      {format(date, "d")}
                    </span>
                    {(dateBookings.length > 0 || isDayBooked) && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#E25C1D]" />
                    )}
                  </div>

                  {/* Role-Based Rendering - TASK 3 */}
                  <div className="w-full mt-auto">
                    {isDayBlocked ? (
                      <span className="block text-[8px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-100 rounded px-1 py-0.5 text-center truncate">
                        Blocked
                      </span>
                    ) : (dateBookings.length > 0 || isDayBooked) ? (
                      isPrivileged ? (
                        /* Admin/Artist View (Detailed) */
                        <div className="space-y-0.5">
                          {dateBookings.slice(0, 1).map((b) => (
                            <div
                              key={b.id}
                              className="rounded bg-[#E25C1D]/10 border border-[#E25C1D]/20 px-1 py-0.5 text-[8px] font-black text-[#E25C1D] truncate leading-tight"
                            >
                              <span className="block truncate">{b.performanceType || "Show"}</span>
                              <span className="block text-[7px] text-[#E25C1D]/80 font-bold">{b.eventStartTime || "TBD"}</span>
                            </div>
                          ))}
                          {dateBookings.length > 1 && (
                            <span className="block text-[7px] text-stone-400 font-extrabold text-right">
                              +{dateBookings.length - 1} more
                            </span>
                          )}
                          {dateBookings.length === 0 && isDayBooked && (
                            <div className="rounded bg-stone-100 border border-stone-200 px-1 py-0.5 text-[8px] font-black text-stone-400 text-center uppercase tracking-wide truncate relative overflow-hidden flex items-center justify-center">
                              Unavailable
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Public View (Masked) */
                        <div className="rounded bg-stone-100 border border-stone-200 px-1 py-0.5 text-[8px] font-black text-stone-400 text-center uppercase tracking-wide truncate relative overflow-hidden flex items-center justify-center">
                          <span className="absolute inset-0 bg-gradient-to-tr from-transparent via-stone-300/30 to-transparent pointer-events-none" />
                          Unavailable
                        </div>
                      )
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Selected Day Details Console - TASK 4 */}
        <div className="lg:col-span-1">
          <Card className="border-stone-100 bg-white/70 shadow-sm backdrop-blur-md rounded-2xl h-full flex flex-col min-h-[350px]">
            <CardContent className="p-5 flex-1 flex flex-col">
              
              <div className="mb-4">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Selected Day Info</p>
                <h3 className="font-display text-lg font-bold text-stone-900 mt-0.5">
                  {new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </h3>
              </div>

              {/* Dynamic Console States */}
              {(() => {
                const dayBookings = liveBookings.filter(
                  (b) => b.eventDate === selectedDate && b.status !== "CANCELLED_BY_ARTIST" && b.status !== "REJECTED"
                );
                const blockedBlock = availabilityBlocks.find((b) => b.blockedDate === selectedDate);

                if (blockedBlock) {
                  const isBooked = blockedBlock.reason === "Booked";
                  return (
                    <div className={cn(
                      "rounded-xl p-4 text-center my-auto border",
                      isBooked 
                        ? "border-stone-150 bg-stone-50"
                        : "border-rose-100 bg-rose-50/60"
                    )}>
                      {isBooked ? (
                        <ShieldAlert className="mx-auto mb-2.5 h-6 w-6 text-stone-400" />
                      ) : (
                        <Ban className="mx-auto mb-2.5 h-6 w-6 text-rose-500" />
                      )}
                      <h4 className={cn(
                        "text-sm font-extrabold",
                        isBooked ? "text-stone-900" : "text-rose-950"
                      )}>
                        {isBooked ? "Slot Unavailable" : "Date Blocked"}
                      </h4>
                      <p className={cn(
                        "mt-1 text-xs font-semibold leading-relaxed",
                        isBooked ? "text-stone-500" : "text-rose-600"
                      )}>
                        {isBooked ? "A private booking is scheduled on this date." : (blockedBlock.reason || "Unavailable to accept inquiries")}
                      </p>
                    </div>
                  );
                }

                if (dayBookings.length === 0) {
                  return (
                    <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50/30 p-6 text-center my-auto flex flex-col items-center justify-center min-h-[200px]">
                      <Inbox className="mb-3 h-8 w-8 text-stone-300" />
                      <p className="text-xs text-stone-500 font-extrabold leading-normal">
                        No bookings scheduled on this date.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4 flex-1 overflow-y-auto max-h-[360px] pr-1">
                    {dayBookings.map((booking) => {
                      const isAuthorized =
                        isPrivileged || (currentUser && booking.customerId === currentUser.uid);

                      if (!isAuthorized) {
                        return (
                          <div key={booking.id} className="rounded-xl border border-stone-100 bg-stone-50 p-4 text-center">
                            <ShieldAlert className="mx-auto mb-2 h-5 w-5 text-stone-400" />
                            <h4 className="text-xs font-bold text-stone-700">Slot Unavailable</h4>
                            <p className="mt-0.5 text-[10px] text-stone-400 font-semibold">
                              A private booking is scheduled on this date.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={booking.id}
                          className="rounded-xl border border-stone-100 bg-stone-50/50 p-4 space-y-3 relative overflow-hidden"
                        >
                          <div className="absolute top-0 left-0 right-0 h-1 bg-[#E25C1D]" />

                          <div className="space-y-2 text-xs">
                            <div>
                              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Event Name</p>
                              <h4 className="font-extrabold text-stone-900 mt-0.5">
                                {booking.performanceType || "Private Show"}
                              </h4>
                            </div>

                            <div className="flex items-center gap-1.5 text-stone-600 font-semibold">
                              <Clock className="h-3.5 w-3.5 text-[#E25C1D] shrink-0" />
                              <span>{booking.eventStartTime || "All Day"} - {booking.eventEndTime || "All Day"}</span>
                            </div>

                            <div className="flex items-start gap-1.5 text-stone-600 font-semibold">
                              <MapPin className="h-3.5 w-3.5 text-[#E25C1D] shrink-0 mt-0.5" />
                              <span className="leading-tight">{booking.venueLocation || "Location unspecified"}</span>
                            </div>

                            <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                              <div>
                                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Total Budget</p>
                                <p className="font-black text-[#E25C1D] text-sm mt-0.5">
                                  ₹{(booking.authorizedAmount || 0).toLocaleString("en-IN")}
                                </p>
                              </div>
                              <div>
                                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Customer Name</p>
                                <p className="font-extrabold text-stone-700 text-xs mt-0.5">
                                  {booking.clientName || "Direct Client"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Admin Edit Link Override - TASK 4.4 */}
                          {isAdmin && (
                            <button
                              onClick={() => setSelectedBookingForModal(booking)}
                              className="w-full mt-2 inline-flex items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white py-2 text-xs font-bold text-stone-700 hover:bg-[#E25C1D]/5 hover:text-[#E25C1D] hover:border-[#E25C1D]/30 transition"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              Edit Booking Override
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Booking Moderator Modal */}
      <BookingDetailModal
        booking={selectedBookingForModal}
        open={Boolean(selectedBookingForModal)}
        onOpenChange={(open) => !open && setSelectedBookingForModal(null)}
        onStatusChange={async (booking, status, extraFields) => {
          try {
            const { updateArtistBookingStatus } = await import("@/services/artistBookingService");
            await updateArtistBookingStatus(booking, status, extraFields);
            return { success: true, message: "Booking updated successfully." };
          } catch (error: any) {
            return { success: false, message: error.message || "Failed to update booking." };
          }
        }}
      />
    </div>
  );
}
