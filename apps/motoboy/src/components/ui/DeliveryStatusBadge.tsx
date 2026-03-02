import type { DeliveryStatus } from "@/types/delivery";

const STATUS_LABELS: Record<DeliveryStatus, string> = {
  assigned: "Atribuido",
  accepted: "Aceito",
  picked_up: "Coletado",
  in_transit: "Em Transito",
  delivered: "Entregue",
  failed: "Recusado",
};

const STATUS_COLORS: Record<DeliveryStatus, string> = {
  assigned: "bg-secondary text-secondary-foreground",
  accepted: "bg-cs-info text-white",
  picked_up: "bg-accent text-accent-foreground",
  in_transit: "bg-secondary text-secondary-foreground",
  delivered: "bg-primary text-primary-foreground",
  failed: "bg-destructive text-white",
};

export function DeliveryStatusBadge({ status }: { status: DeliveryStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
