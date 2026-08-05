import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, User, Calendar, MapPin, IndianRupee, Sparkles, Loader2 } from "lucide-react";
import { MAIN_EVENT_CARDS, EVENT_CATEGORY_HIERARCHY } from "@/constants/artistSystem";
import { createManualLead, type TelecallerLead } from "@/services/telecallerService";
import { toast } from "@/hooks/use-toast";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeadCreated: (lead: TelecallerLead) => void;
};

export default function ManualLeadModal({ open, onOpenChange, onLeadCreated }: Props) {
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [eventType, setEventType] = useState("Varkari Sampraday");
  const [subCategory, setSubCategory] = useState("Kirtankar");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [district, setDistrict] = useState("Pune");
  const [budget, setBudget] = useState(15000);
  const [specialNotes, setSpecialNotes] = useState("");

  const selectedEventData = (EVENT_CATEGORY_HIERARCHY as any)[eventType] || (EVENT_CATEGORY_HIERARCHY as any)["Varkari Sampraday"];
  const availableSubcategories: string[] = Object.values(selectedEventData.groups || {})
    .flatMap((group: any) => group.subcategories || []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !eventDate || !eventLocation) {
      toast({ variant: "destructive", title: "Required fields missing", description: "Please enter customer name, phone, event date, and location." });
      return;
    }

    setLoading(true);
    try {
      const lead = await createManualLead({
        customerName,
        customerPhone,
        customerEmail,
        eventType,
        category: eventType,
        subCategory,
        eventDate,
        eventLocation,
        district,
        budget: Number(budget) || 0,
        specialNotes,
        source: "manual_phone_call",
      });

      toast({ title: "Phone Lead Logged!", description: `Inquiry for ${customerName} logged successfully.` });
      onLeadCreated(lead);
      onOpenChange(false);
      // Reset form
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setEventDate("");
      setEventLocation("");
      setSpecialNotes("");
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to log phone lead." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] rounded-3xl border-stone-200 bg-white p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-extrabold text-stone-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
              <Phone className="h-5 w-5" />
            </span>
            Log Incoming Phone Lead
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold text-stone-700">Customer Name *</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                <Input
                  required
                  placeholder="e.g. Ramesh Patil"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="pl-9 rounded-xl border-stone-200"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-stone-700">Customer Phone *</Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                <Input
                  required
                  placeholder="+91 98765 43210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="pl-9 rounded-xl border-stone-200"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold text-stone-700">Event Type (Category)</Label>
              <Select
                value={eventType}
                onValueChange={(val) => {
                  setEventType(val);
                  const firstSub = Object.values(((EVENT_CATEGORY_HIERARCHY as any)[val] || {}).groups || {})
                    .flatMap((g: any) => g.subcategories || [])[0] as string;
                  if (firstSub) setSubCategory(firstSub);
                }}
              >
                <SelectTrigger className="mt-1 rounded-xl border-stone-200">
                  <SelectValue placeholder="Select Event Type" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {MAIN_EVENT_CARDS.map((card) => (
                    <SelectItem key={card.name} value={card.name}>
                      {card.icon} {card.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-bold text-stone-700">Subcategory / Artform</Label>
              <Select value={subCategory} onValueChange={setSubCategory}>
                <SelectTrigger className="mt-1 rounded-xl border-stone-200">
                  <SelectValue placeholder="Select Subcategory" />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-56">
                  {availableSubcategories.map((sub) => (
                    <SelectItem key={sub} value={sub}>
                      {sub}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs font-bold text-stone-700">Event Date *</Label>
              <div className="relative mt-1">
                <Input
                  required
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="rounded-xl border-stone-200"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-stone-700">District / City</Label>
              <Input
                placeholder="e.g. Pune / Pandharpur"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="mt-1 rounded-xl border-stone-200"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-stone-700">Budget (₹)</Label>
              <Input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="mt-1 rounded-xl border-stone-200"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-bold text-stone-700">Full Event Address / Location *</Label>
            <Input
              required
              placeholder="e.g. Vitthal Temple Premises, Pandharpur"
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              className="mt-1 rounded-xl border-stone-200"
            />
          </div>

          <div>
            <Label className="text-xs font-bold text-stone-700">Customer Requirements & Notes</Label>
            <Textarea
              placeholder="e.g. Needs morning slot Kirtan performance with 4 team members."
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              rows={2}
              className="mt-1 rounded-xl border-stone-200 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-full text-xs font-bold text-stone-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-full bg-orange-600 hover:bg-orange-700 px-6 text-xs font-extrabold text-white shadow-md"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Phone Lead"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
