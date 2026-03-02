import { z } from "zod";

export const UpdateProfileSchema = z.object({
  full_name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  avatar_url: z.string().url().optional(),
  // Courier-specific fields
  vehicle_type: z.string().optional(),
  plate: z.string().optional(),
  cnh: z.string().optional(),
  // Shop-specific fields
  trade_name: z.string().optional(),
  address: z.string().optional(),
  business_hours: z.unknown().optional(),
});

export type UpdateProfileRequest = z.infer<typeof UpdateProfileSchema>;
