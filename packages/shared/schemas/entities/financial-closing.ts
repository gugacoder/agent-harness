import { z } from "zod";

export const ClosingStatusEnum = z.enum(["draft", "confirmed", "paid"]);
export type ClosingStatus = z.infer<typeof ClosingStatusEnum>;

export const ClosingPeriodEnum = z.enum(["daily", "weekly", "monthly"]);
export type ClosingPeriod = z.infer<typeof ClosingPeriodEnum>;

export const FinancialClosingSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  courier_id: z.string().uuid(),
  period_start: z.string(), // date
  period_end: z.string(), // date
  total_deliveries: z.number().int(),
  total_distance_km: z.string(), // numeric(10,2)
  total_amount: z.string(), // numeric(10,2)
  status: ClosingStatusEnum,
  confirmed_at: z.string().datetime().nullable(),
  paid_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type FinancialClosing = z.infer<typeof FinancialClosingSchema>;

export const FinancialClosingItemSchema = z.object({
  id: z.string().uuid(),
  closing_id: z.string().uuid(),
  delivery_id: z.string().uuid(),
  delivery_price: z.string(), // numeric(10,2)
  distance_km: z.string(), // numeric(8,2)
  delivered_at: z.string().datetime(),
});

export type FinancialClosingItem = z.infer<typeof FinancialClosingItemSchema>;
