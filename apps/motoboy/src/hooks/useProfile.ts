import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Profile {
  id: string;
  company_id: string;
  role: string;
  full_name: string;
  phone: string;
  avatar_url: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  vehicle_type?: string | null;
  plate?: string | null;
  cnh?: string | null;
  trade_name?: string | null;
  address?: string | null;
  business_hours?: unknown;
}

export interface UpdateProfileData {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  vehicle_type?: string;
  plate?: string;
  cnh?: string;
  trade_name?: string;
  address?: string;
  business_hours?: unknown;
}

export function useProfile() {
  return useQuery<{ profile: Profile }>({
    queryKey: ["profile"],
    queryFn: () => api.get("api/profiles/me").json<{ profile: Profile }>(),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileData) =>
      api
        .patch("api/profiles/me", { json: data })
        .json<{ profile: Profile }>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
