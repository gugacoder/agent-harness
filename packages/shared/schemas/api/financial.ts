import { z } from "zod";
import { ClosingStatusEnum } from "../entities/financial-closing.js";

export const CreateClosingRequestSchema = z.object({
  courier_id: z.string().uuid(),
  period_start: z.string(),
  period_end: z.string(),
});
export type CreateClosingRequest = z.infer<typeof CreateClosingRequestSchema>;

export const ClosingListQuerySchema = z.object({
  courier_id: z.string().uuid().optional(),
  status: ClosingStatusEnum.optional(),
  period_start: z.string().optional(),
  period_end: z.string().optional(),
});
export type ClosingListQuery = z.infer<typeof ClosingListQuerySchema>;
