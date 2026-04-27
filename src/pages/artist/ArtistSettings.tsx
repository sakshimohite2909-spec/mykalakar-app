import { motion } from "framer-motion";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Settings, Lock, Mail, Loader2, Eye, EyeOff, Shield, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ArtistSettings() {
    const { currentUser, artistData, changePassword, logout } = useAuth();
    const navigate = useNavigate();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPasswords, setShowPasswords] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentPassword || !newPassword || !confirmPassword) {
            toast({ variant: "destructive", title: "Error", description: "Please fill all fields." });
            return;
        }

        if (newPassword !== confirmPassword) {
            toast({ variant: "destructive", title: "Error", description: "New passwords don't match." });
            return;
        }

        if (newPassword.length < 6) {
            toast({ variant: "destructive", title: "Error", description: "Password must be at least 6 characters." });
            return;
        }

        setLoading(true);
        const result = await changePassword(currentPassword, newPassword);

        if (result.success) {
            toast({ title: "Password Changed! 🔐", description: result.message });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } else {
            toast({ variant: "destructive", title: "Error", description: result.message });
        }
        setLoading(false);
    };

    const handleLogout = async () => {
        await logout();
        toast({ title: "Logged Out", description: "You've been logged out successfully." });
        navigate("/artist-login");
    };

    return (
        <div className="space-y-6 max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="font-display text-2xl font-bold mb-1">Account Settings</h1>
                <p className="text-sm text-muted-foreground">Manage your account security</p>
            </motion.div>

            {/* Account Info */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <Card>
                    <CardContent className="p-6 space-y-4">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Mail className="h-5 w-5 text-primary" /> Account Information
                        </h3>

                        <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Email (Login ID)</span>
                                <span className="text-sm font-medium">{currentUser?.email || "Not set"}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Account Status</span>
                                <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${artistData?.status === "approved" ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600"
                                    }`}>
                                    {artistData?.status || "Unknown"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Verified</span>
                                <span className="text-sm font-medium">{artistData?.verified ? "✅ Yes" : "❌ No"}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Change Password */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card>
                    <CardContent className="p-6 space-y-4">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Lock className="h-5 w-5 text-primary" /> Change Password
                        </h3>

                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <Label>Current Password</Label>
                                <div className="relative">
                                    <Input
                                        type={showPasswords ? "text" : "password"}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Enter current password"
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords(!showPasswords)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                    >
                                        {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <Label>New Password</Label>
                                <Input
                                    type={showPasswords ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password (min 6 chars)"
                                />
                            </div>

                            <div>
                                <Label>Confirm New Password</Label>
                                <Input
                                    type={showPasswords ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full gradient-bg border-0 text-primary-foreground"
                                disabled={loading}
                            >
                                {loading ? (
                                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Updating...</>
                                ) : (
                                    <><Shield className="h-4 w-4 mr-2" /> Update Password</>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Danger Zone */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <Card className="border-destructive/20">
                    <CardContent className="p-6 space-y-4">
                        <h3 className="font-semibold text-destructive flex items-center gap-2">
                            <LogOut className="h-5 w-5" /> Danger Zone
                        </h3>

                        <Button variant="destructive" onClick={handleLogout} className="w-full">
                            <LogOut className="h-4 w-4 mr-2" /> Logout from Account
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
