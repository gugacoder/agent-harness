import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { RegistrationRequest } from "@/types/api";

export function usePendingRegistrations() {
  return useQuery<RegistrationRequest[]>({
    queryKey: ["registration", "pending"],
    queryFn: async () => {
      const res = await api
        .get("api/registration/pending")
        .json<{ requests: RegistrationRequest[] }>();
      return res.requests;
    },
  });
}

export function useApproveRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api
        .post(`api/registration/${id}/approve`)
        .json<{ ok: boolean }>();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registration"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useRejectRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api
        .post(`api/registration/${id}/reject`)
        .json<{ ok: boolean }>();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registration"] });
    },
  });
}
