import { z } from "zod";
import { CourierStatusEnum } from "../entities/courier.js";

export const CourierLocationEventSchema = z.object({
  type: z.literal("courier_location"),
  courierId: z.string().uuid(),
  lat: z.number(),
  lng: z.number(),
  timestamp: z.string().datetime(),
});
export type CourierLocationEvent = z.infer<typeof CourierLocationEventSchema>;

export const CourierStatusEventSchema = z.object({
  type: z.literal("courier_status"),
  courierId: z.string().uuid(),
  status: CourierStatusEnum,
  timestamp: z.string().datetime(),
});
export type CourierStatusEvent = z.infer<typeof CourierStatusEventSchema>;
