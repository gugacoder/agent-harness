import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { CourierStatus } from "@/components/ui/StatusBadge";

export type LocationState = "sharing" | "paused" | "denied";
export type DeniedReason = "permission_denied" | "unavailable" | null;

interface UseLocationSharingOptions {
  courierId: string | null;
  status: CourierStatus;
  hasActiveDelivery: boolean;
}

const INTERVAL_AVAILABLE = 15_000; // 15s when available (was 30s)
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
  const [deniedReason, setDeniedReason] = useState<DeniedReason>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const deniedRef = useRef(false);
  const prevStatusRef = useRef<CourierStatus>(status);

  const shouldShare = status === "available" || status === "busy";
  const interval = hasActiveDelivery ? INTERVAL_ACTIVE : INTERVAL_AVAILABLE;

  const clearTracking = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const markDenied = useCallback(
    (reason: DeniedReason) => {
      deniedRef.current = true;
      setState("denied");
      setDeniedReason(reason);
      clearTracking();
    },
    [clearTracking],
  );

  const sendCurrentLocation = useCallback(
    (cId: string) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          sendLocation(cId, position).catch(() => {
            // Silently fail on network errors — will retry on next interval
          });
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            markDenied("permission_denied");
          } else {
            markDenied("unavailable");
          }
        },
        { enableHighAccuracy: true, timeout: 10_000, maximumAge: 5_000 },
      );
    },
    [markDenied],
  );

  // Main effect: start/stop sharing based on status
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
        setDeniedReason(null);
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
          markDenied("permission_denied");
        } else {
          markDenied("unavailable");
        }
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 5_000 },
    );

    return () => {
      clearTracking();
    };
  }, [courierId, shouldShare, interval, clearTracking, sendCurrentLocation, markDenied]);

  // Immediate location send on transition to "available"
  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = status;

    if (
      status === "available" &&
      prevStatus !== "available" &&
      courierId &&
      !deniedRef.current
    ) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          sendLocation(courierId, position).catch(() => {});
        },
        () => {
          // Ignore — main effect handles errors
        },
        { enableHighAccuracy: true, timeout: 10_000, maximumAge: 5_000 },
      );
    }
  }, [status, courierId]);

  return { state, deniedReason };
}
