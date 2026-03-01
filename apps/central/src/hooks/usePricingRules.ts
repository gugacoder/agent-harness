import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PricingRule } from "@/types/api";

export function usePricingRules(tableId: string | null) {
  return useQuery<PricingRule[]>({
    queryKey: ["pricing-rules", tableId],
    queryFn: () =>
      api
        .get(`api/pricing-tables/${tableId}/rules`)
        .json<PricingRule[]>(),
    enabled: !!tableId,
  });
}
