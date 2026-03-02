import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import type { AppType } from "../types.js";
import { authMiddleware } from "../middleware/auth.js";
import { companyMiddleware } from "../middleware/company.js";
import { requireRole } from "../middleware/role.js";
import { db } from "../db.js";
import { companies } from "../../db/schema/index.js";

// --- Schemas ---

const CompanyStatusEnum = z.enum(["active", "suspended"]);

const CompanyResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  cnpj: z.string().nullable(),
  phone: z.string(),
  email: z.string(),
  address: z.string(),
  lat: z.string(),
  lng: z.string(),
  logo_url: z.string().nullable(),
  status: CompanyStatusEnum,
  created_at: z.string(),
  updated_at: z.string(),
});

const CreateCompanyRequestSchema = z.object({
  name: z.string().min(1),
  cnpj: z.string().optional(),
  phone: z.string().min(1),
  email: z.string().email(),
  address: z.string().min(1),
  lat: z.string(),
  lng: z.string(),
});

const UpdateCompanyRequestSchema = z.object({
  name: z.string().min(1).optional(),
  cnpj: z.string().optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional(),
  address: z.string().min(1).optional(),
  lat: z.string().optional(),
  lng: z.string().optional(),
  logo_url: z.string().url().nullable().optional(),
  status: CompanyStatusEnum.optional(),
});

const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number().int(),
});

// --- Router ---

const companiesRouter = new OpenAPIHono<AppType>({
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
companiesRouter.use("/companies/*", authMiddleware);
companiesRouter.use("/companies/*", companyMiddleware);
companiesRouter.use("/companies/*", requireRole("operator", "super_admin"));

// --- POST /api/companies ---

const createCompanyRoute = createRoute({
  method: "post",
  path: "/companies",
  tags: ["Companies"],
  summary: "Create a company",
  description:
    "Register company data for the authenticated user's company. Uses the company_id from the user's JWT.",
  request: {
    body: {
      content: {
        "application/json": { schema: CreateCompanyRequestSchema },
      },
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: CompanyResponseSchema } },
      description: "Company created successfully",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Invalid request data",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
    409: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Company already exists",
    },
  },
});

companiesRouter.openapi(createCompanyRoute, async (c) => {
  const body = c.req.valid("json");
  const companyId = c.get("companyId");

  // Check if company already exists
  const existing = await db
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);

  if (existing.length > 0) {
    return c.json(
      {
        error: "Conflict",
        message: "Company already exists",
        statusCode: 409,
      },
      409
    );
  }

  const [created] = await db
    .insert(companies)
    .values({
      id: companyId,
      name: body.name,
      cnpj: body.cnpj ?? null,
      phone: body.phone,
      email: body.email,
      address: body.address,
      lat: body.lat,
      lng: body.lng,
    })
    .returning();

  return c.json(
    {
      id: created.id,
      name: created.name,
      cnpj: created.cnpj,
      phone: created.phone,
      email: created.email,
      address: created.address,
      lat: created.lat,
      lng: created.lng,
      logo_url: created.logo_url,
      status: created.status,
      created_at: created.created_at,
      updated_at: created.updated_at,
    },
    201
  );
});

// --- PATCH /api/companies/:id ---

const updateCompanyRoute = createRoute({
  method: "patch",
  path: "/companies/{id}",
  tags: ["Companies"],
  summary: "Update a company",
  description:
    "Update company data. Company middleware ensures the user can only update their own company.",
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        "application/json": { schema: UpdateCompanyRequestSchema },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: CompanyResponseSchema } },
      description: "Company updated successfully",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Invalid request data",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
    403: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Cross-tenant access denied",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Company not found",
    },
  },
});

companiesRouter.openapi(updateCompanyRoute, async (c) => {
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");
  const companyId = c.get("companyId");

  // Enforce multi-tenancy: can only update own company
  if (id !== companyId) {
    return c.json(
      {
        error: "Forbidden",
        message: "Access denied: cross-tenant access is not allowed",
        statusCode: 403,
      },
      403
    );
  }

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.name !== undefined) updateData.name = body.name;
  if (body.cnpj !== undefined) updateData.cnpj = body.cnpj;
  if (body.phone !== undefined) updateData.phone = body.phone;
  if (body.email !== undefined) updateData.email = body.email;
  if (body.address !== undefined) updateData.address = body.address;
  if (body.lat !== undefined) updateData.lat = body.lat;
  if (body.lng !== undefined) updateData.lng = body.lng;
  if (body.logo_url !== undefined) updateData.logo_url = body.logo_url;
  if (body.status !== undefined) updateData.status = body.status;

  const [updated] = await db
    .update(companies)
    .set(updateData)
    .where(eq(companies.id, id))
    .returning();

  if (!updated) {
    return c.json(
      {
        error: "Not Found",
        message: "Company not found",
        statusCode: 404,
      },
      404
    );
  }

  return c.json(
    {
      id: updated.id,
      name: updated.name,
      cnpj: updated.cnpj,
      phone: updated.phone,
      email: updated.email,
      address: updated.address,
      lat: updated.lat,
      lng: updated.lng,
      logo_url: updated.logo_url,
      status: updated.status,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
    },
    200
  );
});

export { companiesRouter };
