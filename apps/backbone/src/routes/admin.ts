import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { eq, and, sql, ilike, or, gte, count } from "drizzle-orm";
import type { AppType } from "../types.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { db } from "../db.js";
import {
  companies,
  profiles,
  deliveries,
  orders,
  companyConfigs,
} from "../../db/schema/index.js";
import {
  ListCompaniesQuerySchema,
  CreateCompanySchema,
  UpdateCompanySchema,
} from "@chegala/schemas";

// --- Response Schemas ---

const AdminCompanyResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  cnpj: z.string().nullable(),
  status: z.enum(["active", "suspended"]),
  created_at: z.string(),
  total_users: z.number(),
  total_deliveries: z.number(),
  total_orders: z.number(),
});

const AdminCompanyDetailSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  cnpj: z.string().nullable(),
  phone: z.string(),
  email: z.string(),
  address: z.string(),
  lat: z.string(),
  lng: z.string(),
  logo_url: z.string().nullable(),
  status: z.enum(["active", "suspended"]),
  created_at: z.string(),
  updated_at: z.string(),
});

const CompaniesListResponseSchema = z.object({
  companies: z.array(AdminCompanyResponseSchema),
});

const SingleCompanyResponseSchema = z.object({
  company: AdminCompanyDetailSchema,
});

const MetricsResponseSchema = z.object({
  total_companies: z.number(),
  total_deliveries_today: z.number(),
  total_deliveries_week: z.number(),
  total_deliveries_month: z.number(),
  total_users: z.number(),
  deliveries_per_day: z.array(
    z.object({
      date: z.string(),
      count: z.number(),
    })
  ),
});

const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number().int(),
});

// --- Router ---

const adminRouter = new OpenAPIHono<AppType>({
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

// Auth middleware only — no companyMiddleware (super_admin has no company)
adminRouter.use("/admin/*", authMiddleware);
adminRouter.use("/admin/*", requireRole("super_admin"));

// --- GET /admin/companies ---

const listCompaniesRoute = createRoute({
  method: "get",
  path: "/admin/companies",
  tags: ["Admin"],
  summary: "List all companies with aggregate counts",
  description:
    "Returns all companies with total_users, total_deliveries, total_orders counts. Supports filtering by status and search by name/CNPJ.",
  request: {
    query: ListCompaniesQuerySchema,
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: CompaniesListResponseSchema },
      },
      description: "Companies listed successfully",
    },
  },
});

adminRouter.openapi(listCompaniesRoute, async (c) => {
  const query = c.req.valid("query");

  // Build conditions
  const conditions: ReturnType<typeof eq>[] = [];

  if (query.status) {
    conditions.push(eq(companies.status, query.status));
  }

  if (query.search) {
    conditions.push(
      or(
        ilike(companies.name, `%${query.search}%`),
        ilike(companies.cnpj, `%${query.search}%`)
      )!
    );
  }

  const whereClause =
    conditions.length > 0 ? and(...conditions) : undefined;

  // Fetch companies with aggregate counts via subqueries
  const companyList = await db
    .select({
      id: companies.id,
      name: companies.name,
      cnpj: companies.cnpj,
      status: companies.status,
      created_at: companies.created_at,
      total_users: sql<number>`coalesce((select count(*) from profiles where profiles.company_id = ${companies.id}), 0)`.as("total_users"),
      total_deliveries: sql<number>`coalesce((select count(*) from deliveries where deliveries.company_id = ${companies.id}), 0)`.as("total_deliveries"),
      total_orders: sql<number>`coalesce((select count(*) from orders where orders.company_id = ${companies.id}), 0)`.as("total_orders"),
    })
    .from(companies)
    .where(whereClause)
    .orderBy(companies.name);

  return c.json(
    {
      companies: companyList.map((co) => ({
        id: co.id,
        name: co.name,
        cnpj: co.cnpj,
        status: co.status,
        created_at: co.created_at,
        total_users: Number(co.total_users),
        total_deliveries: Number(co.total_deliveries),
        total_orders: Number(co.total_orders),
      })),
    },
    200
  );
});

// --- POST /admin/companies ---

const createCompanyRoute = createRoute({
  method: "post",
  path: "/admin/companies",
  tags: ["Admin"],
  summary: "Create a new company",
  description:
    "Creates a new company with default company_configs. Validates unique CNPJ.",
  request: {
    body: {
      content: {
        "application/json": { schema: CreateCompanySchema },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": { schema: SingleCompanyResponseSchema },
      },
      description: "Company created successfully",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Invalid request data",
    },
    409: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "CNPJ already exists",
    },
  },
});

