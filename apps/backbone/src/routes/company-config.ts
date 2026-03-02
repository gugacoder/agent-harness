import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import net from "node:net";
import tls from "node:tls";
import type { AppType } from "../types.js";
import { authMiddleware } from "../middleware/auth.js";
import { companyMiddleware } from "../middleware/company.js";
import { requireRole } from "../middleware/role.js";
import { db } from "../db.js";
import { companyConfigs, profiles } from "../../db/schema/index.js";
import { encrypt, decrypt } from "../services/encryption.js";
import { sendWhatsAppMessage } from "../services/whatsapp.service.js";
import { sendEmail } from "../services/smtp.service.js";
import { supabaseAdmin } from "../lib/supabase.js";

// --- Schemas ---

const CompanyConfigResponseSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  pod_required: z.boolean(),
  default_closing_period: z.string(),
  default_invoice_period: z.string(),
  otp_whatsapp_enabled: z.boolean(),
  otp_whatsapp_url: z.string().nullable(),
  otp_whatsapp_api_key_set: z.boolean(),
  otp_smtp_enabled: z.boolean(),
  otp_smtp_host: z.string().nullable(),
  otp_smtp_port: z.number().nullable(),
  otp_smtp_user: z.string().nullable(),
  otp_smtp_pass_set: z.boolean(),
  otp_smtp_from: z.string().nullable(),
  otp_smtp_tls: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

const UpdateCompanyConfigRequestSchema = z.object({
  pod_required: z.boolean().optional(),
  default_closing_period: z.enum(["daily", "weekly", "monthly"]).optional(),
  default_invoice_period: z.enum(["daily", "weekly", "monthly"]).optional(),
  otp_whatsapp_enabled: z.boolean().optional(),
  otp_whatsapp_url: z.string().optional(),
  otp_whatsapp_api_key: z.string().optional(),
  otp_smtp_enabled: z.boolean().optional(),
  otp_smtp_host: z.string().optional(),
  otp_smtp_port: z.number().int().optional(),
  otp_smtp_user: z.string().optional(),
  otp_smtp_pass: z.string().optional(),
  otp_smtp_from: z.string().optional(),
  otp_smtp_tls: z.boolean().optional(),
});

const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number().int(),
});

const TestResultSchema = z.object({
  ok: z.boolean().optional(),
  error: z.string().optional(),
});

const DetectTlsRequestSchema = z.object({
  host: z.string(),
  port: z.number().int(),
});

const DetectTlsResponseSchema = z.object({
  tls: z.boolean(),
  success: z.boolean(),
});

// --- Router ---

