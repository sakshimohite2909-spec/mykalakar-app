import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IndianRupee, User, Users, MessageSquare } from "lucide-react";

export interface PricingData {
  soloPrice: string;
  groupPrice: string;
  advancePrice: string;
  feeNotes: string; // NEW – fee negotiation textarea
}

interface PricingProps {
  data: PricingData;
  onChange: (field: keyof PricingData, value: string) => void;
  disabled?: boolean;
}

export default function Pricing({ data, onChange, disabled = false }: PricingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Section Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border/50">
        <IndianRupee className="h-5 w-5 text-primary" />
        <h2 className="font-display font-semibold text-lg">Pricing</h2>
      </div>

      {/* Price inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Solo Price */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="solo-price" className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-primary" />
            Solo Price (₹)
          </Label>
          <Input
            id="solo-price"
            name="soloPrice"
            type="number"
            min={0}
            value={data.soloPrice}
            onChange={(e) => onChange("soloPrice", e.target.value)}
            placeholder="e.g. 5000"
            disabled={disabled}
            className="focus:ring-2 focus:ring-indigo-500/40 bg-transparent"
          />
          <p className="text-xs text-muted-foreground">
            Your charge when performing alone
          </p>
        </div>

        {/* Group Price */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="group-price" className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-primary" />
            Group Price (₹)
          </Label>
          <Input
            id="group-price"
            name="groupPrice"
            type="number"
            min={0}
            value={data.groupPrice}
            onChange={(e) => onChange("groupPrice", e.target.value)}
            placeholder="e.g. 10000"
            disabled={disabled}
            className="focus:ring-2 focus:ring-indigo-500/40 bg-transparent"
          />
          <p className="text-xs text-muted-foreground">
            Your charge when performing with a group
          </p>
        </div>

        {/* Advance Amount */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="advance-price" className="flex items-center gap-1.5">
            <IndianRupee className="h-3.5 w-3.5 text-primary" />
            Advance Amount (₹)
          </Label>
          <Input
            id="advance-price"
            name="advancePrice"
            type="number"
            min={0}
            value={data.advancePrice}
            onChange={(e) => onChange("advancePrice", e.target.value)}
            placeholder="e.g. 2000"
            disabled={disabled}
            className="focus:ring-2 focus:ring-indigo-500/40 bg-transparent"
          />
          <p className="text-xs text-muted-foreground">
            Advance required to confirm booking
          </p>
        </div>
      </div>

      {/* ──── NEW: Fee Negotiation Textarea ───────────────────────────────── */}
      <div className="flex flex-col gap-1.5 pt-2">
        <Label
          htmlFor="fee-notes"
          className="flex items-center gap-2 font-semibold"
        >
          <MessageSquare className="h-4 w-4 text-primary" />
          Tell us about your fees
        </Label>
        <textarea
          id="fee-notes"
          name="feeNotes"
          rows={4}
          value={data.feeNotes}
          onChange={(e) => onChange("feeNotes", e.target.value)}
          disabled={disabled}
          placeholder="e.g. I charge hourly, per project, or sliding scale. Happy to negotiate for long-term or bulk bookings..."
          className="w-full resize-none rounded-xl border border-input bg-transparent px-4 py-3 
            text-sm text-foreground placeholder:text-muted-foreground shadow-sm
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0
            disabled:cursor-not-allowed disabled:opacity-60
            transition-all duration-200"
        />
        <p className="text-xs text-muted-foreground">
          Use this space to explain your fee structure, special rates, or any negotiation terms.
        </p>
      </div>
    </motion.div>
  );
}
