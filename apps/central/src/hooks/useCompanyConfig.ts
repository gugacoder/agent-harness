import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HTTPError } from "ky";
import { api } from "@/lib/api";
import type { CompanyConfig } from "@/types/api";

async function extractApiError(err: unknown): Promise<Error> {
  if (err instanceof HTTPError) {
    try {
      const body = await err.response.json() as { message?: string };
      if (body.message) return new Error(body.message);
    } catch {
      // response body not JSON — fall through
    }
  }
  if (err instanceof Error) return err;
  return new Error("Erro desconhecido");
}

export function useCompanyConfig() {
  return useQuery<CompanyConfig>({
    queryKey: ["company-config"],
    queryFn: async () => {
      try {
        return await api.get("api/company/config").json<CompanyConfig>();
      } catch (err) {
        throw await extractApiError(err);
      }
    },
  });
}

export function useUpdateCompanyConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { pod_required?: boolean }) => {
      try {
        return await api
          .patch("api/company/config", { json: data })
          .json<CompanyConfig>();
      } catch (err) {
        throw await extractApiError(err);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-config"] });
    },
  });
}
