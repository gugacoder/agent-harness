import { useState, useMemo } from "react";
import { Wallet } from "lucide-react";
import { useEarnings } from "@/hooks/useEarnings";
import { useEarningsSummary } from "@/hooks/useEarningsSummary";
import { PeriodSelector } from "@/components/earnings/PeriodSelector";
import { EarningsSummaryCard } from "@/components/earnings/EarningsSummaryCard";
import { EarningsList } from "@/components/earnings/EarningsList";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import type { PeriodFilter } from "@/types/earnings";
import { PageHelpLink } from "@/components/ui/PageHelpLink";

function getPeriodDates(period: PeriodFilter): {
  start: string;
  end: string;
} {
  const now = new Date();
  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
  );

  let start: Date;
  if (period === "week") {
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1; // Monday = 0
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export function ExtratoPage() {
  const [period, setPeriod] = useState<PeriodFilter>("week");

  const { start, end } = useMemo(() => getPeriodDates(period), [period]);

  const {
    data: earnings,
    isLoading: earningsLoading,
    error: earningsError,
  } = useEarnings(start, end);

  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
  } = useEarningsSummary();

  const isLoading = earningsLoading || summaryLoading;
  const error = earningsError || summaryError;

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Extrato</h1>
          <PageHelpLink url="/docs#ganhos" />
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* Error */}
      {error && (
        <ErrorAlert message="Não foi possível carregar o extrato. Tente novamente." />
      )}

      {/* Summary */}
      {isLoading ? (
        <LoadingSkeleton className="h-24" />
      ) : summary ? (
        <EarningsSummaryCard
          period={period}
          periodData={summary[period]}
          todayData={summary.today}
        />
      ) : null}

      {/* Earnings list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <LoadingSkeleton key={i} className="h-20" />
          ))}
        </div>
      ) : !earnings?.length ? (
        <EmptyState
          icon={Wallet}
          title="Nenhum ganho no período"
          description="Seus ganhos com entregas aparecerão aqui."
        />
      ) : (
        <EarningsList items={earnings} />
      )}
    </div>
  );
}
