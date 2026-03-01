import { useMemo } from "react";
import {
  Package,
  Bike,
  MapPin,
  Clock,
  CheckCircle2,
  X,
} from "lucide-react";
import type { Order } from "@/types/api";

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

export function OrderTimeline({ order }: { order: Order }) {
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
