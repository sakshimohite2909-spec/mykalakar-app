import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Eye, MapPin, Loader2, Phone, Mail, Calendar, Briefcase, ExternalLink, ShieldCheck, Star, User, Play } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { approveArtist, rejectArtist, approveAdminRequest, rejectAdminRequest } from "@/lib/adminQueries";
import { firebaseErrorMessage, toastForFirestoreError } from "@/lib/firebaseSafe";

// ── Lazy YouTube Thumbnail ──────────────────────────────────────────────────
function YoutubePreview({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false);
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  const videoId = match && match[2].length === 11 ? match[2] : null;
  if (!videoId) return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 underline break-all">{url}</a>
  );
  const thumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  if (playing) {
    return (
      <div className="aspect-video rounded-xl overflow-hidden border">
        <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen title="YouTube video" />
      </div>
    );
  }
  return (
    <div className="relative aspect-video rounded-xl overflow-hidden border cursor-pointer group" onClick={() => setPlaying(true)}>
      <img src={thumb} alt="YouTube thumbnail" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
        <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-xl">
          <Play className="h-6 w-6 text-white fill-white ml-1" />
        </div>
      </div>
    </div>
  );
}

// ── Info Row ────────────────────────────────────────────────────────────────
function InfoRow({ label, value, icon: Icon }: { label: string; value: any; icon?: any }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        {Icon && <Icon className="h-4 w-4" />}
        <span>{label}:</span>
      </div>
      <span className="font-medium text-sm text-right max-w-[60%]">{value || "N/A"}</span>
    </div>
  );
}

