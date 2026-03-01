import { z } from "zod";

export const DeliveryProofSchema = z.object({
  id: z.string().uuid(),
  delivery_id: z.string().uuid(),
  company_id: z.string().uuid(),
  courier_id: z.string().uuid(),
  photo_url: z.string(),
  signature_url: z.string(),
  lat: z.string(), // numeric(10,7)
  lng: z.string(), // numeric(10,7)
  captured_at: z.string().datetime(),
  created_at: z.string().datetime(),
});

export type DeliveryProof = z.infer<typeof DeliveryProofSchema>;
