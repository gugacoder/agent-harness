import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { eq, and, asc, ne } from "drizzle-orm";
import type { AppType } from "../types.js";
import { authMiddleware } from "../middleware/auth.js";
import { companyMiddleware } from "../middleware/company.js";
import { db } from "../db.js";
import {
  pricingTables,
  pricingRules,
  shopPricingOverrides,
  deliveryPrices,
} from "../../db/schema/index.js";
import { evaluateRules } from "../services/pricing.service.js";

// --- Schemas ---

const PricingTableResponseSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  name: z.string(),
  active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

const PricingRuleResponseSchema = z.object({
  id: z.string().uuid(),
  pricing_table_id: z.string().uuid(),
  rule_type: z.string(),
  base_value: z.string(),
  per_km_value: z.string().nullable(),
  min_distance_km: z.string().nullable(),
  max_distance_km: z.string().nullable(),
  neighborhood: z.string().nullable(),
  surcharge_type: z.string().nullable(),
  surcharge_mode: z.string().nullable(),
  surcharge_value: z.string().nullable(),
  priority: z.number().int(),
  created_at: z.string(),
});

const SimulationResponseSchema = z.object({
  basePrice: z.string(),
  surchargeAmount: z.string(),
  totalPrice: z.string(),
  appliedRuleId: z.string().uuid(),
});

const PricingOverrideResponseSchema = z.object({
  id: z.string().uuid(),
  shop_id: z.string().uuid(),
  pricing_table_id: z.string().uuid(),
  company_id: z.string().uuid(),
  created_at: z.string(),
});

const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number().int(),
});

// --- Request Schemas ---

const CreatePricingTableRequestSchema = z.object({
  name: z.string(),
  active: z.boolean().optional(),
});

const UpdatePricingTableRequestSchema = z.object({
  name: z.string().optional(),
  active: z.boolean().optional(),
});

const CreatePricingRuleRequestSchema = z.object({
  rule_type: z.enum(["per_km", "distance_range", "neighborhood", "flat_rate", "surcharge"]),
  base_value: z.string(),
  per_km_value: z.string().nullable().optional(),
  min_distance_km: z.string().nullable().optional(),
  max_distance_km: z.string().nullable().optional(),
  neighborhood: z.string().nullable().optional(),
  surcharge_type: z.enum(["rain", "night", "weekend"]).nullable().optional(),
  surcharge_mode: z.enum(["percentage", "fixed"]).nullable().optional(),
  surcharge_value: z.string().nullable().optional(),
  priority: z.number().int(),
});

const UpdatePricingRuleRequestSchema = z.object({
  rule_type: z.enum(["per_km", "distance_range", "neighborhood", "flat_rate", "surcharge"]).optional(),
  base_value: z.string().optional(),
  per_km_value: z.string().nullable().optional(),
  min_distance_km: z.string().nullable().optional(),
  max_distance_km: z.string().nullable().optional(),
  neighborhood: z.string().nullable().optional(),
  surcharge_type: z.enum(["rain", "night", "weekend"]).nullable().optional(),
  surcharge_mode: z.enum(["percentage", "fixed"]).nullable().optional(),
  surcharge_value: z.string().nullable().optional(),
  priority: z.number().int().optional(),
});

const SimulatePriceRequestSchema = z.object({
  distance: z.number(),
  neighborhood: z.string().optional(),
});

const SetPricingOverrideRequestSchema = z.object({
  pricing_table_id: z.string().uuid(),
});

// --- Router ---

