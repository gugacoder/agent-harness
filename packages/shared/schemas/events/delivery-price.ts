import { z } from "zod";

export const DeliveryPricedEventSchema = z.object({
  type: z.literal("delivery_priced"),
  deliveryId: z.string().uuid(),
  orderId: z.string().uuid(),
  totalPrice: z.string(),
});
export type DeliveryPricedEvent = z.infer<typeof DeliveryPricedEventSchema>;
