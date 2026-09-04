import { useEffect, useState } from "react";
import { Check, Loader2, Settings, ShieldCheck, X, Save, HelpCircle, Percent, DollarSign, Wallet, ArrowRight, Sparkles, Sliders } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { approveAdminRequest, rejectAdminRequest } from "@/lib/adminQueries";
import { firebaseErrorMessage, toastForFirestoreError } from "@/lib/firebaseSafe";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { fetchRefundPolicy, saveRefundPolicy, logAdminActivity } from "@/services/artistBookingService";
import type { RefundPolicy } from "@/types/booking";
import {
  fetchCommissionConfig,
  updateCommissionConfig,
  calculateCommissionSplit,
  type CommissionConfig,
  type CommissionSplitType,
} from "@/services/commissionSettingsService";

export default function AdminSettings() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Policy states
  const [policy, setPolicy] = useState<RefundPolicy>({
    thirtyPlusDays: 100,
    fifteenToThirtyDays: 75,
    sevenToFourteenDays: 50,
    lessThanSevenDays: 0,
  });
  const [loadingPolicy, setLoadingPolicy] = useState(true);
  const [savingPolicy, setSavingPolicy] = useState(false);

  // Commission & Profit Split states
  const [commissionConfig, setCommissionConfig] = useState<CommissionConfig>({
    splitType: "margin_percentage",
    telecallerPercentage: 20,
    ownerPercentage: 80,
    flatBonusPerBooking: 0,
    minimumBookingThreshold: 1000,
    notes: "डिफॉल्ट कमिशन: नफ्याच्या (मार्जिन) २०% टेलिकॉलरला आणि ८०% मायकलाकार ओनरकडे.",
  });
  const [loadingCommission, setLoadingCommission] = useState(true);
  const [savingCommission, setSavingCommission] = useState(false);

  // Live Simulator sandbox state
  const [simBudget, setSimBudget] = useState<number>(10000);
  const [simArtistOffer, setSimArtistOffer] = useState<number>(8000);

  useEffect(() => {
    // Simple single-field query — no composite index needed
    const q = query(collection(db, "admin_requests"), where("status", "==", "pending"));
    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (error) => {
      toastForFirestoreError(error, "Admin requests unavailable", "Could not load admin requests.", toast);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Fetch configured policies
  useEffect(() => {
    async function loadPolicy() {
      try {
        const rules = await fetchRefundPolicy();
        setPolicy(rules);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPolicy(false);
      }
    }
    loadPolicy();
  }, []);

  // Fetch Commission Settings
  useEffect(() => {
    async function loadCommission() {
      try {
        const cfg = await fetchCommissionConfig();
        setCommissionConfig(cfg);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCommission(false);
      }
    }
    loadCommission();
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 600);
  };

  const approve = async (id: string) => {
    setBusyId(id);
    try {
      await approveAdminRequest(id);
      toast({ title: "Admin access granted", description: "The user can now sign in to the admin panel." });
    } catch (error) {
      toast({ variant: "destructive", title: "Approval failed", description: firebaseErrorMessage(error, "Could not approve admin access.") });
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id: string) => {
    setBusyId(id);
    try {
      await rejectAdminRequest(id);
      toast({ title: "Admin request rejected", description: "The account was returned to normal user access." });
    } catch (error) {
      toast({ variant: "destructive", title: "Rejection failed", description: firebaseErrorMessage(error, "Could not reject admin access.") });
    } finally {
      setBusyId(null);
    }
  };

  const handleSavePolicy = async () => {
    setSavingPolicy(true);
    try {
      await saveRefundPolicy(policy);
      await logAdminActivity(
        "admin@mykalakar.com",
        "SAVE_REFUND_POLICY",
        `Refund policy updated: 30d/${policy.thirtyPlusDays}%, 15-30d/${policy.fifteenToThirtyDays}%, 7-14d/${policy.sevenToFourteenDays}%, <7d/${policy.lessThanSevenDays}%`
      );
      toast({ title: "Refund Policy Saved", description: "Cancellation policy rules updated globally." });
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to save policy", description: "Could not write to platform settings." });
    } finally {
      setSavingPolicy(false);
    }
  };

  const handleSaveCommission = async () => {
    setSavingCommission(true);
    try {
      const updated = await updateCommissionConfig(commissionConfig);
      await logAdminActivity(
        "admin@mykalakar.com",
        "SAVE_COMMISSION_CONFIG",
        `Commission updated: Type=${updated.splitType}, Telecaller=${updated.telecallerPercentage}%, Owner=${updated.ownerPercentage}%, Bonus=₹${updated.flatBonusPerBooking}`
      );
      toast({
        title: "कमिशन नियम सेव्ह केले! 💰",
        description: `टेलिकॉलर: ${updated.telecallerPercentage}% | मायकलाकार ओनर: ${updated.ownerPercentage}% यशस्वीरित्या लागू केले.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to save commission",
        description: "कमिशन नियम सेव्ह करता आले नाहीत.",
      });
    } finally {
      setSavingCommission(false);
    }
  };

  const updatePolicyField = (field: keyof RefundPolicy, val: string) => {
    const num = Number(val);
    if (!isNaN(num)) {
      setPolicy(prev => ({ ...prev, [field]: num }));
    }
  };

  const handleTelecallerPctChange = (val: string) => {
    const pct = Math.min(100, Math.max(0, Number(val) || 0));
    setCommissionConfig(prev => ({
      ...prev,
      telecallerPercentage: pct,
      ownerPercentage: 100 - pct,
    }));
  };

  const handleOwnerPctChange = (val: string) => {
    const pct = Math.min(100, Math.max(0, Number(val) || 0));
    setCommissionConfig(prev => ({
      ...prev,
      ownerPercentage: pct,
      telecallerPercentage: 100 - pct,
    }));
  };

  // Live calculation for preview
  const liveSplit = calculateCommissionSplit(simBudget, simArtistOffer, commissionConfig);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold mb-1">Settings</h1>
          <p className="text-sm text-muted-foreground">Admin access, commission distribution, and platform configuration</p>
        </div>
        <Badge variant="outline" className="w-fit border-orange-200 bg-orange-50 px-3 py-1 text-orange-700">
          <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
          Secure admin approvals & controls
        </Badge>
      </div>

      {/* ── NEW: Telecaller & MyKalakar Commission & Profit Authority ── */}
      <Card className="border-2 border-orange-500/20 shadow-md overflow-hidden bg-gradient-to-br from-white via-orange-50/20 to-amber-50/20 dark:from-slate-900 dark:to-slate-800">
        <CardHeader className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent border-b pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-[#FF6B00] text-white rounded-xl shadow-sm">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">
                  टेलिकॉलर व मायकलाकार ओनर कमिशन वाटप (Commission & Profit Authority)
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  येथे ठरवा की प्रत्येक बुकिंगवर टेलिकॉलरला किती टक्के (%) कमिशन द्यायचे आणि मायकलाकारकडे किती नफा राहायचा.
                </p>
              </div>
            </div>
            <Badge className="bg-orange-600 text-white font-bold px-3 py-1 w-fit">
              👑 Admin Only
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {loadingCommission ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-12">
              {/* Left Column: Model & Percentage Configuration */}
              <div className="lg:col-span-7 space-y-5">
                {/* 1. Split Model Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    १. कमिशन मोजण्याची पद्धत (Commission Calculation Model)
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setCommissionConfig(prev => ({ ...prev, splitType: "margin_percentage" }))}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                        commissionConfig.splitType === "margin_percentage"
                          ? "border-[#FF6B00] bg-orange-50/70 dark:bg-orange-950/30 text-slate-900 dark:text-white shadow-sm ring-2 ring-orange-500/20"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-sm text-[#FF6B00]">📈 नफ्यावरील % (Margin Split)</span>
                        {commissionConfig.splitType === "margin_percentage" && <Check className="h-4 w-4 text-[#FF6B00]" />}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        (ग्राहक बजेट - आर्टिस्ट मानधन) = प्लॅटफॉर्म नफा. या नफ्यावरून टेलिकॉलरला टक्केवारी दिली जाते. <strong className="text-orange-600 font-semibold">[शिफारस]</strong>
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCommissionConfig(prev => ({ ...prev, splitType: "total_booking_percentage" }))}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                        commissionConfig.splitType === "total_booking_percentage"
                          ? "border-[#FF6B00] bg-orange-50/70 dark:bg-orange-950/30 text-slate-900 dark:text-white shadow-sm ring-2 ring-orange-500/20"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-sm text-[#FF6B00]">📊 एकूण बुकिंग % (Total Value)</span>
                        {commissionConfig.splitType === "total_booking_percentage" && <Check className="h-4 w-4 text-[#FF6B00]" />}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        थेट संपूर्ण डील व्हॅल्यूच्या (Total Booking Amount) ठरावीक % टेलिकॉलरला कमिशन दिले जाते.
                      </p>
                    </button>
                  </div>
                </div>

                {/* 2. Percentage Controls */}
                <div className="space-y-4 pt-2">
                  <Label className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    २. टक्केवारी वाटप (Percentage Distribution)
                  </Label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Telecaller % */}
                    <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-blue-900 dark:text-blue-300">
                          📞 Telecaller Commission %
                        </Label>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 font-bold">
                          {commissionConfig.telecallerPercentage}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={commissionConfig.telecallerPercentage}
                          onChange={(e) => handleTelecallerPctChange(e.target.value)}
                          className="font-bold text-lg text-center h-11 bg-white dark:bg-slate-900"
                        />
                        <span className="font-bold text-slate-500">%</span>
                      </div>
                      <p className="text-[11px] text-blue-700 dark:text-blue-400">
                        प्रत्येक डील क्लोज केल्यावर टेलिकॉलरला जाणारा हिस्सा.
                      </p>
                    </div>

                    {/* MyKalakar Owner % */}
                    <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                          🏢 MyKalakar Owner Share %
                        </Label>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 font-bold">
                          {commissionConfig.ownerPercentage}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={commissionConfig.ownerPercentage}
                          onChange={(e) => handleOwnerPctChange(e.target.value)}
                          className="font-bold text-lg text-center h-11 bg-white dark:bg-slate-900"
                        />
                        <span className="font-bold text-slate-500">%</span>
                      </div>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                        प्लॅटफॉर्म आणि ओनरकडे शिल्लक राहणारा निव्वळ हिस्सा.
                      </p>
                    </div>
                  </div>

                  {/* Optional Flat Bonus */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border space-y-1.5">
                      <Label className="text-xs font-semibold">अतिरिक्त फ्लॅट बोनस (Flat Incentive per Lead)</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">₹</span>
                        <Input
                          type="number"
                          min={0}
                          value={commissionConfig.flatBonusPerBooking}
                          onChange={(e) => setCommissionConfig(prev => ({ ...prev, flatBonusPerBooking: Number(e.target.value) || 0 }))}
                          className="h-9 font-semibold text-center"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border space-y-1.5">
                      <Label className="text-xs font-semibold">किमान बुकिंग मर्यादा (Min Threshold)</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">₹</span>
                        <Input
                          type="number"
                          min={0}
                          value={commissionConfig.minimumBookingThreshold}
                          onChange={(e) => setCommissionConfig(prev => ({ ...prev, minimumBookingThreshold: Number(e.target.value) || 0 }))}
                          className="h-9 font-semibold text-center"
                          placeholder="1000"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <Button
                  onClick={handleSaveCommission}
                  disabled={savingCommission}
                  className="w-full bg-[#FF6B00] hover:bg-[#e86100] text-white py-3 h-12 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-orange-500/20"
                >
                  {savingCommission ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  कमिशन नियम सेव्ह करा (Save Commission Settings)
                </Button>
              </div>

              {/* Right Column: Interactive Live Simulation Box */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-2xl border-2 border-orange-200/60 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-[#FF6B00]" />
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      लाईव्ह हिशोब पडताळणी (Live Simulator)
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold text-orange-600 bg-orange-50">
                    Preview
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">ग्राहक बजेट (Deal Budget)</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">₹</span>
                      <Input
                        type="number"
                        value={simBudget}
                        onChange={(e) => setSimBudget(Number(e.target.value) || 0)}
                        className="pl-6 h-8 text-xs font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">आर्टिस्ट मानधन (Artist Offer)</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">₹</span>
                      <Input
                        type="number"
                        value={simArtistOffer}
                        onChange={(e) => setSimArtistOffer(Number(e.target.value) || 0)}
                        className="pl-6 h-8 text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 border text-xs">
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>प्लॅटफॉर्म मार्जिन / Gross Profit:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      ₹{liveSplit.grossMargin.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>वापरलेली पद्धत:</span>
                    <span className="font-semibold text-orange-600">
                      {liveSplit.splitType === "margin_percentage" ? "Margin %" : "Total Booking %"}
                    </span>
                  </div>
                </div>

                {/* Final Split Result Cards */}
                <div className="space-y-2.5">
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-blue-700 dark:text-blue-300">
                        📞 Telecaller Earnings
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        ({liveSplit.telecallerCommissionPct}% {liveSplit.splitType === "margin_percentage" ? "of margin" : "of deal"} {liveSplit.flatBonus > 0 ? `+ ₹${liveSplit.flatBonus} bonus` : ""})
                      </p>
                    </div>
                    <span className="text-lg font-black text-blue-800 dark:text-blue-200">
                      ₹{liveSplit.telecallerCommission.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                        🏢 MyKalakar Owner Profit
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        (प्लॅटफॉर्मकडे निव्वळ नफा)
                      </p>
                    </div>
                    <span className="text-lg font-black text-emerald-800 dark:text-emerald-200">
                      ₹{liveSplit.ownerProfit.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground text-center italic">
                  💡 टेलिकॉलरने डील बुक केली की सिस्टीम वरील सूत्रानुसार त्वरित कमिशन नोंदवेल.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Admin Approvals */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Pending Admin Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">Approve requests for administrative console permissions.</p>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : requests.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground text-sm">
                No admin requests are waiting for approval.
              </div>
            ) : (
              <div className="grid gap-4">
                {requests.map((request) => (
                  <div key={request.id} className="rounded-2xl border bg-secondary/20 p-4 space-y-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-sm font-bold">{request.name || "Unnamed admin"}</h3>
                        <Badge variant="secondary">{request.username}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{request.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => approve(request.id)} disabled={busyId === request.id} className="w-1/2 gradient-bg border-0 text-primary-foreground text-xs py-2">
                        Approve
                      </Button>
                      <Button variant="outline" onClick={() => reject(request.id)} disabled={busyId === request.id} className="w-1/2 border-destructive/30 text-destructive hover:bg-destructive/10 text-xs py-2">
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configurable Cancellation & Refund Policies */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-1.5">
              <Settings className="h-5 w-5 text-orange-600" />
              Cancellation & Escrow Refund Policies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure what percentage of the escrow deposit is returned to clients depending on cancellation timeframes.
            </p>

            {loadingPolicy ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2 border-l-2 border-[#FF6B00] pl-3 py-1 bg-[#FF6B00]/5 rounded-r-xl">
                  <div className="grid grid-cols-2 items-center gap-2 text-sm font-semibold">
                    <Label>30+ Days before Event Refund</Label>
                    <Input
                      type="number"
                      max={100}
                      min={0}
                      value={policy.thirtyPlusDays}
                      onChange={(e) => updatePolicyField("thirtyPlusDays", e.target.value)}
                      className="w-24 justify-self-end text-center"
                    />
                  </div>
                </div>

                <div className="space-y-2 border-l-2 border-amber-500 pl-3 py-1 bg-amber-500/5 rounded-r-xl">
                  <div className="grid grid-cols-2 items-center gap-2 text-sm font-semibold">
                    <Label>15–30 Days Refund</Label>
                    <Input
                      type="number"
                      max={100}
                      min={0}
                      value={policy.fifteenToThirtyDays}
                      onChange={(e) => updatePolicyField("fifteenToThirtyDays", e.target.value)}
                      className="w-24 justify-self-end text-center"
                    />
                  </div>
                </div>

                <div className="space-y-2 border-l-2 border-yellow-500 pl-3 py-1 bg-yellow-500/5 rounded-r-xl">
                  <div className="grid grid-cols-2 items-center gap-2 text-sm font-semibold">
                    <Label>7–14 Days Refund</Label>
                    <Input
                      type="number"
                      max={100}
                      min={0}
                      value={policy.sevenToFourteenDays}
                      onChange={(e) => updatePolicyField("sevenToFourteenDays", e.target.value)}
                      className="w-24 justify-self-end text-center"
                    />
                  </div>
                </div>

                <div className="space-y-2 border-l-2 border-rose-500 pl-3 py-1 bg-rose-500/5 rounded-r-xl">
                  <div className="grid grid-cols-2 items-center gap-2 text-sm font-semibold">
                    <Label>Less than 7 Days Refund</Label>
                    <Input
                      type="number"
                      max={100}
                      min={0}
                      value={policy.lessThanSevenDays}
                      onChange={(e) => updatePolicyField("lessThanSevenDays", e.target.value)}
                      className="w-24 justify-self-end text-center"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSavePolicy}
                  disabled={savingPolicy}
                  className="w-full bg-[#FF6B00] hover:bg-[#e86100] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-1.5"
                >
                  {savingPolicy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Policy Rates
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

