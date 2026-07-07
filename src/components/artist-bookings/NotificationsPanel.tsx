import { useState } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { markNotificationRead } from "@/services/artistBookingService";
import type { BookingNotification } from "@/types/booking";
import { cn } from "@/lib/utils";

function formatDate(date: string) {
  if (!date) return "";
  return new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function NotificationsPanel({
  notifications,
  loading,
}: {
  notifications: BookingNotification[];
  loading?: boolean;
}) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleMarkRead = async (notificationId: string) => {
    setUpdatingId(notificationId);
    try {
      await markNotificationRead(notificationId);
      toast({ title: "Notification updated", description: "Marked as read." });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not update notification",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-border/60 bg-card/60 p-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B00]" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card className="border-dashed border-border/70 bg-card/60">
        <CardContent className="p-10 text-center">
          <Bell className="mx-auto mb-3 h-12 w-12 text-muted-foreground/35" />
          <h3 className="text-lg font-semibold">No notifications yet.</h3>
          <p className="mt-1 text-sm text-muted-foreground">Live booking notifications will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {notifications.map((notification) => (
        <Card
          key={notification.id}
          className={cn(
            "border-border/60 bg-card/75 shadow-sm backdrop-blur-xl",
            !notification.read && "border-[#FF6B00]/35 bg-[#FF6B00]/5"
          )}
        >
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 rounded-full", notification.read ? "bg-muted-foreground/30" : "bg-[#FF6B00]")} />
                <h3 className="font-semibold">{notification.title}</h3>
              </div>
              <p className="break-words text-sm text-muted-foreground">{notification.message}</p>
              <p className="mt-2 text-xs text-muted-foreground">{formatDate(notification.createdAt)}</p>
            </div>
            {!notification.read && (
              <Button
                variant="outline"
                size="sm"
                className="sm:flex-shrink-0"
                onClick={() => handleMarkRead(notification.id)}
                disabled={updatingId === notification.id}
              >
                {updatingId === notification.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCheck className="mr-2 h-4 w-4" />}
                Mark Read
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
