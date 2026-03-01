import { z } from "zod";

export const AcceptDeliveryRequestSchema = z.object({});
export type AcceptDeliveryRequest = z.infer<typeof AcceptDeliveryRequestSchema>;

export const RejectDeliveryRequestSchema = z.object({
  reason: z.string().optional(),
});
export type RejectDeliveryRequest = z.infer<typeof RejectDeliveryRequestSchema>;
