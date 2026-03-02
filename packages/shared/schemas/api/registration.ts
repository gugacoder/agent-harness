import { z } from "zod";

export const RegistrationRequestSchema = z.object({
  company_id: z.string().uuid(),
  full_name: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email().optional(),
  requested_role: z.enum(["courier", "shop"]),
  extra_data: z
    .object({
      vehicle_type: z.string().optional(),
      plate: z.string().optional(),
      trade_name: z.string().optional(),
    })
    .optional(),
});

export type RegistrationRequest = z.infer<typeof RegistrationRequestSchema>;
