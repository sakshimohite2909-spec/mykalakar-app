/**
 * Admin Bootstrap — runs directly in the browser as a page.
 * Fixes:
 *   1. Creates admins/{uid} for any admin_requests with status=approved but missing admins doc
 *   2. Migrates all approved artist_applications → artists/{uid}
 *   3. Ensures all users/{uid} have correct role/status
 */
import { useState } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import {
  collection, getDocs, query, where, doc, getDoc,
  setDoc, writeBatch, serverTimestamp,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ShieldCheck, Users, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Log { type: "ok" | "warn" | "err"; msg: string }

export default function AdminBootstrap() {
  const { currentUser } = useAuth();
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<Log[]>([]);

  const addLog = (type: Log["type"], msg: string) =>
    setLogs(prev => [...prev, { type, msg }]);

  const run = async () => {
    if (!currentUser) { toast({ variant: "destructive", title: "Not logged in" }); return; }
    setRunning(true);
    setLogs([]);

    try {
      // ── STEP 1: Fix approved admin_requests that have no admins/{uid} doc ────
      addLog("ok", "Checking admin_requests...");
      const adminReqs = await getDocs(
        query(collection(db, "admin_requests"), where("status", "==", "approved"))
      );
      addLog("ok", `Found ${adminReqs.size} approved admin request(s)`);

      for (const d of adminReqs.docs) {
        const data = d.data();
        const uid = data.uid;
        if (!uid) { addLog("warn", `Skipped request ${d.id} — no uid`); continue; }

        const adminRef = doc(db, "admins", uid);
        const adminSnap = await getDoc(adminRef);
        if (adminSnap.exists()) {
          addLog("ok", `admins/${uid} already exists (${data.name})`);
          continue;
        }

        const batch = writeBatch(db);
        batch.set(adminRef, {
          uid,
          name: data.name || "",
          username: data.username || "",
          email: data.email || "",
          mobileNumber: data.mobileNumber || "",
          capName: data.capName || "",
          bloodGroup: data.bloodGroup || "",
          about: data.about || "",
          role: "admin",
          status: "active",
          approvedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        batch.set(doc(db, "users", uid), {
          uid,
          name: data.name || "",
          username: data.username || "",
          email: data.email || "",
          phone: data.mobileNumber || "",
          role: "admin",
          status: "active",
          updatedAt: serverTimestamp(),
        }, { merge: true });
        await batch.commit();
        addLog("ok", `✅ Created admins/${uid} for ${data.name}`);
      }

      // ── STEP 2: Migrate approved artist_applications → artists/{uid} ────────
      addLog("ok", "Checking artist_applications...");
      const apps = await getDocs(
        query(collection(db, "artist_applications"), where("status", "==", "approved"))
      );
      addLog("ok", `Found ${apps.size} approved artist application(s)`);

      for (const d of apps.docs) {
        const data = d.data();
        const uid = data.uid;
        if (!uid) { addLog("warn", `Skipped app ${d.id} — no uid`); continue; }

        const artistRef = doc(db, "artists", uid);
        const artistSnap = await getDoc(artistRef);
        if (artistSnap.exists() && artistSnap.data()?.status === "active") {
          addLog("ok", `artists/${uid} already active (${data.name})`);
          continue;
        }

        const primaryArt = Array.isArray(data.artsList) ? data.artsList[0] || {} : {};
        const batch = writeBatch(db);
        batch.set(artistRef, {
          uid,
          applicationId: d.id,
          username: data.username || "",
          name: data.name || "",
          brandName: data.brandName || "",
          email: data.email || "",
          mobileNumber: data.mobileNumber || data.phone || "",
          state: data.state || "",
          district: data.district || data.city || "",
          bio: data.bio || "",
          experience: Number(data.experience) || 0,
          availability: data.availability || "available",
          category: data.category || primaryArt.category || "",
          subcategory: data.subcategory || "",
          categories: data.categories || [data.category].filter(Boolean),
          artsList: data.artsList || [],
          pricing: data.pricing || {
            soloPrice: Number(data.soloPrice) || 0,
            duoPrice: Number(data.duoPrice) || 0,
            teamPrice: Number(data.teamPrice) || 0,
          },
          media: data.media || {
            profilePhoto: data.profilePhoto || "",
            coverPhoto: data.coverPhoto || "",
            galleryPhotos: data.galleryPhotos || [],
          },
          socialLinks: data.socialLinks || [],
          stats: { rating: 0, reviews: 0, followers: 0, profileViews: 0, totalBookings: 0 },
          status: "active",
          verified: true,
          trending: false,
          approvedAt: serverTimestamp(),
          createdAt: data.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });

        batch.set(doc(db, "users", uid), {
          uid,
          name: data.name || "",
          username: data.username || "",
          email: data.email || "",
          phone: data.mobileNumber || data.phone || "",
          role: "artist",
          status: "active",
          updatedAt: serverTimestamp(),
        }, { merge: true });

        await batch.commit();
        addLog("ok", `✅ Migrated artist: ${data.name} (${uid})`);
      }

      addLog("ok", "🎉 Bootstrap complete! Refresh the page to see changes.");
      toast({ title: "Bootstrap Complete ✅", description: "All data has been fixed." });
    } catch (err: any) {
      addLog("err", `Error: ${err?.message || String(err)}`);
      toast({ variant: "destructive", title: "Error", description: err?.message || "Bootstrap failed." });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold mb-1 flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" /> Admin Bootstrap Tool
        </h1>
        <p className="text-sm text-muted-foreground">
          Fixes stuck admin approvals and syncs approved artists to the public listing.
        </p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6 space-y-4">
          <p className="text-sm font-medium">This tool will:</p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
            <li>Create <code>admins/&#123;uid&#125;</code> for any approved admin requests that are stuck</li>
            <li>Migrate all approved artist applications into the <code>artists</code> collection</li>
            <li>Ensure <code>users/&#123;uid&#125;</code> has the correct role and status</li>
          </ul>
          <Button
            onClick={run}
            disabled={running}
            className="gradient-bg border-0 text-primary-foreground font-semibold w-full h-12"
          >
            {running ? <><Loader2 className="h-5 w-5 animate-spin mr-2" />Running...</> : "🚀 Run Bootstrap Fix"}
          </Button>
        </CardContent>
      </Card>

      {logs.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-1 font-mono text-xs max-h-80 overflow-y-auto">
            {logs.map((l, i) => (
              <div key={i} className={`flex items-start gap-2 ${l.type === "err" ? "text-red-500" : l.type === "warn" ? "text-yellow-600" : "text-foreground"}`}>
                {l.type === "ok" ? <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-green-500" />
                  : l.type === "warn" ? <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-yellow-500" />
                  : <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-red-500" />}
                <span>{l.msg}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
