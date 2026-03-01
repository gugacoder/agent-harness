import { useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import { type LatLngBoundsExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Bike, MapPin, Wifi, WifiOff } from "lucide-react";
import { useCouriers } from "@/hooks/useCouriers";
import { useCompanyEventsContext } from "@/contexts/CompanyEventsContext";
import { COURIER_STATUS_LABELS } from "@/components/ui/StatusBadge";
import type { CourierLocation } from "@/hooks/useCourierLocations";
import type { Courier, CourierStatus } from "@/types/api";

// --- Status colors matching branding ---
// available → secondary #1dace7 (blue)
// busy → accent #fca322 (orange)

const MARKER_COLORS: Record<CourierStatus, string> = {
  available: "#1dace7",
  busy: "#fca322",
  offline: "#9ca3af",
};

// --- FitBounds: auto-zoom to show all markers ---

function FitBounds({ bounds }: { bounds: LatLngBoundsExpression | null }) {
  const map = useMap();
  useMemo(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [map, bounds]);
  return null;
}

// --- Courier Marker ---

function CourierMarkerItem({
  courier,
  location,
}: {
  courier: Courier;
  location: CourierLocation;
}) {
  const color = MARKER_COLORS[courier.status];
  const statusLabel = COURIER_STATUS_LABELS[courier.status];

  return (
    <CircleMarker
      center={[location.lat, location.lng]}
      radius={10}
      pathOptions={{
        color: color,
        fillColor: color,
        fillOpacity: 0.8,
        weight: 2,
      }}
    >
      <Popup>
        <div className="min-w-[160px]">
          <div className="flex items-center gap-2">
            <Bike className="h-4 w-4" style={{ color }} />
            <span className="font-semibold">{courier.full_name}</span>
          </div>
          <div className="mt-1 text-xs text-gray-600">
            <span
              className="inline-block rounded-full px-2 py-0.5 text-white"
              style={{ backgroundColor: color }}
            >
              {statusLabel}
            </span>
          </div>
          {location.delivery_id && (
            <div className="mt-1 text-xs text-gray-500">
              Entrega em andamento
            </div>
          )}
          <div className="mt-1 text-xs text-gray-400">
            {new Date(location.timestamp).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </Popup>
    </CircleMarker>
  );
}

// --- Main Mapa Page ---

export function MapaPage() {
  const { data: couriers, isLoading: couriersLoading } = useCouriers();
  const { courierLocations: locations, connected } = useCompanyEventsContext();

  // Build courier lookup for name/status
  const courierMap = useMemo(() => {
    const map = new Map<string, Courier>();
    if (couriers) {
      for (const c of couriers) map.set(c.id, c);
    }
    return map;
  }, [couriers]);

  // Markers: combine courier data + location data
  const markers = useMemo(() => {
    const result: { courier: Courier; location: CourierLocation }[] = [];
    for (const [courierId, loc] of locations) {
      const courier = courierMap.get(courierId);
      if (courier && loc.lat !== 0 && loc.lng !== 0) {
        result.push({ courier, location: loc });
      }
    }
    return result;
  }, [locations, courierMap]);

  // Compute bounds from markers
  const bounds: LatLngBoundsExpression | null = useMemo(() => {
    if (markers.length === 0) return null;
    const lats = markers.map((m) => m.location.lat);
    const lngs = markers.map((m) => m.location.lng);
    return [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ];
  }, [markers]);

  // Count active couriers (available or busy)
  const activeCourierCount = useMemo(() => {
    if (!couriers) return 0;
    return couriers.filter(
      (c) => c.active && (c.status === "available" || c.status === "busy"),
    ).length;
  }, [couriers]);

  return (
    <div className="-m-4 flex flex-col md:-m-6" style={{ height: "calc(100vh - 64px)" }}>
      {/* Header bar */}
      <div className="flex items-center justify-between border-b bg-card px-4 py-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Mapa de Motoboys</h1>
          <span className="text-xs text-muted-foreground">
            {activeCourierCount} ativo(s)
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="hidden items-center gap-3 text-xs sm:flex">
            <span className="flex items-center gap-1">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: MARKER_COLORS.available }}
              />
              Disponível
            </span>
            <span className="flex items-center gap-1">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: MARKER_COLORS.busy }}
              />
              Ocupado
            </span>
          </div>
          {/* SSE status */}
          <span
            className="flex items-center gap-1 text-xs"
            title={connected ? "Conectado ao servidor" : "Desconectado"}
          >
            {connected ? (
              <Wifi className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </span>
        </div>
      </div>

      {/* Map */}
      <div className="relative flex-1">
        {couriersLoading ? (
          <div className="flex h-full items-center justify-center bg-muted">
            <div className="text-center">
              <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Carregando mapa...</p>
            </div>
          </div>
        ) : (
          <>
            <MapContainer
              center={[-15.78, -47.93]}
              zoom={4}
              className="h-full w-full"
              attributionControl={false}
              zoomControl={true}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <FitBounds bounds={bounds} />
              {markers.map(({ courier, location }) => (
                <CourierMarkerItem
                  key={courier.id}
                  courier={courier}
                  location={location}
                />
              ))}
            </MapContainer>

            {/* Empty state overlay */}
            {markers.length === 0 && (
              <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center">
                <div className="rounded-lg bg-white/90 px-6 py-4 text-center shadow-sm">
                  <Bike className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Nenhum motoboy com localização
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    {connected
                      ? "Posições serão exibidas em tempo real via SSE"
                      : "Conectando ao servidor..."}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
