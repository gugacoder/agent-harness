import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { OrderEstimate } from "@/types/api";

interface UseOrderEstimateOptions {
  pickupLat: number;
  pickupLng: number;
  deliveryLat: number;
  deliveryLng: number;
  enabled: boolean;
}

export function useOrderEstimate(options: UseOrderEstimateOptions) {
  const { pickupLat, pickupLng, deliveryLat, deliveryLng, enabled } = options;

  return useQuery<OrderEstimate>({
    queryKey: [
      "order-estimate",
      pickupLat,
      pickupLng,
      deliveryLat,
      deliveryLng,
    ],
    queryFn: async () => {
      return api
        .get("api/orders/estimate", {
          searchParams: {
            pickup_lat: String(pickupLat),
            pickup_lng: String(pickupLng),
            delivery_lat: String(deliveryLat),
            delivery_lng: String(deliveryLng),
          },
        })
        .json<OrderEstimate>();
    },
    enabled:
      enabled &&
      pickupLat !== 0 &&
      pickupLng !== 0 &&
      deliveryLat !== 0 &&
      deliveryLng !== 0,
    retry: false,
  });
}
