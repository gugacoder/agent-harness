import { useMemo } from "react";
import {
  Building2,
  Truck,
  Users,
  CalendarDays,
  CalendarRange,
  Calendar,
} from "lucide-react";
import { useAdminMetrics } from "@/hooks/useAdmin";
import { Skeleton } from "@/components/ui/Skeleton";

// --- Metric Card ---

function MetricCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`rounded-md p-2 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

// --- Simple Bar Chart ---

function DeliveriesChart({
  data,
}: {
  data: { date: string; count: number }[];
}) {
  const maxCount = useMemo(
    () => Math.max(1, ...data.map((d) => d.count)),
    [data]
  );

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Sem dados de entregas nos ultimos 30 dias
      </div>
    );
  }

  return (
    <div className="flex h-48 items-end gap-[2px]">
      {data.map((d) => {
        const height = Math.max(2, (d.count / maxCount) * 100);
        const dateLabel = new Date(d.date + "T00:00:00").toLocaleDateString(
          "pt-BR",
          { day: "2-digit", month: "2-digit" }
        );
        return (
          <div
            key={d.date}
            className="group relative flex-1"
            title={`${dateLabel}: ${d.count} entregas`}
          >
            <div
              className="mx-auto w-full max-w-[20px] rounded-t bg-primary/80 transition-colors group-hover:bg-primary"
              style={{ height: `${height}%` }}
            />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-xs text-background group-hover:block">
              {dateLabel}: {d.count}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- Main ---

export function AdminDashboard() {
  const { data: metrics, isLoading } = useAdminMetrics();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Admin</h1>
        <p className="mt-1 text-muted-foreground">
          Visao geral da plataforma
        </p>
      </div>

      {/* Metric Cards */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-[84px]" />
          ))}
        </div>
      ) : metrics ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            title="Empresas Ativas"
            value={metrics.total_companies}
            icon={Building2}
            color="bg-primary/10 text-primary"
          />
          <MetricCard
            title="Entregas Hoje"
            value={metrics.total_deliveries_today}
            icon={CalendarDays}
            color="bg-blue-100 text-blue-700"
          />
          <MetricCard
            title="Entregas Semana"
            value={metrics.total_deliveries_week}
            icon={CalendarRange}
            color="bg-amber-100 text-amber-700"
          />
          <MetricCard
            title="Entregas Mes"
            value={metrics.total_deliveries_month}
            icon={Calendar}
            color="bg-purple-100 text-purple-700"
          />
          <MetricCard
            title="Usuarios Ativos"
            value={metrics.total_users}
            icon={Users}
            color="bg-green-100 text-green-700"
          />
        </div>
      ) : null}

      {/* Deliveries Chart */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Truck className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">
            Entregas por Dia (Ultimos 30 dias)
          </h2>
        </div>
        <div className="p-4">
          {isLoading ? (
            <Skeleton className="h-48" />
          ) : metrics ? (
            <DeliveriesChart data={metrics.deliveries_per_day} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