const companyConfigRouter = new OpenAPIHono<AppType>({
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

// Apply auth + company + role middleware
companyConfigRouter.use("/company/*", authMiddleware);
companyConfigRouter.use("/company/*", companyMiddleware);
companyConfigRouter.use("/company/*", requireRole("operator", "courier", "super_admin"));

// --- Helper: ensure config exists (upsert with defaults) ---

async function ensureConfig(companyId: string) {
  const [existing] = await db
    .select()
    .from(companyConfigs)
    .where(eq(companyConfigs.company_id, companyId));

  if (existing) return existing;

  try {
    const [created] = await db
      .insert(companyConfigs)
      .values({ company_id: companyId })
      .returning();

    return created;
  } catch (err: unknown) {
    // Race condition: another request inserted between our SELECT and INSERT.
    // Retry the SELECT to return the row created by the other request.
    if (
      err instanceof Error &&
      err.message.includes("unique constraint")
    ) {
      const [retried] = await db
        .select()
        .from(companyConfigs)
        .where(eq(companyConfigs.company_id, companyId));
      if (retried) return retried;
    }
    throw err;
  }
}

// --- Helper: build masked config response ---

function buildConfigResponse(config: typeof companyConfigs.$inferSelect) {
  return {
    id: config.id,
    company_id: config.company_id,
    pod_required: config.pod_required,
    default_closing_period: config.default_closing_period,
    default_invoice_period: config.default_invoice_period,
    otp_whatsapp_enabled: config.otp_whatsapp_enabled,
    otp_whatsapp_url: config.otp_whatsapp_url,
    otp_whatsapp_api_key_set: !!config.otp_whatsapp_api_key,
    otp_smtp_enabled: config.otp_smtp_enabled,
    otp_smtp_host: config.otp_smtp_host,
    otp_smtp_port: config.otp_smtp_port,
    otp_smtp_user: config.otp_smtp_user,
    otp_smtp_pass_set: !!config.otp_smtp_pass_encrypted,
    otp_smtp_from: config.otp_smtp_from,
    otp_smtp_tls: config.otp_smtp_tls,
    created_at: config.created_at,
    updated_at: config.updated_at,
  };
}

// --- GET /api/company/config ---

const getCompanyConfigRoute = createRoute({
  method: "get",
  path: "/company/config",
  tags: ["Company Config"],
  summary: "Get company configuration",
  description:
    "Returns the company configuration. Creates one with defaults if it does not exist yet. Credential fields are returned as boolean flags (*_set).",
  responses: {
    200: {
      content: {
        "application/json": { schema: CompanyConfigResponseSchema },
      },
      description: "Company configuration",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
    500: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Internal server error",
    },
  },
});

companyConfigRouter.openapi(getCompanyConfigRoute, async (c) => {
  const companyId = c.get("companyId");
  const config = await ensureConfig(companyId);
  return c.json(buildConfigResponse(config), 200);
});

// --- PATCH /api/company/config ---

const updateCompanyConfigRoute = createRoute({
  method: "patch",
  path: "/company/config",
  tags: ["Company Config"],
  summary: "Update company configuration",
  description:
    "Update company configuration fields including OTP channel settings. Credentials (otp_smtp_pass, otp_whatsapp_api_key) are encrypted server-side before storage.",
  request: {
    body: {
      content: {
        "application/json": { schema: UpdateCompanyConfigRequestSchema },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: CompanyConfigResponseSchema },
      },
      description: "Updated company configuration",
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
      description: "Internal server error",
    },
  },
});

companyConfigRouter.openapi(updateCompanyConfigRoute, async (c) => {
  const companyId = c.get("companyId");
  const body = c.req.valid("json");

  try {
    // Ensure config exists (creates with defaults if needed)
    const config = await ensureConfig(companyId);

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  // Original fields
  if (body.pod_required !== undefined) updates.pod_required = body.pod_required;
  if (body.default_closing_period !== undefined)
    updates.default_closing_period = body.default_closing_period;
  if (body.default_invoice_period !== undefined)
    updates.default_invoice_period = body.default_invoice_period;

  // OTP WhatsApp fields
  if (body.otp_whatsapp_enabled !== undefined)
    updates.otp_whatsapp_enabled = body.otp_whatsapp_enabled;
  if (body.otp_whatsapp_url !== undefined)
    updates.otp_whatsapp_url = body.otp_whatsapp_url;
  if (body.otp_whatsapp_api_key !== undefined)
    updates.otp_whatsapp_api_key = encrypt(body.otp_whatsapp_api_key);

  // OTP SMTP fields
  if (body.otp_smtp_enabled !== undefined)
    updates.otp_smtp_enabled = body.otp_smtp_enabled;
  if (body.otp_smtp_host !== undefined) updates.otp_smtp_host = body.otp_smtp_host;
  if (body.otp_smtp_port !== undefined) updates.otp_smtp_port = body.otp_smtp_port;
  if (body.otp_smtp_user !== undefined) updates.otp_smtp_user = body.otp_smtp_user;
  if (body.otp_smtp_pass !== undefined)
    updates.otp_smtp_pass_encrypted = encrypt(body.otp_smtp_pass);
  if (body.otp_smtp_from !== undefined) updates.otp_smtp_from = body.otp_smtp_from;
  if (body.otp_smtp_tls !== undefined) updates.otp_smtp_tls = body.otp_smtp_tls;

  const [updated] = await db
    .update(companyConfigs)
    .set(updates)
    .where(eq(companyConfigs.id, config.id))
    .returning();

  return c.json(buildConfigResponse(updated), 200);
  } catch (err) {
    console.error("Error updating company config:", err);
    return c.json({ error: "Internal Server Error", message: "Internal server error", statusCode: 500 }, 500);
  }
});

// --- POST /api/company/config/test-whatsapp ---

const testWhatsAppRoute = createRoute({
  method: "post",
  path: "/company/config/test-whatsapp",
  tags: ["Company Config"],
  summary: "Test WhatsApp connection",
  description:
    "Sends a test WhatsApp message to the authenticated operator's phone number using the company's configured WhatsApp credentials.",
  responses: {
    200: {
      content: { "application/json": { schema: TestResultSchema } },
      description: "Test result",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

companyConfigRouter.openapi(testWhatsAppRoute, async (c) => {
  const companyId = c.get("companyId");
  const user = c.get("user");

  try {
    const config = await ensureConfig(companyId);

    if (!config.otp_whatsapp_url || !config.otp_whatsapp_api_key) {
      return c.json({ error: "WhatsApp nao configurado. Salve a URL e API Key primeiro." }, 200);
    }

    // Get operator's phone from profile
    const [profile] = await db
      .select({ phone: profiles.phone })
      .from(profiles)
      .where(eq(profiles.id, user.id));

    if (!profile?.phone) {
      return c.json({ error: "Telefone do operador nao encontrado no perfil." }, 200);
    }

    const apiKey = decrypt(config.otp_whatsapp_api_key);
    await sendWhatsAppMessage(
      config.otp_whatsapp_url,
      apiKey,
      profile.phone,
      "Teste de conexao Chega.la"
    );

    return c.json({ ok: true }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return c.json({ error: message }, 200);
  }
});

// --- POST /api/company/config/test-smtp ---

const testSmtpRoute = createRoute({
  method: "post",
  path: "/company/config/test-smtp",
  tags: ["Company Config"],
  summary: "Test SMTP connection",
  description:
    "Sends a test email to the authenticated operator's email address using the company's configured SMTP credentials.",
  responses: {
    200: {
      content: { "application/json": { schema: TestResultSchema } },
      description: "Test result",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

companyConfigRouter.openapi(testSmtpRoute, async (c) => {
  const companyId = c.get("companyId");
  const user = c.get("user");

  try {
    const config = await ensureConfig(companyId);

    if (
      !config.otp_smtp_host ||
      !config.otp_smtp_port ||
      !config.otp_smtp_user ||
      !config.otp_smtp_pass_encrypted ||
      !config.otp_smtp_from
    ) {
      return c.json({ error: "SMTP nao configurado. Preencha todos os campos primeiro." }, 200);
    }

    // Get operator's email from Supabase Auth
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(user.id);
    const userEmail = authUser?.user?.email;

    if (!userEmail) {
      return c.json({ error: "Email do operador nao encontrado." }, 200);
    }

    const smtpPass = decrypt(config.otp_smtp_pass_encrypted);
    await sendEmail(
      {
        host: config.otp_smtp_host,
        port: config.otp_smtp_port,
        user: config.otp_smtp_user,
        pass: smtpPass,
        from: config.otp_smtp_from,
        tls: config.otp_smtp_tls,
      },
      userEmail,
      "Teste de email - Chega.la",
      "<h2>Teste de conexao SMTP</h2><p>Se voce recebeu este email, a configuracao SMTP esta funcionando corretamente.</p>"
    );

    return c.json({ ok: true }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return c.json({ error: message }, 200);
  }
});

// --- POST /api/company/config/detect-tls ---

const detectTlsRoute = createRoute({
  method: "post",
  path: "/company/config/detect-tls",
  tags: ["Company Config"],
  summary: "Detect TLS support",
  description:
    "Probes the given host:port to detect TLS support. Tries TLS first, falls back to plain TCP.",
  request: {
    body: {
      content: {
        "application/json": { schema: DetectTlsRequestSchema },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: DetectTlsResponseSchema } },
      description: "TLS detection result",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Invalid request data",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

companyConfigRouter.openapi(detectTlsRoute, async (c) => {
  const { host, port } = c.req.valid("json");

  // Try TLS connection first
  const tlsResult = await probeConnection(host, port, true);
  if (tlsResult) {
    return c.json({ tls: true, success: true }, 200);
  }

  // Try plain TCP connection
  const plainResult = await probeConnection(host, port, false);
  if (plainResult) {
    return c.json({ tls: false, success: true }, 200);
  }

  return c.json({ tls: false, success: false }, 200);
});

function probeConnection(host: string, port: number, useTls: boolean): Promise<boolean> {
  return new Promise((resolve) => {
    const timeout = 5000;

    if (useTls) {
      const socket = tls.connect({ host, port, rejectUnauthorized: false, timeout }, () => {
        socket.destroy();
        resolve(true);
      });
      socket.on("error", () => {
        socket.destroy();
        resolve(false);
      });
      socket.on("timeout", () => {
        socket.destroy();
        resolve(false);
      });
    } else {
      const socket = net.connect({ host, port, timeout }, () => {
        socket.destroy();
        resolve(true);
      });
      socket.on("error", () => {
        socket.destroy();
        resolve(false);
      });
      socket.on("timeout", () => {
        socket.destroy();
        resolve(false);
      });
    }
  });
}

export { companyConfigRouter };
