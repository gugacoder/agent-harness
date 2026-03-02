import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  Order,
  TimelineEvent,
  CourierInfo,
  DeliveryPrice,
} from "@/types/api";

export { useOrderEstimate } from "./useOrderEstimate";

export function useOrderDetail(orderId: string | null) {
  return useQuery<Order | null>({
    queryKey: ["order-detail", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      return api.get(`api/orders/${orderId}`).json<Order>();
    },
    enabled: !!orderId,
  });
}

export function useOrderTimeline(orderId: string | null) {
  return useQuery<TimelineEvent[]>({
    queryKey: ["order-timeline", orderId],
    queryFn: async () => {
      if (!orderId) return [];
      return api.get(`api/orders/${orderId}/timeline`).json<TimelineEvent[]>();
    },
    enabled: !!orderId,
  });
}

export function useCourierInfo(courierId: string | null) {
  return useQuery<CourierInfo | null>({
    queryKey: ["courier-info", courierId],
    queryFn: async () => {
      if (!courierId) return null;
      try {
        return await api.get(`api/couriers/${courierId}`).json<CourierInfo>();
      } catch {
        return null;
      }
    },
    enabled: !!courierId,
  });
}

export function useDeliveryPrice(deliveryId: string | null) {
  return useQuery<DeliveryPrice | null>({
    queryKey: ["delivery-price", deliveryId],
    queryFn: async () => {
      if (!deliveryId) return null;
      try {
        return await api
          .get(`api/deliveries/${deliveryId}/price`)
          .json<DeliveryPrice>();
      } catch {
        return null;
      }
    },
    enabled: !!deliveryId,
  });
}
