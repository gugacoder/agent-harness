import { useState, useEffect, useRef } from "react";
import { DollarSign, Route, AlertCircle } from "lucide-react";
import { useOrderEstimate } from "@/hooks/useOrderEstimate";
import { Skeleton } from "@/components/ui/Skeleton";

interface CostEstimateProps {
  pickupLat: number;
  pickupLng: number;
  deliveryLat: number;
  deliveryLng: number;
  enabled: boolean;
}

export function CostEstimate({
  pickupLat,
  pickupLng,
  deliveryLat,
  deliveryLng,
  enabled,
}: CostEstimateProps) {
  // Debounce coordinates by 500ms
  const [debouncedCoords, setDebouncedCoords] = useState({
    pickupLat,
    pickupLng,
    deliveryLat,
    deliveryLng,
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedCoords({ pickupLat, pickupLng, deliveryLat, deliveryLng });
    }, 500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pickupLat, pickupLng, deliveryLat, deliveryLng]);

  const { data, isLoading, isError } = useOrderEstimate({
    ...debouncedCoords,
    enabled,
  });

  // Don't render anything if not enabled or coords are zero
  const hasCoords =
    enabled &&
    debouncedCoords.deliveryLat !== 0 &&
    debouncedCoords.deliveryLng !== 0 &&
    debouncedCoords.pickupLat !== 0 &&
    debouncedCoords.pickupLng !== 0;

  if (!hasCoords) return null;

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
        <Skeleton className="h-10 w-10" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
        <AlertCircle className="h-4 w-4 shrink-0" />
        Estimativa indisponível
      </div>
    );
  }

  const priceFormatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(data.estimated_price);

  const distanceFormatted =
    data.estimated_distance_km < 1
      ? `${Math.round(data.estimated_distance_km * 1000)} m`
      : `${data.estimated_distance_km.toFixed(1)} km`;

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <DollarSign className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold">{priceFormatted}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Route className="h-3 w-3" />
          {distanceFormatted}
        </div>
      </div>
    </div>
  );
}
