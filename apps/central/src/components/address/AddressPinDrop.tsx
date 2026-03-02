import { useRef, useCallback, useMemo, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { api } from "@/lib/api";

interface AddressPinDropProps {
  lat: number;
  lng: number;
  onPositionChange: (data: {
    lat: number;
    lng: number;
    address: string;
  }) => void;
  height?: string;
}

const BRAZIL_CENTER: [number, number] = [-15.77, -47.92];
const BRAZIL_ZOOM = 4;
const PIN_ZOOM = 17;

const BLUE_ICON = new L.Icon({
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
  popupAnchor: [0, -36],
});

function hasValidCoords(lat: number, lng: number): boolean {
  return lat !== 0 || lng !== 0;
}

function MapUpdater({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();

  useEffect(() => {
    if (hasValidCoords(lat, lng)) {
      map.setView([lat, lng], PIN_ZOOM);
    } else {
      map.setView(BRAZIL_CENTER, BRAZIL_ZOOM);
    }
  }, [map, lat, lng]);

  return null;
}

function DraggableMarker({
  lat,
  lng,
  onPositionChange,
}: {
  lat: number;
  lng: number;
  onPositionChange: AddressPinDropProps["onPositionChange"];
}) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const reverseGeocode = useCallback(
    (newLat: number, newLng: number) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(async () => {
        try {
          const data = await api
            .get("api/geocoding/reverse", {
              searchParams: { lat: newLat.toString(), lng: newLng.toString() },
            })
            .json<{ address: string; lat: number; lng: number }>();

          onPositionChange({
            lat: newLat,
            lng: newLng,
            address: data.address,
          });
        } catch {
          onPositionChange({
            lat: newLat,
            lng: newLng,
            address: "",
          });
        }
      }, 500);
    },
    [onPositionChange],
  );

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker) {
          const pos = marker.getLatLng();
          reverseGeocode(pos.lat, pos.lng);
        }
      },
    }),
    [reverseGeocode],
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  if (!hasValidCoords(lat, lng)) {
    return null;
  }

  return (
    <Marker
      draggable
      position={[lat, lng]}
      icon={BLUE_ICON}
      eventHandlers={eventHandlers}
      ref={markerRef}
    />
  );
}

export function AddressPinDrop({
  lat,
  lng,
  onPositionChange,
  height = "300px",
}: AddressPinDropProps) {
  const valid = hasValidCoords(lat, lng);
  const center: [number, number] = valid ? [lat, lng] : BRAZIL_CENTER;
  const zoom = valid ? PIN_ZOOM : BRAZIL_ZOOM;

  return (
    <div className="flex flex-col gap-1">
      <div className="overflow-hidden rounded-lg border" style={{ height }}>
        <MapContainer
          center={center}
          zoom={zoom}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater lat={lat} lng={lng} />
          <DraggableMarker
            lat={lat}
            lng={lng}
            onPositionChange={onPositionChange}
          />
        </MapContainer>
      </div>
      <p className="text-xs text-muted-foreground">
        Arraste o pin para ajustar a localização
      </p>
    </div>
  );
}
