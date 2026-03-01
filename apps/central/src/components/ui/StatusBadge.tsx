import type { OrderStatus, CourierStatus, ClosingStatus, InvoiceStatus } from "@/types/api";

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendente",
  assigned: "Atribuído",
  picked_up: "Coletado",
  in_transit: "Em Trânsito",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  assigned: "bg-secondary text-secondary-foreground",
  picked_up: "bg-accent text-accent-foreground",
  in_transit: "bg-secondary text-secondary-foreground",
  delivered: "bg-primary text-primary-foreground",
  cancelled: "bg-destructive text-white",
};

const COURIER_STATUS_LABELS: Record<CourierStatus, string> = {
  available: "Disponível",
  busy: "Ocupado",
  offline: "Offline",
};

const COURIER_STATUS_COLORS: Record<CourierStatus, string> = {
  available: "bg-green-100 text-green-800",
  busy: "bg-amber-100 text-amber-800",
  offline: "bg-gray-100 text-gray-600",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ORDER_STATUS_COLORS[status]}`}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

export function CourierStatusBadge({ status }: { status: CourierStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${COURIER_STATUS_COLORS[status]}`}
    >
      {COURIER_STATUS_LABELS[status]}
    </span>
  );
}

const CLOSING_STATUS_LABELS: Record<ClosingStatus, string> = {
  draft: "Rascunho",
  confirmed: "Confirmado",
  paid: "Pago",
};

const CLOSING_STATUS_COLORS: Record<ClosingStatus, string> = {
  draft: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
};

export function ClosingStatusBadge({ status }: { status: ClosingStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${CLOSING_STATUS_COLORS[status]}`}
    >
      {CLOSING_STATUS_LABELS[status]}
    </span>
  );
}

const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Rascunho",
  sent: "Enviada",
  paid: "Paga",
};

const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: "bg-amber-100 text-amber-800",
  sent: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${INVOICE_STATUS_COLORS[status]}`}
    >
      {INVOICE_STATUS_LABELS[status]}
    </span>
  );
}

/** Re-export the label/color maps for pages that need direct access */
export {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  COURIER_STATUS_LABELS,
  COURIER_STATUS_COLORS,
  CLOSING_STATUS_LABELS,
  CLOSING_STATUS_COLORS,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
};
