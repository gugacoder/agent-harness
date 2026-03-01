import { z } from "zod";

export const DeliveryProofResponseSchema = z.object({
  id: z.string().uuid(),
  delivery_id: z.string().uuid(),
  photo_url: z.string(),
  signature_url: z.string(),
  lat: z.string(),
  lng: z.string(),
  captured_at: z.string().datetime(),
  created_at: z.string().datetime(),
});
export type DeliveryProofResponse = z.infer<typeof DeliveryProofResponseSchema>;
