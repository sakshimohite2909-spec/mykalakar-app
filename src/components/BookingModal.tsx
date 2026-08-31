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
  CalendarDays,
  Sparkles,
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
  services?: Array<{
    id?: string;
    event?: string;
    category?: string;
    subcategory?: string;
    artForm?: string;
    soloPrice?: string | number;
  }>;
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
  services = [],
}: Props) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [bookingCode, setBookingCode] = useState("");
  const [sameAsMobile, setSameAsMobile] = useState(false);
  const [selectedService, setSelectedService] = useState<string>("");

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
    authorizedAmount: "15000",
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

  // Set default selected service
  useEffect(() => {
    if (services && services.length > 0) {
      const first = services[0].subcategory || services[0].artForm || services[0].category || "";
      setSelectedService((prev) => prev || first);
    }
  }, [open, services]);

  // Reset wizard & prefill customer details on open/close
  useEffect(() => {
    if (open) {
      setStep(1);
      setBookingCode("");

      const authName = String(
        userProfile?.fullName ||
        userProfile?.name ||
        userProfile?.displayName ||
        currentUser?.displayName ||
        ""
      ).trim();

      const authEmail = String(
        currentUser?.email ||
        userProfile?.email ||
        ""
      ).trim();

      const rawPhone = String(
        userProfile?.phone ||
        userProfile?.mobileNumber ||
        userProfile?.phoneNumber ||
        userProfile?.contactNumber ||
        ""
      ).trim();
      const authPhone = rawPhone ? sanitizePhoneNumber(rawPhone) : "";

      const rawWhatsapp = String(
        userProfile?.clientWhatsapp ||
        userProfile?.whatsapp ||
        userProfile?.whatsappNumber ||
        authPhone ||
        ""
      ).trim();
      const authWhatsapp = rawWhatsapp ? sanitizePhoneNumber(rawWhatsapp) : authPhone;

      const isSame = Boolean(authPhone && (!userProfile?.clientWhatsapp || authWhatsapp === authPhone));
      setSameAsMobile(isSame);

      if (services && services.length > 0) {
        setSelectedService(services[0].subcategory || services[0].artForm || services[0].category || "");
      }
      setPaymentDetails({
        cardholderName: authName || "",
        cardNumber: "",
        expiryDate: "",
        cvv: "",
      });

      const initialBudget = startingPrice ? String(parsePriceToNumber(startingPrice)) : "15000";

      setFormData({
        customerName: authName || "",
        customerEmail: authEmail || "",
        customerPhone: authPhone || "",
        clientWhatsapp: authWhatsapp || authPhone || "",
        customerAddress: String(userProfile?.address || userProfile?.location || ""),
        eventLocation: String(userProfile?.city || userProfile?.district || ""),
        eventDate: preselectedDate || "",
        eventStartTime: "",
        eventEndTime: "",
        eventType: "",
        message: "",
        specialRequirements: "",
        authorizedAmount: initialBudget,
      });
    }
  }, [open]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "customerPhone") {
      const sanitized = sanitizePhoneNumber(value);
      setFormData((prev) => ({
        ...prev,
        customerPhone: sanitized,
        ...(sameAsMobile ? { clientWhatsapp: sanitized } : {}),
      }));
      return;
    }
    if (name === "clientWhatsapp") {
      setFormData((prev) => ({
        ...prev,
        clientWhatsapp: sanitizePhoneNumber(value),
      }));
      return;
    }
    if (name === "authorizedAmount") {
      const numericDigits = value.replace(/\D/g, "");
      setFormData((prev) => ({
        ...prev,
        authorizedAmount: numericDigits,
      }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSameAsMobileToggle = (checked: boolean) => {
    setSameAsMobile(checked);
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        clientWhatsapp: prev.customerPhone,
      }));
    }
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, eventType: value }));
  };

  const handleAuthCheck = () => {
    if (!currentUser) {
      toast({
        title: t("artist.loginRequiredTitle") || "लॉगिन आवश्यक आहे",
        description: t("artist.loginRequiredText") || "पुढील प्रक्रियेसाठी कृपया प्रथम लॉगिन करा.",
      });
      onOpenChange(false);
      navigate("/login", {
        state: {
          from: window.location.pathname,
          action: "book",
        },
      });
      return false;
    }
    return true;
  };

  const runAvailabilityCheck = async () => {
    if (!handleAuthCheck()) return;

    if (!formData.customerName || !formData.eventDate || !formData.eventType) {
      toast({
        variant: "destructive",
        title: "Required Fields Missing",
        description: "Please fill in your name, event date, and performance type.",
      });
      return;
    }

    const isValidPhone = validatePhoneNumber(formData.customerPhone);
    if (!isValidPhone) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: "Please enter a valid 10-digit mobile number.",
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

  const handleSubmitBookingRequest = async () => {
    if (!handleAuthCheck()) return;

    setLoading(true);
    try {
      const uid = requireAuthUid(currentUser);
      const matchedService = services?.find(
        (s) => (s.subcategory || s.artForm || s.category) === selectedService
      );
      const effectiveService = selectedService || formData.eventType || "Performance";

      // 1. Create booking in Firestore with status PENDING_TELECALLER_VERIFICATION
      const booking = await createArtistBooking({
        artistId,
        artistName,
        customerId: uid,
        clientName: formData.customerName,
        clientPhone: formData.customerPhone,
        clientAddress: formData.customerAddress,
        venueLocation: formData.eventLocation,
        performanceType: effectiveService,
        additionalNotes: formData.message,
        customerEmail: formData.customerEmail,
        eventDate: formData.eventDate,
        eventStartTime: formData.eventStartTime,
        eventEndTime: formData.eventEndTime,
        specialRequirements: formData.specialRequirements,
        authorizedAmount: Number(formData.authorizedAmount || 15000),
        status: "PENDING_TELECALLER_VERIFICATION",
        paymentGateway: "razorpay",
        paymentStatus: "deferred_payment",
        selectedService: effectiveService,
        serviceCategory: matchedService?.category,
        serviceEvent: matchedService?.event,
      });

      // 2. Save inquiry to Firestore collection
      const sanitized = sanitizePayload({
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        clientWhatsapp: formData.clientWhatsapp,
        eventType: formData.eventType,
        selectedService: effectiveService,
        serviceCategory: matchedService?.category,
        serviceEvent: matchedService?.event,
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
        id: `booking_${booking.id}`,
        bookingId: booking.id,
        customerId: uid,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail || currentUser?.email || "",
        eventType: formData.eventType,
        selectedService: effectiveService,
        serviceCategory: matchedService?.category,
        serviceEvent: matchedService?.event,
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
        title: "Booking Request Sent!",
        description: `Our team & ${artistName} will contact you soon. Code: ${generatedCode}`,
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
              {/* Multi-Service Selection: "What would you like to book this artist for?" */}
              {services && services.length > 1 && (
                <div className="space-y-2 rounded-2xl border border-orange-200 bg-orange-50/70 p-3.5 shadow-sm">
                  <Label className="text-xs font-black text-orange-950 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-orange-600" />
                    What would you like to book this artist for? *
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                    {services.map((srv, sIdx) => {
                      const sName = srv.subcategory || srv.artForm || srv.category || `Service ${sIdx + 1}`;
                      const isSelected = selectedService === sName;
                      return (
                        <button
                          key={`${sName}-${sIdx}`}
                          type="button"
                          onClick={() => setSelectedService(sName)}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? "border-orange-500 bg-white text-orange-950 font-black shadow-sm ring-2 ring-orange-400/20"
                              : "border-stone-200/80 bg-white/70 text-stone-700 font-semibold hover:border-orange-200 hover:bg-white"
                          }`}
                        >
                          <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                            isSelected ? "border-orange-600 bg-orange-600" : "border-stone-300"
                          }`}>
                            {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold leading-tight truncate">{getArtLabel(t, sName)}</p>
                            {srv.category && (
                              <p className="text-[10px] text-stone-400 font-medium truncate">{getArtLabel(t, srv.category)}</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Row 1: Full Name */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-stone-700">Your Full Name *</Label>
                <Input
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  autoComplete="off"
                  className="h-10 text-xs font-semibold rounded-xl"
                  required
                />
              </div>

              {/* Row 2: Mobile Number & WhatsApp Number + Checkbox */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-stone-700">Mobile Number *</Label>
                  <Input
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleChange}
                    placeholder={PHONE_PLACEHOLDER}
                    maxLength={PHONE_MAX_LENGTH}
                    autoComplete="off"
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
                    autoComplete="off"
                    disabled={sameAsMobile}
                    className={`h-10 text-xs font-semibold rounded-xl ${
                      sameAsMobile ? "bg-stone-100/90 text-stone-500 cursor-not-allowed border-stone-200" : ""
                    }`}
                  />
                  <label className="flex items-center gap-2 cursor-pointer pt-1 select-none text-[11px] font-semibold text-stone-600 hover:text-stone-900 transition-colors">
                    <input
                      type="checkbox"
                      checked={sameAsMobile}
                      onChange={(e) => handleSameAsMobileToggle(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-stone-300 text-orange-600 focus:ring-orange-500 accent-orange-600 cursor-pointer"
                    />
                    <span>WhatsApp number is same as mobile number</span>
                  </label>
                </div>
              </div>

              {/* Row 3: Event Date, Start Time, End Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="space-y-1 col-span-1">
                  <Label className="text-xs font-bold text-stone-700">Event Date *</Label>
                  <Input
                    name="eventDate"
                    type="date"
                    value={formData.eventDate}
                    onChange={handleChange}
                    className="h-10 text-xs font-semibold rounded-xl cursor-pointer"
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
                    className="h-10 text-xs font-semibold rounded-xl cursor-pointer"
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
                    className="h-10 text-xs font-semibold rounded-xl cursor-pointer"
                    required
                  />
                </div>
              </div>

              {/* Row 4: Event Location/City & Performance Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              {/* Row 5: Event Venue Address (Full Width) */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-stone-700">Event Venue Address</Label>
                <Input
                  name="customerAddress"
                  value={formData.customerAddress}
                  onChange={handleChange}
                  placeholder="e.g. Full venue address, building name, street, area"
                  className="h-10 text-xs font-semibold rounded-xl"
                />
              </div>

              {/* Row 6: Budget & Special Requirements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-stone-700">Your Budget/Offer (₹) *</Label>
                  <Input
                    name="authorizedAmount"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.authorizedAmount ?? ""}
                    onChange={handleChange}
                    placeholder="e.g. 15000"
                    autoComplete="off"
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
                    Processing Request...
                  </>
                ) : (
                  <>
                    Continue to Booking Request <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {/* ─── Step 2: Request Review Notice ─── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5 mt-2"
            >
              <div className="rounded-2xl border border-orange-200 bg-orange-50/80 p-4 text-center">
                <CalendarDays className="mx-auto h-7 w-7 text-orange-600 mb-1.5" />
                <h3 className="text-sm font-extrabold text-stone-900">Review Request for {artistName}</h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  Your request for <span className="font-bold text-stone-900">{formData.eventDate}</span> will be routed to our Executive Management team and sent to {artistName}.
                </p>
              </div>

              {/* No Payment Required Banner */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 flex items-start gap-3 text-xs text-stone-700 leading-relaxed">
                <ShieldCheck className="h-6 w-6 shrink-0 text-emerald-600 mt-0.5" />
                <div>
                  <span className="font-extrabold text-emerald-950 block text-sm mb-0.5">{t("booking.zeroPaymentTitle") || "Zero Upfront Payment"}</span>
                  {t("booking.zeroPaymentDesc") || "No immediate payment required! Our MyKalakar Executive team will contact both you and the artist to finalize the event timing, venue details, and exact pricing."}
                </div>
              </div>

              {/* Event Summary Details Card */}
              <div className="border border-stone-200 rounded-2xl bg-stone-50/80 p-4 space-y-2 text-xs font-semibold text-stone-700">
                <div className="flex justify-between border-b border-stone-200/60 pb-2">
                  <span>{t("booking.clientName") || "Client Name:"}</span>
                  <strong className="text-stone-900">{formData.customerName}</strong>
                </div>
                <div className="flex justify-between border-b border-stone-200/60 pb-2">
                  <span>{t("booking.contactNumber") || "Contact Number:"}</span>
                  <strong className="text-stone-900">{formData.customerPhone}</strong>
                </div>
                <div className="flex justify-between border-b border-stone-200/60 pb-2">
                  <span>{t("booking.eventPerformance") || "Event & Performance:"}</span>
                  <strong className="text-stone-900">{getArtLabel(t, formData.eventType)}</strong>
                </div>
                <div className="flex justify-between border-b border-stone-200/60 pb-2">
                  <span>{t("booking.eventLocation") || "Event Location:"}</span>
                  <strong className="text-stone-900">{formData.eventLocation}</strong>
                </div>
                <div className="flex justify-between pt-1 text-sm font-extrabold">
                  <span className="text-stone-800">{t("booking.estimatedBudget") || "Estimated Budget Offer:"}</span>
                  <span className="text-orange-600">₹{Number(formData.authorizedAmount || 15000).toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-1/3 py-5 rounded-xl font-bold text-xs"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft className="mr-1.5 h-4 w-4" /> {t("booking.editDetails") || "Edit Details"}
                </Button>
                <Button
                  onClick={handleSubmitBookingRequest}
                  className="w-2/3 bg-orange-600 hover:bg-orange-500 text-white py-5 rounded-xl font-extrabold text-xs shadow-md"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("booking.sending") || "Sending Request..."}
                    </>
                  ) : (
                    <>
                      {t("booking.sendRequest") || "Send Booking Request"} <Send className="ml-1.5 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* ─── Step 3: Success Confirmation Screen (Minimal & Clean) ─── */}
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
                  {t("booking.requestSentSuccess") || "Booking Request Sent Successfully!"}
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-stone-500 mt-1.5 max-w-md mx-auto leading-relaxed">
                  {t("booking.requestSentDesc", { name: artistName }) || `Your request is being reviewed by our MyKalakar Executive Team. We will connect with you and ${artistName} shortly.`}
                </p>
                <div className="inline-flex items-center rounded-full bg-stone-100 px-4 py-1.5 text-xs font-bold text-stone-700 mt-3 border border-stone-200">
                  {t("booking.bookingCode") || "Booking Code:"} <span className="font-extrabold text-stone-900 ml-1">{bookingCode || "MK98765432"}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button
                  onClick={() => {
                    onOpenChange(false);
                    navigate("/profile");
                  }}
                  className="h-10 rounded-full bg-stone-950 hover:bg-orange-600 px-6 text-xs font-extrabold text-white transition-colors"
                >
                  {t("booking.goToDashboard") || "Go to Dashboard"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="h-10 rounded-full border-stone-200 px-6 text-xs font-extrabold text-stone-700"
                >
                  {t("booking.bookAnother") || "Book Another Service"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
