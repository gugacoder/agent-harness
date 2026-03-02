import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AppType } from "../types.js";
import { authMiddleware } from "../middleware/auth.js";
import { companyMiddleware } from "../middleware/company.js";
import { requireRole } from "../middleware/role.js";
import { generateAndSend, verify, OtpError } from "../services/otp.service.js";
import { SendOtpSchema, VerifyOtpSchema } from "@chegala/schemas";

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

// Apply auth + company + role middleware to all auth routes
authRouter.use("/auth/*", authMiddleware);
authRouter.use("/auth/*", companyMiddleware);
authRouter.use("/auth/*", requireRole("operator", "super_admin"));

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

// =============================================================================
// OTP Auth Routes — Public (no auth middleware)
// =============================================================================

const otpAuthRouter = new OpenAPIHono<AppType>({
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

const OtpSendRequestSchema = SendOtpSchema.openapi("OtpSendRequest");
const OtpVerifyRequestSchema = VerifyOtpSchema.openapi("OtpVerifyRequest");

const OtpSendResponseSchema = z
  .object({
    message: z.string(),
  })
  .openapi("OtpSendResponse");

const OtpVerifyResponseSchema = z
  .object({
    access_token: z.string(),
    refresh_token: z.string(),
    user: z.object({
      id: z.string(),
      email: z.string(),
      role: z.string(),
      companyId: z.string(),
    }),
  })
  .openapi("OtpVerifyResponse");

const otpSendRoute = createRoute({
  method: "post",
  path: "/auth/otp/send",
  tags: ["Auth"],
  summary: "Send OTP code via WhatsApp or Email",
  description: "Public endpoint — sends a 6-digit OTP code to the specified phone or email",
  request: {
    body: {
      content: {
        "application/json": { schema: OtpSendRequestSchema },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: OtpSendResponseSchema } },
      description: "OTP sent successfully",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Invalid request or channel not configured",
    },
    429: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Rate limit exceeded",
    },
    500: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Internal server error",
    },
  },
});

otpAuthRouter.openapi(otpSendRoute, async (c) => {
  const body = c.req.valid("json");

  try {
    await generateAndSend(body.phone_or_email, body.channel, undefined);
    return c.json({ message: "Codigo enviado com sucesso" }, 200);
  } catch (err) {
    if (err instanceof OtpError) {
      const status = err.statusCode as 400 | 429 | 500;
      return c.json(
        { error: "OTP Error", message: err.message, statusCode: err.statusCode },
        status
      );
    }
    throw err;
  }
});

const otpVerifyRoute = createRoute({
  method: "post",
  path: "/auth/otp/verify",
  tags: ["Auth"],
  summary: "Verify OTP code and obtain auth tokens",
  description: "Public endpoint — verifies the OTP code and returns JWT access/refresh tokens",
  request: {
    body: {
      content: {
        "application/json": { schema: OtpVerifyRequestSchema },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: OtpVerifyResponseSchema } },
      description: "OTP verified, tokens returned",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Invalid or expired code",
    },
    500: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Internal server error",
    },
  },
});

otpAuthRouter.openapi(otpVerifyRoute, async (c) => {
  const body = c.req.valid("json");

  try {
    const result = await verify(body.phone_or_email, body.code);
    return c.json(result, 200);
  } catch (err) {
    if (err instanceof OtpError) {
      const status = err.statusCode as 400 | 500;
      return c.json(
        { error: "OTP Error", message: err.message, statusCode: err.statusCode },
        status
      );
    }
    throw err;
  }
});

export { authRouter, otpAuthRouter };
