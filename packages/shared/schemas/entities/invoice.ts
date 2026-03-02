import { z } from "zod";

export const InvoiceStatusEnum = z.enum(["draft", "sent", "paid"]);
export type InvoiceStatus = z.infer<typeof InvoiceStatusEnum>;

export const InvoiceSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  shop_id: z.string().uuid(),
  invoice_number: z.number().int(),
  period_start: z.string(), // date
  period_end: z.string(), // date
  total_deliveries: z.number().int(),
  total_distance_km: z.string(), // numeric(10,2)
  total_amount: z.string(), // numeric(10,2)
  status: InvoiceStatusEnum,
  sent_at: z.string().datetime().nullable(),
  paid_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Invoice = z.infer<typeof InvoiceSchema>;

export const InvoiceItemSchema = z.object({
  id: z.string().uuid(),
  invoice_id: z.string().uuid(),
  delivery_id: z.string().uuid(),
  order_number: z.number().int(),
  pickup_address: z.string(),
  delivery_address: z.string(),
  distance_km: z.string(), // numeric(8,2)
  price: z.string(), // numeric(10,2)
  delivered_at: z.string().datetime(),
});

export type InvoiceItem = z.infer<typeof InvoiceItemSchema>;
