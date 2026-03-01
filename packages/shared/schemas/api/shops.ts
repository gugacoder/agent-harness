import { z } from "zod";

export const CreateShopRequestSchema = z.object({
  profile_id: z.string().uuid(),
  trade_name: z.string(),
  phone: z.string(),
  address: z.string(),
  lat: z.string(),
  lng: z.string(),
});
export type CreateShopRequest = z.infer<typeof CreateShopRequestSchema>;
