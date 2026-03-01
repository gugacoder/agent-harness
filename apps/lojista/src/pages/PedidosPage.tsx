import { useState, useMemo, useCallback, useEffect } from "react";
import { useLocation } from "react-router";
import {
  Package,
  ChevronLeft,
  Clock,
  User,
  MapPin,
  Phone,
  FileText,
  Bike,
  CheckCircle2,
  X,
  Loader2,
  Wifi,
  WifiOff,
  Check,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useOrders } from "@/hooks/useOrders";
import { useCompanyEvents, type CourierLocation } from "@/hooks/useCompanyEvents";
import { api } from "@/lib/api";
import { OrderStatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Order, OrderStatus } from "@/types/api";

// Fix Leaflet default marker icons
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const courierIcon = new L.Icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: "hue-rotate-180",
});

const ACTIVE_STATUSES: OrderStatus[] = [
  "pending",
  "assigned",
  "picked_up",
  "in_transit",
];

// --- Timeline ---

function TimelineItem({
  icon: Icon,
  title,
  description,
  time,
  isLast,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  time: string;
  isLast?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        {!isLast && <div className="w-px flex-1 bg-border" />}
      </div>
      <div className="pb-4">
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
        <p className="mt-0.5 text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}

function OrderTimeline({ order }: { order: Order }) {
  const items = useMemo(() => {
    const result: {
      icon: React.ComponentType<{ className?: string }>;
      title: string;
      description?: string;
      time: string;
    }[] = [];

    const fmt = (iso: string) =>
      new Date(iso).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

    result.push({
      icon: Package,
      title: "Pedido criado",
      description: `#${order.order_number}`,
      time: fmt(order.created_at),
    });

    if (["assigned", "picked_up", "in_transit", "delivered"].includes(order.status)) {
      result.push({
        icon: Bike,
        title: "Motoboy atribuído",
        time: fmt(order.updated_at),
      });
    }

    if (["picked_up", "in_transit", "delivered"].includes(order.status)) {
      result.push({
        icon: MapPin,
        title: "Pedido coletado",
        time: fmt(order.updated_at),
      });
    }

    if (["in_transit", "delivered"].includes(order.status)) {
      result.push({
        icon: Clock,
        title: "Em trânsito",
        time: fmt(order.updated_at),
      });
    }

    if (order.status === "delivered") {
      result.push({
        icon: CheckCircle2,
        title: "Entregue",
        time: fmt(order.updated_at),
      });
    }

    if (order.status === "cancelled") {
      result.push({
        icon: X,
        title: "Cancelado",
        time: fmt(order.updated_at),
      });
    }

    return result;
  }, [order]);

  return (
    <div>
      {items.map((item, idx) => (
        <TimelineItem
          key={idx}
          icon={item.icon}
          title={item.title}
          description={item.description}
          time={item.time}
          isLast={idx === items.length - 1}
        />
      ))}
    </div>
  );
}

// --- Map View ---

function MapView({
  order,
  courierLocation,
}: {
  order: Order;
  courierLocation?: CourierLocation;
}) {
  const deliveryLat = parseFloat(order.delivery_lat);
  const deliveryLng = parseFloat(order.delivery_lng);
  const pickupLat = parseFloat(order.pickup_lat);
  const pickupLng = parseFloat(order.pickup_lng);

  const hasDeliveryCoords = deliveryLat !== 0 && deliveryLng !== 0;
  const hasPickupCoords = pickupLat !== 0 && pickupLng !== 0;
  const hasCourier = !!courierLocation;

  const center: [number, number] = hasCourier
    ? [courierLocation.lat, courierLocation.lng]
    : hasDeliveryCoords
      ? [deliveryLat, deliveryLng]
      : hasPickupCoords
        ? [pickupLat, pickupLng]
        : [-23.55, -46.63];

  if (!hasDeliveryCoords && !hasPickupCoords && !hasCourier) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
        Coordenadas não disponíveis
      </div>
    );
  }

  return (
    <div className="h-48 overflow-hidden rounded-lg border">
      <MapContainer
        center={center}
        zoom={14}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hasPickupCoords && (
          <Marker position={[pickupLat, pickupLng]}>
            <Popup>Coleta: {order.pickup_address}</Popup>
          </Marker>
        )}
        {hasDeliveryCoords && (
          <Marker position={[deliveryLat, deliveryLng]}>
            <Popup>Entrega: {order.delivery_address}</Popup>
          </Marker>
        )}
        {hasCourier && (
          <Marker
            position={[courierLocation.lat, courierLocation.lng]}
            icon={courierIcon}
          >
            <Popup>Motoboy em trânsito</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

// --- Order Card ---

function OrderCard({
  order,
  onClick,
}: {
  order: Order;
  onClick: () => void;
}) {
  const timeStr = new Date(order.created_at).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <button
      onClick={onClick}
      className="w-full px-4 py-3 text-left transition-colors hover:bg-muted/50"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">#{order.order_number}</span>
          <OrderStatusBadge status={order.status} />
        </div>
        <span className="text-xs text-muted-foreground">{timeStr}</span>
      </div>
      <p className="mt-1 truncate text-sm text-muted-foreground">
        {order.recipient_name} — {order.delivery_address}
      </p>
    </button>
  );
}

// --- Order Detail ---

function OrderDetail({
  order,
  courierLocation,
  onBack,
  onCancel,
  cancelling,
}: {
  order: Order;
  courierLocation?: CourierLocation;
  onBack: () => void;
  onCancel: () => void;
  cancelling: boolean;
}) {
  const canCancel = order.status === "pending" || order.status === "assigned";
  const showMap =
    order.status === "assigned" ||
    order.status === "picked_up" ||
    order.status === "in_transit";

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

      {/* Map */}
      {showMap && (
        <MapView order={order} courierLocation={courierLocation} />
      )}

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

        {/* Cancel action */}
        {canCancel && (
          <div className="border-t px-4 py-3">
            <button
              onClick={onCancel}
              disabled={cancelling}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-destructive px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
            >
              {cancelling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
              Cancelar Pedido
            </button>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="border-b px-4 py-3">
          <h3 className="font-semibold">Timeline</h3>
        </div>
        <div className="p-4">
          <OrderTimeline order={order} />
        </div>
      </div>
    </div>
  );
}

// --- Main Page ---

type View = { type: "list" } | { type: "detail"; orderId: string };

export function PedidosPage() {
  const [view, setView] = useState<View>({ type: "list" });
  const [cancelling, setCancelling] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const location = useLocation();
  const queryClient = useQueryClient();
  const { data: orders, isLoading } = useOrders();
  const { connected, courierLocations } = useCompanyEvents();

  // Show toast from navigation state (e.g. after creating an order)
  useEffect(() => {
    const state = location.state as { toast?: string } | null;
    if (state?.toast) {
      setToast(state.toast);
      // Clear the state so toast doesn't re-appear on refresh
      window.history.replaceState({}, "");
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Filter to active orders only
  const activeOrders = useMemo(() => {
    if (!orders) return [];
    return orders
      .filter((o) => ACTIVE_STATUSES.includes(o.status))
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }, [orders]);

  const handleCancelOrder = useCallback(
    async (orderId: string) => {
      setCancelling(true);
      try {
        await api.delete(`api/orders/${orderId}`).json();
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        setView({ type: "list" });
      } catch {
        // Stay on detail view on error
      } finally {
        setCancelling(false);
      }
    },
    [queryClient],
  );

  // Get current order for detail view
  const currentOrder = useMemo(() => {
    if (view.type === "detail") {
      return orders?.find((o) => o.id === view.orderId) ?? null;
    }
    return null;
  }, [orders, view]);

  // Find courier location for current order (via SSE courier_location events)
  const currentCourierLocation = useMemo<CourierLocation | undefined>(() => {
    if (!currentOrder || courierLocations.size === 0) return undefined;
    // courier_location SSE events include delivery_id but we don't have
    // the mapping from order_id to courier_id without a delivery fetch.
    // F-007 SSE integration will enhance this with proper matching.
    return undefined;
  }, [currentOrder, courierLocations]);

  // --- Render Order Detail ---
  if (view.type === "detail" && currentOrder) {
    return (
      <OrderDetail
        order={currentOrder}
        courierLocation={currentCourierLocation}
        onBack={() => setView({ type: "list" })}
        onCancel={() => handleCancelOrder(currentOrder.id)}
        cancelling={cancelling}
      />
    );
  }

  // --- Render Order List ---
  return (
    <div className="space-y-4">
      {/* Toast notification */}
      {toast && (
        <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm font-medium text-green-700">
          <Check className="h-4 w-4 shrink-0" />
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Pedidos Ativos</h1>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {connected ? (
            <Wifi className="h-3.5 w-3.5 text-green-600" />
          ) : (
            <WifiOff className="h-3.5 w-3.5" />
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-sm">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : activeOrders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Nenhum pedido ativo"
            description="Seus pedidos em andamento aparecerão aqui"
          />
        ) : (
          <div className="divide-y">
            {activeOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onClick={() => setView({ type: "detail", orderId: order.id })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
