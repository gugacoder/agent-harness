import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { eq, and } from "drizzle-orm";
import type { AppType } from "../types.js";
import { authMiddleware } from "../middleware/auth.js";
import { companyMiddleware } from "../middleware/company.js";
import { requireRole } from "../middleware/role.js";
import { db } from "../db.js";
import { profiles, couriers, shops } from "../../db/schema/index.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { UpdateProfileSchema } from "@chegala/schemas";

// --- Schemas ---

const ProfileResponseSchema = z.object({
  profile: z.object({
    id: z.string().uuid(),
    company_id: z.string().uuid(),
    role: z.string(),
    full_name: z.string(),
    phone: z.string(),
    avatar_url: z.string().nullable(),
    active: z.boolean(),
    created_at: z.string(),
    updated_at: z.string(),
    vehicle_type: z.string().nullable().optional(),
    plate: z.string().nullable().optional(),
    cnh: z.string().nullable().optional(),
    trade_name: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    business_hours: z.unknown().optional(),
  }),
});

const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number().int(),
});

// --- Helper: build profile response with role-specific data ---

function buildProfileResponse(
  profile: typeof profiles.$inferSelect,
  courierData?: { vehicle_type: string | null; plate: string | null; cnh: string | null } | null,
  shopData?: { trade_name: string; address: string; business_hours: unknown } | null
) {
  return {
    id: profile.id,
    company_id: profile.company_id,
    role: profile.role,
    full_name: profile.full_name,
    phone: profile.phone,
    avatar_url: profile.avatar_url,
    active: profile.active,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
    ...(courierData
      ? {
          vehicle_type: courierData.vehicle_type,
          plate: courierData.plate,
          cnh: courierData.cnh,
        }
      : {}),
    ...(shopData
      ? {
          trade_name: shopData.trade_name,
          address: shopData.address,
          business_hours: shopData.business_hours,
        }
      : {}),
  };
}

// --- Router ---

const profilesRouter = new OpenAPIHono<AppType>({
  defaultHook: (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: "Bad Request",
          message: "Validation failed",
          statusCode: 400,
          details: result.error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        },
        400
      );
    }
  },
});

// Middleware chain
profilesRouter.use("/*", authMiddleware);
profilesRouter.use("/*", companyMiddleware);
profilesRouter.use(
  "/*",
  requireRole("operator", "shop", "courier", "super_admin")
);

// --- Helper: fetch role-specific data ---

async function fetchRoleData(userId: string, role: string) {
  let courierData = null;
  let shopData = null;

  if (role === "courier") {
    const [courier] = await db
      .select()
      .from(couriers)
      .where(eq(couriers.profile_id, userId));
    if (courier) {
      courierData = {
        vehicle_type: courier.vehicle_type,
        plate: courier.plate,
        cnh: courier.cnh,
      };
    }
  } else if (role === "shop") {
    const [shop] = await db
      .select()
      .from(shops)
      .where(eq(shops.profile_id, userId));
    if (shop) {
      shopData = {
        trade_name: shop.trade_name,
        address: shop.address,
        business_hours: shop.business_hours,
      };
    }
  }

  return { courierData, shopData };
}

// --- GET /profiles/me ---

const getProfileRoute = createRoute({
  method: "get",
  path: "/profiles/me",
  tags: ["Profiles"],
  summary: "Get current user profile",
  description:
    "Returns the authenticated user's profile with role-specific data (courier or shop fields)",
  responses: {
    200: {
      content: { "application/json": { schema: ProfileResponseSchema } },
      description: "Profile retrieved successfully",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Profile not found",
    },
  },
});

profilesRouter.openapi(getProfileRoute, async (c) => {
  const user = c.get("user");

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id));

  if (!profile) {
    return c.json(
      { error: "Not Found", message: "Profile not found", statusCode: 404 },
      404
    );
  }

  const { courierData, shopData } = await fetchRoleData(user.id, profile.role);

  return c.json(
    { profile: buildProfileResponse(profile, courierData, shopData) },
    200
  );
});

