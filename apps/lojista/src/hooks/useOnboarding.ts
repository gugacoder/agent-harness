import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { OnboardingStep } from "@chegala/schemas";

const FLOW = "guided_overlay" as const;

const STEPS = [
  "delivery_address",
  "recipient",
  "confirm_button",
  "post_order_flow",
  "completed",
] as const;

type StepKey = (typeof STEPS)[number];

export function useOnboarding() {
  const queryClient = useQueryClient();

  const query = useQuery<OnboardingStep[]>({
    queryKey: ["onboarding", FLOW],
    queryFn: () =>
      api
        .get("api/onboarding/progress", { searchParams: { flow: FLOW } })
        .json<OnboardingStep[]>(),
  });

  const completedKeys = new Set(query.data?.map((s) => s.step_key) ?? []);

  const shouldShowOnboarding = !completedKeys.has("completed");

  const mutation = useMutation({
    mutationFn: (stepKey: StepKey) =>
      api
        .post("api/onboarding/progress", {
          json: { flow: FLOW, step_key: stepKey },
        })
        .json<OnboardingStep>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding", FLOW] });
    },
  });

  const completeStep = (stepKey: StepKey) => mutation.mutateAsync(stepKey);

  return {
    shouldShowOnboarding,
    completeStep,
    completedSteps: completedKeys,
    isLoading: query.isLoading,
  };
}
