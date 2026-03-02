import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AppType } from "../types.js";
import { authMiddleware } from "../middleware/auth.js";
import { companyMiddleware } from "../middleware/company.js";
import { requireRole } from "../middleware/role.js";
import {
  getOverview,
  getCourierPerformance,
  getNeighborhoodVolume,
  getRevenue,
  getTrend,
} from "../services/analytics.service.js";

// --- Schemas ---

const AnalyticsQuerySchema = z.object({
  period: z.enum(["day", "week", "month", "custom"]).optional(),
  period_start: z.string().optional(),
  period_end: z.string().optional(),
});

const OverviewResponseSchema = z.object({
  total_deliveries: z.number().int(),
  completed: z.number().int(),
  cancelled: z.number().int(),
  completion_rate: z.number(),
  avg_delivery_time_minutes: z.number(),
});

const CourierPerformanceItemSchema = z.object({
  courier_id: z.string().uuid(),
  courier_name: z.string(),
  total_deliveries: z.number().int(),
  avg_delivery_time_minutes: z.number(),
  avg_distance_km: z.number(),
});

const NeighborhoodItemSchema = z.object({
  neighborhood: z.string(),
  total_deliveries: z.number().int(),
});

const RevenueResponseSchema = z.object({
  total_revenue: z.string(),
  avg_per_delivery: z.string(),
  total_deliveries: z.number().int(),
});

const TrendItemSchema = z.object({
  date: z.string(),
  total_deliveries: z.number().int(),
});

const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number().int(),
});

// --- Period Resolution ---

function resolvePeriod(query: {
  period?: string;
  period_start?: string;
  period_end?: string;
}): { periodStart: string; periodEnd: string } {
  const now = new Date();

  if (query.period_start && query.period_end) {
    return { periodStart: query.period_start, periodEnd: query.period_end };
  }

  switch (query.period) {
    case "day": {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999
      );
      return {
        periodStart: start.toISOString(),
        periodEnd: end.toISOString(),
      };
    }
    case "week": {
      const dayOfWeek = now.getDay();
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const start = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - diffToMonday
      );
      const end = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999
      );
      return {
        periodStart: start.toISOString(),
        periodEnd: end.toISOString(),
      };
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999
      );
      return {
        periodStart: start.toISOString(),
        periodEnd: end.toISOString(),
      };
    }
    default: {
      // Default to last 30 days
      const end = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999
      );
      const start = new Date(end);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      return {
        periodStart: start.toISOString(),
        periodEnd: end.toISOString(),
      };
    }
  }
}

// --- Router ---

