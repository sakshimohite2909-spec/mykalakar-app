import React from "react";
import { CheckCircle2, ShieldCheck, Star, Award, Smartphone, UserCheck, MapPin, Video, Sparkles, Building2, UserPlus } from "lucide-react";

export type VerificationTier = "basic" | "identity_verified" | "artist_verified" | "trusted_artist";

export interface VerificationChecklist {
  mobileVerified: boolean;
  identityVerified: boolean;
  locationVerified: boolean;
  portfolioVerified: boolean;
  performanceVerified: boolean;
  referenceVerified: boolean;
  affiliationVerified: boolean;
}

export interface ArtistVerificationData {
  tier: VerificationTier;
  verified: boolean;
  checklist: VerificationChecklist;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  affiliationName?: string;
  notes?: string;
}

export interface VerificationTierConfig {
  id: VerificationTier;
  name: string;
  shortLabel: string;
  badgeLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgLight: string;
  borderLight: string;
  textColor: string;
  ringColor: string;
  glowClass: string;
  description: string;
  criteria: string[];
}

export const VERIFICATION_TIERS_CONFIG: Record<VerificationTier, VerificationTierConfig> = {
  basic: {
    id: "basic",
    name: "Basic Profile",
    shortLabel: "Basic",
    badgeLabel: "Basic Profile",
    icon: CheckCircle2,
    color: "#16a34a", // emerald-600
    bgLight: "bg-emerald-50",
    borderLight: "border-emerald-200",
    textColor: "text-emerald-700",
    ringColor: "ring-emerald-400/40",
    glowClass: "shadow-emerald-500/10",
    description: "Registered artist profile with basic contact details.",
    criteria: ["Mobile number registered", "Basic category & bio provided"],
  },
  identity_verified: {
    id: "identity_verified",
    name: "Identity Verified",
    shortLabel: "ID Verified",
    badgeLabel: "Identity Verified",
    icon: ShieldCheck,
    color: "#2563eb", // blue-600
    bgLight: "bg-blue-50",
    borderLight: "border-blue-200",
    textColor: "text-blue-700",
    ringColor: "ring-blue-400/40",
    glowClass: "shadow-blue-500/15",
    description: "Official identity & phone verified directly with government ID/KYC.",
    criteria: ["Mobile number OTP verified", "Govt ID (Aadhaar / PAN / Voter ID) checked", "Physical location confirmed"],
  },
  artist_verified: {
    id: "artist_verified",
    name: "Artist Verified",
    shortLabel: "Artist Verified",
    badgeLabel: "MyKalakar Verified",
    icon: Award,
    color: "#9333ea", // purple-600
    bgLight: "bg-purple-50",
    borderLight: "border-purple-200",
    textColor: "text-purple-700",
    ringColor: "ring-purple-400/40",
    glowClass: "shadow-purple-500/20",
    description: "Verified performing artist with active portfolio, performance videos & art experience.",
    criteria: [
      "Full Identity & Mobile verification",
      "Active performance video / portfolio audited",
      "Minimum 3+ years confirmed art experience",
      "Sample video & stage presence checked",
    ],
  },
  trusted_artist: {
    id: "trusted_artist",
    name: "MyKalakar Trusted Artist",
    shortLabel: "Trusted Artist",
    badgeLabel: "⭐ MyKalakar Trusted Artist",
    icon: Star,
    color: "#d97706", // amber-600
    bgLight: "bg-gradient-to-r from-amber-50 to-orange-50",
    borderLight: "border-amber-300",
    textColor: "text-amber-800 font-black",
    ringColor: "ring-amber-500/40",
    glowClass: "shadow-amber-500/25",
    description: "Highest level of authenticity. Backed by verified performances, client references, and certified background checks.",
    criteria: [
      "Complete Identity & Address verification",
      "Verified past stage performances & client feedback",
      "Organizer & Client references confirmed",
      "Organization / Mandir / Trust / Academy affiliation verified",
      "Zero-dispute booking track record",
    ],
  },
};

