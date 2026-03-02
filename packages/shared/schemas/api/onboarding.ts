import { z } from "zod";
import {
  OnboardingFlowEnum,
  OnboardingStepSchema,
} from "../entities/onboarding.js";

export const GetOnboardingProgressQuerySchema = z.object({
  flow: OnboardingFlowEnum.optional(),
});
export type GetOnboardingProgressQuery = z.infer<
  typeof GetOnboardingProgressQuerySchema
>;

export const CompleteOnboardingStepRequestSchema = z.object({
  flow: OnboardingFlowEnum,
  step_key: z.string(),
  metadata: z.record(z.unknown()).optional(),
});
export type CompleteOnboardingStepRequest = z.infer<
  typeof CompleteOnboardingStepRequestSchema
>;

export const OnboardingProgressResponseSchema = z.array(OnboardingStepSchema);
export type OnboardingProgressResponse = z.infer<
  typeof OnboardingProgressResponseSchema
>;
