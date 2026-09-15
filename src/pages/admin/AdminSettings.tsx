import { useEffect, useState } from "react";
import {
  Check,
  Loader2,
  Settings,
  ShieldCheck,
  X,
  Save,
  HelpCircle,
  Percent,
  DollarSign,
  Wallet,
  ArrowRight,
  Sparkles,
  Sliders,
  Plus,
  Trash2,
  Edit3,
  AlertTriangle,
  CheckCircle2,
  Power,
  Layers,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  findMatchingBudgetSlab,
  validateBudgetSlabs,
  DEFAULT_BUDGET_SLABS,
  type CommissionConfig,
  type CommissionSplitType,
  type BudgetSlab,
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
    budgetSlabs: DEFAULT_BUDGET_SLABS,
    notes: "डिफॉल्ट कमिशन: नफ्याच्या (मार्जिन) २०% टेलिकॉलरला आणि ८०% मायकलाकार ओनरकडे.",
  });
  const [budgetSlabs, setBudgetSlabs] = useState<BudgetSlab[]>(DEFAULT_BUDGET_SLABS);
  const [loadingCommission, setLoadingCommission] = useState(true);
  const [savingCommission, setSavingCommission] = useState(false);

  // Budget Slab CRUD state
  const [editingSlabId, setEditingSlabId] = useState<string | null>(null);
  const [isAddingSlab, setIsAddingSlab] = useState(false);
  const [slabForm, setSlabForm] = useState<Partial<BudgetSlab>>({
    minBudget: 0,
    maxBudget: 25000,
    marginPct: 20,
    commissionPct: 20,
    isActive: true,
    slabName: "",
  });
  const [slabValidationWarning, setSlabValidationWarning] = useState<string | null>(null);

  // Live Simulator sandbox state
  const [simBudget, setSimBudget] = useState<number>(30000);
  const [simArtistOffer, setSimArtistOffer] = useState<number>(24000);

  useEffect(() => {
    let unsub = () => {};
    try {
      // Simple single-field query — no composite index needed
      const q = query(collection(db, "admin_requests"), where("status", "==", "pending"));
      unsub = onSnapshot(
        q,
        (snap) => {
          setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          setLoading(false);
        },
        (error) => {
          console.warn("Firestore admin_requests notice:", error);
          // Graceful fallback to local cache
          try {
            const raw = localStorage.getItem("mykalakar_admin_requests");
            if (raw) {
              const localList = JSON.parse(raw);
              setRequests(Array.isArray(localList) ? localList.filter((r: any) => r.status === "pending") : []);
            } else {
              setRequests([]);
            }
          } catch {
            setRequests([]);
          }
          setLoading(false);
        }
      );
    } catch (err) {
      console.warn("Firestore admin_requests initialization notice:", err);
      setRequests([]);
      setLoading(false);
    }
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
        if (cfg.budgetSlabs && cfg.budgetSlabs.length > 0) {
          setBudgetSlabs(cfg.budgetSlabs);
        } else {
          setBudgetSlabs(DEFAULT_BUDGET_SLABS);
        }
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

  // Slab CRUD handlers
  const handleStartAddSlab = () => {
    const nextMin = budgetSlabs.length > 0
      ? Math.max(...budgetSlabs.map((s) => (typeof s.maxBudget === "number" && s.maxBudget > 0 ? s.maxBudget : s.minBudget))) + 1
      : 0;
    setSlabForm({
      id: `slab-${Date.now()}`,
      minBudget: nextMin,
      maxBudget: nextMin + 25000,
      marginPct: 20,
      commissionPct: 20,
      isActive: true,
      slabName: `Slab ${budgetSlabs.length + 1}`,
    });
    setEditingSlabId(null);
    setIsAddingSlab(true);
    setSlabValidationWarning(null);
  };

  const handleStartEditSlab = (slab: BudgetSlab) => {
    setSlabForm({ ...slab });
    setEditingSlabId(slab.id);
    setIsAddingSlab(false);
    setSlabValidationWarning(null);
  };

  const handleSaveSlabForm = () => {
    const min = Number(slabForm.minBudget) || 0;
    const max = typeof slabForm.maxBudget === "number" && slabForm.maxBudget > 0 ? Number(slabForm.maxBudget) : undefined;
    const margin = Number(slabForm.marginPct) || 0;
    const comm = Number(slabForm.commissionPct) || 0;

    if (min < 0) {
      setSlabValidationWarning("किमान बजेट ० पेक्षा कमी असू शकत नाही.");
      return;
    }
    if (typeof max === "number" && min > max) {
      setSlabValidationWarning(`किमान बजेट (₹${min.toLocaleString("en-IN")}) हे कमाल बजेट (₹${max.toLocaleString("en-IN")}) पेक्षा मोठे असू शकत नाही.`);
      return;
    }
    if (margin < 0 || margin > 100) {
      setSlabValidationWarning("मार्जिन % ० ते १०० दरम्यान असावे.");
      return;
    }
    if (comm < 0 || comm > 100) {
      setSlabValidationWarning("कमिशन % ० ते १०० दरम्यान असावे.");
      return;
    }

    const newSlab: BudgetSlab = {
      id: slabForm.id || `slab-${Date.now()}`,
      minBudget: min,
      maxBudget: max,
      marginPct: margin,
      commissionPct: comm,
      isActive: slabForm.isActive !== false,
      slabName: slabForm.slabName || (max ? `₹${min.toLocaleString("en-IN")} – ₹${max.toLocaleString("en-IN")}` : `₹${min.toLocaleString("en-IN")}+`),
      notes: slabForm.notes,
    };

    let updatedList: BudgetSlab[] = [];
    if (editingSlabId) {
      updatedList = budgetSlabs.map((s) => (s.id === editingSlabId ? newSlab : s));
    } else {
      updatedList = [...budgetSlabs, newSlab];
    }

    // Sort by minBudget ascending
    updatedList.sort((a, b) => a.minBudget - b.minBudget);

    const validation = validateBudgetSlabs(updatedList);
    if (!validation.isValid) {
      setSlabValidationWarning(validation.error || "Overlap detected.");
      return;
    }

    setBudgetSlabs(updatedList);
    setIsAddingSlab(false);
    setEditingSlabId(null);
    setSlabValidationWarning(null);
    toast({
      title: "स्लॅब तयार/अपडेट झाला! ✅",
      description: `${newSlab.slabName} नियमांमध्ये जोडला. सेव्ह करण्यासाठी खाली 'Save Settings' दाबा.`,
    });
  };

  const handleDeleteSlab = (id: string) => {
    if (budgetSlabs.length <= 1) {
      toast({
        variant: "destructive",
        title: "कमीत कमी १ स्लॅब आवश्यक आहे",
        description: "तुम्ही सर्व स्लॅब्स हटवू शकत नाही.",
      });
      return;
    }
    const updated = budgetSlabs.filter((s) => s.id !== id);
    setBudgetSlabs(updated);
    if (editingSlabId === id) {
      setEditingSlabId(null);
      setIsAddingSlab(false);
    }
    toast({ title: "स्लॅब हटवला 🗑️", description: "स्लॅब यादीतून काढण्यात आला." });
  };

  const handleToggleSlabActive = (id: string) => {
    const updated = budgetSlabs.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s));
    setBudgetSlabs(updated);
  };

  const handleCancelSlabForm = () => {
    setIsAddingSlab(false);
    setEditingSlabId(null);
    setSlabValidationWarning(null);
  };

  const handleCancelAllChanges = async () => {
    try {
      const cfg = await fetchCommissionConfig();
      setCommissionConfig(cfg);
      setBudgetSlabs(cfg.budgetSlabs || DEFAULT_BUDGET_SLABS);
      setIsAddingSlab(false);
      setEditingSlabId(null);
      setSlabValidationWarning(null);
      toast({ title: "बदल रद्द केले 🔄", description: "मूळ सेव्ह केलेले नियम पुन्हा लोड केले." });
    } catch {
      setBudgetSlabs(DEFAULT_BUDGET_SLABS);
    }
  };

  const handleSaveCommission = async () => {
    // Validate budget slabs
    const validation = validateBudgetSlabs(budgetSlabs);
    if (!validation.isValid) {
      toast({
        variant: "destructive",
        title: "बजेट स्लॅब त्रुटी (Validation Warning) ⚠️",
        description: validation.error,
      });
      return;
    }

    setSavingCommission(true);
    try {
      const payload: Partial<CommissionConfig> = {
        ...commissionConfig,
        budgetSlabs,
      };
      const updated = await updateCommissionConfig(payload);
      await logAdminActivity(
        "admin@mykalakar.com",
        "SAVE_COMMISSION_CONFIG",
        `Budget Slabs & Commission updated: ${budgetSlabs.length} slabs configured.`
      );
      toast({
        title: "बजेट व कमिशन नियम सेव्ह केले! 💰",
        description: `${budgetSlabs.length} बजेट स्लॅब्स आणि मार्जिन-कमिशन सूत्र यशस्वीरीत्या लागू केले.`,
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

      {/* ── Budget & Commission Settings Module ── */}
      <Card className="border-2 border-orange-500/20 shadow-md overflow-hidden bg-gradient-to-br from-white via-orange-50/20 to-amber-50/20 dark:from-slate-900 dark:to-slate-800">
        <CardHeader className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent border-b pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-[#FF6B00] text-white rounded-xl shadow-sm">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">
                  Budget & Commission Settings (बजेट स्लॅब व कमिशन नियम)
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  ग्राहकाच्या बजेटनुसार मार्जिन %, आर्टिस्ट मानधन, टेलिकॉलर कमिशन (Gross Margin वर) आणि मायकलाकार नफा ठरवा.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-orange-600 text-white font-bold px-3 py-1 w-fit">
                👑 Admin Control
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {loadingCommission ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-12">
              {/* Left Column: Budget Slabs Table & Management */}
              <div className="lg:col-span-7 space-y-5">
                {/* 1. Slabs Header & Add Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <Label className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Sliders className="h-4 w-4 text-[#FF6B00]" />
                      बजेट स्लॅब्स यादी (Budget-wise Margin & Commission Rules)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      प्रत्येक स्लॅबसाठी किमान बजेट, कमाल बजेट, मार्जिन % आणि कमिशन % ठरवा.
                    </p>
                  </div>
                  {!isAddingSlab && !editingSlabId && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleStartAddSlab}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl h-8.5 px-3.5 shadow-2xs flex items-center gap-1 shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      नवीन स्लॅब जोडा (Add Slab)
                    </Button>
                  )}
                </div>

                {/* Validation Warning Alert if any */}
                {slabValidationWarning && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2 shadow-2xs">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-bold">बजेट स्लॅब व्हॅलिडेशन चेतावणी (Validation Alert)</p>
                      <p>{slabValidationWarning}</p>
                    </div>
                  </div>
                )}

                {/* Inline Add / Edit Slab Form */}
                {(isAddingSlab || editingSlabId) && (
                  <div className="p-4 rounded-2xl bg-orange-50/70 border-2 border-orange-300 dark:bg-slate-900 dark:border-orange-700 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-orange-200 pb-2">
                      <span className="text-xs font-black uppercase tracking-wider text-orange-900 dark:text-orange-300 flex items-center gap-1.5">
                        <Edit3 className="h-3.5 w-3.5" />
                        {editingSlabId ? "स्लॅब एडिट करा (Edit Budget Slab)" : "नवीन बजेट स्लॅब (Create New Slab)"}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelSlabForm}
                        className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600 rounded-full"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          किमान बजेट (Min Budget ₹) *
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          value={slabForm.minBudget ?? ""}
                          onChange={(e) => setSlabForm({ ...slabForm, minBudget: Number(e.target.value) || 0 })}
                          placeholder="उदा. 0 किंवा 25001"
                          className="h-9 text-xs font-bold bg-white mt-1 rounded-xl"
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          कमाल बजेट (Max Budget ₹) (रिक्त = ५०,००१+)
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          value={slabForm.maxBudget && slabForm.maxBudget < 99999999 ? slabForm.maxBudget : ""}
                          onChange={(e) => {
                            const val = e.target.value ? Number(e.target.value) : undefined;
                            setSlabForm({ ...slabForm, maxBudget: val });
                          }}
                          placeholder="उदा. 25000 (किंवा अमर्यादसाठी रिक्त)"
                          className="h-9 text-xs font-bold bg-white mt-1 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                          मार्जिन % (Margin %) *
                        </Label>
                        <div className="relative mt-1">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={slabForm.marginPct ?? ""}
                            onChange={(e) => setSlabForm({ ...slabForm, marginPct: Number(e.target.value) || 0 })}
                            placeholder="20"
                            className="h-9 text-xs font-black text-emerald-700 pr-7 bg-white rounded-xl"
                            required
                          />
                          <span className="absolute right-2.5 top-2.5 text-xs font-bold text-slate-400">%</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">ग्राहक बजेटमधून मायकलाकारचा नफा</span>
                      </div>

                      <div>
                        <Label className="text-[11px] font-bold text-blue-800 dark:text-blue-300">
                          कमिशन % (Commission on Gross Margin) *
                        </Label>
                        <div className="relative mt-1">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={slabForm.commissionPct ?? ""}
                            onChange={(e) => setSlabForm({ ...slabForm, commissionPct: Number(e.target.value) || 0 })}
                            placeholder="20"
                            className="h-9 text-xs font-black text-blue-700 pr-7 bg-white rounded-xl"
                            required
                          />
                          <span className="absolute right-2.5 top-2.5 text-xs font-bold text-slate-400">%</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">ग्रॉस मार्जिनमधून टेलिकॉलरला हिस्सा</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={slabForm.isActive !== false}
                          onCheckedChange={(checked) => setSlabForm({ ...slabForm, isActive: checked })}
                          id="slab-active-switch"
                        />
                        <Label htmlFor="slab-active-switch" className="text-xs font-bold text-slate-700 cursor-pointer">
                          {slabForm.isActive !== false ? "सक्रिय (Active Slab)" : "निष्क्रिय (Inactive Slab)"}
                        </Label>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCancelSlabForm}
                          className="h-8 px-3 text-xs rounded-xl"
                        >
                          रद्द करा (Cancel)
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleSaveSlabForm}
                          className="h-8 px-4 text-xs font-black rounded-xl bg-orange-600 hover:bg-orange-700 text-white shadow-2xs"
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          स्लॅब सेव्ह करा (Save Slab)
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Slabs Table */}
                <div className="rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-stone-50/90 dark:bg-slate-800/80 border-b border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-bold uppercase tracking-wider text-[10px]">
                          <th className="py-3 px-3.5">बजेट स्लॅब (Range)</th>
                          <th className="py-3 px-3 text-center">मार्जिन %</th>
                          <th className="py-3 px-3 text-center">कमिशन % (Gross Margin)</th>
                          <th className="py-3 px-3 text-center">स्थिती (Status)</th>
                          <th className="py-3 px-3.5 text-right">कृती (Actions)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-slate-800">
                        {budgetSlabs.map((slab, idx) => {
                          const isMaxInf = !slab.maxBudget || slab.maxBudget >= 99999999;
                          const rangeLabel = isMaxInf
                            ? `₹${slab.minBudget.toLocaleString("en-IN")}+`
                            : `₹${slab.minBudget.toLocaleString("en-IN")} – ₹${slab.maxBudget?.toLocaleString("en-IN")}`;

                          return (
                            <tr
                              key={slab.id || idx}
                              className={`transition hover:bg-orange-50/40 dark:hover:bg-slate-800/50 ${
                                !slab.isActive ? "opacity-50 bg-stone-50/40" : ""
                              }`}
                            >
                              <td className="py-3 px-3.5 font-bold text-stone-900 dark:text-stone-100">
                                <div className="flex items-center gap-2">
                                  <span className="h-2 w-2 rounded-full bg-[#FF6B00]"></span>
                                  <span>{slab.slabName || `Slab ${idx + 1}`}:</span>
                                  <span className="text-orange-950 dark:text-orange-300 font-black">{rangeLabel}</span>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-black">
                                  {slab.marginPct}%
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-black">
                                  {slab.commissionPct}%
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleSlabActive(slab.id)}
                                  className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full transition cursor-pointer ${
                                    slab.isActive
                                      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                      : "bg-stone-200 text-stone-600 hover:bg-stone-300"
                                  }`}
                                >
                                  <span className={`h-1.5 w-1.5 rounded-full ${slab.isActive ? "bg-emerald-600" : "bg-stone-500"}`}></span>
                                  {slab.isActive ? "Active" : "Inactive"}
                                </button>
                              </td>
                              <td className="py-3 px-3.5 text-right">
                                <div className="inline-flex items-center gap-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleStartEditSlab(slab)}
                                    className="h-7 w-7 p-0 text-stone-600 hover:text-stone-900 rounded-lg"
                                    title="Edit Slab"
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteSlab(slab.id)}
                                    disabled={budgetSlabs.length <= 1}
                                    className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg disabled:opacity-30"
                                    title="Delete Slab"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Action Buttons: Save Settings & Cancel */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <Button
                    type="button"
                    onClick={handleSaveCommission}
                    disabled={savingCommission}
                    className="flex-1 w-full bg-[#FF6B00] hover:bg-[#e86100] text-white py-3 h-11 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-orange-500/20"
                  >
                    {savingCommission ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    बजेट व कमिशन नियम सेव्ह करा (Save Settings)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelAllChanges}
                    className="w-full sm:w-auto h-11 px-4 rounded-xl border-stone-200 text-stone-600 font-bold flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="h-4 w-4" />
                    रद्द करा (Cancel Changes)
                  </Button>
                </div>
              </div>

              {/* Right Column: Interactive Live Simulation Box */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-2xl border-2 border-orange-200/80 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-[#FF6B00]" />
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      लाईव्ह हिशोब पडताळणी (Live Simulator)
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase font-black text-orange-600 bg-orange-50">
                    Auto-Detected Slabs
                  </Badge>
                </div>

                {/* Input: Customer Budget */}
                <div>
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    ग्राहक बजेट (Customer Budget)
                  </Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-2.5 text-xs font-black text-emerald-600">₹</span>
                    <Input
                      type="number"
                      value={simBudget || ""}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setSimBudget(val);
                        const matched = findMatchingBudgetSlab(val, budgetSlabs);
                        const m = matched ? matched.marginPct : 20;
                        setSimArtistOffer(val > 0 ? Math.round(val * (1 - m / 100)) : 0);
                      }}
                      className="pl-7 h-9 text-xs font-black text-emerald-800 bg-emerald-50/40 border-emerald-200 rounded-xl"
                      placeholder="30000"
                    />
                  </div>
                </div>

                {/* Simulation Breakdown Details */}
                {(() => {
                  const matched = findMatchingBudgetSlab(simBudget, budgetSlabs);
                  const marginPct = matched ? matched.marginPct : 20;
                  const commPct = matched ? matched.commissionPct : 20;
                  const safeBudget = simBudget || 0;
                  const safeArtist = simArtistOffer > 0 ? simArtistOffer : (safeBudget > 0 ? Math.round(safeBudget * (1 - marginPct / 100)) : 0);
                  const grossMargin = Math.max(0, safeBudget - safeArtist);
                  const commAmt = Math.round((grossMargin * commPct) / 100);
                  const netMargin = Math.max(0, grossMargin - commAmt);

                  return (
                    <div className="space-y-3">
                      {/* Applicable Slab Pill */}
                      <div className="p-2.5 rounded-xl bg-gradient-to-r from-orange-100/70 to-amber-100/70 border border-orange-200 flex items-center justify-between text-xs">
                        <span className="font-bold text-orange-950">Applicable Budget Slab:</span>
                        <span className="font-black text-orange-800 bg-white/90 px-2.5 py-0.5 rounded-full shadow-2xs">
                          {matched ? (matched.slabName || `₹${matched.minBudget.toLocaleString("en-IN")} – ${matched.maxBudget ? `₹${matched.maxBudget.toLocaleString("en-IN")}` : "+"}`) : "No Active Slab (Default 20%)"}
                        </span>
                      </div>

                      {/* 6-Field Detailed Breakdown Grid */}
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border space-y-2 text-xs">
                        <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                          <span>Customer Budget</span>
                          <span className="font-black text-emerald-700 text-sm">₹{safeBudget.toLocaleString("en-IN")}</span>
                        </div>

                        <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                          <span>Margin ({marginPct}%)</span>
                          <span className="font-bold text-emerald-800">₹{grossMargin.toLocaleString("en-IN")}</span>
                        </div>

                        <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 pt-1 border-t border-dashed">
                          <span>Artist Payout</span>
                          <span className="font-black text-stone-900 dark:text-white">₹{safeArtist.toLocaleString("en-IN")}</span>
                        </div>

                        <div className="flex justify-between items-center text-blue-700 dark:text-blue-300 pt-1 border-t border-dashed">
                          <span>Commission ({commPct}% of Gross Margin)</span>
                          <span className="font-black text-blue-800 dark:text-blue-200 text-sm">₹{commAmt.toLocaleString("en-IN")}</span>
                        </div>

                        <div className="flex justify-between items-center text-emerald-900 dark:text-emerald-200 pt-1 border-t-2 border-emerald-300 font-black">
                          <span>Net Margin (MyKalakar Profit)</span>
                          <span className="font-black text-emerald-800 text-sm">₹{netMargin.toLocaleString("en-IN")}</span>
                        </div>
                      </div>

                      {/* Formula explanation */}
                      <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/80 text-[10px] text-amber-950 space-y-1">
                        <p className="font-bold">📐 सूत्र (Business Logic):</p>
                        <p>• Gross Margin = Customer Budget (₹{safeBudget.toLocaleString("en-IN")}) - Artist Payout (₹{safeArtist.toLocaleString("en-IN")}) = <strong>₹{grossMargin.toLocaleString("en-IN")}</strong></p>
                        <p>• Commission = Gross Margin (₹{grossMargin.toLocaleString("en-IN")}) × {commPct}% = <strong>₹{commAmt.toLocaleString("en-IN")}</strong></p>
                        <p>• Net Margin = Gross Margin (₹{grossMargin.toLocaleString("en-IN")}) - Commission (₹{commAmt.toLocaleString("en-IN")}) = <strong>₹{netMargin.toLocaleString("en-IN")}</strong></p>
                      </div>
                    </div>
                  );
                })()}
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

