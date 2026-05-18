import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, UserPlus, CalendarDays, FolderOpen, TrendingUp, Loader2, Database, Settings, RefreshCw, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import {
  collection, query, where, onSnapshot, orderBy,
  writeBatch, doc, getDocs, serverTimestamp,
} from "firebase/firestore";
import { firebaseErrorMessage } from "@/lib/firebaseSafe";
import { migrateApprovedArtists } from "@/scripts/migrateArtistData";
import { CATEGORY_GROUP_OPTIONS } from "@/constants/artistSystem";
import { imageRegistry } from "@/services/ImageRegistryService";
import { getUsableImageUrl } from "@/utils/fallbackImages";

export default function AdminDashboard() {
  const [counts, setCounts] = useState({
    totalArtists: 0,
    pendingArtists: 0,
    todayRegistrations: 0,
    totalBookings: 0,
    categories: 0,
    trending: 0,
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [pendingList, setPendingList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubs: (() => void)[] = [];

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

    // ── Recent Bookings ────────────────────────────────────────────────────
    try {
      const qBookings = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
      unsubs.push(onSnapshot(qBookings, (snap) => {
        setCounts(prev => ({ ...prev, totalBookings: snap.size }));
        setRecentBookings(snap.docs.slice(0, 5).map(d => ({ id: d.id, ...d.data() })));
      }, (err) => console.warn("bookings:", err)));
    } catch (e) { console.warn(e); }

    // ── Categories ────────────────────────────────────────────────────────
    try {
      unsubs.push(onSnapshot(collection(db, "categories"), (snap) => {
        setCounts(prev => ({ ...prev, categories: snap.size || CATEGORY_GROUP_OPTIONS.length }));
      }, (err) => console.warn("categories:", err)));
    } catch (e) { console.warn(e); }

    return () => unsubs.forEach(u => u());
  }, []);

  // ── Seed Categories ────────────────────────────────────────────────────────
  const seedCategories = useCallback(async () => {
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const existing = await getDocs(collection(db, "categories"));
      existing.forEach(s => batch.delete(s.ref));
      CATEGORY_GROUP_OPTIONS.forEach(cat => {
        batch.set(doc(db, "categories", cat.id), {
          ...cat, updatedAt: serverTimestamp(), createdAt: serverTimestamp(),
        });
      });
      await batch.commit();
      toast({ title: "Categories Updated 🚀", description: "All categories are now live." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update Failed", description: error?.message || "Could not seed categories." });
    } finally { setLoading(false); }
  }, []);

  // ── Migrate Approved Artists ───────────────────────────────────────────────
  const runMigration = useCallback(async () => {
    setLoading(true);
    try {
      const result = await migrateApprovedArtists();
      toast({
        title: "Migration Complete ✅",
        description: `${result.created} artists synced, ${result.skipped} already up-to-date.`,
      });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Migration Failed", description: error?.message || "Could not run migration." });
    } finally { setLoading(false); }
  }, []);

  const stats = [
    { label: "Total Approved", value: counts.totalArtists, icon: Users, color: "text-primary" },
    { label: "New Today", value: counts.todayRegistrations, icon: UserPlus, color: "text-green-500" },
    { label: "Total Pending", value: counts.pendingArtists, icon: FolderOpen, color: "text-accent" },
    { label: "Total Bookings", value: counts.totalBookings, icon: CalendarDays, color: "text-accent" },
    { label: "Categories", value: counts.categories, icon: FolderOpen, color: "text-primary" },
    { label: "Trending", value: counts.trending, icon: TrendingUp, color: "text-accent" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold mb-1">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="hover-lift">
            <CardContent className="p-4 text-center">
              <s.icon className={`h-6 w-6 mx-auto mb-2 ${s.color}`} />
              <p className="text-2xl font-display font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-display font-semibold mb-4">Recent Bookings</h3>
          <div className="space-y-3">
            {recentBookings.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No recent bookings</p>
            )}
            {recentBookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                <div>
                  <p className="font-medium text-sm">{b.clientName || b.customerName || "Client"}</p>
                  <p className="text-xs text-muted-foreground">{b.artistName} · {b.eventType}</p>
                </div>
                <div className="text-right">
                  <Badge variant={b.status === "confirmed" ? "default" : "secondary"}
                    className={b.status === "confirmed" ? "gradient-bg border-0" : ""}>
                    {b.status || "pending"}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">{b.eventDate}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Artist Applications Preview */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold">Pending Artist Approvals</h3>
            <Link to="/admin/pending">
              <Button variant="outline" size="sm">View All →</Button>
            </Link>
          </div>
          <div className="space-y-3">
            {pendingList.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No pending approvals</p>
            )}
            {pendingList.map((a) => {
              const today = new Date(); today.setHours(0, 0, 0, 0);
              const createdAt = a.createdAt?.toDate?.();
              const isToday = createdAt && createdAt >= today;
              return (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <img
                      src={getUsableImageUrl(a.media?.profilePhoto || a.profilePhoto) || imageRegistry.getUniqueImage({ category: a.subcategory || a.artForm || a.category || "Default", type: "artist", key: a.id || a.name })}
                      alt={a.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-medium text-sm">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.subcategory || a.category} · {a.district || a.city || a.state}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isToday && <span className="text-[10px] font-bold text-green-500 uppercase">Today</span>}
                    <Badge variant="secondary">Pending</Badge>
                    <Link to="/admin/pending">
                      <Button variant="outline" size="sm" className="h-8 px-3 text-xs">Review</Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* System Tools */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <h3 className="font-display font-semibold flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5 text-primary" /> System Tools
          </h3>
          <div className="flex flex-wrap gap-3">
            <Button onClick={seedCategories} disabled={loading} variant="outline" className="h-10 px-5">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Database className="h-4 w-4 mr-2" />}
              Seed Categories
            </Button>
            <Button onClick={runMigration} disabled={loading} variant="outline" className="h-10 px-5">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Migrate Artists
            </Button>
            <Link to="/admin/pending">
              <Button variant="outline" className="h-10 px-5">Pending Approvals →</Button>
            </Link>
            <Link to="/admin/bootstrap">
              <Button className="gradient-bg border-0 text-primary-foreground font-semibold h-10 px-5">
                <ShieldCheck className="h-4 w-4 mr-2" /> 🚀 Bootstrap Fix
              </Button>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            If admin access or artists are not showing — click <strong>"Bootstrap Fix"</strong> to repair all Firestore data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
