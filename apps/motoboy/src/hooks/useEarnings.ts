import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { EarningItem } from "@/types/earnings";

export function useEarnings(periodStart?: string, periodEnd?: string) {
  return useQuery({
    queryKey: ["earnings", periodStart, periodEnd],
    queryFn: async () => {
      const searchParams: Record<string, string> = {};
      if (periodStart) searchParams.period_start = periodStart;
      if (periodEnd) searchParams.period_end = periodEnd;
      return api
        .get("api/couriers/me/earnings", { searchParams })
        .json<EarningItem[]>();
    },
  });
}
