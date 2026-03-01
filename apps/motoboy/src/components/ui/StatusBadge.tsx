export type CourierStatus = "available" | "busy" | "offline";

const STATUS_LABELS: Record<CourierStatus, string> = {
  available: "Disponível",
  busy: "Ocupado",
  offline: "Offline",
};

const STATUS_COLORS: Record<CourierStatus, string> = {
  available: "bg-green-500 text-white",
  busy: "bg-accent text-accent-foreground",
  offline: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: CourierStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
