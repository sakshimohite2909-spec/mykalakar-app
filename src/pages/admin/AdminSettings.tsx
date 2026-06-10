import { useEffect, useState } from "react";
import { Check, Loader2, Settings, ShieldCheck, X, Save, HelpCircle } from "lucide-react";
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

  const updatePolicyField = (field: keyof RefundPolicy, val: string) => {
    const num = Number(val);
    if (!isNaN(num)) {
      setPolicy(prev => ({ ...prev, [field]: num }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold mb-1">Settings</h1>
          <p className="text-sm text-muted-foreground">Admin access and platform configuration</p>
        </div>
        <Badge variant="outline" className="w-fit border-orange-200 bg-orange-50 px-3 py-1 text-orange-700">
          <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
          Secure admin approvals
        </Badge>
      </div>

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
