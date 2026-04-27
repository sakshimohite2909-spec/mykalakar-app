import { Card, CardContent } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold mb-1">Settings</h1>
        <p className="text-sm text-muted-foreground">Platform configuration</p>
      </div>
      <Card>
        <CardContent className="p-12 text-center">
          <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-lg font-semibold mb-2">Settings Coming Soon</h3>
          <p className="text-sm text-muted-foreground">Platform settings will be available once you connect your database.</p>
        </CardContent>
      </Card>
    </div>
  );
}
