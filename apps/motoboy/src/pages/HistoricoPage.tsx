import { useState, useMemo } from "react";
import { Clock, ChevronLeft, MapPin, Timer } from "lucide-react";
import { useDeliveryHistory } from "@/hooks/useDeliveryHistory";
import type { DeliveryWithOrder } from "@/hooks/useDeliveryHistory";
import { useDeliveryProof } from "@/hooks/useDeliveryProof";
import { DeliveryStatusBadge } from "@/components/ui/DeliveryStatusBadge";
import { DeliveryTimeline } from "@/components/ui/DeliveryTimeline";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ProofBadge } from "@/components/delivery-proof/ProofBadge";
import { DeliveryProofViewer } from "@/components/delivery-proof/DeliveryProofViewer";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { DeliveryEvent } from "@/types/delivery";

const PAGE_SIZE = 20;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDuration(minutes: number | null): string {
  if (minutes == null) return "—";
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function isToday(iso: string): boolean {
  const date = new Date(iso);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

// --- History Item Card ---

function HistoryCard({
  item,
  onClick,
}: {
  item: DeliveryWithOrder;
  onClick: () => void;
}) {
  const deliveredDate = item.delivery.delivered_at ?? item.delivery.created_at;
  const { data: proof } = useDeliveryProof(item.delivery.id);

  return (
    <button
      onClick={onClick}
      className="w-full px-4 py-3 text-left transition-colors hover:bg-muted/50"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DeliveryStatusBadge status={item.delivery.status} />
          {proof && <ProofBadge />}
          {item.delivery.actual_duration_min != null && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Timer className="h-3 w-3" />
              {formatDuration(item.delivery.actual_duration_min)}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {formatDate(deliveredDate)}
        </span>
      </div>
      <div className="mt-1 flex items-start gap-1.5">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <p className="truncate text-sm text-muted-foreground">
          {item.order.delivery_address}
        </p>
      </div>
    </button>
  );
}

// --- History Detail ---

function HistoryDetail({
  item,
  onBack,
}: {
  item: DeliveryWithOrder;
  onBack: () => void;
}) {
  const { data: events = [] } = useQuery({
    queryKey: ["delivery-events", item.delivery.id],
    queryFn: () =>
      api
        .get(`api/deliveries/${item.delivery.id}/events`)
        .json<DeliveryEvent[]>(),
  });

  const { data: proof } = useDeliveryProof(item.delivery.id);

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted"
          aria-label="Voltar"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold">Detalhes</h2>
          <DeliveryStatusBadge status={item.delivery.status} />
          {proof && <ProofBadge />}
        </div>
      </div>

      {/* Delivery Info */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="border-b px-4 py-3">
          <h3 className="font-semibold">Informações</h3>
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Coleta</p>
              <p className="text-sm">{item.order.pickup_address}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Entrega</p>
              <p className="text-sm">{item.order.delivery_address}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Destinatário</p>
              <p className="text-sm">{item.order.recipient_name}</p>
            </div>
          </div>
          {item.delivery.actual_duration_min != null && (
            <div className="flex items-start gap-2">
              <Timer className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Tempo gasto</p>
                <p className="text-sm">
                  {formatDuration(item.delivery.actual_duration_min)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Proof of Delivery */}
      {proof && <DeliveryProofViewer proof={proof} />}

      {/* Timeline */}
      {events.length > 0 && (
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="border-b px-4 py-3">
            <h3 className="font-semibold">Timeline</h3>
          </div>
          <div className="p-4">
            <DeliveryTimeline events={events} />
          </div>
        </div>
      )}
    </div>
  );
}

// --- Main Page ---

type View = { type: "list" } | { type: "detail"; deliveryId: string };

export function HistoricoPage() {
  const [view, setView] = useState<View>({ type: "list" });
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { data: history, isLoading } = useDeliveryHistory();

  const todayCount = useMemo(() => {
    if (!history) return 0;
    return history.filter((item) => {
      const date = item.delivery.delivered_at ?? item.delivery.created_at;
      return isToday(date);
    }).length;
  }, [history]);

  const visibleItems = useMemo(
    () => (history ?? []).slice(0, visibleCount),
    [history, visibleCount],
  );

  const hasMore = visibleCount < (history?.length ?? 0);

  // Get current item for detail view
  const currentItem = useMemo(() => {
    if (view.type === "detail") {
      return (
        history?.find((item) => item.delivery.id === view.deliveryId) ?? null
      );
    }
    return null;
  }, [history, view]);

  // --- Detail View ---
  if (view.type === "detail" && currentItem) {
    return (
      <HistoryDetail
        item={currentItem}
        onBack={() => setView({ type: "list" })}
      />
    );
  }

  // --- List View ---
  return (
    <div className="space-y-4 p-4">
      {/* Header with today's count */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Histórico</h1>
        {!isLoading && (
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            Hoje: {todayCount}
          </span>
        )}
      </div>

      <div className="rounded-lg border bg-card shadow-sm">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map((i) => (
              <LoadingSkeleton key={i} className="h-16" />
            ))}
          </div>
        ) : !history?.length ? (
          <EmptyState
            icon={Clock}
            title="Nenhuma entrega no histórico"
            description="Suas entregas realizadas aparecerão aqui."
          />
        ) : (
          <>
            <div className="divide-y">
              {visibleItems.map((item) => (
                <HistoryCard
                  key={item.delivery.id}
                  item={item}
                  onClick={() =>
                    setView({
                      type: "detail",
                      deliveryId: item.delivery.id,
                    })
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
