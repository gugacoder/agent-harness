import { z } from "zod";

export const OrderStatusEnum = z.enum([
  "pending",
  "assigned",
  "picked_up",
  "in_transit",
  "delivered",
  "cancelled",
]);
export type OrderStatus = z.infer<typeof OrderStatusEnum>;

export const OrderSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  shop_id: z.string().uuid().nullable(),
  order_number: z.number().int(),
  status: OrderStatusEnum,
  pickup_address: z.string(),
  pickup_lat: z.string(), // numeric(10,7)
  pickup_lng: z.string(), // numeric(10,7)
  delivery_address: z.string(),
  delivery_lat: z.string(), // numeric(10,7)
  delivery_lng: z.string(), // numeric(10,7)
  recipient_name: z.string(),
  recipient_phone: z.string(),
  notes: z.string().nullable(),
  created_by: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Order = z.infer<typeof OrderSchema>;
