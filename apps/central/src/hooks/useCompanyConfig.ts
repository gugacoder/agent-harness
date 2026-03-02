import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CompanyConfig, UpdateCompanyConfigData } from "@/types/api";

export function useCompanyConfig() {
  return useQuery<CompanyConfig>({
    queryKey: ["company-config"],
    queryFn: () => api.get("api/company/config").json<CompanyConfig>(),
  });
}

export function useUpdateCompanyConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCompanyConfigData) =>
      api
        .patch("api/company/config", { json: data })
        .json<CompanyConfig>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-config"] });
    },
  });
}

export function useTestWhatsApp() {
  return useMutation({
    mutationFn: () =>
      api.post("api/company/config/test-whatsapp").json<{ ok?: boolean; error?: string }>(),
  });
}

export function useTestSmtp() {
  return useMutation({
    mutationFn: () =>
      api.post("api/company/config/test-smtp").json<{ ok?: boolean; error?: string }>(),
  });
}

export function useDetectTls() {
  return useMutation({
    mutationFn: (data: { host: string; port: number }) =>
      api
        .post("api/company/config/detect-tls", { json: data })
        .json<{ tls: boolean; success: boolean }>(),
  });
}
