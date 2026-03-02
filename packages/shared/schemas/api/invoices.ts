import { z } from "zod";
import { InvoiceStatusEnum } from "../entities/invoice.js";

export const CreateInvoiceRequestSchema = z.object({
  shop_id: z.string().uuid(),
  period_start: z.string(),
  period_end: z.string(),
});
export type CreateInvoiceRequest = z.infer<typeof CreateInvoiceRequestSchema>;

export const InvoiceListQuerySchema = z.object({
  shop_id: z.string().uuid().optional(),
  status: InvoiceStatusEnum.optional(),
  period_start: z.string().optional(),
  period_end: z.string().optional(),
});
export type InvoiceListQuery = z.infer<typeof InvoiceListQuerySchema>;
