import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AppType } from "../types.js";
import { authMiddleware } from "../middleware/auth.js";
import { companyMiddleware } from "../middleware/company.js";
import { requireRole } from "../middleware/role.js";
import {
  generateClosing,
  confirmClosing,
  payClosing,
  listClosings,
  getClosingById,
} from "../services/financial.service.js";

// --- Schemas ---

const FinancialClosingItemResponseSchema = z.object({
  id: z.string().uuid(),
  closing_id: z.string().uuid(),
  delivery_id: z.string().uuid(),
  delivery_price: z.string(),
  distance_km: z.string(),
  delivered_at: z.string(),
});

const FinancialClosingResponseSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  courier_id: z.string().uuid(),
  period_start: z.string(),
  period_end: z.string(),
  total_deliveries: z.number().int(),
  total_distance_km: z.string(),
  total_amount: z.string(),
  status: z.string(),
  confirmed_at: z.string().nullable(),
  paid_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

const FinancialClosingWithItemsResponseSchema =
  FinancialClosingResponseSchema.extend({
    items: z.array(FinancialClosingItemResponseSchema),
  });

const CreateClosingRequestSchema = z.object({
  courier_id: z.string().uuid(),
  period_start: z.string(),
  period_end: z.string(),
});

const ClosingListQuerySchema = z.object({
  courier_id: z.string().uuid().optional(),
  status: z.enum(["draft", "confirmed", "paid"]).optional(),
  period_start: z.string().optional(),
  period_end: z.string().optional(),
});

const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number().int(),
});

// --- Router ---

