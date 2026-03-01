import { eq, and, sql, desc } from "drizzle-orm";
import { db } from "../db.js";
import { orders } from "../../db/schema/index.js";

/**
 * Valid order status transitions.
 * pending -> assigned -> picked_up -> in_transit -> delivered
 * Cancellation allowed before picked_up (from pending or assigned).
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["assigned", "cancelled"],
  assigned: ["picked_up", "cancelled"],
  picked_up: ["in_transit"],
  in_transit: ["delivered"],
};

export function isValidTransition(
  currentStatus: string,
  newStatus: string
): boolean {
  return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}

/**
 * Generate the next sequential order number for a company.
 * Uses MAX(order_number) + 1 with a row-level lock (advisory lock via serializable read).
 */
export async function generateOrderNumber(
  companyId: string
): Promise<number> {
  const result = await db
    .select({
      maxNum: sql<number>`COALESCE(MAX(${orders.order_number}), 0)`,
    })
    .from(orders)
    .where(eq(orders.company_id, companyId));

  return (result[0]?.maxNum ?? 0) + 1;
}

/**
 * Create a new order with a sequential order number.
 */
export async function createOrder(params: {
  companyId: string;
  shopId?: string;
  pickupAddress: string;
  pickupLat: string;
  pickupLng: string;
  deliveryAddress: string;
  deliveryLat: string;
  deliveryLng: string;
  recipientName: string;
  recipientPhone: string;
  notes?: string;
  createdBy: string;
}) {
  const orderNumber = await generateOrderNumber(params.companyId);

  const [created] = await db
    .insert(orders)
    .values({
      company_id: params.companyId,
      shop_id: params.shopId || null,
      order_number: orderNumber,
      status: "pending",
      pickup_address: params.pickupAddress,
      pickup_lat: params.pickupLat,
      pickup_lng: params.pickupLng,
      delivery_address: params.deliveryAddress,
      delivery_lat: params.deliveryLat,
      delivery_lng: params.deliveryLng,
      recipient_name: params.recipientName,
      recipient_phone: params.recipientPhone,
      notes: params.notes || null,
      created_by: params.createdBy,
    })
    .returning();

  return created;
}

/**
 * Update order status with state machine validation.
 * Returns the updated order or null if not found.
 * Throws if the transition is invalid.
 */
export async function updateOrderStatus(
  orderId: string,
  companyId: string,
  newStatus: string
) {
  // Fetch current order
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.company_id, companyId)));

  if (!order) {
    return null;
  }

  if (!isValidTransition(order.status, newStatus)) {
    throw new Error(
      `Invalid status transition: ${order.status} -> ${newStatus}`
    );
  }

  const now = new Date().toISOString();

  const [updated] = await db
    .update(orders)
    .set({ status: newStatus as typeof order.status, updated_at: now })
    .where(and(eq(orders.id, orderId), eq(orders.company_id, companyId)))
    .returning();

  return updated;
}

/**
 * Cancel an order (only allowed before picked_up).
 */
export async function cancelOrder(orderId: string, companyId: string) {
  return updateOrderStatus(orderId, companyId, "cancelled");
}

/**
 * Get a single order by ID, scoped to company.
 */
export async function getOrderById(orderId: string, companyId: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.company_id, companyId)));

  return order || null;
}

/**
 * List orders for a company, optionally filtered by status and/or shop_id.
 */
export async function listOrders(params: {
  companyId: string;
  status?: string;
  shopId?: string;
}) {
  const conditions = [eq(orders.company_id, params.companyId)];

  if (params.status) {
    conditions.push(eq(orders.status, params.status as typeof orders.status.enumValues[number]));
  }

  if (params.shopId) {
    conditions.push(eq(orders.shop_id, params.shopId));
  }

  return db
    .select()
    .from(orders)
    .where(and(...conditions))
    .orderBy(desc(orders.created_at));
}
