import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * LaTeX text validation utilities
 * Detects non-ASCII characters that may cause LaTeX compilation errors
 */

/**
 * Check if text contains non-ASCII characters (non-English text)
 * @param text - Text to validate
 * @returns Object with validation result and details
 */
export function validateLatexText(text: string): {
  isValid: boolean;
  invalidChars: string[];
  message: string;
} {
  if (!text) {
    return { isValid: true, invalidChars: [], message: "" };
  }

  // Allow basic ASCII printable characters (32-126), newlines, tabs, and common symbols
  // This regex matches characters OUTSIDE the allowed range
  const nonAsciiRegex = /[^\x20-\x7E\n\r\t]/g;
  const matches = text.match(nonAsciiRegex);

  if (!matches || matches.length === 0) {
    return { isValid: true, invalidChars: [], message: "" };
  }

  // Get unique invalid characters
  const invalidChars = [...new Set(matches)];

  return {
    isValid: false,
    invalidChars,
    message: `Non-English characters detected: "${invalidChars.slice(0, 5).join(", ")}"${invalidChars.length > 5 ? ` and ${invalidChars.length - 5} more` : ""}. Please use English text only for LaTeX compilation.`,
  };
}

/**
 * Check if a single character is a non-ASCII character
 * Used for real-time input validation
 */
export function isNonAsciiChar(char: string): boolean {
  if (!char || char.length === 0) return false;
  const code = char.charCodeAt(0);
  // Allow printable ASCII (32-126), newlines (10), carriage returns (13), and tabs (9)
  return !(
    (code >= 32 && code <= 126) ||
    code === 10 ||
    code === 13 ||
    code === 9
  );
}

/**
 * Filter out non-ASCII characters from text
 * @param text - Text to filter
 * @returns Filtered text with only ASCII characters
 */
export function filterNonAsciiChars(text: string): string {
  if (!text) return "";
  return text.replace(/[^\x20-\x7E\n\r\t]/g, "");
}

export const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone: z.string().refine(
    (value) => {
      if (!value) return true;

      // The PhoneInput component already handles country code and validation
      // We just do a basic check that we have a value with some digits
      return /\d/.test(value);
    },
    {
      message: "Please enter a valid phone number",
    },
  ),
  location: z.string().optional(),
  linkedin: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === "" || z.string().url().safeParse(val).success,
      {
        message: "Please enter a valid URL",
      },
    ),
  github: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === "" || z.string().url().safeParse(val).success,
      {
        message: "Please enter a valid URL",
      },
    ),
});
