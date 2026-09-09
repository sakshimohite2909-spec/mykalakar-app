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
  ArrowLeft,
  Share2,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  // Action status tracking
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<TelecallerLead | null>(null);
  const [deletingLead, setDeletingLead] = useState(false);
  const [previewArtistReels, setPreviewArtistReels] = useState<{ artist: any; reels: ArtistReelItem[] } | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubLeads = subscribeTelecallerLeads((data) => {
      setLeads(data);
      setLoading(false);
      setActiveLead((prev) => {
        if (!prev && data.length > 0) return data[0];
        if (prev) {
          const updatedCurrent = data.find((l) => l.id === prev.id || l.id.replace(/^(booking_|brief_|lead_|inquiry_)/, "") === prev.id.replace(/^(booking_|brief_|lead_|inquiry_)/, ""));
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

  const confirmDeleteLead = async () => {
    if (!leadToDelete) return;
    setDeletingLead(true);
    try {
      await deleteLead(leadToDelete.id);
      setLeads((prev) => prev.filter((l) => l.id !== leadToDelete.id));
      if (activeLead?.id === leadToDelete.id) {
        const remaining = leads.filter((l) => l.id !== leadToDelete.id);
        setActiveLead(remaining.length > 0 ? remaining[0] : null);
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

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus, confirmedArtistData?: { artistId: string; artistName: string; price: number }) => {
    setProcessingStatus(leadId);
    const cleanTargetId = leadId.replace(/^(booking_|brief_|lead_|inquiry_)/, "");
    
    // 1. Immediate optimistic UI update
    setLeads((prev) =>
      prev.map((l) => {
        const lCleanId = l.id.replace(/^(booking_|brief_|lead_|inquiry_)/, "");
        if (l.id === leadId || lCleanId === cleanTargetId) {
          return {
            ...l,
            status: newStatus,
            confirmedArtistName: confirmedArtistData?.artistName || l.confirmedArtistName,
            confirmedArtistId: confirmedArtistData?.artistId || l.confirmedArtistId,
            confirmedPrice: confirmedArtistData?.price || l.confirmedPrice,
          };
        }
        return l;
      })
    );

    if (activeLead && (activeLead.id === leadId || activeLead.id.replace(/^(booking_|brief_|lead_|inquiry_)/, "") === cleanTargetId)) {
      setActiveLead((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              confirmedArtistName: confirmedArtistData?.artistName || prev.confirmedArtistName,
              confirmedArtistId: confirmedArtistData?.artistId || prev.confirmedArtistId,
              confirmedPrice: confirmedArtistData?.price || prev.confirmedPrice,
            }
          : null
      );
    }

    try {
      await updateLeadStatus(leadId, newStatus, confirmedArtistData);
      toast({
        title: "स्थिती अपडेट झाली! ✓",
        description: `लीड स्टेटस बदलून "${newStatus.replace("_", " ")}" करण्यात आले.`,
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed", description: "स्थिती बदलता आली नाही." });
    } finally {
      setProcessingStatus(null);
    }
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
      `👉 *कृपया तुमची उपलब्धता कळवण्यासाठी लगेच रिप्लाय करा:*`,
      ``,
      `1️⃣ *YES* (होय, मी उपलब्ध आहे)`,
      `2️⃣ *NO* (नाही, मी उपलब्ध नाही)`,
      ``,
      `_(टीप: सर्व मानधन MyKalakar द्वारे १००% सुरक्षित केले जाते.)_`,
      `— *MyKalakar टीम*`,
    ];

    const message = lines.join("\n");
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    toast({
      title: "WhatsApp उघडले! 🟢",
      description: `${artistName} यांना बुकिंग मेसेज पाठवला जात आहे.`,
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
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    toast({
      title: "ग्राहक WhatsApp अपडेट! 💬",
      description: `${customerName} यांना इव्हेंट अपडेट पाठवले.`,
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
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    toast({
      title: "पेमेंट लिंक पाठवली! 🟢",
      description: `${customerName} यांच्यासाठी WhatsApp पेमेंट मेसेज उघडला.`,
    });
  };

  const handleReleasePayout = async (lead: TelecallerLead) => {
    setProcessingStatus(`payout_${lead.id}`);
    try {
      await updateLeadStatus(lead.id, "booked");
      setActiveLead((prev) => (prev ? { ...prev, status: "booked" } : null));
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status: "booked" } : l)));
      toast({
        title: "पे-आऊट मंजूर झाले! 💸",
        description: `कलाकाराचे मानधन ₹${(lead.artistOfferBudget || Math.round((lead.budget || 15000) * 0.8)).toLocaleString("en-IN")} रिलीजसाठी क्लिअर केले.`,
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed", description: "Could not release payout." });
    } finally {
      setProcessingStatus(null);
    }
  };

  const handleProcessRefund = async (lead: TelecallerLead) => {
    setProcessingStatus(`refund_${lead.id}`);
    try {
      await updateLeadStatus(lead.id, "cancelled");
      setActiveLead((prev) => (prev ? { ...prev, status: "cancelled" } : null));
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status: "cancelled" } : l)));
      toast({
        title: "रिफंड प्रोसेस केले 🔄",
        description: `ग्राहकाचे ₹${lead.budget?.toLocaleString("en-IN")} रिफंडसाठी मंजूर केले.`,
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed", description: "Could not process refund." });
    } finally {
      setProcessingStatus(null);
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
        return { id: `reel_${idx}`, url: item, title: `${artist.name || "Artist"} Reel ${idx + 1}` };
      }
      return { id: item.id || `reel_${idx}`, url: item.url || item.videoUrl || "", title: item.title || `${artist.name || "Artist"} Reel` };
    }).filter((r: any) => Boolean(r.url));

    if (parsed.length === 0) {
      toast({ title: "रील्स उपलब्ध नाहीत", description: `${artist.name} यांनी अद्याप रील अपलोड केलेली नाही.` });
      return;
    }

    setPreviewArtistReels({ artist, reels: parsed });
  };

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

  const matchingArtists = useMemo(() => {
    if (!activeLead) return activeArtists.slice(0, 6);

    const targetSubCategory = (activeLead.subCategory || "").toLowerCase();
    const targetCategory = (activeLead.category || "").toLowerCase();

    const matched = activeArtists.filter((artist) => {
      const sub = (artist.subcategory || artist.artForm || "").toLowerCase();
      const cat = (artist.category || "").toLowerCase();
      return sub.includes(targetSubCategory) || cat.includes(targetCategory) || targetSubCategory.includes(sub);
    });

    return matched.length > 0 ? matched : activeArtists.slice(0, 6);
  }, [activeLead, activeArtists]);

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

  // Metrics summary with commission
  const metrics = useMemo(() => {
    const confirmedLeads = leads.filter((l) => l.status === "artist_confirmed" || l.status === "booked");
    let totalEarnings = 0;

    confirmedLeads.forEach((l) => {
      let comm = l.telecallerCommission;
      if (typeof comm !== "number") {
        const b = l.budget || 0;
        const a = l.confirmedPrice || l.artistOfferBudget || (b > 0 ? Math.round(b * 0.8) : 0);
        const split = calculateCommissionSplit(b, a, commissionConfig);
        comm = split.telecallerCommission;
      }
      totalEarnings += comm;
    });

    return {
      total: leads.length,
      newLeads: leads.filter((l) => l.status === "new").length,
      inProgress: leads.filter((l) => l.status === "contacting_artists").length,
      confirmed: confirmedLeads.length,
      totalEarnings,
    };
  }, [leads, commissionConfig]);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Fast Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <PhoneCall className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-stone-900">
                Telecaller Dashboard
              </h1>
              <p className="text-xs text-stone-500 font-semibold">
                कॉलिंग, WhatsApp बुकिंग आणि पेमेंट मॅनेजमेंट
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-3 text-xs">
            <span className="bg-stone-100 text-stone-800 px-2.5 py-1 rounded-lg font-extrabold border border-stone-200">
              एकूण लीड्स: {metrics.total}
            </span>
            <span className="bg-amber-100 text-amber-900 px-2.5 py-1 rounded-lg font-extrabold border border-amber-300">
              नवीन: {metrics.newLeads}
            </span>
            <span className="bg-sky-100 text-sky-900 px-2.5 py-1 rounded-lg font-extrabold border border-sky-300">
              कॉलिंग चालू: {metrics.inProgress}
            </span>
            <span className="bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-lg font-extrabold border border-emerald-300">
              नक्की: {metrics.confirmed}
            </span>
            <span className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-3 py-1 rounded-lg font-black shadow-xs flex items-center gap-1">
              💰 माझी कमाई: ₹{metrics.totalEarnings.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Top Right Action Buttons */}
        <div className="flex items-center gap-2 mt-2 sm:mt-0 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setQrModalOpen(true)}
            className="h-10 px-3.5 rounded-xl border-stone-300 bg-white hover:bg-stone-50 text-stone-800 font-bold text-xs shadow-2xs flex items-center gap-1.5"
          >
            <QrCode className="h-4 w-4 text-orange-600" />
            <span>QR / UPI</span>
          </Button>

          <Button
            onClick={() => setManualModalOpen(true)}
            className="h-10 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs shadow-sm flex items-center gap-1.5"
          >
            <PlusCircle className="h-4 w-4" />
            <span>＋ नवीन कॉल लीड</span>
          </Button>
        </div>
      </div>

      {/* VIEW 1: DASHBOARD WORKBENCH */}
      {isDashboardTab && (
        <div className="space-y-3 sm:space-y-4">
          {/* Mobile Tab Switcher */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-200/80 rounded-2xl lg:hidden shadow-inner">
            <button
              onClick={() => setMobileTab("leads")}
              className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                mobileTab === "leads"
                  ? "bg-white text-stone-950 shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <FileText className="h-4 w-4 text-orange-600" />
              <span>📋 लीड्स ({filteredLeads.length})</span>
            </button>
            <button
              onClick={() => setMobileTab("workbench")}
              className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                mobileTab === "workbench"
                  ? "bg-orange-600 text-white shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <PhoneCall className="h-4 w-4" />
              <span>⚡ कॉलिंग व ॲक्शन</span>
            </button>
          </div>

          {/* 2-Column Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] xl:grid-cols-[390px_1fr] gap-4 sm:gap-5">
            {/* Left Column: Leads Feed */}
            <div className={`space-y-3 ${mobileTab === "leads" ? "block" : "hidden lg:block"}`}>
              {/* Filter Tabs */}
              <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl overflow-x-auto no-scrollbar whitespace-nowrap">
                <button
                  onClick={() => {
                    setLeadTypeFilter("all");
                    setStatusFilter("all");
                  }}
                  className={`py-1.5 px-2.5 rounded-lg text-[11px] font-extrabold transition-all shrink-0 ${
                    leadTypeFilter === "all" && statusFilter === "all"
                      ? "bg-white text-stone-900 shadow-2xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  सर्व ({leads.length})
                </button>
                <button
                  onClick={() => setStatusFilter("new")}
                  className={`py-1.5 px-2.5 rounded-lg text-[11px] font-extrabold transition-all shrink-0 ${
                    statusFilter === "new"
                      ? "bg-amber-500 text-white shadow-2xs"
                      : "text-amber-800 hover:bg-amber-100/60"
                  }`}
                >
                  नवीन ({leads.filter((l) => l.status === "new").length})
                </button>
                <button
                  onClick={() => {
                    setLeadTypeFilter("book_artist");
                    setStatusFilter("all");
                  }}
                  className={`py-1.5 px-2.5 rounded-lg text-[11px] font-extrabold transition-all shrink-0 flex items-center gap-1 ${
                    leadTypeFilter === "book_artist"
                      ? "bg-purple-600 text-white shadow-2xs"
                      : "text-purple-800 hover:bg-purple-100/60"
                  }`}
                >
                  <UserCheck className="h-3 w-3" />
                  बुकिंग ({leads.filter((l) => l.leadType === "book_artist").length})
                </button>
                <button
                  onClick={() => {
                    setLeadTypeFilter("post_requirement");
                    setStatusFilter("all");
                  }}
                  className={`py-1.5 px-2.5 rounded-lg text-[11px] font-extrabold transition-all shrink-0 flex items-center gap-1 ${
                    leadTypeFilter === "post_requirement"
                      ? "bg-stone-800 text-white shadow-2xs"
                      : "text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  रिक्वायरमेंट ({leads.filter((l) => l.leadType === "post_requirement").length})
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <Input
                  placeholder="ग्राहक नाव किंवा फोन शोधा..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9.5 text-xs rounded-xl bg-white border-stone-200 text-stone-900"
                />
              </div>

              {/* Leads List */}
              {loading ? (
                <div className="flex items-center justify-center py-12 bg-white rounded-2xl border border-stone-200">
                  <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-white border border-stone-200 text-stone-500 text-xs">
                  कोणतीही लीड सापडली नाही. वर <strong>＋ नवीन कॉल लीड</strong> बटण दाबा.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
                  {filteredLeads.map((lead) => {
                    const isSelected = activeLead?.id === lead.id || activeLead?.id.replace(/^(booking_|brief_|lead_|inquiry_)/, "") === lead.id.replace(/^(booking_|brief_|lead_|inquiry_)/, "");
                    const targetArtist = lead.confirmedArtistName || lead.requestedArtistName || (lead.matchedArtists && lead.matchedArtists[0]?.artistName);
                    const isBookArtist = lead.leadType === "book_artist" || Boolean(targetArtist);

                    return (
                      <div
                        key={lead.id}
                        onClick={() => {
                          setActiveLead(lead);
                          setMobileTab("workbench");
                        }}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-orange-50/90 border-orange-400 shadow-sm ring-2 ring-orange-200"
                            : "bg-white border-stone-200/90 hover:border-orange-300 hover:bg-stone-50/60 shadow-2xs"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                                lead.status === "new"
                                  ? "bg-amber-100 text-amber-900 border-amber-300"
                                  : lead.status === "artist_confirmed" || lead.status === "booked"
                                  ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                                  : "bg-sky-100 text-sky-900 border-sky-300"
                              }`}
                            >
                              {lead.status === "new"
                                ? "नवीन (New)"
                                : lead.status === "contacting_artists"
                                ? "कॉलिंग चालू"
                                : lead.status === "artist_confirmed"
                                ? "कलाकार नक्की"
                                : lead.status === "booked"
                                ? "पूर्ण / पे-आऊट"
                                : lead.status}
                            </span>
                            {isBookArtist && (
                              <span className="text-[10px] font-extrabold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200">
                                आर्टिस्ट बुकिंग
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLeadToDelete(lead);
                            }}
                            className="h-7 w-7 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition flex items-center justify-center shrink-0 cursor-pointer"
                            title="लीड हटवा"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Customer Name */}
                        <div className="flex items-baseline justify-between mt-2">
                          <h4 className="text-sm font-black text-stone-900 truncate">
                            {lead.customerName || "Customer"}
                          </h4>
                          <span className="text-xs font-black text-emerald-700">
                            ₹{lead.budget?.toLocaleString("en-IN") || "N/A"}
                          </span>
                        </div>

                        {/* Requested / Confirmed Artist */}
                        {targetArtist && (
                          <div className="flex items-center gap-1 text-[11px] font-black text-orange-950 bg-orange-100/80 border border-orange-200 rounded-lg px-2 py-1 mt-1.5 truncate">
                            <UserCheck className="h-3 w-3 text-orange-600 shrink-0" />
                            <span className="truncate">कलाकार: {targetArtist}</span>
                          </div>
                        )}

                        <p className="flex items-center gap-1 text-xs font-bold text-stone-700 mt-1 truncate">
                          <Sparkles className="h-3 w-3 text-orange-500 shrink-0" />
                          <span className="truncate">{lead.eventType} • {lead.subCategory}</span>
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium mt-1.5 pt-1.5 border-t border-stone-100">
                          <span className="flex items-center gap-1 truncate">
                            <Calendar className="h-3 w-3 text-stone-400" /> {lead.eventDate || "तारीख TBD"}
                          </span>
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="h-3 w-3 text-stone-400" /> {lead.eventLocation || "महाराष्ट्र"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Workbench & Action Center */}
            <div className={`space-y-3 sm:space-y-4 ${mobileTab === "workbench" ? "block" : "hidden lg:block"}`}>
              {/* Mobile Back Button */}
              <button
                onClick={() => setMobileTab("leads")}
                className="lg:hidden w-full py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-black flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>← परत लीड्स यादीकडे (Back to Leads)</span>
              </button>

              {activeLead ? (
                <div className="space-y-3.5">
                  {/* 4-STEP VISUAL PROGRESS PIPELINE */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-emerald-700 text-white shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-xs font-black">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4" /> बुकिंग पायऱ्या (4 Steps)
                      </span>
                      <span className="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px]">
                        {activeLead.status === "new"
                          ? "पायरी १: ग्राहकाशी संपर्क"
                          : activeLead.status === "contacting_artists"
                          ? "पायरी २: कलाकाराला पाठवा"
                          : activeLead.status === "artist_confirmed"
                          ? "पायरी ३: बुकिंग कन्फर्म"
                          : activeLead.status === "booked"
                          ? "पायरी ४: पे-आऊट पूर्ण"
                          : activeLead.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] sm:text-xs">
                      {/* Step 1 */}
                      <button
                        type="button"
                        onClick={() => handleStatusChange(activeLead.id, "new")}
                        className={`p-2 rounded-xl transition cursor-pointer flex flex-col items-center justify-center ${
                          activeLead.status === "new"
                            ? "bg-white text-stone-900 font-black shadow-md ring-2 ring-white/80"
                            : "bg-black/25 text-white/90 hover:bg-black/40"
                        }`}
                      >
                        <Phone className="h-3.5 w-3.5 mb-0.5" />
                        <span className="font-extrabold">१. ग्राहक कॉल</span>
                      </button>

                      {/* Step 2 */}
                      <button
                        type="button"
                        onClick={() => handleStatusChange(activeLead.id, "contacting_artists")}
                        className={`p-2 rounded-xl transition cursor-pointer flex flex-col items-center justify-center ${
                          activeLead.status === "contacting_artists"
                            ? "bg-white text-stone-900 font-black shadow-md ring-2 ring-white/80"
                            : "bg-black/25 text-white/90 hover:bg-black/40"
                        }`}
                      >
                        <MessageCircle className="h-3.5 w-3.5 mb-0.5 text-emerald-400" />
                        <span className="font-extrabold">२. WhatsApp</span>
                      </button>

                      {/* Step 3 */}
                      <button
                        type="button"
                        onClick={() => handleStatusChange(activeLead.id, "artist_confirmed")}
                        className={`p-2 rounded-xl transition cursor-pointer flex flex-col items-center justify-center ${
                          activeLead.status === "artist_confirmed"
                            ? "bg-white text-stone-900 font-black shadow-md ring-2 ring-white/80"
                            : "bg-black/25 text-white/90 hover:bg-black/40"
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mb-0.5 text-emerald-400" />
                        <span className="font-extrabold">३. कन्फर्म</span>
                      </button>

                      {/* Step 4 */}
                      <button
                        type="button"
                        onClick={() => handleStatusChange(activeLead.id, "booked")}
                        className={`p-2 rounded-xl transition cursor-pointer flex flex-col items-center justify-center ${
                          activeLead.status === "booked"
                            ? "bg-white text-stone-900 font-black shadow-md ring-2 ring-white/80"
                            : "bg-black/25 text-white/90 hover:bg-black/40"
                        }`}
                      >
                        <Wallet className="h-3.5 w-3.5 mb-0.5 text-emerald-400" />
                        <span className="font-extrabold">४. पे-आऊट</span>
                      </button>
                    </div>
                  </div>

                  {/* CARD 1: CUSTOMER REQUIREMENT & FAST ACTION BUTTONS */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base sm:text-lg font-black text-stone-950">
                            {activeLead.customerName || "Customer"}
                          </h3>
                          {activeLead.isVerifiedByTelecaller ? (
                            <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <ShieldCheck className="h-3 w-3" /> व्हेरिफाय झाले
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              कॉल व्हेरिफिकेशन बाकी
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-stone-600 mt-0.5">
                          {activeLead.eventType} • <span className="text-orange-600 font-black">{activeLead.subCategory}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => setEditModalOpen(true)}
                          className="h-8.5 px-3 text-xs font-extrabold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 flex items-center gap-1"
                        >
                          <Edit3 className="h-3.5 w-3.5" /> बदल करा
                        </Button>

                        <Select
                          value={activeLead.status}
                          onValueChange={(val: LeadStatus) => handleStatusChange(activeLead.id, val)}
                        >
                          <SelectTrigger className="w-36 h-8.5 text-xs rounded-xl bg-stone-50 border-stone-200 text-stone-900 font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-stone-200 text-xs">
                            <SelectItem value="new">१. नवीन लीड (New)</SelectItem>
                            <SelectItem value="contacting_artists">२. कॉलिंग चालू (Calling)</SelectItem>
                            <SelectItem value="artist_confirmed">३. नक्की झाले (Confirmed)</SelectItem>
                            <SelectItem value="booked">४. पूर्ण / पेड (Booked)</SelectItem>
                            <SelectItem value="cancelled">५. रद्द (Cancelled)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Details Badges */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="bg-stone-50 border border-stone-200 px-2.5 py-1 rounded-xl font-bold text-stone-800 flex items-center gap-1">
                        📅 {activeLead.eventDate || "तारीख TBD"} {activeLead.eventTime ? `(${activeLead.eventTime})` : ""}
                      </span>
                      <span className="bg-stone-50 border border-stone-200 px-2.5 py-1 rounded-xl font-bold text-stone-800 flex items-center gap-1">
                        📍 {activeLead.eventLocation || "महाराष्ट्र"}{activeLead.venueAddress ? ` • ${activeLead.venueAddress}` : ""}
                      </span>
                      <span className="bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl font-black text-emerald-800 flex items-center gap-1">
                        💰 ग्राहक बजेट: ₹{activeLead.budget?.toLocaleString("en-IN") || "N/A"}
                      </span>
                      <span className="bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-xl font-bold text-orange-800 flex items-center gap-1">
                        आर्टिस्ट मानधन: ₹{(activeLead.artistOfferBudget || Math.round((activeLead.budget || 15000) * 0.8)).toLocaleString("en-IN")}
                      </span>
                    </div>

                    {activeLead.telecallerNotes && (
                      <p className="text-xs bg-amber-50/70 border border-amber-200 text-amber-900 px-3 py-2 rounded-xl font-medium">
                        📝 <strong>नोंद:</strong> {activeLead.telecallerNotes}
                      </p>
                    )}

                    {/* BIG MOBILE-FRIENDLY CUSTOMER ACTION BUTTONS */}
                    <div className="space-y-2 pt-1">
                      <div className="text-xs font-black text-stone-800 flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-orange-600" /> ग्राहकाशी थेट संवाद (Customer Actions):
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {/* 1. Call Customer */}
                        <a
                          href={activeLead.customerPhone ? `tel:${activeLead.customerPhone}` : "#"}
                          onClick={() => {
                            if (!activeLead.customerPhone) {
                              toast({ title: "फोन नंबर नाही", description: "ग्राहकाचा फोन नंबर उपलब्ध नाही." });
                            } else {
                              handleStatusChange(activeLead.id, "contacting_artists");
                            }
                          }}
                          className="min-h-[44px] py-2.5 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-black text-xs shadow-sm transition flex items-center justify-center gap-2 active:scale-98"
                        >
                          <Phone className="h-4 w-4 text-emerald-400" />
                          <span>ग्राहक कॉल ({activeLead.customerPhone || "Call"})</span>
                        </a>

                        {/* 2. Customer WhatsApp Update */}
                        <button
                          type="button"
                          onClick={handleWhatsAppCustomerInquiry}
                          className="min-h-[44px] py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-sm transition flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                        >
                          <MessageSquare className="h-4 w-4" />
                          <span>WhatsApp अपडेट पाठवा</span>
                        </button>

                        {/* 3. Customer Payment Link */}
                        <button
                          type="button"
                          onClick={handleWhatsAppCustomerPaymentLink}
                          className="min-h-[44px] py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs shadow-sm transition flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span>पेमेंट लिंक पाठवा (UPI)</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: ASSIGNED / REQUESTED ARTIST DIRECT ACTION */}
                  {(activeLead.requestedArtistName || activeLead.confirmedArtistName) && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-orange-50/90 border border-orange-200 shadow-xs space-y-2.5">
                      <div className="flex items-center justify-between flex-wrap gap-1 text-xs font-black text-orange-950">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="h-4 w-4 text-orange-600" />
                          {activeLead.confirmedArtistName ? "नक्की केलेला कलाकार:" : "ग्राहकाने निवडलेला कलाकार:"}{" "}
                          <strong className="text-orange-900 font-black text-sm">
                            {activeLead.confirmedArtistName || activeLead.requestedArtistName}
                          </strong>
                        </span>
                        <span className="text-[11px] bg-orange-200/80 text-orange-900 px-2.5 py-0.5 rounded-full font-bold">
                          मानधन: ₹{(activeLead.artistOfferBudget || Math.round((activeLead.budget || 20000) * 0.8)).toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
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
                          className="min-h-[44px] py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm transition flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span>कलाकार WhatsApp ({activeLead.confirmedArtistName || activeLead.requestedArtistName})</span>
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
                                  toast({ title: "फोन नंबर नाही", description: "कलाकाराचा फोन नंबर उपलब्ध नाही." });
                                }
                              }}
                              className="min-h-[44px] py-2.5 px-3 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 text-stone-900 font-black text-xs shadow-2xs transition flex items-center justify-center gap-2 active:scale-98"
                            >
                              <Phone className="h-4 w-4 text-orange-600" />
                              <span>कलाकार थेट कॉल</span>
                            </a>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* CARD 3: AVAILABLE ARTISTS (Quick WhatsApp & 1-Click Confirm) */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                      <h4 className="text-sm font-black text-stone-950 flex items-center gap-2">
                        <Users className="h-4 w-4 text-orange-600 shrink-0" />
                        <span>उपलब्ध कलाकार ({matchingArtists.length})</span>
                      </h4>
                      <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                        🔒 ग्राहक फोन गुप्त राहतो
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {matchingArtists.slice(0, 6).map((artist) => {
                        const phoneNum = artist.phone || artist.contactNumber || "+91 98765 43210";
                        const isConfirmed =
                          (activeLead.status === "artist_confirmed" || activeLead.status === "booked") &&
                          (activeLead.confirmedArtistName === artist.name || activeLead.requestedArtistName === artist.name);

                        return (
                          <div
                            key={artist.name}
                            className={`p-3 sm:p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                              isConfirmed
                                ? "bg-emerald-50/90 border-emerald-400 shadow-sm ring-1 ring-emerald-200"
                                : "bg-stone-50/80 border-stone-200 hover:border-orange-300"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="h-10 w-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
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
                                  className="h-9 px-2 text-xs font-bold text-orange-600 hover:bg-orange-100 rounded-xl"
                                >
                                  <Film className="h-3.5 w-3.5 mr-1" /> रील
                                </Button>
                              )}

                              <Button
                                size="sm"
                                onClick={() => handleWhatsAppArtist(artist)}
                                className="h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 shadow-2xs active:scale-95"
                              >
                                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                              </Button>

                              <a
                                href={`tel:${phoneNum}`}
                                className="h-9 px-3 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-800 hover:bg-stone-100 inline-flex items-center gap-1 shadow-2xs active:scale-95"
                              >
                                <Phone className="h-3.5 w-3.5 text-orange-600" /> कॉल
                              </a>

                              <Button
                                size="sm"
                                onClick={() => {
                                  handleStatusChange(activeLead.id, "artist_confirmed", {
                                    artistId: artist.id || artist.name,
                                    artistName: artist.name,
                                    price: artist.startingPrice || activeLead.artistOfferBudget || 15000,
                                  });
                                }}
                                className={`h-9 px-3.5 rounded-xl text-xs font-black shadow-2xs ${
                                  isConfirmed
                                    ? "bg-emerald-700 text-white ring-2 ring-emerald-300"
                                    : "bg-stone-900 hover:bg-stone-800 text-white"
                                }`}
                              >
                                {isConfirmed ? "✓ नक्की झाले" : "नक्की करा"}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* CARD 4: ESCROW & PAYOUT RELEASE */}
                  {(() => {
                    const bookingAmt = activeLead.budget || 0;
                    const artistAmt = activeLead.confirmedPrice || activeLead.artistOfferBudget || (bookingAmt > 0 ? Math.round(bookingAmt * 0.8) : 0);
                    const split = calculateCommissionSplit(bookingAmt, artistAmt, commissionConfig);
                    const myComm = typeof activeLead.telecallerCommission === "number" ? activeLead.telecallerCommission : split.telecallerCommission;

                    return (
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-50/80 via-white to-blue-50/80 border border-orange-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-4 text-xs font-bold flex-wrap">
                          <div>
                            <span className="text-stone-400 block text-[10px] uppercase font-bold">ग्राहकाची रक्कम</span>
                            <span className="text-emerald-700 font-black">₹{bookingAmt.toLocaleString("en-IN")}</span>
                          </div>
                          <div>
                            <span className="text-stone-400 block text-[10px] uppercase font-bold">कलाकार मानधन</span>
                            <span className="text-stone-800 font-black">₹{artistAmt.toLocaleString("en-IN")}</span>
                          </div>
                          <div className="pl-3 border-l-2 border-blue-300">
                            <span className="text-blue-600 block text-[10px] uppercase font-black">
                              📞 तुमचे कमिशन ({commissionConfig.telecallerPercentage}%)
                            </span>
                            <span className="text-blue-800 font-black text-sm">₹{myComm.toLocaleString("en-IN")}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            disabled={processingStatus === `payout_${activeLead.id}`}
                            onClick={() => handleReleasePayout(activeLead)}
                            className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm"
                          >
                            {processingStatus === `payout_${activeLead.id}` ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : null}
                            💸 पे-आऊट रिलीज करा
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={processingStatus === `refund_${activeLead.id}`}
                            onClick={() => handleProcessRefund(activeLead)}
                            className="h-9 px-3 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold"
                          >
                            {processingStatus === `refund_${activeLead.id}` ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : null}
                            🔄 रिफंड
                          </Button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="p-12 text-center rounded-2xl bg-white border border-stone-200 text-stone-500 text-xs shadow-xs">
                  डाव्या बाजूच्या यादीतून कोणतीही लीड निवडा.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: PHONE INQUIRIES & LEADS TAB */}
      {isLeadsTab && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
              <Input
                placeholder="ग्राहक नाव, फोन किंवा कॅटेगरी शोधा..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 text-xs rounded-xl bg-white border-stone-200 text-stone-900"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44 h-10 text-xs rounded-xl bg-white border-stone-200 text-stone-900 font-bold">
                <SelectValue placeholder="सर्व स्थिती" />
              </SelectTrigger>
              <SelectContent className="bg-white border-stone-200 text-stone-900 text-xs">
                <SelectItem value="all">सर्व स्थिती (All)</SelectItem>
                <SelectItem value="new">नवीन लीड (New)</SelectItem>
                <SelectItem value="contacting_artists">कॉलिंग चालू</SelectItem>
                <SelectItem value="artist_confirmed">कलाकार नक्की</SelectItem>
                <SelectItem value="booked">पूर्ण (Booked)</SelectItem>
                <SelectItem value="cancelled">रद्द (Cancelled)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-stone-950">{lead.customerName}</h3>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                        lead.status === "new"
                          ? "bg-amber-100 text-amber-800"
                          : lead.status === "artist_confirmed"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-sky-100 text-sky-800"
                      }`}
                    >
                      {lead.status}
                    </span>
                    <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                      {lead.source === "manual_phone_call" ? "थेट फोन कॉल" : "वेबसाईट इन्क्वायरी"}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 flex flex-wrap items-center gap-3">
                    <span className="font-bold text-orange-600 flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      <a href={`tel:${lead.customerPhone}`}>{lead.customerPhone}</a>
                    </span>
                    <span>📍 {lead.eventLocation}</span>
                    <span>📅 {lead.eventDate}</span>
                  </p>

                  <p className="text-xs font-bold text-stone-800">
                    कॅटेगरी: <span className="text-orange-600">{lead.eventType} ({lead.subCategory})</span> • बजेट: ₹{lead.budget?.toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <Button
                    size="sm"
                    onClick={() => {
                      setActiveLead(lead);
                      setEditModalOpen(true);
                    }}
                    className="h-9 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 text-xs font-bold flex items-center gap-1"
                  >
                    <Edit3 className="h-3.5 w-3.5" /> बदल करा
                  </Button>
                  <a
                    href={`tel:${lead.customerPhone}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition shadow-2xs"
                  >
                    <Phone className="h-3.5 w-3.5 text-emerald-400" />
                    कॉल
                  </a>
                  <Select
                    value={lead.status}
                    onValueChange={(val: LeadStatus) => handleStatusChange(lead.id, val)}
                  >
                    <SelectTrigger className="w-36 h-9 text-xs rounded-xl bg-stone-50 border-stone-200 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-stone-200 text-xs">
                      <SelectItem value="new">नवीन लीड</SelectItem>
                      <SelectItem value="contacting_artists">कॉलिंग चालू</SelectItem>
                      <SelectItem value="artist_confirmed">नक्की झाले</SelectItem>
                      <SelectItem value="booked">पूर्ण / पेड</SelectItem>
                      <SelectItem value="cancelled">रद्द</SelectItem>
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
                placeholder="कलाकाराचे नाव, कलाप्रकार किंवा शहर शोधा..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 text-xs rounded-xl bg-white border-stone-200 text-stone-900"
              />
            </div>
            <Select value={artistCategoryFilter} onValueChange={setArtistCategoryFilter}>
              <SelectTrigger className="w-48 h-10 text-xs rounded-xl bg-white border-stone-200 text-stone-900 font-bold">
                <SelectValue placeholder="सर्व कॅटेगरी" />
              </SelectTrigger>
              <SelectContent className="bg-white border-stone-200 text-stone-900 text-xs">
                <SelectItem value="all">सर्व कॅटेगरी</SelectItem>
                {MAIN_EVENT_CARDS.map((card) => (
                  <SelectItem key={card.name} value={card.name}>
                    {card.icon} {card.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredArtistDirectory.map((artist) => {
              const phoneNum = artist.phone || artist.contactNumber || "+91 98765 43210";
              const priceDisplay = artist.startingPrice ? `₹${artist.startingPrice?.toLocaleString("en-IN")}+` : "दर विनंतीवर";

              return (
                <div key={artist.name} className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-orange-300 transition">
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
                        {artist.rating || 4.8}
                      </span>
                    </div>

                    <p className="text-xs text-stone-500 font-medium">
                      📍 {artist.district}, {artist.state} • {artist.category}
                    </p>

                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                      {artist.bio || "MyKalakar वरील अधिकृत परफॉर्मिंग कलाकार."}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-stone-400 block uppercase">अंदाजे मानधन</span>
                      <span className="text-sm font-black text-stone-950">{priceDisplay}</span>
                    </div>

                    <a
                      href={`tel:${phoneNum}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-extrabold hover:bg-orange-700 transition shadow-2xs"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      कॉल करा
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
              रद्द करा
            </Button>
            <Button
              type="button"
              disabled={deletingLead}
              onClick={confirmDeleteLead}
              className="rounded-xl text-xs font-black bg-red-600 hover:bg-red-700 text-white"
            >
              {deletingLead ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              होय, लीड हटवा
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
