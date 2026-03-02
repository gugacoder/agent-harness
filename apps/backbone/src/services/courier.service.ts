import { eq, and, desc, sql, gte } from "drizzle-orm";
import { db } from "../db.js";
import { couriers, courierLocations, deliveries, orders } from "../../db/schema/index.js";

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
 * Includes the most recent location from courier_locations.
 */
export async function getCourierById(courierId: string, companyId: string) {
  const [courier] = await db
    .select()
    .from(couriers)
    .where(
      and(eq(couriers.id, courierId), eq(couriers.company_id, companyId))
    );

  if (!courier) return null;

  // Get the most recent location
  const [lastLocation] = await db
    .select({
      lat: courierLocations.lat,
      lng: courierLocations.lng,
      accuracy: courierLocations.accuracy,
      recorded_at: courierLocations.recorded_at,
    })
    .from(courierLocations)
    .where(eq(courierLocations.courier_id, courierId))
    .orderBy(desc(courierLocations.recorded_at))
    .limit(1);

  return {
    ...courier,
    last_location: lastLocation || null,
  };
}

/**
 * Get a courier by profile_id (Supabase auth user UUID), scoped to company.
 */
export async function getCourierByProfileId(profileId: string, companyId: string) {
  const [courier] = await db
    .select()
    .from(couriers)
    .where(
      and(eq(couriers.profile_id, profileId), eq(couriers.company_id, companyId))
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

/**
 * Update allowed courier fields. Verifies company ownership.
 */
export async function updateCourier(
  courierId: string,
  companyId: string,
  data: {
    full_name?: string;
    phone?: string;
    vehicle_type?: string | null;
    plate_number?: string | null;
    photo_url?: string | null;
  }
) {
  const updateValues: Record<string, unknown> = {};
  if (data.full_name !== undefined) updateValues.full_name = data.full_name;
  if (data.phone !== undefined) updateValues.phone = data.phone;
  if (data.vehicle_type !== undefined) updateValues.vehicle_type = data.vehicle_type;
  if (data.plate_number !== undefined) updateValues.plate_number = data.plate_number;
  if (data.photo_url !== undefined) updateValues.photo_url = data.photo_url;

  if (Object.keys(updateValues).length === 0) return null;

  updateValues.updated_at = new Date().toISOString();

  const [updated] = await db
    .update(couriers)
    .set(updateValues)
    .where(and(eq(couriers.id, courierId), eq(couriers.company_id, companyId)))
    .returning();

  return updated || null;
}

/**
 * Get paginated deliveries for a courier, scoped to company.
 * Joins with orders for order_number and addresses.
 */
export async function getCourierDeliveries(
  courierId: string,
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
    eq(deliveries.courier_id, courierId),
    eq(deliveries.company_id, companyId),
    gte(
      deliveries.created_at,
      new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString()
    ),
  ];

  if (options?.status) {
    conditions.push(
      eq(
        deliveries.status,
        options.status as
          | "assigned"
          | "accepted"
          | "picked_up"
          | "in_transit"
          | "delivered"
          | "failed"
      )
    );
  }

  const [countResult] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(deliveries)
    .where(and(...conditions));

  const rows = await db
    .select({
      id: deliveries.id,
      order_id: deliveries.order_id,
      courier_id: deliveries.courier_id,
      company_id: deliveries.company_id,
      status: deliveries.status,
      assigned_at: deliveries.assigned_at,
      accepted_at: deliveries.accepted_at,
      picked_up_at: deliveries.picked_up_at,
      delivered_at: deliveries.delivered_at,
      actual_distance_km: deliveries.actual_distance_km,
      actual_duration_min: deliveries.actual_duration_min,
      created_at: deliveries.created_at,
      updated_at: deliveries.updated_at,
      order_number: orders.order_number,
      pickup_address: orders.pickup_address,
      delivery_address: orders.delivery_address,
      recipient_name: orders.recipient_name,
    })
    .from(deliveries)
    .innerJoin(orders, eq(deliveries.order_id, orders.id))
    .where(and(...conditions))
    .orderBy(desc(deliveries.created_at))
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
 * Get aggregated metrics for a courier.
 * Calculates: deliveries_today, deliveries_month, avg_delivery_time_min,
 * completion_rate, total_distance_km.
 */
export async function getCourierMetrics(courierId: string, companyId: string) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Deliveries today
  const [todayResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(deliveries)
    .where(
      and(
        eq(deliveries.courier_id, courierId),
        eq(deliveries.company_id, companyId),
        eq(deliveries.status, "delivered"),
        gte(deliveries.delivered_at, todayStart)
      )
    );

  // Deliveries this month
  const [monthResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(deliveries)
    .where(
      and(
        eq(deliveries.courier_id, courierId),
        eq(deliveries.company_id, companyId),
        eq(deliveries.status, "delivered"),
        gte(deliveries.delivered_at, monthStart)
      )
    );

  // Average delivery time (delivered_at - assigned_at) for delivered deliveries
  const [avgTimeResult] = await db
    .select({
      avg_minutes: sql<number>`coalesce(avg(extract(epoch from (${deliveries.delivered_at}::timestamptz - ${deliveries.assigned_at}::timestamptz)) / 60.0), 0)::float`,
    })
    .from(deliveries)
    .where(
      and(
        eq(deliveries.courier_id, courierId),
        eq(deliveries.company_id, companyId),
        eq(deliveries.status, "delivered")
      )
    );

  // Completion rate and total distance
  const [statsResult] = await db
    .select({
      total: sql<number>`count(*)::int`,
      delivered: sql<number>`count(*) filter (where ${deliveries.status} = 'delivered')::int`,
      total_distance_km: sql<string>`coalesce(sum(${deliveries.actual_distance_km}), 0)`,
    })
    .from(deliveries)
    .where(
      and(
        eq(deliveries.courier_id, courierId),
        eq(deliveries.company_id, companyId)
      )
    );

  const total = statsResult?.total ?? 0;
  const delivered = statsResult?.delivered ?? 0;
  const completionRate = total > 0 ? Math.round((delivered / total) * 10000) / 100 : 0;

  return {
    deliveries_today: todayResult?.count ?? 0,
    deliveries_month: monthResult?.count ?? 0,
    avg_delivery_time_min: Math.round((avgTimeResult?.avg_minutes ?? 0) * 100) / 100,
    completion_rate: completionRate,
    total_distance_km: statsResult?.total_distance_km ?? "0",
  };
}
