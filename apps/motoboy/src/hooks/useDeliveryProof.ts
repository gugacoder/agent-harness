import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { DeliveryProof } from "@/types/delivery";

export function useDeliveryProof(deliveryId: string | null) {
  return useQuery<DeliveryProof | null>({
    queryKey: ["delivery-proof", deliveryId],
    queryFn: async () => {
      if (!deliveryId) return null;
      try {
        return await api
          .get(`api/deliveries/${deliveryId}/proof`)
          .json<DeliveryProof>();
      } catch {
        return null;
      }
    },
    enabled: !!deliveryId,
  });
}
