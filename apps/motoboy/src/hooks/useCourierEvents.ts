import { useMemo, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveDeliveryContext } from "@/contexts/ActiveDeliveryContext";
import { useSSE, type SSEEventHandler } from "@/hooks/useSSE";

export interface CourierToast {
  message: string;
  variant: "warning" | "success";
}

/**
 * Courier-level SSE hook — connects to /events/courier/{courierId}
 * and dispatches delivery events to the active delivery context.
 *
 * Events handled:
 * - delivery_assigned → sets pending delivery for accept/reject
 * - delivery_cancelled → clears active delivery and fires toast
 * - closing_paid → invalidates earnings queries and fires success toast
 */
export function useCourierEvents() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { onDeliveryAssigned, onDeliveryCancelled } =
    useActiveDeliveryContext();
  const [toast, setToast] = useState<CourierToast | null>(null);

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
    setToast({ message: "Entrega cancelada pela central.", variant: "warning" });
  }, [onDeliveryCancelled]);

  const handleClosingPaid: SSEEventHandler = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["earnings"] });
    queryClient.invalidateQueries({ queryKey: ["earnings-summary"] });
    setToast({ message: "Pagamento recebido!", variant: "success" });
  }, [queryClient]);

  const handlers = useMemo(
    () => ({
      delivery_assigned: handleDeliveryAssigned,
      delivery_cancelled: handleDeliveryCancelled,
      closing_paid: handleClosingPaid,
    }),
    [handleDeliveryAssigned, handleDeliveryCancelled, handleClosingPaid],
  );

  const { connected } = useSSE(channel, { handlers });

  const dismissToast = useCallback(() => setToast(null), []);

  return { connected, toast, dismissToast };
}
