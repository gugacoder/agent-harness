import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

export type SSEEventHandler = (data: Record<string, unknown>) => void;

export interface UseSSEOptions {
  handlers: Record<string, SSEEventHandler>;
  enabled?: boolean;
}

/**
 * Low-level hook for SSE connection with exponential backoff reconnection.
 * Authenticates via query param ?token={jwt} (OSD125).
 * Reconnects with backoff: 1s, 2s, 4s, 8s, max 30s (OSD124).
 */
export function useSSE(channel: string | null, options: UseSSEOptions) {
  const { session } = useAuth();
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

    let aborted = false;

    function connect() {
      if (aborted) return;

      const url = `${backboneUrl}/api/events/${channel}?token=${token}`;
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.addEventListener("connected", () => {
        if (aborted) return;
        setConnected(true);
        retryRef.current = 0;
      });

      const eventTypes = Object.keys(handlersRef.current);
      for (const eventType of eventTypes) {
        es.addEventListener(eventType, (event) => {
          if (aborted) return;
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
        if (aborted) return;
        eventSourceRef.current = null;
        setConnected(false);

        const delay = Math.min(1000 * 2 ** retryRef.current, 30_000);
        retryRef.current++;
        timerRef.current = setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      aborted = true;
      cleanup();
    };
  }, [channel, session?.access_token, enabled, cleanup]);

  return { connected };
}
