import { z } from "zod";

export const SendOtpSchema = z.object({
  phone_or_email: z.string().min(1),
  channel: z.enum(["whatsapp", "email"]),
});
export type SendOtpRequest = z.infer<typeof SendOtpSchema>;

export const VerifyOtpSchema = z.object({
  phone_or_email: z.string().min(1),
  code: z.string().length(6),
});
export type VerifyOtpRequest = z.infer<typeof VerifyOtpSchema>;
