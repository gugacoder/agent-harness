import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CompanyConfig } from "@/types/api";

export function useCompanyConfig() {
  return useQuery<CompanyConfig>({
    queryKey: ["company-config"],
    queryFn: () => api.get("api/company/config").json<CompanyConfig>(),
  });
}

export function useUpdateCompanyConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { pod_required?: boolean }) =>
      api
        .patch("api/company/config", { json: data })
        .json<CompanyConfig>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-config"] });
    },
  });
}
