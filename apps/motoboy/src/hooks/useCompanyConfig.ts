import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface CompanyConfig {
  company_id: string;
  pod_required: boolean;
}

export function useCompanyConfig() {
  return useQuery<CompanyConfig>({
    queryKey: ["company-config"],
    queryFn: () => api.get("api/company/config").json<CompanyConfig>(),
    staleTime: 5 * 60_000, // 5 min — config rarely changes
  });
}
