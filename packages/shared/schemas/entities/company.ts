import { z } from "zod";

export const CompanyStatusEnum = z.enum(["active", "suspended"]);
export type CompanyStatus = z.infer<typeof CompanyStatusEnum>;

export const CompanySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  cnpj: z.string().nullable(),
  phone: z.string(),
  email: z.string(),
  address: z.string(),
  lat: z.string(), // numeric(10,7)
  lng: z.string(), // numeric(10,7)
  logo_url: z.string().nullable(),
  status: CompanyStatusEnum,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Company = z.infer<typeof CompanySchema>;
