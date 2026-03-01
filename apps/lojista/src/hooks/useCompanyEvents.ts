import { useMemo, useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useSSE, type SSEEventHandler } from "@/hooks/useSSE";
import { api } from "@/lib/api";

export interface CourierLocation {
  courier_id: string;
  lat: number;
  lng: number;
  accuracy: number;
  delivery_id: string | null;
  timestamp: string;
}

/**
 * Company-level SSE hook — connects to /events/company/{companyId}
 * and invalidates react-query caches on relevant events.
 *
 * Events handled:
 * - order_created    → invalidates ["orders"]
 * - order_status     → invalidates ["orders"], cleans up tracking for completed/cancelled orders
 * - courier_location → updates courier location state, resolves delivery→order mapping
 */
export function useCompanyEvents() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [courierLocations, setCourierLocations] = useState<
    Map<string, CourierLocation>
  >(() => new Map());
  const [orderCourierMap, setOrderCourierMap] = useState<
    Map<string, CourierLocation>
  >(() => new Map());

  // Cache: delivery_id → order_id (avoids re-fetching)
  const deliveryOrderCache = useRef<Map<string, string>>(new Map());
  const pendingFetches = useRef<Set<string>>(new Set());

  const companyId = user?.companyId ?? null;
  const channel = companyId ? `company/${companyId}` : null;

  const handleOrderCreated: SSEEventHandler = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["orders"] });
  }, [queryClient]);

  const handleOrderStatus: SSEEventHandler = useCallback(
    (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });

      // Clean up courier tracking for completed/cancelled orders
      const status = data.status as string;
      const orderId = data.order_id as string;
      if (
        orderId &&
        (status === "delivered" || status === "cancelled")
      ) {
        setOrderCourierMap((prev) => {
          if (!prev.has(orderId)) return prev;
          const next = new Map(prev);
          next.delete(orderId);
          return next;
        });
      }
    },
    [queryClient],
  );

  const handleCourierLocation: SSEEventHandler = useCallback((data) => {
    const loc: CourierLocation = {
      courier_id: data.courier_id as string,
      lat: parseFloat(data.lat as string),
      lng: parseFloat(data.lng as string),
      accuracy: parseFloat(data.accuracy as string),
      delivery_id: (data.delivery_id as string | null) ?? null,
      timestamp: data.timestamp as string,
    };

    setCourierLocations((prev) => {
      const next = new Map(prev);
      next.set(loc.courier_id, loc);
      return next;
    });

    // Resolve delivery_id → order_id for order-level courier tracking
    if (loc.delivery_id) {
      const cachedOrderId = deliveryOrderCache.current.get(loc.delivery_id);
      if (cachedOrderId) {
        setOrderCourierMap((prev) => {
          const next = new Map(prev);
          next.set(cachedOrderId, loc);
          return next;
        });
      } else if (!pendingFetches.current.has(loc.delivery_id)) {
        // Fetch delivery to discover order_id (one-time per delivery_id)
        const deliveryId = loc.delivery_id;
        pendingFetches.current.add(deliveryId);
        api
          .get(`api/deliveries/${deliveryId}`)
          .json<{ order_id: string }>()
          .then((delivery) => {
            deliveryOrderCache.current.set(deliveryId, delivery.order_id);
            setOrderCourierMap((prev) => {
              const next = new Map(prev);
              next.set(delivery.order_id, loc);
              return next;
            });
          })
          .catch(() => {
            // Delivery fetch failed — silently ignore
          })
          .finally(() => {
            pendingFetches.current.delete(deliveryId);
          });
      }
    }
  }, []);

  const handlers = useMemo(
    () => ({
      order_created: handleOrderCreated,
      order_status: handleOrderStatus,
      courier_location: handleCourierLocation,
    }),
    [handleOrderCreated, handleOrderStatus, handleCourierLocation],
  );

  const { connected } = useSSE(channel, { handlers });

  return { connected, courierLocations, orderCourierMap };
}
