import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  UserPlus,
  CalendarDays,
  FolderOpen,
  TrendingUp,
  Loader2,
  Database,
  Settings,
  RefreshCw,
  ShieldCheck,
  Mail,
  Smartphone,
  Layers,
  Lock,
  Scale,
  FileText,
  Clock,
  ShieldAlert,
  Ban,
  AlertTriangle,
  IndianRupee,
  Award,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  writeBatch,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { logAdminActivity } from "@/services/artistBookingService";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingStatusBadge } from "@/components/artist-bookings/BookingStatusBadge";
import { VerificationBadge } from "@/components/verification/VerificationBadge";
import type { BookingEvent, NotificationLog, AdminAuditLog } from "@/types/booking";
import AdminEventsList from "@/components/admin/AdminEventsList";
import { cn } from "@/lib/utils";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AdminDashboard() {
  const { currentUser, isAdmin } = useAuth();

  // ── 7 Core KPI State Metrics ──
  const [metrics, setMetrics] = useState({
    artists: 0,
    verified: 0,
    customers: 0,
    bookings: 0,
    completed: 0,
    gmv: 0,
    myKalakarRevenue: 0,
    pendingArtists: 0,
    pendingBriefs: 0,
    todayRegistrations: 0,
  });

  const [allBookings, setAllBookings] = useState<BookingEvent[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [pendingList, setPendingList] = useState<any[]>([]);
  const [pendingBriefsList, setPendingBriefsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(true);

  useEffect(() => {
    const unsubs: (() => void)[] = [];
    setSyncing(true);

    // ── 1. Total Artists & Verified Artists ─────────────────────────────────
    try {
      const qArtists = query(collection(db, "artists"));
      unsubs.push(
        onSnapshot(
          qArtists,
          (snap) => {
            const docs = snap.docs.map((d) => d.data());
            const totalArtists = snap.size;
            const verifiedArtists = docs.filter(
              (d: any) =>
                d.verified === true ||
                (d.verificationTier && d.verificationTier !== "basic") ||
                d.isPremium ||
                d.voucherType === "premium"
            ).length;

            setMetrics((prev) => ({
              ...prev,
              artists: totalArtists,
              verified: verifiedArtists,
            }));
          },
          (err) => console.warn("artists stats:", err)
        )
      );
    } catch (e) {
      console.warn(e);
    }

    // ── 2. Customers Count (users collection where role == customer) ────────
    try {
      const qClients = query(collection(db, "users"), where("role", "==", "customer"));
      unsubs.push(
        onSnapshot(
          qClients,
          (snap) => {
            const clientDocs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setClients(clientDocs);
            setMetrics((prev) => ({
              ...prev,
              customers: snap.size,
            }));
          },
          (err) => console.warn("clients sub fail:", err)
        )
      );
    } catch (e) {
      console.warn(e);
    }

    // ── 3. Bookings, Completed, GMV & MyKalakar Revenue ─────────────────────
    try {
      const qBookings = query(collection(db, "artist_bookings"));
      unsubs.push(
        onSnapshot(
          qBookings,
          (snap) => {
            const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as BookingEvent[];
            data.sort((a: any, b: any) => {
              const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return tB - tA;
            });

            const totalBookings = data.length;
            const completedBookings = data.filter((b) =>
              ["EVENT_COMPLETED", "completed", "PAYOUT_RELEASED"].includes(b.status)
            ).length;

            // Calculate total Gross Merchandise Value (GMV)
            let totalGmv = 0;
            data.forEach((b: any) => {
              const amt = Number(b.authorizedAmount || b.quotedPrice || b.amount || b.budget || 0);
              totalGmv += amt;
            });

            // MyKalakar Platform Revenue (10% Platform Take-Rate on transacted volume)
            const revenue = Math.round(totalGmv * 0.10);

            setAllBookings(data);
            setMetrics((prev) => ({
              ...prev,
              bookings: totalBookings,
              completed: completedBookings,
              gmv: totalGmv,
              myKalakarRevenue: revenue,
            }));
            setSyncing(false);
          },
          (err) => {
            console.warn("bookings sub fail:", err);
            setSyncing(false);
          }
        )
      );
    } catch (e) {
      console.warn(e);
      setSyncing(false);
    }

    // ── 4. Pending Artist Applications ─────────────────────────────────────
    try {
      const qPending = query(
        collection(db, "artist_applications"),
        where("status", "==", "pending")
      );
      unsubs.push(
        onSnapshot(
          qPending,
          (snap) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const docs: any[] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            docs.sort((a: any, b: any) => {
              const tA = a.createdAt?.toDate?.()?.getTime() || 0;
              const tB = b.createdAt?.toDate?.()?.getTime() || 0;
              return tB - tA;
            });
            const todayCount = docs.filter((d: any) => {
              const ts = d.createdAt?.toDate?.();
              return ts && ts >= today;
            }).length;

            setMetrics((prev) => ({
              ...prev,
              pendingArtists: snap.size,
              todayRegistrations: todayCount,
            }));
            setPendingList(docs.slice(0, 5));
          },
          (err) => console.warn("pending apps:", err)
        )
      );
    } catch (e) {
      console.warn(e);
    }

    // ── 5. Pending Event Briefs Moderation ─────────────────────────────────
    try {
      const qBriefs = query(
        collection(db, "event_briefs"),
        where("status", "==", "pending")
      );
      unsubs.push(
        onSnapshot(
          qBriefs,
          (snap) => {
            setMetrics((prev) => ({ ...prev, pendingBriefs: snap.size }));
            const docs: any[] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setPendingBriefsList(docs.slice(0, 5));
          },
          (err) => console.warn("pending briefs stats:", err)
        )
      );
    } catch (e) {
      console.warn(e);
    }

    const timer = setTimeout(() => {
      setSyncing(false);
    }, 800);

    return () => {
      clearTimeout(timer);
      unsubs.forEach((u) => u());
    };
  }, [currentUser, isAdmin]);

  // ── Block / Unblock Client ────────────────────────────────────────────────
  const handleToggleClientStatus = async (client: any) => {
    const nextStatus = client.status === "blocked" ? "active" : "blocked";
    try {
      await updateDoc(doc(db, "users", client.id), { status: nextStatus });
      await logAdminActivity(
        currentUser?.email || "admin@mykalakar.com",
        nextStatus === "blocked" ? "BLOCK_CLIENT" : "UNBLOCK_CLIENT",
        `Admin ${currentUser?.email || "System"} toggled client status for ${client.name || client.email} to ${nextStatus}`
      );
      toast({
        title: `Client ${nextStatus === "blocked" ? "Blocked 🚫" : "Activated ✅"}`,
        description: `Status updated for ${client.name || client.email}.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Action failed",
        description: "Could not toggle client account status.",
      });
    }
  };

  // ── Escrow breakdown calculations ─────────────────────────────────────────
  const escrowMetrics = useMemo(() => {
    let authorized = 0;
    let held = 0;
    let locked = 0;
    let released = 0;

    allBookings.forEach((b: any) => {
      const amt = Number(b.authorizedAmount || b.quotedPrice || b.amount || b.budget || 0);
      if (b.status === "PAYMENT_AUTHORIZED" || b.status === "SOFT_HOLD_ACTIVE") {
        authorized += amt;
      } else if (b.status === "CONFIRMED" || b.status === "booked" || b.status === "artist_confirmed") {
        held += amt;
      } else if (b.status === "DISPUTE_OPENED") {
        locked += amt;
      } else if (["PAYOUT_RELEASED", "EVENT_COMPLETED", "completed"].includes(b.status)) {
        released += amt;
      }
    });

    return { authorized, held, locked, released };
  }, [allBookings]);

  // Verified & Fulfillment Ratios
  const verifiedPercentage = metrics.artists > 0 ? Math.round((metrics.verified / metrics.artists) * 100) : 0;
  const fulfillmentPercentage = metrics.bookings > 0 ? Math.round((metrics.completed / metrics.bookings) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* ── Top Executive Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-black text-stone-900 tracking-tight">
            MyKalakar Control Center 👑
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 font-semibold mt-1">
            Real-time platform intelligence, verification audit, marketplace volume, and GMV revenue
          </p>
        </div>
        <div className="flex items-center gap-2">
          {metrics.pendingArtists > 0 && (
            <Link to="/admin/pending">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black animate-pulse">
                <ShieldAlert className="h-4 w-4 text-amber-600" />
                {metrics.pendingArtists} Pending Approvals
              </span>
            </Link>
          )}
          <Link to="/admin/pending">
            <Button className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-md h-10 px-4">
              Review Queue <ArrowUpRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      {/* ── 7 Core KPI Cards (Executive Command Row) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* 1. Artists */}
        <Link to="/admin/artists" className="group">
          <Card className="rounded-2xl border-stone-200 bg-white hover:border-orange-300 hover:shadow-md transition p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-stone-500">Artists</span>
              <div className="p-1.5 rounded-xl bg-orange-50 text-orange-600">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-stone-950 tracking-tight">
                {syncing ? "..." : metrics.artists}
              </p>
              <p className="text-[10px] font-bold text-stone-400 mt-0.5">Total Onboarded</p>
            </div>
          </Card>
        </Link>

        {/* 2. Verified */}
        <Link to="/admin/artists" className="group">
          <Card className="rounded-2xl border-emerald-200 bg-emerald-50/40 hover:border-emerald-300 hover:shadow-md transition p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Verified</span>
              <div className="p-1.5 rounded-xl bg-emerald-100 text-emerald-700">
                <Award className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-stone-950 tracking-tight">
                {syncing ? "..." : metrics.verified}
              </p>
              <span className="inline-block mt-0.5 text-[9px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                {verifiedPercentage}% Verified
              </span>
            </div>
          </Card>
        </Link>

        {/* 3. Customers */}
        <Link to="/admin/dashboard" className="group">
          <Card className="rounded-2xl border-stone-200 bg-white hover:border-blue-300 hover:shadow-md transition p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-stone-500">Customers</span>
              <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600">
                <UserPlus className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-stone-950 tracking-tight">
                {syncing ? "..." : metrics.customers}
              </p>
              <p className="text-[10px] font-bold text-stone-400 mt-0.5">Event Organizers</p>
            </div>
          </Card>
        </Link>

        {/* 4. Bookings */}
        <Link to="/admin/bookings" className="group">
          <Card className="rounded-2xl border-stone-200 bg-white hover:border-indigo-300 hover:shadow-md transition p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-stone-500">Bookings</span>
              <div className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600">
                <CalendarDays className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-stone-950 tracking-tight">
                {syncing ? "..." : metrics.bookings}
              </p>
              <p className="text-[10px] font-bold text-stone-400 mt-0.5">Total Orders</p>
            </div>
          </Card>
        </Link>

        {/* 5. Completed */}
        <Link to="/admin/bookings" className="group">
          <Card className="rounded-2xl border-stone-200 bg-white hover:border-teal-300 hover:shadow-md transition p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-stone-500">Completed</span>
              <div className="p-1.5 rounded-xl bg-teal-50 text-teal-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-stone-950 tracking-tight">
                {syncing ? "..." : metrics.completed}
              </p>
              <span className="inline-block mt-0.5 text-[9px] font-black text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-md">
                {fulfillmentPercentage}% Fulfilled
              </span>
            </div>
          </Card>
        </Link>

        {/* 6. GMV */}
        <Link to="/admin/bookings" className="group col-span-2 sm:col-span-1 lg:col-span-1">
          <Card className="rounded-2xl border-stone-900 bg-stone-900 text-white hover:shadow-lg transition p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">GMV</span>
              <div className="p-1.5 rounded-xl bg-white/10 text-orange-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-xl font-black tracking-tight text-orange-400 truncate">
                {syncing ? "..." : formatCurrency(metrics.gmv)}
              </p>
              <p className="text-[9px] font-medium text-stone-400 mt-0.5">Gross Merch Value</p>
            </div>
          </Card>
        </Link>

        {/* 7. MyKalakar Revenue */}
        <Link to="/admin/bookings" className="group col-span-2 sm:col-span-2 lg:col-span-1">
          <Card className="rounded-2xl border-orange-200 bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:shadow-lg transition p-4 flex flex-col justify-between h-full shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-100">Revenue</span>
              <div className="p-1.5 rounded-xl bg-white/20 text-white">
                <IndianRupee className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-xl font-black tracking-tight text-white truncate">
                {syncing ? "..." : formatCurrency(metrics.myKalakarRevenue)}
              </p>
              <p className="text-[9px] font-bold text-orange-100 mt-0.5">10% Platform Take</p>
            </div>
          </Card>
        </Link>
      </div>

      {/* ── Sub-Suite Tabs ── */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-stone-100 p-1.5 rounded-2xl flex flex-wrap gap-1 border border-stone-200">
          <TabsTrigger value="overview" className="text-xs font-extrabold px-5 py-2 rounded-xl">
            Live Overview
          </TabsTrigger>
          <TabsTrigger value="clients" className="text-xs font-extrabold px-5 py-2 rounded-xl">
            Customers ({clients.length})
          </TabsTrigger>
          <TabsTrigger value="escrow" className="text-xs font-extrabold px-5 py-2 rounded-xl">
            Escrow Analytics
          </TabsTrigger>
          <TabsTrigger value="events" className="text-xs font-extrabold px-5 py-2 rounded-xl">
            Event Moderation
          </TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* Recent Bookings preview */}
          <Card className="rounded-3xl border-stone-200 shadow-sm overflow-hidden bg-white">
            <CardHeader className="p-6 border-b border-stone-100 flex flex-row items-center justify-between bg-stone-50/50">
              <div>
                <CardTitle className="text-base font-black text-stone-900">Recent Platform Bookings</CardTitle>
                <p className="text-xs text-stone-500 font-semibold mt-0.5">Live incoming customer inquiries and orders</p>
              </div>
              <Link to="/admin/bookings">
                <Button variant="ghost" size="sm" className="text-xs font-black text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                  View All ({allBookings.length}) →
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {syncing ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-orange-600" /></div>
              ) : allBookings.length === 0 ? (
                <p className="text-sm text-stone-400 font-semibold text-center py-10">No recent bookings recorded.</p>
              ) : (
                <div className="divide-y divide-stone-100">
                  {allBookings.slice(0, 5).map((b) => (
                    <div key={b.id} className="flex items-center justify-between p-4 hover:bg-stone-50/60 transition">
                      <div>
                        <p className="font-extrabold text-sm text-stone-900">{b.clientName || "Customer"}</p>
                        <p className="text-xs text-stone-500 font-medium">
                          {b.artistName || "Artist"} · {b.performanceType} · {b.eventDate}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <BookingStatusBadge status={b.status} />
                        <p className="text-xs font-black text-stone-900">
                          ₹{(b.authorizedAmount || (b as any).quotedPrice || (b as any).amount || 0).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Artist applications preview */}
          <Card className="rounded-3xl border-stone-200 shadow-sm overflow-hidden bg-white">
            <CardHeader className="p-6 border-b border-stone-100 flex flex-row items-center justify-between bg-stone-50/50">
              <div>
                <CardTitle className="text-base font-black text-stone-900">Pending Artist Registrations</CardTitle>
                <p className="text-xs text-stone-500 font-semibold mt-0.5">Artists awaiting manual credential audit & tier approval</p>
              </div>
              <Link to="/admin/pending">
                <Button variant="outline" size="sm" className="text-xs font-extrabold rounded-xl">
                  Review Applications ({metrics.pendingArtists}) →
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-6">
              {pendingList.length === 0 ? (
                <p className="text-sm text-stone-400 font-bold text-center py-4">All artist registration applications are cleared ✅</p>
              ) : (
                <div className="space-y-3">
                  {pendingList.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 border border-stone-200/70">
                      <div>
                        <p className="font-black text-sm text-stone-900">{a.name}</p>
                        <p className="text-xs text-stone-500 font-medium">{a.category} · {a.district || a.city}</p>
                      </div>
                      <Link to="/admin/pending">
                        <Button size="sm" className="h-8 text-xs font-extrabold rounded-xl bg-orange-600 hover:bg-orange-700 text-white">
                          Audit & Approve
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Clients Tab ── */}
        <TabsContent value="clients" className="mt-4">
          <Card className="rounded-3xl border-stone-200 shadow-sm overflow-hidden bg-white">
            <CardContent className="p-0">
              <div className="overflow-x-auto w-full">
                <Table>
                  <TableHeader className="bg-stone-50/60">
                    <TableRow>
                      <TableHead className="px-6 py-4 text-xs font-black uppercase tracking-wider text-stone-500">Customer Details</TableHead>
                      <TableHead className="px-6 py-4 text-xs font-black uppercase tracking-wider text-stone-500">Account Status</TableHead>
                      <TableHead className="px-6 py-4 text-xs font-black uppercase tracking-wider text-stone-500">Security</TableHead>
                      <TableHead className="text-right px-6 py-4 text-xs font-black uppercase tracking-wider text-stone-500">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-stone-100">
                    {clients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12 text-stone-400 font-bold">
                          No customer accounts registered yet.
                        </TableCell>
                      </TableRow>
                    ) : null}
                    {clients.map((c) => (
                      <TableRow key={c.id} className="hover:bg-stone-50/50">
                        <TableCell className="px-6 py-4">
                          <p className="font-black text-stone-900">{c.name || "Customer"}</p>
                          <p className="text-xs text-stone-400 font-medium">{c.email || c.phone || "No contact"}</p>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge variant="outline" className={cn(
                            "capitalize font-bold text-xs rounded-lg px-2.5 py-0.5",
                            c.status === "blocked" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
                          )}>
                            {c.status || "active"}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-xs text-stone-400 font-semibold">
                          OAuth Verified
                        </TableCell>
                        <TableCell className="text-right px-6 py-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleClientStatus(c)}
                            className={cn(
                              "rounded-xl text-xs font-extrabold h-8",
                              c.status === "blocked" ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50" : "border-red-200 text-red-600 hover:bg-red-50"
                            )}
                          >
                            {c.status === "blocked" ? "Unblock Client" : "Block Client"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Escrow Analytics Tab ── */}
        <TabsContent value="escrow" className="space-y-6 mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-2xl bg-stone-50 border-stone-200 p-4 text-center">
              <p className="text-[10px] text-stone-500 font-black uppercase mb-1">Authorized Hold Volume</p>
              <p className="text-2xl font-black text-stone-800">{formatCurrency(escrowMetrics.authorized)}</p>
            </Card>
            <Card className="rounded-2xl bg-amber-50 border-amber-200 p-4 text-center">
              <p className="text-[10px] text-amber-800 font-black uppercase mb-1">Held in Escrow</p>
              <p className="text-2xl font-black text-amber-900">{formatCurrency(escrowMetrics.held)}</p>
            </Card>
            <Card className="rounded-2xl bg-rose-50 border-rose-200 p-4 text-center">
              <p className="text-[10px] text-rose-800 font-black uppercase mb-1">Locked (Disputes)</p>
              <p className="text-2xl font-black text-rose-900">{formatCurrency(escrowMetrics.locked)}</p>
            </Card>
            <Card className="rounded-2xl bg-emerald-50 border-emerald-200 p-4 text-center">
              <p className="text-[10px] text-emerald-800 font-black uppercase mb-1">Released Payouts</p>
              <p className="text-2xl font-black text-emerald-900">{formatCurrency(escrowMetrics.released)}</p>
            </Card>
          </div>
        </TabsContent>

        {/* ── Events Moderation Tab ── */}
        <TabsContent value="events" className="mt-4">
          <Card className="rounded-3xl border-stone-200 shadow-sm overflow-hidden bg-white">
            <CardContent className="p-6">
              <div className="mb-4">
                <h3 className="font-display font-bold text-base text-stone-900">Events Moderation Vault</h3>
                <p className="text-xs text-stone-500">Review and verify client event briefs and customized requirements.</p>
              </div>
              <AdminEventsList />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
