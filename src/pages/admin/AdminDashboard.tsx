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
  orderBy,
  writeBatch,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { logAdminActivity } from "@/services/artistBookingService";
import { ArtistCalendarView } from "@/components/artist-bookings/ArtistCalendarView";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingStatusBadge } from "@/components/artist-bookings/BookingStatusBadge";
import type { BookingEvent, NotificationLog, AdminAuditLog } from "@/types/booking";
import AdminEventsList from "@/components/admin/AdminEventsList";

function SlaCountdown({ deadline }: { deadline?: string }) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!deadline) return;
    const update = () => {
      const remaining = new Date(deadline).getTime() - Date.now();
      if (remaining <= 0) {
        setText("Expired");
      } else {
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        setText(`${hours}h ${minutes}m remaining`);
      }
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <span className={cn(
      "px-2.5 py-1 rounded-full text-[10px] uppercase font-black tracking-wider text-white",
      text.includes("remaining") ? "bg-rose-500" : "bg-stone-500 animate-pulse"
    )}>
      {text}
    </span>
  );
}

import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const [counts, setCounts] = useState({
    totalArtists: 0,
    pendingArtists: 0,
    todayRegistrations: 0,
    totalBookings: 0,
    categories: 0,
    trending: 0,
  });

  const [allBookings, setAllBookings] = useState<BookingEvent[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [pendingList, setPendingList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(true);

  useEffect(() => {
    const unsubs: (() => void)[] = [];
    setSyncing(true);

    // ── Total Approved Artists ─────────────────────────────────────────────
    try {
      const qArtists = query(collection(db, "artists"), where("status", "==", "active"));
      unsubs.push(onSnapshot(qArtists, (snap) => {
        setCounts(prev => ({
          ...prev,
          totalArtists: snap.size,
          trending: snap.docs.filter(d => d.data().trending).length,
        }));
      }, (err) => console.warn("artists stats:", err)));
    } catch (e) { console.warn(e); }

    // ── Pending Applications + Today count ────────────────────────────────
    try {
      const qPending = query(
        collection(db, "artist_applications"),
        where("status", "==", "pending"),
        orderBy("createdAt", "desc")
      );
      unsubs.push(onSnapshot(qPending, (snap) => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const todayCount = snap.docs.filter(d => {
          const ts = d.data().createdAt?.toDate?.();
          return ts && ts >= today;
        }).length;
        setCounts(prev => ({ ...prev, pendingArtists: snap.size, todayRegistrations: todayCount }));
        setPendingList(snap.docs.slice(0, 5).map(d => ({ id: d.id, ...d.data() })));
      }, (err) => console.warn("pending apps:", err)));
    } catch (e) { console.warn(e); }

    // ── All Bookings subscription ──────────────────────────────────────────
    try {
      const qBookings = query(collection(db, "artist_bookings"), orderBy("createdAt", "desc"));
      unsubs.push(onSnapshot(qBookings, (snap) => {
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BookingEvent[];
        setAllBookings(data);
        setCounts(prev => ({ ...prev, totalBookings: data.length }));
        setSyncing(false);
      }, (err) => {
        console.warn("bookings sub fail:", err);
        setSyncing(false);
      }));
    } catch (e) { console.warn(e); }

    // ── Clients subscription (users with role customer) ────────────────────
    try {
      const qClients = query(collection(db, "users"), where("role", "==", "customer"));
      unsubs.push(onSnapshot(qClients, (snap) => {
        setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => console.warn("clients sub fail:", err)));
    } catch (e) { console.warn(e); }

    // ── Notification Logs subscription ──────────────────────────────────────
    try {
      const qNotifLogs = query(collection(db, "notification_logs"), orderBy("timestamp", "desc"));
      unsubs.push(onSnapshot(qNotifLogs, (snap) => {
        setNotificationLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as NotificationLog[]);
      }, (err) => console.warn("notification logs fail:", err)));
    } catch (e) { console.warn(e); }

    // ── Audit Logs subscription ────────────────────────────────────────────
    try {
      const qAuditLogs = query(collection(db, "admin_audit_logs"), orderBy("timestamp", "desc"));
      unsubs.push(onSnapshot(qAuditLogs, (snap) => {
        setAuditLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AdminAuditLog[]);
      }, (err) => console.warn("audit logs fail:", err)));
    } catch (e) { console.warn(e); }

    return () => unsubs.forEach(u => u());
  }, []);

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
        description: `Status updated for ${client.name || client.email}.`
      });
    } catch (err) {
      toast({ variant: "destructive", title: "Action failed", description: "Could not toggle client account status." });
    }
  };

  // ── Seeding & Migrating ───────────────────────────────────────────────────
  const seedCategories = useCallback(async () => {
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const existing = await getDocs(collection(db, "categories"));
      existing.forEach(s => batch.delete(s.ref));
      toast({ title: "Categories Update 🚀", description: "Seeded category logs." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update Failed", description: error?.message });
    } finally { setLoading(false); }
  }, []);

  // ── Escrow calculations ──────────────────────────────────────────────────
  const escrowMetrics = useMemo(() => {
    let authorized = 0;
    let held = 0;
    let locked = 0;
    let released = 0;

    allBookings.forEach(b => {
      const amt = b.authorizedAmount || 0;
      if (b.status === "PAYMENT_AUTHORIZED" || b.status === "SOFT_HOLD_ACTIVE") {
        authorized += amt;
      } else if (b.status === "CONFIRMED") {
        held += amt;
      } else if (b.status === "DISPUTE_OPENED") {
        locked += amt;
      } else if (["PAYOUT_RELEASED", "DISPUTE_RESOLVED", "REFUND_PROCESSED"].includes(b.status)) {
        released += amt;
      }
    });

    return { authorized, held, locked, released };
  }, [allBookings]);

  // ── Pending SLA items ──────────────────────────────────────────────────
  const pendingSlaBookings = useMemo(() => {
    return allBookings.filter(b => b.status === "PENDING_ARTIST_RESPONSE" && b.slaDeadlineTime);
  }, [allBookings]);

  const stats = [
    { label: "Active Artists", value: counts.totalArtists, icon: Users, color: "text-primary" },
    { label: "New Today", value: counts.todayRegistrations, icon: UserPlus, color: "text-green-500" },
    { label: "Total Bookings", value: counts.totalBookings, icon: CalendarDays, color: "text-accent" },
    { label: "Disputes Escrow", value: escrowMetrics.locked.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }), icon: Lock, color: "text-rose-500" },
    { label: "Held Escrow", value: escrowMetrics.held.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }), icon: Layers, color: "text-amber-500" },
    { label: "Total SLA Items", value: pendingSlaBookings.length, icon: Clock, color: "text-[#FF6B00]" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold mb-1">Platform Control Dashboard</h1>
          <p className="text-sm text-muted-foreground">Monitor bookings, SLAs, notifications, and security compliance</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="shadow-sm border-border/60">
            <CardContent className="p-4 text-center">
              <s.icon className={`h-6 w-6 mx-auto mb-2 ${s.color}`} />
              <p className="text-xl font-display font-black truncate">{s.value}</p>
              <p className="text-[10px] font-black uppercase text-stone-400 mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dashboard Sub-Suite Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4 bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clients">Clients ({clients.length})</TabsTrigger>
          <TabsTrigger value="escrow">Escrow Analytics</TabsTrigger>
          <TabsTrigger value="sla">SLA Monitoring ({pendingSlaBookings.length})</TabsTrigger>
          <TabsTrigger value="events">Events Moderation</TabsTrigger>
          <TabsTrigger value="calendar">Master Calendar</TabsTrigger>
          <TabsTrigger value="notifications">Notification logs</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Recent Bookings preview */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-display font-semibold mb-4 text-sm uppercase text-stone-400">Recent Booking Requests</h3>
              <div className="space-y-3">
                {syncing ? (
                  <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : allBookings.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent bookings</p>
                ) : null}
                {allBookings.slice(0, 5).map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <p className="font-bold text-sm text-stone-900">{b.clientName || "Client"}</p>
                      <p className="text-xs text-muted-foreground">{b.artistName || "Artist"} · {b.performanceType} · {b.eventDate}</p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <BookingStatusBadge status={b.status} />
                      <p className="text-xs font-bold text-stone-800">Rs {(b.authorizedAmount || 0).toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending Artist applications preview */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-sm uppercase text-stone-400">Pending Artist Registrations</h3>
                <Link to="/admin/pending">
                  <Button variant="outline" size="sm" className="text-xs font-bold">Review applications →</Button>
                </Link>
              </div>
              <div className="space-y-3">
                {pendingList.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4 font-bold">All artist applications resolved</p>
                )}
                {pendingList.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <p className="font-bold text-sm text-stone-900">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.category} · {a.city}</p>
                    </div>
                    <Link to="/admin/pending">
                      <Button variant="outline" size="sm" className="h-8 text-xs font-bold rounded-xl">Review</Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tools */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <h3 className="font-display font-semibold flex items-center gap-2 mb-4 text-sm">
                <Settings className="h-5 w-5 text-primary" /> Core System Tools
              </h3>
              <div className="flex flex-wrap gap-3">
                <Button onClick={seedCategories} disabled={loading} variant="outline" className="h-10 px-5 rounded-xl text-xs font-bold">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Database className="h-4 w-4 mr-2" />}
                  Seed Categories
                </Button>
                <Link to="/admin/pending">
                  <Button variant="outline" className="h-10 px-5 rounded-xl text-xs font-bold">Pending Applications</Button>
                </Link>
                <Link to="/admin/bootstrap">
                  <Button className="gradient-bg border-0 text-primary-foreground font-bold h-10 px-5 rounded-xl text-xs">
                    <ShieldCheck className="h-4 w-4 mr-2" /> Bootstrap Repair Tool
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients">
          <Card>
            <CardContent className="p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Details</TableHead>
                    <TableHead>Account Status</TableHead>
                    <TableHead>Verification Logs</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-stone-400 font-bold">
                        No customer accounts registered.
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {clients.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <p className="font-bold text-stone-900">{c.name || "Customer"}</p>
                        <p className="text-xs text-muted-foreground">{c.email}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "capitalize font-bold text-xs",
                          c.status === "blocked" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
                        )}>
                          {c.status || "active"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-stone-400 font-bold">
                        OAuth Secured · JWT active
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleClientStatus(c)}
                          className={cn(
                            "rounded-xl text-xs font-bold",
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Escrow Tab */}
        <TabsContent value="escrow" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="bg-slate-50 border-slate-100">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground font-black uppercase mb-1">Authorized Hold Volume</p>
                <p className="text-2xl font-display font-black text-stone-800">Rs {escrowMetrics.authorized.toLocaleString("en-IN")}</p>
              </CardContent>
            </Card>
            <Card className="bg-amber-50 border-amber-100">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-amber-700 font-black uppercase mb-1">Held in Escrow</p>
                <p className="text-2xl font-display font-black text-amber-900">Rs {escrowMetrics.held.toLocaleString("en-IN")}</p>
              </CardContent>
            </Card>
            <Card className="bg-rose-50 border-rose-100">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-rose-700 font-black uppercase mb-1">Locked (Disputes)</p>
                <p className="text-2xl font-display font-black text-rose-900">Rs {escrowMetrics.locked.toLocaleString("en-IN")}</p>
              </CardContent>
            </Card>
            <Card className="bg-emerald-50 border-emerald-100">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-emerald-700 font-black uppercase mb-1">Released Payout Volume</p>
                <p className="text-2xl font-display font-black text-emerald-900">Rs {escrowMetrics.released.toLocaleString("en-IN")}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase font-black text-stone-400">Escrow Value Breakdown Indicator</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Visual Bar representation */}
                <div className="h-6 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                  {allBookings.length === 0 ? (
                    <div className="w-full bg-slate-200 h-full flex items-center justify-center text-[10px] text-stone-500 font-bold">No escrow logs</div>
                  ) : (
                    <>
                      <div style={{ width: `${Math.max(5, (escrowMetrics.authorized / (escrowMetrics.authorized + escrowMetrics.held + escrowMetrics.locked + escrowMetrics.released || 1)) * 100)}%` }} className="bg-slate-400 h-full" title="Authorized" />
                      <div style={{ width: `${Math.max(5, (escrowMetrics.held / (escrowMetrics.authorized + escrowMetrics.held + escrowMetrics.locked + escrowMetrics.released || 1)) * 100)}%` }} className="bg-amber-400 h-full" title="Held" />
                      <div style={{ width: `${Math.max(5, (escrowMetrics.locked / (escrowMetrics.authorized + escrowMetrics.held + escrowMetrics.locked + escrowMetrics.released || 1)) * 100)}%` }} className="bg-rose-500 h-full" title="Locked" />
                      <div style={{ width: `${Math.max(5, (escrowMetrics.released / (escrowMetrics.authorized + escrowMetrics.held + escrowMetrics.locked + escrowMetrics.released || 1)) * 100)}%` }} className="bg-emerald-500 h-full" title="Released" />
                    </>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 text-xs font-semibold">
                  <div className="flex items-center gap-1.5"><span className="h-3 w-3 bg-slate-400 rounded" /> Authorized Hold</div>
                  <div className="flex items-center gap-1.5"><span className="h-3 w-3 bg-amber-400 rounded" /> Held in Escrow</div>
                  <div className="flex items-center gap-1.5"><span className="h-3 w-3 bg-rose-500 rounded" /> Locked in Disputes</div>
                  <div className="flex items-center gap-1.5"><span className="h-3 w-3 bg-emerald-500 rounded" /> Payout Released</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SLA Monitoring Tab */}
        <TabsContent value="sla">
          <Card>
            <CardContent className="p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Artist</TableHead>
                    <TableHead>Event Logistics</TableHead>
                    <TableHead>SLA Clock Remaining</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingSlaBookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-stone-400 font-bold">
                        No booking requests are currently pending artist response.
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {pendingSlaBookings.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        <p className="font-bold text-stone-900">{b.clientName}</p>
                        <p className="text-xs text-stone-400">{b.customerEmail}</p>
                      </TableCell>
                      <TableCell className="font-bold text-[#FF6B00]">{b.artistName || "Artist"}</TableCell>
                      <TableCell>
                        <p className="font-bold text-xs">{b.performanceType}</p>
                        <p className="text-[10px] text-stone-400">{b.eventDate} ({b.eventStartTime} - {b.eventEndTime})</p>
                      </TableCell>
                      <TableCell>
                        <SlaCountdown deadline={b.slaDeadlineTime} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Moderation Tab */}
        <TabsContent value="events">
          <Card>
            <CardContent className="p-6">
              <div className="mb-4">
                <h3 className="font-display font-semibold text-sm uppercase text-stone-400">Events Moderation Vault</h3>
                <p className="text-xs text-muted-foreground">Manage and deep-edit user event requirements.</p>
              </div>
              <AdminEventsList />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Master Calendar Tab */}
        <TabsContent value="calendar">
          <Card>
            <CardContent className="p-6">
              <div className="mb-4">
                <h3 className="font-display font-semibold text-sm uppercase text-stone-400">Master Platform Calendar</h3>
                <p className="text-xs text-muted-foreground">Aggregated view of bookings across all artists</p>
              </div>
              <ArtistCalendarView bookings={allBookings} availability={[]} onBookingSelect={() => {}} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Logs Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardContent className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-display font-semibold text-sm uppercase text-stone-400">Multi-Channel Delivery Audit</h3>
                  <p className="text-xs text-muted-foreground">Log of simulated notification dispatches</p>
                </div>
              </div>

              <div className="border border-border/60 rounded-2xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Notification Details</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Delivered To</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notificationLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-stone-400 font-bold">
                          No notification dispatch logs recorded.
                        </TableCell>
                      </TableRow>
                    ) : null}
                    {notificationLogs.slice(0, 50).map((n) => {
                      const channelIcons = {
                        IN_APP: Mail,
                        PUSH: Smartphone,
                        EMAIL: Mail,
                        SMS: Smartphone,
                        WHATSAPP: Smartphone,
                      };
                      const Icon = channelIcons[n.channel] || Smartphone;

                      return (
                        <TableRow key={n.id}>
                          <TableCell className="max-w-md">
                            <p className="font-semibold text-stone-900">{n.message}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="flex items-center gap-1 w-fit bg-slate-50 font-bold text-xs uppercase">
                              <Icon className="h-3 w-3" /> {n.channel}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-stone-500 font-bold truncate max-w-[150px]">{n.recipient}</TableCell>
                          <TableCell>
                            <Badge className={cn(
                              "text-[9px] font-black uppercase tracking-wider",
                              n.priority === "HIGH" ? "bg-rose-600" : "bg-stone-500"
                            )}>
                              {n.priority || "NORMAL"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-stone-400">{new Date(n.timestamp).toLocaleString("en-IN")}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit logs Tab */}
        <TabsContent value="audit">
          <Card>
            <CardContent className="p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admin actor</TableHead>
                    <TableHead>Security Action</TableHead>
                    <TableHead>Description Details</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-stone-400 font-bold">
                        No administrative audit logs available.
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-extrabold text-stone-700">{log.adminEmail}</TableCell>
                      <TableCell>
                        <Badge className="bg-indigo-600 text-[9px] font-black tracking-widest uppercase">
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-stone-600 font-semibold">{log.details}</TableCell>
                      <TableCell className="text-xs text-stone-400">{new Date(log.timestamp).toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