// --- PATCH /profiles/me ---

const updateProfileRoute = createRoute({
  method: "patch",
  path: "/profiles/me",
  tags: ["Profiles"],
  summary: "Update current user profile",
  description:
    "Updates the authenticated user's profile. Courier-specific fields are only applied for courier role, shop-specific for shop role.",
  request: {
    body: {
      content: {
        "application/json": { schema: UpdateProfileSchema },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: ProfileResponseSchema } },
      description: "Profile updated successfully",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Validation error",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Profile not found",
    },
    409: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Phone already in use",
    },
  },
});

profilesRouter.openapi(updateProfileRoute, async (c) => {
  const user = c.get("user");
  const body = c.req.valid("json");

  // Find current profile
  const [currentProfile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id));

  if (!currentProfile) {
    return c.json(
      { error: "Not Found", message: "Profile not found", statusCode: 404 },
      404
    );
  }

  // Validate phone uniqueness within company
  if (body.phone && body.phone !== currentProfile.phone) {
    const [existing] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(
        and(
          eq(profiles.company_id, currentProfile.company_id),
          eq(profiles.phone, body.phone)
        )
      );
    if (existing) {
      return c.json(
        {
          error: "Conflict",
          message:
            "Este telefone ja esta em uso por outro usuario na mesma empresa",
          statusCode: 409,
        },
        409
      );
    }
  }

  // Build and apply profile update
  const profileUpdate: Partial<typeof profiles.$inferInsert> = {
    updated_at: new Date().toISOString(),
  };
  if (body.full_name !== undefined) profileUpdate.full_name = body.full_name;
  if (body.phone !== undefined) profileUpdate.phone = body.phone;
  if (body.avatar_url !== undefined) profileUpdate.avatar_url = body.avatar_url;

  const [updatedProfile] = await db
    .update(profiles)
    .set(profileUpdate)
    .where(eq(profiles.id, user.id))
    .returning();

  // Sync full_name with Supabase Auth if changed
  if (body.full_name !== undefined) {
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: { full_name: body.full_name },
    });
  }

  // Update courier-specific fields if applicable
  if (currentProfile.role === "courier") {
    const courierUpdate: Partial<typeof couriers.$inferInsert> = {};
    if (body.vehicle_type !== undefined)
      courierUpdate.vehicle_type = body.vehicle_type;
    if (body.plate !== undefined) courierUpdate.plate = body.plate;
    if (body.cnh !== undefined) courierUpdate.cnh = body.cnh;
    if (body.full_name !== undefined)
      courierUpdate.full_name = body.full_name;
    if (body.phone !== undefined) courierUpdate.phone = body.phone;

    if (Object.keys(courierUpdate).length > 0) {
      courierUpdate.updated_at = new Date().toISOString();
      await db
        .update(couriers)
        .set(courierUpdate)
        .where(eq(couriers.profile_id, user.id));
    }
  } else if (currentProfile.role === "shop") {
    const shopUpdate: Partial<typeof shops.$inferInsert> = {};
    if (body.trade_name !== undefined) shopUpdate.trade_name = body.trade_name;
    if (body.address !== undefined) shopUpdate.address = body.address;
    if (body.business_hours !== undefined)
      shopUpdate.business_hours = body.business_hours;
    if (body.phone !== undefined) shopUpdate.phone = body.phone;

    if (Object.keys(shopUpdate).length > 0) {
      shopUpdate.updated_at = new Date().toISOString();
      await db
        .update(shops)
        .set(shopUpdate)
        .where(eq(shops.profile_id, user.id));
    }
  }

  // Fetch updated role-specific data for response
  const { courierData, shopData } = await fetchRoleData(
    user.id,
    currentProfile.role
  );

  return c.json(
    {
      profile: buildProfileResponse(updatedProfile, courierData, shopData),
    },
    200
  );
});

export { profilesRouter };
