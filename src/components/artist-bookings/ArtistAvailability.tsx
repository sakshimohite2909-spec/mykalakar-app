import { useState } from "react";
import { Ban, CalendarOff, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { addAvailabilityBlock, deleteAvailabilityBlock } from "@/services/artistBookingService";
import type { ArtistAvailabilityBlock } from "@/types/booking";

function formatDate(date: string) {
  if (!date) return "Date not provided";
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ArtistAvailability({
  artistId,
  availability,
  loading,
}: {
  artistId: string;
  availability: ArtistAvailabilityBlock[];
  loading?: boolean;
}) {
  const [blockedDate, setBlockedDate] = useState("");
  const [reasonType, setReasonType] = useState("Unavailable Date");
  const [customNotes, setCustomNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleAddBlock = async () => {
    if (!blockedDate) {
      toast({ variant: "destructive", title: "Date required", description: "Choose a date to block." });
      return;
    }

    if (availability.some((block) => block.blockedDate === blockedDate)) {
      toast({ variant: "destructive", title: "Date already blocked", description: "This date is already unavailable." });
      return;
    }

    setSaving(true);
    try {
      const reason = [reasonType, customNotes.trim()].filter(Boolean).join(": ");
      await addAvailabilityBlock(artistId, blockedDate, reason);
      setBlockedDate("");
      setCustomNotes("");
      toast({ title: "Availability updated", description: "The selected date is now blocked." });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not save availability",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveBlock = async (blockId: string) => {
    setRemovingId(blockId);
    try {
      await deleteAvailabilityBlock(blockId);
      toast({ title: "Date unblocked", description: "The date is available again." });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not remove date",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
      <Card className="border-border/60 bg-card/75 shadow-sm backdrop-blur-xl">
        <CardContent className="space-y-4 p-5">
          <div>
            <h2 className="font-display text-xl font-bold">Manage Availability</h2>
            <p className="mt-1 text-sm text-muted-foreground">Blocked dates appear disabled in the calendar and stop booking acceptance.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="blockedDate">Block Date</Label>
            <Input id="blockedDate" type="date" value={blockedDate} onChange={(event) => setBlockedDate(event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={reasonType} onValueChange={setReasonType}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Unavailable Date">Unavailable Date</SelectItem>
                <SelectItem value="Vacation Day">Vacation Day</SelectItem>
                <SelectItem value="Personal Commitment">Personal Commitment</SelectItem>
                <SelectItem value="Travel Day">Travel Day</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customNotes">Custom Notes</Label>
            <Textarea
              id="customNotes"
              value={customNotes}
              onChange={(event) => setCustomNotes(event.target.value)}
              placeholder="Add details for this blocked date"
              rows={3}
            />
          </div>

          <Button className="w-full bg-[#FF6B00] text-white hover:bg-[#e86100]" onClick={handleAddBlock} disabled={saving || !artistId}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Block Date
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/75 shadow-sm backdrop-blur-xl">
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold">Blocked Dates</h2>
              <p className="text-sm text-muted-foreground">{availability.length} unavailable dates</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
              <CalendarOff className="h-5 w-5 text-red-600" />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-10">
              <Loader2 className="h-7 w-7 animate-spin text-[#FF6B00]" />
            </div>
          ) : availability.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-secondary/30 p-8 text-center">
              <Ban className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <h3 className="font-semibold">No blocked dates yet.</h3>
              <p className="mt-1 text-sm text-muted-foreground">Vacation days and unavailable dates will appear here.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {availability.map((block) => (
                <div key={block.id} className="rounded-xl border border-border/60 bg-background/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold">{formatDate(block.blockedDate)}</p>
                      <p className="mt-1 break-words text-sm text-muted-foreground">{block.reason || "Unavailable"}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleRemoveBlock(block.id)}
                      disabled={removingId === block.id}
                      aria-label="Remove blocked date"
                    >
                      {removingId === block.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
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
