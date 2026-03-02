import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { eq, and } from "drizzle-orm";
import type { AppType } from "../types.js";
import { authMiddleware } from "../middleware/auth.js";
import { companyMiddleware } from "../middleware/company.js";
import { requireRole } from "../middleware/role.js";
import { db } from "../db.js";
import {
  registrationRequests,
  profiles,
  couriers,
  shops,
} from "../../db/schema/index.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { sseManager } from "../sse/manager.js";
import { companyChannel } from "../sse/channels.js";
import { RegistrationRequestSchema } from "@chegala/schemas";

// =============================================================================
// Public registration router — no auth middleware
// =============================================================================

const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number().int(),
});

export const publicRegistrationRouter = new OpenAPIHono<AppType>({
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

const RequestBodySchema = RegistrationRequestSchema.openapi(
  "RegistrationRequest"
);

const RegistrationResponseSchema = z
  .object({
    ok: z.boolean(),
    message: z.string(),
  })
  .openapi("RegistrationResponse");

const requestRoute = createRoute({
  method: "post",
  path: "/registration/request",
  tags: ["Registration"],
  summary: "Submit self-registration request",
  description:
    "Public endpoint — creates a pending registration request for a company",
  request: {
    body: {
      content: {
        "application/json": { schema: RequestBodySchema },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": { schema: RegistrationResponseSchema },
      },
      description: "Registration request created",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Validation error or duplicate request",
    },
    409: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Duplicate pending request or existing profile",
    },
  },
});

publicRegistrationRouter.openapi(requestRoute, async (c) => {
  const body = c.req.valid("json");

  // Check for duplicate pending request with same phone + company
  const existingRequest = await db
    .select({ id: registrationRequests.id })
    .from(registrationRequests)
    .where(
      and(
        eq(registrationRequests.phone, body.phone),
        eq(registrationRequests.company_id, body.company_id),
        eq(registrationRequests.status, "pending")
      )
    )
    .limit(1);

  if (existingRequest.length > 0) {
    return c.json(
      {
        error: "Conflict",
        message:
          "Ja existe uma solicitacao pendente para este telefone nesta empresa",
        statusCode: 409,
      },
      409
    );
  }

  // Check for existing profile with same phone + company
  const existingProfile = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(
      and(
        eq(profiles.phone, body.phone),
        eq(profiles.company_id, body.company_id)
      )
    )
    .limit(1);

  if (existingProfile.length > 0) {
    return c.json(
      {
        error: "Conflict",
        message: "Ja existe um usuario cadastrado com este telefone nesta empresa",
        statusCode: 409,
      },
      409
    );
  }

  // Insert registration request
  const [inserted] = await db
    .insert(registrationRequests)
    .values({
      company_id: body.company_id,
      full_name: body.full_name,
      phone: body.phone,
      email: body.email ?? null,
      requested_role: body.requested_role,
      extra_data: body.extra_data ?? null,
      status: "pending",
    })
    .returning({ id: registrationRequests.id });

  // Emit SSE event to company operators
  const channel = companyChannel(body.company_id);
  await sseManager.broadcast(channel, {
    type: "registration_request",
    data: {
      id: inserted.id,
      full_name: body.full_name,
      phone: body.phone,
      requested_role: body.requested_role,
    },
  });

  return c.json(
    { ok: true, message: "Cadastro enviado — aguardando aprovacao" },
    201
  );
});

// =============================================================================
// Protected registration router — requires auth
// =============================================================================

export const registrationRouter = new OpenAPIHono<AppType>({
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

// Auth middleware for all protected registration routes
registrationRouter.use("/*", authMiddleware);
registrationRouter.use("/*", companyMiddleware);
registrationRouter.use("/*", requireRole("operator", "super_admin"));

// --- GET /registration/pending ---

const PendingRequestSchema = z
  .object({
    id: z.string().uuid(),
    company_id: z.string().uuid(),
    full_name: z.string(),
    phone: z.string(),
    email: z.string().nullable(),
    requested_role: z.string(),
    status: z.string(),
    extra_data: z.unknown().nullable(),
    requested_at: z.string(),
  })
  .openapi("PendingRegistrationRequest");

const PendingListResponseSchema = z
  .object({
    requests: z.array(PendingRequestSchema),
  })
  .openapi("PendingRegistrationListResponse");

const pendingRoute = createRoute({
  method: "get",
  path: "/registration/pending",
  tags: ["Registration"],
  summary: "List pending registration requests",
  description:
    "Operator/super_admin — lists pending registration requests for the company",
  responses: {
    200: {
      content: {
        "application/json": { schema: PendingListResponseSchema },
      },
      description: "List of pending registration requests",
    },
  },
});

registrationRouter.openapi(pendingRoute, async (c) => {
  const companyId = c.get("companyId");

  const requests = await db
    .select()
    .from(registrationRequests)
    .where(
      and(
        eq(registrationRequests.company_id, companyId),
        eq(registrationRequests.status, "pending")
      )
    );

  return c.json({ requests }, 200);
});

// --- POST /registration/:id/approve ---

const IdParamSchema = z.object({
  id: z.string().uuid(),
});

const OkResponseSchema = z
  .object({ ok: z.boolean() })
  .openapi("RegistrationOkResponse");

const approveRoute = createRoute({
  method: "post",
  path: "/registration/{id}/approve",
  tags: ["Registration"],
  summary: "Approve a registration request",
  description:
    "Creates user in Supabase Auth, profile, and role-specific entry (courier/shop)",
  request: {
    params: IdParamSchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: OkResponseSchema } },
      description: "Registration approved",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Invalid request",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Registration request not found",
    },
    500: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Failed to create user",
    },
  },
});

