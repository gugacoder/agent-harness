import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Delivery } from "@/types/api";

export function useOrderDelivery(orderId: string | null) {
  return useQuery<Delivery | null>({
    queryKey: ["order-delivery", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      try {
        return await api.get(`api/orders/${orderId}/delivery`).json<Delivery>();
      } catch {
        return null;
      }
    },
    enabled: !!orderId,
  });
}
