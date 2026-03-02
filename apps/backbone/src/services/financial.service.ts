import { eq, and, gte, lte, sql, isNull } from "drizzle-orm";
import { db } from "../db.js";
import {
  deliveries,
  deliveryPrices,
  financialClosings,
  financialClosingItems,
  couriers,
} from "../../db/schema/index.js";
import { sseManager } from "../sse/manager.js";
import { companyChannel, courierChannel } from "../sse/channels.js";
import {
  ClosingCreatedEventSchema,
  ClosingPaidEventSchema,
} from "@chegala/schemas";

/**
 * Valid closing status transitions.
 * draft -> confirmed -> paid
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["confirmed"],
  confirmed: ["paid"],
};

export function isValidClosingTransition(
  currentStatus: string,
  newStatus: string
): boolean {
  return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}

/**
 * Generate a financial closing for a courier in a period.
 * Finds delivered deliveries not linked to any existing closing,
 * calculates totals from delivery_prices, creates closing + items.
 */
export async function generateClosing(params: {
  courierId: string;
  companyId: string;
  periodStart: string;
  periodEnd: string;
}) {
  const { courierId, companyId, periodStart, periodEnd } = params;

  // Fetch the courier (need name for SSE event)
  const [courier] = await db
    .select()
    .from(couriers)
    .where(
      and(eq(couriers.id, courierId), eq(couriers.company_id, companyId))
    );

  if (!courier) {
    return null;
  }

  // Find delivered deliveries for this courier in the period
  // that are NOT already linked to a financial_closing_item
  const eligibleDeliveries = await db
    .select({
      delivery_id: deliveries.id,
      delivered_at: deliveries.delivered_at,
      total_price: deliveryPrices.total_price,
      actual_distance_km: deliveryPrices.actual_distance_km,
      estimated_distance_km: deliveryPrices.estimated_distance_km,
    })
    .from(deliveries)
    .innerJoin(deliveryPrices, eq(deliveryPrices.delivery_id, deliveries.id))
    .leftJoin(
      financialClosingItems,
      eq(financialClosingItems.delivery_id, deliveries.id)
    )
    .where(
      and(
        eq(deliveries.courier_id, courierId),
        eq(deliveries.company_id, companyId),
        eq(deliveries.status, "delivered"),
        gte(deliveries.delivered_at, periodStart),
        lte(deliveries.delivered_at, periodEnd),
        isNull(financialClosingItems.id)
      )
    );

  if (eligibleDeliveries.length === 0) {
    throw new Error(
      "No eligible deliveries found for this courier in the specified period"
    );
  }

  // Calculate totals
  let totalDistanceKm = 0;
  let totalAmount = 0;

  const items = eligibleDeliveries.map((d) => {
    const price = parseFloat(d.total_price);
    const distance = parseFloat(
      d.actual_distance_km ?? d.estimated_distance_km
    );
    totalDistanceKm += distance;
    totalAmount += price;
    return {
      delivery_id: d.delivery_id,
      delivery_price: d.total_price,
      distance_km: (d.actual_distance_km ?? d.estimated_distance_km).toString(),
      delivered_at: d.delivered_at!,
    };
  });

  const now = new Date().toISOString();

  // Create the closing record
  const [closing] = await db
    .insert(financialClosings)
    .values({
      company_id: companyId,
      courier_id: courierId,
      period_start: periodStart,
      period_end: periodEnd,
      total_deliveries: eligibleDeliveries.length,
      total_distance_km: totalDistanceKm.toFixed(2),
      total_amount: totalAmount.toFixed(2),
      status: "draft",
      created_at: now,
      updated_at: now,
    })
    .returning();

  // Create closing items
  const closingItems = await db
    .insert(financialClosingItems)
    .values(
      items.map((item) => ({
        closing_id: closing.id,
        delivery_id: item.delivery_id,
        delivery_price: item.delivery_price,
        distance_km: item.distance_km,
        delivered_at: item.delivered_at,
      }))
    )
    .returning();

  // Emit SSE closing_created on company channel (validated against Zod schema)
  const closingCreatedPayload = ClosingCreatedEventSchema.parse({
    type: "closing_created",
    closingId: closing.id,
    courierId: courierId,
    courierName: courier.full_name,
    totalAmount: closing.total_amount,
    periodStart: new Date(closing.period_start).toISOString(),
    periodEnd: new Date(closing.period_end).toISOString(),
  });
  sseManager
    .broadcast(companyChannel(companyId), closingCreatedPayload)
    .catch(() => {});

  return { ...closing, items: closingItems };
}

