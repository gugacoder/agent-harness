import { z } from "zod";

export const InvoiceCreatedEventSchema = z.object({
  type: z.literal("invoice_created"),
  invoiceId: z.string().uuid(),
  shopId: z.string().uuid(),
  shopName: z.string(),
  totalAmount: z.string(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
});
export type InvoiceCreatedEvent = z.infer<typeof InvoiceCreatedEventSchema>;

export const InvoiceSentEventSchema = z.object({
  type: z.literal("invoice_sent"),
  invoiceId: z.string().uuid(),
  shopId: z.string().uuid(),
  shopName: z.string(),
});
export type InvoiceSentEvent = z.infer<typeof InvoiceSentEventSchema>;
