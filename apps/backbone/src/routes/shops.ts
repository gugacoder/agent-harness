import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { eq, and } from "drizzle-orm";
import type { AppType } from "../types.js";
import { authMiddleware } from "../middleware/auth.js";
import { companyMiddleware } from "../middleware/company.js";
import { db } from "../db.js";
import { shops } from "../../db/schema/index.js";

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

// Apply auth + company middleware
shopsRouter.use("/*", authMiddleware);
shopsRouter.use("/*", companyMiddleware);

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

export { shopsRouter };
