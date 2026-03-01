import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { FinancialClosing, ClosingStatus } from "@/types/api";

export interface UseClosingsOptions {
  courierId?: string;
  status?: ClosingStatus;
  periodStart?: string;
  periodEnd?: string;
}

export function useClosings(options?: UseClosingsOptions) {
  return useQuery<FinancialClosing[]>({
    queryKey: [
      "closings",
      options?.courierId,
      options?.status,
      options?.periodStart,
      options?.periodEnd,
    ],
    queryFn: async () => {
      const searchParams: Record<string, string> = {};
      if (options?.courierId) searchParams.courier_id = options.courierId;
      if (options?.status) searchParams.status = options.status;
      if (options?.periodStart) searchParams.period_start = options.periodStart;
      if (options?.periodEnd) searchParams.period_end = options.periodEnd;
      return api
        .get("api/financial/closings", { searchParams })
        .json<FinancialClosing[]>();
    },
  });
}
