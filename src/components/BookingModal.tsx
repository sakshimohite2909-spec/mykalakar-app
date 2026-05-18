import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { FIREBASE_WRITE_TIMEOUT_MS, firebaseErrorMessage, logFirebaseError, requireAuthUid, sanitizePayload, withTimeout } from "@/lib/firebaseSafe";
import { PHONE_MAX_LENGTH, PHONE_PLACEHOLDER, sanitizePhoneNumber, validatePhoneNumber } from "@/lib/phoneUtils";
import { useI18n } from "@/i18n/I18nProvider";
import { getArtLabel } from "@/lib/artLabels";

const eventTypes = ["Wedding", "Corporate Event", "Birthday Party", "Festival", "Concert", "Private Event"];
const INQUIRY_RATE_LIMIT_MS = 60_000;
const INQUIRY_MESSAGE_MAX_LENGTH = 999;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artistName: string;
  artistId: string;
}

export default function BookingModal({ open, onOpenChange, artistName, artistId }: Props) {
  const { t } = useI18n(); // ADDED FOR i18n
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    eventLocation: "",
    eventDate: "",
    eventType: "",
    message: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "customerPhone") {
      setFormData(prev => ({ ...prev, [name]: sanitizePhoneNumber(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, eventType: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!currentUser) {
      toast({ variant: "destructive", title: t("artist.loginRequiredTitle"), description: t("booking.loginRequiredText") }); // ADDED FOR i18n
      return;
    }

    const rateLimitKey = `lastInquiryAt:${currentUser.uid}:${artistId}`;
    const lastInquiryAt = Number(window.localStorage.getItem(rateLimitKey) || 0);
    if (Date.now() - lastInquiryAt < INQUIRY_RATE_LIMIT_MS) {
      toast({ variant: "destructive", title: t("booking.pleaseWait"), description: t("booking.rateLimitText") }); // ADDED FOR i18n
      return;
    }
    
    // Validation
    if (!formData.eventType) {
      toast({ variant: "destructive", title: t("booking.eventTypeRequired"), description: t("booking.eventTypeRequiredText") }); // ADDED FOR i18n
      return;
    }

    if (!validatePhoneNumber(formData.customerPhone)) {
      toast({ 
        variant: "destructive", 
        title: t("booking.invalidPhone"), // ADDED FOR i18n
        description: t("booking.invalidPhoneText") // ADDED FOR i18n
      });
      return;
    }

    if (formData.message.length > INQUIRY_MESSAGE_MAX_LENGTH) {
      toast({ variant: "destructive", title: t("booking.messageTooLong"), description: t("booking.messageTooLongText") }); // ADDED FOR i18n
      return;
    }

    setLoading(true);
    try {
      const uid = requireAuthUid(currentUser);
      await withTimeout(
        addDoc(collection(db, "inquiries"), sanitizePayload({
          ...formData,
          artistName,
          artistId,
          artistUid: artistId,
          customerId: uid,
          customerEmail: currentUser.email || "",
          customerName: formData.customerName || userProfile?.name || "",
          status: "pending",
          spamCheckStatus: "pending",
          spamCheckProvider: "cloud-function-hook",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })),
        FIREBASE_WRITE_TIMEOUT_MS,
        t("booking.timeoutText") // ADDED FOR i18n
      );

      window.localStorage.setItem(rateLimitKey, String(Date.now()));
      onOpenChange(false);
      toast({ title: t("booking.sentTitle"), description: t("booking.sentText", { artistName }) }); // ADDED FOR i18n
      
      // Reset form
      setFormData({
        customerName: "",
        customerPhone: "",
        customerAddress: "",
        eventLocation: "",
        eventDate: "",
        eventType: "",
        message: ""
      });
    } catch (error: any) {
      logFirebaseError(error);
      toast({ variant: "destructive", title: t("common.error"), description: firebaseErrorMessage(error, t("booking.sendFailed")) }); // ADDED FOR i18n
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="booking-modal sm:max-w-md max-h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar">
        <DialogHeader>
          <DialogTitle className="font-display">{t("artist.inquiryTitleFor", { artistName })}</DialogTitle> {/* ADDED FOR i18n */}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{t("booking.yourName")}</Label> {/* ADDED FOR i18n */}
              <Input name="customerName" value={formData.customerName} onChange={handleChange} placeholder={t("booking.namePlaceholder")} required /> {/* ADDED FOR i18n */}
            </div>
            <div>
              <Label>{t("booking.phone")}</Label> {/* ADDED FOR i18n */}
              <Input 
                name="customerPhone" 
                value={formData.customerPhone} 
                onChange={handleChange} 
                placeholder={PHONE_PLACEHOLDER} 
                type="tel" 
                maxLength={PHONE_MAX_LENGTH}
                required 
              />
            </div>
          </div>

          <div>
            <Label>{t("booking.address")}</Label> {/* ADDED FOR i18n */}
            <Textarea name="customerAddress" value={formData.customerAddress} onChange={handleChange} placeholder={t("booking.addressPlaceholder")} rows={2} required /> {/* ADDED FOR i18n */}
          </div>

          <div>
            <Label>{t("booking.eventLocation")}</Label> {/* ADDED FOR i18n */}
            <Input name="eventLocation" value={formData.eventLocation} onChange={handleChange} placeholder={t("booking.eventLocationPlaceholder")} required /> {/* ADDED FOR i18n */}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{t("event.date")}</Label> {/* ADDED FOR i18n */}
              <Input name="eventDate" value={formData.eventDate} onChange={handleChange} type="date" required />
            </div>
            <div>
              <Label>{t("event.performanceType")}</Label> {/* ADDED FOR i18n */}
              <Select value={formData.eventType} onValueChange={handleSelectChange} required>
                <SelectTrigger><SelectValue placeholder={t("booking.selectEventType")} /></SelectTrigger> {/* ADDED FOR i18n */}
                <SelectContent>
                  {eventTypes.map((e) => <SelectItem key={e} value={e}>{getArtLabel(t, e)}</SelectItem>)} {/* ADDED FOR i18n */}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>{t("booking.additionalDetails")}</Label> {/* ADDED FOR i18n */}
            <Textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder={t("booking.messagePlaceholder")}
              maxLength={INQUIRY_MESSAGE_MAX_LENGTH}
              rows={2}
            />
          </div>
          <Button type="submit" className="w-full gradient-bg border-0 text-primary-foreground font-bold py-6 text-lg" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("booking.sending")} {/* ADDED FOR i18n */}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {t("artist.sendInquiry")} {/* ADDED FOR i18n */}
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
