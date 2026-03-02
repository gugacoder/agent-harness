import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  CourierDetail,
  CourierDeliveriesResponse,
  CourierMetrics,
} from "@/types/api";

export function useCourierDetail(courierId: string | null) {
  return useQuery<CourierDetail>({
    queryKey: ["courier", courierId],
    queryFn: () => api.get(`api/couriers/${courierId}`).json<CourierDetail>(),
    enabled: !!courierId,
  });
}

export function useCourierDeliveries(
  courierId: string | null,
  options?: { limit?: number; offset?: number; status?: string; period?: number }
) {
  return useQuery<CourierDeliveriesResponse>({
    queryKey: ["courier-deliveries", courierId, options],
    queryFn: () => {
      const searchParams: Record<string, string> = {};
      if (options?.limit) searchParams.limit = String(options.limit);
      if (options?.offset) searchParams.offset = String(options.offset);
      if (options?.status) searchParams.status = options.status;
      if (options?.period) searchParams.period = String(options.period);
      return api
        .get(`api/couriers/${courierId}/deliveries`, { searchParams })
        .json<CourierDeliveriesResponse>();
    },
    enabled: !!courierId,
  });
}

export function useCourierMetrics(courierId: string | null) {
  return useQuery<CourierMetrics>({
    queryKey: ["courier-metrics", courierId],
    queryFn: () =>
      api.get(`api/couriers/${courierId}/metrics`).json<CourierMetrics>(),
    enabled: !!courierId,
  });
}

export function useUpdateCourier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courierId,
      data,
    }: {
      courierId: string;
      data: {
        full_name?: string;
        phone?: string;
        vehicle_type?: string | null;
        plate_number?: string | null;
        photo_url?: string | null;
      };
    }) => api.patch(`api/couriers/${courierId}`, { json: data }).json(),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["courier", variables.courierId] });
      queryClient.invalidateQueries({ queryKey: ["couriers"] });
    },
  });
}

export function useToggleCourierActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courierId,
      active,
    }: {
      courierId: string;
      active: boolean;
    }) =>
      api.patch(`api/couriers/${courierId}/active`, { json: { active } }).json(),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["courier", variables.courierId] });
      queryClient.invalidateQueries({ queryKey: ["couriers"] });
    },
  });
}
