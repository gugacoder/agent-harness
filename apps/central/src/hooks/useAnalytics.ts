import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  AnalyticsPeriod,
  AnalyticsOverview,
  CourierPerformance,
  NeighborhoodVolume,
  AnalyticsRevenue,
  TrendDataPoint,
} from "@/types/api";

export interface UseAnalyticsOptions {
  period?: AnalyticsPeriod;
  periodStart?: string;
  periodEnd?: string;
}

function buildParams(options?: UseAnalyticsOptions): Record<string, string> {
  const searchParams: Record<string, string> = {};
  if (options?.period) searchParams.period = options.period;
  if (options?.periodStart) searchParams.period_start = options.periodStart;
  if (options?.periodEnd) searchParams.period_end = options.periodEnd;
  return searchParams;
}

export function useAnalyticsOverview(options?: UseAnalyticsOptions) {
  return useQuery<AnalyticsOverview>({
    queryKey: [
      "analytics-overview",
      options?.period,
      options?.periodStart,
      options?.periodEnd,
    ],
    queryFn: async () => {
      return api
        .get("api/analytics/overview", { searchParams: buildParams(options) })
        .json<AnalyticsOverview>();
    },
  });
}

export function useAnalyticsCouriers(options?: UseAnalyticsOptions) {
  return useQuery<CourierPerformance[]>({
    queryKey: [
      "analytics-couriers",
      options?.period,
      options?.periodStart,
      options?.periodEnd,
    ],
    queryFn: async () => {
      return api
        .get("api/analytics/couriers", { searchParams: buildParams(options) })
        .json<CourierPerformance[]>();
    },
  });
}

export function useAnalyticsNeighborhoods(options?: UseAnalyticsOptions) {
  return useQuery<NeighborhoodVolume[]>({
    queryKey: [
      "analytics-neighborhoods",
      options?.period,
      options?.periodStart,
      options?.periodEnd,
    ],
    queryFn: async () => {
      return api
        .get("api/analytics/neighborhoods", {
          searchParams: buildParams(options),
        })
        .json<NeighborhoodVolume[]>();
    },
  });
}

export function useAnalyticsRevenue(options?: UseAnalyticsOptions) {
  return useQuery<AnalyticsRevenue>({
    queryKey: [
      "analytics-revenue",
      options?.period,
      options?.periodStart,
      options?.periodEnd,
    ],
    queryFn: async () => {
      return api
        .get("api/analytics/revenue", { searchParams: buildParams(options) })
        .json<AnalyticsRevenue>();
    },
  });
}

export function useAnalyticsTrend(options?: UseAnalyticsOptions) {
  return useQuery<TrendDataPoint[]>({
    queryKey: [
      "analytics-trend",
      options?.period,
      options?.periodStart,
      options?.periodEnd,
    ],
    queryFn: async () => {
      return api
        .get("api/analytics/trend", { searchParams: buildParams(options) })
        .json<TrendDataPoint[]>();
    },
  });
}
