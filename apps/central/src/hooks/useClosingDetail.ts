import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { FinancialClosingWithItems } from "@/types/api";

export function useClosingDetail(closingId: string | null) {
  return useQuery<FinancialClosingWithItems>({
    queryKey: ["closing", closingId],
    queryFn: () =>
      api
        .get(`api/financial/closings/${closingId}`)
        .json<FinancialClosingWithItems>(),
    enabled: !!closingId,
  });
}
