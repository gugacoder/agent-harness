import { useMemo } from "react";
import {
  LayoutDashboard,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
} from "lucide-react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useOrders } from "@/hooks/useOrders";
import { useCouriers } from "@/hooks/useCouriers";
import { useShops } from "@/hooks/useShops";
import type { Order, OrderStatus } from "@/types/api";

// --- Status helpers ---

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendente",
  assigned: "Atribuído",
  picked_up: "Coletado",
  in_transit: "Em Trânsito",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  assigned: "bg-secondary text-secondary-foreground",
  picked_up: "bg-accent text-accent-foreground",
  in_transit: "bg-secondary text-secondary-foreground",
  delivered: "bg-primary text-primary-foreground",
  cancelled: "bg-destructive text-white",
};

// --- Metric Card ---

function MetricCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`rounded-md p-2 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

// --- Status Badge ---

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

// --- Loading Skeleton ---

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted ${className ?? ""}`}
    />
  );
}

// --- Main Dashboard ---

export function DashboardPage() {
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { data: couriers, isLoading: couriersLoading } = useCouriers();
  const { data: shops } = useShops();

  const shopMap = useMemo(() => {
    const map = new Map<string, string>();
    if (shops) {
      for (const s of shops) map.set(s.id, s.trade_name);
    }
    return map;
  }, [shops]);

  const metrics = useMemo(() => {
    if (!orders) return { total: 0, inProgress: 0, completed: 0 };
    const today = new Date().toISOString().slice(0, 10);
    const todayOrders = orders.filter(
      (o) => o.created_at.slice(0, 10) === today,
    );
    const inProgressStatuses: OrderStatus[] = [
      "pending",
      "assigned",
      "picked_up",
      "in_transit",
    ];
    return {
      total: todayOrders.length,
      inProgress: todayOrders.filter((o) =>
        inProgressStatuses.includes(o.status),
      ).length,
      completed: todayOrders.filter((o) => o.status === "delivered").length,
    };
  }, [orders]);

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
      (c) => c.status === "available" || c.status === "busy",
    ).length;
  }, [couriers]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Visão geral da operação</p>
      </div>

      {/* Metric Cards */}
      {ordersLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-[84px]" />
          <Skeleton className="h-[84px]" />
          <Skeleton className="h-[84px]" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            title="Pedidos Hoje"
            value={metrics.total}
            icon={Package}
            color="bg-primary/10 text-primary"
          />
          <MetricCard
            title="Em Andamento"
            value={metrics.inProgress}
            icon={Clock}
            color="bg-secondary/10 text-secondary"
          />
          <MetricCard
            title="Concluídos"
            value={metrics.completed}
            icon={CheckCircle2}
            color="bg-green-100 text-green-700"
          />
        </div>
      )}

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
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm font-medium text-muted-foreground">
                  Nenhum pedido ativo
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Novos pedidos aparecerão aqui automaticamente
                </p>
              </div>
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
            {!couriersLoading && (
              <span className="ml-auto text-xs text-muted-foreground">
                {activeCourierCount} ativo(s)
              </span>
            )}
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
                  {/* Courier markers will be populated via SSE integration (F-009).
                      The map is ready to display markers — SSE events will push
                      courier_location updates that can be rendered as Marker components. */}
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
          <StatusBadge status={order.status} />
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
