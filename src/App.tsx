import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AuthProvider } from "@/contexts/AuthContext";
import { MasterDataProvider } from "@/contexts/MasterDataContext";
import { I18nProvider } from "@/i18n/I18nProvider";
import ArtistProtectedRoute from "@/components/ArtistProtectedRoute";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import ProtectedRoute from "@/components/ProtectedRoute";
import ScrollToTop from "@/components/ScrollToTop";
import GlobalLayout from "@/components/GlobalLayout";
import ErrorBoundary from "@/components/ErrorBoundary";

const Index = lazy(() => import("./pages/Index"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const EventSelection = lazy(() => import("./pages/EventSelection"));
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
const AdminPending = lazy(() => import("./pages/admin/AdminPending"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminBookings = lazy(() => import("./pages/admin/AdminBookings"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminEvents = lazy(() => import("./pages/admin/AdminEvents"));
const AdminLocations = lazy(() => import("./pages/admin/AdminLocations"));
const AdminBootstrap = lazy(() => import("./pages/admin/AdminBootstrap"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AntiGravity = lazy(() => import("./pages/AntiGravity"));

// Artist Dashboard Pages
const ArtistLayout = lazy(() => import("./pages/artist/ArtistLayout"));
const ArtistDashboardHome = lazy(() => import("./pages/artist/ArtistDashboardHome"));
const ArtistEditProfile = lazy(() => import("./pages/artist/ArtistEditProfile"));
const ArtistBookings = lazy(() => import("./pages/artist/ArtistBookings"));
const ArtistReviews = lazy(() => import("./pages/artist/ArtistReviews"));
const ArtistSettings = lazy(() => import("./pages/artist/ArtistSettings"));

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          <MasterDataProvider>
            <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <ScrollToTop />
              {/* GlobalLayout wraps ALL routes — canvas persists, never reloads */}
              <ErrorBoundary>
                <GlobalLayout>
                  <Suspense fallback={
                    <div className="flex h-screen w-full items-center justify-center bg-transparent">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                  }>
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<Index />} />
                      <Route path="/register" element={<ArtistRegister />} />
                      <Route path="/artist-register" element={<ArtistRegister />} />
                      <Route path="/admin-register" element={<ArtistRegister />} />
                      <Route path="/user-register" element={<ArtistRegister />} />
                      <Route path="/login" element={<ArtistLogin />} />
                      <Route path="/artist-login" element={<ArtistLogin />} />
                      <Route path="/admin-login" element={<ArtistLogin />} />
                      <Route path="/user-login" element={<ArtistLogin />} />
                      <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                      <Route path="/antigravity" element={<AntiGravity />} />
                      <Route path="/bootstrap" element={<AdminProtectedRoute><AdminBootstrap /></AdminProtectedRoute>} />

                      {/* Public Browsing Routes — no auth required */}
                      <Route path="/explore" element={<SearchPage />} />
                      <Route path="/artists" element={<SearchPage />} />
                      <Route path="/search" element={<SearchPage />} />
                      <Route path="/events" element={<EventSelection />} />
                      <Route path="/event/:id" element={<EventDetails />} />
                      <Route path="/location-select" element={<LocationSelection />} />
                      <Route path="/event-requirements" element={<EventRequirements />} />
                      <Route path="/artist/:id" element={<ArtistProfile />} />

                      {/* Artist Dashboard (Protected) */}
                      <Route
                        path="/artist/dashboard"
                        element={
                          <ArtistProtectedRoute>
                            <ArtistLayout />
                          </ArtistProtectedRoute>
                        }
                      >
                        <Route index element={<ArtistDashboardHome />} />
                        <Route path="profile" element={<ArtistEditProfile />} />
                        <Route path="bookings" element={<ArtistBookings />} />
                        <Route path="reviews" element={<ArtistReviews />} />
                        <Route path="settings" element={<ArtistSettings />} />
                      </Route>

                      {/* Admin */}
                      <Route path="/admin" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="artists" element={<AdminArtists />} />
                        <Route path="pending" element={<AdminPending />} />
                        <Route path="categories" element={<AdminCategories />} />
                        <Route path="events" element={<AdminEvents />} />
                        <Route path="bookings" element={<AdminBookings />} />
                        <Route path="locations" element={<AdminLocations />} />
                        <Route path="settings" element={<AdminSettings />} />
                        <Route path="bootstrap" element={<AdminBootstrap />} />
                      </Route>

                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </GlobalLayout>
              </ErrorBoundary>
            </BrowserRouter>
            </TooltipProvider>
          </MasterDataProvider>
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
