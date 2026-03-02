import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import type { AppType } from "../types.js";
import { authMiddleware } from "../middleware/auth.js";
import { companyMiddleware } from "../middleware/company.js";
import { requireRole } from "../middleware/role.js";
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

// Apply auth + company + role middleware
companyConfigRouter.use("/*", authMiddleware);
companyConfigRouter.use("/*", companyMiddleware);
companyConfigRouter.use("/*", requireRole("operator", "super_admin"));

// --- Helper: ensure config exists (upsert with defaults) ---

async function ensureConfig(companyId: string) {
  const [existing] = await db
    .select()
    .from(companyConfigs)
    .where(eq(companyConfigs.company_id, companyId));

  if (existing) return existing;

  const [created] = await db
    .insert(companyConfigs)
    .values({ company_id: companyId })
    .returning();

  return created;
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
  },
});

companyConfigRouter.openapi(getCompanyConfigRoute, async (c) => {
  const companyId = c.get("companyId");

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
  },
});

companyConfigRouter.openapi(updateCompanyConfigRoute, async (c) => {
  const companyId = c.get("companyId");
  const body = c.req.valid("json");

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
});

export { companyConfigRouter };
