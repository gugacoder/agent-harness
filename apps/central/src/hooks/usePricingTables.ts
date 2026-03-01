import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PricingTable } from "@/types/api";

export function usePricingTables() {
  return useQuery<PricingTable[]>({
    queryKey: ["pricing-tables"],
    queryFn: () => api.get("api/pricing-tables").json<PricingTable[]>(),
  });
}
