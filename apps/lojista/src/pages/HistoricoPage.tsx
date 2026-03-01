import { useState, useMemo } from "react";
import {
  Clock,
  ChevronLeft,
  Package,
  Bike,
  MapPin,
  User,
  Phone,
  FileText,
  CheckCircle2,
  X,
} from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { OrderStatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Order, OrderStatus } from "@/types/api";

const HISTORY_STATUSES: OrderStatus[] = ["delivered", "cancelled"];
const PAGE_SIZE = 20;

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

    if (
      ["assigned", "picked_up", "in_transit", "delivered"].includes(
        order.status,
      )
    ) {
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

// --- History Order Card ---

function HistoryOrderCard({
  order,
  onClick,
}: {
  order: Order;
  onClick: () => void;
}) {
  const dateStr = new Date(order.created_at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
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
        <span className="text-xs text-muted-foreground">{dateStr}</span>
      </div>
      <p className="mt-1 truncate text-sm text-muted-foreground">
        {order.recipient_name} — {order.delivery_address}
      </p>
    </button>
  );
}

// --- History Order Detail ---

function HistoryOrderDetail({
  order,
  onBack,
}: {
  order: Order;
  onBack: () => void;
}) {
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
          <OrderTimeline order={order} />
        </div>
      </div>
    </div>
  );
}

// --- Main Page ---

type View = { type: "list" } | { type: "detail"; orderId: string };

export function HistoricoPage() {
  const [view, setView] = useState<View>({ type: "list" });
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { data: orders, isLoading } = useOrders();

  // Filter to history orders (delivered + cancelled), sort by date descending
  const historyOrders = useMemo(() => {
    if (!orders) return [];
    return orders
      .filter((o) => HISTORY_STATUSES.includes(o.status))
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }, [orders]);

  const visibleOrders = useMemo(
    () => historyOrders.slice(0, visibleCount),
    [historyOrders, visibleCount],
  );

  const hasMore = visibleCount < historyOrders.length;

  // Get current order for detail view
  const currentOrder = useMemo(() => {
    if (view.type === "detail") {
      return orders?.find((o) => o.id === view.orderId) ?? null;
    }
    return null;
  }, [orders, view]);

  // --- Render Order Detail ---
  if (view.type === "detail" && currentOrder) {
    return (
      <HistoryOrderDetail
        order={currentOrder}
        onBack={() => setView({ type: "list" })}
      />
    );
  }

  // --- Render Order List ---
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Histórico</h1>

      <div className="rounded-lg border bg-card shadow-sm">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : historyOrders.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="Nenhum pedido no histórico"
            description="Pedidos entregues ou cancelados aparecerão aqui"
          />
        ) : (
          <>
            <div className="divide-y">
              {visibleOrders.map((order) => (
                <HistoryOrderCard
                  key={order.id}
                  order={order}
                  onClick={() =>
                    setView({ type: "detail", orderId: order.id })
                  }
                />
              ))}
            </div>
            {hasMore && (
              <div className="border-t px-4 py-3">
                <button
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="w-full rounded-md bg-muted px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/80"
                >
                  Carregar mais
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
