import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { eq, and, gte, lte, sql, desc, count, sum } from "drizzle-orm";
import type { AppType } from "../types.js";
import { authMiddleware } from "../middleware/auth.js";
import { companyMiddleware } from "../middleware/company.js";
import { requireRole } from "../middleware/role.js";
import { db } from "../db.js";
import {
  deliveries,
  deliveryPrices,
  orders,
  shops,
  couriers,
  financialClosingItems,
  financialClosings,
} from "../../db/schema/index.js";

// --- Schemas ---

const EarningItemResponseSchema = z.object({
  delivery_id: z.string().uuid(),
  delivered_at: z.string(),
  shop_name: z.string().nullable(),
  distance_km: z.string().nullable(),
  value: z.string(),
  closing_status: z.string().nullable(),
});

const EarningsQuerySchema = z.object({
  period_start: z.string().optional(),
  period_end: z.string().optional(),
});

const EarningsSummaryResponseSchema = z.object({
  today: z.object({
    total_amount: z.string(),
    total_deliveries: z.number().int(),
  }),
  week: z.object({
    total_amount: z.string(),
    total_deliveries: z.number().int(),
  }),
  month: z.object({
    total_amount: z.string(),
    total_deliveries: z.number().int(),
  }),
});

const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number().int(),
});

// --- Router ---

const earningsRouter = new OpenAPIHono<AppType>({
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

earningsRouter.use("/couriers/me/earnings/*", authMiddleware);
earningsRouter.use("/couriers/me/earnings/*", companyMiddleware);
earningsRouter.use("/couriers/me/earnings/*", requireRole("courier", "super_admin"));
earningsRouter.use("/couriers/me/earnings", authMiddleware);
earningsRouter.use("/couriers/me/earnings", companyMiddleware);
earningsRouter.use("/couriers/me/earnings", requireRole("courier", "super_admin"));

// --- Helper: find courier by profile_id (JWT sub) ---

async function findCourierByUserId(userId: string, companyId: string) {
  const [courier] = await db
    .select({ id: couriers.id })
    .from(couriers)
    .where(
      and(eq(couriers.profile_id, userId), eq(couriers.company_id, companyId))
    );
  return courier ?? null;
}

// --- GET /api/couriers/me/earnings ---

const listEarningsRoute = createRoute({
  method: "get",
  path: "/couriers/me/earnings",
  tags: ["Earnings"],
  summary: "List courier earnings",
  description:
    "List delivered deliveries for the authenticated courier with date, shop name, distance, value, and closing status. Supports period filtering.",
  request: {
    query: EarningsQuerySchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(EarningItemResponseSchema),
        },
      },
      description: "List of earnings",
    },
    403: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Access denied — not a courier",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

earningsRouter.openapi(listEarningsRoute, async (c) => {
  const user = c.get("user");
  const companyId = c.get("companyId");

  if (user.role !== "courier") {
    return c.json(
      {
        error: "Forbidden",
        message: "Only couriers can access earnings",
        statusCode: 403,
      },
      403
    );
  }

  const courier = await findCourierByUserId(user.id, companyId);
  if (!courier) {
    return c.json(
      {
        error: "Forbidden",
        message: "Courier profile not found",
        statusCode: 403,
      },
      403
    );
  }

  const query = c.req.valid("query");

  const conditions = [
    eq(deliveries.courier_id, courier.id),
    eq(deliveries.company_id, companyId),
    eq(deliveries.status, "delivered"),
  ];

  if (query.period_start) {
    conditions.push(gte(deliveries.delivered_at, query.period_start));
  }
  if (query.period_end) {
    conditions.push(lte(deliveries.delivered_at, query.period_end));
  }

  const earnings = await db
    .select({
      delivery_id: deliveries.id,
      delivered_at: deliveries.delivered_at,
      shop_name: shops.trade_name,
      distance_km: deliveryPrices.actual_distance_km,
      estimated_distance_km: deliveryPrices.estimated_distance_km,
      value: deliveryPrices.total_price,
      closing_status: financialClosings.status,
    })
    .from(deliveries)
    .innerJoin(deliveryPrices, eq(deliveryPrices.delivery_id, deliveries.id))
    .leftJoin(orders, eq(orders.id, deliveries.order_id))
    .leftJoin(shops, eq(shops.id, orders.shop_id))
    .leftJoin(
      financialClosingItems,
      eq(financialClosingItems.delivery_id, deliveries.id)
    )
    .leftJoin(
      financialClosings,
      eq(financialClosings.id, financialClosingItems.closing_id)
    )
    .where(and(...conditions))
    .orderBy(desc(deliveries.delivered_at));

  return c.json(
    earnings.map((e) => ({
      delivery_id: e.delivery_id,
      delivered_at: e.delivered_at ?? "",
      shop_name: e.shop_name ?? null,
      distance_km: e.distance_km ?? e.estimated_distance_km ?? null,
      value: e.value,
      closing_status: e.closing_status ?? null,
    })),
    200
  );
});

// --- GET /api/couriers/me/earnings/summary ---

const earningsSummaryRoute = createRoute({
  method: "get",
  path: "/couriers/me/earnings/summary",
  tags: ["Earnings"],
  summary: "Courier earnings summary",
  description:
    "Returns earnings summary with totals for today, current week, and current month.",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: EarningsSummaryResponseSchema,
        },
      },
      description: "Earnings summary",
    },
    403: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Access denied — not a courier",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

earningsRouter.openapi(earningsSummaryRoute, async (c) => {
  const user = c.get("user");
  const companyId = c.get("companyId");

  if (user.role !== "courier") {
    return c.json(
      {
        error: "Forbidden",
        message: "Only couriers can access earnings",
        statusCode: 403,
      },
      403
    );
  }

  const courier = await findCourierByUserId(user.id, companyId);
  if (!courier) {
    return c.json(
      {
        error: "Forbidden",
        message: "Courier profile not found",
        statusCode: 403,
      },
      403
    );
  }

  // Calculate period boundaries using DB server time for consistency
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).toISOString();
  const todayEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  ).toISOString();

  // Week start (Monday)
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - diffToMonday
  ).toISOString();

  // Month start
  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).toISOString();

  const monthEnd = todayEnd;

  // Query helper for period aggregation
  async function aggregateForPeriod(periodStart: string, periodEnd: string) {
    const [result] = await db
      .select({
        total_amount: sum(deliveryPrices.total_price),
        total_deliveries: count(deliveries.id),
      })
      .from(deliveries)
      .innerJoin(deliveryPrices, eq(deliveryPrices.delivery_id, deliveries.id))
      .where(
        and(
          eq(deliveries.courier_id, courier.id),
          eq(deliveries.company_id, companyId),
          eq(deliveries.status, "delivered"),
          gte(deliveries.delivered_at, periodStart),
          lte(deliveries.delivered_at, periodEnd)
        )
      );

    return {
      total_amount: result?.total_amount ?? "0",
      total_deliveries: result?.total_deliveries ?? 0,
    };
  }

  const [today, week, month] = await Promise.all([
    aggregateForPeriod(todayStart, todayEnd),
    aggregateForPeriod(weekStart, monthEnd),
    aggregateForPeriod(monthStart, monthEnd),
  ]);

  return c.json(
    {
      today,
      week,
      month,
    },
    200
  );
});

export { earningsRouter };
