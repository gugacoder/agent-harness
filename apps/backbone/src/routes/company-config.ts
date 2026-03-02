import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import type { AppType } from "../types.js";
import { authMiddleware } from "../middleware/auth.js";
import { companyMiddleware } from "../middleware/company.js";
import { db } from "../db.js";
import { companyConfigs } from "../../db/schema/index.js";

// --- Schemas ---

const CompanyConfigResponseSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  pod_required: z.boolean(),
  default_closing_period: z.string(),
  default_invoice_period: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

const UpdateCompanyConfigRequestSchema = z.object({
  pod_required: z.boolean().optional(),
  default_closing_period: z.enum(["daily", "weekly", "monthly"]).optional(),
  default_invoice_period: z.enum(["daily", "weekly", "monthly"]).optional(),
});

const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number().int(),
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

// Apply auth + company middleware
companyConfigRouter.use("/*", authMiddleware);
companyConfigRouter.use("/*", companyMiddleware);

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

// --- GET /api/company/config ---

const getCompanyConfigRoute = createRoute({
  method: "get",
  path: "/company/config",
  tags: ["Company Config"],
  summary: "Get company configuration",
  description:
    "Returns the company configuration. Creates one with defaults if it does not exist yet.",
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

  try {
    const config = await ensureConfig(companyId);

    return c.json(
      {
        id: config.id,
        company_id: config.company_id,
        pod_required: config.pod_required,
        default_closing_period: config.default_closing_period,
        default_invoice_period: config.default_invoice_period,
        created_at: config.created_at,
        updated_at: config.updated_at,
      },
      200
    );
  } catch (err) {
    console.error("Error fetching company config:", err);
    const message =
      err instanceof Error ? err.message : "Failed to load company configuration";
    return c.json(
      { error: "Internal Server Error", message, statusCode: 500 },
      500
    );
  }
});

// --- PATCH /api/company/config ---

const updateCompanyConfigRoute = createRoute({
  method: "patch",
  path: "/company/config",
  tags: ["Company Config"],
  summary: "Update company configuration",
  description:
    "Update company configuration fields (pod_required, default_closing_period, default_invoice_period). Creates config with defaults first if it does not exist.",
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
    if (body.pod_required !== undefined) updates.pod_required = body.pod_required;
    if (body.default_closing_period !== undefined)
      updates.default_closing_period = body.default_closing_period;
    if (body.default_invoice_period !== undefined)
      updates.default_invoice_period = body.default_invoice_period;

    const [updated] = await db
      .update(companyConfigs)
      .set(updates)
      .where(eq(companyConfigs.id, config.id))
      .returning();

    return c.json(
      {
        id: updated.id,
        company_id: updated.company_id,
        pod_required: updated.pod_required,
        default_closing_period: updated.default_closing_period,
        default_invoice_period: updated.default_invoice_period,
        created_at: updated.created_at,
        updated_at: updated.updated_at,
      },
      200
    );
  } catch (err) {
    console.error("Error updating company config:", err);
    const message =
      err instanceof Error ? err.message : "Failed to update company configuration";
    return c.json(
      { error: "Internal Server Error", message, statusCode: 500 },
      500
    );
  }
});

export { companyConfigRouter };
