import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface OnboardingStep {
  id: string;
  profile_id: string;
  flow: string;
  step_key: string;
  metadata: Record<string, unknown> | null;
  completed_at: string;
  created_at: string;
}

const TUTORIAL_STEPS = [
  "welcome",
  "gps_permission",
  "how_it_works",
  "status_explained",
  "completed",
] as const;

type TutorialStepKey = (typeof TUTORIAL_STEPS)[number];

async function fetchProgress(flow: string): Promise<OnboardingStep[]> {
  return api
    .get("api/onboarding/progress", { searchParams: { flow } })
    .json();
}

async function postStep(
  flow: string,
  stepKey: string,
  metadata?: Record<string, unknown>,
): Promise<OnboardingStep> {
  return api
    .post("api/onboarding/progress", {
      json: { flow, step_key: stepKey, ...(metadata ? { metadata } : {}) },
    })
    .json();
}

export function useOnboarding(flow: "tutorial") {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const progressQuery = useQuery({
    queryKey: ["onboarding", flow],
    queryFn: () => fetchProgress(flow),
    enabled: !!user,
  });

  const completeMutation = useMutation({
    mutationFn: ({
      stepKey,
      metadata,
    }: {
      stepKey: string;
      metadata?: Record<string, unknown>;
    }) => postStep(flow, stepKey, metadata),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding", flow] });
    },
  });

  const completedSteps = progressQuery.data ?? [];

  const completedKeys = new Set(completedSteps.map((s) => s.step_key));

  const shouldShowOnboarding =
    progressQuery.isSuccess && !completedKeys.has("completed");

  const currentStep: TutorialStepKey =
    TUTORIAL_STEPS.find((key) => !completedKeys.has(key)) ?? "completed";

  function completeStep(
    key: string,
    metadata?: Record<string, unknown>,
  ) {
    completeMutation.mutate({ stepKey: key, metadata });
  }

  return {
    shouldShowOnboarding,
    completedSteps,
    currentStep,
    completeStep,
    isLoading: progressQuery.isLoading,
  };
}
