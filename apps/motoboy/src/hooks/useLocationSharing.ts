import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { CourierStatus } from "@/components/ui/StatusBadge";

export type LocationState = "sharing" | "paused" | "denied";

interface UseLocationSharingOptions {
  courierId: string | null;
  status: CourierStatus;
  hasActiveDelivery: boolean;
}

const INTERVAL_AVAILABLE = 30_000; // 30s when available
const INTERVAL_ACTIVE = 15_000; // 15s when in active delivery

async function sendLocation(
  courierId: string,
  position: GeolocationPosition,
): Promise<void> {
  await api.post(`api/couriers/${courierId}/location`, {
    json: {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
    },
  });
}

export function useLocationSharing({
  courierId,
  status,
  hasActiveDelivery,
}: UseLocationSharingOptions) {
  const [state, setState] = useState<LocationState>("paused");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const deniedRef = useRef(false);

  const shouldShare = status === "available" || status === "busy";
  const interval = hasActiveDelivery ? INTERVAL_ACTIVE : INTERVAL_AVAILABLE;

  const clearTracking = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const markDenied = useCallback(() => {
    deniedRef.current = true;
    setState("denied");
    clearTracking();
  }, [clearTracking]);

  const sendCurrentLocation = useCallback(
    (cId: string) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          sendLocation(cId, position).catch(() => {
            // Silently fail on network errors — will retry on next interval
          });
        },
        () => {
          // Position error — permission may have been revoked
          markDenied();
        },
        { enableHighAccuracy: true, timeout: 10_000, maximumAge: 5_000 },
      );
    },
    [markDenied],
  );

  useEffect(() => {
    if (!courierId || !shouldShare) {
      clearTracking();
      if (!deniedRef.current) {
        setState("paused");
      }
      return;
    }

    // Request permission and start sharing
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Permission granted — send immediately
        deniedRef.current = false;
        setState("sharing");
        sendLocation(courierId, position).catch(() => {});

        // Start periodic sending
        clearTracking();
        intervalRef.current = setInterval(
          () => sendCurrentLocation(courierId),
          interval,
        );
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          markDenied();
        } else {
          // Position unavailable or timeout — still try to share
          setState("paused");
        }
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 5_000 },
    );

    return () => {
      clearTracking();
    };
  }, [courierId, shouldShare, interval, clearTracking, sendCurrentLocation, markDenied]);

  return { state };
}
