import { z } from "zod";
import { CourierStatusEnum } from "../entities/courier.js";

export const CreateCourierRequestSchema = z.object({
  profile_id: z.string().uuid(),
  full_name: z.string(),
  phone: z.string(),
  photo_url: z.string().nullable().optional(),
});
export type CreateCourierRequest = z.infer<typeof CreateCourierRequestSchema>;

export const UpdateCourierStatusRequestSchema = z.object({
  status: CourierStatusEnum,
});
export type UpdateCourierStatusRequest = z.infer<typeof UpdateCourierStatusRequestSchema>;

export const SendLocationRequestSchema = z.object({
  lat: z.string(),
  lng: z.string(),
  delivery_id: z.string().uuid().nullable().optional(),
});
export type SendLocationRequest = z.infer<typeof SendLocationRequestSchema>;
