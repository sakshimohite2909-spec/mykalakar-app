import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LogIn, UserPlus, Lock, Mail, User, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useI18n } from "@/i18n/I18nProvider";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  title?: string;
  description?: string;
}

export function AuthModal({
  open,
  onOpenChange,
  onSuccess,
  title,
  description,
}: AuthModalProps) {
  const { t } = useI18n();
  const { login, register } = useAuth();
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setName("");
    setConfirmPassword("");
    setErrorMsg("");
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim() || !password.trim()) {
      setErrorMsg("कृपया ईमेल आणि पासवर्ड प्रविष्ट करा.");
      return;
    }

    if (!isLoginTab) {
      if (password.length < 6) {
        setErrorMsg("पासवर्ड किमान ६ अक्षरांचा असावा.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg("पासवर्ड जुळत नाहीत.");
        return;
      }
    }

    setLoading(true);
    try {
      if (isLoginTab) {
        const res = await login(email.trim(), password);
        if (res.success) {
          toast({
            title: "लॉगिन यशस्वी!",
            description: "तुमच्या खात्यामध्ये स्वागत आहे.",
          });
          handleClose(false);
          if (onSuccess) onSuccess();
        } else {
          setErrorMsg(res.message || "लॉगिन करण्यात त्रुटी आली. कृपया तपासा.");
        }
      } else {
        const res = await register(email.trim(), password);
        if (res.success) {
          toast({
            title: "रजिस्ट्रेशन यशस्वी!",
            description: "तुमचे खाते तयार झाले आहे.",
          });
          handleClose(false);
          if (onSuccess) onSuccess();
        } else {
          setErrorMsg(res.message || "साइन अप करण्यात त्रुटी आली.");
        }
      }
    } catch (err: any) {
      console.error("AuthModal error:", err);
      setErrorMsg(err.message || "ऑथेंटिकेशन करताना त्रुटी आली.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[420px] rounded-3xl p-6 bg-white border border-stone-200 shadow-2xl overflow-hidden">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 shadow-inner">
            <ShieldCheck className="h-6 w-6 stroke-[2.5]" />
          </div>
          <DialogTitle className="text-xl font-extrabold text-stone-900 tracking-tight">
            {title || (isLoginTab ? "खात्यामध्ये लॉगिन करा" : "नवीन खाते तयार करा")}
          </DialogTitle>
          <DialogDescription className="text-xs font-semibold text-stone-500 mt-1">
            {description || "बुकिंग, चौकशी पाठवणे आणि कलाकारांची माहिती जतन करण्यासाठी लॉगिन आवश्यक आहे."}
          </DialogDescription>
        </DialogHeader>

        {/* Auth Tab Toggle */}
        <div className="grid grid-cols-2 rounded-2xl bg-stone-100 p-1 mb-4 text-xs font-extrabold">
          <button
            type="button"
            onClick={() => {
              setIsLoginTab(true);
              setErrorMsg("");
            }}
            className={`py-2 rounded-xl transition-all duration-200 ${
              isLoginTab
                ? "bg-white text-orange-600 shadow-xs"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            लॉगिन (Login)
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLoginTab(false);
              setErrorMsg("");
            }}
            className={`py-2 rounded-xl transition-all duration-200 ${
              !isLoginTab
                ? "bg-white text-orange-600 shadow-xs"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            साइन अप (Sign Up)
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 border border-red-200 text-xs font-bold text-red-600 text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLoginTab && (
            <div>
              <Label className="text-xs font-extrabold text-stone-700">पूर्ण नाव (Full Name)</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <Input
                  type="text"
                  placeholder="उदा. राहुल पाटील"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9 rounded-xl border-stone-200 text-xs font-semibold"
                />
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs font-extrabold text-stone-700">ईमेल (Email Address)</Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
              <Input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 rounded-xl border-stone-200 text-xs font-semibold"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-extrabold text-stone-700">पासवर्ड (Password)</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
              <Input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 rounded-xl border-stone-200 text-xs font-semibold"
              />
            </div>
          </div>

          {!isLoginTab && (
            <div>
              <Label className="text-xs font-extrabold text-stone-700">पासवर्डची खात्री करा (Confirm Password)</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-9 rounded-xl border-stone-200 text-xs font-semibold"
                />
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-sm shadow-md transition-all active:scale-98"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isLoginTab ? (
              <span className="flex items-center justify-center gap-2">
                <LogIn className="h-4 w-4" /> लॉगिन करा
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <UserPlus className="h-4 w-4" /> साइन अप करा
              </span>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
