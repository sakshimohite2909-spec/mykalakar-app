import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2, Send, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight, ArrowLeft, CreditCard } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { FIREBASE_WRITE_TIMEOUT_MS, firebaseErrorMessage, logFirebaseError, requireAuthUid, sanitizePayload, withTimeout } from "@/lib/firebaseSafe";
import { PHONE_MAX_LENGTH, PHONE_PLACEHOLDER, sanitizePhoneNumber, validatePhoneNumber } from "@/lib/phoneUtils";
import { useI18n } from "@/i18n/I18nProvider";
import { getArtLabel } from "@/lib/artLabels";
import { createArtistBooking, checkArtistAvailability } from "@/services/artistBookingService";
import { motion, AnimatePresence } from "framer-motion";

const eventTypes = ["Wedding", "Corporate Event", "Birthday Party", "Festival", "Concert", "Private Event"];
const INQUIRY_RATE_LIMIT_MS = 10_000; // Lowered for development testing
const INQUIRY_MESSAGE_MAX_LENGTH = 999;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artistName: string;
  artistId: string;
  preselectedDate?: string;
}

export default function BookingModal({ open, onOpenChange, artistName, artistId, preselectedDate }: Props) {
  const { t } = useI18n();
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  // Form states
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    clientWhatsapp: "",
    customerAddress: "",
    eventLocation: "",
    eventDate: "",
    eventStartTime: "18:00",
    eventEndTime: "22:00",
    eventType: "",
    message: "",
    specialRequirements: "",
    authorizedAmount: 15000,
  });

  // Availability validation state
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState<{ available: boolean; reason?: string } | null>(null);

  // Gateway state — only Razorpay supported
  const [gateway] = useState<"razorpay">("razorpay");
  const [paymentDetails, setPaymentDetails] = useState({
    cardholderName: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });

  // Pre-fill date when provided
  useEffect(() => {
    if (preselectedDate) {
      setFormData(prev => ({ ...prev, eventDate: preselectedDate }));
    }
  }, [preselectedDate]);

  // Reset wizard on open/close
  useEffect(() => {
    if (open) {
      setStep(1);
      setAvailabilityResult(null);
      setPaymentDetails({
        cardholderName: "",
        cardNumber: "",
        expiryDate: "",
        cvv: "",
      });
      // Pre-fill user profile info if logged in
      setFormData(prev => ({
        ...prev,
        customerName: prev.customerName || (userProfile?.name as string) || currentUser?.displayName || "",
        customerEmail: prev.customerEmail || currentUser?.email || "",
        customerPhone: prev.customerPhone || (userProfile?.phone as string) || "",
        clientWhatsapp: prev.clientWhatsapp || (userProfile?.phone as string) || "",
      }));
    }
  }, [open, currentUser, userProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "customerPhone" || name === "clientWhatsapp") {
      setFormData(prev => ({ ...prev, [name]: sanitizePhoneNumber(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, eventType: value }));
  };

  const runAvailabilityCheck = async () => {
    if (!formData.eventDate) {
      toast({ variant: "destructive", title: "Select a date", description: "Please enter the event date to check availability." });
      return;
    }
    setCheckingAvailability(true);
    setAvailabilityResult(null);
    try {
      console.log("runAvailabilityCheck calling checkArtistAvailability with:", {
        artistId,
        eventDate: formData.eventDate,
        eventStartTime: formData.eventStartTime,
        eventEndTime: formData.eventEndTime,
      });
      const result = await checkArtistAvailability(
        artistId,
        formData.eventDate,
        formData.eventStartTime,
        formData.eventEndTime
      );
      console.log("runAvailabilityCheck result:", result);
      setAvailabilityResult(result);
      if (result.available) {
        setStep(2);
      } else {
        toast({
          variant: "destructive",
          title: "Date unavailable",
          description: result.reason || "The artist is not available on this date.",
        });
      }
    } catch (err) {
      console.error("runAvailabilityCheck error:", err);
      toast({ variant: "destructive", title: "Verification failed", description: "Could not verify artist availability." });
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      toast({ variant: "destructive", title: t("artist.loginRequiredTitle"), description: t("booking.loginRequiredText") });
      return;
    }

    // Extra validation for Razorpay card details
    if (!paymentDetails.cardNumber || !paymentDetails.expiryDate || !paymentDetails.cvv) {
      toast({ variant: "destructive", title: "Card details required", description: "Please complete all credit card fields." });
      return;
    }

    setLoading(true);
    try {
      const uid = requireAuthUid(currentUser);
      
      // Calculate Soft Hold Expiration (24 Hours from now)
      const holdExpiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      // Create booking payload
      const booking = await createArtistBooking({
        artistId,
        artistName,
        clientName: formData.customerName,
        clientPhone: formData.customerPhone,
        clientAddress: formData.customerAddress,
        venueLocation: formData.eventLocation,
        eventDate: formData.eventDate,
        performanceType: formData.eventType,
        additionalNotes: formData.message,
        customerId: uid,
        customerEmail: currentUser.email || "",
        clientWhatsapp: formData.clientWhatsapp,
        eventStartTime: formData.eventStartTime,
        eventEndTime: formData.eventEndTime,
        specialRequirements: formData.specialRequirements,
        holdExpiryTime,
        paymentGateway: gateway,
        authorizedAmount: Number(formData.authorizedAmount),
        status: "PENDING_ARTIST_RESPONSE", // Places hold and registers response
      });

      // Save inquiries record for audit
      await withTimeout(
        addDoc(collection(db, "inquiries"), sanitizePayload({
          customerName: formData.customerName,
          customerEmail: currentUser.email || "",
          customerPhone: formData.customerPhone,
          clientWhatsapp: formData.clientWhatsapp,
          eventType: formData.eventType,
          eventDate: formData.eventDate,
          eventLocation: formData.eventLocation,
          message: formData.message,
          artistName,
          artistId,
          artistUid: artistId,
          artistBookingId: booking.id,
          customerId: uid,
          status: "pending",
          spamCheckStatus: "passed",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })),
        FIREBASE_WRITE_TIMEOUT_MS,
        t("booking.timeoutText")
      );

      toast({
        title: "Booking Requested & Authorized",
        description: `Availability hold active for 24h. Booking code: ${booking.id.slice(0, 8).toUpperCase()}`,
      });
      
      onOpenChange(false);
    } catch (error: any) {
      logFirebaseError(error);
      toast({ variant: "destructive", title: t("common.error"), description: firebaseErrorMessage(error, t("booking.sendFailed")) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto no-scrollbar border-border/80 bg-background/95 backdrop-blur-2xl shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-black text-center text-slate-900">
            Book {artistName}
          </DialogTitle>
          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <span className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${step >= 1 ? "bg-orange-600 scale-125" : "bg-slate-200"}`} />
            <span className="h-0.5 w-8 bg-slate-200" />
            <span className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${step >= 2 ? "bg-orange-600 scale-125" : "bg-slate-200"}`} />
          </div>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4 mt-2"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Your Full Name</Label>
                  <Input name="customerName" value={formData.customerName} onChange={handleChange} placeholder="e.g. John Doe" required />
                </div>
                <div className="space-y-1">
                  <Label>Email Address</Label>
                  <Input name="customerEmail" type="email" value={formData.customerEmail} onChange={handleChange} placeholder="john@example.com" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Mobile Number</Label>
                  <Input name="customerPhone" value={formData.customerPhone} onChange={handleChange} placeholder={PHONE_PLACEHOLDER} maxLength={PHONE_MAX_LENGTH} required />
                </div>
                <div className="space-y-1">
                  <Label>WhatsApp Number</Label>
                  <Input name="clientWhatsapp" value={formData.clientWhatsapp} onChange={handleChange} placeholder={PHONE_PLACEHOLDER} maxLength={PHONE_MAX_LENGTH} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1 col-span-1">
                  <Label>Event Date</Label>
                  <Input name="eventDate" type="date" value={formData.eventDate} onChange={handleChange} required />
                </div>
                <div className="space-y-1 col-span-1">
                  <Label>Start Time</Label>
                  <Input name="eventStartTime" type="time" value={formData.eventStartTime} onChange={handleChange} required />
                </div>
                <div className="space-y-1 col-span-1">
                  <Label>End Time</Label>
                  <Input name="eventEndTime" type="time" value={formData.eventEndTime} onChange={handleChange} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Event Location/City</Label>
                  <Input name="eventLocation" value={formData.eventLocation} onChange={handleChange} placeholder="e.g. Mumbai, Pune" required />
                </div>
                <div className="space-y-1">
                  <Label>Performance Type</Label>
                  <Select value={formData.eventType} onValueChange={handleSelectChange} required>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose type" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((e) => <SelectItem key={e} value={e}>{getArtLabel(t, e)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label>Event Venue Address</Label>
                <Input name="customerAddress" value={formData.customerAddress} onChange={handleChange} placeholder="Full building/street address" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Your Budget/Offer (Rs)</Label>
                  <Input name="authorizedAmount" type="number" min={500} value={formData.authorizedAmount} onChange={handleChange} required />
                </div>
                <div className="space-y-1">
                  <Label>Special Requirements</Label>
                  <Input name="specialRequirements" value={formData.specialRequirements} onChange={handleChange} placeholder="e.g. sound system, stage layout" />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Event Description / Message</Label>
                <Textarea name="message" value={formData.message} onChange={handleChange} placeholder="Tell the artist about the event, audience, etc." rows={2} />
              </div>

              <Button
                type="button"
                onClick={runAvailabilityCheck}
                className="w-full bg-[#FF6B00] hover:bg-[#e86100] text-white py-6 rounded-xl font-bold text-md shadow-lg"
                disabled={checkingAvailability || !formData.eventDate || !formData.customerName || !formData.eventType}
              >
                {checkingAvailability ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying Artist Availability...
                  </>
                ) : (
                  <>
                    Check Availability & Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5 mt-2"
            >
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
                <h3 className="text-sm font-extrabold text-emerald-950">Artist is Available!</h3>
                <p className="text-xs text-emerald-700 mt-1">
                  The date {formData.eventDate} is open. Secure this slot by setting up payment authorization.
                </p>
              </div>

              {/* Escrow Information alert */}
              <div className="rounded-xl border border-[#FF6B00]/20 bg-[#FF6B00]/5 p-3.5 flex items-start gap-2.5 text-xs text-stone-700 leading-relaxed">
                <ShieldCheck className="h-5 w-5 shrink-0 text-[#FF6B00]" />
                <div>
                  <span className="font-extrabold text-stone-900 block mb-0.5">Escrow Authorization Guarantee</span>
                  Funds remain in your account until the artist accepts. If rejected or expired (24h), the authorization drops automatically. No refund fees apply.
                </div>
              </div>

              {/* Gateway — Razorpay only */}
              <div className="space-y-2">
                <Label className="text-stone-900 font-extrabold">Payment Gateway</Label>
                <div className="py-3 px-4 rounded-xl border border-[#FF6B00] bg-[#FF6B00]/10 text-[#FF6B00] font-black text-sm uppercase text-center tracking-wider">
                  Razorpay
                </div>
              </div>

              {/* Razorpay Card Form */}
              <div className="border border-slate-200 rounded-xl bg-slate-50/60 p-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-stone-500" />
                  Simulated Razorpay Gateway
                </h4>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>Cardholder Name</Label>
                    <Input
                      value={paymentDetails.cardholderName}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, cardholderName: e.target.value }))}
                      placeholder="Johnathan Doe"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Credit Card Number</Label>
                    <Input
                      value={paymentDetails.cardNumber}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, cardNumber: e.target.value.replace(/\D/g, "").slice(0, 16) }))}
                      placeholder="4111 2222 3333 4444"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>Expiration Date</Label>
                      <Input
                        value={paymentDetails.expiryDate}
                        onChange={(e) => setPaymentDetails(prev => ({ ...prev, expiryDate: e.target.value }))}
                        placeholder="MM/YY"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>CVV / CVC</Label>
                      <Input
                        value={paymentDetails.cvv}
                        type="password"
                        maxLength={3}
                        onChange={(e) => setPaymentDetails(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, "") }))}
                        placeholder="***"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-200/80 pt-3 flex items-center justify-between text-xs text-stone-600 font-semibold">
                  <span>Authorized Hold Amount:</span>
                  <span className="text-stone-900 font-extrabold text-sm">Rs {Number(formData.authorizedAmount).toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" className="w-1/3 py-6 rounded-xl font-bold" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-1.5 h-4 w-4" /> Edit Details
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="w-2/3 bg-[#FF6B00] hover:bg-[#e86100] text-white py-6 rounded-xl font-bold text-md shadow-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Authorizing...
                    </>
                  ) : (
                    <>
                      Authorize & Book Hold <Send className="ml-1.5 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
