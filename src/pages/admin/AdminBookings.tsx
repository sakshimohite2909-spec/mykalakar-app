import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, Calendar, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore";

import { MapPin, Home, MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function AdminBookings() {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "inquiries"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInquiries(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateStatus = async (id: string, status: "confirmed" | "cancelled") => {
    try {
      await updateDoc(doc(db, "inquiries", id), { status });
      toast({ title: status === "confirmed" ? "Inquiry Confirmed ✅" : "Inquiry Cancelled" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not update status." });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold mb-1">Inquiries</h1>
        <p className="text-sm text-muted-foreground">{inquiries.length} total inquiries</p>
      </div>

      <Card>
        <CardContent className="p-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Artist</TableHead>
                <TableHead>Venue & Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : inquiries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No inquiries found.
                  </TableCell>
                </TableRow>
              ) : null}
              {inquiries.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-bold text-sm">{b.customerName}</p>
                      <p className="text-xs text-muted-foreground">{b.customerPhone}</p>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="link" className="p-0 h-auto text-[10px] text-primary">View Full Details</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Inquiry Details</DialogTitle></DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div><Label className="text-muted-foreground">Customer</Label><p className="font-semibold">{b.customerName}</p></div>
                              <div><Label className="text-muted-foreground">Phone</Label><p className="font-semibold">{b.customerPhone}</p></div>
                            </div>
                            <div><Label className="text-muted-foreground flex items-center gap-1"><Home className="h-3 w-3" /> Customer Address</Label><p className="text-sm bg-secondary/30 p-2 rounded-lg">{b.customerAddress}</p></div>
                            <div><Label className="text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Function Location</Label><p className="text-sm bg-primary/5 p-2 rounded-lg border border-primary/10">{b.eventLocation}</p></div>
                            <div className="grid grid-cols-2 gap-4">
                              <div><Label className="text-muted-foreground">Artist</Label><p className="font-semibold">{b.artistName}</p></div>
                              <div><Label className="text-muted-foreground">Event Type</Label><p className="font-semibold">{b.eventType}</p></div>
                            </div>
                            <div><Label className="text-muted-foreground flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Message</Label><p className="text-sm italic">"{b.message || "No message"}"</p></div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-primary">{b.artistName}</TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <p className="font-medium flex items-center gap-1"><MapPin className="h-3 w-3 text-primary" /> {b.eventLocation}</p>
                      <p className="text-muted-foreground">{b.eventType}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="flex items-center gap-1 font-medium"><Calendar className="h-3 w-3" /> {b.eventDate}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={b.status === "confirmed" ? "default" : b.status === "cancelled" ? "destructive" : "secondary"}
                      className={b.status === "confirmed" ? "gradient-bg border-0" : ""}
                    >
                      {b.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {b.status === "pending" && (
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => updateStatus(b.id, "confirmed")} className="hover:bg-green-50"><Check className="h-4 w-4 text-green-600" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => updateStatus(b.id, "cancelled")} className="hover:bg-red-50"><X className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
