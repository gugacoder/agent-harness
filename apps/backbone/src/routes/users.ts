import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { eq, and } from "drizzle-orm";
import type { AppType } from "../types.js";
import { authMiddleware } from "../middleware/auth.js";
import { companyMiddleware } from "../middleware/company.js";
import { requireRole } from "../middleware/role.js";
import { db } from "../db.js";
import { profiles } from "../../db/schema/index.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { ListUsersQuerySchema, UpdateUserSchema } from "@chegala/schemas";

// --- Response Schemas ---

const UserResponseSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string(),
  phone: z.string(),
  email: z.string().nullable(),
  role: z.string(),
  avatar_url: z.string().nullable(),
  active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

const UsersListResponseSchema = z.object({
  users: z.array(UserResponseSchema),
});

const SingleUserResponseSchema = z.object({
  user: UserResponseSchema,
});

const OkResponseSchema = z.object({
  ok: z.boolean(),
});

const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number().int(),
});

// --- Router ---

const usersRouter = new OpenAPIHono<AppType>({
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
usersRouter.use("/*", authMiddleware);
usersRouter.use("/*", companyMiddleware);
usersRouter.use("/*", requireRole("operator", "super_admin"));

// --- Helper: get email from Supabase Auth for a user id ---

async function getAuthUserEmail(userId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error || !data?.user) return null;
  return data.user.email ?? null;
}

// --- Helper: batch get emails for multiple user ids ---

async function getAuthUserEmails(
  userIds: string[]
): Promise<Map<string, string | null>> {
  const emailMap = new Map<string, string | null>();
  // Supabase Admin listUsers with per_page up to 1000
  // We fetch all auth users and filter by our ids
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({
    perPage: 1000,
  });
  if (error || !data?.users) return emailMap;
  const idSet = new Set(userIds);
  for (const authUser of data.users) {
    if (idSet.has(authUser.id)) {
      emailMap.set(authUser.id, authUser.email ?? null);
    }
  }
  return emailMap;
}

// --- GET /users ---

const listUsersRoute = createRoute({
  method: "get",
  path: "/users",
  tags: ["Users"],
  summary: "List users in the company",
  description:
    "Returns all profiles for the authenticated user's company. Supports filtering by role, active status, and search by name/email.",
  request: {
    query: ListUsersQuerySchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: UsersListResponseSchema } },
      description: "Users listed successfully",
    },
  },
});

usersRouter.openapi(listUsersRoute, async (c) => {
  const companyId = c.get("companyId");
  const query = c.req.valid("query");

  // Build conditions
  const conditions = [eq(profiles.company_id, companyId)];

  if (query.role !== undefined) {
    conditions.push(eq(profiles.role, query.role));
  }

  if (query.active !== undefined) {
    conditions.push(eq(profiles.active, query.active));
  }

  // Fetch profiles
  const profileList = await db
    .select()
    .from(profiles)
    .where(and(...conditions))
    .orderBy(profiles.full_name);

  // Batch fetch emails from Supabase Auth
  const userIds = profileList.map((p) => p.id);
  const emailMap = await getAuthUserEmails(userIds);

  // If search is provided, filter by name or email (ILIKE)
  let results = profileList.map((p) => ({
    id: p.id,
    full_name: p.full_name,
    phone: p.phone,
    email: emailMap.get(p.id) ?? null,
    role: p.role,
    avatar_url: p.avatar_url,
    active: p.active,
    created_at: p.created_at,
    updated_at: p.updated_at,
  }));

  if (query.search) {
    const searchLower = query.search.toLowerCase();
    results = results.filter(
      (u) =>
        u.full_name.toLowerCase().includes(searchLower) ||
        (u.email && u.email.toLowerCase().includes(searchLower))
    );
  }

  return c.json({ users: results }, 200);
});

// --- PATCH /users/:id ---

const updateUserRoute = createRoute({
  method: "patch",
  path: "/users/{id}",
  tags: ["Users"],
  summary: "Update a user in the company",
  description:
    "Edit a user's data. Validates the target user belongs to the same company. Syncs changes with Supabase Auth.",
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        "application/json": { schema: UpdateUserSchema },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: SingleUserResponseSchema } },
      description: "User updated successfully",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Validation error",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "User not found",
    },
    409: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Phone already in use",
    },
  },
});

