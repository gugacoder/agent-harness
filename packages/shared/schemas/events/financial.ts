import { z } from "zod";

export const ClosingCreatedEventSchema = z.object({
  type: z.literal("closing_created"),
  closingId: z.string().uuid(),
  courierId: z.string().uuid(),
  courierName: z.string(),
  totalAmount: z.string(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
});
export type ClosingCreatedEvent = z.infer<typeof ClosingCreatedEventSchema>;

export const ClosingPaidEventSchema = z.object({
  type: z.literal("closing_paid"),
  closingId: z.string().uuid(),
  courierId: z.string().uuid(),
  courierName: z.string(),
  totalAmount: z.string(),
});
export type ClosingPaidEvent = z.infer<typeof ClosingPaidEventSchema>;
