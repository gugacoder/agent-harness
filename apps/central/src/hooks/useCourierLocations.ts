import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

export interface CourierLocation {
  courier_id: string;
  lat: number;
  lng: number;
  accuracy: number;
  delivery_id: string | null;
  timestamp: string;
}

/**
 * Hook that connects to the SSE company channel and tracks courier positions.
 * Returns a Map of courier_id → latest CourierLocation.
 *
 * Reconnects with exponential backoff on disconnect.
 * SSE integration is scoped to courier_location events for the Mapa page.
 */
export function useCourierLocations() {
  const { user, session } = useAuth();
  const [locations, setLocations] = useState<Map<string, CourierLocation>>(
    () => new Map(),
  );
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setConnected(false);
  }, []);

  useEffect(() => {
    const companyId = user?.companyId;
    const token = session?.access_token;
    if (!companyId || !token) return;

    const backboneUrl = import.meta.env.VITE_BACKBONE_URL as string;
    if (!backboneUrl) return;

    function connect() {
      const url = `${backboneUrl}/api/events/company/${companyId}?token=${token}`;
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.addEventListener("connected", () => {
        setConnected(true);
        retryRef.current = 0;
      });

      es.addEventListener("courier_location", (event) => {
        try {
          const data = JSON.parse(event.data) as {
            type: string;
            courier_id: string;
            lat: string;
            lng: string;
            accuracy: string;
            delivery_id: string | null;
            timestamp: string;
          };
          const loc: CourierLocation = {
            courier_id: data.courier_id,
            lat: parseFloat(data.lat),
            lng: parseFloat(data.lng),
            accuracy: parseFloat(data.accuracy),
            delivery_id: data.delivery_id ?? null,
            timestamp: data.timestamp,
          };
          setLocations((prev) => {
            const next = new Map(prev);
            next.set(loc.courier_id, loc);
            return next;
          });
        } catch {
          // ignore malformed events
        }
      });

      es.onerror = () => {
        es.close();
        eventSourceRef.current = null;
        setConnected(false);

        // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
        const delay = Math.min(1000 * 2 ** retryRef.current, 30_000);
        retryRef.current++;
        timerRef.current = setTimeout(connect, delay);
      };
    }

    connect();

    return cleanup;
  }, [user?.companyId, session?.access_token, cleanup]);

  return { locations, connected };
}
