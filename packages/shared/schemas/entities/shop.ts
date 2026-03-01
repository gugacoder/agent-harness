import { z } from "zod";

export const ShopSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  profile_id: z.string().uuid(),
  trade_name: z.string(),
  phone: z.string(),
  address: z.string(),
  lat: z.string(), // numeric(10,7)
  lng: z.string(), // numeric(10,7)
  active: z.boolean().default(true),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Shop = z.infer<typeof ShopSchema>;
