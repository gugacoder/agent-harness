import { cn } from "@/lib/utils";

interface ClosingStatusBadgeProps {
  status: string | null;
}

function getStatusConfig(status: string | null) {
  switch (status) {
    case "paid":
      return { label: "Pago", className: "bg-emerald-100 text-emerald-700" };
    case "confirmed":
    case "draft":
      return { label: "Pendente", className: "bg-amber-100 text-amber-700" };
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
