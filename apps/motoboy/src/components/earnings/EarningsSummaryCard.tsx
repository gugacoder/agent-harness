import { TrendingUp, Bike } from "lucide-react";
import type { EarningsSummaryPeriod } from "@/types/earnings";
import type { PeriodFilter } from "@/types/earnings";

interface EarningsSummaryCardProps {
  period: PeriodFilter;
  periodData: EarningsSummaryPeriod;
  todayData: EarningsSummaryPeriod;
}

function formatCurrency(value: string): string {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

const periodLabels: Record<PeriodFilter, string> = {
  week: "esta semana",
  month: "este mês",
};

export function EarningsSummaryCard({
  period,
  periodData,
  todayData,
}: EarningsSummaryCardProps) {
  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="p-4">
        <p className="text-sm text-muted-foreground">
          Total {periodLabels[period]}
        </p>
        <p className="mt-1 text-2xl font-bold text-foreground">
          {formatCurrency(periodData.total_amount)}
        </p>
        <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Bike className="h-4 w-4" />
            {periodData.total_deliveries} entrega
            {periodData.total_deliveries !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            Hoje: {formatCurrency(todayData.total_amount)}
          </span>
        </div>
      </div>
    </div>
  );
}
