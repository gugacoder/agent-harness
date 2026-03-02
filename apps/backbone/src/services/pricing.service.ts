import { eq, and, asc } from "drizzle-orm";
import { db } from "../db.js";
import {
  pricingTables,
  pricingRules,
  shopPricingOverrides,
  deliveryPrices,
  orders,
  deliveries,
} from "../../db/schema/index.js";
import { calculateHaversineDistance } from "./distance.service.js";
import { sseManager } from "../sse/manager.js";
import { companyChannel } from "../sse/channels.js";

type PricingRule = typeof pricingRules.$inferSelect;

/**
 * Resolve the pricing table for a delivery.
 * 1. Check shop override first (OSD208)
 * 2. Fall back to company's active pricing table
 */
async function resolvePricingTable(shopId: string | null, companyId: string) {
  if (shopId) {
    const [override] = await db
      .select()
      .from(shopPricingOverrides)
      .where(eq(shopPricingOverrides.shop_id, shopId));

    if (override) {
      const [table] = await db
        .select()
        .from(pricingTables)
        .where(eq(pricingTables.id, override.pricing_table_id));
      return table || null;
    }
  }

  const [table] = await db
    .select()
    .from(pricingTables)
    .where(
      and(
        eq(pricingTables.company_id, companyId),
        eq(pricingTables.active, true)
      )
    );

  return table || null;
}

/**
 * Check if a surcharge condition is currently active.
 * - night: 22:00–06:00
 * - weekend: Saturday or Sunday
 * - rain: requires external trigger (not auto-applied)
 */
function isSurchargeActive(
  surchargeType: string,
  activeSurcharges?: string[]
): boolean {
  if (activeSurcharges) {
    return activeSurcharges.includes(surchargeType);
  }

  const now = new Date();
  switch (surchargeType) {
    case "night": {
      const hour = now.getHours();
      return hour >= 22 || hour < 6;
    }
    case "weekend": {
      const day = now.getDay();
      return day === 0 || day === 6;
    }
    case "rain":
      return false;
    default:
      return false;
  }
}

/**
 * Evaluate pricing rules and calculate the delivery price.
 * Rules are evaluated by priority (ascending). First matching base rule wins.
 * All active surcharges are accumulated.
 */
export function evaluateRules(
  rules: PricingRule[],
  distanceKm: number,
  deliveryAddress: string,
  activeSurcharges?: string[]
): {
  basePrice: number;
  surchargeAmount: number;
  totalPrice: number;
  appliedRuleId: string;
} | null {
  const baseRules = rules.filter((r) => r.rule_type !== "surcharge");
  const surchargeRules = rules.filter((r) => r.rule_type === "surcharge");

  let basePrice: number | null = null;
  let appliedRuleId: string | null = null;

  for (const rule of baseRules) {
    switch (rule.rule_type) {
      case "per_km": {
        basePrice =
          parseFloat(rule.base_value) +
          distanceKm * parseFloat(rule.per_km_value || "0");
        appliedRuleId = rule.id;
        break;
      }
      case "distance_range": {
        const min = parseFloat(rule.min_distance_km || "0");
        const max = parseFloat(rule.max_distance_km || "999999");
        if (distanceKm >= min && distanceKm <= max) {
          basePrice = parseFloat(rule.base_value);
          appliedRuleId = rule.id;
        }
        break;
      }
      case "neighborhood": {
        if (
          rule.neighborhood &&
          deliveryAddress
            .toLowerCase()
            .includes(rule.neighborhood.toLowerCase())
        ) {
          basePrice = parseFloat(rule.base_value);
          appliedRuleId = rule.id;
        }
        break;
      }
      case "flat_rate": {
        basePrice = parseFloat(rule.base_value);
        appliedRuleId = rule.id;
        break;
      }
    }

    if (basePrice !== null) break;
  }

  if (basePrice === null || !appliedRuleId) return null;

  let surchargeAmount = 0;
  for (const rule of surchargeRules) {
    if (
      rule.surcharge_type &&
      isSurchargeActive(rule.surcharge_type, activeSurcharges)
    ) {
      const surchargeValue = parseFloat(rule.surcharge_value || "0");
      if (rule.surcharge_mode === "percentage") {
        surchargeAmount += basePrice * (surchargeValue / 100);
      } else if (rule.surcharge_mode === "fixed") {
        surchargeAmount += surchargeValue;
      }
    }
  }

  const totalPrice = basePrice + surchargeAmount;

  return {
    basePrice: Math.round(basePrice * 100) / 100,
    surchargeAmount: Math.round(surchargeAmount * 100) / 100,
    totalPrice: Math.round(totalPrice * 100) / 100,
    appliedRuleId,
  };
}

