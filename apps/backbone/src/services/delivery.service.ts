import { eq, and, desc } from "drizzle-orm";
import { db } from "../db.js";
import { deliveries, deliveryEvents, orders } from "../../db/schema/index.js";
import { calculateDeliveryPrice } from "./pricing.service.js";

/**
 * List deliveries for a company, optionally filtered by courier_id and/or status.
 */
type DeliveryStatus = "assigned" | "accepted" | "picked_up" | "in_transit" | "delivered" | "failed";

export async function listDeliveries(params: {
  companyId: string;
  courierId?: string;
  status?: string;
}) {
  const conditions = [eq(deliveries.company_id, params.companyId)];

  if (params.courierId) {
    conditions.push(eq(deliveries.courier_id, params.courierId));
  }

  if (params.status) {
    conditions.push(eq(deliveries.status, params.status as DeliveryStatus));
  }

  return db
    .select()
    .from(deliveries)
    .where(and(...conditions))
    .orderBy(desc(deliveries.created_at));
}

/**
 * Valid delivery status transitions.
 * assigned -> accepted -> picked_up -> in_transit -> delivered
 * assigned -> failed (courier rejects)
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  assigned: ["accepted", "failed"],
  accepted: ["picked_up"],
  picked_up: ["in_transit"],
  in_transit: ["delivered"],
};

export function isValidDeliveryTransition(
  currentStatus: string,
  newStatus: string
): boolean {
  return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}

/**
 * Assign a courier to an order — creates a delivery record.
 * Also transitions the order status to "assigned".
 */
export async function assignCourier(params: {
  orderId: string;
  courierId: string;
  companyId: string;
  actorId: string;
}) {
  // Verify order exists, belongs to company, and is pending
  const [order] = await db
    .select()
    .from(orders)
    .where(
      and(eq(orders.id, params.orderId), eq(orders.company_id, params.companyId))
    );

  if (!order) {
    return null;
  }

  if (order.status !== "pending") {
    throw new Error(
      `Order must be in 'pending' status to assign courier, current: ${order.status}`
    );
  }

  const now = new Date().toISOString();

  // Update order status to "assigned"
  await db
    .update(orders)
    .set({ status: "assigned", updated_at: now })
    .where(eq(orders.id, params.orderId));

  // Create delivery record
  const [delivery] = await db
    .insert(deliveries)
    .values({
      order_id: params.orderId,
      courier_id: params.courierId,
      company_id: params.companyId,
      status: "assigned",
    })
    .returning();

  // Register delivery event
  await db.insert(deliveryEvents).values({
    delivery_id: delivery.id,
    event_type: "status_change",
    old_status: null,
    new_status: "assigned",
    description: "Courier assigned to delivery",
    actor_id: params.actorId,
  });

  // Calculate delivery price (OSD207) — before SSE notifications in route handler.
  // Gracefully handles missing pricing table (returns null without throwing).
  await calculateDeliveryPrice({
    deliveryId: delivery.id,
    orderId: params.orderId,
    companyId: params.companyId,
  }).catch(() => {});

  return delivery;
}

/**
 * Accept a delivery — courier confirms they will handle it.
 */
export async function acceptDelivery(
  deliveryId: string,
  companyId: string,
  actorId: string
) {
  const [delivery] = await db
    .select()
    .from(deliveries)
    .where(
      and(eq(deliveries.id, deliveryId), eq(deliveries.company_id, companyId))
    );

  if (!delivery) {
    return null;
  }

  if (!isValidDeliveryTransition(delivery.status, "accepted")) {
    throw new Error(
      `Invalid delivery status transition: ${delivery.status} -> accepted`
    );
  }

  const now = new Date().toISOString();

  const [updated] = await db
    .update(deliveries)
    .set({ status: "accepted", accepted_at: now, updated_at: now })
    .where(eq(deliveries.id, deliveryId))
    .returning();

  // Register delivery event
  await db.insert(deliveryEvents).values({
    delivery_id: deliveryId,
    event_type: "status_change",
    old_status: delivery.status,
    new_status: "accepted",
    description: "Courier accepted the delivery",
    actor_id: actorId,
  });


  return updated;
}

/**
 * Reject a delivery — courier declines, order goes back to pending for reassignment.
 */
