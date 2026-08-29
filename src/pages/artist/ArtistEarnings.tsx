import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useArtistBookings } from "@/hooks/useArtistBookings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";
import {
  IndianRupee,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  User,
  ArrowUpRight,
  TrendingUp,
  Download,
  AlertCircle,
  Building,
} from "lucide-react";
import { BookingStatusBadge } from "@/components/artist-bookings/BookingStatusBadge";
import { BookingDetailModal } from "@/components/artist-bookings/BookingDetailModal";
import type { BookingEvent } from "@/types/booking";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString?: string) {
  if (!dateString) return "Date not specified";
  try {
    return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

export default function ArtistEarnings() {
  const { artistData, currentUser } = useAuth();
  const { bookings, earningsSummary, loadingBookings, updateStatus } = useArtistBookings();
  const [selectedBooking, setSelectedBooking] = useState<BookingEvent | null>(null);
  const [filter, setFilter] = useState<"ALL" | "PAID" | "PENDING">("ALL");

  const [payoutUpi, setPayoutUpi] = useState<string>(artistData?.upiId || (artistData as any)?.bankDetails?.upiId || "");
  const [tempUpi, setTempUpi] = useState<string>("");
  const [isEditingPayout, setIsEditingPayout] = useState(false);
  const [savingUpi, setSavingUpi] = useState(false);

  useEffect(() => {
    if (artistData?.upiId || (artistData as any)?.bankDetails?.upiId) {
      setPayoutUpi(artistData?.upiId || (artistData as any)?.bankDetails?.upiId || "");
    }
  }, [artistData]);

  const handleSavePayoutUpi = async () => {
    if (!currentUser?.uid) return;
    if (!tempUpi.trim()) {
      toast({ variant: "destructive", title: "Invalid UPI ID", description: "Please enter a valid UPI ID (e.g. 9822123456@okaxis)" });
      return;
    }

    setSavingUpi(true);
    try {
      const cleanUpi = tempUpi.trim();
      const artistRef = doc(db, "artists", currentUser.uid);
      await setDoc(
        artistRef,
        {
          upiId: cleanUpi,
          payoutMode: "upi",
          "bankDetails.upiId": cleanUpi,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setPayoutUpi(cleanUpi);
      setIsEditingPayout(false);
      toast({
        title: "Payout UPI ID Saved! ⚡",
        description: `Your earnings will be sent directly to ${cleanUpi} upon event completion.`,
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Save Failed", description: "Could not update payout UPI ID." });
    } finally {
      setSavingUpi(false);
    }
  };

  const transactions = useMemo(() => {
    return bookings
      .filter((b) => {
        const amt = Number(b.authorizedAmount || (b as any).quotedPrice || (b as any).amount || (b as any).budget || 0);
        return amt > 0 || b.status === "EVENT_COMPLETED" || b.status === "CONFIRMED";
      })
      .map((b) => {
        const amount = Number(b.authorizedAmount || (b as any).quotedPrice || (b as any).amount || (b as any).budget || 0);
        const isPaid = ["EVENT_COMPLETED", "PAYOUT_RELEASED", "completed"].includes(b.status);
        const isPending = ["CONFIRMED", "confirmed", "booked", "artist_confirmed", "SOFT_HOLD_ACTIVE", "PAYMENT_AUTHORIZED", "PENDING_ARTIST_RESPONSE"].includes(b.status);

        return {
          ...b,
          calculatedAmount: amount,
          payoutStatus: isPaid ? "PAID" : isPending ? "PENDING" : "UNCONFIRMED",
        };
      })
      .sort((a, b) => new Date(b.eventDate || 0).getTime() - new Date(a.eventDate || 0).getTime());
  }, [bookings]);

  const filteredTransactions = useMemo(() => {
    if (filter === "ALL") return transactions;
    return transactions.filter((t) => t.payoutStatus === filter);
  }, [transactions, filter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-extrabold text-stone-900">
              Earnings & Payouts 💰
            </h1>
            <p className="text-sm text-stone-500 font-medium mt-1">
              Track your lifetime revenues, active escrow holds, and completed bank payouts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black">
              <ShieldCheck className="h-4 w-4" /> 100% Escrow Protected
            </span>
          </div>
        </div>
      </motion.div>

      {/* 3 Main Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Earnings */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="rounded-3xl border-stone-200 shadow-sm bg-gradient-to-br from-stone-900 to-stone-800 text-white overflow-hidden relative">
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-28 h-28 bg-orange-500/20 rounded-full blur-2xl pointer-events-none" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-stone-400">Total Earnings</span>
                <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center text-orange-400">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <p className="text-3xl font-black tracking-tight">
                {loadingBookings ? "..." : formatCurrency(earningsSummary.total)}
              </p>
              <p className="text-xs text-stone-400 font-medium mt-2">
                Lifetime platform booking revenue
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pending / In-Escrow */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="rounded-3xl border-amber-200 bg-amber-50/40 shadow-sm overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-amber-700">Pending (In Escrow)</span>
                <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
              <p className="text-3xl font-black tracking-tight text-stone-900">
                {loadingBookings ? "..." : formatCurrency(earningsSummary.pending)}
              </p>
              <p className="text-xs text-amber-800 font-medium mt-2">
                Held safely in escrow until event completion
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Paid / Released */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="rounded-3xl border-emerald-200 bg-emerald-50/40 shadow-sm overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-700">Paid Out</span>
                <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
              <p className="text-3xl font-black tracking-tight text-stone-900">
                {loadingBookings ? "..." : formatCurrency(earningsSummary.paid)}
              </p>
              <p className="text-xs text-emerald-800 font-medium mt-2">
                Released & credited to your registered bank account
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Payout Account Setup (Just-In-Time Payout) */}
      <Card className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-sm font-black">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-stone-900">Payout Account (मानधन खाते / UPI ID)</h3>
                {payoutUpi || artistData?.bankName ? (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                    ✓ Active
                  </Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-bold">
                    Pending Setup
                  </Badge>
                )}
              </div>
              <p className="text-xs text-stone-500 font-medium mt-0.5">
                {payoutUpi ? (
                  <span>
                    Direct Payout UPI ID: <strong className="text-stone-900 font-black">{payoutUpi}</strong>
                  </span>
                ) : artistData?.bankName ? (
                  <span>
                    Bank: <strong className="text-stone-900">{artistData.bankName}</strong> ({artistData.bankAccountMasked || "XXXX"})
                  </span>
                ) : (
                  "इव्हेंट पूर्ण झाल्यावर मानधन थेट खात्यात मिळवण्यासाठी तुमचा Google Pay / PhonePe UPI ID जोडा."
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isEditingPayout ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Input
                  placeholder="उदा. 9822123456@okaxis"
                  value={tempUpi}
                  onChange={(e) => setTempUpi(e.target.value)}
                  className="h-9 text-xs rounded-xl bg-stone-50 border-stone-200 w-52"
                />
                <Button
                  size="sm"
                  onClick={handleSavePayoutUpi}
                  disabled={savingUpi}
                  className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black"
                >
                  {savingUpi ? "Saving..." : "Save ✓"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingPayout(false)}
                  className="h-9 px-2 text-xs text-stone-500 font-bold"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => {
                  setTempUpi(payoutUpi);
                  setIsEditingPayout(true);
                }}
                className="h-9 px-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-black shadow-sm"
              >
                {payoutUpi || artistData?.bankName ? "Edit UPI ID" : "＋ Add UPI ID (GPay)"}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Escrow Guarantee Banner */}
      <Card className="rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50/50 p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-black text-stone-900">MyKalakar Guaranteed Escrow Payouts</p>
              <p className="text-xs text-stone-600 font-medium">
                Clients pay into escrow upfront. Once your performance is completed, funds are automatically released within 24 hours.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Transactions & Payouts Table */}
      <Card className="rounded-3xl border-stone-200 shadow-sm overflow-hidden bg-white">
        <CardHeader className="p-6 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-50/40">
          <div>
            <CardTitle className="text-lg font-extrabold text-stone-900">Booking Payout History</CardTitle>
            <p className="text-xs text-stone-500 font-medium mt-0.5">Itemized earnings per event and payment release status</p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-black transition ${
                filter === "ALL" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-900"
              }`}
            >
              All ({transactions.length})
            </button>
            <button
              onClick={() => setFilter("PENDING")}
              className={`px-3 py-1 rounded-lg text-xs font-black transition ${
                filter === "PENDING" ? "bg-white text-amber-700 shadow-sm" : "text-stone-500 hover:text-stone-900"
              }`}
            >
              Pending Escrow
            </button>
            <button
              onClick={() => setFilter("PAID")}
              className={`px-3 py-1 rounded-lg text-xs font-black transition ${
                filter === "PAID" ? "bg-white text-emerald-700 shadow-sm" : "text-stone-500 hover:text-stone-900"
              }`}
            >
              Paid Out
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-16 px-4">
              <IndianRupee className="h-12 w-12 text-stone-300 mx-auto mb-3" />
              <p className="text-base font-extrabold text-stone-700">No transactions found</p>
              <p className="text-xs text-stone-400 font-medium mt-1">
                Completed and confirmed booking payouts will appear here with detailed release notes.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50/60 text-stone-400 uppercase tracking-widest font-black text-[10px]">
                  <tr>
                    <th className="px-6 py-3.5">Customer & Event</th>
                    <th className="px-6 py-3.5">Event Date</th>
                    <th className="px-6 py-3.5">Booking Status</th>
                    <th className="px-6 py-3.5">Amount</th>
                    <th className="px-6 py-3.5">Payout Status</th>
                    <th className="px-6 py-3.5 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                  {filteredTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-stone-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="font-extrabold text-stone-900 text-sm">
                          {t.clientName || "Event Client"}
                        </div>
                        <div className="text-stone-400 text-xs truncate max-w-[200px]">
                          {t.performanceType || (t as any).eventType || "Performance"} • {t.venueLocation || "Venue"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-stone-600 font-semibold">
                        {formatDate(t.eventDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <BookingStatusBadge status={t.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-black text-stone-950 text-sm">
                        {formatCurrency(t.calculatedAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {t.payoutStatus === "PAID" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">
                            <CheckCircle2 className="h-3 w-3" /> Paid to Bank
                          </span>
                        ) : t.payoutStatus === "PENDING" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-black text-[10px]">
                            <Clock className="h-3 w-3" /> Escrow Hold
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 font-bold text-[10px]">
                            Inquiry Stage
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedBooking(t)}
                          className="h-8 px-3 rounded-lg font-bold text-xs hover:bg-orange-50 hover:text-orange-600"
                        >
                          View <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Detail Modal */}
      <BookingDetailModal
        booking={selectedBooking}
        open={Boolean(selectedBooking)}
        onOpenChange={(open) => !open && setSelectedBooking(null)}
        onStatusChange={updateStatus}
      />
    </div>
  );
}
