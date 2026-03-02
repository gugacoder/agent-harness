import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  AdminCompany,
  AdminCompanyDetail,
  AdminMetrics,
  CompanyStatus,
} from "@/types/api";

export interface CompaniesFilters {
  status?: CompanyStatus;
  search?: string;
}

export function useAdminCompanies(filters?: CompaniesFilters) {
  return useQuery<AdminCompany[]>({
    queryKey: ["admin-companies", filters?.status, filters?.search],
    queryFn: async () => {
      const searchParams: Record<string, string> = {};
      if (filters?.status) searchParams.status = filters.status;
      if (filters?.search) searchParams.search = filters.search;
      const res = await api
        .get("api/admin/companies", { searchParams })
        .json<{ companies: AdminCompany[] }>();
      return res.companies;
    },
  });
}

interface CreateCompanyData {
  name: string;
  cnpj: string;
  phone?: string;
  email?: string;
  address?: string;
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCompanyData) => {
      const res = await api
        .post("api/admin/companies", { json: data })
        .json<{ company: AdminCompanyDetail }>();
      return res.company;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
    },
  });
}

interface UpdateCompanyData {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: CompanyStatus;
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateCompanyData;
    }) => {
      const res = await api
        .patch(`api/admin/companies/${id}`, { json: data })
        .json<{ company: AdminCompanyDetail }>();
      return res.company;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
    },
  });
}

export function useAdminMetrics() {
  return useQuery<AdminMetrics>({
    queryKey: ["admin-metrics"],
    queryFn: async () => {
      const res = await api
        .get("api/admin/metrics")
        .json<AdminMetrics>();
      return res;
    },
  });
}
