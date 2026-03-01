import { useState, useMemo } from "react";
import { BarChart3 } from "lucide-react";
import {
  useAnalyticsOverview,
  useAnalyticsCouriers,
  useAnalyticsNeighborhoods,
  useAnalyticsRevenue,
  useAnalyticsTrend,
} from "@/hooks/useAnalytics";
import type { UseAnalyticsOptions } from "@/hooks/useAnalytics";
import { PeriodFilter } from "@/components/analytics/PeriodFilter";
import { MetricCards } from "@/components/analytics/MetricCards";
import { CourierPerformanceTable } from "@/components/analytics/CourierPerformanceTable";
import { NeighborhoodVolumeList } from "@/components/analytics/NeighborhoodVolumeList";
import { DeliveryTrendChart } from "@/components/analytics/DeliveryTrendChart";
import type { AnalyticsPeriod } from "@/types/api";

export function AnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("month");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  const queryOptions = useMemo<UseAnalyticsOptions>(() => {
    if (period === "custom" && periodStart && periodEnd) {
      return { period: "custom", periodStart, periodEnd };
    }
    return { period };
  }, [period, periodStart, periodEnd]);

  const { data: overview, isLoading: loadingOverview } =
    useAnalyticsOverview(queryOptions);
  const { data: revenue, isLoading: loadingRevenue } =
    useAnalyticsRevenue(queryOptions);
  const { data: couriers, isLoading: loadingCouriers } =
    useAnalyticsCouriers(queryOptions);
  const { data: neighborhoods, isLoading: loadingNeighborhoods } =
    useAnalyticsNeighborhoods(queryOptions);
  const { data: trend, isLoading: loadingTrend } =
    useAnalyticsTrend(queryOptions);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        </div>
        <p className="mt-1 text-muted-foreground">
          Acompanhe as métricas e performance das entregas.
        </p>
      </div>

      {/* Period filter */}
      <PeriodFilter
        period={period}
        periodStart={periodStart}
        periodEnd={periodEnd}
        onPeriodChange={setPeriod}
        onStartChange={setPeriodStart}
        onEndChange={setPeriodEnd}
      />

      {/* Metric cards */}
      <MetricCards
        overview={overview}
        revenue={revenue}
        isLoading={loadingOverview || loadingRevenue}
      />

      {/* Trend chart */}
      <DeliveryTrendChart trend={trend} isLoading={loadingTrend} />

      {/* Tables side by side */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CourierPerformanceTable
          couriers={couriers}
          isLoading={loadingCouriers}
        />
        <NeighborhoodVolumeList
          neighborhoods={neighborhoods}
          isLoading={loadingNeighborhoods}
        />
      </div>
    </div>
  );
}