/**
 * Calculate delivery price when a courier is assigned (OSD207).
 * Resolves pricing table, evaluates rules, persists to delivery_prices,
 * and emits SSE delivery_priced event.
 */
export async function calculateDeliveryPrice(params: {
  deliveryId: string;
  orderId: string;
  companyId: string;
  activeSurcharges?: string[];
}) {
  const [order] = await db
    .select()
    .from(orders)
    .where(
      and(eq(orders.id, params.orderId), eq(orders.company_id, params.companyId))
    );

  if (!order) return null;

  const table = await resolvePricingTable(order.shop_id, params.companyId);
  if (!table) return null;

  const rules = await db
    .select()
    .from(pricingRules)
    .where(eq(pricingRules.pricing_table_id, table.id))
    .orderBy(asc(pricingRules.priority));

  if (rules.length === 0) return null;

  const distanceKm = calculateHaversineDistance(
    parseFloat(order.pickup_lat),
    parseFloat(order.pickup_lng),
    parseFloat(order.delivery_lat),
    parseFloat(order.delivery_lng)
  );

  const result = evaluateRules(
    rules,
    distanceKm,
    order.delivery_address,
    params.activeSurcharges
  );
  if (!result) return null;

  const now = new Date().toISOString();

  const [deliveryPrice] = await db
    .insert(deliveryPrices)
    .values({
      delivery_id: params.deliveryId,
      company_id: params.companyId,
      pricing_table_id: table.id,
      pricing_rule_id: result.appliedRuleId,
      estimated_distance_km: distanceKm.toFixed(2),
      base_price: result.basePrice.toFixed(2),
      surcharge_amount: result.surchargeAmount.toFixed(2),
      total_price: result.totalPrice.toFixed(2),
      calculated_at: now,
    })
    .returning();

  sseManager
    .broadcast(companyChannel(params.companyId), {
      type: "delivery_priced",
      deliveryId: params.deliveryId,
      orderId: params.orderId,
      totalPrice: result.totalPrice.toFixed(2),
    })
    .catch(() => {});

  return deliveryPrice;
}

/**
 * Recalculate delivery price when actual distance diverges from estimated (OSD210).
 * Uses the same pricing table and rules from the original calculation.
 */
export async function recalculateDeliveryPrice(params: {
  deliveryId: string;
  companyId: string;
  actualDistanceKm: number;
  activeSurcharges?: string[];
}) {
  const [existing] = await db
    .select()
    .from(deliveryPrices)
    .where(
      and(
        eq(deliveryPrices.delivery_id, params.deliveryId),
        eq(deliveryPrices.company_id, params.companyId)
      )
    );

  if (!existing) return null;

  const [delivery] = await db
    .select()
    .from(deliveries)
    .where(eq(deliveries.id, params.deliveryId));

  if (!delivery) return null;

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, delivery.order_id));

  if (!order) return null;

  const rules = await db
    .select()
    .from(pricingRules)
    .where(eq(pricingRules.pricing_table_id, existing.pricing_table_id))
    .orderBy(asc(pricingRules.priority));

  const result = evaluateRules(
    rules,
    params.actualDistanceKm,
    order.delivery_address,
    params.activeSurcharges
  );
  if (!result) return null;

  const now = new Date().toISOString();

  const [updated] = await db
    .update(deliveryPrices)
    .set({
      actual_distance_km: params.actualDistanceKm.toFixed(2),
      base_price: result.basePrice.toFixed(2),
      surcharge_amount: result.surchargeAmount.toFixed(2),
      total_price: result.totalPrice.toFixed(2),
      pricing_rule_id: result.appliedRuleId,
      recalculated_at: now,
    })
    .where(eq(deliveryPrices.id, existing.id))
    .returning();

  sseManager
    .broadcast(companyChannel(params.companyId), {
      type: "delivery_priced",
      deliveryId: params.deliveryId,
      orderId: delivery.order_id,
      totalPrice: result.totalPrice.toFixed(2),
    })
    .catch(() => {});

  return updated;
}
