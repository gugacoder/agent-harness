import { useQuery } from "@tanstack/react-query";
import {
  Package,
  Bike,
  MapPin,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";
import type { OrderStatus } from "@/types/api";

interface TimelineEvent {
  event_type: string;
  old_status: string | null;
  new_status: string | null;
  description: string;
  actor_name: string;
  created_at: string;
}

interface OrderTimelineProps {
  orderId: string;
}

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

/** All statuses in order (for showing future empty circles) */
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

export function OrderTimeline({ orderId }: OrderTimelineProps) {
  const { data, isLoading } = useQuery<TimelineEvent[]>({
    queryKey: ["order-timeline", orderId],
    queryFn: () =>
      api.get(`api/orders/${orderId}/timeline`).json<TimelineEvent[]>(),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
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
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Nenhum evento encontrado.
      </div>
    );
  }

  // Determine the latest status reached from the events
  const reachedStatuses = new Set<string>();
  for (const evt of data) {
    if (evt.new_status) reachedStatuses.add(evt.new_status);
  }

  // Check if cancelled
  const isCancelled = reachedStatuses.has("cancelled");

  // Find the highest reached status index
  let maxReachedIdx = -1;
  for (let i = 0; i < STATUS_ORDER.length; i++) {
    if (reachedStatuses.has(STATUS_ORDER[i])) maxReachedIdx = i;
  }

  // Build display items: real events + future statuses
  type DisplayItem =
    | { kind: "event"; event: TimelineEvent }
    | { kind: "future"; status: OrderStatus };

  const items: DisplayItem[] = data.map((event) => ({
    kind: "event" as const,
    event,
  }));

  // Add future statuses (only if not cancelled)
  if (!isCancelled) {
    for (let i = maxReachedIdx + 1; i < STATUS_ORDER.length; i++) {
      items.push({ kind: "future", status: STATUS_ORDER[i] });
    }
  }

  return (
    <div className="p-4">
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

        // Real event
        const evt = item.event;
        const status = evt.new_status ?? evt.old_status ?? "pending";
        const Icon = STATUS_ICON[status] ?? Clock;
        const isCurrent = idx === data.length - 1 && item.kind === "event";
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