const pricingRouter = new OpenAPIHono<AppType>({
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
pricingRouter.use("/*", authMiddleware);
pricingRouter.use("/*", companyMiddleware);

// --- GET /api/pricing-tables ---

const listPricingTablesRoute = createRoute({
  method: "get",
  path: "/pricing-tables",
  tags: ["Pricing"],
  summary: "List pricing tables",
  description: "List all pricing tables for the authenticated user's company.",
  responses: {
    200: {
      content: {
        "application/json": { schema: z.array(PricingTableResponseSchema) },
      },
      description: "List of pricing tables",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

pricingRouter.openapi(listPricingTablesRoute, async (c) => {
  const companyId = c.get("companyId");

  const result = await db
    .select()
    .from(pricingTables)
    .where(eq(pricingTables.company_id, companyId));

  return c.json(
    result.map((t) => ({
      id: t.id,
      company_id: t.company_id,
      name: t.name,
      active: t.active,
      created_at: t.created_at,
      updated_at: t.updated_at,
    })),
    200
  );
});

// --- POST /api/pricing-tables ---

const createPricingTableRoute = createRoute({
  method: "post",
  path: "/pricing-tables",
  tags: ["Pricing"],
  summary: "Create pricing table",
  description: "Create a new pricing table for the company.",
  request: {
    body: {
      content: {
        "application/json": { schema: CreatePricingTableRequestSchema },
      },
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: PricingTableResponseSchema } },
      description: "Pricing table created",
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

pricingRouter.openapi(createPricingTableRoute, async (c) => {
  const body = c.req.valid("json");
  const companyId = c.get("companyId");

  // If activating this table, deactivate the currently active one
  if (body.active) {
    await db
      .update(pricingTables)
      .set({ active: false, updated_at: new Date().toISOString() })
      .where(
        and(
          eq(pricingTables.company_id, companyId),
          eq(pricingTables.active, true)
        )
      );
  }

  const [created] = await db
    .insert(pricingTables)
    .values({
      company_id: companyId,
      name: body.name,
      active: body.active ?? false,
    })
    .returning();

  return c.json(
    {
      id: created.id,
      company_id: created.company_id,
      name: created.name,
      active: created.active,
      created_at: created.created_at,
      updated_at: created.updated_at,
    },
    201
  );
});

// --- PATCH /api/pricing-tables/:id ---

const updatePricingTableRoute = createRoute({
  method: "patch",
  path: "/pricing-tables/{id}",
  tags: ["Pricing"],
  summary: "Update pricing table",
  description:
    "Update a pricing table (name and/or active). Activating a table automatically deactivates the previously active one.",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        "application/json": { schema: UpdatePricingTableRequestSchema },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: PricingTableResponseSchema } },
      description: "Pricing table updated",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Pricing table not found",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

pricingRouter.openapi(updatePricingTableRoute, async (c) => {
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");
  const companyId = c.get("companyId");

  // Verify table belongs to company
  const [existing] = await db
    .select()
    .from(pricingTables)
    .where(
      and(eq(pricingTables.id, id), eq(pricingTables.company_id, companyId))
    );

  if (!existing) {
    return c.json(
      {
        error: "Not Found",
        message: "Pricing table not found",
        statusCode: 404,
      },
      404
    );
  }

  // If activating this table, deactivate others first
  if (body.active === true) {
    await db
      .update(pricingTables)
      .set({ active: false, updated_at: new Date().toISOString() })
      .where(
        and(
          eq(pricingTables.company_id, companyId),
          eq(pricingTables.active, true),
          ne(pricingTables.id, id)
        )
      );
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (body.name !== undefined) updates.name = body.name;
  if (body.active !== undefined) updates.active = body.active;

  const [updated] = await db
    .update(pricingTables)
    .set(updates)
    .where(eq(pricingTables.id, id))
    .returning();

  return c.json(
    {
      id: updated.id,
      company_id: updated.company_id,
      name: updated.name,
      active: updated.active,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
    },
    200
  );
});

// --- DELETE /api/pricing-tables/:id ---

const deletePricingTableRoute = createRoute({
  method: "delete",
  path: "/pricing-tables/{id}",
  tags: ["Pricing"],
  summary: "Delete pricing table",
  description:
    "Delete a pricing table. Fails if the table is referenced by delivery prices.",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
      description: "Pricing table deleted",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Table is in use and cannot be deleted",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Pricing table not found",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

pricingRouter.openapi(deletePricingTableRoute, async (c) => {
  const { id } = c.req.valid("param");
  const companyId = c.get("companyId");

  // Verify table belongs to company
  const [existing] = await db
    .select()
    .from(pricingTables)
    .where(
      and(eq(pricingTables.id, id), eq(pricingTables.company_id, companyId))
    );

  if (!existing) {
    return c.json(
      {
        error: "Not Found",
        message: "Pricing table not found",
        statusCode: 404,
      },
      404
    );
  }

  // Check if table is referenced by delivery prices
  const [usedInDelivery] = await db
    .select({ id: deliveryPrices.id })
    .from(deliveryPrices)
    .where(eq(deliveryPrices.pricing_table_id, id))
    .limit(1);

  if (usedInDelivery) {
    return c.json(
      {
        error: "Bad Request",
        message: "Cannot delete pricing table that is used in deliveries",
        statusCode: 400,
      },
      400
    );
  }

  // Delete (cascade will remove rules)
  await db.delete(pricingTables).where(eq(pricingTables.id, id));

  return c.json({ message: "Pricing table deleted" }, 200);
});

// --- GET /api/pricing-tables/:id/rules ---

const listPricingRulesRoute = createRoute({
  method: "get",
  path: "/pricing-tables/{id}/rules",
  tags: ["Pricing"],
  summary: "List pricing rules",
  description: "List all rules for a pricing table, ordered by priority.",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.array(PricingRuleResponseSchema) },
      },
      description: "List of pricing rules",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Pricing table not found",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

pricingRouter.openapi(listPricingRulesRoute, async (c) => {
  const { id: tableId } = c.req.valid("param");
  const companyId = c.get("companyId");

  // Verify table belongs to company
  const [table] = await db
    .select()
    .from(pricingTables)
    .where(
      and(
        eq(pricingTables.id, tableId),
        eq(pricingTables.company_id, companyId)
      )
    );

  if (!table) {
    return c.json(
      {
        error: "Not Found",
        message: "Pricing table not found",
        statusCode: 404,
      },
      404
    );
  }

  const rules = await db
    .select()
    .from(pricingRules)
    .where(eq(pricingRules.pricing_table_id, tableId))
    .orderBy(asc(pricingRules.priority));

  return c.json(
    rules.map((r) => ({
      id: r.id,
      pricing_table_id: r.pricing_table_id,
      rule_type: r.rule_type,
      base_value: r.base_value,
      per_km_value: r.per_km_value,
      min_distance_km: r.min_distance_km,
      max_distance_km: r.max_distance_km,
      neighborhood: r.neighborhood,
      surcharge_type: r.surcharge_type,
      surcharge_mode: r.surcharge_mode,
      surcharge_value: r.surcharge_value,
      priority: r.priority,
      created_at: r.created_at,
    })),
    200
  );
});

// --- POST /api/pricing-tables/:id/rules ---

const createPricingRuleRoute = createRoute({
  method: "post",
  path: "/pricing-tables/{id}/rules",
  tags: ["Pricing"],
  summary: "Add pricing rule",
  description: "Add a new pricing rule to a table.",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        "application/json": { schema: CreatePricingRuleRequestSchema },
      },
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: PricingRuleResponseSchema } },
      description: "Pricing rule created",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Pricing table not found",
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

pricingRouter.openapi(createPricingRuleRoute, async (c) => {
  const { id: tableId } = c.req.valid("param");
  const body = c.req.valid("json");
  const companyId = c.get("companyId");

  // Verify table belongs to company
  const [table] = await db
    .select()
    .from(pricingTables)
    .where(
      and(
        eq(pricingTables.id, tableId),
        eq(pricingTables.company_id, companyId)
      )
    );

  if (!table) {
    return c.json(
      {
        error: "Not Found",
        message: "Pricing table not found",
        statusCode: 404,
      },
      404
    );
  }

  const [created] = await db
    .insert(pricingRules)
    .values({
      pricing_table_id: tableId,
      rule_type: body.rule_type,
      base_value: body.base_value,
      per_km_value: body.per_km_value ?? null,
      min_distance_km: body.min_distance_km ?? null,
      max_distance_km: body.max_distance_km ?? null,
      neighborhood: body.neighborhood ?? null,
      surcharge_type: body.surcharge_type ?? null,
      surcharge_mode: body.surcharge_mode ?? null,
      surcharge_value: body.surcharge_value ?? null,
      priority: body.priority,
    })
    .returning();

  return c.json(
    {
      id: created.id,
      pricing_table_id: created.pricing_table_id,
      rule_type: created.rule_type,
      base_value: created.base_value,
      per_km_value: created.per_km_value,
      min_distance_km: created.min_distance_km,
      max_distance_km: created.max_distance_km,
      neighborhood: created.neighborhood,
      surcharge_type: created.surcharge_type,
      surcharge_mode: created.surcharge_mode,
      surcharge_value: created.surcharge_value,
      priority: created.priority,
      created_at: created.created_at,
    },
    201
  );
});

// --- PATCH /api/pricing-rules/:id ---

const updatePricingRuleRoute = createRoute({
  method: "patch",
  path: "/pricing-rules/{id}",
  tags: ["Pricing"],
  summary: "Update pricing rule",
  description: "Update an existing pricing rule.",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        "application/json": { schema: UpdatePricingRuleRequestSchema },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: PricingRuleResponseSchema } },
      description: "Pricing rule updated",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Pricing rule not found",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

pricingRouter.openapi(updatePricingRuleRoute, async (c) => {
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");
  const companyId = c.get("companyId");

  // Verify rule belongs to a table owned by the company
  const [existing] = await db
    .select({ rule: pricingRules, table: pricingTables })
    .from(pricingRules)
    .innerJoin(pricingTables, eq(pricingRules.pricing_table_id, pricingTables.id))
    .where(
      and(eq(pricingRules.id, id), eq(pricingTables.company_id, companyId))
    );

  if (!existing) {
    return c.json(
      {
        error: "Not Found",
        message: "Pricing rule not found",
        statusCode: 404,
      },
      404
    );
  }

  const updates: Record<string, unknown> = {};
  if (body.rule_type !== undefined) updates.rule_type = body.rule_type;
  if (body.base_value !== undefined) updates.base_value = body.base_value;
  if (body.per_km_value !== undefined) updates.per_km_value = body.per_km_value;
  if (body.min_distance_km !== undefined) updates.min_distance_km = body.min_distance_km;
  if (body.max_distance_km !== undefined) updates.max_distance_km = body.max_distance_km;
  if (body.neighborhood !== undefined) updates.neighborhood = body.neighborhood;
  if (body.surcharge_type !== undefined) updates.surcharge_type = body.surcharge_type;
  if (body.surcharge_mode !== undefined) updates.surcharge_mode = body.surcharge_mode;
  if (body.surcharge_value !== undefined) updates.surcharge_value = body.surcharge_value;
  if (body.priority !== undefined) updates.priority = body.priority;

  const [updated] = await db
    .update(pricingRules)
    .set(updates)
    .where(eq(pricingRules.id, id))
    .returning();

  return c.json(
    {
      id: updated.id,
      pricing_table_id: updated.pricing_table_id,
      rule_type: updated.rule_type,
      base_value: updated.base_value,
      per_km_value: updated.per_km_value,
      min_distance_km: updated.min_distance_km,
      max_distance_km: updated.max_distance_km,
      neighborhood: updated.neighborhood,
      surcharge_type: updated.surcharge_type,
      surcharge_mode: updated.surcharge_mode,
      surcharge_value: updated.surcharge_value,
      priority: updated.priority,
      created_at: updated.created_at,
    },
    200
  );
});

// --- DELETE /api/pricing-rules/:id ---

const deletePricingRuleRoute = createRoute({
  method: "delete",
  path: "/pricing-rules/{id}",
  tags: ["Pricing"],
  summary: "Delete pricing rule",
  description: "Remove a pricing rule.",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
      description: "Pricing rule deleted",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Pricing rule not found",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

pricingRouter.openapi(deletePricingRuleRoute, async (c) => {
  const { id } = c.req.valid("param");
  const companyId = c.get("companyId");

  // Verify rule belongs to a table owned by the company
  const [existing] = await db
    .select({ rule: pricingRules })
    .from(pricingRules)
    .innerJoin(pricingTables, eq(pricingRules.pricing_table_id, pricingTables.id))
    .where(
      and(eq(pricingRules.id, id), eq(pricingTables.company_id, companyId))
    );

  if (!existing) {
    return c.json(
      {
        error: "Not Found",
        message: "Pricing rule not found",
        statusCode: 404,
      },
      404
    );
  }

  await db.delete(pricingRules).where(eq(pricingRules.id, id));

  return c.json({ message: "Pricing rule deleted" }, 200);
});

// --- POST /api/pricing-tables/:id/simulate ---

const simulatePriceRoute = createRoute({
  method: "post",
  path: "/pricing-tables/{id}/simulate",
  tags: ["Pricing"],
  summary: "Simulate price calculation",
  description:
    "Simulate price calculation for a given distance and optional neighborhood. Does not persist anything.",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        "application/json": { schema: SimulatePriceRequestSchema },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: SimulationResponseSchema } },
      description: "Simulated price result",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "No matching rules for the given parameters",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Pricing table not found",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

pricingRouter.openapi(simulatePriceRoute, async (c) => {
  const { id: tableId } = c.req.valid("param");
  const body = c.req.valid("json");
  const companyId = c.get("companyId");

  // Verify table belongs to company
  const [table] = await db
    .select()
    .from(pricingTables)
    .where(
      and(
        eq(pricingTables.id, tableId),
        eq(pricingTables.company_id, companyId)
      )
    );

  if (!table) {
    return c.json(
      {
        error: "Not Found",
        message: "Pricing table not found",
        statusCode: 404,
      },
      404
    );
  }

  const rules = await db
    .select()
    .from(pricingRules)
    .where(eq(pricingRules.pricing_table_id, tableId))
    .orderBy(asc(pricingRules.priority));

  const result = evaluateRules(
    rules,
    body.distance,
    body.neighborhood || ""
  );

  if (!result) {
    return c.json(
      {
        error: "Bad Request",
        message: "No matching pricing rules for the given parameters",
        statusCode: 400,
      },
      400
    );
  }

  return c.json(
    {
      basePrice: result.basePrice.toFixed(2),
      surchargeAmount: result.surchargeAmount.toFixed(2),
      totalPrice: result.totalPrice.toFixed(2),
      appliedRuleId: result.appliedRuleId,
    },
    200
  );
});

// --- GET /api/shops/:id/pricing-override ---

const getPricingOverrideRoute = createRoute({
  method: "get",
  path: "/shops/{id}/pricing-override",
  tags: ["Pricing"],
  summary: "Get shop pricing override",
  description: "Get the pricing table override for a specific shop.",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: PricingOverrideResponseSchema },
      },
      description: "Shop pricing override",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Override not found for this shop",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

pricingRouter.openapi(getPricingOverrideRoute, async (c) => {
  const { id: shopId } = c.req.valid("param");
  const companyId = c.get("companyId");

  const [override] = await db
    .select()
    .from(shopPricingOverrides)
    .where(
      and(
        eq(shopPricingOverrides.shop_id, shopId),
        eq(shopPricingOverrides.company_id, companyId)
      )
    );

  if (!override) {
    return c.json(
      {
        error: "Not Found",
        message: "No pricing override found for this shop",
        statusCode: 404,
      },
      404
    );
  }

  return c.json(
    {
      id: override.id,
      shop_id: override.shop_id,
      pricing_table_id: override.pricing_table_id,
      company_id: override.company_id,
      created_at: override.created_at,
    },
    200
  );
});

// --- PUT /api/shops/:id/pricing-override ---

const setPricingOverrideRoute = createRoute({
  method: "put",
  path: "/shops/{id}/pricing-override",
  tags: ["Pricing"],
  summary: "Set shop pricing override",
  description:
    "Set or update the pricing table override for a specific shop. Upserts: creates if not exists, updates if exists.",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        "application/json": { schema: SetPricingOverrideRequestSchema },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: PricingOverrideResponseSchema },
      },
      description: "Shop pricing override set",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Pricing table not found",
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

pricingRouter.openapi(setPricingOverrideRoute, async (c) => {
  const { id: shopId } = c.req.valid("param");
  const body = c.req.valid("json");
  const companyId = c.get("companyId");

  // Verify pricing table belongs to company
  const [table] = await db
    .select()
    .from(pricingTables)
    .where(
      and(
        eq(pricingTables.id, body.pricing_table_id),
        eq(pricingTables.company_id, companyId)
      )
    );

  if (!table) {
    return c.json(
      {
        error: "Not Found",
        message: "Pricing table not found",
        statusCode: 404,
      },
      404
    );
  }

  // Upsert: check existing override
  const [existing] = await db
    .select()
    .from(shopPricingOverrides)
    .where(eq(shopPricingOverrides.shop_id, shopId));

  let override;
  if (existing) {
    [override] = await db
      .update(shopPricingOverrides)
      .set({ pricing_table_id: body.pricing_table_id })
      .where(eq(shopPricingOverrides.id, existing.id))
      .returning();
  } else {
    [override] = await db
      .insert(shopPricingOverrides)
      .values({
        shop_id: shopId,
        pricing_table_id: body.pricing_table_id,
        company_id: companyId,
      })
      .returning();
  }

  return c.json(
    {
      id: override.id,
      shop_id: override.shop_id,
      pricing_table_id: override.pricing_table_id,
      company_id: override.company_id,
      created_at: override.created_at,
    },
    200
  );
});

// --- DELETE /api/shops/:id/pricing-override ---

const deletePricingOverrideRoute = createRoute({
  method: "delete",
  path: "/shops/{id}/pricing-override",
  tags: ["Pricing"],
  summary: "Remove shop pricing override",
  description:
    "Remove the pricing table override for a shop, reverting to the company's active table.",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
      description: "Override removed",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Override not found for this shop",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

pricingRouter.openapi(deletePricingOverrideRoute, async (c) => {
  const { id: shopId } = c.req.valid("param");
  const companyId = c.get("companyId");

  const [existing] = await db
    .select()
    .from(shopPricingOverrides)
    .where(
      and(
        eq(shopPricingOverrides.shop_id, shopId),
        eq(shopPricingOverrides.company_id, companyId)
      )
    );

  if (!existing) {
    return c.json(
      {
        error: "Not Found",
        message: "No pricing override found for this shop",
        statusCode: 404,
      },
      404
    );
  }

  await db
    .delete(shopPricingOverrides)
    .where(eq(shopPricingOverrides.id, existing.id));

  return c.json({ message: "Pricing override removed" }, 200);
});

export { pricingRouter };
