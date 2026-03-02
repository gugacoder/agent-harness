import { z } from "zod";

export const OnboardingFlowEnum = z.enum([
  "wizard",
  "tutorial",
  "guided_overlay",
]);
export type OnboardingFlow = z.infer<typeof OnboardingFlowEnum>;

export const OnboardingStepSchema = z.object({
  id: z.string().uuid(),
  profile_id: z.string().uuid(),
  flow: OnboardingFlowEnum,
  step_key: z.string(),
  metadata: z.record(z.unknown()).nullable(),
  completed_at: z.string().datetime(),
  created_at: z.string().datetime(),
});
export type OnboardingStep = z.infer<typeof OnboardingStepSchema>;
