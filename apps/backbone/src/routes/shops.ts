import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { eq, and } from "drizzle-orm";
import type { AppType } from "../types.js";
import { authMiddleware } from "../middleware/auth.js";
import { companyMiddleware } from "../middleware/company.js";
import { requireRole } from "../middleware/role.js";
import { db } from "../db.js";
import { shops } from "../../db/schema/index.js";
import {
  getShopById,
  updateShop,
  toggleShopStatus,
  getShopOrders,
  getShopFinancialSummary,
} from "../services/shop.service.js";

// --- Schemas ---

const ShopResponseSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  profile_id: z.string().uuid(),
  trade_name: z.string(),
  phone: z.string(),
  address: z.string(),
  lat: z.string(),
  lng: z.string(),
  active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

const CreateShopRequestSchema = z.object({
  profile_id: z.string().uuid(),
  trade_name: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().min(1),
  lat: z.string(),
  lng: z.string(),
});

const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number().int(),
});

// --- Router ---

const shopsRouter = new OpenAPIHono<AppType>({
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
shopsRouter.use("/*", authMiddleware);
shopsRouter.use("/*", companyMiddleware);
shopsRouter.use("/*", requireRole("operator", "super_admin"));

// --- GET /api/shops ---

const listShopsRoute = createRoute({
  method: "get",
  path: "/shops",
  tags: ["Shops"],
  summary: "List shops",
  description:
    "List all shops for the authenticated user's company. Filtered by company_id for multi-tenancy isolation.",
  responses: {
    200: {
      content: {
        "application/json": { schema: z.array(ShopResponseSchema) },
      },
      description: "List of shops",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

shopsRouter.openapi(listShopsRoute, async (c) => {
  const companyId = c.get("companyId");

  const result = await db
    .select()
    .from(shops)
    .where(eq(shops.company_id, companyId));

  return c.json(
    result.map((shop) => ({
      id: shop.id,
      company_id: shop.company_id,
      profile_id: shop.profile_id,
      trade_name: shop.trade_name,
      phone: shop.phone,
      address: shop.address,
      lat: shop.lat,
      lng: shop.lng,
      active: shop.active,
      created_at: shop.created_at,
      updated_at: shop.updated_at,
    })),
    200
  );
});

// --- POST /api/shops ---

const createShopRoute = createRoute({
  method: "post",
  path: "/shops",
  tags: ["Shops"],
  summary: "Create a shop",
  description:
    "Register a new shop (lojista) under the authenticated user's company.",
  request: {
    body: {
      content: {
        "application/json": { schema: CreateShopRequestSchema },
      },
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: ShopResponseSchema } },
      description: "Shop created successfully",
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

shopsRouter.openapi(createShopRoute, async (c) => {
  const body = c.req.valid("json");
  const companyId = c.get("companyId");

  const [created] = await db
    .insert(shops)
    .values({
      company_id: companyId,
      profile_id: body.profile_id,
      trade_name: body.trade_name,
      phone: body.phone,
      address: body.address,
      lat: body.lat,
      lng: body.lng,
    })
    .returning();

  return c.json(
    {
      id: created.id,
      company_id: created.company_id,
      profile_id: created.profile_id,
      trade_name: created.trade_name,
      phone: created.phone,
      address: created.address,
      lat: created.lat,
      lng: created.lng,
      active: created.active,
      created_at: created.created_at,
      updated_at: created.updated_at,
    },
    201
  );
});

// --- Schemas for new routes ---

const ShopDetailResponseSchema = ShopResponseSchema.extend({
  contact_name: z.string().nullable(),
  total_orders: z.number().int(),
  last_order_date: z.string().nullable(),
});

const UpdateShopRequestSchema = z.object({
  trade_name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  lat: z.string().optional(),
  lng: z.string().optional(),
  contact_name: z.string().nullable().optional(),
});

const ToggleStatusRequestSchema = z.object({
  active: z.boolean(),
});

const OrderResponseSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  shop_id: z.string().uuid().nullable(),
  order_number: z.number().int(),
  status: z.string(),
  pickup_address: z.string(),
  delivery_address: z.string(),
  recipient_name: z.string(),
  recipient_phone: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

const PaginatedOrdersResponseSchema = z.object({
  data: z.array(OrderResponseSchema),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
});

const FinancialSummaryResponseSchema = z.object({
  total_invoiced: z.string(),
  total_pending: z.string(),
  last_payment_date: z.string().nullable(),
});

// --- GET /api/shops/:id ---

const getShopRoute = createRoute({
  method: "get",
  path: "/shops/{id}",
  tags: ["Shops"],
  summary: "Get shop details",
  description: "Get shop details with total orders and last order date.",
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: ShopDetailResponseSchema } },
      description: "Shop details",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Shop not found",
    },
  },
});

shopsRouter.openapi(getShopRoute, async (c) => {
  const { id } = c.req.valid("param");
  const companyId = c.get("companyId");

  const shop = await getShopById(id, companyId);
  if (!shop) {
    return c.json(
      { error: "Not Found", message: "Shop not found", statusCode: 404 },
      404
    );
  }

  return c.json(
    {
      id: shop.id,
      company_id: shop.company_id,
      profile_id: shop.profile_id,
      trade_name: shop.trade_name,
      phone: shop.phone,
      address: shop.address,
      lat: shop.lat,
      lng: shop.lng,
      contact_name: shop.contact_name,
      active: shop.active,
      created_at: shop.created_at,
      updated_at: shop.updated_at,
      total_orders: shop.total_orders,
      last_order_date: shop.last_order_date,
    },
    200
  );
});

// --- PATCH /api/shops/:id ---

const updateShopRoute = createRoute({
  method: "patch",
  path: "/shops/{id}",
  tags: ["Shops"],
  summary: "Update a shop",
  description:
    "Update allowed shop fields: trade_name, phone, address, lat, lng, contact_name.",
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: { "application/json": { schema: UpdateShopRequestSchema } },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: ShopResponseSchema } },
      description: "Shop updated",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Invalid request data",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Shop not found",
    },
  },
});

