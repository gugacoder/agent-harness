import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Delivery, Order } from "@/types/delivery";

export interface DeliveryWithOrder {
  delivery: Delivery;
  order: Order;
}

async function fetchDeliveryHistory(
  courierId: string,
): Promise<DeliveryWithOrder[]> {
  // Fetch delivered deliveries for this courier
  const deliveries = await api
    .get("api/deliveries", {
      searchParams: { courier_id: courierId, status: "delivered" },
    })
    .json<Delivery[]>();

  if (!deliveries.length) return [];

  // Fetch order data for each delivery
  const results = await Promise.all(
    deliveries.map(async (delivery) => {
      const order = await api
        .get(`api/orders/${delivery.order_id}`)
        .json<Order>();
      return { delivery, order };
    }),
  );

  // Sort by delivered_at descending
  return results.sort((a, b) => {
    const dateA = a.delivery.delivered_at ?? a.delivery.created_at;
    const dateB = b.delivery.delivered_at ?? b.delivery.created_at;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });
}

export function useDeliveryHistory(courierId: string | null) {
  return useQuery({
    queryKey: ["delivery-history", courierId],
    queryFn: () => fetchDeliveryHistory(courierId!),
    enabled: !!courierId,
  });
}
