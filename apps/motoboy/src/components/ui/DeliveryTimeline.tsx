import { useMemo } from "react";
import {
  Package,
  CheckCircle2,
  MapPin,
  Bike,
  Clock,
} from "lucide-react";
import type { DeliveryEvent } from "@/types/delivery";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  assigned: Package,
  accepted: CheckCircle2,
  picked_up: MapPin,
  in_transit: Bike,
  delivered: CheckCircle2,
  failed: Clock,
};

function TimelineItem({
  icon: Icon,
  title,
  time,
  isLast,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
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
        <p className="mt-0.5 text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}

export function DeliveryTimeline({ events }: { events: DeliveryEvent[] }) {
  const items = useMemo(() => {
    return events
      .filter((e) => e.event_type === "status_change")
      .map((event) => ({
        icon: STATUS_ICONS[event.new_status ?? "assigned"] ?? Clock,
        title: event.description,
        time: formatDate(event.created_at),
      }));
  }, [events]);

  if (items.length === 0) return null;

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-foreground">
        Timeline
      </h3>
      {items.map((item, idx) => (
        <TimelineItem
          key={idx}
          icon={item.icon}
          title={item.title}
          time={item.time}
          isLast={idx === items.length - 1}
        />
      ))}
    </div>
  );
}