// ── Artist Card ─────────────────────────────────────────────────────────────
function ArtistApplicationCard({ a, onApprove, onReject }: { a: any; onApprove: (id: string) => Promise<void>; onReject: (id: string, reason: string) => Promise<void> }) {
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);

  const handleApprove = async () => {
    setApproving(true);
    await onApprove(a.id);
    setApproving(false);
  };

  const handleReject = async () => {
    setRejecting(true);
    await onReject(a.id, rejectReason);
    setRejecting(false);
    setRejectOpen(false);
  };

  return (
    <Card className="hover-lift overflow-hidden border-l-4 border-l-yellow-500">
      <CardContent className="p-5">
        <div className="flex flex-col md:flex-row gap-4 items-start">
          <img
            src={a.media?.profilePhoto || a.profilePhoto || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300"}
            alt={a.name}
            className="w-24 h-24 rounded-2xl object-cover border-2 border-background shadow-md flex-shrink-0"
          />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="font-display font-bold text-xl">{a.name}</h3>
              <Badge className="bg-primary/10 text-primary border-primary/20">{a.subcategory || a.category}</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="h-3.5 w-3.5" />{a.email || "No email"}</div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="h-3.5 w-3.5" />{a.mobileNumber || a.phone || "No phone"}</div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{a.district || a.city}, {a.state}</div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Briefcase className="h-3.5 w-3.5" />{a.experience} years exp</div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 italic">"{a.bio || "No bio provided"}"</p>
          </div>

          <div className="flex flex-col gap-2 self-stretch min-w-[160px]">
            {/* Detail Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full group">
                  Review <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
                <div className="p-6 border-b bg-secondary/20 flex justify-between items-center">
                  <DialogHeader><DialogTitle className="text-2xl font-display">Artist Registration Review</DialogTitle></DialogHeader>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleApprove} disabled={approving} className="gradient-bg border-0 text-foreground">
                      {approving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />} Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setRejectOpen(true)}>
                      <X className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
                <div className="modal-scroll no-scrollbar p-6 space-y-6">
                  {/* Identity */}
                  <Card className="bg-secondary/10"><CardContent className="p-4 space-y-1">
                    <h4 className="font-bold flex items-center gap-2 text-primary mb-3 pb-2 border-b"><ShieldCheck className="h-4 w-4" />Account & Security</h4>
                    <InfoRow label="Email" value={a.email} icon={Mail} />
                    <InfoRow label="Aadhar" value={a.identity?.aadharNumber || a.aadharNumber} />
                    <InfoRow label="UID" value={a.uid ? "✅ Linked" : "❌ Missing"} />
                    {(a.media?.aadharPhoto || a.aadharPhoto) && (
                      <img src={a.media?.aadharPhoto || a.aadharPhoto} className="w-full h-auto rounded-lg border shadow-sm mt-2" alt="Aadhar" />
                    )}
                  </CardContent></Card>

                  {/* Personal */}
                  <Card className="bg-secondary/10"><CardContent className="p-4">
                    <h4 className="font-bold flex items-center gap-2 text-primary mb-3 pb-2 border-b"><User className="h-4 w-4" />Personal Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                      <InfoRow label="Full Name" value={a.name} />
                      <InfoRow label="Phone" value={a.mobileNumber || a.phone} icon={Phone} />
                      <InfoRow label="DOB" value={a.dob} icon={Calendar} />
                      <InfoRow label="Gender" value={a.gender} />
                      <InfoRow label="State" value={a.state} />
                      <InfoRow label="District" value={a.district || a.city} />
                      <InfoRow label="Category" value={a.category} />
                      <InfoRow label="Experience" value={`${a.experience} years`} icon={Briefcase} />
                    </div>
                    <div className="mt-3"><p className="text-sm font-semibold mb-1">Bio:</p><p className="text-sm text-muted-foreground p-3 bg-background rounded-xl border">{a.bio || "None"}</p></div>
                  </CardContent></Card>

                  {/* Gallery */}
                  {(a.media?.galleryPhotos || a.galleryPhotos)?.length > 0 && (
                    <div><h4 className="font-bold mb-2">Portfolio</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {(a.media?.galleryPhotos || a.galleryPhotos).map((p: string, i: number) => (
                          <img key={i} src={p} className="aspect-square rounded-xl object-cover border" alt="" />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Social / YouTube */}
                  {a.socialLinks?.length > 0 && (
                    <div><h4 className="font-bold mb-3">Social Links</h4>
                      <div className="grid gap-4">
                        {a.socialLinks.map((link: any, i: number) => (
                          <div key={i} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold uppercase">{link.platform}</span>
                              <a href={link.url} target="_blank" className="text-xs text-blue-500 underline">Open</a>
                            </div>
                            {link.platform === "youtube" ? <YoutubePreview url={link.url} /> : (
                              <p className="text-xs text-muted-foreground break-all">{link.url}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-6 border-t bg-secondary/10 flex gap-3">
                  <Button onClick={handleApprove} disabled={approving} className="flex-1 gradient-bg border-0 text-foreground h-12 text-base font-semibold">
                    {approving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Check className="h-5 w-5 mr-2" />} Verify & Publish
                  </Button>
                  <Button onClick={() => setRejectOpen(true)} variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10 h-12">
                    <X className="h-5 w-5 mr-2" /> Reject
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button onClick={handleApprove} disabled={approving} size="sm" className="gradient-bg border-0 text-foreground w-full">
              {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-1" />Quick Approve</>}
            </Button>
            <Button onClick={() => setRejectOpen(true)} variant="ghost" size="sm" className="w-full text-destructive hover:bg-destructive/10">
              <X className="h-4 w-4 mr-1" /> Reject
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Reject Application</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">Provide a reason for rejection (optional — artist will see this).</p>
            <Textarea placeholder="Reason for rejection..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} />
            <div className="flex gap-3">
              <Button onClick={handleReject} disabled={rejecting} variant="destructive" className="flex-1">
                {rejecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Confirm Reject
              </Button>
              <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ── Admin Request Card ───────────────────────────────────────────────────────
function AdminRequestCard({ r, onApprove, onReject }: { r: any; onApprove: (id: string) => Promise<void>; onReject: (id: string, reason: string) => Promise<void> }) {
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);

  const handleApprove = async () => { setApproving(true); await onApprove(r.id); setApproving(false); };
  const handleReject = async () => { setRejecting(true); await onReject(r.id, rejectReason); setRejecting(false); setRejectOpen(false); };

  return (
    <Card className="hover-lift overflow-hidden border-l-4 border-l-blue-500">
      <CardContent className="p-5">
        <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="font-display font-bold text-xl">{r.name || r.email}</h3>
              <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Admin Request</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="h-3.5 w-3.5" />{r.email}</div>
              {r.mobileNumber && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="h-3.5 w-3.5" />{r.mobileNumber}</div>}
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="h-3.5 w-3.5" />Requested {r.requestedAt?.toDate()?.toLocaleDateString() || "Unknown"}</div>
            </div>
            {r.about && <p className="text-sm text-muted-foreground italic">"{r.about}"</p>}
          </div>
          <div className="flex flex-col gap-2 min-w-[160px]">
            <Button onClick={handleApprove} disabled={approving} size="sm" className="gradient-bg border-0 text-foreground w-full">
              {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ShieldCheck className="h-4 w-4 mr-1" />Grant Admin</>}
            </Button>
            <Button onClick={() => setRejectOpen(true)} variant="ghost" size="sm" className="w-full text-destructive hover:bg-destructive/10">
              <X className="h-4 w-4 mr-1" /> Reject
            </Button>
          </div>
        </div>
      </CardContent>
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Reject Admin Request</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <Textarea placeholder="Reason..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} />
            <div className="flex gap-3">
              <Button onClick={handleReject} disabled={rejecting} variant="destructive" className="flex-1">Confirm Reject</Button>
              <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function AdminPending() {
  const [pendingArtists, setPendingArtists] = useState<any[]>([]);
  const [pendingAdmins, setPendingAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Artist applications listener
    const qArtists = query(
      collection(db, "artist_applications"),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );
    const unsubArtists = onSnapshot(qArtists, (snap) => {
      setPendingArtists(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error(err);
      toastForFirestoreError(err, "Error", "Could not load pending artists.", toast);
      setLoading(false);
    });

    // Admin requests listener
    const qAdmins = query(
      collection(db, "admin_requests"),
      where("status", "==", "pending"),
      orderBy("requestedAt", "desc")
    );
    const unsubAdmins = onSnapshot(qAdmins, (snap) => {
      setPendingAdmins(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn("admin_requests listener:", err);
      toastForFirestoreError(err, "Admin requests", "Could not load admin requests.", toast);
    });

    return () => { unsubArtists(); unsubAdmins(); };
  }, []);

  const handleApproveArtist = useCallback(async (id: string) => {
    try {
      await approveArtist(id);
      toast({ title: "Artist Approved! ✅", description: "Artist is now live. Their dashboard unlocked automatically." });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: firebaseErrorMessage(err, "Could not approve artist.") });
    }
  }, []);

  const handleRejectArtist = useCallback(async (id: string, reason: string) => {
    try {
      await rejectArtist(id, reason);
      toast({ title: "Artist Rejected", description: "Application has been rejected." });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: firebaseErrorMessage(err, "Could not reject artist.") });
    }
  }, []);

  const handleApproveAdmin = useCallback(async (id: string) => {
    try {
      await approveAdminRequest(id);
      toast({ title: "Admin Approved! 🛡️", description: "Admin access granted. Their dashboard unlocked automatically." });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: firebaseErrorMessage(err, "Could not approve admin request.") });
    }
  }, []);

  const handleRejectAdmin = useCallback(async (id: string, reason: string) => {
    try {
      await rejectAdminRequest(id, reason);
      toast({ title: "Request Rejected", description: "Admin request has been rejected." });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: firebaseErrorMessage(err, "Could not reject admin request.") });
    }
  }, []);

  const totalPending = pendingArtists.length + pendingAdmins.length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-display text-2xl font-bold mb-1">Pending Approvals</h1>
          <p className="text-sm text-muted-foreground">{totalPending} item{totalPending !== 1 ? "s" : ""} waiting for review</p>
        </div>
        {totalPending > 0 && (
          <Badge variant="outline" className="px-3 py-1 bg-yellow-500/5 text-yellow-600 border-yellow-500/20">
            Manual Review Required
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="artists">
          <TabsList className="mb-6">
            <TabsTrigger value="artists" className="gap-2">
              Artist Applications
              {pendingArtists.length > 0 && (
                <Badge className="ml-1 bg-yellow-500 text-white border-0 px-2 py-0.5 text-xs">{pendingArtists.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="admins" className="gap-2">
              Admin Requests
              {pendingAdmins.length > 0 && (
                <Badge className="ml-1 bg-blue-500 text-white border-0 px-2 py-0.5 text-xs">{pendingAdmins.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="artists" className="space-y-4">
            {pendingArtists.length === 0 ? (
              <Card className="border-dashed"><CardContent className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                <Check className="h-8 w-8 text-green-500 mb-2" />
                <p className="text-lg font-semibold">No pending artist registrations 🎉</p>
                <p className="text-sm">All artist applications have been processed.</p>
              </CardContent></Card>
            ) : (
              pendingArtists.map(a => (
                <ArtistApplicationCard key={a.id} a={a} onApprove={handleApproveArtist} onReject={handleRejectArtist} />
              ))
            )}
          </TabsContent>

          <TabsContent value="admins" className="space-y-4">
            {pendingAdmins.length === 0 ? (
              <Card className="border-dashed"><CardContent className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                <ShieldCheck className="h-8 w-8 text-green-500 mb-2" />
                <p className="text-lg font-semibold">No pending admin requests 🎉</p>
                <p className="text-sm">All admin requests have been processed.</p>
              </CardContent></Card>
            ) : (
              pendingAdmins.map(r => (
                <AdminRequestCard key={r.id} r={r} onApprove={handleApproveAdmin} onReject={handleRejectAdmin} />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
