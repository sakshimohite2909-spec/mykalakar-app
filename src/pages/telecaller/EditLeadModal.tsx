import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Calendar, Clock, MapPin, IndianRupee, Sparkles, Loader2, Volume2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { updateLeadDetails, type TelecallerLead, type LeadStatus } from "@/services/telecallerService";
import { calculateCommissionSplit, findMatchingBudgetSlab } from "@/services/commissionSettingsService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: TelecallerLead | null;
  onLeadUpdated: (updatedLead: TelecallerLead) => void;
};

export default function EditLeadModal({ open, onOpenChange, lead, onLeadUpdated }: Props) {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [requestedArtistName, setRequestedArtistName] = useState("");
  const [confirmedArtistName, setConfirmedArtistName] = useState("");
  const [eventType, setEventType] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [budget, setBudget] = useState<number>(0);
  const [artistOfferBudget, setArtistOfferBudget] = useState<number>(0);
  const [soundRequired, setSoundRequired] = useState<string>("venue_provided");
  const [telecallerNotes, setTelecallerNotes] = useState("");
  const [status, setStatus] = useState<LeadStatus>("contacting_artists");

  useEffect(() => {
    if (lead) {
      setCustomerName(lead.customerName || "");
      setCustomerPhone(lead.customerPhone || "");
      setRequestedArtistName(lead.requestedArtistName || (lead.matchedArtists && lead.matchedArtists[0]?.artistName) || "");
      setConfirmedArtistName(lead.confirmedArtistName || "");
      setEventType(lead.eventType || "");
      setSubCategory(lead.subCategory || "");
      setEventDate(lead.eventDate || "");
      setEventTime(lead.eventTime || "06:00 PM - 09:00 PM");
      setEventLocation(lead.eventLocation || "");
      setVenueAddress(lead.venueAddress || "");
      setBudget(lead.budget ?? 0);
      setArtistOfferBudget(lead.artistOfferBudget ?? (lead.artistPayout || (lead.budget ? Math.round(lead.budget * 0.8) : 0)));
      setSoundRequired(
        lead.soundRequired === true ? "artist_bring" : lead.soundRequired === false ? "not_needed" : "venue_provided"
      );
      setTelecallerNotes(lead.telecallerNotes || lead.specialNotes || "");
      setStatus(lead.status === "new" ? "contacting_artists" : lead.status);
    }
  }, [lead]);

  if (!lead) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const soundBool = soundRequired === "artist_bring" ? true : soundRequired === "not_needed" ? false : undefined;
      const bgt = Number(budget) || 0;
      const artistOffer = Number(artistOfferBudget) || 0;
      const split = calculateCommissionSplit(bgt, artistOffer);

      const updatedPayload: Partial<TelecallerLead> = {
        customerName,
        customerPhone,
        requestedArtistName: requestedArtistName || undefined,
        confirmedArtistName: confirmedArtistName || undefined,
        eventType,
        subCategory,
        eventDate,
        eventTime,
        eventLocation,
        venueAddress,
        budget: bgt,
        artistOfferBudget: artistOffer,
        artistPayout: artistOffer,
        grossMargin: split.grossMargin,
        telecallerCommission: split.telecallerCommission,
        ownerProfit: split.ownerProfit,
        soundRequired: soundBool,
        telecallerNotes,
        status,
        isVerifiedByTelecaller: true,
      };

      await updateLeadDetails(lead.id, updatedPayload);

      const mergedLead: TelecallerLead = {
        ...lead,
        ...updatedPayload,
        isVerifiedByTelecaller: true,
      };

      onLeadUpdated(mergedLead);
      toast({
        title: "Lead Details Verified & Saved! ✅",
        description: "Customer requirements updated. You can now forward this masked requirement to artists.",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update lead:", error);
      toast({
        variant: "destructive",
        title: "Failed to update lead",
        description: "An error occurred while saving the verified details.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white border-stone-200 p-6 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <ShieldCheck className="h-5 w-5 stroke-[2.5]" />
            <span className="text-xs font-black uppercase tracking-wider">Telecaller Verification</span>
          </div>
          <DialogTitle className="text-xl font-black text-stone-950">
            Edit & Verify Customer Requirement
          </DialogTitle>
          <DialogDescription className="text-xs text-stone-500 font-medium">
            Fill in the missing details after calling the customer. These verified details will be used to quote artists without sharing customer contact info.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Customer Info (Private to Telecaller) */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase text-amber-900 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> Customer Details (Private)
              </span>
              <span className="text-[10px] bg-amber-200/70 text-amber-950 px-2 py-0.5 rounded-full font-bold">
                Not shared with artists
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <Label className="text-[11px] font-bold text-stone-700">Customer Name</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="h-8.5 text-xs bg-white mt-1 border-stone-200 rounded-xl"
                  required
                />
              </div>
              <div>
                <Label className="text-[11px] font-bold text-stone-700">Customer Phone</Label>
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="h-8.5 text-xs bg-white mt-1 border-stone-200 rounded-xl"
                  required
                />
              </div>
            </div>
            <div className="pt-1">
              <Label className="text-[11px] font-bold text-stone-700">Requested / Booked Artist Name (कलाकार नाव)</Label>
              <Input
                value={requestedArtistName}
                onChange={(e) => setRequestedArtistName(e.target.value)}
                placeholder="e.g. Artist name if booked by customer"
                className="h-8.5 text-xs bg-white mt-1 border-stone-200 rounded-xl font-bold text-orange-950"
              />
            </div>
          </div>

          {/* Event & Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold text-stone-800 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-orange-500" /> Event & Category
              </Label>
              <Input
                value={`${eventType} - ${subCategory}`}
                onChange={(e) => setSubCategory(e.target.value)}
                placeholder="e.g. Bhajan Sandhya - Gayak"
                className="h-9 text-xs rounded-xl mt-1"
                required
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-stone-800 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-orange-500" /> Event Date
              </Label>
              <Input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="h-9 text-xs rounded-xl mt-1"
                required
              />
            </div>
          </div>

          {/* Timing & Venue */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold text-stone-800 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-orange-500" /> Event Time / Duration
              </Label>
              <Input
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                placeholder="e.g. 05:00 PM to 09:00 PM"
                className="h-9 text-xs rounded-xl mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-stone-800 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-orange-500" /> City / Location
              </Label>
              <Input
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder="e.g. Pune"
                className="h-9 text-xs rounded-xl mt-1"
                required
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-bold text-stone-800">Exact Venue Address / Hall Name</Label>
            <Input
              value={venueAddress}
              onChange={(e) => setVenueAddress(e.target.value)}
              placeholder="e.g. Shree Ganesh Banquet Hall, Baner Road, Pune"
              className="h-9 text-xs rounded-xl mt-1"
            />
          </div>

          {/* Budgets (Customer vs Artist Offer with Role-Based Visibility) */}
          <div className="bg-stone-50 border border-stone-200/90 rounded-2xl p-3.5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-stone-800 flex items-center gap-1">
                  <IndianRupee className="h-3.5 w-3.5 text-emerald-600" /> Customer Budget (Max)
                </Label>
                <Input
                  type="number"
                  value={budget || ""}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setBudget(val);
                    const matched = findMatchingBudgetSlab(val);
                    const margin = matched ? matched.marginPct : 20;
                    setArtistOfferBudget(val > 0 ? Math.round(val * (1 - margin / 100)) : 0);
                  }}
                  className="h-9 text-xs font-black text-emerald-700 bg-white rounded-xl mt-1"
                  placeholder="उदा. ₹30000"
                  required
                />
                <span className="text-[10px] text-stone-500 font-medium">What customer agreed to pay</span>
              </div>

              <div>
                <Label className="text-xs font-bold text-stone-800 flex items-center gap-1">
                  <IndianRupee className="h-3.5 w-3.5 text-orange-600" /> Offer to Artist (Payout)
                </Label>
                <Input
                  type="number"
                  value={artistOfferBudget || ""}
                  onChange={(e) => setArtistOfferBudget(Number(e.target.value) || 0)}
                  className="h-9 text-xs font-black text-orange-600 bg-white rounded-xl mt-1"
                  placeholder="₹24000"
                />
                {isAdmin && (
                  <span className="text-[10px] text-stone-500 font-medium">
                    Gross Margin: ₹{Math.max(0, (budget || 0) - (artistOfferBudget || 0)).toLocaleString("en-IN")}
                  </span>
                )}
              </div>
            </div>

            {/* Role-Based Slab & Commission Breakdown Box */}
            {(() => {
              const safeBudget = budget || 0;
              const matchedSlab = findMatchingBudgetSlab(safeBudget);
              const marginPct = matchedSlab ? matchedSlab.marginPct : 20;
              const commPct = matchedSlab ? matchedSlab.commissionPct : 10;
              const safeArtist = artistOfferBudget > 0 ? artistOfferBudget : (safeBudget > 0 ? Math.round(safeBudget * (1 - marginPct / 100)) : 0);
              const grossMargin = Math.max(0, safeBudget - safeArtist);
              const commAmt = Math.round((grossMargin * commPct) / 100);
              const netMargin = Math.max(0, grossMargin - commAmt);

              return (
                <div className="pt-2 border-t border-stone-200/80 space-y-2.5">
                  <div className="flex items-center justify-between text-xs bg-orange-100/60 p-2 rounded-xl border border-orange-200">
                    <span className="font-bold text-orange-950">Applicable Budget Slab:</span>
                    <span className="font-black text-orange-800 bg-white px-2 py-0.5 rounded-md shadow-2xs">
                      {matchedSlab ? (matchedSlab.slabName || `₹${matchedSlab.minBudget.toLocaleString("en-IN")} – ${matchedSlab.maxBudget ? `₹${matchedSlab.maxBudget.toLocaleString("en-IN")}` : "+"}`) : "Default Slab"}
                    </span>
                  </div>

                  {isAdmin ? (
                    /* 👑 ADMIN FULL FINANCIAL BREAKDOWN */
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2 rounded-xl bg-white border border-stone-200">
                        <span className="block text-[10px] text-stone-400 font-bold uppercase">Owner Margin ({marginPct}%)</span>
                        <span className="font-black text-emerald-700">₹{grossMargin.toLocaleString("en-IN")}</span>
                      </div>

                      <div className="p-2 rounded-xl bg-white border border-stone-200">
                        <span className="block text-[10px] text-stone-400 font-bold uppercase">Artist Payout</span>
                        <span className="font-black text-stone-800">₹{safeArtist.toLocaleString("en-IN")}</span>
                      </div>

                      <div className="p-2 rounded-xl bg-white border border-stone-200">
                        <span className="block text-[10px] text-blue-500 font-bold uppercase">Telecaller Comm ({commPct}%)</span>
                        <span className="font-black text-blue-700">₹{commAmt.toLocaleString("en-IN")}</span>
                      </div>

                      <div className="p-2 rounded-xl bg-white border border-stone-200">
                        <span className="block text-[10px] text-stone-500 font-bold uppercase">Owner Net Margin</span>
                        <span className="font-black text-stone-900">₹{netMargin.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  ) : (
                    /* 📞 TELECALLER VISIBILITY: ONLY YOUR COMMISSION (NO GROSS OR NET MARGIN SHOWN) */
                    <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <span className="text-blue-900 font-bold block flex items-center gap-1">
                          📞 तुमचे कमिशन (Your Commission)
                        </span>
                        <span className="text-[10px] text-blue-600">
                          (डील्स यशस्वीरीत्या पूर्ण झाल्यावर मिळणारे कमिशन)
                        </span>
                      </div>
                      <span className="text-base font-black text-blue-800 bg-white px-3 py-1 rounded-lg border border-blue-200 shadow-2xs">
                        ₹{commAmt.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Sound & Technical Requirements */}
          <div>
            <Label className="text-xs font-bold text-stone-800 flex items-center gap-1">
              <Volume2 className="h-3.5 w-3.5 text-orange-500" /> Sound System Setup
            </Label>
            <Select value={soundRequired} onValueChange={setSoundRequired}>
              <SelectTrigger className="h-9 text-xs rounded-xl mt-1 bg-white border-stone-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white text-xs">
                <SelectItem value="venue_provided">Venue / Customer will provide Sound & Mics</SelectItem>
                <SelectItem value="artist_bring">Artist must bring own Sound & Mic Setup</SelectItem>
                <SelectItem value="not_needed">Acoustic / No Sound System Needed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Telecaller Verified Remarks */}
          <div>
            <Label className="text-xs font-bold text-stone-800">Telecaller Verified Notes / Specifics</Label>
            <Textarea
              value={telecallerNotes}
              onChange={(e) => setTelecallerNotes(e.target.value)}
              placeholder="e.g. Customer wants 2 hours performance. Needs traditional bhajans. Advance payment ready."
              className="text-xs rounded-xl mt-1 bg-white min-h-[60px]"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 text-xs font-bold rounded-xl border-stone-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-9 px-5 text-xs font-black rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Save & Verify Lead
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
