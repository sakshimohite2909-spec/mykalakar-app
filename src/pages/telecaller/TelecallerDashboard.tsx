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
  FileText,
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
  const [leadTypeFilter, setLeadTypeFilter] = useState<"all" | "book_artist" | "post_requirement">("all");
  const [mobileTab, setMobileTab] = useState<"leads" | "workbench">("leads");

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
        (lead.requestedArtistName && lead.requestedArtistName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        lead.subCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.eventType.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
      const matchesType = leadTypeFilter === "all" || lead.leadType === leadTypeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [leads, searchQuery, statusFilter, leadTypeFilter]);

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
    const cleanTargetId = leadId.replace(/^(booking_|brief_|lead_|inquiry_)/, "");
    
    // 1. Optimistic immediate state update in React UI
    setLeads((prev) =>
      prev.map((l) => {
        const lCleanId = l.id.replace(/^(booking_|brief_|lead_|inquiry_)/, "");
        return l.id === leadId || lCleanId === cleanTargetId ? { ...l, status: newStatus } : l;
      })
    );
    if (activeLead && (activeLead.id === leadId || activeLead.id.replace(/^(booking_|brief_|lead_|inquiry_)/, "") === cleanTargetId)) {
      setActiveLead({ ...activeLead, status: newStatus });
    }

    try {
      // 2. Persist to Firestore and Local Storage
      await updateLeadStatus(leadId, newStatus);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200/60 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-stone-900 flex items-center gap-2">
            <PhoneCall className="h-6 w-6 text-orange-600" />
            Telecaller Workbench
          </h1>
          <p className="text-xs text-stone-600 font-bold mt-1 flex flex-wrap items-center gap-2">
            <span>Good Morning 👋</span>
            <span className="text-stone-300">•</span>
            <span className="bg-stone-100 text-stone-800 px-3 py-1 rounded-full text-[11px] font-extrabold border border-stone-200">
              {metrics.total} Total Leads | {metrics.newLeads} New | {metrics.inProgress} In Progress | {metrics.confirmed} Confirmed
            </span>
          </p>
        </div>

        <Button
          onClick={() => setManualModalOpen(true)}
          className="rounded-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs shadow-md px-5 py-2.5 flex items-center gap-2 self-start sm:self-auto"
        >
          <PlusCircle className="h-4 w-4" />
          ＋ Log Incoming Call
        </Button>
      </div>

      {/* VIEW 1: DASHBOARD WORKBENCH */}
      {isDashboardTab && (
        <>
          {/* Mobile 2-Tab Segment Switcher (Hidden on Desktop lg:) */}
          <div className="flex lg:hidden items-center gap-2 p-1 bg-stone-200/90 rounded-2xl mb-3 shadow-inner">
            <button
              onClick={() => setMobileTab("leads")}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                mobileTab === "leads"
                  ? "bg-white text-stone-950 shadow-md"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <FileText className="h-4 w-4 text-orange-600" /> Leads List ({filteredLeads.length})
            </button>
            <button
              onClick={() => setMobileTab("workbench")}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                mobileTab === "workbench"
                  ? "bg-orange-600 text-white shadow-md"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <PhoneCall className="h-4 w-4" /> Call Workbench
            </button>
          </div>

          {/* Main 2-Column Workbench */}
          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] xl:grid-cols-[390px_1fr] gap-5 sm:gap-6">
            {/* Left Column: Leads Feed */}
            <div className={`space-y-4 ${mobileTab === "leads" ? "block" : "hidden lg:block"}`}>
              {/* Filter Tabs - Horizontal Scrollable on Mobile */}
              <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl overflow-x-auto no-scrollbar whitespace-nowrap">
                <button
                  onClick={() => {
                    setLeadTypeFilter("all");
                    setStatusFilter("all");
                  }}
                  className={`py-1.5 px-3 rounded-lg text-[11px] font-extrabold transition-all shrink-0 ${
                    leadTypeFilter === "all" && statusFilter === "all"
                      ? "bg-white text-stone-900 shadow-sm"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  All ({leads.length})
                </button>
                <button
                  onClick={() => setStatusFilter("new")}
                  className={`py-1.5 px-3 rounded-lg text-[11px] font-extrabold transition-all shrink-0 ${
                    statusFilter === "new"
                      ? "bg-amber-500 text-white shadow-sm"
                      : "text-amber-700 hover:bg-amber-100/60"
                  }`}
                >
                  New ({leads.filter((l) => l.status === "new").length})
                </button>
                <button
                  onClick={() => {
                    setLeadTypeFilter("book_artist");
                    setStatusFilter("all");
                  }}
                  className={`py-1.5 px-3 rounded-lg text-[11px] font-extrabold transition-all shrink-0 flex items-center gap-1 ${
                    leadTypeFilter === "book_artist"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-purple-700 hover:bg-purple-100/60"
                  }`}
                >
                  <UserCheck className="h-3 w-3" /> Booking ({leads.filter((l) => l.leadType === "book_artist").length})
                </button>
                <button
                  onClick={() => {
                    setLeadTypeFilter("post_requirement");
                    setStatusFilter("all");
                  }}
                  className={`py-1.5 px-3 rounded-lg text-[11px] font-extrabold transition-all shrink-0 flex items-center gap-1 ${
                    leadTypeFilter === "post_requirement"
                      ? "bg-amber-600 text-white shadow-sm"
                      : "text-amber-700 hover:bg-amber-100/60"
                  }`}
                >
                  <FileText className="h-3 w-3" /> Requirement ({leads.filter((l) => l.leadType === "post_requirement").length})
                </button>
              </div>

              {/* Search Bar */}
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
                {(statusFilter !== "all" || leadTypeFilter !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStatusFilter("all");
                      setLeadTypeFilter("all");
                    }}
                    className="h-9 px-2 text-xs font-bold text-stone-500 hover:text-stone-900 shrink-0"
                  >
                    Reset
                  </Button>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-white border border-stone-200 text-stone-500 text-xs shadow-sm">
                  No leads found. Click <strong>＋ Log Incoming Call</strong> to add one.
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] lg:max-h-[650px] overflow-y-auto pr-1">
                  {filteredLeads.map((lead) => {
                    const isSelected = activeLead?.id === lead.id;
                    const isBookArtist = lead.leadType === "book_artist";
                    return (
                      <div
                        key={lead.id}
                        onClick={() => {
                          setActiveLead(lead);
                          setMobileTab("workbench");
                        }}
                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-orange-50/90 border-orange-400 shadow-md ring-2 ring-orange-200"
                            : "bg-white border-stone-200/80 hover:border-orange-300 hover:bg-stone-50/50 shadow-sm"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border shrink-0 ${
                              lead.status === "new"
                                ? "bg-amber-100 text-amber-900 border-amber-300"
                                : lead.status === "artist_confirmed" || lead.status === "booked"
                                ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                                : "bg-sky-100 text-sky-900 border-sky-300"
                            }`}
                          >
                            {lead.status.replace("_", " ")}
                          </span>
                          {isBookArtist ? (
                            <span className="text-[10px] font-extrabold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200 truncate">
                              🎯 Book Artist
                            </span>
                          ) : (
                            <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200 truncate">
                              📋 Requirement
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-black text-stone-900 mt-2 truncate">{lead.customerName || "Customer"}</h4>

                        <p className="flex items-center gap-1.5 text-xs font-extrabold text-stone-800 mt-1 truncate">
                          <Sparkles className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                          <span className="truncate">{lead.eventType} • {lead.subCategory}</span>
                        </p>

                        <p className="flex items-center gap-1.5 text-xs text-stone-500 font-semibold mt-1 flex-wrap">
                          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-stone-400 shrink-0" /> {lead.eventDate || "Date TBD"}</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0 ml-1" /> {lead.eventLocation || "Location"}</span>
                        </p>

                        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-stone-100">
                          <span className="text-xs font-black text-emerald-700 flex items-center gap-1">
                            <IndianRupee className="h-3.5 w-3.5 shrink-0" /> Budget: ₹{lead.budget?.toLocaleString("en-IN") || "N/A"}
                          </span>
                          <span className="text-xs font-black text-orange-600 flex items-center gap-1 hover:underline shrink-0">
                            View Details →
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Lead Workbench & Matching Artists */}
            <div className={`space-y-4 sm:space-y-6 ${mobileTab === "workbench" ? "block" : "hidden lg:block"}`}>
              {/* Mobile Back Button */}
              <button
                onClick={() => setMobileTab("leads")}
                className="lg:hidden inline-flex items-center gap-1.5 text-xs font-black text-orange-700 hover:text-orange-800 bg-orange-50 px-4 py-2.5 rounded-xl border border-orange-200 mb-1 w-full justify-center shadow-sm"
              >
                ← Back to Leads List
              </button>

              {activeLead ? (
                <>
                  {/* Step Tracker Progress Bar - 2x2 Grid on Mobile, 4-col on Desktop */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-stone-200/80 shadow-sm">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-extrabold text-stone-500">
                      <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200 justify-center sm:justify-start">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> 1. Requirement
                      </span>
                      <span className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border justify-center sm:justify-start ${
                        activeLead.status !== "new"
                          ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                          : "text-stone-400 bg-stone-50 border-stone-200"
                      }`}>
                        {activeLead.status !== "new" ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <Clock className="h-3.5 w-3.5 shrink-0" />} 2. Customer Called
                      </span>
                      <span className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border justify-center sm:justify-start ${
                        activeLead.status === "contacting_artists" || activeLead.status === "artist_confirmed" || activeLead.status === "booked"
                          ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                          : "text-stone-400 bg-stone-50 border-stone-200"
                      }`}>
                        {activeLead.status === "contacting_artists" || activeLead.status === "artist_confirmed" || activeLead.status === "booked" ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <Clock className="h-3.5 w-3.5 shrink-0" />} 3. Artists Contacted
                      </span>
                      <span className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border justify-center sm:justify-start ${
                        activeLead.status === "artist_confirmed" || activeLead.status === "booked"
                          ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                          : "text-stone-400 bg-stone-50 border-stone-200"
                      }`}>
                        {activeLead.status === "artist_confirmed" || activeLead.status === "booked" ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <Clock className="h-3.5 w-3.5 shrink-0" />} 4. Confirmed
                      </span>
                    </div>
                  </div>

                  {/* Step 1: Customer Requirement Card */}
                  <div className="p-4 sm:p-6 rounded-2xl bg-white border border-stone-200/80 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                      <div>
                        <h2 className="text-base sm:text-lg font-black text-stone-950 flex flex-wrap items-center gap-2">
                          Customer Requirement
                          {activeLead.leadType === "book_artist" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-extrabold bg-purple-100 text-purple-900 border border-purple-300">
                              <UserCheck className="h-3.5 w-3.5 text-purple-700" /> Requested: {activeLead.requestedArtistName || "Artist"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                              <FileText className="h-3.5 w-3.5 text-amber-700" /> Requirement
                            </span>
                          )}
                        </h2>
                        <p className="text-xs text-stone-500 font-semibold mt-1">
                          Customer: <strong className="text-stone-900">{activeLead.customerName || "Customer"}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Select
                          value={activeLead.status}
                          onValueChange={(val: LeadStatus) => handleStatusChange(activeLead.id, val)}
                        >
                          <SelectTrigger className="w-full sm:w-44 h-9 text-xs rounded-xl bg-stone-50 border-stone-200 text-stone-900 font-bold">
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

                    {/* Requirement Summary Box */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-stone-50 p-3.5 sm:p-4 rounded-xl border border-stone-200/60">
                      <div>
                        <span className="text-stone-500 font-bold block text-[11px]">Event & Artform:</span>
                        <span className="text-stone-950 font-black text-xs sm:text-sm">{activeLead.eventType} - {activeLead.subCategory}</span>
                      </div>
                      <div>
                        <span className="text-stone-500 font-bold block text-[11px]">Target Event Date:</span>
                        <span className="text-orange-600 font-black text-xs sm:text-sm">📅 {activeLead.eventDate || "Date TBD"}</span>
                      </div>
                      <div>
                        <span className="text-stone-500 font-bold block text-[11px]">Max Budget:</span>
                        <span className="text-emerald-700 font-black text-xs sm:text-sm">₹{activeLead.budget?.toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    {activeLead.specialNotes && (
                      <p className="text-xs text-stone-700 italic bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                        "{activeLead.specialNotes}"
                      </p>
                    )}

                    {/* Customer Call Action Button */}
                    <div className="pt-1">
                      {activeLead.customerPhone ? (
                        <a
                          href={`tel:${activeLead.customerPhone}`}
                          onClick={() => handleStatusChange(activeLead.id, "contacting_artists")}
                          className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-[0.99]"
                        >
                          <Phone className="h-4 w-4" /> Call Customer ({activeLead.customerPhone})
                        </a>
                      ) : (
                        <p className="text-xs text-stone-500 italic">No phone number provided for customer.</p>
                      )}
                    </div>
                  </div>

                  {/* Step 2: Recommended Matching Artists */}
                  <div className="p-4 sm:p-6 rounded-2xl bg-white border border-stone-200/80 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-stone-100 pb-3">
                      <h3 className="text-sm font-black text-stone-950 flex items-center gap-2 leading-tight">
                        <Users className="h-4 w-4 text-orange-600 shrink-0" />
                        <span>Recommended Artists ({matchingArtists.length})</span>
                      </h3>
                      <span className="text-[11px] font-semibold text-stone-500">
                        Matched by Location + Category + Date
                      </span>
                    </div>

                    <div className="space-y-3">
                      {matchingArtists.map((artist) => {
                        const phoneNum = artist.phone || artist.contactNumber || "+91 98765 43210";
                        const existingCall = activeLead.matchedArtists?.find(
                          (item) => item.artistName.toLowerCase() === artist.name.toLowerCase()
                        );

                        return (
                          <div
                            key={artist.name}
                            className="p-3.5 sm:p-4 rounded-2xl bg-stone-50/70 border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-black text-sm sm:text-base border border-orange-200 shrink-0">
                                {artist.name.charAt(0)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-xs sm:text-sm font-black text-stone-950">{artist.name}</h4>
                                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-0.5">
                                    <Star className="h-3 w-3 fill-amber-500 text-amber-500 shrink-0" /> {artist.rating || 4.8}
                                  </span>
                                  {existingCall && (
                                    <span
                                      className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                        existingCall.callOutcome === "agreed"
                                          ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                          : existingCall.callOutcome === "busy_booked"
                                          ? "bg-red-100 text-red-900 border border-red-300"
                                          : "bg-amber-100 text-amber-900 border border-amber-300"
                                      }`}
                                    >
                                      {existingCall.callOutcome === "agreed"
                                        ? "🟢 Available"
                                        : existingCall.callOutcome === "busy_booked"
                                        ? "🔴 Not Available"
                                        : "🟡 " + existingCall.callOutcome}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-2 font-semibold flex-wrap">
                                  <span>📍 {artist.district || artist.location || "Location TBD"}</span>
                                  <span>• From ₹{artist.startingPrice?.toLocaleString("en-IN") || "15,000"}</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200/60">
                              <a
                                href={`tel:${phoneNum}`}
                                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-extrabold text-stone-800 hover:bg-stone-100 transition shadow-sm active:scale-95"
                              >
                                <Phone className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                                Call Artist
                              </a>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedArtistForCall(artist);
                                  setQuotedPrice(activeLead.budget || 15000);
                                }}
                                className="flex-1 sm:flex-initial rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold px-3 py-2 sm:py-1.5 active:scale-95"
                              >
                                Log Result
                              </Button>
                              {existingCall?.callOutcome === "agreed" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleStatusChange(activeLead.id, "artist_confirmed")}
                                  className="w-full sm:w-auto rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-3 py-2 sm:py-1.5 active:scale-95"
                                >
                                  🏆 Confirm Artist
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 3: Pop-up Modal / Logger for selected artist call */}
                  {selectedArtistForCall && (
                    <form onSubmit={handleLogArtistCall} className="p-4 sm:p-5 rounded-2xl bg-orange-50/90 border border-orange-300 space-y-4 shadow-lg">
                      <div className="flex items-center justify-between border-b border-orange-200 pb-3">
                        <h4 className="text-xs sm:text-sm font-black text-stone-950 flex items-center gap-2">
                          <PhoneCall className="h-4 w-4 text-orange-600 shrink-0" />
                          Call Result — Artist: {selectedArtistForCall.name}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setSelectedArtistForCall(null)}
                          className="text-stone-400 hover:text-stone-700 text-xs font-bold px-2 py-1"
                        >
                          ✕ Close
                        </button>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-extrabold text-stone-700 block">Select Outcome</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold">
                          <button
                            type="button"
                            onClick={() => setCallOutcome("agreed")}
                            className={`p-3 rounded-xl border transition-all text-left flex items-center gap-2 ${
                              callOutcome === "agreed"
                                ? "bg-emerald-600 text-white border-emerald-600 font-extrabold shadow-sm"
                                : "bg-white text-stone-800 border-stone-200 hover:border-emerald-300"
                            }`}
                          >
                            🟢 Available & Agreed
                          </button>
                          <button
                            type="button"
                            onClick={() => setCallOutcome("busy_booked")}
                            className={`p-3 rounded-xl border transition-all text-left flex items-center gap-2 ${
                              callOutcome === "busy_booked"
                                ? "bg-red-600 text-white border-red-600 font-extrabold shadow-sm"
                                : "bg-white text-stone-800 border-stone-200 hover:border-red-300"
                            }`}
                          >
                            🔴 Not Available / Busy
                          </button>
                          <button
                            type="button"
                            onClick={() => setCallOutcome("price_too_high")}
                            className={`p-3 rounded-xl border transition-all text-left flex items-center gap-2 ${
                              callOutcome === "price_too_high"
                                ? "bg-amber-600 text-white border-amber-600 font-extrabold shadow-sm"
                                : "bg-white text-stone-800 border-stone-200 hover:border-amber-300"
                            }`}
                          >
                            🟡 Price Issue
                          </button>
                          <button
                            type="button"
                            onClick={() => setCallOutcome("no_answer")}
                            className={`p-3 rounded-xl border transition-all text-left flex items-center gap-2 ${
                              callOutcome === "no_answer"
                                ? "bg-stone-700 text-white border-stone-700 font-extrabold shadow-sm"
                                : "bg-white text-stone-800 border-stone-200 hover:border-stone-400"
                            }`}
                          >
                            ⚪ No Response / Unreachable
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-stone-700 block mb-1">Quoted Price (₹)</label>
                          <Input
                            type="number"
                            value={quotedPrice}
                            onChange={(e) => setQuotedPrice(Number(e.target.value))}
                            className="rounded-xl bg-white border-stone-200 text-stone-900 text-xs font-bold h-10"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-stone-700 block mb-1">Notes / Remarks</label>
                          <Textarea
                            placeholder="Enter notes..."
                            value={callNotes}
                            onChange={(e) => setCallNotes(e.target.value)}
                            rows={1}
                            className="rounded-xl bg-white border-stone-200 text-stone-900 text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
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
                          className="rounded-full bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold px-6 h-10"
                        >
                          {savingCall ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save Result"}
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Step 4: Deal Confirmation Screen */}
                  {(activeLead.status === "artist_confirmed" || activeLead.status === "booked" || activeLead.confirmedArtistName) && (
                    <div className="p-5 sm:p-6 rounded-2xl bg-emerald-50/90 border border-emerald-300 space-y-4 shadow-sm text-center">
                      <div className="h-12 w-12 rounded-full bg-emerald-600 text-white mx-auto flex items-center justify-center font-black text-xl shadow-md">
                        ✓
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-emerald-950">Artist Confirmed</h3>
                        <p className="text-xs font-bold text-emerald-800 mt-1">
                          {activeLead.confirmedArtistName || "Selected Artist"} • {activeLead.subCategory}
                        </p>
                      </div>

                      <div className="max-w-md mx-auto bg-white p-4 rounded-xl border border-emerald-200 text-left text-xs space-y-1.5 font-semibold text-stone-800">
                        <p>👤 <strong>Customer:</strong> {activeLead.customerName}</p>
                        <p>🎭 <strong>Event:</strong> {activeLead.eventType} - {activeLead.subCategory}</p>
                        <p>📅 <strong>Date:</strong> {activeLead.eventDate} | 📍 <strong>Location:</strong> {activeLead.eventLocation}</p>
                        <p>💰 <strong>Agreed Amount:</strong> <strong className="text-emerald-700">₹{activeLead.confirmedPrice?.toLocaleString("en-IN") || activeLead.budget?.toLocaleString("en-IN")}</strong></p>
                      </div>

                      <Button
                        onClick={() => handleStatusChange(activeLead.id, "booked")}
                        className="w-full sm:w-auto rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-8 py-3 shadow-md active:scale-95"
                      >
                        Confirm Booking
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-12 text-center rounded-2xl bg-white border border-stone-200 text-stone-500 shadow-sm">
                  Select a lead from the left feed to start calling artists.
                </div>
              )}
            </div>
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
