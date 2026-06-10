import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, Calendar, Loader2, MapPin, Home, MessageSquare, AlertTriangle, ShieldCheck, FileText, Scale, ArrowRight, UploadCloud, MessageCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc } from "firebase/firestore";
import { firebaseErrorMessage } from "@/lib/firebaseSafe";
import { BookingStatusBadge } from "@/components/artist-bookings/BookingStatusBadge";
import { updateArtistBookingStatus, logAdminActivity } from "@/services/artistBookingService";
import type { BookingEvent, BookingStatus } from "@/types/booking";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function formatDate(date: string) {
  if (!date) return "Date not provided";
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<BookingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Dispute dialogue review
  const [selectedDispute, setSelectedDispute] = useState<BookingEvent | null>(null);
  const [resolving, setResolving] = useState<BookingStatus | null>(null);

  // Mock timeline log dates
  const [timelineDates, setTimelineDates] = useState({ created: "", hold: "", captured: "", disputed: "" });

  useEffect(() => {
    const q = query(collection(db, "artist_bookings"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BookingEvent[];
      setBookings(data);
      setLoading(false);
    }, (error) => {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "Could not load platform bookings." });
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleReviewDispute = (booking: BookingEvent) => {
    setSelectedDispute(booking);
    
    // Simulate timeline dates
    const createdDate = new Date(booking.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    const holdDate = new Date(new Date(booking.createdAt).getTime() + 5 * 60 * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    const capturedDate = new Date(new Date(booking.createdAt).getTime() + 15 * 60 * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    const disputedDate = new Date(booking.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    setTimelineDates({ created: createdDate, hold: holdDate, captured: capturedDate, disputed: disputedDate });
  };

  const handleResolveDispute = async (status: BookingStatus, extraFields: Partial<BookingEvent> = {}) => {
    if (!selectedDispute) return;
    setResolving(status);
    try {
      await updateArtistBookingStatus(selectedDispute, status, {
        escrowState: "RELEASED",
        ...extraFields,
      });
      await logAdminActivity(
        "admin@mykalakar.com",
        "RESOLVE_DISPUTE",
        `Resolved dispute for booking ${selectedDispute.id} with status ${status}. Escrow state RELEASED.`
      );
      toast({
        title: "Dispute Resolved ✅",
        description: `Status updated to ${status}. Escrow released accordingly.`
      });
      setSelectedDispute(null);
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Resolution failed", description: "Could not resolve dispute." });
    } finally {
      setResolving(null);
    }
  };

  const activeBookings = bookings.filter(b => b.status !== "DISPUTE_OPENED");
  const disputeBookings = bookings.filter(b => b.status === "DISPUTE_OPENED");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold mb-1">Bookings & Escrow Hub</h1>
          <p className="text-sm text-muted-foreground">{bookings.length} total transactional records</p>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">Platform Bookings ({activeBookings.length})</TabsTrigger>
          <TabsTrigger value="disputes" className="relative">
            Escrow Disputes
            {disputeBookings.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-black text-white">
                {disputeBookings.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Plattform Bookings Tab */}
        <TabsContent value="all">
          <Card>
            <CardContent className="p-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Artist</TableHead>
                    <TableHead>Event logistics</TableHead>
                    <TableHead>Authorized hold</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                      </TableCell>
                    </TableRow>
                  ) : activeBookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No bookings found.
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {activeBookings.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-bold text-sm text-stone-900">{b.clientName}</p>
                          <p className="text-xs text-muted-foreground">{b.customerEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-extrabold text-[#FF6B00]">{b.artistName || "Premium Artist"}</TableCell>
                      <TableCell>
                        <div className="text-xs space-y-0.5">
                          <p className="font-semibold text-stone-700">{b.performanceType}</p>
                          <p className="text-muted-foreground">{formatDate(b.eventDate)} ({b.eventStartTime} - {b.eventEndTime})</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-sm">
                        Rs {(b.authorizedAmount || 0).toLocaleString("en-IN")}
                        <span className="block text-[10px] text-stone-400 font-semibold uppercase">{b.paymentGateway || "Stripe"}</span>
                      </TableCell>
                      <TableCell>
                        <BookingStatusBadge status={b.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dispute Resolution Console */}
        <TabsContent value="disputes">
          <Card>
            <CardContent className="p-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Artist</TableHead>
                    <TableHead>Dispute Category</TableHead>
                    <TableHead>Escrow Value</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                      </TableCell>
                    </TableRow>
                  ) : disputeBookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground font-semibold">
                        No active escrow disputes reported.
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {disputeBookings.map((b) => (
                    <TableRow key={b.id} className="bg-rose-50/20">
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-bold text-sm text-stone-900">{b.clientName}</p>
                          <p className="text-xs text-muted-foreground">{b.customerEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-extrabold text-[#FF6B00]">{b.artistName || "Premium Artist"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700 capitalize font-bold text-xs">
                          {b.disputeCategory?.replace(/_/g, " ") || "Service Mismatch"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold text-sm text-rose-700">
                        Rs {(b.authorizedAmount || 0).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold" onClick={() => handleReviewDispute(b)}>
                          <Scale className="mr-1.5 h-3.5 w-3.5" /> Review claims
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review claims Dialog */}
      <Dialog open={Boolean(selectedDispute)} onOpenChange={(open) => !open && setSelectedDispute(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border-rose-200 shadow-rose-950/5">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-black text-rose-700 flex items-center gap-1.5 border-b border-rose-100 pb-2.5">
              <Scale className="h-5 w-5" /> Platform Dispute Resolution Console
            </DialogTitle>
          </DialogHeader>
          
          {selectedDispute && (
            <div className="space-y-6 text-xs font-semibold text-stone-600 leading-relaxed py-2">
              <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-4 space-y-2">
                <span className="flex items-center gap-1 text-[10px] font-black uppercase text-rose-700">
                  <AlertTriangle className="h-4 w-4" /> Dispute Claim Summary
                </span>
                <p className="text-sm text-stone-800">
                  Claimant: <strong className="capitalize text-stone-950">{selectedDispute.disputedBy || "Client"}</strong>
                </p>
                <p className="text-sm text-stone-800">
                  Reason: <strong className="capitalize text-stone-950">{selectedDispute.disputeCategory?.replace(/_/g, " ") || "Scope discrepancy"}</strong>
                </p>
                <p className="text-stone-600 mt-2 bg-white border border-rose-100 p-3 rounded-lg italic">
                  "{selectedDispute.disputeNotes}"
                </p>
              </div>

              {/* Booking transaction logs & timeline details */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border border-slate-200/80 rounded-xl p-4 space-y-3">
                  <h4 className="font-black text-stone-900 uppercase tracking-wider flex items-center gap-1 text-[10px]">
                    <FileText className="h-4 w-4 text-stone-500" /> Transaction Timeline Audit
                  </h4>
                  <div className="relative border-l border-slate-200 pl-4 ml-2 space-y-3 text-[10px] leading-relaxed">
                    <div className="relative">
                      <span className="absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <p className="font-bold text-stone-800">Request Created</p>
                      <p className="text-stone-400">{timelineDates.created}</p>
                    </div>
                    <div className="relative">
                      <span className="absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <p className="font-bold text-stone-800">24h Soft hold Active</p>
                      <p className="text-stone-400">{timelineDates.hold}</p>
                    </div>
                    <div className="relative">
                      <span className="absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <p className="font-bold text-stone-800">Payout Authorized & Captured</p>
                      <p className="text-stone-400">{timelineDates.captured}</p>
                    </div>
                    <div className="relative">
                      <span className="absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full bg-rose-500" />
                      <p className="font-bold text-rose-700">Dispute Claim Filed</p>
                      <p className="text-stone-400">{timelineDates.disputed}</p>
                    </div>
                  </div>
                </div>

                {/* Evidence listings mockup */}
                <div className="border border-slate-200/80 rounded-xl p-4 space-y-3">
                  <h4 className="font-black text-stone-900 uppercase tracking-wider flex items-center gap-1 text-[10px]">
                    <UploadCloud className="h-4 w-4 text-stone-500" /> Evidence Uploads (Simulated)
                  </h4>
                  <div className="space-y-1.5 text-[10px]">
                    <div className="flex items-center justify-between p-2 bg-slate-50 border rounded-lg">
                      <span className="font-bold text-stone-800">chat_screenshot_no_show.png</span>
                      <Badge variant="secondary" className="text-[9px]">Claimant</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-50 border rounded-lg">
                      <span className="font-bold text-stone-800">venue_safety_video.mp4</span>
                      <Badge variant="secondary" className="text-[9px]">Claimant</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-50 border rounded-lg text-slate-400">
                      <span>No files submitted by artist</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat logs simulator */}
              <div className="border border-slate-200/80 rounded-xl p-4 space-y-3">
                <h4 className="font-black text-stone-900 uppercase tracking-wider flex items-center gap-1 text-[10px]">
                  <MessageCircle className="h-4 w-4 text-stone-500" /> Contract Chat History
                </h4>
                <div className="space-y-2 max-h-36 overflow-y-auto p-2 bg-slate-50 border rounded-lg text-[10px]">
                  <div className="p-2 bg-white rounded-lg border max-w-sm">
                    <p className="text-orange-600 font-extrabold mb-0.5">Artist</p>
                    <p className="text-stone-700 font-bold">Hi John, just checking if the sound setup is complete?</p>
                  </div>
                  <div className="p-2 bg-orange-100/40 rounded-lg border border-orange-200/30 max-w-sm ml-auto text-right">
                    <p className="text-[#FF6B00] font-extrabold mb-0.5">Client</p>
                    <p className="text-stone-700 font-bold">Yes, everything is set. Stage and sound setup will be ready by 5 PM.</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border max-w-sm font-semibold">
                    <p className="text-orange-600 font-extrabold mb-0.5">Artist</p>
                    <p className="text-stone-700 font-bold">Sounds good. I will be heading to Pune at 3 PM.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end border-t border-slate-100 pt-4">
            <Button variant="outline" onClick={() => setSelectedDispute(null)}>Close Reviews</Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              disabled={Boolean(resolving)}
              onClick={() => handleResolveDispute("REFUND_PROCESSED")}
            >
              {resolving === "REFUND_PROCESSED" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Refund 100% to Client
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
              disabled={Boolean(resolving)}
              onClick={() => handleResolveDispute("DISPUTE_RESOLVED", { splitRefundAmount: (selectedDispute?.authorizedAmount || 0) / 2 })}
            >
              {resolving === "DISPUTE_RESOLVED" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Split Escrow (50/50)
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              disabled={Boolean(resolving)}
              onClick={() => handleResolveDispute("PAYOUT_RELEASED", { isEscrowReleased: true })}
            >
              {resolving === "PAYOUT_RELEASED" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Release 100% Payout to Artist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
