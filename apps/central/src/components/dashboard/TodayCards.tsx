import { Package, Truck, Clock, CheckCircle2 } from "lucide-react";
import { useTodayMetrics } from "@/hooks/useAnalytics";
import { Skeleton } from "@/components/ui/Skeleton";

interface TodayCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

function TodayCard({ title, value, icon: Icon, color }: TodayCardProps) {
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

export function TodayCards() {
  const { data, isLoading } = useTodayMetrics();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-[84px]" />
        <Skeleton className="h-[84px]" />
        <Skeleton className="h-[84px]" />
        <Skeleton className="h-[84px]" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <TodayCard
        title="Entregas Hoje"
        value={data?.deliveries_today ?? 0}
        icon={Package}
        color="bg-primary/10 text-primary"
      />
      <TodayCard
        title="Concluídas"
        value={data?.deliveries_today_completed ?? 0}
        icon={CheckCircle2}
        color="bg-green-100 text-green-700"
      />
      <TodayCard
        title="Motoboys Online"
        value={data?.couriers_online ?? 0}
        icon={Truck}
        color="bg-green-100 text-green-600"
      />
      <TodayCard
        title="Pedidos Pendentes"
        value={data?.orders_pending ?? 0}
        icon={Clock}
        color="bg-amber-100 text-amber-600"
      />
    </div>
  );
}