registrationRouter.openapi(approveRoute, async (c) => {
  const { id } = c.req.valid("param");
  const user = c.get("user");
  const companyId = c.get("companyId");

  // Find the registration request
  const [request] = await db
    .select()
    .from(registrationRequests)
    .where(eq(registrationRequests.id, id))
    .limit(1);

  if (!request) {
    return c.json(
      {
        error: "Not Found",
        message: "Solicitacao de cadastro nao encontrada",
        statusCode: 404,
      },
      404
    );
  }

  // Validate company ownership
  if (request.company_id !== companyId) {
    return c.json(
      {
        error: "Forbidden",
        message: "Solicitacao pertence a outra empresa",
        statusCode: 403,
      },
      403 as any
    );
  }

  if (request.status !== "pending") {
    return c.json(
      {
        error: "Bad Request",
        message: `Solicitacao ja foi ${request.status === "approved" ? "aprovada" : "rejeitada"}`,
        statusCode: 400,
      },
      400
    );
  }

  // Create user in Supabase Auth
  const supabaseUrl = process.env.SUPABASE_PUBLIC_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return c.json(
      {
        error: "Internal Server Error",
        message: "Supabase configuration missing",
        statusCode: 500,
      },
      500
    );
  }

  // Use email if available, otherwise generate a phone-based placeholder email
  const userEmail = request.email || `${request.phone}@phone.chegala.local`;

  const gotrueResponse = await fetch(
    `${supabaseUrl}/auth/v1/admin/users`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
      body: JSON.stringify({
        email: userEmail,
        email_confirm: true,
        phone: request.phone,
        phone_confirm: true,
        app_metadata: {
          company_id: request.company_id,
          role: request.requested_role,
        },
        user_metadata: {
          full_name: request.full_name,
          phone: request.phone,
        },
      }),
    }
  );

  if (!gotrueResponse.ok) {
    const errorData = await gotrueResponse.json().catch(() => ({}));
    const errorMessage =
      (errorData as Record<string, string>).msg ||
      (errorData as Record<string, string>).message ||
      "Failed to create user";

    console.error("GoTrue create user error:", errorData);

    return c.json(
      {
        error: "GoTrue Error",
        message: errorMessage,
        statusCode: 500,
      },
      500
    );
  }

  const created = (await gotrueResponse.json()) as { id: string };

  // Create profile
  await db.insert(profiles).values({
    id: created.id,
    company_id: request.company_id,
    role: request.requested_role,
    full_name: request.full_name,
    phone: request.phone,
  });

  // Create role-specific entry
  const extraData = (request.extra_data as Record<string, string>) || {};

  if (request.requested_role === "courier") {
    await db.insert(couriers).values({
      company_id: request.company_id,
      profile_id: created.id,
      full_name: request.full_name,
      phone: request.phone,
      vehicle_type: extraData.vehicle_type || null,
      plate: extraData.plate || null,
    });
  } else if (request.requested_role === "shop") {
    await db.insert(shops).values({
      company_id: request.company_id,
      profile_id: created.id,
      trade_name: extraData.trade_name || request.full_name,
      phone: request.phone,
      address: "",
      lat: "0",
      lng: "0",
    });
  }

  // Update registration request status
  await db
    .update(registrationRequests)
    .set({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .where(eq(registrationRequests.id, id));

  return c.json({ ok: true }, 200);
});

// --- POST /registration/:id/reject ---

const rejectRoute = createRoute({
  method: "post",
  path: "/registration/{id}/reject",
  tags: ["Registration"],
  summary: "Reject a registration request",
  description: "Updates the registration request status to rejected",
  request: {
    params: IdParamSchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: OkResponseSchema } },
      description: "Registration rejected",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Registration request not found",
    },
  },
});

registrationRouter.openapi(rejectRoute, async (c) => {
  const { id } = c.req.valid("param");
  const user = c.get("user");
  const companyId = c.get("companyId");

  // Find the registration request
  const [request] = await db
    .select()
    .from(registrationRequests)
    .where(eq(registrationRequests.id, id))
    .limit(1);

  if (!request) {
    return c.json(
      {
        error: "Not Found",
        message: "Solicitacao de cadastro nao encontrada",
        statusCode: 404,
      },
      404
    );
  }

  // Validate company ownership
  if (request.company_id !== companyId) {
    return c.json(
      {
        error: "Forbidden",
        message: "Solicitacao pertence a outra empresa",
        statusCode: 403,
      },
      403 as any
    );
  }

  if (request.status !== "pending") {
    return c.json(
      {
        error: "Bad Request",
        message: `Solicitacao ja foi ${request.status === "approved" ? "aprovada" : "rejeitada"}`,
        statusCode: 400,
      },
      400
    );
  }

  // Update status to rejected
  await db
    .update(registrationRequests)
    .set({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .where(eq(registrationRequests.id, id));

  return c.json({ ok: true }, 200);
});
