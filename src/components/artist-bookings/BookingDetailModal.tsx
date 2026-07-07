import { useState, useEffect } from "react";
import { CalendarDays, Home, Loader2, MapPin, MessageSquare, Music2, Phone, ShieldCheck, AlertCircle, Sparkles, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import type { BookingEvent, BookingStatus } from "@/types/booking";
import { BookingStatusBadge } from "@/components/artist-bookings/BookingStatusBadge";

function formatDate(date: string) {
  if (!date) return "Date not provided";
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function telHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `tel:+91${digits}`;
  return `tel:${phone}`;
}

export function BookingDetailModal({
  booking,
  open,
  onOpenChange,
  onStatusChange,
}: {
  booking: BookingEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (
    booking: BookingEvent,
    status: BookingStatus,
    extraFields?: Partial<BookingEvent>
  ) => Promise<{ success: boolean; message: string }>;
}) {
  const [updatingStatus, setUpdatingStatus] = useState<BookingStatus | null>(null);
  
  // Counter-offer states
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [counterAmount, setCounterAmount] = useState("");
  const [counterDate, setCounterDate] = useState("");
  const [counterStartTime, setCounterStartTime] = useState("");
  const [counterEndTime, setCounterEndTime] = useState("");
  const [counterLocation, setCounterLocation] = useState("");
  const [counterNotes, setCounterNotes] = useState("");

  // Countdown timer for soft holds
  const [countdownText, setCountdownText] = useState("");
  const [slaText, setSlaText] = useState("");

  useEffect(() => {
    if (!booking || !booking.holdExpiryTime) {
      setCountdownText("");
      return;
    }

    const updateTimer = () => {
      const remaining = new Date(booking.holdExpiryTime!).getTime() - Date.now();
      if (remaining <= 0) {
        setCountdownText("Soft hold expired");
      } else {
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        setCountdownText(`${hours}h ${minutes}m remaining`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [booking]);

  useEffect(() => {
    if (!booking || !booking.slaDeadlineTime) {
      setSlaText("");
      return;
    }

    const updateSla = () => {
      const remaining = new Date(booking.slaDeadlineTime!).getTime() - Date.now();
      if (remaining <= 0) {
        setSlaText("SLA Expired");
      } else {
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        setSlaText(`${hours}h ${minutes}m remaining`);
      }
    };

    updateSla();
    const interval = setInterval(updateSla, 60000);
    return () => clearInterval(interval);
  }, [booking]);

  useEffect(() => {
    if (open && booking) {
      setShowCounterForm(false);
      setCounterAmount(String(booking.authorizedAmount || ""));
      setCounterDate(booking.eventDate || "");
      setCounterStartTime(booking.eventStartTime || "18:00");
      setCounterEndTime(booking.eventEndTime || "22:00");
      setCounterLocation(booking.venueLocation || "");
      setCounterNotes("");
    }
  }, [open, booking]);

  const handleStatusChange = async (status: BookingStatus, extraFields: Partial<BookingEvent> = {}) => {
    if (!booking) return;
    setUpdatingStatus(status);
    const result = await onStatusChange(booking, status, extraFields);
    setUpdatingStatus(null);
    toast({
      variant: result.success ? "default" : "destructive",
      title: result.success ? "Booking status updated" : "Could not update status",
      description: result.message,
    });
    if (result.success) {
      onOpenChange(false);
    }
  };

  const submitCounterOffer = async () => {
    if (!booking || !counterAmount) return;
    const amount = Number(counterAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ variant: "destructive", title: "Invalid amount", description: "Please enter a valid price." });
      return;
    }
    
    await handleStatusChange("COUNTER_OFFER_SENT", {
      counterOfferAmount: amount,
      counterOfferNotes: counterNotes,
      counterOfferDate: counterDate,
      counterOfferStartTime: counterStartTime,
      counterOfferEndTime: counterEndTime,
      counterOfferLocation: counterLocation,
      originalAmount: booking.authorizedAmount || 0,
    });
  };

  if (!booking) return null;

  const isActiveHold = ["SOFT_HOLD_ACTIVE", "PAYMENT_AUTHORIZED", "PENDING_ARTIST_RESPONSE"].includes(booking.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-4rem)] overflow-y-auto border-border/80 bg-background/95 shadow-2xl backdrop-blur-xl sm:max-w-2xl rounded-2xl">
        <DialogHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <DialogTitle className="font-display text-2xl font-black">{booking.performanceType || "Booking Request"}</DialogTitle>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-stone-500 font-semibold">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-[#FF6B00]" />
                  {formatDate(booking.eventDate)} ({booking.eventStartTime || "18:00"} - {booking.eventEndTime || "22:00"})
                </span>
              </div>
            </div>
            <BookingStatusBadge status={booking.status} />
          </div>
        </DialogHeader>

        {isActiveHold && booking.holdExpiryTime && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 flex items-center justify-between text-xs text-amber-950 font-semibold">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-amber-600 animate-pulse" />
              Active soft hold locks date for other clients
            </span>
            <span className="bg-amber-600 text-white px-2.5 py-1 rounded-full text-[10px] uppercase font-black tracking-wider">
              {countdownText}
            </span>
          </div>
        )}

        {booking.status === "PENDING_ARTIST_RESPONSE" && booking.slaDeadlineTime && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3.5 flex items-center justify-between text-xs text-rose-950 font-semibold">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-rose-600 animate-pulse" />
              SLA Limit: Respond to this request before deadline.
            </span>
            <span className="bg-rose-600 text-white px-2.5 py-1 rounded-full text-[10px] uppercase font-black tracking-wider">
              {slaText}
            </span>
          </div>
        )}

        <div className="space-y-4">
          {/* Client Details */}
          <section className="rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-400">Client Contact Info</h3>
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <div>
                <p className="text-xs font-semibold text-stone-400">Client Name</p>
                <p className="font-extrabold mt-0.5">{booking.clientName || "Not provided"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-400">Email Address</p>
                <p className="font-extrabold mt-0.5">{booking.customerEmail || "Not provided"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-400">Phone Number</p>
                {booking.clientPhone ? (
                  <a className="inline-flex items-center gap-1.5 font-extrabold text-[#FF6B00] mt-0.5" href={telHref(booking.clientPhone)}>
                    <Phone className="h-3.5 w-3.5" />
                    {booking.clientPhone}
                  </a>
                ) : (
                  <p className="font-extrabold mt-0.5">Not provided</p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-400">WhatsApp Number</p>
                <p className="font-extrabold mt-0.5">{booking.clientWhatsapp || "Not provided"}</p>
              </div>
            </div>
          </section>

          {/* Event & Special Info */}
          <section className="rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-400">Event Logistics</h3>
            <div className="grid gap-3 lg:grid-cols-2 text-sm">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="mb-1 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-stone-400">
                  <Home className="h-3.5 w-3.5 text-stone-500" />
                  Client Address
                </p>
                <p className="font-bold text-stone-700 leading-relaxed">{booking.clientAddress || "Not provided"}</p>
              </div>
              <div className="rounded-xl border border-[#FF6B00]/20 bg-[#FF6B00]/5 p-3">
                <p className="mb-1 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-[#FF6B00]">
                  <MapPin className="h-3.5 w-3.5" />
                  Venue Location
                </p>
                <p className="font-bold text-[#FF6B00] leading-relaxed">{booking.venueLocation || "Not provided"}</p>
              </div>
            </div>
            {booking.specialRequirements && (
              <div className="mt-2 text-sm bg-slate-50 rounded-xl p-3">
                <p className="text-xs font-black uppercase tracking-wider text-stone-400 mb-1">Special Requirements</p>
                <p className="font-bold text-stone-700">{booking.specialRequirements}</p>
              </div>
            )}
          </section>

          {/* Payment Escrow Details */}
          <section className="rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-400">Simulated Payment Authorization</h3>
            <div className="grid gap-3 sm:grid-cols-3 text-sm">
              <div className="rounded-xl bg-slate-50 p-2.5">
                <p className="text-[10px] font-black uppercase tracking-wider text-stone-400">Gateway</p>
                <p className="font-extrabold uppercase mt-0.5 text-stone-800">{booking.paymentGateway || "Stripe"}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-2.5">
                <p className="text-[10px] font-black uppercase tracking-wider text-stone-400">Authorized Offer</p>
                <p className="font-extrabold mt-0.5 text-[#FF6B00]">Rs {(booking.authorizedAmount || 0).toLocaleString("en-IN")}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-2.5">
                <p className="text-[10px] font-black uppercase tracking-wider text-stone-400">Escrow Released</p>
                <p className={`font-extrabold mt-0.5 ${booking.status === "PAYOUT_RELEASED" ? "text-emerald-600" : "text-stone-500"}`}>
                  {booking.status === "PAYOUT_RELEASED" ? "Yes" : "No"}
                </p>
              </div>
            </div>
            {booking.counterOfferAmount && (
              <div className="rounded-xl bg-amber-50/50 border border-amber-100 p-3 text-sm">
                <p className="text-xs font-black uppercase tracking-wider text-amber-700 mb-1">Proposed Counter Offer</p>
                <p className="font-bold text-amber-950">
                  Amount: <span className="font-black text-amber-600">Rs {booking.counterOfferAmount.toLocaleString("en-IN")}</span>
                </p>
                {booking.counterOfferNotes && (
                  <p className="text-xs text-amber-800 mt-1 italic">Notes: {booking.counterOfferNotes}</p>
                )}
              </div>
            )}
            {booking.status === "DISPUTE_OPENED" && (
              <div className="rounded-xl bg-rose-50 border border-rose-100 p-3 text-sm">
                <p className="text-xs font-black uppercase tracking-wider text-rose-700 mb-1">Dispute Details</p>
                <p className="font-bold text-rose-950">{booking.disputeNotes || "No notes provided."}</p>
              </div>
            )}
          </section>

          {booking.additionalNotes && (
            <section className="rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm">
              <h3 className="mb-2 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-stone-400">
                <MessageSquare className="h-4 w-4 text-stone-500" />
                Additional Message
              </h3>
              <p className="whitespace-pre-wrap text-sm font-semibold leading-relaxed text-stone-600">
                {booking.additionalNotes}
              </p>
            </section>
          )}

          {/* Counter Offer Form */}
          {showCounterForm && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-700 flex items-center gap-1">
                <Sparkles className="h-4 w-4" /> Propose Counter Offer Details
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Counter Booking Price (Rs)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 18000"
                    value={counterAmount}
                    onChange={(e) => setCounterAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Counter Location</Label>
                  <Input
                    type="text"
                    placeholder="e.g. Mumbai, Pune"
                    value={counterLocation}
                    onChange={(e) => setCounterLocation(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label>Counter Date</Label>
                  <Input
                    type="date"
                    value={counterDate}
                    onChange={(e) => setCounterDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={counterStartTime}
                    onChange={(e) => setCounterStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={counterEndTime}
                    onChange={(e) => setCounterEndTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Negotiation Notes / Scope Changes</Label>
                <Textarea
                  placeholder="Explain changes in requirements or scope."
                  rows={2}
                  value={counterNotes}
                  onChange={(e) => setCounterNotes(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="w-1/2" onClick={() => setShowCounterForm(false)}>
                  Cancel
                </Button>
                <Button className="w-1/2 bg-amber-600 hover:bg-amber-700 text-white" onClick={submitCounterOffer}>
                  Submit Counter Offer
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex flex-col-reverse gap-2 border-t border-border/60 pt-4 sm:flex-row sm:justify-end">
          {!showCounterForm && (
            <>
              {["PENDING_ARTIST_RESPONSE", "pending"].includes(booking.status) && (
                <>
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl"
                    disabled={Boolean(updatingStatus)}
                    onClick={() => handleStatusChange("REJECTED")}
                  >
                    {updatingStatus === "REJECTED" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Decline Request
                  </Button>
                  <Button
                    variant="outline"
                    className="border-amber-200 text-amber-700 hover:bg-amber-50 rounded-xl"
                    disabled={Boolean(updatingStatus)}
                    onClick={() => setShowCounterForm(true)}
                  >
                    Propose Counter Offer
                  </Button>
                  <Button
                    className="bg-[#FF6B00] text-white hover:bg-[#e86100] rounded-xl font-bold px-6"
                    disabled={Boolean(updatingStatus)}
                    onClick={() => handleStatusChange("CONFIRMED")}
                  >
                    {updatingStatus === "CONFIRMED" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Accept & Hold Payout
                  </Button>
                </>
              )}
              {booking.status === "CONFIRMED" && (
                <Button
                  className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-bold px-6"
                  disabled={Boolean(updatingStatus)}
                  onClick={() => handleStatusChange("EVENT_COMPLETED")}
                >
                  {updatingStatus === "EVENT_COMPLETED" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Mark Event Completed
                </Button>
              )}
              {booking.status === "DISPUTE_OPENED" && (
                <Button
                  className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-bold px-6"
                  disabled={Boolean(updatingStatus)}
                  onClick={() => handleStatusChange("DISPUTE_RESOLVED")}
                >
                  {updatingStatus === "DISPUTE_RESOLVED" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Resolve Dispute (Confirm Payout)
                </Button>
              )}
              {booking.status === "COUNTER_OFFER_SENT" && (
                <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-xl py-2.5 px-4 text-center">
                  Counter-Offer is with client. Awaiting response.
                </span>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
