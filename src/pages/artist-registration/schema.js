import { z } from "zod";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE_BYTES = 12 * 1024 * 1024;

const isFile = (value) => typeof File !== "undefined" && value instanceof File;
const optionalUrl = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol);
    } catch {
      return false;
    }
  }, "Please enter a valid URL.");

export const disciplineOptions = ["Music", "Dance", "Painting", "Theatre", "Design", "Other"];

export const artistRegistrationDefaults = {
  fullName: "",
  stageName: "",
  email: "",
  password: "",
  confirmPassword: "",
  phoneNumber: "",
  discipline: "",
  artForm: "",
  city: "",
  state: "",
  experienceYears: "",
  bio: "",
  instagramUrl: "",
  portfolioUrl: "",
  profileImage: undefined,
};

export const artistRegistrationSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name must be at least 2 characters."),
    stageName: z.string().trim().optional(),
    email: z.string().trim().email("Please enter a valid email address."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Z]/, "Password must include at least one uppercase letter.")
      .regex(/[a-z]/, "Password must include at least one lowercase letter.")
      .regex(/\d/, "Password must include at least one number."),
    confirmPassword: z.string().min(1, "Confirm your password."),
    phoneNumber: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10 digit mobile number."),
    discipline: z.string().min(1, "Select a discipline."),
    artForm: z.string().trim().min(2, "Art form must be at least 2 characters."),
    city: z.string().trim().min(2, "City is required."),
    state: z.string().trim().min(2, "State is required."),
    experienceYears: z.coerce
      .number({ invalid_type_error: "Experience is required." })
      .min(0, "Experience cannot be negative.")
      .max(80, "Experience must be realistic."),
    bio: z
      .string()
      .trim()
      .min(20, "Bio must be at least 20 characters.")
      .max(700, "Bio must be under 700 characters."),
    instagramUrl: optionalUrl,
    portfolioUrl: optionalUrl,
    profileImage: z
      .custom(isFile, { message: "Profile image is required." })
      .refine((file) => isFile(file) && ACCEPTED_IMAGE_TYPES.includes(file.type), "Upload a JPG, PNG, or WebP image.")
      .refine((file) => isFile(file) && file.size <= MAX_IMAGE_SIZE_BYTES, "Image must be 12MB or smaller."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });
