import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AppType } from "../types.js";
import { authMiddleware } from "../middleware/auth.js";
import { companyMiddleware } from "../middleware/company.js";
import {
  getOnboardingProgress,
  completeOnboardingStep,
  resetOnboardingProgress,
} from "../services/onboarding.service.js";
import {
  GetOnboardingProgressQuerySchema,
  CompleteOnboardingStepRequestSchema,
  OnboardingProgressResponseSchema,
  OnboardingStepSchema,
  OnboardingFlowEnum,
} from "@chegala/schemas";

const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number().int(),
});

// --- Router ---

const onboardingRouter = new OpenAPIHono<AppType>({
  defaultHook: (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: "Bad Request",
          message: "Validation failed",
          statusCode: 400,
          details: result.error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        },
        400
      );
    }
  },
});

// Apply auth + company middleware
onboardingRouter.use("/onboarding/*", authMiddleware);
onboardingRouter.use("/onboarding/*", companyMiddleware);

// --- GET /api/onboarding/progress ---

const getProgressRoute = createRoute({
  method: "get",
  path: "/onboarding/progress",
  tags: ["Onboarding"],
  summary: "Get onboarding progress",
  description:
    "List completed onboarding steps for the authenticated user. Optionally filter by flow.",
  request: {
    query: GetOnboardingProgressQuerySchema,
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: OnboardingProgressResponseSchema },
      },
      description: "List of completed onboarding steps",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

onboardingRouter.openapi(getProgressRoute, async (c) => {
  const user = c.get("user");
  const { flow } = c.req.valid("query");

  const steps = await getOnboardingProgress(user.id, flow);

  return c.json(
    steps.map((s) => ({
      id: s.id,
      profile_id: s.profile_id,
      flow: s.flow,
      step_key: s.step_key,
      metadata: (s.metadata as Record<string, unknown>) ?? null,
      completed_at: s.completed_at,
      created_at: s.created_at,
    })),
    200
  );
});

// --- POST /api/onboarding/progress ---

const completeStepRoute = createRoute({
  method: "post",
  path: "/onboarding/progress",
  tags: ["Onboarding"],
  summary: "Complete onboarding step",
  description:
    "Record an onboarding step as completed. Idempotent — if the step already exists, returns the existing record.",
  request: {
    body: {
      content: {
        "application/json": { schema: CompleteOnboardingStepRequestSchema },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": { schema: OnboardingStepSchema },
      },
      description: "Onboarding step completed",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

onboardingRouter.openapi(completeStepRoute, async (c) => {
  const user = c.get("user");
  const body = c.req.valid("json");

  const step = await completeOnboardingStep(user.id, {
    flow: body.flow,
    step_key: body.step_key,
    metadata: body.metadata,
  });

  return c.json(
    {
      id: step.id,
      profile_id: step.profile_id,
      flow: step.flow,
      step_key: step.step_key,
      metadata: (step.metadata as Record<string, unknown>) ?? null,
      completed_at: step.completed_at,
      created_at: step.created_at,
    },
    201
  );
});

// --- DELETE /api/onboarding/progress ---

const resetProgressRoute = createRoute({
  method: "delete",
  path: "/onboarding/progress",
  tags: ["Onboarding"],
  summary: "Reset onboarding progress",
  description:
    "Delete all completed steps for a specific onboarding flow. The flow query parameter is required.",
  request: {
    query: z.object({
      flow: OnboardingFlowEnum,
    }),
  },
  responses: {
    204: {
      description: "Onboarding progress reset successfully",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

onboardingRouter.openapi(resetProgressRoute, async (c) => {
  const user = c.get("user");
  const { flow } = c.req.valid("query");

  await resetOnboardingProgress(user.id, flow);

  return c.body(null, 204);
});

export { onboardingRouter };
