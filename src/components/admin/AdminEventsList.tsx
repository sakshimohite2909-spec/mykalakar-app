import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, updateDoc, doc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Edit, Calendar } from "lucide-react";
import AdminEditEventModal from "./AdminEditEventModal";

export default function AdminEventsList() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);

  useEffect(() => {
    const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEvents(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/60 overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event Name</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-stone-400 font-bold">
                  No events found.
                </TableCell>
              </TableRow>
            ) : null}
            {events.map((ev) => {
              let dateStr = "Date flexible";
              if (ev.eventDate instanceof Timestamp) {
                dateStr = ev.eventDate.toDate().toLocaleDateString("en-IN");
              } else if (ev.eventDate?.seconds) {
                dateStr = new Date(ev.eventDate.seconds * 1000).toLocaleDateString("en-IN");
              } else if (ev.date) {
                dateStr = String(ev.date);
              }

              return (
                <TableRow key={ev.id}>
                  <TableCell className="font-bold text-stone-900">
                    {ev.eventName || ev.title || "Unnamed Event"}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-semibold">{ev.postedByName || "User"}</p>
                    <p className="text-xs text-stone-400">{ev.postedByEmail}</p>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5 text-sm text-stone-600">
                      <Calendar className="h-3.5 w-3.5" />
                      {dateStr}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`capitalize font-bold text-xs ${ev.status === 'approved' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                      {ev.status || "pending"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => setEditingEvent(ev)}
                      className="inline-flex h-8 items-center justify-center rounded-lg border border-stone-200 bg-white px-3 text-xs font-bold text-stone-600 hover:bg-stone-50 transition"
                    >
                      <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {editingEvent && (
        <AdminEditEventModal
          eventData={editingEvent}
          open={!!editingEvent}
          onClose={() => setEditingEvent(null)}
        />
      )}
    </div>
  );
}
