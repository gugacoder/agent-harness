import {
  Package,
  CheckCircle2,
  XCircle,
  Percent,
  Clock,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import type { AnalyticsOverview, AnalyticsRevenue } from "@/types/api";

interface MetricCardsProps {
  overview?: AnalyticsOverview;
  revenue?: AnalyticsRevenue;
  isLoading: boolean;
}

function formatCurrency(value: string) {
  return `R$ ${parseFloat(value).toFixed(2).replace(".", ",")}`;
}

function formatMinutes(min: number) {
  if (min < 60) return `${min.toFixed(0)} min`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${h}h ${m}min`;
}

export function MetricCards({ overview, revenue, isLoading }: MetricCardsProps) {
  const cards = [
    {
      label: "Total Entregas",
      value: overview?.total_deliveries ?? 0,
      icon: Package,
      color: "text-cs-info",
    },
    {
      label: "Concluídas",
      value: overview?.completed ?? 0,
      icon: CheckCircle2,
      color: "text-cs-success",
    },
    {
      label: "Canceladas",
      value: overview?.cancelled ?? 0,
      icon: XCircle,
      color: "text-destructive",
    },
    {
      label: "Taxa de Conclusão",
      value: `${(overview?.completion_rate ?? 0).toFixed(1)}%`,
      icon: Percent,
      color: "text-purple-600",
    },
    {
      label: "Tempo Médio",
      value: formatMinutes(overview?.avg_delivery_time_minutes ?? 0),
      icon: Clock,
      color: "text-cs-warning",
    },
    {
      label: "Receita Total",
      value: revenue ? formatCurrency(revenue.total_revenue) : "R$ 0,00",
      icon: DollarSign,
      color: "text-cs-success",
    },
    {
      label: "Receita Média/Entrega",
      value: revenue ? formatCurrency(revenue.avg_per_delivery) : "R$ 0,00",
      icon: TrendingUp,
      color: "text-cs-info",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <card.icon className={`h-4 w-4 ${card.color}`} />
            <p className="text-xs font-medium text-muted-foreground">
              {card.label}
            </p>
          </div>
          <p className={`mt-2 text-xl font-bold ${card.color}`}>
            {isLoading ? "..." : card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
