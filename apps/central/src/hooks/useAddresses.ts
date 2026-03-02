import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { SavedAddress } from "@/types/api";

interface UseAddressesOptions {
  search?: string;
  sort?: "most_used" | "recent" | "alpha";
}

export function useAddresses(options?: UseAddressesOptions) {
  return useQuery<SavedAddress[]>({
    queryKey: ["saved-addresses", options?.search, options?.sort],
    queryFn: async () => {
      const searchParams: Record<string, string> = {};
      if (options?.search) searchParams.search = options.search;
      if (options?.sort) searchParams.sort = options.sort;
      return api
        .get("api/saved-addresses", { searchParams })
        .json<SavedAddress[]>();
    },
  });
}

interface CreateAddressData {
  address: string;
  lat: string;
  lng: string;
  label?: string;
  complement?: string;
  reference?: string;
  is_favorite?: boolean;
}

export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation<SavedAddress, Error, CreateAddressData>({
    mutationFn: (data) =>
      api.post("api/saved-addresses", { json: data }).json<SavedAddress>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-addresses"] });
    },
  });
}

interface UpdateAddressData {
  id: string;
  label?: string;
  address?: string;
  lat?: string;
  lng?: string;
  complement?: string | null;
  reference?: string | null;
  is_favorite?: boolean;
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation<SavedAddress, Error, UpdateAddressData>({
    mutationFn: ({ id, ...data }) =>
      api
        .patch(`api/saved-addresses/${id}`, { json: data })
        .json<SavedAddress>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-addresses"] });
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation<SavedAddress, Error, string>({
    mutationFn: (id) =>
      api.delete(`api/saved-addresses/${id}`).json<SavedAddress>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-addresses"] });
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation<SavedAddress, Error, { id: string; is_favorite: boolean }>(
    {
      mutationFn: ({ id, is_favorite }) =>
        api
          .patch(`api/saved-addresses/${id}`, { json: { is_favorite } })
          .json<SavedAddress>(),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["saved-addresses"] });
      },
    },
  );
}
