import { z } from "zod";
export const loginSchema = z.object({
  identifier: z.string().trim().min(3, "Enter your email or Operator ID."),
  password: z.string().min(1, "Enter your password."),
});
export const createOperatorSchema = z.object({
  companyName: z.string().trim().min(2, "Enter the company name.").max(120),
  status: z.enum(["ACTIVE", "SUSPENDED", "INACTIVE"]),
  adminFullName: z
    .string()
    .trim()
    .min(2, "Enter the administrator name.")
    .max(100),
  adminEmail: z.email("Enter a valid email address."),
  operatorCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^OPR-[A-Z0-9]{4,12}$/,
      "Use OPR- followed by 4–12 letters or numbers.",
    ),
  temporaryPassword: z.string().min(8, "Use at least 8 characters.").max(72),
  locationName: z.string().trim().min(2, "Enter the location name.").max(120),
  city: z.string().trim().min(2, "Enter the city.").max(80),
  address: z.string().trim().min(5, "Enter the full address.").max(300),
  state: z.string().trim().max(80).optional(),
  postalCode: z.string().trim().max(20).optional(),
  country: z.string().trim().min(2).max(80),
});
export type CreateOperatorInput = z.infer<typeof createOperatorSchema>;
