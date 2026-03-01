import { z } from "zod";

export const UserRoleEnum = z.enum(["operator", "shop", "courier"]);
export type UserRole = z.infer<typeof UserRoleEnum>;

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  role: UserRoleEnum,
  full_name: z.string(),
  phone: z.string(),
  avatar_url: z.string().nullable(),
  active: z.boolean().default(true),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Profile = z.infer<typeof ProfileSchema>;
