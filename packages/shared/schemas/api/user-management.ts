import { z } from "zod";

const UserRoleEnum = z.enum(["operator", "shop", "courier"]);

export const ListUsersQuerySchema = z.object({
  role: UserRoleEnum.optional(),
  active: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  search: z.string().optional(),
});

export type ListUsersQuery = z.infer<typeof ListUsersQuerySchema>;

export const UpdateUserSchema = z.object({
  full_name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  email: z.string().email().optional(),
  role: UserRoleEnum.optional(),
  active: z.boolean().optional(),
});

export type UpdateUserRequest = z.infer<typeof UpdateUserSchema>;
