import {
  ChevronLeft,
  MapPin,
  User,
  Phone,
  FileText,
  Bike,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  useOrderDetail,
  useOrderTimeline,
  useCourierInfo,
  useDeliveryPrice,
} from "@/hooks/useOrderDetail";
import { useOrderDelivery } from "@/hooks/useOrderDelivery";
import { OrderStatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { OrderProofSection } from "@/components/delivery-proof/OrderProofSection";
import type { TimelineEvent, OrderStatus } from "@/types/api";

// Fix Leaflet default marker icons
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// --- Timeline Section ---

const STATUS_ICON: Record<string, React.ComponentType<{ className?: string }>> =
  {
    pending: Package,
    assigned: Bike,
    picked_up: MapPin,
    in_transit: Truck,
    delivered: CheckCircle2,
    cancelled: XCircle,
  };

const STATUS_CIRCLE_COLOR: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  assigned: "bg-secondary text-secondary-foreground",
  picked_up: "bg-accent text-accent-foreground",
  in_transit: "bg-secondary text-secondary-foreground",
  delivered: "bg-primary text-primary-foreground",
  cancelled: "bg-destructive text-white",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  assigned: "Atribuído",
  picked_up: "Coletado",
  in_transit: "Em Trânsito",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const STATUS_ORDER: OrderStatus[] = [
  "pending",
  "assigned",
  "picked_up",
  "in_transit",
  "delivered",
];

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const MM = String(d.getMonth() + 1).padStart(2, "0");
  return `${hh}:${mm} ${dd}/${MM}`;
}

