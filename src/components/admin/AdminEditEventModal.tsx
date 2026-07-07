import { useState, useEffect } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Loader2, Edit3, Tag } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AdminEditEventModalProps {
  open: boolean;
  onClose: () => void;
  eventData: any;
}

export default function AdminEditEventModal({ open, onClose, eventData }: AdminEditEventModalProps) {
  const [eventName, setEventName] = useState("");
  const [totalBudget, setTotalBudget] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [performanceType, setPerformanceType] = useState("");
  const [status, setStatus] = useState("pending");
  const [requirements, setRequirements] = useState("");
  const [categoriesStr, setCategoriesStr] = useState(""); // Comma separated for easy editing
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (eventData && open) {
      setEventName(eventData.eventName || eventData.title || eventData.name || "");
      setTotalBudget(String(eventData.totalBudget || eventData.budget || ""));
      setLocation(eventData.location || eventData.city || "");
      setPerformanceType(eventData.performanceType || eventData.type || "");
      setStatus(eventData.status || "pending");
      setRequirements(eventData.requirements || eventData.professionalRequirements || "");
      
      const cats = eventData.categories || [];
      setCategoriesStr(Array.isArray(cats) ? cats.join(", ") : "");

      // Handle Timestamp or string date
      if (eventData.eventDate?.toDate) {
        setEventDate(eventData.eventDate.toDate().toISOString().split("T")[0]);
      } else if (eventData.eventDate?.seconds) {
        setEventDate(new Date(eventData.eventDate.seconds * 1000).toISOString().split("T")[0]);
      } else {
        setEventDate(eventData.date || "");
      }
    }
  }, [eventData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const budgetNum = Number(totalBudget) || 0;
      const catsArray = categoriesStr.split(",").map(c => c.trim()).filter(Boolean);
      
      // We will only update string date for simplicity if they edit it, 
      // but ideally we'd preserve timestamp. To keep it simple, we store it as string 
      // or recreate timestamp.
      const payload = {
        eventName: eventName.trim(),
        totalBudget: budgetNum,
        location: location.trim(),
        date: eventDate, // Keep as string for ease, or convert to Timestamp
        performanceType: performanceType.trim(),
        requirements: requirements.trim(),
        categories: catsArray,
        status: status,
        updatedByAdmin: true,
        lastModifiedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, "events", eventData.id), payload);
      
      toast({
        title: "Event Updated",
        description: "Admin modifications saved successfully with audit trail.",
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: err.message || "Could not save event modifications.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-10 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-4">
            <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-orange-600" /> Deep Edit Event
            </h2>
            <button onClick={onClose} className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 transition">
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-500">Event Name</label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full h-10 rounded-xl border border-stone-200 px-3 text-sm font-semibold outline-none focus:border-orange-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-500">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-10 rounded-xl border border-stone-200 px-3 text-sm font-semibold outline-none focus:border-orange-500"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-500">Total Budget (₹)</label>
                <input
                  type="number"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(e.target.value)}
                  className="w-full h-10 rounded-xl border border-stone-200 px-3 text-sm font-semibold outline-none focus:border-orange-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-500">Event Date</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full h-10 rounded-xl border border-stone-200 px-3 text-sm font-semibold outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-500">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full h-10 rounded-xl border border-stone-200 px-3 text-sm font-semibold outline-none focus:border-orange-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-500">Performance Type</label>
                <input
                  type="text"
                  value={performanceType}
                  onChange={(e) => setPerformanceType(e.target.value)}
                  className="w-full h-10 rounded-xl border border-stone-200 px-3 text-sm font-semibold outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-500 flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" /> Tags (Comma separated)
              </label>
              <input
                type="text"
                value={categoriesStr}
                onChange={(e) => setCategoriesStr(e.target.value)}
                placeholder="e.g. Wedding, Orchestra, Singers"
                className="w-full h-10 rounded-xl border border-stone-200 px-3 text-sm font-semibold outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-500">Professional Requirements</label>
              <textarea
                rows={4}
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                className="w-full rounded-xl border border-stone-200 p-3 text-sm font-semibold outline-none focus:border-orange-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={onClose}
                className="px-5 h-10 rounded-xl text-sm font-bold text-stone-600 hover:bg-stone-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 h-10 rounded-xl bg-stone-900 text-white text-sm font-bold flex items-center gap-2 hover:bg-stone-800 transition disabled:opacity-70"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