const analyticsRouter = new OpenAPIHono<AppType>({
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

analyticsRouter.use("/analytics/*", authMiddleware);
analyticsRouter.use("/analytics/*", companyMiddleware);
analyticsRouter.use("/analytics/*", requireRole("operator", "super_admin"));

// --- GET /api/analytics/overview ---

const overviewRoute = createRoute({
  method: "get",
  path: "/analytics/overview",
  tags: ["Analytics"],
  summary: "Analytics overview",
  description:
    "Returns total deliveries, completed, cancelled, completion rate, and average delivery time for the period.",
  request: { query: AnalyticsQuerySchema },
  responses: {
    200: {
      content: { "application/json": { schema: OverviewResponseSchema } },
      description: "Overview analytics",
    },
    403: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Access denied — not an operator",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

analyticsRouter.openapi(overviewRoute, async (c) => {
  const user = c.get("user");
  if (user.role !== "operator") {
    return c.json(
      {
        error: "Forbidden",
        message: "Only operators can access analytics",
        statusCode: 403,
      },
      403
    );
  }

  const companyId = c.get("companyId");
  const query = c.req.valid("query");
  const { periodStart, periodEnd } = resolvePeriod(query);

  const result = await getOverview({ companyId, periodStart, periodEnd });
  return c.json(result, 200);
});

// --- GET /api/analytics/couriers ---

const couriersRoute = createRoute({
  method: "get",
  path: "/analytics/couriers",
  tags: ["Analytics"],
  summary: "Courier performance",
  description:
    "Returns per-courier performance metrics: deliveries, avg time, avg distance.",
  request: { query: AnalyticsQuerySchema },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.array(CourierPerformanceItemSchema) },
      },
      description: "Courier performance list",
    },
    403: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Access denied — not an operator",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

analyticsRouter.openapi(couriersRoute, async (c) => {
  const user = c.get("user");
  if (user.role !== "operator") {
    return c.json(
      {
        error: "Forbidden",
        message: "Only operators can access analytics",
        statusCode: 403,
      },
      403
    );
  }

  const companyId = c.get("companyId");
  const query = c.req.valid("query");
  const { periodStart, periodEnd } = resolvePeriod(query);

  const result = await getCourierPerformance({
    companyId,
    periodStart,
    periodEnd,
  });
  return c.json(result, 200);
});

// --- GET /api/analytics/neighborhoods ---

const neighborhoodsRoute = createRoute({
  method: "get",
  path: "/analytics/neighborhoods",
  tags: ["Analytics"],
  summary: "Neighborhood volume",
  description: "Returns delivery volume by neighborhood, ranked by count.",
  request: { query: AnalyticsQuerySchema },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.array(NeighborhoodItemSchema) },
      },
      description: "Neighborhood volume list",
    },
    403: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Access denied — not an operator",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

analyticsRouter.openapi(neighborhoodsRoute, async (c) => {
  const user = c.get("user");
  if (user.role !== "operator") {
    return c.json(
      {
        error: "Forbidden",
        message: "Only operators can access analytics",
        statusCode: 403,
      },
      403
    );
  }

  const companyId = c.get("companyId");
  const query = c.req.valid("query");
  const { periodStart, periodEnd } = resolvePeriod(query);

  const result = await getNeighborhoodVolume({
    companyId,
    periodStart,
    periodEnd,
  });
  return c.json(result, 200);
});

// --- GET /api/analytics/revenue ---

const revenueRoute = createRoute({
  method: "get",
  path: "/analytics/revenue",
  tags: ["Analytics"],
  summary: "Revenue analytics",
  description:
    "Returns total revenue and average revenue per delivery for the period.",
  request: { query: AnalyticsQuerySchema },
  responses: {
    200: {
      content: { "application/json": { schema: RevenueResponseSchema } },
      description: "Revenue analytics",
    },
    403: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Access denied — not an operator",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

analyticsRouter.openapi(revenueRoute, async (c) => {
  const user = c.get("user");
  if (user.role !== "operator") {
    return c.json(
      {
        error: "Forbidden",
        message: "Only operators can access analytics",
        statusCode: 403,
      },
      403
    );
  }

  const companyId = c.get("companyId");
  const query = c.req.valid("query");
  const { periodStart, periodEnd } = resolvePeriod(query);

  const result = await getRevenue({ companyId, periodStart, periodEnd });
  return c.json(result, 200);
});

// --- GET /api/analytics/trend ---

const trendRoute = createRoute({
  method: "get",
  path: "/analytics/trend",
  tags: ["Analytics"],
  summary: "Delivery trend",
  description:
    "Returns delivery count per day in the selected period for trend analysis.",
  request: { query: AnalyticsQuerySchema },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.array(TrendItemSchema) },
      },
      description: "Daily delivery trend",
    },
    403: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Access denied — not an operator",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

analyticsRouter.openapi(trendRoute, async (c) => {
  const user = c.get("user");
  if (user.role !== "operator") {
    return c.json(
      {
        error: "Forbidden",
        message: "Only operators can access analytics",
        statusCode: 403,
      },
      403
    );
  }

  const companyId = c.get("companyId");
  const query = c.req.valid("query");
  const { periodStart, periodEnd } = resolvePeriod(query);

  const result = await getTrend({ companyId, periodStart, periodEnd });
  return c.json(result, 200);
});

export { analyticsRouter };
