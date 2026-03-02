import { z } from "zod";

export const GeocodingCepResponseSchema = z.object({
  address: z.string(),
  city: z.string(),
  state: z.string(),
  neighborhood: z.string(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
});
export type GeocodingCepResponse = z.infer<typeof GeocodingCepResponseSchema>;

export const GeocodingSearchResultSchema = z.object({
  address: z.string(),
  lat: z.number(),
  lng: z.number(),
  type: z.string(),
});
export type GeocodingSearchResult = z.infer<typeof GeocodingSearchResultSchema>;

export const GeocodingSearchResponseSchema = z.array(GeocodingSearchResultSchema);
export type GeocodingSearchResponse = z.infer<typeof GeocodingSearchResponseSchema>;

export const GeocodingReverseResponseSchema = z.object({
  address: z.string(),
  city: z.string(),
  state: z.string(),
  neighborhood: z.string(),
});
export type GeocodingReverseResponse = z.infer<typeof GeocodingReverseResponseSchema>;
