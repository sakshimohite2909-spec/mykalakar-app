import { CalendarCheck, CheckCircle2, Clock3, Hourglass, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export interface BookingSummary {
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  upcoming: number;
}

const SUMMARY_ITEMS = [
  { key: "pending", label: "Pending Requests", icon: Hourglass, color: "text-zinc-500", bg: "bg-zinc-500/10" },
  { key: "confirmed", label: "Confirmed Bookings", icon: CheckCircle2, color: "text-[#FF6B00]", bg: "bg-[#FF6B00]/10" },
  { key: "completed", label: "Completed Events", icon: CalendarCheck, color: "text-emerald-600", bg: "bg-emerald-500/10" },
  { key: "cancelled", label: "Cancelled Bookings", icon: XCircle, color: "text-red-600", bg: "bg-red-500/10" },
  { key: "upcoming", label: "Upcoming Events", icon: Clock3, color: "text-blue-600", bg: "bg-blue-500/10" },
] as const;

export function BookingSummaryCards({
  summary,
  loading = false,
}: {
  summary: BookingSummary;
  loading?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {SUMMARY_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.key} className="border-border/60 bg-card/70 shadow-sm backdrop-blur-xl">
            <CardContent className="p-4">
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${item.bg}`}>
                <Icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <p className="text-2xl font-bold">{loading ? "..." : summary[item.key]}</p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">{item.label}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
