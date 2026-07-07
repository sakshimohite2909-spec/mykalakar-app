import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isToday,
  startOfMonth,
  subMonths,
  startOfWeek,
  addDays,
  isSameDay,
} from "date-fns";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Calendar,
  Layers,
  ListTodo,
  Sun,
  Ban,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ArtistAvailabilityBlock, BookingEvent } from "@/types/booking";
import { ArtistAgendaList } from "@/components/artist-bookings/ArtistAgendaList";
import { BookingStatusBadge, getStatusMeta } from "@/components/artist-bookings/BookingStatusBadge";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 15 }).map((_, i) => i + 8); // 8:00 to 22:00

function dayKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function parseTimeToMinutes(timeStr?: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(":");
  if (parts.length < 2) return 0;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return hours * 60 + minutes;
}

function formatPanelDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isFutureOrToday(date: string) {
  return date >= new Date().toISOString().slice(0, 10);
}

export function ArtistCalendarView({
  bookings,
  availability,
  onBookingSelect,
}: {
  bookings: BookingEvent[];
  availability: ArtistAvailabilityBlock[];
  onBookingSelect: (booking: BookingEvent) => void;
}) {
  const [viewMode, setViewMode] = useState<"month" | "week" | "day" | "agenda">("month");
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => dayKey(new Date()));

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(visibleMonth);
    const monthEnd = endOfMonth(visibleMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    return {
      blanks: Array.from({ length: getDay(monthStart) }),
      days,
    };
  }, [visibleMonth]);

  const bookingsByDate = useMemo(() => {
    return bookings.reduce<Record<string, BookingEvent[]>>((acc, booking) => {
      if (!booking.eventDate) return acc;
      acc[booking.eventDate] = [...(acc[booking.eventDate] || []), booking];
      return acc;
    }, {});
  }, [bookings]);

  const availabilityByDate = useMemo(() => {
    return availability.reduce<Record<string, ArtistAvailabilityBlock>>((acc, block) => {
      if (block.blockedDate) acc[block.blockedDate] = block;
      return acc;
    }, {});
  }, [availability]);

  const selectedBookings = bookingsByDate[selectedDate] || [];
  const monthBookingCount = calendarDays.days.reduce((count, date) => count + (bookingsByDate[dayKey(date)]?.length || 0), 0);
  const agendaBookings = bookings.filter((booking) => isFutureOrToday(booking.eventDate));

  // Compute selected week dates
  const weekDays = useMemo(() => {
    const baseDate = new Date(`${selectedDate}T00:00:00`);
    const weekStart = startOfWeek(baseDate, { weekStartsOn: 0 }); // Sunday
    return Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  }, [selectedDate]);

  return (
    <div className="space-y-4">
      {/* Premium View Mode Switcher Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card/60 backdrop-blur-xl border border-border/50 p-3 rounded-2xl">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-[#FF6B00]" />
          <span className="font-display font-black text-sm uppercase tracking-wider text-stone-800">Calendar Console</span>
        </div>
        
        <div className="flex bg-secondary/60 p-1 rounded-xl w-fit">
          <button
            onClick={() => setViewMode("month")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1",
              viewMode === "month" ? "bg-white text-[#FF6B00] shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Calendar className="h-3.5 w-3.5" /> Month
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1",
              viewMode === "week" ? "bg-white text-[#FF6B00] shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Layers className="h-3.5 w-3.5" /> Week
          </button>
          <button
            onClick={() => setViewMode("day")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1",
              viewMode === "day" ? "bg-white text-[#FF6B00] shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Sun className="h-3.5 w-3.5" /> Day
          </button>
          <button
            onClick={() => setViewMode("agenda")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1",
              viewMode === "agenda" ? "bg-white text-[#FF6B00] shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ListTodo className="h-3.5 w-3.5" /> Agenda
          </button>
        </div>
      </div>

      {/* Main views rendering logic */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        
        {/* Main Calendar Panel */}
        <Card className="border-border/60 bg-card/70 shadow-sm backdrop-blur-xl">
          <CardContent className="p-4 lg:p-5">
            
            {/* MONTH VIEW */}
            {viewMode === "month" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-2xl font-bold">{format(visibleMonth, "MMMM yyyy")}</h2>
                    <p className="text-xs text-muted-foreground">Monthly summary calendar</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setVisibleMonth(subMonths(visibleMonth, 1))}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      const today = new Date();
                      setVisibleMonth(startOfMonth(today));
                      setSelectedDate(dayKey(today));
                    }}>
                      Today
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {WEEKDAYS.map((day) => (
                    <div key={day} className="px-1 pb-1.5 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {day}
                    </div>
                  ))}

                  {calendarDays.blanks.map((_, index) => (
                    <div key={`blank-${index}`} className="aspect-square w-full rounded-xl border border-transparent" />
                  ))}

                  {calendarDays.days.map((date) => {
                    const dateId = dayKey(date);
                    const dateBookings = bookingsByDate[dateId] || [];
                    const blocked = availabilityByDate[dateId];
                    const selected = selectedDate === dateId;

                    return (
                      <button
                        key={dateId}
                        type="button"
                        onClick={() => setSelectedDate(dateId)}
                        className={cn(
                          "aspect-square w-full rounded-xl border bg-background/70 p-2 text-left transition hover:border-[#FF6B00]/50 hover:bg-[#FF6B00]/5 focus:outline-none flex flex-col justify-between",
                          selected && "border-[#FF6B00] bg-[#FF6B00]/10 shadow-sm",
                          blocked && "border-rose-100 bg-rose-50/40",
                        )}
                      >
                        <div className="mb-1.5 flex items-center justify-between w-full">
                          <span className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                            isToday(date) && "bg-[#FF6B00] text-white",
                            selected && !isToday(date) && "text-[#FF6B00]"
                          )}>
                            {format(date, "d")}
                          </span>
                          {dateBookings.length > 0 && (
                            <span className="rounded-full bg-[#FF6B00]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#FF6B00]">
                              {dateBookings.length}
                            </span>
                          )}
                        </div>

                        {blocked && (
                          <span className="block text-[9px] font-bold text-rose-600 bg-rose-100/60 py-0.5 px-1.5 rounded-lg mb-1 truncate">
                            Blocked
                          </span>
                        )}

                        <div className="space-y-1.5 mt-auto">
                          {dateBookings.slice(0, 2).map((booking) => {
                            const status = getStatusMeta(booking.status);
                            const isConfirmed = booking.status === "CONFIRMED";
                            return (
                              <div key={booking.id} className={cn(
                                "flex flex-col gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-bold shadow-sm border truncate",
                                isConfirmed ? "bg-[#E25C1D]/10 border-[#E25C1D]/20 text-[#E25C1D]" : "bg-card/85 border-stone-200 text-stone-700"
                              )}>
                                <div className="flex items-center justify-between gap-1 w-full">
                                  <span className="flex items-center gap-1.5 truncate">
                                    <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: isConfirmed ? '#E25C1D' : status.color }} />
                                    <span className="truncate tracking-wide">{booking.performanceType || "Show"}</span>
                                  </span>
                                  {booking.authorizedAmount ? (
                                    <span className="font-black text-[9px] shrink-0">₹{Number(booking.authorizedAmount).toLocaleString('en-IN')}</span>
                                  ) : null}
                                </div>
                                <span className={cn(
                                  "text-[8px] font-semibold tracking-wider",
                                  isConfirmed ? "text-[#E25C1D]/80" : "text-stone-400"
                                )}>
                                  {booking.eventStartTime || "TBD"} - {booking.eventEndTime || "TBD"}
                                </span>
                              </div>
                            );
                          })}
                          {dateBookings.length > 2 && (
                            <p className="text-[9px] text-stone-400 font-bold pl-1">+{dateBookings.length - 2} more</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* WEEK VIEW */}
            {viewMode === "week" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-lg font-bold">Weekly Schedule</h2>
                    <p className="text-xs text-muted-foreground">Week of {formatPanelDate(dayKey(weekDays[0]))}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      const baseDate = new Date(`${selectedDate}T00:00:00`);
                      setSelectedDate(dayKey(addDays(baseDate, -7)));
                    }}>
                      <ChevronLeft className="h-4 w-4" /> Previous Week
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      const baseDate = new Date(`${selectedDate}T00:00:00`);
                      setSelectedDate(dayKey(addDays(baseDate, 7)));
                    }}>
                      Next Week <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                  {weekDays.map((date) => {
                    const dateId = dayKey(date);
                    const dateBookings = bookingsByDate[dateId] || [];
                    const blocked = availabilityByDate[dateId];
                    const selected = selectedDate === dateId;

                    return (
                      <div
                        key={dateId}
                        className={cn(
                          "rounded-2xl border bg-background/50 p-3 flex flex-col min-h-[220px] transition cursor-pointer",
                          selected ? "border-[#FF6B00] bg-[#FF6B00]/5" : "border-border/70 hover:border-stone-300",
                          blocked && "bg-rose-50/20 border-rose-100"
                        )}
                        onClick={() => setSelectedDate(dateId)}
                      >
                        <div className="border-b border-border/50 pb-2 mb-2 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] uppercase font-black tracking-wider text-muted-foreground">
                              {format(date, "eee")}
                            </p>
                            <h4 className="text-sm font-bold">{format(date, "d MMM")}</h4>
                          </div>
                          {isToday(date) && (
                            <span className="bg-[#FF6B00] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">Today</span>
                          )}
                        </div>

                        {blocked && (
                          <div className="bg-rose-100/60 p-2 rounded-xl text-[10px] font-semibold text-rose-700 mb-2 border border-rose-200">
                            <span className="font-bold block uppercase text-[8px] tracking-wider mb-0.5">Blocked</span>
                            {blocked.reason || "Unavailable"}
                          </div>
                        )}

                        <div className="flex-1 space-y-2">
                          {dateBookings.length === 0 ? (
                            <p className="text-[10px] text-stone-400 font-bold italic py-2 text-center">Available</p>
                          ) : (
                            dateBookings.map((b) => {
                              const meta = getStatusMeta(b.status);
                              return (
                                <div
                                  key={b.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onBookingSelect(b);
                                  }}
                                  className="p-2 rounded-xl bg-white border border-slate-200 hover:border-[#FF6B00] transition flex flex-col text-left space-y-1 shadow-sm"
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[10px] font-bold text-stone-800 truncate">{b.performanceType}</span>
                                    <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
                                  </div>
                                  <span className="text-[9px] text-stone-400 font-semibold">{b.eventStartTime || "All Day"}</span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* DAY VIEW */}
            {viewMode === "day" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-lg font-bold">{formatPanelDate(selectedDate)}</h2>
                    <p className="text-xs text-muted-foreground">Hourly timeline breakdown</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      const baseDate = new Date(`${selectedDate}T00:00:00`);
                      setSelectedDate(dayKey(addDays(baseDate, -1)));
                    }}>
                      <ChevronLeft className="h-4 w-4" /> Previous Day
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      const baseDate = new Date(`${selectedDate}T00:00:00`);
                      setSelectedDate(dayKey(addDays(baseDate, 1)));
                    }}>
                      Next Day <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {availabilityByDate[selectedDate] && (
                  <div className="bg-rose-100/50 border border-rose-200/60 p-3 rounded-2xl flex items-center gap-2.5 text-xs font-semibold text-rose-700">
                    <Ban className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>This entire day is blocked in availability rules: <strong>"{availabilityByDate[selectedDate].reason || "No events accepted"}"</strong></span>
                  </div>
                )}

                <div className="border border-border/60 rounded-2xl overflow-hidden bg-background/30 max-h-[480px] overflow-y-auto">
                  <table className="w-full text-xs font-semibold text-stone-700">
                    <thead>
                      <tr className="bg-stone-50 border-b">
                        <th className="p-3 text-left w-24">Time Slot</th>
                        <th className="p-3 text-left">Schedule Detail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {HOURS.map((hour) => {
                        const timeStr = `${hour.toString().padStart(2, "0")}:00`;
                        const hourMinutes = hour * 60;
                        
                        // Find booking covering this hour block
                        const booking = selectedBookings.find(b => {
                          if (!b.eventStartTime || !b.eventEndTime) return true; // full day cover
                          const s = parseTimeToMinutes(b.eventStartTime);
                          const e = parseTimeToMinutes(b.eventEndTime);
                          return hourMinutes >= s && hourMinutes < e;
                        });

                        const blocked = availabilityByDate[selectedDate];

                        return (
                          <tr key={hour} className="hover:bg-slate-50/20">
                            <td className="p-3 font-bold border-r border-border/50 text-stone-500 flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-stone-400" />
                              {timeStr}
                            </td>
                            <td className="p-3">
                              {blocked ? (
                                <span className="text-rose-500 font-semibold italic">Day Blocked: Unavailable</span>
                              ) : booking ? (
                                <div className="flex items-center justify-between bg-white border border-slate-200 p-2.5 rounded-xl shadow-sm">
                                  <div className="space-y-0.5">
                                    <p className="font-bold text-stone-900">{booking.performanceType} performance</p>
                                    <p className="text-[10px] text-muted-foreground">Client: {booking.clientName} · Slot: {booking.eventStartTime} - {booking.eventEndTime}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <BookingStatusBadge status={booking.status} />
                                    <Button size="xs" variant="outline" className="text-[10px] font-bold h-7 rounded-lg" onClick={() => onBookingSelect(booking)}>Details</Button>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-emerald-600 font-bold flex items-center gap-1">
                                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                  Available Slot
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* AGENDA VIEW */}
            {viewMode === "agenda" && (
              <div className="space-y-4">
                <div>
                  <h2 className="font-display text-lg font-bold">Upcoming Agenda list</h2>
                  <p className="text-xs text-muted-foreground">Upcoming verified booking transactions</p>
                </div>
                <ArtistAgendaList bookings={agendaBookings} onBookingSelect={onBookingSelect} />
              </div>
            )}

          </CardContent>
        </Card>

        {/* Selected Day Panel */}
        <Card className="border-border/60 bg-card/70 shadow-sm backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="mb-4">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Selected Day</p>
              <h3 className="font-display text-xl font-bold">{formatPanelDate(selectedDate)}</h3>
              {availabilityByDate[selectedDate] && (
                <p className="mt-2 rounded-xl border border-red-200 bg-red-50/70 p-3 text-xs text-red-700 font-bold flex items-center gap-1.5">
                  <Ban className="h-4 w-4 text-red-600" />
                  {availabilityByDate[selectedDate].reason || "Artist is unavailable on this date."}
                </p>
              )}
            </div>

            {selectedBookings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 bg-secondary/30 p-6 text-center">
                <CalendarDays className="mx-auto mb-3 h-8 w-8 text-stone-400/50" />
                <p className="text-xs text-muted-foreground font-bold">No bookings scheduled on this date.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedBookings.map((booking) => (
                  <div key={booking.id} className="rounded-xl border border-border/60 bg-background/70 p-3 shadow-sm text-xs space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        <p className="font-bold text-stone-900 truncate">{booking.performanceType || "Booking"}</p>
                        <p className="flex items-start gap-1 text-[10px] text-stone-500">
                          <MapPin className="h-3 w-3 shrink-0 text-[#FF6B00]" />
                          <span className="truncate">{booking.venueLocation || "Venue unspecified"}</span>
                        </p>
                        <p className="flex items-center gap-1 text-[10px] text-stone-500">
                          <Clock className="h-3 w-3 shrink-0 text-[#FF6B00]" />
                          <span>{booking.eventStartTime || "All Day"} - {booking.eventEndTime || "All Day"}</span>
                        </p>
                      </div>
                      <BookingStatusBadge status={booking.status} />
                    </div>
                    <Button variant="outline" size="sm" className="w-full rounded-xl text-[10px] font-bold" onClick={() => onBookingSelect(booking)}>
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
