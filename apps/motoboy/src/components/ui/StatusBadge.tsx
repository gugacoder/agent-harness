export type CourierStatus = "available" | "busy" | "offline";

const STATUS_LABELS: Record<CourierStatus, string> = {
  available: "Disponível",
  busy: "Ocupado",
  offline: "Offline",
};

const STATUS_COLORS: Record<CourierStatus, string> = {
  available: "bg-cs-success",
  busy: "bg-accent",
  offline: "bg-muted-foreground/40",
};

export function StatusBadge({ status }: { status: CourierStatus }) {
  return (
    <span className="relative inline-flex h-3 w-3" title={STATUS_LABELS[status]}>
      {status === "available" && (
        <span className="absolute inset-0 animate-ping rounded-full bg-cs-success/60" />
      )}
      <span
        className={`relative inline-block h-3 w-3 rounded-full border-2 border-background ${STATUS_COLORS[status]}`}
      />
    </span>
  );
}
