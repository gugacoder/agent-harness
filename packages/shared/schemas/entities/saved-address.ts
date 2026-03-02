import { z } from "zod";

export const SavedAddressSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  profile_id: z.string().uuid(),
  label: z.string().nullable(),
  address: z.string(),
  lat: z.string(), // numeric(10,7)
  lng: z.string(), // numeric(10,7)
  complement: z.string().nullable(),
  reference: z.string().nullable(),
  is_favorite: z.boolean(),
  use_count: z.number().int(),
  last_used_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type SavedAddress = z.infer<typeof SavedAddressSchema>;
