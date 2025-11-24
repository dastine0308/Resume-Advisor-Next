import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