usersRouter.openapi(updateUserRoute, async (c) => {
  const { id } = c.req.valid("param");
  const companyId = c.get("companyId");
  const body = c.req.valid("json");

  // Validate target user belongs to same company
  const [targetProfile] = await db
    .select()
    .from(profiles)
    .where(and(eq(profiles.id, id), eq(profiles.company_id, companyId)));

  if (!targetProfile) {
    return c.json(
      {
        error: "Not Found",
        message: "Usuario nao encontrado nesta empresa",
        statusCode: 404,
      },
      404
    );
  }

  // Validate phone uniqueness within company if changing phone
  if (body.phone && body.phone !== targetProfile.phone) {
    const [existing] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(
        and(eq(profiles.company_id, companyId), eq(profiles.phone, body.phone))
      );
    if (existing && existing.id !== id) {
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

  // Build profile update
  const profileUpdate: Partial<typeof profiles.$inferInsert> = {
    updated_at: new Date().toISOString(),
  };
  if (body.full_name !== undefined) profileUpdate.full_name = body.full_name;
  if (body.phone !== undefined) profileUpdate.phone = body.phone;
  if (body.role !== undefined) profileUpdate.role = body.role;
  if (body.active !== undefined) profileUpdate.active = body.active;

  const [updatedProfile] = await db
    .update(profiles)
    .set(profileUpdate)
    .where(eq(profiles.id, id))
    .returning();

  // Sync with Supabase Auth
  const authUpdate: {
    email?: string;
    user_metadata?: Record<string, unknown>;
    app_metadata?: Record<string, unknown>;
  } = {};

  if (body.full_name !== undefined) {
    authUpdate.user_metadata = {
      ...authUpdate.user_metadata,
      full_name: body.full_name,
    };
  }
  if (body.phone !== undefined) {
    authUpdate.user_metadata = {
      ...authUpdate.user_metadata,
      phone: body.phone,
    };
  }
  if (body.email !== undefined) {
    authUpdate.email = body.email;
  }
  if (body.role !== undefined) {
    authUpdate.app_metadata = {
      ...authUpdate.app_metadata,
      role: body.role,
    };
  }

  if (Object.keys(authUpdate).length > 0) {
    await supabaseAdmin.auth.admin.updateUserById(id, authUpdate);
  }

  // Get email for response
  const email = await getAuthUserEmail(id);

  return c.json(
    {
      user: {
        id: updatedProfile.id,
        full_name: updatedProfile.full_name,
        phone: updatedProfile.phone,
        email,
        role: updatedProfile.role,
        avatar_url: updatedProfile.avatar_url,
        active: updatedProfile.active,
        created_at: updatedProfile.created_at,
        updated_at: updatedProfile.updated_at,
      },
    },
    200
  );
});

// --- PATCH /users/:id/status ---

const toggleUserStatusRoute = createRoute({
  method: "patch",
  path: "/users/{id}/status",
  tags: ["Users"],
  summary: "Activate or deactivate a user",
  description:
    "Toggles a user's active status. Updates profiles.active and bans/unbans in Supabase Auth.",
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        "application/json": {
          schema: z.object({ active: z.boolean() }),
        },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: OkResponseSchema } },
      description: "Status updated successfully",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "User not found",
    },
  },
});

usersRouter.openapi(toggleUserStatusRoute, async (c) => {
  const { id } = c.req.valid("param");
  const companyId = c.get("companyId");
  const { active } = c.req.valid("json");

  // Validate target user belongs to same company
  const [targetProfile] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.id, id), eq(profiles.company_id, companyId)));

  if (!targetProfile) {
    return c.json(
      {
        error: "Not Found",
        message: "Usuario nao encontrado nesta empresa",
        statusCode: 404,
      },
      404
    );
  }

  // Update profiles.active
  await db
    .update(profiles)
    .set({ active, updated_at: new Date().toISOString() })
    .where(eq(profiles.id, id));

  // Ban/unban in Supabase Auth
  await supabaseAdmin.auth.admin.updateUserById(id, {
    ban_duration: active ? "none" : "876000h", // ~100 years = effectively permanent ban
  });

  return c.json({ ok: true }, 200);
});

// --- POST /users/:id/reset-password ---

const resetPasswordRoute = createRoute({
  method: "post",
  path: "/users/{id}/reset-password",
  tags: ["Users"],
  summary: "Send password reset email",
  description:
    "Sends a password recovery email to the user via Supabase Admin API.",
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: OkResponseSchema } },
      description: "Recovery email sent",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "User not found",
    },
    500: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Failed to send recovery email",
    },
  },
});

usersRouter.openapi(resetPasswordRoute, async (c) => {
  const { id } = c.req.valid("param");
  const companyId = c.get("companyId");

  // Validate target user belongs to same company
  const [targetProfile] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.id, id), eq(profiles.company_id, companyId)));

  if (!targetProfile) {
    return c.json(
      {
        error: "Not Found",
        message: "Usuario nao encontrado nesta empresa",
        statusCode: 404,
      },
      404
    );
  }

  // Get user email from Supabase Auth
  const { data: authUser, error: authError } =
    await supabaseAdmin.auth.admin.getUserById(id);

  if (authError || !authUser?.user?.email) {
    return c.json(
      {
        error: "Not Found",
        message: "Email do usuario nao encontrado",
        statusCode: 404,
      },
      404
    );
  }

  // Generate recovery link (sends email)
  const { error: linkError } =
    await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: authUser.user.email,
    });

  if (linkError) {
    console.error("Recovery link generation error:", linkError);
    return c.json(
      {
        error: "Internal Server Error",
        message: "Falha ao enviar email de recuperacao",
        statusCode: 500,
      },
      500
    );
  }

  return c.json({ ok: true }, 200);
});

export { usersRouter };
