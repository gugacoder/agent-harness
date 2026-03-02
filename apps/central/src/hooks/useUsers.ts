import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { User, UserRole } from "@/types/api";

export interface UsersFilters {
  role?: UserRole;
  active?: boolean;
  search?: string;
}

export function useUsers(filters?: UsersFilters) {
  return useQuery<User[]>({
    queryKey: ["users", filters?.role, filters?.active, filters?.search],
    queryFn: async () => {
      const searchParams: Record<string, string> = {};
      if (filters?.role) searchParams.role = filters.role;
      if (filters?.active !== undefined)
        searchParams.active = String(filters.active);
      if (filters?.search) searchParams.search = filters.search;
      const res = await api
        .get("api/users", { searchParams })
        .json<{ users: User[] }>();
      return res.users;
    },
  });
}

interface UpdateUserData {
  full_name?: string;
  phone?: string;
  email?: string;
  role?: UserRole;
  active?: boolean;
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserData }) => {
      const res = await api
        .patch(`api/users/${id}`, { json: data })
        .json<{ user: User }>();
      return res.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await api
        .patch(`api/users/${id}/status`, { json: { active } })
        .json<{ ok: boolean }>();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (id: string) => {
      await api
        .post(`api/users/${id}/reset-password`)
        .json<{ ok: boolean }>();
    },
  });
}