function DetailTimeline({ events }: { events: TimelineEvent[] }) {
  const reachedStatuses = new Set<string>();
  for (const evt of events) {
    if (evt.new_status) reachedStatuses.add(evt.new_status);
  }

  const isCancelled = reachedStatuses.has("cancelled");

  let maxReachedIdx = -1;
  for (let i = 0; i < STATUS_ORDER.length; i++) {
    if (reachedStatuses.has(STATUS_ORDER[i])) maxReachedIdx = i;
  }

  type DisplayItem =
    | { kind: "event"; event: TimelineEvent }
    | { kind: "future"; status: OrderStatus };

  const items: DisplayItem[] = events.map((event) => ({
    kind: "event" as const,
    event,
  }));

  if (!isCancelled) {
    for (let i = maxReachedIdx + 1; i < STATUS_ORDER.length; i++) {
      items.push({ kind: "future", status: STATUS_ORDER[i] });
    }
  }

  return (
    <div>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;

        if (item.kind === "future") {
          const Icon = STATUS_ICON[item.status] ?? Clock;
          return (
            <div key={`future-${item.status}`} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-muted text-muted-foreground">
                  <Icon className="h-4 w-4" />
                </div>
                {!isLast && <div className="w-px flex-1 bg-border" />}
              </div>
              <div className="pb-4">
                <p className="text-sm text-muted-foreground">
                  {STATUS_LABEL[item.status] ?? item.status}
                </p>
              </div>
            </div>
          );
        }

        const evt = item.event;
        const status = evt.new_status ?? evt.old_status ?? "pending";
        const Icon = STATUS_ICON[status] ?? Clock;
        const isCurrent = idx === events.length - 1 && item.kind === "event";
        const circleClass = isCurrent
          ? STATUS_CIRCLE_COLOR[status] ?? "bg-muted text-muted-foreground"
          : "bg-primary/10 text-primary";

        return (
          <div key={idx} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${circleClass}`}
              >
                <Icon className="h-4 w-4" />
              </div>
              {!isLast && <div className="w-px flex-1 bg-border" />}
            </div>
            <div className="pb-4">
              <p className="text-sm font-medium">{evt.description}</p>
              {evt.actor_name && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {evt.actor_name}
                </p>
              )}
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatTimestamp(evt.created_at)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- Read-only Map ---

function ReadOnlyMap({
  lat,
  lng,
  label,
}: {
  lat: number;
  lng: number;
  label: string;
}) {
  if (lat === 0 && lng === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
        Coordenadas não disponíveis
      </div>
    );
  }

  return (
    <div className="h-48 overflow-hidden rounded-lg border">
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        scrollWheelZoom={false}
        dragging={false}
        zoomControl={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          <Popup>{label}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

// --- Main Component ---

interface OrderDetailViewProps {
  orderId: string;
  onBack: () => void;
}

export function OrderDetailView({ orderId, onBack }: OrderDetailViewProps) {
  const { data: order, isLoading: orderLoading } = useOrderDetail(orderId);
  const { data: timeline, isLoading: timelineLoading } =
    useOrderTimeline(orderId);
  const { data: delivery } = useOrderDelivery(orderId);
  const { data: courier } = useCourierInfo(delivery?.courier_id ?? null);
  const { data: price } = useDeliveryPrice(delivery?.id ?? null);

  if (orderLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </button>
        <p className="text-sm text-muted-foreground">Pedido não encontrado.</p>
      </div>
    );
  }

  const deliveryLat = parseFloat(order.delivery_lat);
  const deliveryLng = parseFloat(order.delivery_lng);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-md p-1 hover:bg-muted"
          aria-label="Voltar"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold">Pedido #{order.order_number}</h2>
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      {/* Read-only Map */}
      <ReadOnlyMap
        lat={deliveryLat}
        lng={deliveryLng}
        label={order.delivery_address}
      />

      {/* Order Info */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="border-b px-4 py-3">
          <h3 className="font-semibold">Informações</h3>
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Coleta</p>
              <p className="text-sm">{order.pickup_address}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Entrega</p>
              <p className="text-sm">{order.delivery_address}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Destinatário</p>
              <p className="text-sm">{order.recipient_name}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Telefone</p>
              <p className="text-sm">{order.recipient_phone}</p>
            </div>
          </div>
          {order.notes && (
            <div className="flex items-start gap-2">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Observações</p>
                <p className="text-sm">{order.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="border-b px-4 py-3">
          <h3 className="font-semibold">Timeline</h3>
        </div>
        <div className="p-4">
          {timelineLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : timeline && timeline.length > 0 ? (
            <DetailTimeline events={timeline} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum evento encontrado.
            </p>
          )}
        </div>
      </div>

      {/* Courier Info */}
      {courier && (
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="border-b px-4 py-3">
            <h3 className="font-semibold">Motoboy</h3>
          </div>
          <div className="flex items-center gap-3 p-4">
            {courier.photo_url ? (
              <img
                src={courier.photo_url}
                alt={courier.full_name}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Bike className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <p className="font-medium">{courier.full_name}</p>
              {courier.vehicle_type && (
                <p className="text-xs text-muted-foreground">
                  {courier.vehicle_type}
                  {courier.plate_number ? ` - ${courier.plate_number}` : ""}
                </p>
              )}
            </div>
            <a
              href={`tel:${courier.phone}`}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20"
              aria-label="Ligar"
            >
              <Phone className="h-5 w-5" />
            </a>
          </div>
        </div>
      )}

      {/* Delivery Price */}
      {price && (
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="border-b px-4 py-3">
            <h3 className="font-semibold">Valor da Entrega</h3>
          </div>
          <div className="space-y-2 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>Total</span>
              </div>
              <span className="text-lg font-bold">
                R$ {parseFloat(price.total_price).toFixed(2).replace(".", ",")}
              </span>
            </div>
            {parseFloat(price.surcharge_amount) > 0 && (
              <p className="text-xs text-muted-foreground">
                Base: R${" "}
                {parseFloat(price.base_price).toFixed(2).replace(".", ",")} +
                Adicional: R${" "}
                {parseFloat(price.surcharge_amount)
                  .toFixed(2)
                  .replace(".", ",")}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Proof of Delivery */}
      {order.status === "delivered" && <OrderProofSection orderId={order.id} />}
    </div>
  );
}
