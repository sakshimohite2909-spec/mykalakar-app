import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { imageRegistry } from "@/services/ImageRegistryService";
import { getUsableImageUrl } from "@/utils/fallbackImages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useArtistBookings } from "@/hooks/useArtistBookings";
import { Link } from "react-router-dom";
import {
  Eye,
  Star,
  CalendarCheck,
  CalendarDays,
  CalendarClock,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Edit,
  ArrowRight,
  Music,
  MapPin,
  Phone,
  Clock,
  IndianRupee,
  UserCircle,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { VerificationBadge } from "@/components/verification/VerificationBadge";
import { BookingStatusBadge } from "@/components/artist-bookings/BookingStatusBadge";
import { BookingDetailModal } from "@/components/artist-bookings/BookingDetailModal";
import type { BookingEvent } from "@/types/booking";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString?: string) {
  if (!dateString) return "Date TBD";
  try {
    return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

export default function ArtistDashboard() {
  const { artistData } = useAuth();
  const {
    bookings,
    summary,
    earningsSummary,
    loadingBookings,
    updateStatus,
  } = useArtistBookings();
  const [selectedBooking, setSelectedBooking] = useState<BookingEvent | null>(null);

  if (!artistData) return null;

  const fallbackProfileImage = imageRegistry.getUniqueImage({
    category: artistData.subcategory || artistData.artForm || artistData.category || "Default",
    type: "artist",
    key: artistData.id || artistData.uid || artistData.name || "dashboard-profile",
  });
  const artistProfileImage = getUsableImageUrl(artistData.media?.profilePhoto || artistData.profilePhoto) || fallbackProfileImage;

  // ── 5 Core Metrics Requested by User ──
  const metricCards = [
    {
      label: "Profile Views",
      value: (artistData.stats?.profileViews || artistData.profileViews || 0).toLocaleString("en-IN"),
      subtext: "Total profile impressions",
      icon: Eye,
      color: "text-blue-600",
      bg: "bg-blue-50 border-blue-100",
      link: `/artist/${artistData.id}`,
    },
    {
      label: "Booking Requests",
      value: loadingBookings ? "..." : summary.pending,
      subtext: "Awaiting your response",
      icon: CalendarClock,
      color: "text-amber-600",
      bg: "bg-amber-50 border-amber-100",
      link: "/artist/dashboard/bookings",
    },
    {
      label: "Upcoming Events",
      value: loadingBookings ? "..." : summary.upcoming,
      subtext: "Confirmed stage shows",
      icon: CalendarDays,
      color: "text-indigo-600",
      bg: "bg-indigo-50 border-indigo-100",
      link: "/artist/dashboard/upcoming",
    },
    {
      label: "Completed Bookings",
      value: loadingBookings ? "..." : summary.completed,
      subtext: "Past performances",
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50 border-emerald-100",
      link: "/artist/dashboard/completed",
    },
    {
      label: "Earnings",
      value: loadingBookings ? "..." : formatCurrency(earningsSummary.total),
      subtext: `₹${earningsSummary.paid.toLocaleString("en-IN")} paid • ₹${earningsSummary.pending.toLocaleString("en-IN")} pending`,
      icon: IndianRupee,
      color: "text-orange-600",
      bg: "bg-orange-50 border-orange-100",
      link: "/artist/dashboard/earnings",
    },
  ];

  // Recent 5 booking requests
  const recentBookings = bookings.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* ── Top Welcome & Profile Action ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
          <div className="flex items-center gap-4">
            <img
              src={artistProfileImage}
              alt={artistData.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-stone-100 shadow-sm shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-xl md:text-2xl font-black text-stone-900">
                  Welcome, {artistData.name?.split(" ")[0]}! 👋
                </h1>
                <VerificationBadge artist={artistData} size="sm" />
              </div>
              <p className="text-xs font-semibold text-stone-500 mt-1 flex items-center gap-2 flex-wrap">
                <span>{artistData.subcategory || artistData.category || "Artist"}</span>
                <span>•</span>
                <span>{artistData.district || artistData.city}, {artistData.state}</span>
                <span>•</span>
                <span className="text-orange-600 font-extrabold flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-orange-500" /> {artistData.rating || 5.0} ({artistData.reviews || 0} reviews)
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/artist/dashboard/profile">
              <Button variant="outline" className="rounded-xl font-extrabold text-xs h-10 border-stone-200">
                <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit Profile
              </Button>
            </Link>
            <Link to={`/artist/${artistData.id}`} target="_blank">
              <Button variant="ghost" className="rounded-xl font-bold text-xs h-10 text-stone-600 hover:text-stone-900">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Public View
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── 5 Core Metrics Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {metricCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * (index + 1) }}
            >
              <Link to={stat.link} className="block group">
                <Card className={`rounded-2xl border transition-all duration-200 group-hover:shadow-md group-hover:-translate-y-0.5 ${stat.bg}`}>
                  <CardContent className="p-4 flex flex-col justify-between h-full">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-stone-500">
                        {stat.label}
                      </span>
                      <div className={`p-1.5 rounded-xl bg-white shadow-xs ${stat.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-stone-950 tracking-tight">
                        {stat.value}
                      </p>
                      <p className="text-[10px] font-bold text-stone-500 mt-1 truncate">
                        {stat.subtext}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* ── Section: Booking Requests Table ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card className="rounded-3xl border-stone-200 shadow-sm overflow-hidden bg-white">
          <CardHeader className="p-6 border-b border-stone-100 flex flex-row items-center justify-between bg-stone-50/50">
            <div>
              <CardTitle className="text-lg font-black text-stone-900 flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-orange-600" />
                Recent Booking Requests
              </CardTitle>
              <p className="text-xs text-stone-500 font-semibold mt-0.5">
                Inquiries and performance bookings from clients
              </p>
            </div>
            <Link to="/artist/dashboard/bookings">
              <Button variant="ghost" className="font-black text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-xl">
                View All Requests <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </CardHeader>

          <CardContent className="p-0">
            {recentBookings.length === 0 ? (
              <div className="text-center py-12 px-4">
                <CalendarClock className="h-10 w-10 text-stone-300 mx-auto mb-2" />
                <p className="text-sm font-black text-stone-700">No booking requests yet</p>
                <p className="text-xs text-stone-400 font-semibold mt-0.5">
                  When organizers and clients send inquiries, they will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50/70 text-stone-400 uppercase tracking-widest font-black text-[10px]">
                    <tr>
                      <th className="px-6 py-3.5">Customer</th>
                      <th className="px-6 py-3.5">Date</th>
                      <th className="px-6 py-3.5">Location</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                    {recentBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-stone-50/50 transition">
                        <td className="px-6 py-4">
                          <div className="font-extrabold text-stone-900 text-sm">
                            {b.clientName || "Event Client"}
                          </div>
                          <div className="text-stone-400 text-xs font-semibold">
                            {b.performanceType || "Performance"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-stone-700 font-bold">
                          {formatDate(b.eventDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-stone-600 font-semibold max-w-[180px] truncate">
                          {b.venueLocation || "Location TBD"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <BookingStatusBadge status={b.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedBooking(b)}
                            className="h-8 px-3 rounded-lg font-bold text-xs border-stone-200 hover:bg-orange-50 hover:text-orange-600"
                          >
                            Review
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Quick Hub Links (Profile, Calendar, Earnings, Reviews) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* My Profile */}
        <Link to="/artist/dashboard/profile">
          <Card className="rounded-2xl border-stone-200 hover:border-orange-300 hover:shadow-md transition group p-5 bg-white h-full">
            <div className="flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                <UserCircle className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-black text-stone-900 group-hover:text-orange-600 transition">
                  My Profile
                </h3>
                <p className="text-xs text-stone-500 font-medium truncate">Edit bio, gallery & prices</p>
              </div>
              <ArrowRight className="h-4 w-4 text-stone-400 group-hover:text-orange-600 transition shrink-0" />
            </div>
          </Card>
        </Link>

        {/* Calendar */}
        <Link to="/artist/dashboard/calendar">
          <Card className="rounded-2xl border-stone-200 hover:border-indigo-300 hover:shadow-md transition group p-5 bg-white h-full">
            <div className="flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-black text-stone-900 group-hover:text-indigo-600 transition">
                  Calendar
                </h3>
                <p className="text-xs text-stone-500 font-medium truncate">Available / Booked schedule</p>
              </div>
              <ArrowRight className="h-4 w-4 text-stone-400 group-hover:text-indigo-600 transition shrink-0" />
            </div>
          </Card>
        </Link>

        {/* Earnings */}
        <Link to="/artist/dashboard/earnings">
          <Card className="rounded-2xl border-stone-200 hover:border-emerald-300 hover:shadow-md transition group p-5 bg-white h-full">
            <div className="flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <IndianRupee className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-black text-stone-900 group-hover:text-emerald-600 transition">
                  Earnings
                </h3>
                <p className="text-xs text-stone-500 font-medium truncate">Total, Pending, Paid</p>
              </div>
              <ArrowRight className="h-4 w-4 text-stone-400 group-hover:text-emerald-600 transition shrink-0" />
            </div>
          </Card>
        </Link>

        {/* Reviews */}
        <Link to="/artist/dashboard/reviews">
          <Card className="rounded-2xl border-stone-200 hover:border-yellow-300 hover:shadow-md transition group p-5 bg-white h-full">
            <div className="flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-yellow-100 text-yellow-600 flex items-center justify-center shrink-0">
                <Star className="h-5 w-5 fill-yellow-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-black text-stone-900 group-hover:text-yellow-600 transition">
                  Reviews
                </h3>
                <p className="text-xs text-stone-500 font-medium truncate">Customer ratings & feedback</p>
              </div>
              <ArrowRight className="h-4 w-4 text-stone-400 group-hover:text-yellow-600 transition shrink-0" />
            </div>
          </Card>
        </Link>
      </div>

      {/* Booking Detail Modal */}
      <BookingDetailModal
        booking={selectedBooking}
        open={Boolean(selectedBooking)}
        onOpenChange={(open) => !open && setSelectedBooking(null)}
        onStatusChange={updateStatus}
      />
    </div>
  );
}
