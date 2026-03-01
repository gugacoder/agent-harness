import { eq, and, desc } from "drizzle-orm";
import { db } from "../db.js";
import { couriers, courierLocations, deliveries } from "../../db/schema/index.js";

/**
 * List couriers for a company, optionally filtered by status or active flag.
 */
export async function listCouriers(params: {
  companyId: string;
  status?: string;
  active?: boolean;
}) {
  const conditions = [eq(couriers.company_id, params.companyId)];

  if (params.status) {
    conditions.push(
      eq(couriers.status, params.status as "available" | "busy" | "offline")
    );
  }

  if (params.active !== undefined) {
    conditions.push(eq(couriers.active, params.active));
  }

  return db
    .select()
    .from(couriers)
    .where(and(...conditions))
    .orderBy(desc(couriers.created_at));
}

/**
 * Get a single courier by ID, scoped to company.
 */
export async function getCourierById(courierId: string, companyId: string) {
  const [courier] = await db
    .select()
    .from(couriers)
    .where(
      and(eq(couriers.id, courierId), eq(couriers.company_id, companyId))
    );

  return courier || null;
}

/**
 * Create a new courier under a company.
 */
export async function createCourier(params: {
  companyId: string;
  profileId: string;
  fullName: string;
  phone: string;
  photoUrl?: string | null;
}) {
  const [created] = await db
    .insert(couriers)
    .values({
      company_id: params.companyId,
      profile_id: params.profileId,
      full_name: params.fullName,
      phone: params.phone,
      photo_url: params.photoUrl || null,
      status: "offline",
    })
    .returning();

  return created;
}

/**
 * Update courier status.
 * Manual: available <-> offline
 * Automatic: busy (set when courier has an active delivery)
 */
export async function updateCourierStatus(
  courierId: string,
  companyId: string,
  newStatus: string
) {
  const courier = await getCourierById(courierId, companyId);

  if (!courier) {
    return null;
  }

  if (!["available", "busy", "offline"].includes(newStatus)) {
    throw new Error(
      `Invalid courier status: ${newStatus}. Must be available, busy, or offline.`
    );
  }

  const now = new Date().toISOString();

  const [updated] = await db
    .update(couriers)
    .set({
      status: newStatus as "available" | "busy" | "offline",
      updated_at: now,
    })
    .where(
      and(eq(couriers.id, courierId), eq(couriers.company_id, companyId))
    )
    .returning();


  return updated;
}

/**
 * Toggle courier active/inactive status (operator action).
 */
export async function updateCourierActive(
  courierId: string,
  companyId: string,
  active: boolean
) {
  const courier = await getCourierById(courierId, companyId);

  if (!courier) {
    return null;
  }

  const now = new Date().toISOString();

  const [updated] = await db
    .update(couriers)
    .set({ active, updated_at: now })
    .where(
      and(eq(couriers.id, courierId), eq(couriers.company_id, companyId))
    )
    .returning();

  return updated;
}

/**
 * Record courier location.
 * Inserts into courier_locations table.
 * If courier has an active delivery, links to it via delivery_id.
 */
export async function recordLocation(params: {
  courierId: string;
  companyId: string;
  lat: string;
  lng: string;
  accuracy: string;
  deliveryId?: string | null;
}) {
  // Verify courier exists and belongs to company
  const courier = await getCourierById(params.courierId, params.companyId);
  if (!courier) {
    return null;
  }

  // If no delivery_id provided, try to find an active delivery for this courier
  let deliveryId = params.deliveryId || null;
  if (!deliveryId) {
    const [activeDelivery] = await db
      .select()
      .from(deliveries)
      .where(
        and(
          eq(deliveries.courier_id, params.courierId),
          eq(deliveries.company_id, params.companyId)
        )
      )
      .orderBy(desc(deliveries.created_at))
      .limit(1);

    if (
      activeDelivery &&
      ["assigned", "accepted", "picked_up", "in_transit"].includes(
        activeDelivery.status
      )
    ) {
      deliveryId = activeDelivery.id;
    }
  }

  const now = new Date().toISOString();

  const [location] = await db
    .insert(courierLocations)
    .values({
      courier_id: params.courierId,
      company_id: params.companyId,
      delivery_id: deliveryId,
      lat: params.lat,
      lng: params.lng,
      accuracy: params.accuracy,
      recorded_at: now,
    })
    .returning();


  return location;
}
