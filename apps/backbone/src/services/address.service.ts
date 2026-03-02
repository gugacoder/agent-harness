import { eq, and, desc, asc, sql, ilike, or } from "drizzle-orm";
import { db } from "../db.js";
import { savedAddresses } from "../../db/schema/index.js";

/**
 * List saved addresses for a profile within a company.
 * Default sort: favorites first, then by use_count descending.
 */
export async function listSavedAddresses(
  profileId: string,
  companyId: string,
  options?: {
    search?: string;
    sort?: "most_used" | "recent" | "alpha";
  }
) {
  const conditions = [
    eq(savedAddresses.profile_id, profileId),
    eq(savedAddresses.company_id, companyId),
  ];

  if (options?.search) {
    const pattern = `%${options.search}%`;
    conditions.push(
      or(
        ilike(savedAddresses.label, pattern),
        ilike(savedAddresses.address, pattern)
      )!
    );
  }

  let orderBy;
  switch (options?.sort) {
    case "most_used":
      orderBy = [desc(savedAddresses.is_favorite), desc(savedAddresses.use_count)];
      break;
    case "recent":
      orderBy = [desc(savedAddresses.is_favorite), desc(savedAddresses.last_used_at)];
      break;
    case "alpha":
      orderBy = [desc(savedAddresses.is_favorite), asc(savedAddresses.address)];
      break;
    default:
      orderBy = [desc(savedAddresses.is_favorite), desc(savedAddresses.use_count)];
      break;
  }

  return db
    .select()
    .from(savedAddresses)
    .where(and(...conditions))
    .orderBy(...orderBy);
}

/**
 * Create a new saved address.
 */
export async function createSavedAddress(data: {
  companyId: string;
  profileId: string;
  address: string;
  lat: string;
  lng: string;
  label?: string | null;
  complement?: string | null;
  reference?: string | null;
  isFavorite?: boolean;
}) {
  const [created] = await db
    .insert(savedAddresses)
    .values({
      company_id: data.companyId,
      profile_id: data.profileId,
      address: data.address,
      lat: data.lat,
      lng: data.lng,
      label: data.label ?? null,
      complement: data.complement ?? null,
      reference: data.reference ?? null,
      is_favorite: data.isFavorite ?? false,
    })
    .returning();

  return created;
}

/**
 * Update a saved address. Verifies ownership (profile_id + company_id) before updating.
 * Returns the updated record or null if not found / not owned.
 */
export async function updateSavedAddress(
  id: string,
  profileId: string,
  companyId: string,
  data: {
    label?: string | null;
    address?: string;
    lat?: string;
    lng?: string;
    complement?: string | null;
    reference?: string | null;
    isFavorite?: boolean;
  }
) {
  const updateValues: Record<string, unknown> = {};
  if (data.label !== undefined) updateValues.label = data.label;
  if (data.address !== undefined) updateValues.address = data.address;
  if (data.lat !== undefined) updateValues.lat = data.lat;
  if (data.lng !== undefined) updateValues.lng = data.lng;
  if (data.complement !== undefined) updateValues.complement = data.complement;
  if (data.reference !== undefined) updateValues.reference = data.reference;
  if (data.isFavorite !== undefined) updateValues.is_favorite = data.isFavorite;

  if (Object.keys(updateValues).length === 0) return null;

  const [updated] = await db
    .update(savedAddresses)
    .set(updateValues)
    .where(
      and(
        eq(savedAddresses.id, id),
        eq(savedAddresses.profile_id, profileId),
        eq(savedAddresses.company_id, companyId)
      )
    )
    .returning();

  return updated || null;
}

/**
 * Delete a saved address. Verifies ownership before deleting.
 * Returns the deleted record or null if not found / not owned.
 */
export async function deleteSavedAddress(
  id: string,
  profileId: string,
  companyId: string
) {
  const [deleted] = await db
    .delete(savedAddresses)
    .where(
      and(
        eq(savedAddresses.id, id),
        eq(savedAddresses.profile_id, profileId),
        eq(savedAddresses.company_id, companyId)
      )
    )
    .returning();

  return deleted || null;
}

/**
 * Auto-save an address after order creation.
 * - If address already exists for this profile: increment use_count, update last_used_at
 * - If new: check non-favorite count, evict oldest if >= 10, then insert
 */
export async function autoSaveAddress(
  profileId: string,
  companyId: string,
  address: string,
  lat: string,
  lng: string
) {
  // Check if this address already exists for the profile
  const [existing] = await db
    .select()
    .from(savedAddresses)
    .where(
      and(
        eq(savedAddresses.profile_id, profileId),
        eq(savedAddresses.address, address)
      )
    )
    .limit(1);

  if (existing) {
    // Increment use_count and update last_used_at
    await db
      .update(savedAddresses)
      .set({
        use_count: sql`${savedAddresses.use_count} + 1`,
        last_used_at: sql`now()`,
      })
      .where(eq(savedAddresses.id, existing.id));
    return;
  }

  // Count non-favorite addresses for this profile
  const [countResult] = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(savedAddresses)
    .where(
      and(
        eq(savedAddresses.profile_id, profileId),
        eq(savedAddresses.company_id, companyId),
        eq(savedAddresses.is_favorite, false)
      )
    );

  // If at capacity, delete the oldest non-favorite
  if (countResult.count >= 10) {
    const [oldest] = await db
      .select({ id: savedAddresses.id })
      .from(savedAddresses)
      .where(
        and(
          eq(savedAddresses.profile_id, profileId),
          eq(savedAddresses.company_id, companyId),
          eq(savedAddresses.is_favorite, false)
        )
      )
      .orderBy(
        asc(sql`COALESCE(${savedAddresses.last_used_at}, ${savedAddresses.created_at})`)
      )
      .limit(1);

    if (oldest) {
      await db
        .delete(savedAddresses)
        .where(eq(savedAddresses.id, oldest.id));
    }
  }

  // Insert the new address
  await db.insert(savedAddresses).values({
    company_id: companyId,
    profile_id: profileId,
    address,
    lat,
    lng,
    use_count: 1,
    last_used_at: sql`now()`,
  });
}
