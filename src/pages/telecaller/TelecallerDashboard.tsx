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
  Edit3,
  MessageCircle,
  ShieldCheck,
  Volume2,
  Copy,
  Film,
  Play,
  RotateCcw,
  Wallet,
  QrCode,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  fetchTelecallerLeads,
  subscribeTelecallerLeads,
  updateLeadStatus,
  deleteLead,
  logArtistCall,
  type TelecallerLead,
  type LeadStatus,
  type ArtistCallOutcome,
  type MatchedArtistCall,
} from "@/services/telecallerService";
import ManualLeadModal from "./ManualLeadModal";
import EditLeadModal from "./EditLeadModal";
import TelecallerQRModal from "./TelecallerQRModal";
import {
  subscribePaymentConfig,
  getLocalPaymentConfig,
  type PaymentConfig,
} from "@/services/paymentSettingsService";
import {
  subscribeCommissionConfig,
  getLocalCommissionConfig,
  calculateCommissionSplit,
  type CommissionConfig,
} from "@/services/commissionSettingsService";
import ArtistReelViewerModal, { type ArtistReelItem } from "@/components/artist/ArtistReelViewerModal";
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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>(getLocalPaymentConfig());
  const [commissionConfig, setCommissionConfig] = useState<CommissionConfig>(getLocalCommissionConfig());
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
  const [leadToDelete, setLeadToDelete] = useState<TelecallerLead | null>(null);
  const [deletingLead, setDeletingLead] = useState(false);

  const confirmDeleteLead = async () => {
    if (!leadToDelete) return;
    setDeletingLead(true);
    try {
      await deleteLead(leadToDelete.id);
      setLeads((prev) => prev.filter((l) => l.id !== leadToDelete.id));
      if (activeLead?.id === leadToDelete.id) {
        setActiveLead(null);
      }
      toast({
        title: "लीड हटवली! 🗑️",
        description: `"${leadToDelete.customerName || "Customer"}" ची लीड यशस्वीरीत्या डिलीट केली.`,
      });
      setLeadToDelete(null);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "लीड डिलीट करता आली नाही. कृपया पुन्हा प्रयत्न करा.",
      });
    } finally {
      setDeletingLead(false);
    }
  };

  const formatLeadCategory = (lead: TelecallerLead): string => {
    const event = String(lead.eventType || "").trim();
    let sub = String(lead.subCategory || "").trim();
    sub = sub.replace(/Artist Booking\s*\([^)]*\)/gi, "").replace(/Artist Booking/gi, "").replace(/\([^)]*\)/g, "").trim();
    
    if (event && sub && event.toLowerCase() !== sub.toLowerCase()) {
      return `${event} • ${sub}`;
    }
    return event || sub || "इव्हेंट";
  };

  const handleWhatsAppArtist = (artist: any) => {
    if (!activeLead) return;
    const phone = (artist.phone || artist.contactNumber || "9876543210").replace(/[^0-9]/g, "");
    const cleanPhone = phone.startsWith("91") && phone.length === 12 ? phone : phone.length === 10 ? `91${phone}` : phone;

    const artistName = artist.name || "कलाकार";
    const offerPrice = (activeLead.artistOfferBudget || Math.round((activeLead.budget || 15000) * 0.8)).toLocaleString("en-IN");
    const categoryText = formatLeadCategory(activeLead);
    const dateText = activeLead.eventDate || "तारीख चर्चाधीन";
    const timeText = activeLead.eventTime || "सायं. ०६:०० ते ०९:००";
    const locText = `${activeLead.venueAddress ? `${activeLead.venueAddress}, ` : ""}${activeLead.eventLocation || "महाराष्ट्र"}`;
    const soundText =
      activeLead.soundRequired === true
        ? "कलाकाराने स्वतः साऊंड व माईक आणावे"
        : activeLead.soundRequired === false
        ? "साऊंड सिस्टीमची गरज नाही"
        : "हॉल / आयोजकांकडून उपलब्ध असेल";

    const lines = [
      `*MyKalakar इव्हेंट बुकिंग अलर्ट* 🚩`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `*नमस्कार ${artistName} जी!* 🙏`,
      ``,
      `MyKalakar कडून तुमच्यासाठी नवीन इव्हेंट बुकिंग उपलब्ध आहे:`,
      ``,
      `📋 *कार्यक्रमाचा तपशील:*`,
      `• *कार्यक्रम:* ${categoryText}`,
      `• *तारीख:* ${dateText}`,
      `• *वेळ:* ${timeText}`,
      `• *ठिकाण:* ${locText}`,
      `• *ऑफर मानधन (Payout):* ₹${offerPrice}`,
      `• *साऊंड सिस्टीम:* ${soundText}`,
      ...(activeLead.telecallerNotes ? [`• *विशेष सूचना:* ${activeLead.telecallerNotes}`] : []),
      ``,
      `━━━━━━━━━━━━━━━━━━━━`,
      `👉 *कृपया तुमची उपलब्धता कळवण्यासाठी खालीलप्रमाणे रिप्लाय करा:*`,
      ``,
      `1️⃣ *YES* (होय, मी उपलब्ध आहे)`,
      `2️⃣ *NO* (नाही, मी उपलब्ध नाही)`,
      ``,
      `_(टीप: सर्व मानधन MyKalakar द्वारे १००% सुरक्षित केले जाते.)_`,
      `— *MyKalakar टीम*`,
    ];

    const message = lines.join("\n");
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    toast({
      title: "WhatsApp Message Sent! 🟢",
      description: `Opened masked booking requirement for ${artistName}. Customer phone is protected.`,
    });
  };

  const handleWhatsAppCustomerInquiry = () => {
    if (!activeLead) return;
    const phone = (activeLead.customerPhone || "").replace(/[^0-9]/g, "");
    const cleanPhone = phone.startsWith("91") && phone.length === 12 ? phone : phone.length === 10 ? `91${phone}` : phone;

    const customerName = activeLead.customerName || "ग्राहक";
    const artistName = activeLead.confirmedArtistName || activeLead.requestedArtistName || "";
    const categoryText = formatLeadCategory(activeLead);
    const dateText = activeLead.eventDate || "तारीख चर्चाधीन";
    const timeText = activeLead.eventTime || "सायं. ०६:०० ते ०९:००";
    const locText = `${activeLead.eventLocation || "महाराष्ट्र"}${activeLead.venueAddress ? ` (${activeLead.venueAddress})` : ""}`;
    const budgetText = (activeLead.budget || 15000).toLocaleString("en-IN");

    const lines = [
      `*MyKalakar इव्हेंट मॅनेजमेंट* 🚩`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `*नमस्कार ${customerName} जी!* 🙏`,
      ``,
      `तुमच्या इव्हेंट नियोजनासाठी MyKalakar ला तुमची चौकशी प्राप्त झाली आहे.`,
      ``,
      `📋 *कार्यक्रमाचा तपशील:*`,
      `• *प्रकार:* ${categoryText}`,
      ...(artistName ? [`• *पसंतीचे कलाकार:* ${artistName}`] : []),
      `• *तारीख:* ${dateText}`,
      `• *वेळ:* ${timeText}`,
      `• *ठिकाण:* ${locText}`,
      `• *अंदाजे बजेट:* ₹${budgetText}`,
      ...(activeLead.telecallerNotes ? [`• *विशेष सूचना:* ${activeLead.telecallerNotes}`] : []),
      ``,
      `✓ आम्ही योग्य व नामांकित कलाकारांशी संपर्क करत आहोत. लवकरच तुम्हाला अपडेट देऊ.`,
      `काही बदल किंवा प्रश्न असल्यास कृपया येथे रिप्लाय करा.`,
      ``,
      `— *MyKalakar सपोर्ट टीम*`,
    ];

    const message = lines.join("\n");
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    toast({
      title: "Inquiry Message Sent! 💬",
      description: `Opened WhatsApp with event inquiry update for ${customerName}.`,
    });
  };

  const handleWhatsAppCustomerPaymentLink = () => {
    if (!activeLead) return;
    const phone = (activeLead.customerPhone || "").replace(/[^0-9]/g, "");
    const cleanPhone = phone.startsWith("91") && phone.length === 12 ? phone : phone.length === 10 ? `91${phone}` : phone;

    const customerName = activeLead.customerName || "ग्राहक";
    const artistName = activeLead.confirmedArtistName || activeLead.requestedArtistName || "कलाकार";
    const amount = (activeLead.budget || 15000).toLocaleString("en-IN");
    const dateText = activeLead.eventDate || "तारीख चर्चाधीन";
    const locText = activeLead.eventLocation || "महाराष्ट्र";
    const categoryText = formatLeadCategory(activeLead);

    const upiIdToSend = paymentConfig.upiId || "mykalakar@icici";
    const upiNameToSend = paymentConfig.upiName || "MyKalakar";

    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    let baseDomain = window.location.origin;
    if (paymentConfig.websiteUrl && paymentConfig.websiteUrl !== "https://mykalakar.com") {
      baseDomain = paymentConfig.websiteUrl;
    } else if (isLocalhost) {
      baseDomain = `http://lvh.me:${window.location.port || "8080"}`;
    }
    const cleanProfileLink = `${baseDomain.replace(/\/$/, "")}/profile`;

    const lines = [
      `*MyKalakar बुकिंग कन्फर्मेशन* 🚩`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `*नमस्कार ${customerName} जी!* 🙏`,
      ``,
      `🎉 *आनंदाची बातमी!* तुमच्या इव्हेंटसाठी कलाकार *${artistName}* यांनी होकार दिला आहे.`,
      ``,
      `📋 *अंतिम तपशील:*`,
      `• *कलाकार:* ${artistName}`,
      `• *कार्यक्रम:* ${categoryText}`,
      `• *तारीख:* ${dateText}`,
      `• *ठिकाण:* ${locText}`,
      `• *मानधन रक्कम:* ₹${amount}`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━`,
      `💳 *सुरक्षित पेमेंट पद्धत:*`,
      ``,
      `*१. थेट UPI द्वारे पेमेंट:*`,
      `• *UPI ID:* \`${upiIdToSend}\``,
      `• *नाव:* ${upiNameToSend}`,
      `_(पेमेंट केल्यावर स्क्रीनशॉट याच WhatsApp वर पाठवा)_`,
      ``,
      `*२. १-क्लिक ऑनलाइन पेमेंट लिंक:*`,
      `${cleanProfileLink}`,
      ``,
      `✓ *टीप:* तुमचे पैसे MyKalakar Escrow खात्यात कार्यक्रम पूर्ण होईपर्यंत १००% सुरक्षित राहतील.`,
      ``,
      `— *MyKalakar टीम*`,
    ];

    const message = lines.join("\n");
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    toast({
      title: "Payment Link Sent! 🟢",
      description: `Opened WhatsApp payment confirmation for ${customerName}.`,
    });
  };

  const [previewArtistReels, setPreviewArtistReels] = useState<{ artist: any; reels: ArtistReelItem[] } | null>(null);

  const handleReleasePayout = async (lead: TelecallerLead) => {
    try {
      await updateLeadStatus(lead.id, "booked");
      setActiveLead((prev) => (prev ? { ...prev, status: "booked" } : null));
      toast({
        title: "Payout Authorized & Released! 💸",
        description: `Artist payout of ₹${(lead.artistOfferBudget || Math.round((lead.budget || 15000) * 0.8)).toLocaleString("en-IN")} cleared for release.`,
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed", description: "Could not release payout." });
    }
  };

  const handleProcessRefund = async (lead: TelecallerLead) => {
    try {
      await updateLeadStatus(lead.id, "cancelled");
      setActiveLead((prev) => (prev ? { ...prev, status: "cancelled" } : null));
      toast({
        title: "Refund Approved & Processed 🔄",
        description: `Customer refund of ₹${lead.budget?.toLocaleString("en-IN")} processed as per cancellation policy.`,
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed", description: "Could not process refund." });
    }
  };

  const openArtistReelsPreview = (artist: any) => {
    const rawList = Array.isArray(artist.reels)
      ? artist.reels
      : Array.isArray(artist.media?.reels)
      ? artist.media.reels
      : [];

    const parsed: ArtistReelItem[] = rawList.map((item: any, idx: number) => {
      if (typeof item === "string") {
        return { id: `reel_${idx}`, url: item, title: `${artist.name || "Artist"} Performance ${idx + 1}` };
      }
      return { id: item.id || `reel_${idx}`, url: item.url || item.videoUrl || "", title: item.title || `${artist.name || "Artist"} Reel` };
    }).filter((r: any) => Boolean(r.url));

    if (parsed.length === 0) {
      toast({ title: "No Reels Available", description: `${artist.name} has not uploaded any performance reels yet.` });
      return;
    }

    setPreviewArtistReels({ artist, reels: parsed });
  };

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

    const unsubPayment = subscribePaymentConfig((cfg) => {
      setPaymentConfig(cfg);
    });

    const unsubCommission = subscribeCommissionConfig((cfg) => {
      setCommissionConfig(cfg);
    });

    return () => {
      unsubLeads();
      unsubArtists();
      unsubPayment();
      unsubCommission();
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

    const targetSubCategory = (activeLead.subCategory || "").toLowerCase();
    const targetCategory = (activeLead.category || "").toLowerCase();

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
        description: `Logged call with ${selectedArtistForCall.name} (${callOutcome}).`,
      });
      setSelectedArtistForCall(null);
      setCallNotes("");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "कॉल रेकॉर्ड सेव्ह करता आला नाही.",
      });
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

  // Metrics summary with commission and earnings calculation
  const metrics = useMemo(() => {
    const confirmedLeads = leads.filter((l) => l.status === "artist_confirmed" || l.status === "booked");
    let totalEarnings = 0;
    let pendingEarnings = 0;

    confirmedLeads.forEach((l) => {
      let comm = l.telecallerCommission;
      if (typeof comm !== "number") {
        const b = l.budget || 0;
        const a = l.confirmedPrice || l.artistOfferBudget || (b > 0 ? Math.round(b * 0.8) : 0);
        const split = calculateCommissionSplit(b, a, commissionConfig);
        comm = split.telecallerCommission;
      }
      totalEarnings += comm;
      if (l.commissionPayoutStatus !== "paid") {
        pendingEarnings += comm;
      }
    });

    return {
      total: leads.length,
      newLeads: leads.filter((l) => l.status === "new").length,
      confirmed: confirmedLeads.length,
      inProgress: leads.filter((l) => l.status === "contacting_artists").length,
      totalEarnings,
      pendingEarnings,
    };
  }, [leads, commissionConfig]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200/60 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-stone-900 flex items-center gap-2">
            <PhoneCall className="h-6 w-6 text-orange-600" />
            Telecaller Workbench
          </h1>
          <div className="text-xs text-stone-600 font-bold mt-1.5 flex flex-wrap items-center gap-2">
            <span>Good Morning 👋</span>
            <span className="text-stone-300">•</span>
            <span className="bg-stone-100 text-stone-800 px-3 py-1 rounded-full text-[11px] font-extrabold border border-stone-200">
              {metrics.total} Total Leads | {metrics.newLeads} New | {metrics.inProgress} In Progress | {metrics.confirmed} Confirmed
            </span>
            <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 rounded-full text-[11px] font-black flex items-center gap-1 shadow-2xs">
              💰 माझी कमाई: ₹{metrics.totalEarnings.toLocaleString("en-IN")}
              <span className="text-[10px] font-normal text-emerald-700">({commissionConfig.telecallerPercentage}% rate)</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <Button
            variant="outline"
            onClick={() => setQrModalOpen(true)}
            className="rounded-full border-stone-300 bg-white hover:bg-stone-50 text-stone-800 font-extrabold text-xs shadow-xs px-4 py-2.5 flex items-center gap-2"
          >
            <QrCode className="h-4 w-4 text-orange-600" />
            ⚙️ UPI व QR सेट करा
          </Button>

          <Button
            onClick={() => setManualModalOpen(true)}
            className="rounded-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs shadow-md px-5 py-2.5 flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            ＋ Log Incoming Call
          </Button>
        </div>
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
                    const targetArtist = lead.confirmedArtistName || lead.requestedArtistName || (lead.matchedArtists && lead.matchedArtists[0]?.artistName);
                    const isBookArtist = lead.leadType === "book_artist" || Boolean(targetArtist);
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
                          <div className="flex items-center gap-1.5 flex-wrap">
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
                              <span className="text-[10px] font-extrabold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200 truncate flex items-center gap-1">
                                <UserCheck className="h-3 w-3" /> Book Artist
                              </span>
                            ) : (
                              <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200 truncate flex items-center gap-1">
                                <FileText className="h-3 w-3" /> Requirement
                              </span>
                            )}
                          </div>

                          {/* Delete Lead Trash Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLeadToDelete(lead);
                            }}
                            className="h-6 w-6 rounded-md text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                            title="ही लीड हटवा (Delete Lead)"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Customer Name */}
                        <h4 className="text-sm font-black text-stone-900 mt-2 truncate">
                          {lead.customerName || "Customer"}
                        </h4>

                        {/* Booked / Requested Artist Name Tag */}
                        {targetArtist && (
                          <div className="flex items-center gap-1.5 text-xs font-black text-orange-950 bg-gradient-to-r from-orange-100/90 to-amber-100/70 border border-orange-300/80 rounded-xl px-2.5 py-1.5 mt-1.5 shadow-2xs">
                            <UserCheck className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                            <span className="truncate">
                              कलाकार: <strong className="text-orange-950 font-black">{targetArtist}</strong>
                            </span>
                          </div>
                        )}

                        <p className="flex items-center gap-1.5 text-xs font-extrabold text-stone-800 mt-1 truncate">
                          <Sparkles className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                          <span className="truncate">{lead.eventType} • {lead.subCategory}</span>
                        </p>

                        <p className="flex items-center gap-1.5 text-xs text-stone-500 font-semibold mt-1 flex-wrap">
                          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-stone-400 shrink-0" /> {lead.eventDate || "Date TBD"}</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0 ml-1" /> {lead.eventLocation || "Location"}</span>
                        </p>

                        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-stone-100">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-emerald-700 flex items-center gap-1">
                              <IndianRupee className="h-3.5 w-3.5 shrink-0" /> Budget: ₹{lead.budget?.toLocaleString("en-IN") || "N/A"}
                            </span>
                            {lead.telecallerCommission ? (
                              <span className="text-[10px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded mt-0.5 w-fit">
                                💰 कमिशन: ₹{lead.telecallerCommission.toLocaleString("en-IN")}
                              </span>
                            ) : lead.budget ? (
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.2 rounded mt-0.5 w-fit">
                                कमिशन: ~₹{calculateCommissionSplit(lead.budget, lead.artistOfferBudget || Math.round(lead.budget * 0.8), commissionConfig).telecallerCommission.toLocaleString("en-IN")}
                              </span>
                            ) : null}
                          </div>
                          {isSelected ? (
                            <span className="text-[11px] font-black text-orange-700 bg-orange-100 border border-orange-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                              ● Active
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-stone-400 flex items-center gap-0.5">
                              Select →
                            </span>
                          )}
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
                <div className="space-y-4">
                  {/* 4-STEP WORKFLOW VISUALIZER (Mobile Friendly Pipeline) */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-emerald-600 text-white shadow-md space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-black">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4" /> 4-Step Booking Flow (सुलभ पायऱ्या)
                      </span>
                      <span className="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px] font-extrabold">
                        {activeLead.status === "new"
                          ? "पायरी १: ग्राहकाशी बोला"
                          : activeLead.status === "contacting_artists"
                          ? "पायरी २: कलाकाराला पाठवा"
                          : activeLead.status === "artist_confirmed"
                          ? "पायरी ३: बुकिंग कन्फर्म"
                          : activeLead.status === "booked"
                          ? "पायरी ४: पे-आऊट पूर्ण"
                          : "स्थिती: " + activeLead.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] sm:text-xs">
                      {/* Step 1: Customer Call */}
                      <div
                        onClick={() => handleStatusChange(activeLead.id, "new")}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          activeLead.status === "new"
                            ? "bg-white text-stone-900 font-black shadow-md ring-2 ring-white/80"
                            : "bg-black/20 text-white/90 hover:bg-black/30"
                        }`}
                      >
                        <div className="font-extrabold flex items-center justify-center gap-0.5">
                          <Phone className="h-3 w-3" /> १. ग्राहक कॉल
                        </div>
                        <div className="text-[9px] mt-0.5 opacity-80">
                          {activeLead.isVerifiedByTelecaller ? "✓ व्हेरिफाय" : "तपशील तपासा"}
                        </div>
                      </div>

                      {/* Step 2: WhatsApp Artist */}
                      <div
                        onClick={() => handleStatusChange(activeLead.id, "contacting_artists")}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          activeLead.status === "contacting_artists"
                            ? "bg-white text-stone-900 font-black shadow-md ring-2 ring-white/80"
                            : "bg-black/20 text-white/90 hover:bg-black/30"
                        }`}
                      >
                        <div className="font-extrabold flex items-center justify-center gap-0.5">
                          <MessageCircle className="h-3 w-3 text-emerald-600" /> २. WhatsApp
                        </div>
                        <div className="text-[9px] mt-0.5 opacity-80">कलाकार संपर्क</div>
                      </div>

                      {/* Step 3: Confirm Booking */}
                      <div
                        onClick={() => handleStatusChange(activeLead.id, "artist_confirmed")}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          activeLead.status === "artist_confirmed"
                            ? "bg-white text-stone-900 font-black shadow-md ring-2 ring-white/80"
                            : "bg-black/20 text-white/90 hover:bg-black/30"
                        }`}
                      >
                        <div className="font-extrabold flex items-center justify-center gap-0.5">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" /> ३. कन्फर्म
                        </div>
                        <div className="text-[9px] mt-0.5 opacity-80">
                          {activeLead.status === "artist_confirmed" ? "✓ नक्की झाले" : "आर्टिस्ट होकार"}
                        </div>
                      </div>

                      {/* Step 4: Release Payout */}
                      <div
                        onClick={() => handleStatusChange(activeLead.id, "booked")}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          activeLead.status === "booked"
                            ? "bg-white text-stone-900 font-black shadow-md ring-2 ring-white/80"
                            : "bg-black/20 text-white/90 hover:bg-black/30"
                        }`}
                      >
                        <div className="font-extrabold flex items-center justify-center gap-0.5">
                          <Wallet className="h-3 w-3 text-emerald-600" /> ४. पे-आऊट
                        </div>
                        <div className="text-[9px] mt-0.5 opacity-80">
                          {activeLead.status === "booked" ? "✓ पूर्ण" : "एस्क्रो रिलीज"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 1: CUSTOMER REQUIREMENT (Clean & Actionable) */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/80 shadow-sm space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-stone-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base sm:text-lg font-black text-stone-950">
                            {activeLead.customerName || "Customer Lead"}
                          </h3>
                          {activeLead.isVerifiedByTelecaller ? (
                            <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <ShieldCheck className="h-3 w-3" /> Verified (तपासले)
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              Pending Call Check
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-stone-600 mt-0.5">
                          {activeLead.eventType} • <span className="text-orange-600 font-black">{activeLead.subCategory}</span>
                        </p>
                        {(activeLead.confirmedArtistName || activeLead.requestedArtistName || (activeLead.matchedArtists && activeLead.matchedArtists[0]?.artistName)) && (
                          <div className="inline-flex items-center gap-1.5 text-xs font-black text-orange-950 bg-orange-100/90 border border-orange-300 px-2.5 py-1 rounded-lg mt-1 shadow-2xs">
                            <UserCheck className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                            <span>
                              {activeLead.confirmedArtistName ? "नक्की झालेला कलाकार:" : "ग्राहकाने बुक केलेला कलाकार:"}{" "}
                              <strong className="text-orange-950 font-black">
                                {activeLead.confirmedArtistName || activeLead.requestedArtistName || activeLead.matchedArtists?.[0]?.artistName}
                              </strong>
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => setEditModalOpen(true)}
                          className="h-8 px-3 text-xs font-extrabold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 flex items-center gap-1"
                        >
                          <Edit3 className="h-3.5 w-3.5" /> Edit
                        </Button>

                        <Select
                          value={activeLead.status}
                          onValueChange={(val: LeadStatus) => handleStatusChange(activeLead.id, val)}
                        >
                          <SelectTrigger className="w-36 h-8 text-xs rounded-xl bg-stone-50 border-stone-200 text-stone-900 font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-stone-200 text-xs">
                            <SelectItem value="new">1. New Lead (नवीन)</SelectItem>
                            <SelectItem value="contacting_artists">2. Calling (संपर्क)</SelectItem>
                            <SelectItem value="artist_confirmed">3. Confirmed (नक्की)</SelectItem>
                            <SelectItem value="booked">4. Completed / Paid</SelectItem>
                            <SelectItem value="cancelled">5. Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Compact Details Strip */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="bg-stone-50 border border-stone-200/80 px-2.5 py-1 rounded-xl font-bold text-stone-800 flex items-center gap-1">
                        📅 {activeLead.eventDate || "Date TBD"} {activeLead.eventTime ? `(${activeLead.eventTime})` : ""}
                      </span>
                      <span className="bg-stone-50 border border-stone-200/80 px-2.5 py-1 rounded-xl font-bold text-stone-800 flex items-center gap-1">
                        📍 {activeLead.eventLocation || "Location"}{activeLead.venueAddress ? ` • ${activeLead.venueAddress}` : ""}
                      </span>
                      <span className="bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl font-black text-emerald-800 flex items-center gap-1">
                        💰 बजेट: ₹{activeLead.budget?.toLocaleString("en-IN") || "N/A"}
                      </span>
                      <span className="bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-xl font-bold text-orange-800 flex items-center gap-1">
                        आर्टिस्ट मानधन: ₹{(activeLead.artistOfferBudget || Math.round((activeLead.budget || 15000) * 0.8)).toLocaleString("en-IN")}
                      </span>
                      {activeLead.soundRequired !== undefined && (
                        <span className="bg-stone-50 border border-stone-200/80 px-2.5 py-1 rounded-xl font-semibold text-stone-700 flex items-center gap-1">
                          🔊 {activeLead.soundRequired ? "आर्टिस्टचा साऊंड" : "हॉलचा साऊंड"}
                        </span>
                      )}
                    </div>

                    {activeLead.telecallerNotes && (
                      <p className="text-xs bg-amber-50/60 border border-amber-200/60 text-amber-900 px-3 py-2 rounded-xl font-medium">
                        📝 <strong>विशेष सूचना:</strong> {activeLead.telecallerNotes}
                      </p>
                    )}

                    {/* Action Buttons: Artist WhatsApp/Call & Customer Call/Payment */}
                    <div className="space-y-2 pt-1">
                      {/* Artist Communication Row */}
                      {(activeLead.requestedArtistName || activeLead.confirmedArtistName || activeLead.artistPhone) && (
                        <div className="p-3 rounded-xl bg-orange-50/80 border border-orange-200/90 space-y-2">
                          <div className="flex items-center justify-between text-xs font-black text-orange-950">
                            <span className="flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5 text-orange-600" />
                              कलाकार संपर्क: <strong className="text-orange-700 font-black">{activeLead.confirmedArtistName || activeLead.requestedArtistName || "कलाकार"}</strong>
                            </span>
                            <span className="text-[10px] bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-bold">
                              मानधन: ₹{(activeLead.artistOfferBudget || Math.round((activeLead.budget || 20000) * 0.8)).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const artistObj = activeArtists.find(
                                  (a) =>
                                    (activeLead.requestedArtistName && (a.name?.toLowerCase() === activeLead.requestedArtistName.toLowerCase() || a.displayName?.toLowerCase() === activeLead.requestedArtistName.toLowerCase())) ||
                                    (activeLead.confirmedArtistName && (a.name?.toLowerCase() === activeLead.confirmedArtistName.toLowerCase() || a.displayName?.toLowerCase() === activeLead.confirmedArtistName.toLowerCase()))
                                ) || {
                                  name: activeLead.confirmedArtistName || activeLead.requestedArtistName || "कलाकार",
                                  phone: activeLead.artistPhone || activeLead.artistContactNumber || "9876543210",
                                };
                                handleWhatsAppArtist(artistObj);
                              }}
                              className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                            >
                              <MessageCircle className="h-4 w-4" /> 💬 कलाकार WhatsApp ({activeLead.confirmedArtistName || activeLead.requestedArtistName || "कलाकार"})
                            </button>

                            {(() => {
                              const artistObj = activeArtists.find(
                                (a) =>
                                  (activeLead.requestedArtistName && (a.name?.toLowerCase() === activeLead.requestedArtistName.toLowerCase() || a.displayName?.toLowerCase() === activeLead.requestedArtistName.toLowerCase())) ||
                                  (activeLead.confirmedArtistName && (a.name?.toLowerCase() === activeLead.confirmedArtistName.toLowerCase() || a.displayName?.toLowerCase() === activeLead.confirmedArtistName.toLowerCase()))
                              );
                              const artistPhoneNum = activeLead.artistPhone || artistObj?.phone || artistObj?.contactNumber;
                              return (
                                <a
                                  href={artistPhoneNum ? `tel:${artistPhoneNum}` : "#"}
                                  onClick={() => {
                                    if (!artistPhoneNum) {
                                      toast({ title: "Phone number", description: "Artist phone number is not available." });
                                    }
                                  }}
                                  className="w-full py-2.5 px-3 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 font-black text-xs shadow-2xs transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                                >
                                  <Phone className="h-3.5 w-3.5 text-orange-600" /> 📞 कलाकार कॉल
                                </a>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Customer Communication Row */}
                      {activeLead.customerPhone && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <a
                            href={`tel:${activeLead.customerPhone}`}
                            onClick={() => handleStatusChange(activeLead.id, "contacting_artists")}
                            className="w-full py-2.5 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-black text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-[0.99]"
                          >
                            <Phone className="h-3.5 w-3.5 text-emerald-400" /> 📞 ग्राहक कॉल
                          </a>
                          <button
                            type="button"
                            onClick={handleWhatsAppCustomerInquiry}
                            className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-[0.99]"
                          >
                            <MessageSquare className="h-3.5 w-3.5" /> 💬 ग्राहक WhatsApp (अपडेट)
                          </button>
                          <button
                            type="button"
                            onClick={handleWhatsAppCustomerPaymentLink}
                            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-[0.99]"
                          >
                            <MessageCircle className="h-3.5 w-3.5" /> 💳 ग्राहक पेमेंट लिंक
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SECTION 2: MATCHING ARTISTS (Fast WhatsApp & Call) */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/80 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                      <h4 className="text-sm font-black text-stone-950 flex items-center gap-2">
                        <Users className="h-4 w-4 text-orange-600 shrink-0" />
                        <span>उपलब्ध कलाकार ({matchingArtists.length}) - WhatsApp पाठवा</span>
                      </h4>
                      <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                        🔒 ग्राहक फोन सुरक्षित
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {matchingArtists.slice(0, 6).map((artist) => {
                        const phoneNum = artist.phone || artist.contactNumber || "+91 98765 43210";
                        const isConfirmed = activeLead.status === "artist_confirmed" && activeLead.requestedArtistName === artist.name;

                        return (
                          <div
                            key={artist.name}
                            className={`p-3 sm:p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                              isConfirmed ? "bg-emerald-50/90 border-emerald-300 shadow-sm ring-1 ring-emerald-200" : "bg-stone-50/70 border-stone-200/80 hover:border-orange-200"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="h-10 w-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                                {artist.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs sm:text-sm font-black text-stone-900 truncate">{artist.name}</span>
                                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                    ★ {artist.rating || 4.8}
                                  </span>
                                </div>
                                <p className="text-[11px] text-stone-500 font-semibold truncate">
                                  📍 {artist.district || artist.location || "Maharashtra"} • दर: ₹{artist.startingPrice?.toLocaleString("en-IN") || "15,000"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                              {Boolean(artist.reels?.length || artist.media?.reels?.length) && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openArtistReelsPreview(artist)}
                                  className="h-8 px-2 text-xs font-bold text-orange-600 hover:bg-orange-100 rounded-xl"
                                >
                                  <Film className="h-3.5 w-3.5 mr-1" /> Reel
                                </Button>
                              )}

                              <Button
                                size="sm"
                                onClick={() => handleWhatsAppArtist(artist)}
                                className="h-8.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95"
                              >
                                <MessageCircle className="h-4 w-4" /> WhatsApp
                              </Button>

                              <a
                                href={`tel:${phoneNum}`}
                                className="h-8.5 px-3 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-800 hover:bg-stone-100 inline-flex items-center gap-1 shadow-sm active:scale-95"
                              >
                                <Phone className="h-3.5 w-3.5 text-orange-600" /> Call
                              </a>

                              <Button
                                size="sm"
                                onClick={() => {
                                  handleStatusChange(activeLead.id, "artist_confirmed");
                                  toast({
                                    title: "Artist Confirmed! ✓",
                                    description: `${artist.name} has been assigned and confirmed for this booking.`,
                                  });
                                }}
                                className={`h-8.5 px-3 rounded-xl text-xs font-black shadow-sm ${
                                  isConfirmed
                                    ? "bg-emerald-700 text-white ring-2 ring-emerald-300"
                                    : "bg-stone-900 hover:bg-stone-800 text-white"
                                }`}
                              >
                                {isConfirmed ? "✓ Confirmed" : "Confirm"}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* SECTION 3: ESCROW & PAYOUT (with live Commission Breakdown) */}
                  {(() => {
                    const bookingAmt = activeLead.budget || 0;
                    const artistAmt = activeLead.confirmedPrice || activeLead.artistOfferBudget || (bookingAmt > 0 ? Math.round(bookingAmt * 0.8) : 0);
                    const split = calculateCommissionSplit(bookingAmt, artistAmt, commissionConfig);
                    const myComm = typeof activeLead.telecallerCommission === "number" ? activeLead.telecallerCommission : split.telecallerCommission;

                    return (
                      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-orange-50/70 via-white to-blue-50/70 border border-orange-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-4 text-xs font-bold flex-wrap">
                          <div>
                            <span className="text-stone-400 block text-[10px] uppercase font-bold">Client Paid</span>
                            <span className="text-emerald-700 font-black">₹{bookingAmt.toLocaleString("en-IN")}</span>
                          </div>
                          <div>
                            <span className="text-stone-400 block text-[10px] uppercase font-bold">Artist Payout</span>
                            <span className="text-stone-800 font-black">₹{artistAmt.toLocaleString("en-IN")}</span>
                          </div>
                          <div>
                            <span className="text-stone-400 block text-[10px] uppercase font-bold">Gross Margin</span>
                            <span className="text-purple-700 font-black">₹{split.grossMargin.toLocaleString("en-IN")}</span>
                          </div>
                          <div className="pl-3 border-l-2 border-blue-300">
                            <span className="text-blue-600 block text-[10px] uppercase font-black">📞 Your Commission</span>
                            <span className="text-blue-800 font-black text-sm">₹{myComm.toLocaleString("en-IN")}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleReleasePayout(activeLead)}
                            className="h-8.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm"
                          >
                            💸 Release Payout
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleProcessRefund(activeLead)}
                            className="h-8.5 px-3 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold"
                          >
                            🔄 Refund
                          </Button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="p-12 text-center rounded-2xl bg-white border border-stone-200 text-stone-500 text-xs shadow-sm">
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
                  <Button
                    size="sm"
                    onClick={() => {
                      setActiveLead(lead);
                      setEditModalOpen(true);
                    }}
                    className="h-9 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 text-xs font-bold flex items-center gap-1"
                  >
                    <Edit3 className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <a
                    href={`tel:${lead.customerPhone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-50 border border-orange-200 text-xs font-bold text-orange-600 hover:bg-orange-100 transition"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Call
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

      {/* Edit & Verify Lead Modal */}
      <EditLeadModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        lead={activeLead}
        onLeadUpdated={(updatedLead) => {
          setLeads((prev) =>
            prev.map((l) => (l.id === updatedLead.id ? updatedLead : l))
          );
          setActiveLead(updatedLead);
        }}
      />

      {/* Telecaller QR Code & UPI Settings Modal */}
      <TelecallerQRModal
        open={qrModalOpen}
        onOpenChange={setQrModalOpen}
        onSaved={(newCfg) => setPaymentConfig(newCfg)}
      />

      {/* Artist Reels Preview Modal */}
      {previewArtistReels && (
        <ArtistReelViewerModal
          open={Boolean(previewArtistReels)}
          onOpenChange={(open) => {
            if (!open) setPreviewArtistReels(null);
          }}
          reels={previewArtistReels.reels}
          artistName={previewArtistReels.artist.name}
          artistCategory={previewArtistReels.artist.category}
          artistAvatar={previewArtistReels.artist.avatar}
          onBookArtist={() => {
            setPreviewArtistReels(null);
            if (activeLead) {
              handleStatusChange(activeLead.id, "artist_confirmed");
            }
          }}
        />
      )}

      {/* Delete Lead Confirmation Dialog */}
      <Dialog open={Boolean(leadToDelete)} onOpenChange={(open) => !open && setLeadToDelete(null)}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 border border-stone-200 shadow-2xl">
          <DialogHeader>
            <div className="h-12 w-12 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mb-2 mx-auto sm:mx-0">
              <Trash2 className="h-6 w-6" />
            </div>
            <DialogTitle className="text-base font-black text-stone-950">
              लीड कायमची हटवायची आहे का?
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600 font-semibold pt-1 leading-relaxed">
              तुम्ही <strong>"{leadToDelete?.customerName || "Customer"}"</strong> ची (
              {leadToDelete?.eventType || "Event"}) लीड हटवत आहात. ही कृती पूर्ववत करता येणार नाही.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button
              type="button"
              variant="outline"
              disabled={deletingLead}
              onClick={() => setLeadToDelete(null)}
              className="rounded-xl text-xs font-bold"
            >
              रद्द करा (Cancel)
            </Button>
            <Button
              type="button"
              disabled={deletingLead}
              onClick={confirmDeleteLead}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black gap-1.5"
            >
              {deletingLead ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              <span>होय, डिलीट करा (Delete)</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
