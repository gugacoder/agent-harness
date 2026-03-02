import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AppType } from "../types.js";
import { authMiddleware } from "../middleware/auth.js";
import { companyMiddleware } from "../middleware/company.js";
import {
  createOrder,
  getOrderById,
  listOrders,
  updateOrderStatus,
  cancelOrder,
} from "../services/order.service.js";
import { autoSaveAddress } from "../services/address.service.js";
import { sseManager } from "../sse/manager.js";
import { companyChannel, orderChannel } from "../sse/channels.js";

// --- Schemas ---

const OrderResponseSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  shop_id: z.string().uuid().nullable(),
  order_number: z.number().int(),
  status: z.string(),
  pickup_address: z.string(),
  pickup_lat: z.string(),
  pickup_lng: z.string(),
  delivery_address: z.string(),
  delivery_lat: z.string(),
  delivery_lng: z.string(),
  recipient_name: z.string(),
  recipient_phone: z.string(),
  notes: z.string().nullable(),
  created_by: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
});

const CreateOrderRequestSchema = z.object({
  shop_id: z.string().uuid().optional(),
  pickup_address: z.string().min(1),
  pickup_lat: z.string(),
  pickup_lng: z.string(),
  delivery_address: z.string().min(1),
  delivery_lat: z.string(),
  delivery_lng: z.string(),
  recipient_name: z.string().min(1),
  recipient_phone: z.string().min(1),
  notes: z.string().optional(),
});

const UpdateStatusRequestSchema = z.object({
  status: z.enum([
    "assigned",
    "picked_up",
    "in_transit",
    "delivered",
    "cancelled",
  ]),
});

const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number().int(),
});

// --- Router ---

