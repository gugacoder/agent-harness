import { useState, useEffect } from "react";
import { Radio, Truck, WifiOff, MapPin } from "lucide-react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { CourierStatus } from "@/components/ui/StatusBadge";

interface StatusContextProps {
  status: CourierStatus;
  pendingOrdersCount: number;
}

const CURRENT_ICON = new L.Icon({
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

const STATUS_CONFIG: Record<
  CourierStatus,
  {
    icon: typeof Radio;
    bg: string;
    textColor: string;
  }
> = {
  available: {
    icon: Radio,
    bg: "bg-green-50 border-green-200",
    textColor: "text-green-800",
  },
  busy: {
    icon: Truck,
    bg: "bg-amber-50 border-amber-200",
    textColor: "text-amber-800",
  },
  offline: {
    icon: WifiOff,
    bg: "bg-gray-50 border-gray-200",
    textColor: "text-gray-600",
  },
};

function getMessage(status: CourierStatus, pendingCount: number): string {
  switch (status) {
    case "available":
      return `Voce esta online — ${pendingCount} entregas disponiveis na regiao`;
    case "busy":
      return "Entrega em andamento";
    case "offline":
      return "Fique online para receber entregas";
  }
}

function useCurrentPosition(): [number, number] | null {
  const [pos, setPos] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (p) => setPos([p.coords.latitude, p.coords.longitude]),
      () => {
        // Permission denied or unavailable — show fallback
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
    );
  }, []);

  return pos;
}

export function StatusContext({ status, pendingOrdersCount }: StatusContextProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  const message = getMessage(status, pendingOrdersCount);

  return (
    <div className={`rounded-xl border ${config.bg} overflow-hidden`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <Icon className={`h-5 w-5 shrink-0 ${config.textColor}`} />
        <p className={`text-sm font-medium ${config.textColor}`}>{message}</p>
      </div>
      <MiniMap />
    </div>
  );
}

function MiniMap() {
  const pos = useCurrentPosition();

  if (!pos) {
    return (
      <div className="flex h-[150px] items-center justify-center bg-muted/30">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className="text-xs">Obtendo localização...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[150px] w-full">
      <MapContainer
        center={pos}
        zoom={16}
        scrollWheelZoom={false}
        dragging={false}
        zoomControl={false}
        attributionControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={pos} icon={CURRENT_ICON} />
      </MapContainer>
    </div>
  );
}
