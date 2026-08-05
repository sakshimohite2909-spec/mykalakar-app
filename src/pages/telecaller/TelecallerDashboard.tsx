import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  PhoneCall,
  PlusCircle,
  Search,
  CheckCircle2,
  Clock,
  UserCheck,
  Phone,
  MessageSquare,
  Calendar,
  MapPin,
  IndianRupee,
  Sparkles,
  Filter,
  Check,
  XCircle,
  Loader2,
  BadgeCheck,
  Users,
  Star,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  fetchTelecallerLeads,
  subscribeTelecallerLeads,
  updateLeadStatus,
  logArtistCall,
  type TelecallerLead,
  type LeadStatus,
  type ArtistCallOutcome,
  type MatchedArtistCall,
} from "@/services/telecallerService";
import ManualLeadModal from "./ManualLeadModal";
import { MAIN_EVENT_CARDS } from "@/constants/artistSystem";
import { subscribeActiveArtists } from "@/services/dataService";
import { toast } from "@/hooks/use-toast";

export default function TelecallerDashboard() {
  const location = useLocation();

  // Tab detection based on route path
  const isLeadsTab = location.pathname.endsWith("/leads");
  const isArtistsTab = location.pathname.endsWith("/artists");
  const isDashboardTab = !isLeadsTab && !isArtistsTab;

  const [leads, setLeads] = useState<TelecallerLead[]>([]);
  const [activeArtists, setActiveArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLead, setActiveLead] = useState<TelecallerLead | null>(null);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [artistCategoryFilter, setArtistCategoryFilter] = useState<string>("all");

  // Call logger form state for selected artist
  const [selectedArtistForCall, setSelectedArtistForCall] = useState<any>(null);
  const [callOutcome, setCallOutcome] = useState<ArtistCallOutcome>("agreed");
  const [quotedPrice, setQuotedPrice] = useState<number>(15000);
  const [callNotes, setCallNotes] = useState<string>("");
  const [savingCall, setSavingCall] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsubLeads = subscribeTelecallerLeads((data) => {
      setLeads(data);
      setLoading(false);
      setActiveLead((prev) => {
        if (!prev && data.length > 0) return data[0];
        if (prev) {
          const updatedCurrent = data.find((l) => l.id === prev.id);
          return updatedCurrent || (data.length > 0 ? data[0] : null);
        }
        return null;
      });
    });

    const unsubArtists = subscribeActiveArtists(50, (data) => {
      setActiveArtists(data as any[]);
    });

    return () => {
      unsubLeads();
      unsubArtists();
    };
  }, []);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        !searchQuery ||
        lead.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.customerPhone.includes(searchQuery) ||
        lead.subCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.eventType.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leads, searchQuery, statusFilter]);

  // Matching artists for active lead from real active artists list
  const matchingArtists = useMemo(() => {
    if (!activeLead) return activeArtists.slice(0, 5);

    const targetSubCategory = activeLead.subCategory.toLowerCase();
    const targetCategory = activeLead.category.toLowerCase();

    return activeArtists.filter((artist) => {
      const sub = (artist.subcategory || artist.artForm || "").toLowerCase();
      const cat = (artist.category || "").toLowerCase();
      return sub.includes(targetSubCategory) || cat.includes(targetCategory) || targetSubCategory.includes(sub);
    });
  }, [activeLead, activeArtists]);

  // Artist Directory Filtered
  const filteredArtistDirectory = useMemo(() => {
    return activeArtists.filter((artist) => {
      const nameStr = (artist.name || artist.displayName || "").toLowerCase();
      const subStr = (artist.subcategory || artist.artForm || "").toLowerCase();
      const catStr = (artist.category || "").toLowerCase();
      const distStr = (artist.district || artist.location || "").toLowerCase();

      const matchesSearch =
        !searchQuery ||
        nameStr.includes(searchQuery.toLowerCase()) ||
        subStr.includes(searchQuery.toLowerCase()) ||
        catStr.includes(searchQuery.toLowerCase()) ||
        distStr.includes(searchQuery.toLowerCase());

      const matchesCategory =
        artistCategoryFilter === "all" ||
        catStr === artistCategoryFilter.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [activeArtists, searchQuery, artistCategoryFilter]);

  const handleLogArtistCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLead || !selectedArtistForCall) return;

    setSavingCall(true);
    try {
      const artistCallRecord: MatchedArtistCall = {
        artistId: selectedArtistForCall.name.replace(/\s+/g, "_").toLowerCase(),
        artistName: selectedArtistForCall.name,
        artistPhone: selectedArtistForCall.phone || selectedArtistForCall.contactNumber || "+91 9876543210",
        category: selectedArtistForCall.category,
        subCategory: selectedArtistForCall.subcategory,
        callOutcome,
        quotedPrice,
        callNotes,
      };

      const updatedMatched = await logArtistCall(
        activeLead.id,
        artistCallRecord,
        activeLead.matchedArtists || []
      );

      const nextStatus: LeadStatus = callOutcome === "agreed" ? "artist_confirmed" : activeLead.status;
      await updateLeadStatus(
        activeLead.id,
        nextStatus,
        callOutcome === "agreed"
          ? {
              artistId: artistCallRecord.artistId,
              artistName: artistCallRecord.artistName,
              price: quotedPrice,
            }
          : undefined
      );

      const updatedLead = {
        ...activeLead,
        matchedArtists: updatedMatched,
        status: nextStatus,
        confirmedArtistName: callOutcome === "agreed" ? artistCallRecord.artistName : activeLead.confirmedArtistName,
      };

      setActiveLead(updatedLead);
      setLeads((prev) => prev.map((l) => (l.id === updatedLead.id ? updatedLead : l)));

      toast({
        title: "Call Outcome Saved!",
        description: `Logged '${callOutcome}' for ${selectedArtistForCall.name}.`,
      });

      setSelectedArtistForCall(null);
      setCallNotes("");
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to log call result." });
    } finally {
      setSavingCall(false);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    try {
      await updateLeadStatus(leadId, newStatus);
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));
      if (activeLead && activeLead.id === leadId) {
        setActiveLead({ ...activeLead, status: newStatus });
      }
      toast({ title: "Status Updated", description: `Lead status changed to ${newStatus}` });
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not update lead status." });
    }
  };

  // Metrics summary
  const metrics = useMemo(() => {
    return {
      total: leads.length,
      newLeads: leads.filter((l) => l.status === "new").length,
      confirmed: leads.filter((l) => l.status === "artist_confirmed" || l.status === "booked").length,
      inProgress: leads.filter((l) => l.status === "contacting_artists").length,
    };
  }, [leads]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-stone-900 flex items-center gap-2">
            <PhoneCall className="h-6 w-6 text-orange-600" />
            {isArtistsTab
              ? "Artist Search Directory"
              : isLeadsTab
              ? "Phone Inquiries & Leads"
              : "Telecaller Workbench"}
          </h1>
          <p className="text-xs text-stone-500 font-semibold mt-1">
            {isArtistsTab
              ? "Directly search verified artists, view contact numbers, and confirm dates."
              : isLeadsTab
              ? "Track incoming phone leads, customer budgets, and deal statuses."
              : "Manage customer phone inquiries, call artists for availability, and confirm event deals."}
          </p>
        </div>

        <Button
          onClick={() => setManualModalOpen(true)}
          className="rounded-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs shadow-md px-5 py-2.5 flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Log Incoming Phone Call
        </Button>
      </div>

      {/* VIEW 1: DASHBOARD WORKBENCH */}
      {isDashboardTab && (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-white border border-stone-200/80 p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Total Leads</p>
              <p className="text-2xl font-black text-stone-950 mt-1">{metrics.total}</p>
            </div>
            <div className="rounded-2xl bg-amber-50/80 border border-amber-200/80 p-4 shadow-sm">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700">New Inquiries</p>
              <p className="text-2xl font-black text-amber-700 mt-1">{metrics.newLeads}</p>
            </div>
            <div className="rounded-2xl bg-sky-50/80 border border-sky-200/80 p-4 shadow-sm">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-sky-700">In Progress</p>
              <p className="text-2xl font-black text-sky-700 mt-1">{metrics.inProgress}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50/80 border border-emerald-200/80 p-4 shadow-sm">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">Confirmed Deals</p>
              <p className="text-2xl font-black text-emerald-700 mt-1">{metrics.confirmed}</p>
            </div>
          </div>

          {/* Main 2-Column Workbench */}
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
            {/* Left Column: Leads Feed */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  <Input
                    placeholder="Search leads..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-xs rounded-xl bg-white border-stone-200 text-stone-900"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-28 h-9 text-xs rounded-xl bg-white border-stone-200 text-stone-700 font-bold">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-stone-200 text-stone-900 text-xs">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacting_artists">Calling Artists</SelectItem>
                    <SelectItem value="artist_confirmed">Confirmed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-white border border-stone-200 text-stone-500 text-xs shadow-sm">
                  No leads found. Click <strong>Log Incoming Phone Call</strong> to add one.
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {filteredLeads.map((lead) => {
                    const isSelected = activeLead?.id === lead.id;
                    return (
                      <div
                        key={lead.id}
                        onClick={() => setActiveLead(lead)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-orange-50/90 border-orange-400 shadow-md"
                            : "bg-white border-stone-200/80 hover:border-orange-300 hover:bg-stone-50/50 shadow-sm"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-stone-900">{lead.customerName}</span>
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              lead.status === "new"
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : lead.status === "artist_confirmed"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-sky-100 text-sky-800 border border-sky-200"
                            }`}
                          >
                            {lead.status.replace("_", " ")}
                          </span>
                        </div>

                        <div className="mt-2 text-xs text-stone-600 space-y-1">
                          <p className="flex items-center gap-1.5 font-bold text-stone-800">
                            <Sparkles className="h-3 w-3 text-orange-600" />
                            {lead.eventType} • {lead.subCategory}
                          </p>
                          <p className="flex items-center gap-1.5 text-stone-500">
                            <Calendar className="h-3 w-3 text-stone-400" />
                            Date: {lead.eventDate} ({lead.eventLocation})
                          </p>
                          <p className="flex items-center gap-1.5 font-extrabold text-orange-600">
                            <IndianRupee className="h-3 w-3" />
                            Budget: ₹{lead.budget?.toLocaleString("en-IN") || "N/A"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Lead Workbench & Matching Artists */}
            {activeLead ? (
              <div className="space-y-6">
                {/* Selected Lead Details Banner */}
                <div className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                    <div>
                      <h2 className="text-lg font-extrabold text-stone-950 flex items-center gap-2">
                        {activeLead.customerName}
                        {activeLead.confirmedArtistName && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <BadgeCheck className="h-3.5 w-3.5" /> Booked with {activeLead.confirmedArtistName}
                          </span>
                        )}
                      </h2>
                      <p className="text-xs text-stone-500 flex items-center gap-3 mt-1 font-medium">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 text-orange-600" />
                          <a href={`tel:${activeLead.customerPhone}`} className="hover:underline font-bold text-orange-600">
                            {activeLead.customerPhone}
                          </a>
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-stone-400" /> {activeLead.eventLocation}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Select
                        value={activeLead.status}
                        onValueChange={(val: LeadStatus) => handleStatusChange(activeLead.id, val)}
                      >
                        <SelectTrigger className="w-40 h-9 text-xs rounded-xl bg-stone-50 border-stone-200 text-stone-900 font-bold">
                          <SelectValue placeholder="Update Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-stone-200 text-stone-900 text-xs">
                          <SelectItem value="new">New Lead</SelectItem>
                          <SelectItem value="contacting_artists">Calling Artists</SelectItem>
                          <SelectItem value="artist_confirmed">Artist Confirmed</SelectItem>
                          <SelectItem value="quote_sent">Quote Sent</SelectItem>
                          <SelectItem value="booked">Booked</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Requirement Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-stone-50 p-3.5 rounded-xl border border-stone-200/60">
                    <div>
                      <span className="text-stone-500 font-bold block">Event & Artform:</span>
                      <span className="text-stone-950 font-extrabold">{activeLead.eventType} - {activeLead.subCategory}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 font-bold block">Target Event Date:</span>
                      <span className="text-orange-600 font-extrabold">{activeLead.eventDate}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 font-bold block">Max Budget:</span>
                      <span className="text-emerald-700 font-extrabold">₹{activeLead.budget?.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  {activeLead.specialNotes && (
                    <p className="text-xs text-stone-700 italic bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                      "{activeLead.specialNotes}"
                    </p>
                  )}
                </div>

                {/* Matching Artists Calling Table */}
                <div className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-sm space-y-4">
                  <h3 className="text-sm font-extrabold text-stone-950 flex items-center gap-2">
                    <Users className="h-4 w-4 text-orange-600" />
                    Matching Available Artists ({matchingArtists.length})
                  </h3>

                  <div className="space-y-3">
                    {matchingArtists.map((artist) => {
                      const phoneNum = artist.phone || artist.contactNumber || "+91 98765 43210";
                      const existingCall = activeLead.matchedArtists?.find(
                        (item) => item.artistName.toLowerCase() === artist.name.toLowerCase()
                      );

                      return (
                        <div
                          key={artist.name}
                          className="p-4 rounded-xl bg-stone-50/70 border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-extrabold text-stone-950">{artist.name}</h4>
                              <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full border border-orange-200">
                                {artist.subcategory}
                              </span>
                              {existingCall && (
                                <span
                                  className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                    existingCall.callOutcome === "agreed"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  Status: {existingCall.callOutcome}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-stone-500 mt-1 flex items-center gap-2 font-medium">
                              <span>📍 {artist.district}, {artist.state}</span>
                              <span>• 🌟 {artist.rating} ({artist.reviews} reviews)</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <a
                              href={`tel:${phoneNum}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-800 hover:bg-stone-100 transition shadow-sm"
                            >
                              <Phone className="h-3.5 w-3.5 text-orange-600" />
                              Call {phoneNum}
                            </a>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedArtistForCall(artist);
                                setQuotedPrice(activeLead.budget || 15000);
                              }}
                              className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-3 py-1.5"
                            >
                              Log Call Result
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Modal / Logger Popup for selected artist call */}
                {selectedArtistForCall && (
                  <form onSubmit={handleLogArtistCall} className="p-5 rounded-2xl bg-orange-50/60 border border-orange-200 space-y-4 shadow-md">
                    <h4 className="text-xs font-extrabold text-stone-950 flex items-center gap-2">
                      <PhoneCall className="h-4 w-4 text-orange-600" />
                      Log Call Outcome for {selectedArtistForCall.name}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-stone-700 block mb-1">Call Response Outcome</label>
                        <Select value={callOutcome} onValueChange={(val: ArtistCallOutcome) => setCallOutcome(val)}>
                          <SelectTrigger className="rounded-xl bg-white border-stone-200 text-stone-900 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-stone-200 text-stone-900 text-xs">
                            <SelectItem value="agreed">🟢 Available & Agreed</SelectItem>
                            <SelectItem value="busy_booked">🔴 Busy / Date Booked</SelectItem>
                            <SelectItem value="no_answer">🟠 No Answer / Not Reachable</SelectItem>
                            <SelectItem value="price_too_high">🟡 Quoted Higher Rate</SelectItem>
                            <SelectItem value="rejected">❌ Declined Request</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-stone-700 block mb-1">Artist Quoted Price (₹)</label>
                        <Input
                          type="number"
                          value={quotedPrice}
                          onChange={(e) => setQuotedPrice(Number(e.target.value))}
                          className="rounded-xl bg-white border-stone-200 text-stone-900 text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-stone-700 block mb-1">Call Notes / Remarks</label>
                      <Textarea
                        placeholder="e.g. Artist confirmed availability for Aug 20 morning slot. Requested ₹18,000 including travel."
                        value={callNotes}
                        onChange={(e) => setCallNotes(e.target.value)}
                        rows={2}
                        className="rounded-xl bg-white border-stone-200 text-stone-900 text-xs"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedArtistForCall(null)}
                        className="text-xs text-stone-600 font-bold"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={savingCall}
                        size="sm"
                        className="rounded-full bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold px-5"
                      >
                        {savingCall ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save Call Outcome"}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl bg-white border border-stone-200 text-stone-500 shadow-sm">
                Select a lead from the left feed to start calling artists.
              </div>
            )}
          </div>
        </>
      )}

      {/* VIEW 2: PHONE INQUIRIES & LEADS TAB */}
      {isLeadsTab && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
              <Input
                placeholder="Search leads by customer name, phone, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 text-xs rounded-xl bg-white border-stone-200 text-stone-900"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44 h-10 text-xs rounded-xl bg-white border-stone-200 text-stone-900 font-bold">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-stone-200 text-stone-900 text-xs">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New Lead</SelectItem>
                <SelectItem value="contacting_artists">Calling Artists</SelectItem>
                <SelectItem value="artist_confirmed">Artist Confirmed</SelectItem>
                <SelectItem value="booked">Booked</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                className="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-stone-950">{lead.customerName}</h3>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                        lead.status === "new"
                          ? "bg-amber-100 text-amber-800"
                          : lead.status === "artist_confirmed"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-sky-100 text-sky-800"
                      }`}
                    >
                      {lead.status.replace("_", " ")}
                    </span>
                    <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                      Via {lead.source === "manual_phone_call" ? "Phone Call" : "Website Inquiry"}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 flex flex-wrap items-center gap-3">
                    <span className="font-bold text-orange-600 flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      <a href={`tel:${lead.customerPhone}`}>{lead.customerPhone}</a>
                    </span>
                    <span>📍 Location: {lead.eventLocation}</span>
                    <span>📅 Event Date: {lead.eventDate}</span>
                  </p>

                  <p className="text-xs font-bold text-stone-800">
                    Category: <span className="text-orange-600">{lead.eventType} ({lead.subCategory})</span> • Budget: ₹{lead.budget?.toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`tel:${lead.customerPhone}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-50 border border-orange-200 text-xs font-bold text-orange-600 hover:bg-orange-100 transition"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Call Customer
                  </a>
                  <Select
                    value={lead.status}
                    onValueChange={(val: LeadStatus) => handleStatusChange(lead.id, val)}
                  >
                    <SelectTrigger className="w-36 h-9 text-xs rounded-xl bg-stone-50 border-stone-200 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-stone-200 text-xs">
                      <SelectItem value="new">New Lead</SelectItem>
                      <SelectItem value="contacting_artists">Calling Artists</SelectItem>
                      <SelectItem value="artist_confirmed">Confirmed</SelectItem>
                      <SelectItem value="booked">Booked</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: ARTIST SEARCH DIRECTORY TAB */}
      {isArtistsTab && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
              <Input
                placeholder="Search artists by name, artform, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 text-xs rounded-xl bg-white border-stone-200 text-stone-900"
              />
            </div>
            <Select value={artistCategoryFilter} onValueChange={setArtistCategoryFilter}>
              <SelectTrigger className="w-48 h-10 text-xs rounded-xl bg-white border-stone-200 text-stone-900 font-bold">
                <SelectValue placeholder="Category Filter" />
              </SelectTrigger>
              <SelectContent className="bg-white border-stone-200 text-stone-900 text-xs">
                <SelectItem value="all">All Categories</SelectItem>
                {MAIN_EVENT_CARDS.map((card) => (
                  <SelectItem key={card.name} value={card.name}>
                    {card.icon} {card.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Artist Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredArtistDirectory.map((artist) => {
              const phoneNum = artist.phone || artist.contactNumber || "+91 98765 43210";
              const priceDisplay = artist.startingPrice ? `₹${artist.startingPrice?.toLocaleString("en-IN")}+` : "Price on Request";

              return (
                <div key={artist.name} className="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-sm flex flex-col justify-between space-y-4 hover:border-orange-300 transition">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-black text-stone-950">{artist.name}</h3>
                        <span className="inline-block mt-1 text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                          {artist.subcategory}
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-xs font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                        {artist.rating}
                      </span>
                    </div>

                    <p className="text-xs text-stone-500 font-medium">
                      📍 {artist.district}, {artist.state} • {artist.category}
                    </p>

                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                      {artist.bio || "Verified performing artist on MyKalakar marketplace."}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-stone-400 block uppercase">Starting Price</span>
                      <span className="text-sm font-black text-stone-950">{priceDisplay}</span>
                    </div>

                    <a
                      href={`tel:${phoneNum}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-extrabold hover:bg-orange-700 transition shadow-sm"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      Call {phoneNum}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Manual Phone Lead Modal */}
      <ManualLeadModal
        open={manualModalOpen}
        onOpenChange={setManualModalOpen}
        onLeadCreated={(newLead) => {
          setLeads((prev) => [newLead, ...prev]);
          setActiveLead(newLead);
        }}
      />
    </div>
  );
}