const financialRouter = new OpenAPIHono<AppType>({
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

financialRouter.use("/*", authMiddleware);
financialRouter.use("/*", companyMiddleware);
financialRouter.use("/*", requireRole("operator", "super_admin"));

// --- GET /api/financial/closings ---

const listClosingsRoute = createRoute({
  method: "get",
  path: "/financial/closings",
  tags: ["Financial"],
  summary: "List financial closings",
  description:
    "List financial closings with optional filters by courier_id, status, and period.",
  request: {
    query: ClosingListQuerySchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(FinancialClosingResponseSchema),
        },
      },
      description: "List of financial closings",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

financialRouter.openapi(listClosingsRoute, async (c) => {
  const query = c.req.valid("query");
  const companyId = c.get("companyId");

  const closings = await listClosings({
    companyId,
    courierId: query.courier_id,
    status: query.status,
    periodStart: query.period_start,
    periodEnd: query.period_end,
  });

  return c.json(
    closings.map((closing) => ({
      id: closing.id,
      company_id: closing.company_id,
      courier_id: closing.courier_id,
      period_start: closing.period_start,
      period_end: closing.period_end,
      total_deliveries: closing.total_deliveries,
      total_distance_km: closing.total_distance_km,
      total_amount: closing.total_amount,
      status: closing.status,
      confirmed_at: closing.confirmed_at,
      paid_at: closing.paid_at,
      created_at: closing.created_at,
      updated_at: closing.updated_at,
    })),
    200
  );
});

// --- POST /api/financial/closings ---

const createClosingRoute = createRoute({
  method: "post",
  path: "/financial/closings",
  tags: ["Financial"],
  summary: "Create financial closing",
  description:
    "Generate a new financial closing for a courier in a given period.",
  request: {
    body: {
      content: {
        "application/json": { schema: CreateClosingRequestSchema },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: FinancialClosingWithItemsResponseSchema,
        },
      },
      description: "Financial closing created",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Invalid request or no eligible deliveries",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Courier not found",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

financialRouter.openapi(createClosingRoute, async (c) => {
  const body = c.req.valid("json");
  const companyId = c.get("companyId");

  try {
    const result = await generateClosing({
      courierId: body.courier_id,
      companyId,
      periodStart: body.period_start,
      periodEnd: body.period_end,
    });

    if (!result) {
      return c.json(
        {
          error: "Not Found",
          message: "Courier not found",
          statusCode: 404,
        },
        404
      );
    }

    return c.json(
      {
        id: result.id,
        company_id: result.company_id,
        courier_id: result.courier_id,
        period_start: result.period_start,
        period_end: result.period_end,
        total_deliveries: result.total_deliveries,
        total_distance_km: result.total_distance_km,
        total_amount: result.total_amount,
        status: result.status,
        confirmed_at: result.confirmed_at,
        paid_at: result.paid_at,
        created_at: result.created_at,
        updated_at: result.updated_at,
        items: result.items.map((item) => ({
          id: item.id,
          closing_id: item.closing_id,
          delivery_id: item.delivery_id,
          delivery_price: item.delivery_price,
          distance_km: item.distance_km,
          delivered_at: item.delivered_at,
        })),
      },
      201
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Cannot create closing";
    return c.json(
      { error: "Bad Request", message, statusCode: 400 },
      400
    );
  }
});

// --- GET /api/financial/closings/:id ---

const getClosingRoute = createRoute({
  method: "get",
  path: "/financial/closings/{id}",
  tags: ["Financial"],
  summary: "Get financial closing details",
  description:
    "Get a single financial closing by ID, including its items.",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: FinancialClosingWithItemsResponseSchema,
        },
      },
      description: "Financial closing details with items",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Closing not found",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

financialRouter.openapi(getClosingRoute, async (c) => {
  const { id: closingId } = c.req.valid("param");
  const companyId = c.get("companyId");

  const result = await getClosingById({ closingId, companyId });

  if (!result) {
    return c.json(
      {
        error: "Not Found",
        message: "Closing not found",
        statusCode: 404,
      },
      404
    );
  }

  return c.json(
    {
      id: result.id,
      company_id: result.company_id,
      courier_id: result.courier_id,
      period_start: result.period_start,
      period_end: result.period_end,
      total_deliveries: result.total_deliveries,
      total_distance_km: result.total_distance_km,
      total_amount: result.total_amount,
      status: result.status,
      confirmed_at: result.confirmed_at,
      paid_at: result.paid_at,
      created_at: result.created_at,
      updated_at: result.updated_at,
      items: result.items.map((item) => ({
        id: item.id,
        closing_id: item.closing_id,
        delivery_id: item.delivery_id,
        delivery_price: item.delivery_price,
        distance_km: item.distance_km,
        delivered_at: item.delivered_at,
      })),
    },
    200
  );
});

// --- PATCH /api/financial/closings/:id/confirm ---

const confirmClosingRoute = createRoute({
  method: "patch",
  path: "/financial/closings/{id}/confirm",
  tags: ["Financial"],
  summary: "Confirm financial closing",
  description:
    "Confirm a financial closing, transitioning status from draft to confirmed.",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: FinancialClosingResponseSchema },
      },
      description: "Closing confirmed",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Invalid status transition",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Closing not found",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

financialRouter.openapi(confirmClosingRoute, async (c) => {
  const { id: closingId } = c.req.valid("param");
  const companyId = c.get("companyId");

  try {
    const result = await confirmClosing({ closingId, companyId });

    if (!result) {
      return c.json(
        {
          error: "Not Found",
          message: "Closing not found",
          statusCode: 404,
        },
        404
      );
    }

    return c.json(
      {
        id: result.id,
        company_id: result.company_id,
        courier_id: result.courier_id,
        period_start: result.period_start,
        period_end: result.period_end,
        total_deliveries: result.total_deliveries,
        total_distance_km: result.total_distance_km,
        total_amount: result.total_amount,
        status: result.status,
        confirmed_at: result.confirmed_at,
        paid_at: result.paid_at,
        created_at: result.created_at,
        updated_at: result.updated_at,
      },
      200
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Cannot confirm closing";
    return c.json(
      { error: "Bad Request", message, statusCode: 400 },
      400
    );
  }
});

// --- PATCH /api/financial/closings/:id/pay ---

const payClosingRoute = createRoute({
  method: "patch",
  path: "/financial/closings/{id}/pay",
  tags: ["Financial"],
  summary: "Pay financial closing",
  description:
    "Mark a financial closing as paid, transitioning status from confirmed to paid.",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: FinancialClosingResponseSchema },
      },
      description: "Closing paid",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Invalid status transition",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Closing not found",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

financialRouter.openapi(payClosingRoute, async (c) => {
  const { id: closingId } = c.req.valid("param");
  const companyId = c.get("companyId");

  try {
    const result = await payClosing({ closingId, companyId });

    if (!result) {
      return c.json(
        {
          error: "Not Found",
          message: "Closing not found",
          statusCode: 404,
        },
        404
      );
    }

    return c.json(
      {
        id: result.id,
        company_id: result.company_id,
        courier_id: result.courier_id,
        period_start: result.period_start,
        period_end: result.period_end,
        total_deliveries: result.total_deliveries,
        total_distance_km: result.total_distance_km,
        total_amount: result.total_amount,
        status: result.status,
        confirmed_at: result.confirmed_at,
        paid_at: result.paid_at,
        created_at: result.created_at,
        updated_at: result.updated_at,
      },
      200
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Cannot pay closing";
    return c.json(
      { error: "Bad Request", message, statusCode: 400 },
      400
    );
  }
});

export { financialRouter };
