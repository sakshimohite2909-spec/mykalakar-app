import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Droplets } from "lucide-react";

export interface PersonalInfoData {
  name: string;
  mobileNumber: string;
  emergencyNumber: string;
  age: string;
  dob: string;
  gender: string;
  travelWillingness: string;
  capName: string;      // Stage Name / Alias
  bloodGroup: string;   // A+, A-, B+, B-, AB+, AB-, O+, O-
}

interface PersonalInfoProps {
  data: PersonalInfoData;
  onChange: (field: keyof PersonalInfoData, value: any) => void;
  disabled?: boolean;
}

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function PersonalInfo({ data, onChange, disabled = false }: PersonalInfoProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Section Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border/50">
        <User className="h-5 w-5 text-primary" />
        <h2 className="font-display font-semibold text-lg">Personal Information</h2>
      </div>

      {/* Row 1: Name + Mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pi-name">Artist Name *</Label>
          <Input
            id="pi-name"
            name="name"
            value={data.name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="Your full name"
            disabled={disabled}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pi-mobile">Mobile Number *</Label>
          <Input
            id="pi-mobile"
            name="mobileNumber"
            type="tel"
            value={data.mobileNumber}
            onChange={(e) => onChange("mobileNumber", e.target.value)}
            placeholder="+91 XXXXX XXXXX"
            disabled={disabled}
            required
          />
        </div>
      </div>

      {/* Row 2: Emergency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pi-emergency">Emergency Number *</Label>
          <Input
            id="pi-emergency"
            name="emergencyNumber"
            type="tel"
            value={data.emergencyNumber}
            onChange={(e) => onChange("emergencyNumber", e.target.value)}
            placeholder="+91 XXXXX XXXXX"
            disabled={disabled}
            required
          />
        </div>
      </div>

      {/* Row 3: Age + DOB */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pi-age">Age *</Label>
          <Input
            id="pi-age"
            name="age"
            type="number"
            min={1}
            max={120}
            value={data.age}
            onChange={(e) => onChange("age", e.target.value)}
            placeholder="e.g. 25"
            disabled={disabled}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pi-dob">Date of Birth *</Label>
          <Input
            id="pi-dob"
            name="dob"
            type="date"
            value={data.dob}
            onChange={(e) => onChange("dob", e.target.value)}
            disabled={disabled}
            required
          />
        </div>
      </div>

      {/* Row 4: Gender + Travel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pi-gender">Gender *</Label>
          <Select
            value={data.gender}
            onValueChange={(v) => onChange("gender", v)}
            disabled={disabled}
          >
            <SelectTrigger id="pi-gender">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pi-travel">Travel Willingness *</Label>
          <Select
            value={data.travelWillingness}
            onValueChange={(v) => onChange("travelWillingness", v)}
            disabled={disabled}
          >
            <SelectTrigger id="pi-travel">
              <SelectValue placeholder="Select travel preference" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="local">Local Only</SelectItem>
              <SelectItem value="state">Within State</SelectItem>
              <SelectItem value="all">All India</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>



      {/* ──── NEW FIELDS ──────────────────────────────────────────────────────── */}
      <div className="pt-4 border-t border-border/30">
        <div className="flex items-center gap-3 pb-4">
          <Droplets className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-base">Additional Details</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* capName – Stage Name / Alias */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pi-capName">Stage Name / Alias</Label>
            <Input
              id="pi-capName"
              name="capName"
              type="text"
              value={data.capName}
              onChange={(e) => onChange("capName", e.target.value)}
              placeholder="e.g. DJ Phoenix, Maestro Rahul"
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">
              The professional name you perform under (optional)
            </p>
          </div>

          {/* bloodGroup */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pi-bloodGroup">Blood Group</Label>
            <Select
              value={data.bloodGroup}
              onValueChange={(v) => onChange("bloodGroup", v)}
              disabled={disabled}
            >
              <SelectTrigger id="pi-bloodGroup">
                <SelectValue placeholder="Select blood group" />
              </SelectTrigger>
              <SelectContent>
                {BLOOD_GROUPS.map((bg) => (
                  <SelectItem key={bg} value={bg}>
                    {bg}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Used only in case of medical emergencies
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
