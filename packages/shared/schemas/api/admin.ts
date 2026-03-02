import { z } from "zod";

// --- Query Schemas ---

export const ListCompaniesQuerySchema = z.object({
  status: z.enum(["active", "suspended"]).optional(),
  search: z.string().optional(),
});

export type ListCompaniesQuery = z.infer<typeof ListCompaniesQuerySchema>;

// --- Mutation Schemas ---

export const CreateCompanySchema = z.object({
  name: z.string().min(2),
  cnpj: z.string(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
});

export type CreateCompanyRequest = z.infer<typeof CreateCompanySchema>;

export const UpdateCompanySchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  status: z.enum(["active", "suspended"]).optional(),
});

export type UpdateCompanyRequest = z.infer<typeof UpdateCompanySchema>;