shopsRouter.openapi(updateShopRoute, async (c) => {
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");
  const companyId = c.get("companyId");

  const updated = await updateShop(id, companyId, body);
  if (!updated) {
    return c.json(
      { error: "Not Found", message: "Shop not found", statusCode: 404 },
      404
    );
  }

  return c.json(
    {
      id: updated.id,
      company_id: updated.company_id,
      profile_id: updated.profile_id,
      trade_name: updated.trade_name,
      phone: updated.phone,
      address: updated.address,
      lat: updated.lat,
      lng: updated.lng,
      active: updated.active,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
    },
    200
  );
});

// --- PATCH /api/shops/:id/status ---

const toggleStatusRoute = createRoute({
  method: "patch",
  path: "/shops/{id}/status",
  tags: ["Shops"],
  summary: "Toggle shop active status",
  description: "Activate or deactivate a shop.",
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: { "application/json": { schema: ToggleStatusRequestSchema } },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: ShopResponseSchema } },
      description: "Shop status updated",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Shop not found",
    },
  },
});

shopsRouter.openapi(toggleStatusRoute, async (c) => {
  const { id } = c.req.valid("param");
  const { active } = c.req.valid("json");
  const companyId = c.get("companyId");

  const updated = await toggleShopStatus(id, companyId, active);
  if (!updated) {
    return c.json(
      { error: "Not Found", message: "Shop not found", statusCode: 404 },
      404
    );
  }

  return c.json(
    {
      id: updated.id,
      company_id: updated.company_id,
      profile_id: updated.profile_id,
      trade_name: updated.trade_name,
      phone: updated.phone,
      address: updated.address,
      lat: updated.lat,
      lng: updated.lng,
      active: updated.active,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
    },
    200
  );
});

// --- GET /api/shops/:id/orders ---

const getShopOrdersRoute = createRoute({
  method: "get",
  path: "/shops/{id}/orders",
  tags: ["Shops"],
  summary: "Get shop orders",
  description: "Get paginated orders for a shop.",
  request: {
    params: z.object({ id: z.string().uuid() }),
    query: z.object({
      limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
      offset: z.coerce.number().int().min(0).default(0).optional(),
      status: z.string().optional(),
      period: z.coerce.number().int().min(1).default(30).optional(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: PaginatedOrdersResponseSchema },
      },
      description: "Paginated orders",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

shopsRouter.openapi(getShopOrdersRoute, async (c) => {
  const { id } = c.req.valid("param");
  const query = c.req.valid("query");
  const companyId = c.get("companyId");

  const result = await getShopOrders(id, companyId, {
    limit: query.limit,
    offset: query.offset,
    status: query.status,
    period: query.period,
  });

  return c.json(
    {
      data: result.data.map((o) => ({
        id: o.id,
        company_id: o.company_id,
        shop_id: o.shop_id,
        order_number: o.order_number,
        status: o.status,
        pickup_address: o.pickup_address,
        delivery_address: o.delivery_address,
        recipient_name: o.recipient_name,
        recipient_phone: o.recipient_phone,
        created_at: o.created_at,
        updated_at: o.updated_at,
      })),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    },
    200
  );
});

// --- GET /api/shops/:id/financial-summary ---

const financialSummaryRoute = createRoute({
  method: "get",
  path: "/shops/{id}/financial-summary",
  tags: ["Shops"],
  summary: "Get shop financial summary",
  description:
    "Get financial summary: total invoiced, total pending, last payment date.",
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: FinancialSummaryResponseSchema },
      },
      description: "Financial summary",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

shopsRouter.openapi(financialSummaryRoute, async (c) => {
  const { id } = c.req.valid("param");
  const companyId = c.get("companyId");

  const summary = await getShopFinancialSummary(id, companyId);

  return c.json(summary, 200);
});

export { shopsRouter };
