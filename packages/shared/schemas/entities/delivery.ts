import { z } from "zod";

export const DeliveryStatusEnum = z.enum([
  "assigned",
  "accepted",
  "picked_up",
  "in_transit",
  "delivered",
  "failed",
]);
export type DeliveryStatus = z.infer<typeof DeliveryStatusEnum>;

export const DeliverySchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid(),
  courier_id: z.string().uuid(),
  company_id: z.string().uuid(),
  status: DeliveryStatusEnum,
  assigned_at: z.string().datetime(),
  accepted_at: z.string().datetime().nullable(),
  picked_up_at: z.string().datetime().nullable(),
  delivered_at: z.string().datetime().nullable(),
  actual_distance_km: z.string().nullable(), // numeric(8,2)
  actual_duration_min: z.number().int().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Delivery = z.infer<typeof DeliverySchema>;

export const DeliveryEventTypeEnum = z.enum([
  "status_change",
  "location_update",
  "note",
]);
export type DeliveryEventType = z.infer<typeof DeliveryEventTypeEnum>;

export const DeliveryEventSchema = z.object({
  id: z.string().uuid(),
  delivery_id: z.string().uuid(),
  event_type: DeliveryEventTypeEnum,
  old_status: z.string().nullable(),
  new_status: z.string().nullable(),
  description: z.string(),
  actor_id: z.string().uuid(),
  lat: z.string().nullable(), // numeric(10,7)
  lng: z.string().nullable(), // numeric(10,7)
  created_at: z.string().datetime(),
});

export type DeliveryEvent = z.infer<typeof DeliveryEventSchema>;
