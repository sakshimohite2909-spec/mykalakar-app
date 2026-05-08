/**
 * Phone Number Utilities for consistent validation and sanitization across the app.
 */

/**
 * Strips all non-digit characters and limits the length to 10.
 * @param value The raw input value
 * @returns Sanitized 10-digit numeric string
 */
export const sanitizePhoneNumber = (value: string): string => {
  return value.replace(/\D/g, "").slice(0, 10);
};

/**
 * Validates if the phone number is exactly 10 digits.
 * @param value The sanitized phone number
 * @returns boolean
 */
export const validatePhoneNumber = (value: string): boolean => {
  return /^\d{10}$/.test(value);
};

export const PHONE_PLACEHOLDER = "+91 XXXXX XXXXX";
export const PHONE_MAX_LENGTH = 10;
