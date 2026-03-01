import { z } from "zod";

export const AnalyticsPeriodQuerySchema = z.object({
  period_start: z.string().optional(),
  period_end: z.string().optional(),
});
export type AnalyticsPeriodQuery = z.infer<typeof AnalyticsPeriodQuerySchema>;
