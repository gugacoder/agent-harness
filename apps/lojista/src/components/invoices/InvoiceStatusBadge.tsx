import type { InvoiceStatus } from "@/types/api";

export type DisplayInvoiceStatus = "aberta" | "paga" | "vencida";

export function getDisplayStatus(
  status: InvoiceStatus,
  periodEnd: string,
): DisplayInvoiceStatus {
  if (status === "paid") return "paga";
  if (status === "sent") {
    const endDate = new Date(periodEnd);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (endDate < today) return "vencida";
    return "aberta";
  }
  return "aberta";
}

const STATUS_LABELS: Record<DisplayInvoiceStatus, string> = {
  aberta: "Pendente",
  paga: "Paga",
  vencida: "Vencida",
};

const STATUS_COLORS: Record<DisplayInvoiceStatus, string> = {
  aberta: "bg-secondary text-secondary-foreground",
  paga: "bg-primary text-primary-foreground",
  vencida: "bg-destructive text-white",
};

export function InvoiceStatusBadge({
  status,
  periodEnd,
}: {
  status: InvoiceStatus;
  periodEnd: string;
}) {
  const displayStatus = getDisplayStatus(status, periodEnd);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[displayStatus]}`}
    >
      {STATUS_LABELS[displayStatus]}
    </span>
  );
}

export { STATUS_LABELS };
