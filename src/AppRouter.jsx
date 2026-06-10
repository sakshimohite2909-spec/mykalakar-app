import { lazy } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Loader2 } from "lucide-react";
import MainLayout from "@/MainLayout";
import ArtistProtectedRoute from "@/components/ArtistProtectedRoute";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import ProtectedRoute from "@/components/ProtectedRoute";
import RouteErrorBoundary from "@/components/RouteErrorBoundary";

const Index = lazy(() => import("./pages/Index"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const EventSelection = lazy(() => import("./pages/EventSelection"));
const Events = lazy(() => import("./pages/Events"));
const LocationSelection = lazy(() => import("./pages/LocationSelection"));
const EventRequirements = lazy(() => import("./pages/EventRequirements"));
const ArtistProfile = lazy(() => import("./pages/ArtistProfile"));
const EventDetails = lazy(() => import("./pages/EventDetails"));
const ArtistRegister = lazy(() => import("./pages/ArtistRegister"));
const ArtistLogin = lazy(() => import("./pages/ArtistLogin"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminArtists = lazy(() => import("./pages/admin/AdminArtists"));
const AdminArtistDashboard = lazy(() => import("./pages/admin/AdminArtistDashboard"));
const AdminPending = lazy(() => import("./pages/admin/AdminPending"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminBookings = lazy(() => import("./pages/admin/AdminBookings"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminEvents = lazy(() => import("./pages/admin/AdminEvents"));
const AdminLocations = lazy(() => import("./pages/admin/AdminLocations"));
const AdminBootstrap = lazy(() => import("./pages/admin/AdminBootstrap"));
const AdminEventBriefs = lazy(() => import("./pages/admin/AdminEventBriefs"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AntiGravity = lazy(() => import("./pages/AntiGravity"));
const ArtistLayout = lazy(() => import("./pages/artist/ArtistLayout"));
const ArtistDashboardHome = lazy(() => import("./pages/artist/ArtistDashboardHome"));
const ArtistEditProfile = lazy(() => import("./pages/artist/ArtistEditProfile"));
const ArtistBookings = lazy(() => import("./pages/artist/ArtistBookings"));
const ArtistCalendar = lazy(() => import("./pages/artist/ArtistCalendar"));
const ArtistUpcomingEvents = lazy(() => import("./pages/artist/ArtistUpcomingEvents"));
const ArtistCompletedEvents = lazy(() => import("./pages/artist/ArtistCompletedEvents"));
const ArtistAvailabilityPage = lazy(() => import("./pages/artist/ArtistAvailabilityPage"));
const ArtistNotifications = lazy(() => import("./pages/artist/ArtistNotifications"));
const ArtistReviews = lazy(() => import("./pages/artist/ArtistReviews"));
const ArtistSettings = lazy(() => import("./pages/artist/ArtistSettings"));

const artistDashboardChildren = [
  { index: true, element: <ArtistDashboardHome /> },
  { path: "profile", element: <ArtistEditProfile /> },
  { path: "bookings", element: <ArtistBookings /> },
  { path: "calendar", element: <ArtistCalendar /> },
  { path: "upcoming", element: <ArtistUpcomingEvents /> },
  { path: "completed", element: <ArtistCompletedEvents /> },
  { path: "availability", element: <ArtistAvailabilityPage /> },
  { path: "notifications", element: <ArtistNotifications /> },
  { path: "reviews", element: <ArtistReviews /> },
  { path: "settings", element: <ArtistSettings /> },
];

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <Index /> },
      { path: "register", element: <ArtistRegister /> },
      { path: "artist-register", element: <ArtistRegister /> },
      { path: "admin-register", element: <ArtistRegister /> },
      { path: "user-register", element: <ArtistRegister /> },
      { path: "login", element: <ArtistLogin /> },
      { path: "artist-login", element: <ArtistLogin /> },
      { path: "admin-login", element: <ArtistLogin /> },
      { path: "user-login", element: <ArtistLogin /> },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        ),
      },
      { path: "antigravity", element: <AntiGravity /> },
      {
        path: "bootstrap",
        element: (
          <AdminProtectedRoute>
            <AdminBootstrap />
          </AdminProtectedRoute>
        ),
      },
      { path: "explore", element: <SearchPage /> },
      { path: "artists", element: <SearchPage /> },
      { path: "search", element: <SearchPage /> },
      { path: "events", element: <Events /> },
      { path: "event/:id", element: <EventDetails /> },
      { path: "location-select", element: <LocationSelection /> },
      { path: "event-requirements", element: <EventRequirements /> },
      { path: "artist/:id", element: <ArtistProfile /> },
      {
        path: "artist/dashboard",
        element: (
          <ArtistProtectedRoute>
            <ArtistLayout />
          </ArtistProtectedRoute>
        ),
        errorElement: <RouteErrorBoundary />,
        children: artistDashboardChildren,
      },
      {
        path: "dashboard",
        element: (
          <ArtistProtectedRoute>
            <ArtistLayout />
          </ArtistProtectedRoute>
        ),
        errorElement: <RouteErrorBoundary />,
        children: artistDashboardChildren,
      },
      {
        path: "admin",
        element: (
          <AdminProtectedRoute>
            <AdminLayout />
          </AdminProtectedRoute>
        ),
        errorElement: <RouteErrorBoundary />,
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: "artists", element: <AdminArtists /> },
          { path: "artist/:id", element: <AdminArtistDashboard /> },
          { path: "pending", element: <AdminPending /> },
          { path: "categories", element: <AdminCategories /> },
          { path: "events", element: <AdminEvents /> },
          { path: "bookings", element: <AdminBookings /> },
          { path: "locations", element: <AdminLocations /> },
          { path: "settings", element: <AdminSettings /> },
          { path: "bootstrap", element: <AdminBootstrap /> },
          { path: "event-briefs", element: <AdminEventBriefs /> },
        ],
      },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

function RouterFallback() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#FDFBF7]">
      <Loader2 className="h-10 w-10 animate-spin text-indigo-700" />
    </div>
  );
}

export default function AppRouter() {
  return (
    <RouterProvider
      router={router}
      fallbackElement={<RouterFallback />}
      future={{ v7_startTransition: true }}
    />
  );
}
