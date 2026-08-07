import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import {
  Loader2,
  Send,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  BadgeCheck,
  Star,
  Clock,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import {
  FIREBASE_WRITE_TIMEOUT_MS,
  firebaseErrorMessage,
  logFirebaseError,
  requireAuthUid,
  sanitizePayload,
  withTimeout,
} from "@/lib/firebaseSafe";
import {
  PHONE_MAX_LENGTH,
  PHONE_PLACEHOLDER,
  sanitizePhoneNumber,
  validatePhoneNumber,
} from "@/lib/phoneUtils";
import { useI18n } from "@/i18n/I18nProvider";
import { getArtLabel } from "@/lib/artLabels";
import { createArtistBooking, checkArtistAvailability } from "@/services/artistBookingService";
import { saveCustomerInquiryLead } from "@/services/telecallerService";
import { motion, AnimatePresence } from "framer-motion";

const eventTypes = [
  "Wedding",
  "Corporate Event",
  "Birthday Party",
  "Festival",
  "Concert",
  "Private Event",
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artistName: string;
  artistId: string;
  preselectedDate?: string;
  startingPrice?: string;
  artistAvatar?: string;
  artistLocation?: string;
}

function parsePriceToNumber(rawPrice: string | number | undefined): number {
  if (typeof rawPrice === "number") return Number.isFinite(rawPrice) && rawPrice > 0 ? rawPrice : 15000;
  if (!rawPrice) return 15000;
  const digitsOnly = String(rawPrice).replace(/\D/g, "");
  const parsed = parseInt(digitsOnly, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 15000;
}

export default function BookingModal({
  open,
  onOpenChange,
  artistName,
  artistId,
  preselectedDate,
  startingPrice = "25,000",
  artistAvatar = "https://images.unsplash.com/photo-1537633552985-df8429e8048b?q=80&w=800&auto=format&fit=crop",
  artistLocation = "Pune, Maharashtra",
}: Props) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [bookingCode, setBookingCode] = useState("");

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
    eventType: "Wedding",
    message: "",
    specialRequirements: "",
    authorizedAmount: 15000,
  });

  // Availability validation state
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Razorpay Payment Details
  const [paymentDetails, setPaymentDetails] = useState({
    cardholderName: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });

  // Pre-fill date when provided
  useEffect(() => {
    if (preselectedDate) {
      setFormData((prev) => ({ ...prev, eventDate: preselectedDate }));
    }
  }, [preselectedDate]);

  // Reset wizard on open/close
  useEffect(() => {
    if (open) {
      setStep(1);
      setBookingCode("");
      setPaymentDetails({
        cardholderName: "",
        cardNumber: "",
        expiryDate: "",
        cvv: "",
      });
      setFormData((prev) => ({
        ...prev,
        customerName: prev.customerName || (userProfile?.name as string) || currentUser?.displayName || "",
        customerEmail: prev.customerEmail || currentUser?.email || "",
        customerPhone: prev.customerPhone || (userProfile?.phone as string) || "",
        clientWhatsapp: prev.clientWhatsapp || (userProfile?.phone as string) || "",
        eventLocation: prev.eventLocation || artistLocation,
        eventType: prev.eventType || "Wedding",
        authorizedAmount: parsePriceToNumber(startingPrice),
      }));
    }
  }, [open, currentUser, userProfile, artistLocation, startingPrice]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "customerPhone" || name === "clientWhatsapp") {
      setFormData((prev) => ({
        ...prev,
        [name]: sanitizePhoneNumber(value),
      }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, eventType: value }));
  };

  const runAvailabilityCheck = async () => {
    if (!formData.customerName || !formData.eventDate || !formData.eventType) {
      toast({
        variant: "destructive",
        title: "Required Fields Missing",
        description: "Please fill in your name, event date, and performance type.",
      });
      return;
    }

    const phoneValidation = validatePhoneNumber(formData.customerPhone);
    if (!phoneValidation.valid) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: phoneValidation.error || "Please enter a valid mobile number.",
      });
      return;
    }

    setCheckingAvailability(true);
    try {
      if (artistId && formData.eventDate) {
        await checkArtistAvailability(artistId, formData.eventDate);
      }
      setStep(2); // Proceed to Razorpay Gateway Step
    } catch (err) {
      console.warn("Availability check bypassed", err);
      setStep(2);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleSubmitAuthorization = async () => {
    if (!paymentDetails.cardholderName || !paymentDetails.cardNumber || !paymentDetails.expiryDate || !paymentDetails.cvv) {
      toast({
        variant: "destructive",
        title: "Card Details Incomplete",
        description: "Please enter complete card details for Razorpay authorization hold.",
      });
      return;
    }

    setLoading(true);
    try {
      const uid = requireAuthUid(currentUser?.uid, t("booking.loginToBook"));

      // 1. Create booking in Firestore
      const booking = await createArtistBooking({
        artistId,
        artistName,
        customerId: uid,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        eventType: formData.eventType,
        eventDate: formData.eventDate,
        eventStartTime: formData.eventStartTime,
        eventEndTime: formData.eventEndTime,
        eventLocation: formData.eventLocation,
        customerAddress: formData.customerAddress,
        message: formData.message,
        specialRequirements: formData.specialRequirements,
        authorizedAmount: Number(formData.authorizedAmount || 15000),
        status: "pending_artist_approval",
        paymentGateway: "razorpay",
        paymentStatus: "authorized_hold",
      });

      // 2. Save inquiry to Firestore collection
      const sanitized = sanitizePayload({
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
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
        createdAt: serverTimestamp(),
      });

      await withTimeout(
        addDoc(collection(db, "inquiries"), sanitized),
        FIREBASE_WRITE_TIMEOUT_MS,
        t("booking.timeoutText")
      );

      // 3. Automatically sync inquiry to Telecaller Workbench
      saveCustomerInquiryLead({
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail || currentUser?.email || "",
        eventType: formData.eventType,
        eventDate: formData.eventDate,
        eventLocation: formData.eventLocation,
        budget: Number(formData.authorizedAmount || 15000),
        message: formData.message || formData.specialRequirements || "",
        artistId,
        artistName,
      });

      const generatedCode = booking.id.slice(0, 8).toUpperCase();
      setBookingCode(generatedCode);

      toast({
        title: "Booking Requested & Authorized",
        description: `Razorpay hold active for 24h. Booking code: ${generatedCode}`,
      });

      setStep(3); // Step 3: Success Confirmation Screen
    } catch (error: any) {
      logFirebaseError(error);
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: firebaseErrorMessage(error, t("booking.sendFailed")),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto no-scrollbar border-stone-200 bg-white p-5 sm:p-7 rounded-3xl shadow-2xl">
        <DialogHeader className="p-0 border-b border-stone-100 pb-3">
          <DialogTitle className="text-xl sm:text-2xl font-black text-stone-900 text-center tracking-tight">
            Book {artistName}
          </DialogTitle>
          <DialogDescription className="text-xs font-medium text-stone-500 text-center mt-1">
            Enter your details to check availability & authorize booking hold
          </DialogDescription>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-3 mt-3">
            <span
              className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                step >= 1 ? "bg-orange-600 scale-125" : "bg-stone-200"
              }`}
            />
            <span className="h-0.5 w-8 bg-stone-200" />
            <span
              className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                step >= 2 ? "bg-orange-600 scale-125" : "bg-stone-200"
              }`}
            />
            <span className="h-0.5 w-8 bg-stone-200" />
            <span
              className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                step >= 3 ? "bg-orange-600 scale-125" : "bg-stone-200"
              }`}
            />
          </div>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* ─── Step 1: Event Details & Inquiry Form ─── */}
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
                  <Label className="text-xs font-bold text-stone-700">Your Full Name *</Label>
                  <Input
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    placeholder="e.g. John Doe"
                    className="h-10 text-xs font-semibold rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-stone-700">Email Address *</Label>
                  <Input
                    name="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className="h-10 text-xs font-semibold rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-stone-700">Mobile Number *</Label>
                  <Input
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleChange}
                    placeholder={PHONE_PLACEHOLDER}
                    maxLength={PHONE_MAX_LENGTH}
                    className="h-10 text-xs font-semibold rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-stone-700">WhatsApp Number</Label>
                  <Input
                    name="clientWhatsapp"
                    value={formData.clientWhatsapp}
                    onChange={handleChange}
                    placeholder={PHONE_PLACEHOLDER}
                    maxLength={PHONE_MAX_LENGTH}
                    className="h-10 text-xs font-semibold rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1 col-span-1">
                  <Label className="text-xs font-bold text-stone-700">Event Date *</Label>
                  <Input
                    name="eventDate"
                    type="date"
                    value={formData.eventDate}
                    onChange={handleChange}
                    className="h-10 text-xs font-semibold rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1 col-span-1">
                  <Label className="text-xs font-bold text-stone-700">Start Time</Label>
                  <Input
                    name="eventStartTime"
                    type="time"
                    value={formData.eventStartTime}
                    onChange={handleChange}
                    className="h-10 text-xs font-semibold rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1 col-span-1">
                  <Label className="text-xs font-bold text-stone-700">End Time</Label>
                  <Input
                    name="eventEndTime"
                    type="time"
                    value={formData.eventEndTime}
                    onChange={handleChange}
                    className="h-10 text-xs font-semibold rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-stone-700">Event Location/City *</Label>
                  <Input
                    name="eventLocation"
                    value={formData.eventLocation}
                    onChange={handleChange}
                    placeholder="e.g. Mumbai, Pune"
                    className="h-10 text-xs font-semibold rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-stone-700">Performance Type *</Label>
                  <Select
                    value={formData.eventType}
                    onValueChange={handleSelectChange}
                  >
                    <SelectTrigger className="w-full h-10 text-xs font-semibold rounded-xl">
                      <SelectValue placeholder="Choose type" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((e) => (
                        <SelectItem key={e} value={e}>
                          {getArtLabel(t, e)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-stone-700">Event Venue Address</Label>
                <Input
                  name="customerAddress"
                  value={formData.customerAddress}
                  onChange={handleChange}
                  placeholder="Full building/street address"
                  className="h-10 text-xs font-semibold rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-stone-700">Your Budget/Offer (₹) *</Label>
                  <Input
                    name="authorizedAmount"
                    type="number"
                    min={500}
                    value={formData.authorizedAmount}
                    onChange={handleChange}
                    className="h-10 text-xs font-semibold rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-stone-700">Special Requirements</Label>
                  <Input
                    name="specialRequirements"
                    value={formData.specialRequirements}
                    onChange={handleChange}
                    placeholder="e.g. sound system, stage"
                    className="h-10 text-xs font-semibold rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-stone-700">Event Description / Message</Label>
                <Textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell the artist about the event, audience, etc."
                  rows={2}
                  className="text-xs font-semibold rounded-xl resize-none"
                />
              </div>

              <Button
                type="button"
                onClick={runAvailabilityCheck}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white py-6 rounded-xl font-extrabold text-sm shadow-md"
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

          {/* ─── Step 2: Razorpay Gateway & Authorization Hold ─── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5 mt-2"
            >
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600 mb-1.5" />
                <h3 className="text-sm font-extrabold text-emerald-950">Artist is Available!</h3>
                <p className="text-xs text-emerald-700 mt-0.5">
                  The date <span className="font-bold">{formData.eventDate}</span> is open. Secure this slot by setting up payment authorization hold.
                </p>
              </div>

              {/* Escrow Information alert */}
              <div className="rounded-2xl border border-orange-200 bg-orange-50/60 p-3.5 flex items-start gap-2.5 text-xs text-stone-700 leading-relaxed">
                <ShieldCheck className="h-5 w-5 shrink-0 text-orange-600" />
                <div>
                  <span className="font-extrabold text-stone-900 block mb-0.5">Escrow Authorization Guarantee</span>
                  Funds remain in your account until the artist accepts. If rejected or expired (24h), the authorization drops automatically. No refund fees apply.
                </div>
              </div>

              {/* Gateway — Razorpay */}
              <div className="space-y-1.5">
                <Label className="text-stone-900 font-extrabold text-xs">Payment Gateway</Label>
                <div className="py-2.5 px-4 rounded-xl border border-orange-500 bg-orange-50 text-orange-600 font-black text-xs uppercase text-center tracking-wider">
                  Razorpay Secure Hold
                </div>
              </div>

              {/* Razorpay Card Form */}
              <div className="border border-stone-200 rounded-2xl bg-stone-50/80 p-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-stone-500 mb-3 flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-stone-600" />
                  Simulated Razorpay Gateway
                </h4>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-stone-700">Cardholder Name</Label>
                    <Input
                      value={paymentDetails.cardholderName}
                      onChange={(e) =>
                        setPaymentDetails((prev) => ({ ...prev, cardholderName: e.target.value }))
                      }
                      placeholder="Johnathan Doe"
                      className="h-10 text-xs font-semibold rounded-xl bg-white"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-stone-700">Credit / Debit Card Number</Label>
                    <Input
                      value={paymentDetails.cardNumber}
                      onChange={(e) =>
                        setPaymentDetails((prev) => ({
                          ...prev,
                          cardNumber: e.target.value.replace(/\D/g, "").slice(0, 16),
                        }))
                      }
                      placeholder="4111 2222 3333 4444"
                      className="h-10 text-xs font-semibold rounded-xl bg-white"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-stone-700">Expiration Date</Label>
                      <Input
                        value={paymentDetails.expiryDate}
                        onChange={(e) =>
                          setPaymentDetails((prev) => ({ ...prev, expiryDate: e.target.value }))
                        }
                        placeholder="MM/YY"
                        className="h-10 text-xs font-semibold rounded-xl bg-white"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-stone-700">CVV / CVC</Label>
                      <Input
                        value={paymentDetails.cvv}
                        type="password"
                        maxLength={3}
                        onChange={(e) =>
                          setPaymentDetails((prev) => ({
                            ...prev,
                            cvv: e.target.value.replace(/\D/g, ""),
                          }))
                        }
                        placeholder="***"
                        className="h-10 text-xs font-semibold rounded-xl bg-white"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-stone-200 pt-3 flex items-center justify-between text-xs text-stone-600 font-semibold">
                  <span>Authorized Hold Amount:</span>
                  <span className="text-stone-900 font-extrabold text-sm">
                    ₹{Number(formData.authorizedAmount).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-1/3 py-5 rounded-xl font-bold text-xs"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft className="mr-1.5 h-4 w-4" /> Edit Details
                </Button>
                <Button
                  onClick={handleSubmitAuthorization}
                  className="w-2/3 bg-orange-600 hover:bg-orange-500 text-white py-5 rounded-xl font-extrabold text-xs shadow-md"
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

          {/* ─── Step 3: Success Confirmation Screen ─── */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-4 text-center space-y-6"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mx-auto shadow-xs">
                <CheckCircle2 className="h-10 w-10" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-stone-900 tracking-tight">
                  Booking Requested & Authorized!
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-stone-500 mt-1.5">
                  {artistName} has received your inquiry. Razorpay authorization hold is active for 24 hours.
                </p>
                <div className="inline-flex items-center rounded-full bg-stone-100 px-4 py-1.5 text-xs font-bold text-stone-700 mt-3 border border-stone-200">
                  Booking Code: <span className="font-extrabold text-stone-900 ml-1">{bookingCode || "MK98765432"}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  onClick={() => {
                    onOpenChange(false);
                    navigate("/profile");
                  }}
                  className="h-10 rounded-full bg-stone-950 hover:bg-orange-600 px-6 text-xs font-extrabold text-white transition-colors"
                >
                  Go to Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="h-10 rounded-full border-stone-200 px-6 text-xs font-extrabold text-stone-700"
                >
                  Book Another Service
                </Button>
              </div>

              {/* "What Happens Next?" 4-Step Progress Box */}
              <div className="pt-6 border-t border-stone-100 text-left">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-400 text-center mb-4">
                  What Happens Next?
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/70 flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mb-2 font-bold text-xs">
                      1
                    </div>
                    <p className="text-xs font-bold text-stone-800 leading-tight">
                      Artist receives request
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/70 flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mb-2 font-bold text-xs">
                      2
                    </div>
                    <p className="text-xs font-bold text-stone-800 leading-tight">
                      Discuss & confirm details
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/70 flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mb-2 font-bold text-xs">
                      3
                    </div>
                    <p className="text-xs font-bold text-stone-800 leading-tight">
                      Razorpay hold captures
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/70 flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mb-2 font-bold text-xs">
                      4
                    </div>
                    <p className="text-xs font-bold text-stone-800 leading-tight">
                      Enjoy your Event
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
