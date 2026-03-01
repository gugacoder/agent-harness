import { z } from "zod";
import { OrderStatusEnum } from "../entities/order.js";

export const CreateOrderRequestSchema = z.object({
  shop_id: z.string().uuid().nullable().optional(),
  pickup_address: z.string(),
  pickup_lat: z.string(),
  pickup_lng: z.string(),
  delivery_address: z.string(),
  delivery_lat: z.string(),
  delivery_lng: z.string(),
  recipient_name: z.string(),
  recipient_phone: z.string(),
  notes: z.string().nullable().optional(),
});
export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;

export const UpdateOrderStatusRequestSchema = z.object({
  status: OrderStatusEnum,
});
export type UpdateOrderStatusRequest = z.infer<typeof UpdateOrderStatusRequestSchema>;

export const AssignCourierRequestSchema = z.object({
  courier_id: z.string().uuid(),
});
export type AssignCourierRequest = z.infer<typeof AssignCourierRequestSchema>;
