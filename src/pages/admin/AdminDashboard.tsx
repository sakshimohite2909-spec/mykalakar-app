import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, UserPlus, CalendarDays, FolderOpen, TrendingUp, BadgeCheck, Loader2, Database, Settings, MapPin, Globe, Phone, CreditCard, Building2, Upload, Check, X, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, limit, orderBy, writeBatch, doc, getDocs, updateDoc, serverTimestamp } from "firebase/firestore";

import { initialCategories } from "@/data/mockData";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Total Artists (Approved)
    const qArtists = query(collection(db, "pending_registrations"), where("status", "==", "approved"));
    const unsubArtists = onSnapshot(qArtists, (snap) => {
      setCounts(prev => ({
        ...prev,
        totalArtists: snap.size,
        verifiedArtists: snap.docs.filter(d => d.data().verified).length,
        trending: snap.docs.filter(d => d.data().trending).length
      }));
    });

    // Pending Artists & Today's Registrations
    const qPending = query(collection(db, "pending_registrations"), where("status", "==", "pending"));
    const unsubPending = onSnapshot(qPending, (snap) => {
      const allPending = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Calculate today's registrations
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCount = snap.docs.filter(d => {
        const createdAt = d.data().createdAt?.toDate();
        return createdAt && createdAt >= today;
      }).length;

      setCounts(prev => ({ ...prev, pendingArtists: snap.size, todayRegistrations: todayCount }));
      setPendingList(allPending.slice(0, 5));
    });

    // Bookings
    const qBookings = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
    const unsubBookings = onSnapshot(qBookings, (snap) => {
      setCounts(prev => ({ ...prev, totalBookings: snap.size }));
      setRecentBookings(snap.docs.slice(0, 5).map(d => ({ id: d.id, ...d.data() })));
    });

    // Categories
    const qCats = query(collection(db, "categories"));
    const unsubCats = onSnapshot(qCats, (snap) => {
      setCounts(prev => ({ ...prev, categories: snap.size }));
    });

    setLoading(false);

    return () => {
      unsubArtists();
      unsubPending();
      unsubBookings();
      unsubCats();
    };
  }, []);

  const seedCategories = async () => {
    setLoading(true);
    try {
      const batch = writeBatch(db);

      // Optionally clear old categories if any (manual steps for safety usually preferred, but we'll overwrite)
      const existingCats = await getDocs(collection(db, "categories"));
      existingCats.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });

      initialCategories.forEach((cat) => {
        const docRef = doc(collection(db, "categories"));
        batch.set(docRef, {
          ...cat,
          createdAt: serverTimestamp()
        });
      });

      await batch.commit();
      toast({ title: "Categories Updated! 🚀", description: "All new categories and subcategories are now live." });
    } catch (error: any) {
      console.error("Seeding error details:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Could not seed categories. Please check your Firestore rules."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await updateDoc(doc(db, "pending_registrations", id), {
        status: "approved",
        verified: true
      });
      toast({ title: "Artist Verified! ✅", description: "Artist is now live and verified on the platform." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not verify artist." });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateDoc(doc(db, "pending_registrations", id), {
        status: "rejected"
      });
      toast({ title: "Artist Rejected", description: "Registration has been rejected." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not reject artist." });
    }
  };

  const getYoutubeEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

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
            {recentBookings.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No recent bookings</p>}
            {recentBookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                <div>
                  <p className="font-medium text-sm">{b.customerName}</p>
                  <p className="text-xs text-muted-foreground">{b.artistName} · {b.eventType}</p>
                </div>
                <div className="text-right">
                  <Badge variant={b.status === "confirmed" ? "default" : "secondary"} className={b.status === "confirmed" ? "gradient-bg border-0" : ""}>
                    {b.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">{b.eventDate}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Artists */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-display font-semibold mb-4">Pending Artist Approvals</h3>
          <div className="space-y-3">
            {pendingList.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No pending approvals</p>}
            {pendingList.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-3">
                  <img
                    src={a.profilePhoto || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300"}
                    alt={a.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-medium text-sm">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{a.subcategory} · {a.city}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="secondary">Pending</Badge>
                    {(() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const createdAt = a.createdAt?.toDate();
                      if (createdAt && createdAt >= today) {
                        return <span className="text-[10px] font-bold text-green-500 uppercase">Received Today</span>;
                      }
                      return null;
                    })()}
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Verify Registration - {a.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6 pt-4 text-left">
                        <div className="relative h-32 w-full rounded-xl overflow-hidden border mb-4 bg-secondary/20">
                          <img src={a.coverPhoto || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600"} className="w-full h-full object-cover" alt="Cover" />
                          <div className="absolute bottom-4 left-4 flex gap-4 items-end">
                            <img src={a.profilePhoto || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300"} className="w-20 h-20 rounded-xl object-cover border-4 border-background shadow-lg" />
                            <div className="pb-1">
                              <p className="text-xl font-bold bg-background/60 backdrop-blur-sm px-2 rounded-md">{a.name}</p>
                              <p className="text-primary font-medium text-xs bg-background/60 backdrop-blur-sm px-2 rounded-md inline-block">{a.category} / {a.subcategory}</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <p className="text-muted-foreground flex items-center gap-1 text-sm"><Phone className="h-3 w-3" /> {a.phone}</p>
                          <p className="text-muted-foreground flex items-center gap-1 text-sm"><MapPin className="h-3 w-3" /> {a.city}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2 p-4 rounded-xl bg-secondary/30 border border-border">
                            <h4 className="font-semibold flex items-center gap-2 text-primary text-sm"><CreditCard className="h-4 w-4" /> Identity Info</h4>
                            <p className="text-xs"><strong>Aadhar No:</strong> {a.aadharNumber || "N/A"}</p>
                            {a.aadharPhoto && (
                              <div className="mt-2 rounded-lg overflow-hidden border bg-background">
                                <img src={a.aadharPhoto} alt="Aadhar" className="w-full h-auto max-h-32 object-contain" />
                              </div>
                            )}
                          </div>
                          <div className="space-y-2 p-4 rounded-xl bg-secondary/30 border border-border">
                            <h4 className="font-semibold flex items-center gap-2 text-primary text-sm"><Building2 className="h-4 w-4" /> Bank Details</h4>
                            <p className="text-xs"><strong>Bank:</strong> {a.bankName || "N/A"}</p>
                            <p className="text-xs"><strong>IFSC:</strong> {a.ifscCode || "N/A"}</p>
                            <p className="text-xs"><strong>Account:</strong> {a.accountNumber || "N/A"}</p>
                          </div>
                        </div>

                        {a.galleryPhotos && a.galleryPhotos.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-semibold flex items-center gap-2 text-primary text-sm"><Upload className="h-4 w-4" /> Gallery</h4>
                            <div className="grid grid-cols-5 gap-2">
                              {a.galleryPhotos.map((p: string, i: number) => (
                                <img key={i} src={p} className="aspect-square w-full rounded-lg object-cover border" alt="Gallery" />
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <h4 className="font-semibold flex items-center gap-2 text-primary text-sm"><Globe className="h-4 w-4" /> Socials</h4>
                          <div className="grid gap-2">
                            {a.socialLinks?.map((link: any, i: number) => (
                              <div key={i} className="p-2 border rounded-lg bg-background/50 flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold uppercase text-primary">{link.platform}</span>
                                  <a href={link.url} target="_blank" className="text-[10px] text-blue-500 hover:underline">Open Link</a>
                                </div>
                                {link.platform === "youtube" && getYoutubeEmbedUrl(link.url) && (
                                  <div className="aspect-video rounded-md overflow-hidden border">
                                    <iframe width="100%" height="100%" src={getYoutubeEmbedUrl(link.url)!} allowFullScreen></iframe>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button onClick={() => handleApprove(a.id)} className="flex-1 gradient-bg border-0 text-primary-foreground font-semibold">Verify & Live</Button>
                          <Button onClick={() => handleReject(a.id)} variant="destructive" className="flex-1">Reject</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Database Management Tools */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-semibold flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" /> System Tools
              </h3>
              <p className="text-xs text-muted-foreground">Manage platform categories and core data</p>
            </div>
            <Button
              onClick={seedCategories}
              disabled={loading}
              className="gradient-bg border-0 text-primary-foreground font-semibold h-10 px-6 shrink-0"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Database className="h-4 w-4 mr-2" />}
              Seed & Update Categories
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
