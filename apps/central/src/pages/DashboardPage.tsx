import { useMemo } from "react";
import {
  LayoutDashboard,
  Package,
  Truck,
  MapPin,
  Wifi,
  WifiOff,
} from "lucide-react";
import { TodayCards } from "@/components/dashboard/TodayCards";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useOrders } from "@/hooks/useOrders";
import { useCouriers } from "@/hooks/useCouriers";
import { useShops } from "@/hooks/useShops";
import { useCompanyEventsContext } from "@/contexts/CompanyEventsContext";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { OrderStatusBadge } from "@/components/ui/StatusBadge";
import type { Order, OrderStatus, Courier, CourierStatus } from "@/types/api";

// --- Main Dashboard ---

const MARKER_COLORS: Record<CourierStatus, string> = {
  available: "#1dace7",
  busy: "#fca322",
  offline: "#9ca3af",
};

export function DashboardPage() {
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { data: couriers, isLoading: couriersLoading } = useCouriers();
  const { data: shops } = useShops();
  const { courierLocations, connected } = useCompanyEventsContext();

  const shopMap = useMemo(() => {
    const map = new Map<string, string>();
    if (shops) {
      for (const s of shops) map.set(s.id, s.trade_name);
    }
    return map;
  }, [shops]);

  const activeOrders = useMemo(() => {
    if (!orders) return [];
    const activeStatuses: OrderStatus[] = [
      "pending",
      "assigned",
      "picked_up",
      "in_transit",
    ];
    return orders
      .filter((o) => activeStatuses.includes(o.status))
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }, [orders]);

  const activeCourierCount = useMemo(() => {
    if (!couriers) return 0;
    return couriers.filter(
      (c) => c.active && (c.status === "available" || c.status === "busy"),
    ).length;
  }, [couriers]);

  // Build courier lookup for map markers
  const courierMap = useMemo(() => {
    const map = new Map<string, Courier>();
    if (couriers) {
      for (const c of couriers) map.set(c.id, c);
    }
    return map;
  }, [couriers]);

  // Map markers from SSE courier locations
  const mapMarkers = useMemo(() => {
    const result: { courier: Courier; lat: number; lng: number }[] = [];
    for (const [courierId, loc] of courierLocations) {
      const courier = courierMap.get(courierId);
      if (courier && loc.lat !== 0 && loc.lng !== 0) {
        result.push({ courier, lat: loc.lat, lng: loc.lng });
      }
    }
    return result;
  }, [courierLocations, courierMap]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Visão geral da operação</p>
      </div>

      {/* Today Metrics Cards (real-time from /api/analytics/today) */}
      <TodayCards />

      {/* Main content: orders list + map */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Orders List */}
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Pedidos Ativos</h2>
            {!ordersLoading && (
              <span className="ml-auto text-xs text-muted-foreground">
                {activeOrders.length} pedido(s)
              </span>
            )}
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {ordersLoading ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : activeOrders.length === 0 ? (
              <EmptyState
                icon={Package}
                title="Nenhum pedido ativo"
                description="Novos pedidos aparecerão aqui automaticamente"
              />
            ) : (
              <ul className="divide-y">
                {activeOrders.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    shopName={
                      order.shop_id
                        ? shopMap.get(order.shop_id) ?? null
                        : null
                    }
                  />
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Map Preview */}
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <Truck className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Motoboys</h2>
            <div className="ml-auto flex items-center gap-2">
              {!couriersLoading && (
                <span className="text-xs text-muted-foreground">
                  {activeCourierCount} ativo(s)
                </span>
              )}
              <span title={connected ? "SSE conectado" : "SSE desconectado"}>
                {connected ? (
                  <Wifi className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </span>
            </div>
          </div>
          <div className="relative h-[400px]">
            {couriersLoading ? (
              <Skeleton className="h-full w-full rounded-none rounded-b-lg" />
            ) : (
              <>
                <MapContainer
                  center={[-15.78, -47.93]}
                  zoom={4}
                  className="h-full w-full rounded-b-lg"
                  attributionControl={false}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {mapMarkers.map(({ courier, lat, lng }) => (
                    <CircleMarker
                      key={courier.id}
                      center={[lat, lng]}
                      radius={8}
                      pathOptions={{
                        color: MARKER_COLORS[courier.status],
                        fillColor: MARKER_COLORS[courier.status],
                        fillOpacity: 0.8,
                        weight: 2,
                      }}
                    >
                      <Popup>
                        <span className="text-sm font-medium">
                          {courier.full_name}
                        </span>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
                {activeCourierCount === 0 && (
                  <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center">
                    <div className="rounded-lg bg-white/90 px-4 py-3 text-center shadow-sm">
                      <MapPin className="mx-auto mb-1 h-6 w-6 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        Nenhum motoboy disponível
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Order Row ---

function OrderRow({
  order,
  shopName,
}: {
  order: Order;
  shopName: string | null;
}) {
  const time = new Date(order.created_at).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <li className="flex items-center justify-between px-4 py-3 hover:bg-muted/50">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">#{order.order_number}</span>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {shopName && (
            <span className="font-medium text-foreground">{shopName} — </span>
          )}
          {order.recipient_name}
        </p>
      </div>
      <span className="ml-4 shrink-0 text-xs text-muted-foreground">
        {time}
      </span>
    </li>
  );
}
