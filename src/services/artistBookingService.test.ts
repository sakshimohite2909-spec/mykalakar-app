import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkArtistAvailability } from "./artistBookingService";

// Setup mock data store for our Firestore mocks
let mockBlockedDatesSnap = {
  empty: true,
  docs: [] as any[]
};

let mockBookingsSnap = {
  empty: true,
  docs: [] as any[]
};

// Mock firebase/firestore
vi.mock("firebase/firestore", () => {
  return {
    collection: vi.fn((db, path) => ({ path })),
    query: vi.fn((coll, ...conditions) => ({ coll, conditions })),
    where: vi.fn((field, op, val) => ({ field, op, val })),
    doc: vi.fn((db, path, id) => ({ path, id })),
    addDoc: vi.fn(),
    deleteDoc: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    onSnapshot: vi.fn(),
    updateDoc: vi.fn(),
    runTransaction: vi.fn(),
    getDocs: vi.fn((q: any) => {
      if (q && q.coll && q.coll.path === "artist_availability") {
        return Promise.resolve(mockBlockedDatesSnap);
      }
      if (q && q.coll && q.coll.path === "bookings") {
        return Promise.resolve(mockBookingsSnap);
      }
      return Promise.resolve({ empty: true, docs: [] });
    }),
  };
});

// Mock firebase config
vi.mock("@/lib/firebase", () => ({
  db: {},
}));

describe("checkArtistAvailability", () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockBlockedDatesSnap = { empty: true, docs: [] };
    mockBookingsSnap = { empty: true, docs: [] };
    vi.clearAllMocks();
  });

  it("should return available: true when there are no blocks or bookings on the date", async () => {
    const res = await checkArtistAvailability("artist-1", "2026-07-01", "18:00", "22:00");
    expect(res).toEqual({ available: true });
  });

  it("should return available: false with mapped message when artist is manually blocked with reason Booked", async () => {
    mockBlockedDatesSnap = {
      empty: false,
      docs: [
        {
          data: () => ({
            artistId: "artist-1",
            blockedDate: "2026-07-01",
            reason: "Booked",
          }),
        },
      ],
    };

    const res = await checkArtistAvailability("artist-1", "2026-07-01", "18:00", "22:00");
    expect(res.available).toBe(false);
    expect(res.reason).toBe("The artist is already booked on this date.");
  });

  it("should return available: false with original reason when artist is manually blocked for other reasons", async () => {
    mockBlockedDatesSnap = {
      empty: false,
      docs: [
        {
          data: () => ({
            artistId: "artist-1",
            blockedDate: "2026-07-01",
            reason: "Personal leave",
          }),
        },
      ],
    };

    const res = await checkArtistAvailability("artist-1", "2026-07-01", "18:00", "22:00");
    expect(res.available).toBe(false);
    expect(res.reason).toBe("Personal leave");
  });

  it("should return available: false when there is a confirmed booking on the same date with overlapping times", async () => {
    mockBookingsSnap = {
      empty: false,
      docs: [
        {
          id: "booking-1",
          data: () => ({
            artistId: "artist-1",
            eventDate: "2026-07-01",
            eventStartTime: "19:00",
            eventEndTime: "21:00",
            status: "CONFIRMED",
          }),
        },
      ],
    };

    // 18:00 - 22:00 overlaps with 19:00 - 21:00
    const res = await checkArtistAvailability("artist-1", "2026-07-01", "18:00", "22:00");
    expect(res.available).toBe(false);
    expect(res.reason).toContain("confirmed booking");
  });

  it("should return available: true when there is a confirmed booking on the same date but times do not overlap", async () => {
    mockBookingsSnap = {
      empty: false,
      docs: [
        {
          id: "booking-1",
          data: () => ({
            artistId: "artist-1",
            eventDate: "2026-07-01",
            eventStartTime: "12:00",
            eventEndTime: "16:00",
            status: "CONFIRMED",
          }),
        },
      ],
    };

    // 18:00 - 22:00 does not overlap with 12:00 - 16:00
    const res = await checkArtistAvailability("artist-1", "2026-07-01", "18:00", "22:00");
    expect(res.available).toBe(true);
  });

  it("should return available: false when there is a pending hold with active expiry that overlaps", async () => {
    const futureExpiry = new Date(Date.now() + 60000).toISOString();
    mockBookingsSnap = {
      empty: false,
      docs: [
        {
          id: "booking-2",
          data: () => ({
            artistId: "artist-1",
            eventDate: "2026-07-01",
            eventStartTime: "18:00",
            eventEndTime: "22:00",
            status: "SOFT_HOLD_ACTIVE",
            holdExpiryTime: futureExpiry,
          }),
        },
      ],
    };

    const res = await checkArtistAvailability("artist-1", "2026-07-01", "18:00", "22:00");
    expect(res.available).toBe(false);
    expect(res.reason).toContain("pending hold");
  });

  it("should ignore expired holds", async () => {
    const pastExpiry = new Date(Date.now() - 60000).toISOString();
    mockBookingsSnap = {
      empty: false,
      docs: [
        {
          id: "booking-2",
          data: () => ({
            artistId: "artist-1",
            eventDate: "2026-07-01",
            eventStartTime: "18:00",
            eventEndTime: "22:00",
            status: "SOFT_HOLD_ACTIVE",
            holdExpiryTime: pastExpiry,
          }),
        },
      ],
    };

    const res = await checkArtistAvailability("artist-1", "2026-07-01", "18:00", "22:00");
    expect(res.available).toBe(true);
  });
});
