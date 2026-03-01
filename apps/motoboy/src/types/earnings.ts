export interface EarningItem {
  delivery_id: string;
  delivered_at: string;
  shop_name: string | null;
  distance_km: string | null;
  value: string;
  closing_status: string | null;
}

export interface EarningsSummaryPeriod {
  total_amount: string;
  total_deliveries: number;
}

export interface EarningsSummary {
  today: EarningsSummaryPeriod;
  week: EarningsSummaryPeriod;
  month: EarningsSummaryPeriod;
}

export type PeriodFilter = "week" | "month";