adminRouter.openapi(createCompanyRoute, async (c) => {
  const body = c.req.valid("json");

  // Validate unique CNPJ
  if (body.cnpj) {
    const [existing] = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.cnpj, body.cnpj))
      .limit(1);

    if (existing) {
      return c.json(
        {
          error: "Conflict",
          message: "Uma empresa com este CNPJ ja existe",
          statusCode: 409,
        },
        409
      );
    }
  }

  // Create company
  const [created] = await db
    .insert(companies)
    .values({
      name: body.name,
      cnpj: body.cnpj,
      phone: body.phone ?? "",
      email: body.email ?? "",
      address: body.address ?? "",
      lat: "0",
      lng: "0",
    })
    .returning();

  // Create default company_configs
  await db.insert(companyConfigs).values({
    company_id: created.id,
  });

  return c.json(
    {
      company: {
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
    },
    201
  );
});

// --- PATCH /admin/companies/:id ---

const updateCompanyRoute = createRoute({
  method: "patch",
  path: "/admin/companies/{id}",
  tags: ["Admin"],
  summary: "Update company data or status",
  description:
    "Update company fields or change status to active/suspended.",
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        "application/json": { schema: UpdateCompanySchema },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: SingleCompanyResponseSchema },
      },
      description: "Company updated successfully",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Validation error",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Company not found",
    },
  },
});

adminRouter.openapi(updateCompanyRoute, async (c) => {
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");

  // Build update object
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.name !== undefined) updateData.name = body.name;
  if (body.phone !== undefined) updateData.phone = body.phone;
  if (body.email !== undefined) updateData.email = body.email;
  if (body.address !== undefined) updateData.address = body.address;
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
        message: "Empresa nao encontrada",
        statusCode: 404,
      },
      404
    );
  }

  return c.json(
    {
      company: {
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
    },
    200
  );
});

// --- GET /admin/metrics ---

const metricsRoute = createRoute({
  method: "get",
  path: "/admin/metrics",
  tags: ["Admin"],
  summary: "Get global admin metrics",
  description:
    "Returns total companies, deliveries (today/week/month), active users, and deliveries per day for the last 30 days.",
  responses: {
    200: {
      content: { "application/json": { schema: MetricsResponseSchema } },
      description: "Metrics retrieved successfully",
    },
  },
});

adminRouter.openapi(metricsRoute, async (c) => {
  const now = new Date();

  // Start of today (UTC)
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  ).toISOString();

  // Start of current week (Monday)
  const dayOfWeek = now.getUTCDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - mondayOffset
    )
  ).toISOString();

  // Start of current month
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  ).toISOString();

  // 30 days ago
  const thirtyDaysAgo = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - 29
    )
  ).toISOString();

  // Run all queries in parallel
  const [
    companiesCount,
    deliveriesToday,
    deliveriesWeek,
    deliveriesMonth,
    usersCount,
    deliveriesPerDay,
  ] = await Promise.all([
    // Total active companies
    db
      .select({ count: count() })
      .from(companies)
      .where(eq(companies.status, "active"))
      .then((r) => r[0]?.count ?? 0),

    // Deliveries today
    db
      .select({ count: count() })
      .from(deliveries)
      .where(gte(deliveries.created_at, todayStart))
      .then((r) => r[0]?.count ?? 0),

    // Deliveries this week
    db
      .select({ count: count() })
      .from(deliveries)
      .where(gte(deliveries.created_at, weekStart))
      .then((r) => r[0]?.count ?? 0),

    // Deliveries this month
    db
      .select({ count: count() })
      .from(deliveries)
      .where(gte(deliveries.created_at, monthStart))
      .then((r) => r[0]?.count ?? 0),

    // Total active users
    db
      .select({ count: count() })
      .from(profiles)
      .where(eq(profiles.active, true))
      .then((r) => r[0]?.count ?? 0),

    // Deliveries per day (last 30 days)
    db
      .select({
        date: sql<string>`date(${deliveries.created_at})`.as("date"),
        count: count(),
      })
      .from(deliveries)
      .where(gte(deliveries.created_at, thirtyDaysAgo))
      .groupBy(sql`date(${deliveries.created_at})`)
      .orderBy(sql`date(${deliveries.created_at})`),
  ]);

  return c.json(
    {
      total_companies: Number(companiesCount),
      total_deliveries_today: Number(deliveriesToday),
      total_deliveries_week: Number(deliveriesWeek),
      total_deliveries_month: Number(deliveriesMonth),
      total_users: Number(usersCount),
      deliveries_per_day: deliveriesPerDay.map((d) => ({
        date: d.date,
        count: Number(d.count),
      })),
    },
    200
  );
});

export { adminRouter };
