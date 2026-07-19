import { z } from "zod";
export const locationProfileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z
    .string()
    .trim()
    .min(40, "Add a meaningful description of at least 40 characters.")
    .max(2000),
  address: z.string().trim().min(5).max(300),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  postalCode: z.string().trim().max(20),
  country: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[+0-9][0-9 ()-]{7,19}$/, "Enter a valid contact phone number."),
  email: z.email("Enter a valid contact email."),
  timezone: z.string().trim().min(3).max(80),
  amenities: z.array(z.string().trim().min(2)).max(30),
  parkingAvailable: z.boolean(),
  parkingInformation: z.string().trim().max(500),
  houseRules: z
    .string()
    .trim()
    .min(20, "Add house rules of at least 20 characters.")
    .max(3000),
  cancellationPolicy: z
    .string()
    .trim()
    .min(20, "Add a cancellation policy of at least 20 characters.")
    .max(3000),
});
export type LocationProfileInput = z.infer<typeof locationProfileSchema>;
