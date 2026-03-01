import { z } from "zod";
import { OrderStatusEnum } from "../entities/order.js";

export const OrderCreatedEventSchema = z.object({
  type: z.literal("order_created"),
  orderId: z.string().uuid(),
  orderNumber: z.number().int(),
  companyId: z.string().uuid(),
  shopId: z.string().uuid().nullable(),
  pickupAddress: z.string(),
  deliveryAddress: z.string(),
  recipientName: z.string(),
  recipientPhone: z.string(),
  notes: z.string().nullable(),
  timestamp: z.string().datetime(),
});
export type OrderCreatedEvent = z.infer<typeof OrderCreatedEventSchema>;

export const OrderStatusEventSchema = z.object({
  type: z.literal("order_status"),
  orderId: z.string().uuid(),
  status: OrderStatusEnum,
  timestamp: z.string().datetime(),
});
export type OrderStatusEvent = z.infer<typeof OrderStatusEventSchema>;
