import { eq, and, desc, sql, gte } from "drizzle-orm";
import { db } from "../db.js";
import { shops, orders, invoices } from "../../db/schema/index.js";

/**
 * Get a shop by ID, scoped to company.
 * Includes total_orders count and last_order_date from orders table.
 */
export async function getShopById(shopId: string, companyId: string) {
  const [shop] = await db
    .select()
    .from(shops)
    .where(and(eq(shops.id, shopId), eq(shops.company_id, companyId)));

  if (!shop) return null;

  // Get order stats
  const [orderStats] = await db
    .select({
      total_orders: sql<number>`count(*)::int`,
      last_order_date: sql<string | null>`max(${orders.created_at})`,
    })
    .from(orders)
    .where(
      and(eq(orders.shop_id, shopId), eq(orders.company_id, companyId))
    );

  return {
    ...shop,
    total_orders: orderStats?.total_orders ?? 0,
    last_order_date: orderStats?.last_order_date ?? null,
  };
}

/**
 * Update allowed shop fields. Verifies company ownership.
 */
export async function updateShop(
  shopId: string,
  companyId: string,
  data: {
    trade_name?: string;
    phone?: string;
    address?: string;
    lat?: string;
    lng?: string;
    contact_name?: string | null;
  }
) {
  const updateValues: Record<string, unknown> = {};
  if (data.trade_name !== undefined) updateValues.trade_name = data.trade_name;
  if (data.phone !== undefined) updateValues.phone = data.phone;
  if (data.address !== undefined) updateValues.address = data.address;
  if (data.lat !== undefined) updateValues.lat = data.lat;
  if (data.lng !== undefined) updateValues.lng = data.lng;
  if (data.contact_name !== undefined)
    updateValues.contact_name = data.contact_name;

  if (Object.keys(updateValues).length === 0) return null;

  updateValues.updated_at = new Date().toISOString();

  const [updated] = await db
    .update(shops)
    .set(updateValues)
    .where(and(eq(shops.id, shopId), eq(shops.company_id, companyId)))
    .returning();

  return updated || null;
}

/**
 * Toggle shop active status. Verifies company ownership.
 */
export async function toggleShopStatus(
  shopId: string,
  companyId: string,
  active: boolean
) {
  const [updated] = await db
    .update(shops)
    .set({ active, updated_at: new Date().toISOString() })
    .where(and(eq(shops.id, shopId), eq(shops.company_id, companyId)))
    .returning();

  return updated || null;
}

/**
 * Get paginated orders for a shop, scoped to company.
 * Supports filtering by status and period (default: last 30 days).
 */
export async function getShopOrders(
  shopId: string,
  companyId: string,
  options?: {
    limit?: number;
    offset?: number;
    status?: string;
    period?: number; // days, default 30
  }
) {
  const limit = options?.limit ?? 20;
  const offset = options?.offset ?? 0;
  const periodDays = options?.period ?? 30;

  const conditions = [
    eq(orders.shop_id, shopId),
    eq(orders.company_id, companyId),
    gte(
      orders.created_at,
      new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString()
    ),
  ];

  if (options?.status) {
    conditions.push(
      eq(
        orders.status,
        options.status as
          | "pending"
          | "assigned"
          | "picked_up"
          | "in_transit"
          | "delivered"
          | "cancelled"
      )
    );
  }

  const [countResult] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(orders)
    .where(and(...conditions));

  const rows = await db
    .select()
    .from(orders)
    .where(and(...conditions))
    .orderBy(desc(orders.created_at))
    .limit(limit)
    .offset(offset);

  return {
    data: rows,
    total: countResult?.total ?? 0,
    limit,
    offset,
  };
}

/**
 * Get financial summary for a shop from invoices table.
 * Aggregates total_invoiced, total_pending, last_payment_date.
 */
export async function getShopFinancialSummary(
  shopId: string,
  companyId: string
) {
  const [result] = await db
    .select({
      total_invoiced: sql<string>`coalesce(sum(${invoices.total_amount}), 0)`,
      total_pending: sql<string>`coalesce(sum(case when ${invoices.status} != 'paid' then ${invoices.total_amount} else 0 end), 0)`,
      last_payment_date: sql<string | null>`max(${invoices.paid_at})`,
    })
    .from(invoices)
    .where(
      and(eq(invoices.shop_id, shopId), eq(invoices.company_id, companyId))
    );

  return {
    total_invoiced: result?.total_invoiced ?? "0",
    total_pending: result?.total_pending ?? "0",
    last_payment_date: result?.last_payment_date ?? null,
  };
}
