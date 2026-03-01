import { eq, and, gte, lte, sql, count, sum, avg } from "drizzle-orm";
import { db } from "../db.js";
import {
  deliveries,
  deliveryPrices,
  orders,
  couriers,
} from "../../db/schema/index.js";

export async function getOverview(params: {
  companyId: string;
  periodStart: string;
  periodEnd: string;
}) {
  const { companyId, periodStart, periodEnd } = params;

  // Count total deliveries, completed (delivered), and failed
  const [stats] = await db
    .select({
      total: count(deliveries.id),
      completed: sum(
        sql<number>`CASE WHEN ${deliveries.status} = 'delivered' THEN 1 ELSE 0 END`
      ),
      cancelled: sum(
        sql<number>`CASE WHEN ${deliveries.status} = 'failed' THEN 1 ELSE 0 END`
      ),
    })
    .from(deliveries)
    .where(
      and(
        eq(deliveries.company_id, companyId),
        gte(deliveries.created_at, periodStart),
        lte(deliveries.created_at, periodEnd)
      )
    );

  const total = stats?.total ?? 0;
  const completed = Number(stats?.completed ?? 0);
  const cancelled = Number(stats?.cancelled ?? 0);
  const completionRate = total > 0 ? (completed / total) * 100 : 0;

  // Average delivery time (picked_up_at -> delivered_at) in minutes for delivered deliveries
  const [timeStats] = await db
    .select({
      avg_delivery_time_minutes: avg(
        sql<number>`EXTRACT(EPOCH FROM (${deliveries.delivered_at}::timestamptz - ${deliveries.picked_up_at}::timestamptz)) / 60`
      ),
    })
    .from(deliveries)
    .where(
      and(
        eq(deliveries.company_id, companyId),
        eq(deliveries.status, "delivered"),
        sql`${deliveries.picked_up_at} IS NOT NULL`,
        sql`${deliveries.delivered_at} IS NOT NULL`,
        gte(deliveries.created_at, periodStart),
        lte(deliveries.created_at, periodEnd)
      )
    );

  return {
    total_deliveries: total,
    completed,
    cancelled,
    completion_rate: Math.round(completionRate * 100) / 100,
    avg_delivery_time_minutes: timeStats?.avg_delivery_time_minutes
      ? Math.round(Number(timeStats.avg_delivery_time_minutes) * 100) / 100
      : 0,
  };
}

export async function getCourierPerformance(params: {
  companyId: string;
  periodStart: string;
  periodEnd: string;
}) {
  const { companyId, periodStart, periodEnd } = params;

  const results = await db
    .select({
      courier_id: deliveries.courier_id,
      courier_name: couriers.full_name,
      total_deliveries: count(deliveries.id),
      avg_delivery_time_minutes: avg(
        sql<number>`CASE WHEN ${deliveries.status} = 'delivered' AND ${deliveries.picked_up_at} IS NOT NULL AND ${deliveries.delivered_at} IS NOT NULL THEN EXTRACT(EPOCH FROM (${deliveries.delivered_at}::timestamptz - ${deliveries.picked_up_at}::timestamptz)) / 60 END`
      ),
      avg_distance_km: avg(
        sql<number>`CASE WHEN ${deliveries.status} = 'delivered' THEN COALESCE(${deliveryPrices.actual_distance_km}::numeric, ${deliveryPrices.estimated_distance_km}::numeric) END`
      ),
    })
    .from(deliveries)
    .innerJoin(couriers, eq(couriers.id, deliveries.courier_id))
    .leftJoin(deliveryPrices, eq(deliveryPrices.delivery_id, deliveries.id))
    .where(
      and(
        eq(deliveries.company_id, companyId),
        eq(deliveries.status, "delivered"),
        gte(deliveries.created_at, periodStart),
        lte(deliveries.created_at, periodEnd)
      )
    )
    .groupBy(deliveries.courier_id, couriers.full_name)
    .orderBy(sql`count(${deliveries.id}) DESC`);

  return results.map((r) => ({
    courier_id: r.courier_id,
    courier_name: r.courier_name,
    total_deliveries: r.total_deliveries,
    avg_delivery_time_minutes: r.avg_delivery_time_minutes
      ? Math.round(Number(r.avg_delivery_time_minutes) * 100) / 100
      : 0,
    avg_distance_km: r.avg_distance_km
      ? Math.round(Number(r.avg_distance_km) * 100) / 100
      : 0,
  }));
}

export async function getNeighborhoodVolume(params: {
  companyId: string;
  periodStart: string;
  periodEnd: string;
}) {
  const { companyId, periodStart, periodEnd } = params;

  // Extract neighborhood from delivery_address (3rd comma-separated part in Brazilian address format)
  const results = await db
    .select({
      neighborhood: sql<string>`TRIM(split_part(${orders.delivery_address}, ',', 3))`,
      total_deliveries: count(deliveries.id),
    })
    .from(deliveries)
    .innerJoin(orders, eq(orders.id, deliveries.order_id))
    .where(
      and(
        eq(deliveries.company_id, companyId),
        eq(deliveries.status, "delivered"),
        gte(deliveries.created_at, periodStart),
        lte(deliveries.created_at, periodEnd)
      )
    )
    .groupBy(sql`TRIM(split_part(${orders.delivery_address}, ',', 3))`)
    .orderBy(sql`count(${deliveries.id}) DESC`);

  return results.map((r) => ({
    neighborhood: r.neighborhood || "Desconhecido",
    total_deliveries: r.total_deliveries,
  }));
}

export async function getRevenue(params: {
  companyId: string;
  periodStart: string;
  periodEnd: string;
}) {
  const { companyId, periodStart, periodEnd } = params;

  const [result] = await db
    .select({
      total_revenue: sum(deliveryPrices.total_price),
      total_deliveries: count(deliveries.id),
    })
    .from(deliveries)
    .innerJoin(deliveryPrices, eq(deliveryPrices.delivery_id, deliveries.id))
    .where(
      and(
        eq(deliveries.company_id, companyId),
        eq(deliveries.status, "delivered"),
        gte(deliveries.created_at, periodStart),
        lte(deliveries.created_at, periodEnd)
      )
    );

  const totalRevenue = Number(result?.total_revenue ?? 0);
  const totalDeliveries = result?.total_deliveries ?? 0;
  const avgPerDelivery =
    totalDeliveries > 0 ? totalRevenue / totalDeliveries : 0;

  return {
    total_revenue: totalRevenue.toFixed(2),
    avg_per_delivery: (Math.round(avgPerDelivery * 100) / 100).toFixed(2),
    total_deliveries: totalDeliveries,
  };
}

export async function getTrend(params: {
  companyId: string;
  periodStart: string;
  periodEnd: string;
}) {
  const { companyId, periodStart, periodEnd } = params;

  const results = await db
    .select({
      date: sql<string>`DATE(${deliveries.created_at})::text`,
      total_deliveries: count(deliveries.id),
    })
    .from(deliveries)
    .where(
      and(
        eq(deliveries.company_id, companyId),
        gte(deliveries.created_at, periodStart),
        lte(deliveries.created_at, periodEnd)
      )
    )
    .groupBy(sql`DATE(${deliveries.created_at})`)
    .orderBy(sql`DATE(${deliveries.created_at}) ASC`);

  return results.map((r) => ({
    date: r.date,
    total_deliveries: r.total_deliveries,
  }));
}