export async function rejectDelivery(
  deliveryId: string,
  companyId: string,
  actorId: string,
  reason?: string
) {
  const [delivery] = await db
    .select()
    .from(deliveries)
    .where(
      and(eq(deliveries.id, deliveryId), eq(deliveries.company_id, companyId))
    );

  if (!delivery) {
    return null;
  }

  if (delivery.status !== "assigned") {
    throw new Error(
      `Can only reject a delivery in 'assigned' status, current: ${delivery.status}`
    );
  }

  const now = new Date().toISOString();

  // Update delivery status to "failed"
  const [updated] = await db
    .update(deliveries)
    .set({ status: "failed", updated_at: now })
    .where(eq(deliveries.id, deliveryId))
    .returning();

  // Revert order back to "pending" for reassignment
  await db
    .update(orders)
    .set({ status: "pending", updated_at: now })
    .where(eq(orders.id, delivery.order_id));

  // Register delivery event
  await db.insert(deliveryEvents).values({
    delivery_id: deliveryId,
    event_type: "status_change",
    old_status: "assigned",
    new_status: "failed",
    description: reason
      ? `Courier rejected delivery: ${reason}`
      : "Courier rejected delivery",
    actor_id: actorId,
  });


  return updated;
}

/**
 * Update delivery status with state machine validation.
 * Handles timestamp setting and duration calculation.
 */
export async function updateDeliveryStatus(
  deliveryId: string,
  companyId: string,
  newStatus: string,
  actorId: string
) {
  const [delivery] = await db
    .select()
    .from(deliveries)
    .where(
      and(eq(deliveries.id, deliveryId), eq(deliveries.company_id, companyId))
    );

  if (!delivery) {
    return null;
  }

  if (!isValidDeliveryTransition(delivery.status, newStatus)) {
    throw new Error(
      `Invalid delivery status transition: ${delivery.status} -> ${newStatus}`
    );
  }

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = {
    status: newStatus,
    updated_at: now,
  };

  // Set timestamp fields based on status
  if (newStatus === "accepted") {
    updates.accepted_at = now;
  } else if (newStatus === "picked_up") {
    updates.picked_up_at = now;
  } else if (newStatus === "delivered") {
    updates.delivered_at = now;

    // Calculate actual duration (picked_up_at → delivered_at)
    if (delivery.picked_up_at) {
      const pickedUpTime = new Date(delivery.picked_up_at).getTime();
      const deliveredTime = new Date(now).getTime();
      const durationMin = Math.round(
        (deliveredTime - pickedUpTime) / (1000 * 60)
      );
      updates.actual_duration_min = durationMin;
    }
  }

  const [updated] = await db
    .update(deliveries)
    .set(updates)
    .where(eq(deliveries.id, deliveryId))
    .returning();

  // Register delivery event
  await db.insert(deliveryEvents).values({
    delivery_id: deliveryId,
    event_type: "status_change",
    old_status: delivery.status,
    new_status: newStatus,
    description: `Delivery status changed from ${delivery.status} to ${newStatus}`,
    actor_id: actorId,
  });

  // Also update order status for picked_up, in_transit, delivered
  if (["picked_up", "in_transit", "delivered"].includes(newStatus)) {
    await db
      .update(orders)
      .set({ status: newStatus as "picked_up" | "in_transit" | "delivered", updated_at: now })
      .where(eq(orders.id, delivery.order_id));
  }


  return updated;
}

/**
 * Get a delivery by ID, scoped to company.
 */
export async function getDeliveryById(
  deliveryId: string,
  companyId: string
) {
  const [delivery] = await db
    .select()
    .from(deliveries)
    .where(
      and(eq(deliveries.id, deliveryId), eq(deliveries.company_id, companyId))
    );

  return delivery || null;
}

/**
 * Get a delivery by order ID, scoped to company.
 */
export async function getDeliveryByOrderId(
  orderId: string,
  companyId: string
) {
  const [delivery] = await db
    .select()
    .from(deliveries)
    .where(
      and(
        eq(deliveries.order_id, orderId),
        eq(deliveries.company_id, companyId)
      )
    );

  return delivery || null;
}

/**
 * Get delivery events (timeline) for a delivery.
 */
export async function getDeliveryEvents(deliveryId: string) {
  return db
    .select()
    .from(deliveryEvents)
    .where(eq(deliveryEvents.delivery_id, deliveryId))
    .orderBy(deliveryEvents.created_at);
}
