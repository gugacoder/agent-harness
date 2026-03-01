import { useMemo, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useSSE, type SSEEventHandler } from "@/hooks/useSSE";
import type { CourierLocation } from "@/hooks/useCourierLocations";

/**
 * Company-level SSE hook that connects to /events/company/{companyId}
 * and integrates with react-query for automatic cache invalidation.
 *
 * Handles all company channel events:
 * - order_created    → invalidates ["orders"] queries
 * - order_status     → invalidates ["orders"] queries
 * - courier_location → updates courier location state (Map)
 * - courier_status   → invalidates ["couriers"] queries
 *
 * Returns { connected, courierLocations } for components that need
 * real-time courier positions (Dashboard map, Mapa page).
 */
export function useCompanyEvents() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [courierLocations, setCourierLocations] = useState<
    Map<string, CourierLocation>
  >(() => new Map());

  const companyId = user?.companyId ?? null;
  const channel = companyId ? `company/${companyId}` : null;

  const handleOrderCreated: SSEEventHandler = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["orders"] });
  }, [queryClient]);

  const handleOrderStatus: SSEEventHandler = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["orders"] });
  }, [queryClient]);

  const handleCourierLocation: SSEEventHandler = useCallback(
    (data) => {
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
    },
    [],
  );

  const handleCourierStatus: SSEEventHandler = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["couriers"] });
  }, [queryClient]);

  const handlers = useMemo(
    () => ({
      order_created: handleOrderCreated,
      order_status: handleOrderStatus,
      courier_location: handleCourierLocation,
      courier_status: handleCourierStatus,
    }),
    [
      handleOrderCreated,
      handleOrderStatus,
      handleCourierLocation,
      handleCourierStatus,
    ],
  );

  const { connected } = useSSE(channel, { handlers });

  return { connected, courierLocations };
}
