import { useState, useMemo } from "react";
import { Clock } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { OrderStatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { OrderProofBadge } from "@/components/delivery-proof/OrderProofBadge";
import { OrderDetailView } from "@/components/orders/OrderDetailView";
import {
  OrderHistoryFilters,
  DEFAULT_FILTERS,
  type HistoryFilters,
} from "@/components/orders/OrderHistoryFilters";
import type { Order, OrderStatus } from "@/types/api";

const HISTORY_STATUSES: OrderStatus[] = ["delivered", "cancelled"];
const PAGE_SIZE = 20;

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
          {order.status === "delivered" && (
            <OrderProofBadge orderId={order.id} />
          )}
        </div>
        <span className="text-xs text-muted-foreground">{dateStr}</span>
      </div>
      <p className="mt-1 truncate text-sm text-muted-foreground">
        {order.recipient_name} — {order.delivery_address}
      </p>
    </button>
  );
}

// --- Main Page ---

type View = { type: "list" } | { type: "detail"; orderId: string };

export function HistoricoPage() {
  const [view, setView] = useState<View>({ type: "list" });
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [filters, setFilters] = useState<HistoryFilters>(DEFAULT_FILTERS);

  const { data: orders, isLoading } = useOrders();

  // Filter to history orders (delivered + cancelled), apply user filters, sort by date descending
  const historyOrders = useMemo(() => {
    if (!orders) return [];
    return orders
      .filter((o) => {
        // Base filter: only history statuses
        if (!HISTORY_STATUSES.includes(o.status)) return false;

        // Status filter
        if (
          filters.statuses.length > 0 &&
          !filters.statuses.includes(o.status)
        )
          return false;

        // Date filter
        const orderDate = o.created_at.slice(0, 10);
        if (filters.dateFrom && orderDate < filters.dateFrom) return false;
        if (filters.dateTo && orderDate > filters.dateTo) return false;

        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }, [orders, filters]);

  const visibleOrders = useMemo(
    () => historyOrders.slice(0, visibleCount),
    [historyOrders, visibleCount],
  );

  const hasMore = visibleCount < historyOrders.length;

  // --- Render Order Detail ---
  if (view.type === "detail") {
    return (
      <OrderDetailView
        orderId={view.orderId}
        onBack={() => setView({ type: "list" })}
      />
    );
  }

  // --- Render Order List ---
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Histórico</h1>

      <OrderHistoryFilters
        filters={filters}
        onChange={setFilters}
        resultCount={historyOrders.length}
      />

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
