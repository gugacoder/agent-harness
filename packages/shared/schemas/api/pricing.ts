import { z } from "zod";
import {
  PricingRuleTypeEnum,
  SurchargeTypeEnum,
  SurchargeModeEnum,
} from "../entities/pricing-table.js";

export const CreatePricingTableRequestSchema = z.object({
  name: z.string(),
  active: z.boolean().optional(),
});
export type CreatePricingTableRequest = z.infer<
  typeof CreatePricingTableRequestSchema
>;

export const UpdatePricingTableRequestSchema = z.object({
  name: z.string().optional(),
  active: z.boolean().optional(),
});
export type UpdatePricingTableRequest = z.infer<
  typeof UpdatePricingTableRequestSchema
>;

export const CreatePricingRuleRequestSchema = z.object({
  rule_type: PricingRuleTypeEnum,
  base_value: z.string(),
  per_km_value: z.string().nullable().optional(),
  min_distance_km: z.string().nullable().optional(),
  max_distance_km: z.string().nullable().optional(),
  neighborhood: z.string().nullable().optional(),
  surcharge_type: SurchargeTypeEnum.nullable().optional(),
  surcharge_mode: SurchargeModeEnum.nullable().optional(),
  surcharge_value: z.string().nullable().optional(),
  priority: z.number().int(),
});
export type CreatePricingRuleRequest = z.infer<
  typeof CreatePricingRuleRequestSchema
>;

export const UpdatePricingRuleRequestSchema = z.object({
  rule_type: PricingRuleTypeEnum.optional(),
  base_value: z.string().optional(),
  per_km_value: z.string().nullable().optional(),
  min_distance_km: z.string().nullable().optional(),
  max_distance_km: z.string().nullable().optional(),
  neighborhood: z.string().nullable().optional(),
  surcharge_type: SurchargeTypeEnum.nullable().optional(),
  surcharge_mode: SurchargeModeEnum.nullable().optional(),
  surcharge_value: z.string().nullable().optional(),
  priority: z.number().int().optional(),
});
export type UpdatePricingRuleRequest = z.infer<
  typeof UpdatePricingRuleRequestSchema
>;

export const SimulatePriceRequestSchema = z.object({
  distance: z.number(),
  neighborhood: z.string().optional(),
});
export type SimulatePriceRequest = z.infer<typeof SimulatePriceRequestSchema>;

export const SetPricingOverrideRequestSchema = z.object({
  pricing_table_id: z.string().uuid(),
});
export type SetPricingOverrideRequest = z.infer<
  typeof SetPricingOverrideRequestSchema
>;
