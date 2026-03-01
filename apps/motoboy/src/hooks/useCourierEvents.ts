import { useMemo, useCallback, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveDeliveryContext } from "@/contexts/ActiveDeliveryContext";
import { useSSE, type SSEEventHandler } from "@/hooks/useSSE";

/**
 * Courier-level SSE hook — connects to /events/courier/{courierId}
 * and dispatches delivery events to the active delivery context.
 *
 * Events handled:
 * - delivery_assigned → sets pending delivery for accept/reject
 * - delivery_cancelled → clears active delivery and fires toast
 */
export function useCourierEvents() {
  const { user } = useAuth();
  const { onDeliveryAssigned, onDeliveryCancelled } =
    useActiveDeliveryContext();
  const [toast, setToast] = useState<string | null>(null);

  const courierId = user?.id ?? null;
  const channel = courierId ? `courier/${courierId}` : null;

  const handleDeliveryAssigned: SSEEventHandler = useCallback(
    (data) => {
      onDeliveryAssigned({
        delivery_id: data.delivery_id as string,
        order_id: data.order_id as string,
      });
    },
    [onDeliveryAssigned],
  );

  const handleDeliveryCancelled: SSEEventHandler = useCallback(() => {
    onDeliveryCancelled();
    setToast("Entrega cancelada pela central.");
  }, [onDeliveryCancelled]);

  const handlers = useMemo(
    () => ({
      delivery_assigned: handleDeliveryAssigned,
      delivery_cancelled: handleDeliveryCancelled,
    }),
    [handleDeliveryAssigned, handleDeliveryCancelled],
  );

  const { connected } = useSSE(channel, { handlers });

  const dismissToast = useCallback(() => setToast(null), []);

  return { connected, toast, dismissToast };
}
