import { z } from "zod";

// Base rules for consistency
export const emailRule = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email format")
  .trim()
  .toLowerCase();

export const phoneRule = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Must be a valid 10-digit Indian number");

export const passwordRule = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(32, "Password too long");

// Helper for generic required text
export const requiredString = (fieldName) =>
  z.string().min(1, `${fieldName} is required`).trim();