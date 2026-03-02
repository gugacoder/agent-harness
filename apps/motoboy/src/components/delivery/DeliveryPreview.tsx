import { useState, useEffect, useMemo } from "react";
import { MapPin, Ruler, DollarSign } from "lucide-react";
import { MapContainer, TileLayer, Polyline, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { api } from "@/lib/api";
import { ActionButton } from "@/components/ui/ActionButton";
import type { PendingDelivery, Order } from "@/types/delivery";

interface DeliveryPreviewProps {
  delivery: PendingDelivery;
  order: Order;
  onAccept: () => void;
  onReject: () => void;
  isAccepting: boolean;
  isRejecting: boolean;
}

function haversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth's radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const PICKUP_ICON = new L.Icon({
  iconUrl:
    "data:image/svg+xml," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#1dace7"/>
        <circle cx="12" cy="12" r="5" fill="white"/>
      </svg>`,
    ),
  iconSize: [24, 36],
  iconAnchor: [12, 36],
});

const DELIVERY_ICON = new L.Icon({
  iconUrl:
    "data:image/svg+xml," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#ef4444"/>
        <circle cx="12" cy="12" r="5" fill="white"/>
      </svg>`,
    ),
  iconSize: [24, 36],
  iconAnchor: [12, 36],
});

export function DeliveryPreview({
  delivery,
  order,
  onAccept,
  onReject,
  isAccepting,
  isRejecting,
}: DeliveryPreviewProps) {
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const isLoading = isAccepting || isRejecting;

  const pickupLat = parseFloat(order.pickup_lat);
  const pickupLng = parseFloat(order.pickup_lng);
  const deliveryLat = parseFloat(order.delivery_lat);
  const deliveryLng = parseFloat(order.delivery_lng);

  const distanceKm = useMemo(
    () => haversine(pickupLat, pickupLng, deliveryLat, deliveryLng),
    [pickupLat, pickupLng, deliveryLat, deliveryLng],
  );

  const bounds = useMemo(
    () =>
      L.latLngBounds(
        [pickupLat, pickupLng],
        [deliveryLat, deliveryLng],
      ).pad(0.3),
    [pickupLat, pickupLng, deliveryLat, deliveryLng],
  );

  const linePositions: [number, number][] = useMemo(
    () => [
      [pickupLat, pickupLng],
      [deliveryLat, deliveryLng],
    ],
    [pickupLat, pickupLng, deliveryLat, deliveryLng],
  );

  // Try to fetch estimated price
  useEffect(() => {
    api
      .get("api/orders/estimate", {
        searchParams: {
          pickup_lat: order.pickup_lat,
          pickup_lng: order.pickup_lng,
          delivery_lat: order.delivery_lat,
          delivery_lng: order.delivery_lng,
        },
      })
      .json<{ estimated_price: number }>()
      .then((data) => setEstimatedPrice(data.estimated_price))
      .catch(() => {
        // Estimate not available (e.g., courier role not allowed) — that's fine
      });
  }, [order.pickup_lat, order.pickup_lng, order.delivery_lat, order.delivery_lng]);

  return (
    <div className="mx-auto w-full max-w-lg animate-in fade-in slide-in-from-top-4 rounded-xl border-2 border-primary bg-card shadow-lg overflow-hidden">
      {/* Mini map */}
      <div className="h-[150px] w-full">
        <MapContainer
          bounds={bounds}
          scrollWheelZoom={false}
          dragging={false}
          zoomControl={false}
          attributionControl={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[pickupLat, pickupLng]} icon={PICKUP_ICON} />
          <Marker position={[deliveryLat, deliveryLng]} icon={DELIVERY_ICON} />
          <Polyline
            positions={linePositions}
            pathOptions={{ color: "#1dace7", weight: 3, dashArray: "8 4" }}
          />
        </MapContainer>
      </div>

      <div className="p-4">
        <h2 className="mb-3 text-center text-lg font-bold text-primary">
          Nova Entrega!
        </h2>

        <div className="space-y-2">
          {/* Destination address */}
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Destino
              </p>
              <p className="text-sm">{order.delivery_address}</p>
            </div>
          </div>

          {/* Distance + value row */}
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <Ruler className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">
                {distanceKm.toFixed(1)} km
              </span>
            </div>
            {estimatedPrice !== null && (
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">
                  R$ {estimatedPrice.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onReject}
            disabled={isLoading}
            className="flex min-h-[48px] flex-1 items-center justify-center rounded-lg border border-border bg-background px-6 py-3 text-base font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            Recusar
          </button>
          <ActionButton
            label="Aceitar"
            variant="primary"
            onClick={onAccept}
            loading={isAccepting}
            className="flex-1 !bg-green-600 hover:!bg-green-700"
          />
        </div>
      </div>
    </div>
  );
}