export const CHECKLIST_ITEMS = [
  { key: "mobileVerified" as const, label: "Mobile / Contact Number", icon: Smartphone, desc: "Phone number verified via OTP/Admin verification call" },
  { key: "identityVerified" as const, label: "Government ID / KYC", icon: UserCheck, desc: "Aadhaar, PAN, or Voter ID document checked" },
  { key: "locationVerified" as const, label: "Physical Base Location", icon: MapPin, desc: "Address, District, and State confirmed" },
  { key: "portfolioVerified" as const, label: "Live Performance Portfolio", icon: Video, desc: "Authentic stage videos and photos reviewed" },
  { key: "performanceVerified" as const, label: "Past Performance Record", icon: Sparkles, desc: "Track record of actual live shows confirmed" },
  { key: "referenceVerified" as const, label: "Organizer References", icon: UserPlus, desc: "References from previous event organizers verified" },
  { key: "affiliationVerified" as const, label: "Organization / Trust Affiliation", icon: Building2, desc: "Sanstha, Mandir, Gurukul, or Academy affiliation checked" },
];

/**
 * Derives the active VerificationTier from artist object
 */
export function getVerificationTier(artist: Record<string, any> | null | undefined): VerificationTier {
  if (!artist) return "basic";

  const explicitTier = artist.verificationTier || artist.verification?.tier;
  if (explicitTier && VERIFICATION_TIERS_CONFIG[explicitTier as VerificationTier]) {
    return explicitTier as VerificationTier;
  }

  // Fallback heuristics for existing records
  const isPremium = artist.isPremium || artist.voucherType === "premium" || (artist.artistProfile as any)?.isPremium;
  const isTrusted = artist.trusted || artist.isTrusted;
  const isVerified = artist.verified || artist.isVerified;

  if (isTrusted || (isPremium && isVerified)) return "trusted_artist";
  if (isVerified) return "artist_verified";
  if (artist.phoneVerified || artist.isIdentityVerified) return "identity_verified";

  return "basic";
}

/**
 * Extracts checklist status from artist record
 */
export function getVerificationChecklist(artist: Record<string, any> | null | undefined): VerificationChecklist {
  if (!artist) {
    return {
      mobileVerified: false,
      identityVerified: false,
      locationVerified: false,
      portfolioVerified: false,
      performanceVerified: false,
      referenceVerified: false,
      affiliationVerified: false,
    };
  }

  const v = artist.verification?.checklist || artist.verificationChecklist || {};
  const tier = getVerificationTier(artist);

  // If explicit checklist is present, use it; otherwise infer based on tier
  if (Object.keys(v).length > 0) {
    return {
      mobileVerified: Boolean(v.mobileVerified ?? artist.mobileNumber ?? true),
      identityVerified: Boolean(v.identityVerified ?? (tier !== "basic")),
      locationVerified: Boolean(v.locationVerified ?? (artist.district || artist.city)),
      portfolioVerified: Boolean(v.portfolioVerified ?? (tier === "artist_verified" || tier === "trusted_artist")),
      performanceVerified: Boolean(v.performanceVerified ?? (tier === "trusted_artist")),
      referenceVerified: Boolean(v.referenceVerified ?? (tier === "trusted_artist")),
      affiliationVerified: Boolean(v.affiliationVerified ?? (tier === "trusted_artist" && artist.affiliationName)),
    };
  }

  // Default inferred checklist by tier
  return {
    mobileVerified: Boolean(artist.mobileNumber || artist.phone || true),
    identityVerified: tier !== "basic",
    locationVerified: Boolean(artist.district || artist.city || artist.state),
    portfolioVerified: tier === "artist_verified" || tier === "trusted_artist",
    performanceVerified: tier === "trusted_artist",
    referenceVerified: tier === "trusted_artist",
    affiliationVerified: tier === "trusted_artist" && Boolean(artist.affiliationName || artist.assistant?.hasAssistant),
  };
}

/**
 * Calculates a Trust Score (0 to 100%)
 */
export function calculateTrustScore(artist: Record<string, any> | null | undefined): number {
  const checklist = getVerificationChecklist(artist);
  const weights: Record<keyof VerificationChecklist, number> = {
    mobileVerified: 15,
    identityVerified: 25,
    locationVerified: 10,
    portfolioVerified: 20,
    performanceVerified: 15,
    referenceVerified: 10,
    affiliationVerified: 5,
  };

  let score = 0;
  for (const [key, weight] of Object.entries(weights)) {
    if (checklist[key as keyof VerificationChecklist]) {
      score += weight;
    }
  }

  const tier = getVerificationTier(artist);
  if (tier === "trusted_artist") return Math.max(score, 95);
  if (tier === "artist_verified") return Math.max(score, 75);
  if (tier === "identity_verified") return Math.max(score, 50);

  return Math.max(score, 30);
}
