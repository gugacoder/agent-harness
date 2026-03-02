interface CourierGpsBadgeProps {
  lastRecordedAt: string | null;
}

type GpsState = "active" | "intermittent" | "inactive" | "no_data";

function getGpsState(lastRecordedAt: string | null): GpsState {
  if (!lastRecordedAt) return "no_data";
  const deltaMs = Date.now() - new Date(lastRecordedAt).getTime();
  const deltaMin = deltaMs / 60_000;
  if (deltaMin < 1) return "active";
  if (deltaMin <= 5) return "intermittent";
  return "inactive";
}

const STATE_CONFIG: Record<GpsState, { color: string; tooltip: string }> = {
  active: { color: "bg-green-500", tooltip: "GPS ativo" },
  intermittent: { color: "bg-yellow-500", tooltip: "GPS intermitente" },
  inactive: { color: "bg-red-500", tooltip: "GPS inativo" },
  no_data: { color: "bg-gray-400", tooltip: "Sem dados" },
};

export function CourierGpsBadge({ lastRecordedAt }: CourierGpsBadgeProps) {
  const state = getGpsState(lastRecordedAt);
  const { color, tooltip } = STATE_CONFIG[state];

  return (
    <span
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${color}`}
      title={tooltip}
      aria-label={tooltip}
    />
  );
}
