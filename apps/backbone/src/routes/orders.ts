import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { eq, and, asc, inArray } from "drizzle-orm";
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
import { calculateHaversineDistance } from "../services/distance.service.js";
import { evaluateRules } from "../services/pricing.service.js";
import { db } from "../db.js";
import {
  pricingTables,
  pricingRules,
  shopPricingOverrides,
  deliveries,
  deliveryEvents,
  profiles,
  couriers,
  orders,
} from "../../db/schema/index.js";
import { assignCourier } from "../services/delivery.service.js";
import { sseManager } from "../sse/manager.js";
import { companyChannel, courierChannel, orderChannel } from "../sse/channels.js";

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

// --- GET /api/orders/estimate ---

const EstimateResponseSchema = z.object({
  estimated_distance_km: z.number(),
  estimated_price: z.number(),
  pricing_table_name: z.string(),
});

const estimateRoute = createRoute({
  method: "get",
  path: "/orders/estimate",
  tags: ["Orders"],
  summary: "Estimate delivery cost",
  description:
    "Calculate estimated delivery cost based on pickup and delivery coordinates. Uses active pricing table for the company (or shop override if shop_id provided).",
  request: {
    query: z.object({
      pickup_lat: z.string().regex(/^-?\d+(\.\d+)?$/, "Must be a number"),
      pickup_lng: z.string().regex(/^-?\d+(\.\d+)?$/, "Must be a number"),
      delivery_lat: z.string().regex(/^-?\d+(\.\d+)?$/, "Must be a number"),
      delivery_lng: z.string().regex(/^-?\d+(\.\d+)?$/, "Must be a number"),
      shop_id: z.string().uuid().optional(),
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: EstimateResponseSchema } },
      description: "Delivery cost estimate",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Invalid coordinates",
    },
    403: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Access denied — role not allowed",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "No active pricing table found",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

ordersRouter.openapi(estimateRoute, async (c) => {
  const user = c.get("user");
  if (user.role !== "operator" && user.role !== "shop") {
    return c.json(
      {
        error: "Forbidden",
        message: "Only operators and shops can access estimates",
        statusCode: 403,
      },
      403
    );
  }

  const companyId = c.get("companyId");
  const query = c.req.valid("query");

  const pickupLat = parseFloat(query.pickup_lat);
  const pickupLng = parseFloat(query.pickup_lng);
  const deliveryLat = parseFloat(query.delivery_lat);
  const deliveryLng = parseFloat(query.delivery_lng);

  // Calculate Haversine distance
  const distanceKm = calculateHaversineDistance(
    pickupLat,
    pickupLng,
    deliveryLat,
    deliveryLng
  );

  // Resolve pricing table (shop override first, then company default)
  let table = null;

  if (query.shop_id) {
    const [override] = await db
      .select()
      .from(shopPricingOverrides)
      .where(eq(shopPricingOverrides.shop_id, query.shop_id));

    if (override) {
      const [overrideTable] = await db
        .select()
        .from(pricingTables)
        .where(eq(pricingTables.id, override.pricing_table_id));
      table = overrideTable || null;
    }
  }

  if (!table) {
    const [companyTable] = await db
      .select()
      .from(pricingTables)
      .where(
        and(
          eq(pricingTables.company_id, companyId),
          eq(pricingTables.active, true)
        )
      );
    table = companyTable || null;
  }

  if (!table) {
    return c.json(
      {
        error: "Not Found",
        message: "Nenhuma tabela de precos ativa",
        statusCode: 404,
      },
      404
    );
  }

  // Fetch and evaluate pricing rules
  const rules = await db
    .select()
    .from(pricingRules)
    .where(eq(pricingRules.pricing_table_id, table.id))
    .orderBy(asc(pricingRules.priority));

  if (rules.length === 0) {
    return c.json(
      {
        error: "Not Found",
        message: "Nenhuma tabela de precos ativa",
        statusCode: 404,
      },
      404
    );
  }

  const result = evaluateRules(rules, distanceKm, "");
  if (!result) {
    return c.json(
      {
        error: "Not Found",
        message: "Nenhuma tabela de precos ativa",
        statusCode: 404,
      },
      404
    );
  }

  return c.json(
    {
      estimated_distance_km: Math.round(distanceKm * 100) / 100,
      estimated_price: result.totalPrice,
      pricing_table_name: table.name,
    },
    200
  );
});

// --- POST /api/orders/bulk-assign ---

const BulkAssignRequestSchema = z.object({
  order_ids: z.array(z.string().uuid()).min(1).max(50),
  courier_id: z.string().uuid(),
});

const BulkAssignResultSchema = z.object({
  results: z.array(
    z.object({
      order_id: z.string().uuid(),
      success: z.boolean(),
      error: z.string().optional(),
    })
  ),
});

const bulkAssignRoute = createRoute({
  method: "post",
  path: "/orders/bulk-assign",
  tags: ["Orders"],
  summary: "Bulk assign orders to courier",
  description:
    "Assign multiple pending orders to a courier at once. Partial success is allowed — individual failures are reported per order.",
  request: {
    body: {
      content: {
        "application/json": { schema: BulkAssignRequestSchema },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: BulkAssignResultSchema } },
      description: "Bulk assign results (partial success possible)",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Invalid request data",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Courier not found or inactive",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

ordersRouter.openapi(bulkAssignRoute, async (c) => {
  const { order_ids, courier_id } = c.req.valid("json");
  const companyId = c.get("companyId");
  const user = c.get("user");

  // Validate courier belongs to company and is active
  const [courier] = await db
    .select()
    .from(couriers)
    .where(
      and(
        eq(couriers.id, courier_id),
        eq(couriers.company_id, companyId)
      )
    );

  if (!courier) {
    return c.json(
      {
        error: "Not Found",
        message: "Courier not found",
        statusCode: 404,
      },
      404
    );
  }

  if (!courier.active) {
    return c.json(
      {
        error: "Bad Request",
        message: "Courier is inactive",
        statusCode: 400,
      },
      400
    );
  }

  // Validate all orders belong to company
  const companyOrders = await db
    .select({ id: orders.id, status: orders.status })
    .from(orders)
    .where(
      and(
        inArray(orders.id, order_ids),
        eq(orders.company_id, companyId)
      )
    );

  const orderMap = new Map(companyOrders.map((o) => [o.id, o.status]));

  // Process each order
  const results: { order_id: string; success: boolean; error?: string }[] = [];

  for (const orderId of order_ids) {
    const status = orderMap.get(orderId);

    if (status === undefined) {
      results.push({ order_id: orderId, success: false, error: "order_not_found" });
      continue;
    }

    if (status !== "pending") {
      results.push({ order_id: orderId, success: false, error: "invalid_status" });
      continue;
    }

    try {
      const delivery = await assignCourier({
        orderId,
        courierId: courier_id,
        companyId,
        actorId: user.id,
      });

      if (!delivery) {
        results.push({ order_id: orderId, success: false, error: "order_not_found" });
        continue;
      }

      // SSE: broadcast delivery_assigned for this success
      const assignEvent = {
        type: "order_status",
        order_id: orderId,
        status: "assigned",
        courier_id: courier_id,
        delivery_id: delivery.id,
        timestamp: delivery.assigned_at,
      };
      sseManager.broadcast(companyChannel(companyId), assignEvent).catch(() => {});
      sseManager.broadcast(orderChannel(orderId), assignEvent).catch(() => {});
      sseManager.broadcast(courierChannel(courier_id), {
        type: "delivery_assigned",
        delivery_id: delivery.id,
        order_id: orderId,
        timestamp: delivery.assigned_at,
      }).catch(() => {});

      results.push({ order_id: orderId, success: true });
    } catch {
      results.push({ order_id: orderId, success: false, error: "already_assigned" });
    }
  }

  return c.json({ results }, 200);
});

// --- GET /api/orders/:id/timeline ---

const TimelineEventSchema = z.object({
  event_type: z.string(),
  old_status: z.string().nullable(),
  new_status: z.string().nullable(),
  description: z.string(),
  actor_name: z.string(),
  created_at: z.string(),
});

const getOrderTimelineRoute = createRoute({
  method: "get",
  path: "/orders/{id}/timeline",
  tags: ["Orders"],
  summary: "Get order timeline",
  description:
    "Get the timeline of events for an order. Returns delivery events joined with actor names, or a synthetic creation event if no delivery exists.",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.array(TimelineEventSchema) },
      },
      description: "Order timeline events",
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

ordersRouter.openapi(getOrderTimelineRoute, async (c) => {
  const companyId = c.get("companyId");
  const { id } = c.req.valid("param");

  // Verify order exists and belongs to company
  const order = await getOrderById(id, companyId);

  if (!order) {
    return c.json(
      { error: "Not Found", message: "Order not found", statusCode: 404 },
      404
    );
  }

  // Find delivery for this order
  const [delivery] = await db
    .select()
    .from(deliveries)
    .where(
      and(eq(deliveries.order_id, id), eq(deliveries.company_id, companyId))
    );

  if (!delivery) {
    // No delivery yet — return synthetic creation event
    // Get the creator's name
    const [creator] = await db
      .select({ full_name: profiles.full_name })
      .from(profiles)
      .where(eq(profiles.id, order.created_by));

    return c.json(
      [
        {
          event_type: "status_change",
          old_status: null,
          new_status: "pending",
          description: "Pedido criado",
          actor_name: creator?.full_name ?? "Sistema",
          created_at: order.created_at,
        },
      ],
      200
    );
  }

  // Get delivery events with actor names via JOIN
  const events = await db
    .select({
      event_type: deliveryEvents.event_type,
      old_status: deliveryEvents.old_status,
      new_status: deliveryEvents.new_status,
      description: deliveryEvents.description,
      actor_name: profiles.full_name,
      created_at: deliveryEvents.created_at,
    })
    .from(deliveryEvents)
    .leftJoin(profiles, eq(deliveryEvents.actor_id, profiles.id))
    .where(eq(deliveryEvents.delivery_id, delivery.id))
    .orderBy(asc(deliveryEvents.created_at));

  // Prepend synthetic creation event
  const [creator] = await db
    .select({ full_name: profiles.full_name })
    .from(profiles)
    .where(eq(profiles.id, order.created_by));

  const timeline = [
    {
      event_type: "status_change" as const,
      old_status: null,
      new_status: "pending",
      description: "Pedido criado",
      actor_name: creator?.full_name ?? "Sistema",
      created_at: order.created_at,
    },
    ...events.map((e) => ({
      event_type: e.event_type,
      old_status: e.old_status,
      new_status: e.new_status,
      description: e.description,
      actor_name: e.actor_name ?? "Sistema",
      created_at: e.created_at,
    })),
  ];

  return c.json(timeline, 200);
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
