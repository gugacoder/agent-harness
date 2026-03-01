import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AppType } from "../types.js";
import { authMiddleware } from "../middleware/auth.js";
import { companyMiddleware } from "../middleware/company.js";

const UserRoleEnum = z.enum(["operator", "shop", "courier"]);

const InviteUserRequestSchema = z.object({
  email: z.string().email(),
  role: UserRoleEnum,
  full_name: z.string(),
  phone: z.string(),
});

const authRouter = new OpenAPIHono<AppType>({
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

// Apply auth + company middleware to all auth routes
authRouter.use("/*", authMiddleware);
authRouter.use("/*", companyMiddleware);

const InviteResponseSchema = z.object({
  message: z.string(),
  user_id: z.string().uuid(),
  email: z.string().email(),
});

const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number().int(),
});

const inviteRoute = createRoute({
  method: "post",
  path: "/auth/invite",
  tags: ["Auth"],
  summary: "Invite a new user by email",
  description:
    "Operator invites a new user (shop or courier) to their company via GoTrue admin API",
  request: {
    body: {
      content: {
        "application/json": { schema: InviteUserRequestSchema },
      },
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: InviteResponseSchema } },
      description: "User invited successfully",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Invalid request data",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
    500: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "GoTrue API error",
    },
  },
});

authRouter.openapi(inviteRoute, async (c) => {
  const body = c.req.valid("json");
  const user = c.get("user");
  const companyId = c.get("companyId");

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

  // Call GoTrue admin API to create user with invite
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
        email: body.email,
        email_confirm: false,
        app_metadata: {
          company_id: companyId,
          role: body.role,
        },
        user_metadata: {
          full_name: body.full_name,
          phone: body.phone,
        },
      }),
    }
  );

  if (!gotrueResponse.ok) {
    const errorData = await gotrueResponse.json().catch(() => ({}));
    const errorMessage =
      (errorData as Record<string, string>).msg ||
      (errorData as Record<string, string>).message ||
      "Failed to invite user";

    console.error("GoTrue invite error:", errorData);

    return c.json(
      {
        error: "GoTrue Error",
        message: errorMessage,
        statusCode: gotrueResponse.status,
      },
      500
    );
  }

  const created = (await gotrueResponse.json()) as {
    id: string;
    email: string;
  };

  // Generate invite link so GoTrue sends the invite email
  await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
    },
    body: JSON.stringify({
      type: "invite",
      email: body.email,
    }),
  });

  return c.json(
    {
      message: "User invited successfully",
      user_id: created.id,
      email: created.email,
    },
    201
  );
});

export { authRouter };
