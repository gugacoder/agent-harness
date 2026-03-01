import { z } from "zod";
import { DeliveryStatusEnum } from "../entities/delivery.js";

export const DeliveryAssignedEventSchema = z.object({
  type: z.literal("delivery_assigned"),
  deliveryId: z.string().uuid(),
  orderId: z.string().uuid(),
  courierId: z.string().uuid(),
  companyId: z.string().uuid(),
  assignedAt: z.string().datetime(),
});
export type DeliveryAssignedEvent = z.infer<typeof DeliveryAssignedEventSchema>;

export const DeliveryStatusEventSchema = z.object({
  type: z.literal("delivery_status"),
  deliveryId: z.string().uuid(),
  orderId: z.string().uuid(),
  courierId: z.string().uuid(),
  status: DeliveryStatusEnum,
  timestamp: z.string().datetime(),
});
export type DeliveryStatusEvent = z.infer<typeof DeliveryStatusEventSchema>;
