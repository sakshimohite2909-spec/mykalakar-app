import { lazy } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Loader2 } from "lucide-react";
import MainLayout from "@/MainLayout";
import ArtistProtectedRoute from "@/components/ArtistProtectedRoute";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import ProtectedRoute from "@/components/ProtectedRoute";

const Index = lazy(() => import("./pages/Index"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const EventSelection = lazy(() => import("./pages/EventSelection"));
const LocationSelection = lazy(() => import("./pages/LocationSelection"));
const EventRequirements = lazy(() => import("./pages/EventRequirements"));
const ArtistProfile = lazy(() => import("./pages/ArtistProfile"));
const EventDetails = lazy(() => import("./pages/EventDetails"));
const ArtistRegistrationForm = lazy(() => import("./pages/artist-registration/ArtistRegistrationForm"));
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
const NotFound = lazy(() => import("./pages/NotFound"));
const AntiGravity = lazy(() => import("./pages/AntiGravity"));
const ArtistLayout = lazy(() => import("./pages/artist/ArtistLayout"));
const ArtistDashboardHome = lazy(() => import("./pages/artist/ArtistDashboardHome"));
const ArtistEditProfile = lazy(() => import("./pages/artist/ArtistEditProfile"));
const ArtistBookings = lazy(() => import("./pages/artist/ArtistBookings"));
const ArtistReviews = lazy(() => import("./pages/artist/ArtistReviews"));
const ArtistSettings = lazy(() => import("./pages/artist/ArtistSettings"));

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { index: true, element: <Index /> },
      { path: "register", element: <ArtistRegistrationForm /> },
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
      { path: "events", element: <EventSelection /> },
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
        children: [
          { index: true, element: <ArtistDashboardHome /> },
          { path: "profile", element: <ArtistEditProfile /> },
          { path: "bookings", element: <ArtistBookings /> },
          { path: "reviews", element: <ArtistReviews /> },
          { path: "settings", element: <ArtistSettings /> },
        ],
      },
      {
        path: "admin",
        element: (
          <AdminProtectedRoute>
            <AdminLayout />
          </AdminProtectedRoute>
        ),
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
