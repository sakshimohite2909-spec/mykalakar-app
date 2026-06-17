import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getAvailabilityConflict,
  getConfirmedBookingConflict,
  subscribeArtistAvailability,
  subscribeArtistBookings,
  subscribeArtistNotifications,
  updateArtistBookingStatus,
} from "@/services/artistBookingService";
import type {
  ArtistAvailabilityBlock,
  BookingEvent,
  BookingNotification,
  BookingStatus,
} from "@/types/booking";

function dateOnly(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

function isFutureOrToday(eventDate: string) {
  return Boolean(eventDate) && eventDate >= dateOnly();
}

function sortByEventDate(a: BookingEvent, b: BookingEvent) {
  return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
}

export function useArtistBookings() {
  const { artistData, currentUser } = useAuth();
  const artistId = String(artistData?.id || artistData?.uid || currentUser?.uid || "");
  const [bookings, setBookings] = useState<BookingEvent[]>([]);
  const [availability, setAvailability] = useState<ArtistAvailabilityBlock[]>([]);
  const [notifications, setNotifications] = useState<BookingNotification[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const bookingsRef = useRef<BookingEvent[]>([]);

  useEffect(() => {
    bookingsRef.current = bookings;
  }, [bookings]);

  useEffect(() => {
    if (!artistId) {
      setBookings([]);
      setAvailability([]);
      setNotifications([]);
      setLoadingBookings(false);
      setLoadingAvailability(false);
      setLoadingNotifications(false);
      return;
    }

    setLoadingBookings(true);
    setLoadingAvailability(true);
    setLoadingNotifications(true);
    setError(null);

    const unsubscribeBookings = subscribeArtistBookings(
      artistId,
      (data) => {
        setBookings(data);
        setLoadingBookings(false);
      },
      (err) => {
        setError(err);
        setLoadingBookings(false);
      }
    );
    const unsubscribeAvailability = subscribeArtistAvailability(
      artistId,
      (data) => {
        setAvailability(data);
        setLoadingAvailability(false);
      },
      (err) => {
        setError(err);
        setLoadingAvailability(false);
      }
    );
    const unsubscribeNotifications = subscribeArtistNotifications(
      artistId,
      (data) => {
        setNotifications(data);
        setLoadingNotifications(false);
      },
      (err) => {
        setError(err);
        setLoadingNotifications(false);
      }
    );

    return () => {
      unsubscribeBookings();
      unsubscribeAvailability();
      unsubscribeNotifications();
    };
  }, [artistId]);
  const updateStatus = useCallback(
    async (booking: BookingEvent, status: BookingStatus, extraFields?: Partial<BookingEvent>) => {
      if (status === "CONFIRMED") {
        const blockedDate = getAvailabilityConflict(booking.eventDate, availability);
        if (blockedDate) {
          return {
            success: false,
            message: blockedDate.reason
              ? `This date is blocked: ${blockedDate.reason}.`
              : "This date is blocked in your availability.",
          };
        }

        const conflict = getConfirmedBookingConflict(booking, bookingsRef.current);
        if (conflict) {
          return {
            success: false,
            message: "You already have a confirmed booking for this time slot.",
          };
        }
      }

      const previousBookings = bookingsRef.current;
      const updatedAt = new Date().toISOString();
      setBookings((current) =>
        current.map((item) =>
          item.id === booking.id ? { ...item, status, updatedAt, ...extraFields } : item
        )
      );

      try {
        await updateArtistBookingStatus(booking, status, extraFields);
        return { success: true, message: "Booking updated." };
      } catch (err) {
        setBookings(previousBookings);
        setError(err);
        return {
          success: false,
          message: err instanceof Error ? err.message : "Could not update booking.",
        };
      }
    },
    [availability]
  );

  const summary = useMemo(() => {
    const upcomingEvents = bookings.filter(
      (booking) => (booking.status === "CONFIRMED" || booking.status === "confirmed") && isFutureOrToday(booking.eventDate)
    );

    return {
      pending: bookings.filter((booking) => ["PENDING_ARTIST_RESPONSE", "pending"].includes(booking.status)).length,
      confirmed: bookings.filter((booking) => ["CONFIRMED", "confirmed"].includes(booking.status)).length,
      completed: bookings.filter((booking) => ["EVENT_COMPLETED", "completed"].includes(booking.status)).length,
      cancelled: bookings.filter((booking) => ["CANCELLED_BY_ARTIST", "REJECTED", "cancelled"].includes(booking.status)).length,
      upcoming: upcomingEvents.length,
      unreadNotifications: notifications.filter((notification) => !notification.read).length,
    };
  }, [bookings, notifications]);

  const futureBookings = useMemo(
    () => bookings.filter((booking) => isFutureOrToday(booking.eventDate)).sort(sortByEventDate),
    [bookings]
  );

  const upcomingEvents = useMemo(
    () =>
      bookings
        .filter((booking) => (booking.status === "CONFIRMED" || booking.status === "confirmed") && isFutureOrToday(booking.eventDate))
        .sort(sortByEventDate),
    [bookings]
  );

  const completedEvents = useMemo(
    () =>
      bookings
        .filter((booking) => booking.status === "EVENT_COMPLETED" || booking.status === "completed")
        .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()),
    [bookings]
  );

  return {
    artistId,
    bookings,
    futureBookings,
    upcomingEvents,
    completedEvents,
    availability,
    notifications,
    summary,
    loading: loadingBookings || loadingAvailability || loadingNotifications,
    loadingBookings,
    loadingAvailability,
    loadingNotifications,
    error,
    updateStatus,
  };
}
