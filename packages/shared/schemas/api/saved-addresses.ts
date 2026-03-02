import { z } from "zod";
import { SavedAddressSchema } from "../entities/saved-address.js";

export const CreateSavedAddressSchema = z.object({
  address: z.string().min(1),
  lat: z.string(),
  lng: z.string(),
  label: z.string().optional(),
  complement: z.string().optional(),
  reference: z.string().optional(),
  is_favorite: z.boolean().optional(),
});

export type CreateSavedAddress = z.infer<typeof CreateSavedAddressSchema>;

export const UpdateSavedAddressSchema = z.object({
  label: z.string().optional(),
  address: z.string().min(1).optional(),
  lat: z.string().optional(),
  lng: z.string().optional(),
  complement: z.string().nullable().optional(),
  reference: z.string().nullable().optional(),
  is_favorite: z.boolean().optional(),
});

export type UpdateSavedAddress = z.infer<typeof UpdateSavedAddressSchema>;

export const SavedAddressResponseSchema = SavedAddressSchema;

export type SavedAddressResponse = z.infer<typeof SavedAddressResponseSchema>;

export const SavedAddressListResponseSchema = z.array(SavedAddressSchema);

export type SavedAddressListResponse = z.infer<typeof SavedAddressListResponseSchema>;
