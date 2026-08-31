import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  IndianRupee,
  Volume2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Phone,
  ShieldCheck,
  Loader2,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateLeadStatus, logArtistCall, type TelecallerLead } from "@/services/telecallerService";

export default function ArtistBookingResponsePage() {
  const { leadId } = useParams<{ leadId: string }>();
  const [searchParams] = useSearchParams();

  const queryArtistName = searchParams.get("artist") || "";
  const queryOffer = searchParams.get("offer") || "";
  const queryDate = searchParams.get("date") || "";
  const queryLoc = searchParams.get("loc") || "";
  const queryEvent = searchParams.get("event") || "";

  const [lead, setLead] = useState<TelecallerLead | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [responseState, setResponseState] = useState<"pending" | "accepted" | "declined">("pending");

  useEffect(() => {
    async function loadLeadData() {
      if (!leadId) {
        setLoading(false);
        return;
      }

      try {
        const cleanId = leadId.replace(/^(booking_|brief_|lead_|inquiry_)/, "");
        
        // Try telecaller_leads first
        let snap = await getDoc(doc(db, "telecaller_leads", cleanId));
        if (!snap.exists()) {
          snap = await getDoc(doc(db, "telecaller_leads", leadId));
        }
        if (!snap.exists()) {
          snap = await getDoc(doc(db, "bookings", cleanId));
        }
        if (!snap.exists()) {
          snap = await getDoc(doc(db, "bookings", leadId));
        }
        if (!snap.exists()) {
          snap = await getDoc(doc(db, "inquiries", cleanId));
        }
        if (!snap.exists()) {
          snap = await getDoc(doc(db, "inquiries", leadId));
        }
        if (!snap.exists()) {
          snap = await getDoc(doc(db, "event_briefs", cleanId));
        }
        if (!snap.exists()) {
          snap = await getDoc(doc(db, "event_briefs", leadId));
        }

        if (snap.exists()) {
          const data = snap.data() as any;
          setLead({
            id: snap.id,
            customerName: data.customerName || data.clientName || "ग्राहक",
            customerPhone: data.customerPhone || "",
            eventType: data.eventType || data.performanceType || queryEvent || "इव्हेंट",
            category: data.category || data.eventType || "General",
            subCategory: data.subCategory || "कलाकार",
            eventDate: data.eventDate || queryDate || "तारीख चर्चाधीन",
            eventTime: data.eventTime || "सायं. ०६:०० ते ०९:००",
            eventLocation: data.eventLocation || data.venueLocation || queryLoc || "महाराष्ट्र",
            venueAddress: data.venueAddress || "",
            budget: Number(data.budget || data.authorizedAmount || 0),
            artistOfferBudget: Number(data.artistOfferBudget || queryOffer || 15000),
            soundRequired: data.soundRequired,
            telecallerNotes: data.telecallerNotes || data.specialNotes || "",
            status: data.status || "new",
            matchedArtists: data.matchedArtists || [],
            requestedArtistName: data.requestedArtistName || queryArtistName || "कलाकार",
            confirmedArtistName: data.confirmedArtistName,
            leadType: data.leadType || "book_artist",
            source: "website_inquiry",
          });

          if (data.status === "artist_confirmed" || data.status === "booked") {
            setResponseState("accepted");
          }
        }
      } catch (err) {
        console.warn("Could not fetch remote lead, using query params fallback:", err);
      } finally {
        setLoading(false);
      }
    }

    loadLeadData();
  }, [leadId, queryArtistName, queryDate, queryEvent, queryLoc, queryOffer]);

  const artistName = lead?.confirmedArtistName || lead?.requestedArtistName || queryArtistName || "कलाकार";
  const displayEvent = lead?.eventType || queryEvent || "इव्हेंट";
  const displaySub = lead?.subCategory || "";
  const displayDate = lead?.eventDate || queryDate || "तारीख चर्चाधीन";
  const displayTime = lead?.eventTime || "सायं. ०६:०० ते ०९:००";
  const displayLoc = lead?.eventLocation || queryLoc || "महाराष्ट्र";
  const displayVenue = lead?.venueAddress ? `${lead.venueAddress}, ` : "";
  const offerAmount = lead?.artistOfferBudget || Number(queryOffer) || 15000;

  const soundInfo =
    lead?.soundRequired === true
      ? "कलाकाराने स्वतः साऊंड व माईक आणावे"
      : lead?.soundRequired === false
      ? "साऊंड सिस्टीमची गरज नाही (अकौस्टिक)"
      : "हॉल / आयोजकांकडून साऊंड सिस्टीम उपलब्ध असेल";

  const handleSelectYes = async () => {
    setSubmitting(true);
    try {
      if (leadId) {
        await updateLeadStatus(leadId, "artist_confirmed", {
          artistId: artistName.replace(/\s+/g, "_").toLowerCase(),
          artistName,
          price: offerAmount,
        });

        // Log call outcome
        await logArtistCall(
          leadId,
          {
            artistId: artistName.replace(/\s+/g, "_").toLowerCase(),
            artistName,
            artistPhone: "",
            category: displayEvent,
            subCategory: displaySub,
            callOutcome: "agreed",
            quotedPrice: offerAmount,
            callNotes: "Artist confirmed via 1-Click WhatsApp link.",
          },
          lead?.matchedArtists || []
        );
      }
      setResponseState("accepted");
    } catch (e) {
      console.error("Failed to update status:", e);
      setResponseState("accepted");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectNo = async () => {
    setSubmitting(true);
    try {
      if (leadId) {
        await logArtistCall(
          leadId,
          {
            artistId: artistName.replace(/\s+/g, "_").toLowerCase(),
            artistName,
            artistPhone: "",
            category: displayEvent,
            subCategory: displaySub,
            callOutcome: "busy_booked",
            callNotes: "Artist declined availability via 1-Click link.",
          },
          lead?.matchedArtists || []
        );
      }
      setResponseState("declined");
    } catch (e) {
      console.error("Failed to log decline:", e);
      setResponseState("declined");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100/80 flex flex-col justify-between py-6 px-4 sm:px-6">
      <div className="max-w-md w-full mx-auto space-y-4">
        {/* Brand Top Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 border border-orange-200 text-orange-900 text-xs font-black">
            <Sparkles className="h-3.5 w-3.5 text-orange-600" />
            MyKalakar अधिकृत बुकिंग आमंत्रण
          </div>
          <h1 className="text-xl font-black text-stone-900 tracking-tight">
            इव्हेंट उपलब्धता पडताळणी
          </h1>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-3xl p-8 border border-stone-200 text-center shadow-md space-y-3"
            >
              <Loader2 className="h-8 w-8 text-orange-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-stone-600">इव्हेंट माहिती लोड होत आहे...</p>
            </motion.div>
          ) : responseState === "accepted" ? (
            /* ─── SUCCESS SCREEN: YES ACCEPTED ─── */
            <motion.div
              key="accepted"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-emerald-200 shadow-xl text-center space-y-5"
            >
              <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-black uppercase text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  ✓ बुकिंग उपलब्धता कन्फर्म झाली!
                </span>
                <h2 className="text-xl font-black text-stone-950 pt-2">
                  धन्यवाद, {artistName} जी! 🎉
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-stone-600 leading-relaxed max-w-sm mx-auto">
                  तुमचा होकार MyKalakar कडे नोंदवला गेला आहे. आमची टीम ग्राहकाशी संपर्क करून तुमचे <strong>ॲडव्हान्स मानधन (Advance Token)</strong> लवकरच सुरक्षित करेल.
                </p>
              </div>

              {/* Event Summary Card */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 text-left space-y-2 text-xs font-bold text-stone-700">
                <div className="flex justify-between border-b border-stone-200/60 pb-1.5">
                  <span className="text-stone-500">तारीख:</span>
                  <span className="text-stone-900">{displayDate}</span>
                </div>
                <div className="flex justify-between border-b border-stone-200/60 pb-1.5">
                  <span className="text-stone-500">कार्यक्रम:</span>
                  <span className="text-stone-900">{displayEvent}</span>
                </div>
                <div className="flex justify-between border-b border-stone-200/60 pb-1.5">
                  <span className="text-stone-500">ठिकाण:</span>
                  <span className="text-stone-900">{displayLoc}</span>
                </div>
                <div className="flex justify-between pt-0.5 text-sm font-black text-emerald-800">
                  <span>मानधन (Payout):</span>
                  <span>₹{offerAmount.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <a
                  href="tel:+919876543210"
                  className="w-full py-3 px-4 rounded-2xl bg-stone-950 hover:bg-orange-600 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Phone className="h-4 w-4" /> 📞 MyKalakar हेल्पलाइनशी बोला
                </a>
                <button
                  type="button"
                  onClick={() => setResponseState("pending")}
                  className="text-[11px] font-bold text-stone-400 hover:text-stone-600 underline"
                >
                  प्रतिसाद बदलायचा आहे का?
                </button>
              </div>
            </motion.div>
          ) : responseState === "declined" ? (
            /* ─── DECLINED SCREEN: NO ─── */
            <motion.div
              key="declined"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-xl text-center space-y-5"
            >
              <div className="h-16 w-16 bg-stone-100 text-stone-500 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="h-10 w-10 stroke-[2]" />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-lg font-black text-stone-950">
                  धन्यवाद, {artistName} जी!
                </h2>
                <p className="text-xs font-semibold text-stone-600 leading-relaxed">
                  तुमचा नकार नोंदवला गेला आहे. पुढील नवीन कार्यक्रमांसाठी MyKalakar तुम्हाला नक्की संपर्क करेल.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setResponseState("pending")}
                  className="w-full py-2.5 px-4 rounded-xl border border-stone-300 text-stone-700 font-extrabold text-xs hover:bg-stone-50"
                >
                  ← मागे जा आणि प्रतिसाद बदला
                </button>
              </div>
            </motion.div>
          ) : (
            /* ─── MAIN EVENT INVITATION CARD WITH YES / NO BUTTONS ─── */
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-xl space-y-4"
            >
              {/* Artist Greeting Banner */}
              <div className="p-3.5 rounded-2xl bg-orange-50/90 border border-orange-200/80">
                <p className="text-xs text-orange-950 font-medium">
                  नमस्कार <strong className="text-orange-900 font-black text-sm">{artistName}</strong> जी,
                </p>
                <p className="text-xs text-stone-600 font-semibold mt-0.5">
                  MyKalakar द्वारे खालील कार्यक्रमासाठी तुमच्याकडे चौकशी आली आहे:
                </p>
              </div>

              {/* Event Details Grid */}
              <div className="space-y-2.5 text-xs font-bold text-stone-700">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                  <Sparkles className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-black">कार्यक्रम प्रकार</span>
                    <span className="text-stone-900 text-sm font-extrabold">{displayEvent} {displaySub && `• ${displaySub}`}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                    <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-black flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-orange-600" /> तारीख
                    </span>
                    <span className="text-stone-900 font-extrabold text-xs">{displayDate}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                    <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-black flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-orange-600" /> वेळ
                    </span>
                    <span className="text-stone-900 font-extrabold text-xs">{displayTime}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-black flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-orange-600" /> ठिकाण
                  </span>
                  <span className="text-stone-900 font-extrabold text-xs">
                    {displayVenue}{displayLoc}
                  </span>
                </div>

                {/* Offer Price Highlight */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-emerald-800 block font-black">ऑफर मानधन (Payout)</span>
                    <span className="text-xl font-black text-emerald-700">₹{offerAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-800 bg-emerald-200/80 px-2.5 py-1 rounded-full">
                    ✓ १००% सुरक्षित
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-black flex items-center gap-1">
                    <Volume2 className="h-3.5 w-3.5 text-orange-600" /> साऊंड सिस्टीम
                  </span>
                  <span className="text-stone-800 font-semibold text-xs">{soundInfo}</span>
                </div>

                {lead?.telecallerNotes && (
                  <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70 text-amber-950 text-xs">
                    📝 <strong>विशेष सूचना:</strong> {lead.telecallerNotes}
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS: YES / NO */}
              <div className="pt-2 space-y-2.5">
                <p className="text-center text-xs font-black text-stone-800">
                  तुम्ही या तारखेला व मानधनात उपलब्ध आहात का?
                </p>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* YES BUTTON */}
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleSelectYes}
                    className="w-full py-3.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>✅ YES (होय)</span>
                      </>
                    )}
                  </button>

                  {/* NO BUTTON */}
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleSelectNo}
                    className="w-full py-3.5 px-3 rounded-2xl bg-stone-200 hover:bg-stone-300 active:scale-98 text-stone-800 font-black text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-stone-500" />
                        <span>❌ NO (नाही)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Escrow Guarantee Note */}
              <div className="pt-1 flex items-center justify-center gap-1.5 text-[11px] font-bold text-stone-500 text-center">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>सर्व मानधन MyKalakar एस्क्रो खात्यात सुरक्षित असते.</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="text-center text-[11px] font-medium text-stone-400 pt-2">
          © {new Date().getFullYear()} MyKalakar. All rights reserved.
        </div>
      </div>
    </div>
  );
}
