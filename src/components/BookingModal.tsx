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
      toast({ variant: "destructive", title: "Login required", description: "Please sign in before sending an inquiry." });
      return;
    }

    const rateLimitKey = `lastInquiryAt:${currentUser.uid}:${artistId}`;
    const lastInquiryAt = Number(window.localStorage.getItem(rateLimitKey) || 0);
    if (Date.now() - lastInquiryAt < INQUIRY_RATE_LIMIT_MS) {
      toast({ variant: "destructive", title: "Please wait", description: "You can send another inquiry to this artist in a minute." });
      return;
    }
    
    // Validation
    if (!formData.eventType) {
      toast({ variant: "destructive", title: "Event type required", description: "Please select the event type." });
      return;
    }

    if (!validatePhoneNumber(formData.customerPhone)) {
      toast({ 
        variant: "destructive", 
        title: "Invalid Phone Number", 
        description: "Please enter a valid 10-digit phone number." 
      });
      return;
    }

    if (formData.message.length > INQUIRY_MESSAGE_MAX_LENGTH) {
      toast({ variant: "destructive", title: "Message too long", description: "Please keep your message under 1000 characters." });
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
        "Sending this inquiry is taking too long. Please try again."
      );

      window.localStorage.setItem(rateLimitKey, String(Date.now()));
      onOpenChange(false);
      toast({ title: "Inquiry sent", description: `Your inquiry for ${artistName} has been submitted.` });
      
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
      toast({ variant: "destructive", title: "Error", description: firebaseErrorMessage(error, "Could not send inquiry.") });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="booking-modal sm:max-w-md max-h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar">
        <DialogHeader>
          <DialogTitle className="font-display">Inquiry for {artistName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Your Name</Label>
              <Input name="customerName" value={formData.customerName} onChange={handleChange} placeholder="Enter your name" required />
            </div>
            <div>
              <Label>Phone Number *</Label>
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
            <Label>Your Address</Label>
            <Textarea name="customerAddress" value={formData.customerAddress} onChange={handleChange} placeholder="Enter your full address" rows={2} required />
          </div>

          <div>
            <Label>Function Location (Event Venue)</Label>
            <Input name="eventLocation" value={formData.eventLocation} onChange={handleChange} placeholder="Where is the function happening?" required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Event Date</Label>
              <Input name="eventDate" value={formData.eventDate} onChange={handleChange} type="date" required />
            </div>
            <div>
              <Label>Event Type</Label>
              <Select value={formData.eventType} onValueChange={handleSelectChange} required>
                <SelectTrigger><SelectValue placeholder="Select event type" /></SelectTrigger>
                <SelectContent>
                  {eventTypes.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Additional Details</Label>
            <Textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Tell the artist more about your event..."
              maxLength={INQUIRY_MESSAGE_MAX_LENGTH}
              rows={2}
            />
          </div>
          <Button type="submit" className="w-full gradient-bg border-0 text-primary-foreground font-bold py-6 text-lg" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Inquiry
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
