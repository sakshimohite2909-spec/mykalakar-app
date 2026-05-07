import { useEffect, useState } from "react";
import { Check, Loader2, Settings, ShieldCheck, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { approveAdminRequest, rejectAdminRequest } from "@/lib/adminQueries";
import { firebaseErrorMessage, toastForFirestoreError } from "@/lib/firebaseSafe";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";

export default function AdminSettings() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

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

  // onSnapshot keeps requests live — no manual refresh needed
  const handleRefresh = () => {
    setLoading(true);
    // The snapshot listener auto-updates; just briefly show loading
    setTimeout(() => setLoading(false), 600);
  };


  const approve = async (id: string) => {
    setBusyId(id);
    try {
      await approveAdminRequest(id);
      toast({ title: "Admin access granted", description: "The user can now sign in to the admin panel." });
      // onSnapshot will automatically remove the approved request from the list
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
      // onSnapshot will automatically remove the rejected request from the list
    } catch (error) {
      toast({ variant: "destructive", title: "Rejection failed", description: firebaseErrorMessage(error, "Could not reject admin access.") });
    } finally {
      setBusyId(null);
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

      <Card>
        <CardContent className="p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold">Pending Admin Requests</h2>
              <p className="text-sm text-muted-foreground">Approve only trusted people who should manage the whole platform.</p>
            </div>
            <Button variant="outline" onClick={handleRefresh} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Settings className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : requests.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
              No admin requests are waiting for approval.
            </div>
          ) : (
            <div className="grid gap-4">
              {requests.map((request) => (
                <div key={request.id} className="rounded-2xl border bg-secondary/20 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-lg font-bold">{request.name || "Unnamed admin"}</h3>
                        <Badge variant="secondary">{request.username}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{request.email}</p>
                      <p className="text-sm text-muted-foreground">{request.mobileNumber || "No phone"} · {request.capName || "No cap name"}</p>
                      {request.about ? <p className="max-w-3xl pt-2 text-sm text-foreground/80">{request.about}</p> : null}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button onClick={() => approve(request.id)} disabled={busyId === request.id} className="gradient-bg border-0 text-primary-foreground">
                        {busyId === request.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                        Approve
                      </Button>
                      <Button variant="outline" onClick={() => reject(request.id)} disabled={busyId === request.id} className="border-destructive/30 text-destructive hover:bg-destructive/10">
                        <X className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
