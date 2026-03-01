import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  Delivery,
  Order,
  DeliveryEvent,
  ActiveDeliveryData,
  PendingDelivery,
} from "@/types/delivery";
import { useCallback, useState } from "react";

const ACTIVE_DELIVERY_KEY = "chegala_active_delivery_id";

function getStoredDeliveryId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_DELIVERY_KEY);
  } catch {
    return null;
  }
}

function storeDeliveryId(id: string | null) {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_DELIVERY_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_DELIVERY_KEY);
    }
  } catch {
    // localStorage unavailable
  }
}

async function fetchDelivery(id: string): Promise<Delivery> {
  return api.get(`api/deliveries/${id}`).json();
}

async function fetchOrder(id: string): Promise<Order> {
  return api.get(`api/orders/${id}`).json();
}

async function fetchDeliveryEvents(id: string): Promise<DeliveryEvent[]> {
  return api.get(`api/deliveries/${id}/events`).json();
}

export function useActiveDelivery() {
  const queryClient = useQueryClient();
  const [activeDeliveryId, setActiveDeliveryId] = useState<string | null>(
    getStoredDeliveryId,
  );
  const [pendingDelivery, setPendingDelivery] =
    useState<PendingDelivery | null>(null);

  // Fetch active delivery + order data
  const deliveryQuery = useQuery({
    queryKey: ["delivery", activeDeliveryId],
    queryFn: () => fetchDelivery(activeDeliveryId!),
    enabled: !!activeDeliveryId,
  });

  const orderQuery = useQuery({
    queryKey: ["order", deliveryQuery.data?.order_id],
    queryFn: () => fetchOrder(deliveryQuery.data!.order_id),
    enabled: !!deliveryQuery.data?.order_id,
  });

  // Fetch pending delivery order data (for notification card)
  const pendingOrderQuery = useQuery({
    queryKey: ["order", pendingDelivery?.order_id],
    queryFn: () => fetchOrder(pendingDelivery!.order_id),
    enabled: !!pendingDelivery?.order_id,
  });

  // Fetch timeline events
  const eventsQuery = useQuery({
    queryKey: ["delivery-events", activeDeliveryId],
    queryFn: () => fetchDeliveryEvents(activeDeliveryId!),
    enabled: !!activeDeliveryId,
  });

  // Accept delivery
  const acceptMutation = useMutation({
    mutationFn: (deliveryId: string) =>
      api.post(`api/deliveries/${deliveryId}/accept`).json<Delivery>(),
    onSuccess: (delivery) => {
      setActiveDeliveryId(delivery.id);
      storeDeliveryId(delivery.id);
      setPendingDelivery(null);
      queryClient.setQueryData(["delivery", delivery.id], delivery);
      queryClient.invalidateQueries({ queryKey: ["delivery-events", delivery.id] });
    },
  });

  // Reject delivery
  const rejectMutation = useMutation({
    mutationFn: (deliveryId: string) =>
      api.post(`api/deliveries/${deliveryId}/reject`, { json: {} }).json<Delivery>(),
    onSuccess: () => {
      setPendingDelivery(null);
    },
  });

  // Update order status (picked_up, in_transit, delivered)
  const updateStatusMutation = useMutation({
    mutationFn: ({
      orderId,
      status,
    }: {
      orderId: string;
      status: string;
    }) =>
      api
        .patch(`api/orders/${orderId}/status`, { json: { status } })
        .json<Order>(),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(
        ["order", updatedOrder.id],
        updatedOrder,
      );
      // Refresh delivery data to get updated timestamps
      if (activeDeliveryId) {
        queryClient.invalidateQueries({
          queryKey: ["delivery", activeDeliveryId],
        });
        queryClient.invalidateQueries({
          queryKey: ["delivery-events", activeDeliveryId],
        });
      }
      // If delivered, clear active delivery
      if (updatedOrder.status === "delivered") {
        setActiveDeliveryId(null);
        storeDeliveryId(null);
      }
    },
  });

  // Set pending delivery (called by SSE handler in F-008)
  const onDeliveryAssigned = useCallback((pending: PendingDelivery) => {
    setPendingDelivery(pending);
  }, []);

  // Clear active delivery (called by SSE when delivery_cancelled)
  const onDeliveryCancelled = useCallback(() => {
    setActiveDeliveryId(null);
    storeDeliveryId(null);
    setPendingDelivery(null);
    queryClient.removeQueries({ queryKey: ["delivery"] });
    queryClient.removeQueries({ queryKey: ["order"] });
    queryClient.removeQueries({ queryKey: ["delivery-events"] });
  }, [queryClient]);

  // Build active delivery data
  const activeDelivery: ActiveDeliveryData | null =
    deliveryQuery.data && orderQuery.data
      ? { delivery: deliveryQuery.data, order: orderQuery.data }
      : null;

  // Check if the stored delivery is actually still active (not delivered/failed)
  const isDeliveryActive =
    activeDelivery &&
    !["delivered", "failed"].includes(activeDelivery.delivery.status);

  return {
    // State
    activeDelivery: isDeliveryActive ? activeDelivery : null,
    pendingDelivery,
    pendingOrder: pendingOrderQuery.data ?? null,
    events: eventsQuery.data ?? [],
    isLoading:
      deliveryQuery.isLoading || orderQuery.isLoading,
    isPendingLoading: pendingOrderQuery.isLoading,

    // Actions
    acceptDelivery: acceptMutation.mutateAsync,
    rejectDelivery: rejectMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    onDeliveryAssigned,
    onDeliveryCancelled,

    // Mutation states
    isAccepting: acceptMutation.isPending,
    isRejecting: rejectMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
  };
}
