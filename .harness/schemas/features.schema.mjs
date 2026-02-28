import { z } from "zod";

export const FeatureStatusSchema = z.enum([
  "failing",
  "passing",
  "skipped",
  "pending",
  "in_progress",
  "blocked",
]);

export const FeatureSchema = z.object({
  id: z.string().regex(/^F-\d{3}$/),
  name: z.string(),
  description: z.string(),
  status: FeatureStatusSchema,
  agent: z.enum(["researcher", "general", "coder"]).optional(),
  dependencies: z.array(z.string()).default([]),
  wave: z.number().int().positive().optional(),
  completed_at: z.string().datetime().optional(),
  skip_reason: z.string().optional(),
  prp_path: z.string().optional(),
}).passthrough();

export const FeaturesFileSchema = z.union([
  z.array(FeatureSchema),
  z.object({ features: z.array(FeatureSchema) }).passthrough(),
]);
