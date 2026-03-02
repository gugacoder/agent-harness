import { z } from "zod";

export const DeliveryPriceSchema = z.object({
  id: z.string().uuid(),
  delivery_id: z.string().uuid(),
  company_id: z.string().uuid(),
  pricing_table_id: z.string().uuid(),
  pricing_rule_id: z.string().uuid(),
  estimated_distance_km: z.string(), // numeric(8,2)
  actual_distance_km: z.string().nullable(), // numeric(8,2)
  base_price: z.string(), // numeric(10,2)
  surcharge_amount: z.string(), // numeric(10,2)
  total_price: z.string(), // numeric(10,2)
  calculated_at: z.string().datetime(),
  recalculated_at: z.string().datetime().nullable(),
});

export type DeliveryPrice = z.infer<typeof DeliveryPriceSchema>;
