import { useEffect, useRef } from "react";
import { useActiveDeliveryContext } from "@/contexts/ActiveDeliveryContext";

/**
 * Hook that plays audio, vibrates, and shows a browser notification
 * when a new delivery is assigned via SSE (detected by pendingDelivery change).
 *
 * Call this in AppShell or a root component — it has no visual output.
 */
export function useDeliveryNotification() {
  const { pendingDelivery, pendingOrder } = useActiveDeliveryContext();
  const prevDeliveryIdRef = useRef<string | null>(null);

  // Request Notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Trigger notification when a new delivery is assigned
  useEffect(() => {
    if (!pendingDelivery) {
      prevDeliveryIdRef.current = null;
      return;
    }

    // Only trigger once per delivery_id
    if (pendingDelivery.delivery_id === prevDeliveryIdRef.current) return;
    prevDeliveryIdRef.current = pendingDelivery.delivery_id;

    // Play notification sound
    try {
      const audio = new Audio("/notification.mp3");
      audio.play().catch(() => {
        // Autoplay may be blocked by browser policy — ignore
      });
    } catch {
      // Audio API unavailable
    }

    // Vibrate
    if ("vibrate" in navigator) {
      navigator.vibrate([200, 100, 200]);
    }

    // Show browser notification (order data may not be loaded yet)
    if ("Notification" in window && Notification.permission === "granted") {
      const orderNum = pendingOrder?.order_number;
      const address = pendingOrder?.delivery_address;
      const body =
        orderNum && address
          ? `Pedido #${orderNum} \u2014 ${address}`
          : "Toque para ver detalhes";
      new Notification("Nova entrega!", { body });
    }
  }, [pendingDelivery, pendingOrder]);
}
