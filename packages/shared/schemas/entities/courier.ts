import { z } from "zod";

export const CourierStatusEnum = z.enum(["available", "busy", "offline"]);
export type CourierStatus = z.infer<typeof CourierStatusEnum>;

export const CourierSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  profile_id: z.string().uuid(),
  full_name: z.string(),
  phone: z.string(),
  photo_url: z.string().nullable(),
  status: CourierStatusEnum.default("offline"),
  total_deliveries: z.number().int().default(0),
  active: z.boolean().default(true),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Courier = z.infer<typeof CourierSchema>;
