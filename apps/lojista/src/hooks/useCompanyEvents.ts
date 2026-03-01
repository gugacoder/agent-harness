import { useMemo, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useSSE, type SSEEventHandler } from "@/hooks/useSSE";

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
 * - order_created   → invalidates ["orders"]
 * - order_status    → invalidates ["orders"]
 * - courier_location → updates courier location state
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

  return { connected, courierLocations };
}
