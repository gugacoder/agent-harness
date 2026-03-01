import { z } from "zod";
import { UserRoleEnum } from "../entities/profile.js";

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const LoginResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number().int(),
  refresh_token: z.string(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    role: UserRoleEnum,
    company_id: z.string().uuid(),
  }),
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const InviteUserRequestSchema = z.object({
  email: z.string().email(),
  role: UserRoleEnum,
  full_name: z.string(),
  phone: z.string(),
});
export type InviteUserRequest = z.infer<typeof InviteUserRequestSchema>;
