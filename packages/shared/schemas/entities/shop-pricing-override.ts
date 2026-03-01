import { z } from "zod";

export const ShopPricingOverrideSchema = z.object({
  id: z.string().uuid(),
  shop_id: z.string().uuid(),
  pricing_table_id: z.string().uuid(),
  company_id: z.string().uuid(),
  created_at: z.string().datetime(),
});

export type ShopPricingOverride = z.infer<typeof ShopPricingOverrideSchema>;
