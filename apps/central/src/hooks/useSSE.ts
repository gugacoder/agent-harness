import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

export type SSEEventHandler = (data: Record<string, unknown>) => void;

export interface UseSSEOptions {
  /** Map of event type → handler function */
  handlers: Record<string, SSEEventHandler>;
  /** Whether the hook should be active (default: true) */
  enabled?: boolean;
}

/**
 * Reusable hook that connects to a backbone SSE channel.
 *
 * - Authenticates via query param `?token={jwt}` (OSD125)
 * - Reconnects with exponential backoff (1s, 2s, 4s, 8s, max 30s) (OSD124)
 * - Type-safe event dispatching via handlers map
 * - Single connection per channel instance
 *
 * @param channel - SSE channel path, e.g. `company/${companyId}`
 * @param options - handlers and enabled flag
 * @returns { connected } — whether the SSE connection is active
 */
export function useSSE(channel: string | null, options: UseSSEOptions) {
  const { session } = useAuth();
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep handlers in a ref to avoid reconnecting when handlers change
  const handlersRef = useRef(options.handlers);
  handlersRef.current = options.handlers;

  const enabled = options.enabled ?? true;

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
    const token = session?.access_token;
    if (!channel || !token || !enabled) return;

    const backboneUrl = import.meta.env.VITE_BACKBONE_URL as string;
    if (!backboneUrl) return;

    function connect() {
      const url = `${backboneUrl}/api/events/${channel}?token=${token}`;
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.addEventListener("connected", () => {
        setConnected(true);
        retryRef.current = 0;
      });

      // Listen to all event types and dispatch to handlers
      const eventTypes = Object.keys(handlersRef.current);
      for (const eventType of eventTypes) {
        es.addEventListener(eventType, (event) => {
          try {
            const data = JSON.parse(event.data);
            handlersRef.current[eventType]?.(data);
          } catch {
            // ignore malformed events
          }
        });
      }

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
  }, [channel, session?.access_token, enabled, cleanup]);

  return { connected };
}
