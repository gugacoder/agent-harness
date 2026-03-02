import { cn } from "@/lib/utils";

interface ClosingStatusBadgeProps {
  status: string | null;
}

function getStatusConfig(status: string | null) {
  switch (status) {
    case "paid":
      return { label: "Pago", className: "bg-cs-success/10 text-cs-success" };
    case "confirmed":
    case "draft":
      return { label: "Pendente", className: "bg-cs-warning/10 text-cs-warning" };
    default:
      return null;
  }
}

export function ClosingStatusBadge({ status }: ClosingStatusBadgeProps) {
  const config = getStatusConfig(status);
  if (!config) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}
