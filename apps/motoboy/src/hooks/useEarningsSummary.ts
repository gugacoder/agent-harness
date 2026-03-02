import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { EarningsSummary } from "@/types/earnings";

export function useEarningsSummary() {
  return useQuery({
    queryKey: ["earnings-summary"],
    queryFn: () =>
      api.get("api/couriers/me/earnings/summary").json<EarningsSummary>(),
  });
}
