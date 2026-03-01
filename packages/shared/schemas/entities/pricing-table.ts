import { z } from "zod";

export const PricingRuleTypeEnum = z.enum([
  "per_km",
  "distance_range",
  "neighborhood",
  "flat_rate",
  "surcharge",
]);
export type PricingRuleType = z.infer<typeof PricingRuleTypeEnum>;

export const SurchargeTypeEnum = z.enum(["rain", "night", "weekend"]);
export type SurchargeType = z.infer<typeof SurchargeTypeEnum>;

export const SurchargeModeEnum = z.enum(["percentage", "fixed"]);
export type SurchargeMode = z.infer<typeof SurchargeModeEnum>;

export const PricingTableSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  name: z.string(),
  active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type PricingTable = z.infer<typeof PricingTableSchema>;

export const PricingRuleSchema = z.object({
  id: z.string().uuid(),
  pricing_table_id: z.string().uuid(),
  rule_type: PricingRuleTypeEnum,
  base_value: z.string(), // numeric(10,2)
  per_km_value: z.string().nullable(), // numeric(10,2)
  min_distance_km: z.string().nullable(), // numeric(8,2)
  max_distance_km: z.string().nullable(), // numeric(8,2)
  neighborhood: z.string().nullable(),
  surcharge_type: SurchargeTypeEnum.nullable(),
  surcharge_mode: SurchargeModeEnum.nullable(),
  surcharge_value: z.string().nullable(), // numeric(10,2)
  priority: z.number().int(),
  created_at: z.string().datetime(),
});

export type PricingRule = z.infer<typeof PricingRuleSchema>;
