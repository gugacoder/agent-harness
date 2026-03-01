import { z } from "zod";

export const CourierLocationSchema = z.object({
  id: z.string().uuid(),
  courier_id: z.string().uuid(),
  company_id: z.string().uuid(),
  delivery_id: z.string().uuid().nullable(),
  lat: z.string(), // numeric(10,7)
  lng: z.string(), // numeric(10,7)
  accuracy: z.string(), // numeric(6,2)
  recorded_at: z.string().datetime(),
  created_at: z.string().datetime(),
});

export type CourierLocation = z.infer<typeof CourierLocationSchema>;
