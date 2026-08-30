import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  QrCode,
  Upload,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Copy,
  ExternalLink,
  Smartphone,
  CreditCard,
} from "lucide-react";
import {
  type PaymentConfig,
  getLocalPaymentConfig,
  updatePaymentConfig,
} from "@/services/paymentSettingsService";
import { fileToOptimizedDataUrl } from "@/utils/imageCompression";

interface TelecallerQRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (config: PaymentConfig) => void;
}

export default function TelecallerQRModal({
  open,
  onOpenChange,
  onSaved,
}: TelecallerQRModalProps) {
  const [config, setConfig] = useState<PaymentConfig>(getLocalPaymentConfig());
  const [upiId, setUpiId] = useState(config.upiId);
  const [upiName, setUpiName] = useState(config.upiName);
  const [qrImageUrl, setQrImageUrl] = useState(config.qrImageUrl);
  const [websiteUrl, setWebsiteUrl] = useState(config.websiteUrl || "https://mykalakar.com");
  const [notes, setNotes] = useState(config.notes || "");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      const current = getLocalPaymentConfig();
      setConfig(current);
      setUpiId(current.upiId);
      setUpiName(current.upiName);
      setQrImageUrl(current.qrImageUrl);
      setWebsiteUrl(current.websiteUrl || "https://mykalakar.com");
      setNotes(current.notes || "");
    }
  }, [open]);

  // Upload custom QR Image
  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast({ title: "Uploading QR Code... ⏳", description: "Optimizing image for fast display." });
      const dataUrl = await fileToOptimizedDataUrl(file, 800, 0.85);
      setQrImageUrl(dataUrl);
      toast({ title: "QR Code Uploaded! ✓", description: "Click Save Settings to apply." });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Upload Failed", description: "Could not process QR image." });
    }
  };

  // Generate dynamic QR from UPI ID
  const handleGenerateDynamicQr = () => {
    if (!upiId.trim()) {
      toast({ variant: "destructive", title: "Enter UPI ID", description: "Please enter a valid UPI ID first." });
      return;
    }
    const cleanUpi = upiId.trim();
    const cleanName = encodeURIComponent(upiName.trim() || "MyKalakar");
    const dynamicUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(`upi://pay?pa=${cleanUpi}&pn=${cleanName}&cu=INR`)}`;
    setQrImageUrl(dynamicUrl);
    toast({ title: "Dynamic QR Generated! ⚡", description: `Linked to UPI ID: ${cleanUpi}` });
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast({ title: "Copied! 📋", description: `UPI ID ${upiId} copied to clipboard.` });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiId.trim()) {
      toast({ variant: "destructive", title: "UPI ID Required", description: "Please enter the company UPI ID." });
      return;
    }

    setSaving(true);
    try {
      const updated = await updatePaymentConfig({
        upiId: upiId.trim(),
        upiName: upiName.trim() || "MyKalakar",
        qrImageUrl: qrImageUrl || config.qrImageUrl,
        websiteUrl: websiteUrl.trim() || "https://mykalakar.com",
        notes: notes.trim(),
      });

      toast({
        title: "Payment Settings Saved! 🎉",
        description: "Updated QR Code and UPI ID will be used for all WhatsApp messages and client checkout screens.",
      });

      if (onSaved) onSaved(updated);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Save Failed", description: "Could not save payment settings." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg rounded-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto bg-white border border-stone-200 shadow-2xl">
        <DialogHeader className="border-b border-stone-100 pb-3">
          <DialogTitle className="font-display text-lg sm:text-xl font-black text-stone-900 flex items-center gap-2">
            <QrCode className="h-5 w-5 text-orange-600 shrink-0" />
            <span>कंपनी UPI व QR Code सेटिंग्स</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-stone-500 font-semibold">
            येथे ॲड केलेला UPI ID व QR Code सर्व ग्राहकांना WhatsApp पेमेंट मेसेज आणि वेबसाइट चेकआउटवर थेट दिसेल.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 py-2">
          {/* Live QR Code Preview Box */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/90 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="h-32 w-32 shrink-0 bg-white p-2 rounded-xl border border-stone-200 shadow-sm flex items-center justify-center overflow-hidden">
              {qrImageUrl ? (
                <img
                  src={qrImageUrl}
                  alt="Payment QR Code"
                  className="h-full w-full object-contain"
                />
              ) : (
                <QrCode className="h-16 w-16 text-stone-300" />
              )}
            </div>

            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-black text-stone-900 truncate">
                  {upiName || "MyKalakar Payments"}
                </span>
              </div>
              <div className="flex items-center gap-1 bg-white border border-stone-200 px-2.5 py-1 rounded-lg w-fit">
                <span className="text-xs font-mono font-bold text-stone-800 truncate select-all">
                  {upiId || "mykalakar@icici"}
                </span>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="text-stone-400 hover:text-stone-700 ml-1"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-stone-500 font-semibold">
                PhonePe, Google Pay, Paytm व सर्व बँकिंग UPI ॲप्स सपोर्टेड.
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-stone-700 flex items-center justify-between">
                <span>कंपनी / बँक UPI ID *</span>
                <span className="text-[10px] text-stone-400 font-normal">उदा. mykalakar@icici, 9876543210@ybl</span>
              </Label>
              <Input
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="उदा. mykalakar@icici"
                className="h-10 text-xs font-mono font-bold bg-stone-50/50"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-stone-700">मर्चंट / कंपनी नाव</Label>
              <Input
                value={upiName}
                onChange={(e) => setUpiName(e.target.value)}
                placeholder="उदा. MyKalakar Events & Entertainment"
                className="h-10 text-xs bg-stone-50/50"
              />
            </div>

            {/* QR Options: Upload or Auto-Generate */}
            <div className="pt-1 space-y-2">
              <Label className="text-xs font-bold text-stone-700 block">QR कोड इमेज स्रोत (QR Source)</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-stone-300 hover:border-orange-500 hover:bg-orange-50/50 cursor-pointer transition-all text-xs font-bold text-stone-700 bg-white">
                  <Upload className="h-4 w-4 text-orange-600" />
                  <span>खरा QR फोटो अपलोड करा</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleQrUpload}
                    className="hidden"
                  />
                </label>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerateDynamicQr}
                  className="h-auto py-2.5 rounded-xl text-xs font-bold text-stone-700 flex items-center justify-center gap-1.5 hover:bg-stone-50"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-emerald-600" />
                  <span>UPI वरून QR तयार करा</span>
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-stone-700">ग्राहकासाठी सूचना (Optional Note)</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="उदा. पेमेंट झाल्यावर UTR स्क्रीनशॉट WhatsApp वर पाठवा."
                className="h-10 text-xs bg-stone-50/50"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-stone-700 flex items-center justify-between">
                <span>वेबसाईट लाईव्ह डोमेन लिंक (WhatsApp Clickable Link)</span>
                <span className="text-[10px] text-stone-400 font-normal">उदा. https://mykalakar.com</span>
              </Label>
              <Input
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://mykalakar.com"
                className="h-10 text-xs bg-stone-50/50 font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-3 border-t border-stone-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto rounded-xl font-bold text-xs h-10"
            >
              रद्द करा (Cancel)
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto flex-1 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-black text-xs h-10 rounded-xl shadow-md flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              {saving ? "सेव्ह होत आहे..." : "सेटिंग्ज सेव्ह करा (Save QR Settings)"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
