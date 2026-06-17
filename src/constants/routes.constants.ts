/**
 * Centralized Route Constants
 * Replaces magic strings across the application to enforce type-safety and eliminate typos.
 */

export const ROUTES = {
  // Public
  HOME: "/",
  EXPLORE: "/explore",
  ARTISTS_SEARCH: "/artists",
  SEARCH: "/search",
  EVENTS: "/events",
  EVENT_DETAILS: (id: string) => `/event/${id}`,
  LOCATION_SELECT: "/location-select",
  EVENT_REQUIREMENTS: "/event-requirements",
  NOT_FOUND: "*",

  // Authentication & Onboarding
  REGISTER: "/register",
  ARTIST_REGISTER: "/artist-register",
  ADMIN_REGISTER: "/admin-register",
  USER_REGISTER: "/user-register",
  LOGIN: "/login",
  ARTIST_LOGIN: "/artist-login",
  ADMIN_LOGIN: "/admin-login",
  USER_LOGIN: "/user-login",
  FORGOT_PASSWORD: "/forgot-password",

  // Profiles
  ARTIST_PROFILE: (id: string) => `/artist/${id}`,
  USER_PROFILE: "/profile",

  // Artist Dashboard
  ARTIST_DASHBOARD: "/artist/dashboard",
  DASHBOARD: "/dashboard", // Alias
  ARTIST_DASHBOARD_PROFILE: "profile",
  ARTIST_DASHBOARD_BOOKINGS: "bookings",
  ARTIST_DASHBOARD_CALENDAR: "calendar",
  ARTIST_DASHBOARD_UPCOMING: "upcoming",
  ARTIST_DASHBOARD_COMPLETED: "completed",
  ARTIST_DASHBOARD_AVAILABILITY: "availability",
  ARTIST_DASHBOARD_NOTIFICATIONS: "notifications",
  ARTIST_DASHBOARD_REVIEWS: "reviews",
  ARTIST_DASHBOARD_SETTINGS: "settings",

  // Admin Dashboard
  ADMIN: "/admin",
  ADMIN_ARTISTS: "artists",
  ADMIN_ARTIST_DETAIL: (id: string) => `artist/${id}`,
  ADMIN_PENDING: "pending",
  ADMIN_CATEGORIES: "categories",
  ADMIN_EVENTS: "events",
  ADMIN_BOOKINGS: "bookings",
  ADMIN_LOCATIONS: "locations",
  ADMIN_SETTINGS: "settings",
  ADMIN_BOOTSTRAP: "bootstrap",
  ADMIN_EVENT_BRIEFS: "event-briefs",
} as const;

export type AppRoutes = typeof ROUTES;