const ordersRouter = new OpenAPIHono<AppType>({
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
ordersRouter.use("/*", authMiddleware);
ordersRouter.use("/*", companyMiddleware);

// --- GET /api/orders ---

const listOrdersRoute = createRoute({
  method: "get",
  path: "/orders",
  tags: ["Orders"],
  summary: "List orders",
  description:
    "List all orders for the company. Optional filters: status, shop_id.",
  request: {
    query: z.object({
      status: z
        .enum([
          "pending",
          "assigned",
          "picked_up",
          "in_transit",
          "delivered",
          "cancelled",
        ])
        .optional(),
      shop_id: z.string().uuid().optional(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.array(OrderResponseSchema) },
      },
      description: "List of orders",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

ordersRouter.openapi(listOrdersRoute, async (c) => {
  const companyId = c.get("companyId");
  const { status, shop_id } = c.req.valid("query");

  const result = await listOrders({
    companyId,
    status,
    shopId: shop_id,
  });

  return c.json(
    result.map((order) => ({
      id: order.id,
      company_id: order.company_id,
      shop_id: order.shop_id,
      order_number: order.order_number,
      status: order.status,
      pickup_address: order.pickup_address,
      pickup_lat: order.pickup_lat,
      pickup_lng: order.pickup_lng,
      delivery_address: order.delivery_address,
      delivery_lat: order.delivery_lat,
      delivery_lng: order.delivery_lng,
      recipient_name: order.recipient_name,
      recipient_phone: order.recipient_phone,
      notes: order.notes,
      created_by: order.created_by,
      created_at: order.created_at,
      updated_at: order.updated_at,
    })),
    200
  );
});

// --- GET /api/orders/:id ---

const getOrderRoute = createRoute({
  method: "get",
  path: "/orders/{id}",
  tags: ["Orders"],
  summary: "Get order details",
  description: "Get a single order by ID, scoped to the user's company.",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: OrderResponseSchema } },
      description: "Order details",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Order not found",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

ordersRouter.openapi(getOrderRoute, async (c) => {
  const companyId = c.get("companyId");
  const { id } = c.req.valid("param");

  const order = await getOrderById(id, companyId);

  if (!order) {
    return c.json(
      { error: "Not Found", message: "Order not found", statusCode: 404 },
      404
    );
  }

  return c.json(
    {
      id: order.id,
      company_id: order.company_id,
      shop_id: order.shop_id,
      order_number: order.order_number,
      status: order.status,
      pickup_address: order.pickup_address,
      pickup_lat: order.pickup_lat,
      pickup_lng: order.pickup_lng,
      delivery_address: order.delivery_address,
      delivery_lat: order.delivery_lat,
      delivery_lng: order.delivery_lng,
      recipient_name: order.recipient_name,
      recipient_phone: order.recipient_phone,
      notes: order.notes,
      created_by: order.created_by,
      created_at: order.created_at,
      updated_at: order.updated_at,
    },
    200
  );
});

// --- POST /api/orders ---

const createOrderRoute = createRoute({
  method: "post",
  path: "/orders",
  tags: ["Orders"],
  summary: "Create an order",
  description:
    "Create a new order with a sequential order number per company. Sets created_by from JWT context.",
  request: {
    body: {
      content: {
        "application/json": { schema: CreateOrderRequestSchema },
      },
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: OrderResponseSchema } },
      description: "Order created successfully",
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

ordersRouter.openapi(createOrderRoute, async (c) => {
  const body = c.req.valid("json");
  const companyId = c.get("companyId");
  const user = c.get("user");

  const created = await createOrder({
    companyId,
    shopId: body.shop_id,
    pickupAddress: body.pickup_address,
    pickupLat: body.pickup_lat,
    pickupLng: body.pickup_lng,
    deliveryAddress: body.delivery_address,
    deliveryLat: body.delivery_lat,
    deliveryLng: body.delivery_lng,
    recipientName: body.recipient_name,
    recipientPhone: body.recipient_phone,
    notes: body.notes,
    createdBy: user.id,
  });

  // Auto-save delivery address (fire-and-forget)
  autoSaveAddress(
    user.id,
    companyId,
    body.delivery_address,
    body.delivery_lat,
    body.delivery_lng
  ).catch(() => {});

  // SSE: broadcast order_created to company channel
  sseManager.broadcast(companyChannel(companyId), {
    type: "order_created",
    order_id: created.id,
    order_number: created.order_number,
    status: created.status,
    timestamp: created.created_at,
  }).catch(() => {});

  return c.json(
    {
      id: created.id,
      company_id: created.company_id,
      shop_id: created.shop_id,
      order_number: created.order_number,
      status: created.status,
      pickup_address: created.pickup_address,
      pickup_lat: created.pickup_lat,
      pickup_lng: created.pickup_lng,
      delivery_address: created.delivery_address,
      delivery_lat: created.delivery_lat,
      delivery_lng: created.delivery_lng,
      recipient_name: created.recipient_name,
      recipient_phone: created.recipient_phone,
      notes: created.notes,
      created_by: created.created_by,
      created_at: created.created_at,
      updated_at: created.updated_at,
    },
    201
  );
});

// --- PATCH /api/orders/:id/status ---

const updateOrderStatusRoute = createRoute({
  method: "patch",
  path: "/orders/{id}/status",
  tags: ["Orders"],
  summary: "Update order status",
  description:
    "Transition order status. Valid transitions: pending->assigned->picked_up->in_transit->delivered. Cancellation allowed before picked_up.",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        "application/json": { schema: UpdateStatusRequestSchema },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: OrderResponseSchema } },
      description: "Order status updated",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Invalid status transition",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Order not found",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

ordersRouter.openapi(updateOrderStatusRoute, async (c) => {
  const { id } = c.req.valid("param");
  const { status } = c.req.valid("json");
  const companyId = c.get("companyId");

  try {
    const updated = await updateOrderStatus(id, companyId, status);

    if (!updated) {
      return c.json(
        { error: "Not Found", message: "Order not found", statusCode: 404 },
        404
      );
    }

    // SSE: broadcast order_status to company and order channels
    const statusEvent = {
      type: "order_status",
      order_id: updated.id,
      order_number: updated.order_number,
      status: updated.status,
      timestamp: updated.updated_at,
    };
    sseManager.broadcast(companyChannel(companyId), statusEvent).catch(() => {});
    sseManager.broadcast(orderChannel(id), statusEvent).catch(() => {});

    return c.json(
      {
        id: updated.id,
        company_id: updated.company_id,
        shop_id: updated.shop_id,
        order_number: updated.order_number,
        status: updated.status,
        pickup_address: updated.pickup_address,
        pickup_lat: updated.pickup_lat,
        pickup_lng: updated.pickup_lng,
        delivery_address: updated.delivery_address,
        delivery_lat: updated.delivery_lat,
        delivery_lng: updated.delivery_lng,
        recipient_name: updated.recipient_name,
        recipient_phone: updated.recipient_phone,
        notes: updated.notes,
        created_by: updated.created_by,
        created_at: updated.created_at,
        updated_at: updated.updated_at,
      },
      200
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Invalid status transition";
    return c.json(
      { error: "Bad Request", message, statusCode: 400 },
      400
    );
  }
});

// --- DELETE /api/orders/:id ---

const deleteOrderRoute = createRoute({
  method: "delete",
  path: "/orders/{id}",
  tags: ["Orders"],
  summary: "Cancel an order",
  description:
    "Cancel an order. Only allowed when status is pending or assigned (before picked_up).",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: OrderResponseSchema } },
      description: "Order cancelled",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Cannot cancel order in current status",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Order not found",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

ordersRouter.openapi(deleteOrderRoute, async (c) => {
  const { id } = c.req.valid("param");
  const companyId = c.get("companyId");

  try {
    const cancelled = await cancelOrder(id, companyId);

    if (!cancelled) {
      return c.json(
        { error: "Not Found", message: "Order not found", statusCode: 404 },
        404
      );
    }

    // SSE: broadcast order_status (cancelled) to company and order channels
    const cancelEvent = {
      type: "order_status",
      order_id: cancelled.id,
      order_number: cancelled.order_number,
      status: cancelled.status,
      timestamp: cancelled.updated_at,
    };
    sseManager.broadcast(companyChannel(companyId), cancelEvent).catch(() => {});
    sseManager.broadcast(orderChannel(id), cancelEvent).catch(() => {});

    return c.json(
      {
        id: cancelled.id,
        company_id: cancelled.company_id,
        shop_id: cancelled.shop_id,
        order_number: cancelled.order_number,
        status: cancelled.status,
        pickup_address: cancelled.pickup_address,
        pickup_lat: cancelled.pickup_lat,
        pickup_lng: cancelled.pickup_lng,
        delivery_address: cancelled.delivery_address,
        delivery_lat: cancelled.delivery_lat,
        delivery_lng: cancelled.delivery_lng,
        recipient_name: cancelled.recipient_name,
        recipient_phone: cancelled.recipient_phone,
        notes: cancelled.notes,
        created_by: cancelled.created_by,
        created_at: cancelled.created_at,
        updated_at: cancelled.updated_at,
      },
      200
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Cannot cancel order";
    return c.json(
      { error: "Bad Request", message, statusCode: 400 },
      400
    );
  }
});

export { ordersRouter };
