import { z } from "zod";

import { ClosingPeriodEnum } from "./financial-closing.js";

export const CompanyConfigSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  pod_required: z.boolean(),
  default_closing_period: ClosingPeriodEnum,
  default_invoice_period: ClosingPeriodEnum,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type CompanyConfig = z.infer<typeof CompanyConfigSchema>;
