import { z } from "zod";
import { ClosingPeriodEnum } from "../entities/financial-closing.js";

export const UpdateCompanyConfigRequestSchema = z.object({
  pod_required: z.boolean().optional(),
  default_closing_period: ClosingPeriodEnum.optional(),
  default_invoice_period: ClosingPeriodEnum.optional(),
});
export type UpdateCompanyConfigRequest = z.infer<
  typeof UpdateCompanyConfigRequestSchema
>;