/**
 * Confirm a financial closing (draft -> confirmed).
 */
export async function confirmClosing(params: {
  closingId: string;
  companyId: string;
}) {
  const { closingId, companyId } = params;

  const [closing] = await db
    .select()
    .from(financialClosings)
    .where(
      and(
        eq(financialClosings.id, closingId),
        eq(financialClosings.company_id, companyId)
      )
    );

  if (!closing) {
    return null;
  }

  if (!isValidClosingTransition(closing.status, "confirmed")) {
    throw new Error(
      `Cannot confirm closing: current status is '${closing.status}', must be 'draft'`
    );
  }

  const now = new Date().toISOString();

  const [updated] = await db
    .update(financialClosings)
    .set({
      status: "confirmed",
      confirmed_at: now,
      updated_at: now,
    })
    .where(eq(financialClosings.id, closingId))
    .returning();

  return updated;
}

/**
 * Pay a financial closing (confirmed -> paid).
 * Emits SSE closing_paid on company and courier channels.
 */
export async function payClosing(params: {
  closingId: string;
  companyId: string;
}) {
  const { closingId, companyId } = params;

  const [closing] = await db
    .select()
    .from(financialClosings)
    .where(
      and(
        eq(financialClosings.id, closingId),
        eq(financialClosings.company_id, companyId)
      )
    );

  if (!closing) {
    return null;
  }

  if (!isValidClosingTransition(closing.status, "paid")) {
    throw new Error(
      `Cannot pay closing: current status is '${closing.status}', must be 'confirmed'`
    );
  }

  const now = new Date().toISOString();

  const [updated] = await db
    .update(financialClosings)
    .set({
      status: "paid",
      paid_at: now,
      updated_at: now,
    })
    .where(eq(financialClosings.id, closingId))
    .returning();

  // Get courier name for SSE event
  const [courier] = await db
    .select({ full_name: couriers.full_name })
    .from(couriers)
    .where(eq(couriers.id, closing.courier_id));

  const courierName = courier?.full_name ?? "Unknown";

  // Emit SSE closing_paid on company and courier channels (validated against Zod schema)
  const closingPaidPayload = ClosingPaidEventSchema.parse({
    type: "closing_paid",
    closingId: closing.id,
    courierId: closing.courier_id,
    courierName,
    totalAmount: closing.total_amount,
  });
  sseManager
    .broadcast(companyChannel(companyId), closingPaidPayload)
    .catch(() => {});
  sseManager
    .broadcast(courierChannel(closing.courier_id), closingPaidPayload)
    .catch(() => {});

  return updated;
}

/**
 * List financial closings with optional filters.
 */
export async function listClosings(params: {
  companyId: string;
  courierId?: string;
  status?: string;
  periodStart?: string;
  periodEnd?: string;
}) {
  const { companyId, courierId, status, periodStart, periodEnd } = params;

  const conditions = [eq(financialClosings.company_id, companyId)];

  if (courierId) {
    conditions.push(eq(financialClosings.courier_id, courierId));
  }
  if (status) {
    conditions.push(
      eq(financialClosings.status, status as "draft" | "confirmed" | "paid")
    );
  }
  if (periodStart) {
    conditions.push(gte(financialClosings.period_start, periodStart));
  }
  if (periodEnd) {
    conditions.push(lte(financialClosings.period_end, periodEnd));
  }

  return db
    .select()
    .from(financialClosings)
    .where(and(...conditions))
    .orderBy(financialClosings.created_at);
}

/**
 * Get a financial closing by ID with its items.
 */
export async function getClosingById(params: {
  closingId: string;
  companyId: string;
}) {
  const { closingId, companyId } = params;

  const [closing] = await db
    .select()
    .from(financialClosings)
    .where(
      and(
        eq(financialClosings.id, closingId),
        eq(financialClosings.company_id, companyId)
      )
    );

  if (!closing) {
    return null;
  }

  const items = await db
    .select()
    .from(financialClosingItems)
    .where(eq(financialClosingItems.closing_id, closingId));

  return { ...closing, items };
}
