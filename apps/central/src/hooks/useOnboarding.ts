import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

const STEP_ORDER = [
  "welcome",
  "company_data",
  "pricing",
  "team_invite",
  "completed",
] as const;

interface OnboardingStep {
  id: string;
  profile_id: string;
  flow: string;
  step_key: string;
  metadata: Record<string, unknown> | null;
  completed_at: string;
  created_at: string;
}

export function useOnboarding(flow: string = "wizard") {
  const queryClient = useQueryClient();

  const query = useQuery<OnboardingStep[]>({
    queryKey: ["onboarding", flow],
    queryFn: () =>
      api
        .get(`api/onboarding/progress`, { searchParams: { flow } })
        .json<OnboardingStep[]>(),
  });

  const completedSteps = (query.data ?? []).map((s) => s.step_key);

  const shouldShowOnboarding = !completedSteps.includes("completed");

  const currentStep =
    STEP_ORDER.find((step) => !completedSteps.includes(step)) ?? null;

  const completeStepMutation = useMutation({
    mutationFn: (params: { key: string; metadata?: Record<string, unknown> }) =>
      api
        .post("api/onboarding/progress", {
          json: {
            flow,
            step_key: params.key,
            metadata: params.metadata,
          },
        })
        .json<OnboardingStep>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding", flow] });
    },
  });

  const resetMutation = useMutation({
    mutationFn: () =>
      api.delete(`api/onboarding/progress`, { searchParams: { flow } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding", flow] });
    },
  });

  const completeStep = (key: string, metadata?: Record<string, unknown>) =>
    completeStepMutation.mutateAsync({ key, metadata });

  const resetProgress = () => resetMutation.mutateAsync();

  return {
    isLoading: query.isLoading,
    completedSteps,
    shouldShowOnboarding,
    currentStep,
    completeStep,
    resetProgress,
  };
}
