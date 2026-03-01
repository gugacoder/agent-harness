import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AppType } from "../types.js";
import { authMiddleware } from "../middleware/auth.js";
import { companyMiddleware } from "../middleware/company.js";
import {
  assignCourier,
  acceptDelivery,
  rejectDelivery,
  getDeliveryById,
  getDeliveryEvents,
  updateDeliveryStatus,
} from "../services/delivery.service.js";
import { sseManager } from "../sse/manager.js";
import { companyChannel, courierChannel, orderChannel } from "../sse/channels.js";

// --- Schemas ---

const DeliveryResponseSchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid(),
  courier_id: z.string().uuid(),
  company_id: z.string().uuid(),
  status: z.string(),
  assigned_at: z.string(),
  accepted_at: z.string().nullable(),
  picked_up_at: z.string().nullable(),
  delivered_at: z.string().nullable(),
  actual_distance_km: z.string().nullable(),
  actual_duration_min: z.number().int().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

const AssignCourierRequestSchema = z.object({
  courier_id: z.string().uuid(),
});

const RejectDeliveryRequestSchema = z.object({
  reason: z.string().optional(),
});

const DeliveryEventResponseSchema = z.object({
  id: z.string().uuid(),
  delivery_id: z.string().uuid(),
  event_type: z.string(),
  old_status: z.string().nullable(),
  new_status: z.string().nullable(),
  description: z.string(),
  actor_id: z.string().uuid(),
  lat: z.string().nullable(),
  lng: z.string().nullable(),
  created_at: z.string(),
});

const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number().int(),
});

// --- Router ---

const deliveriesRouter = new OpenAPIHono<AppType>({
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
deliveriesRouter.use("/*", authMiddleware);
deliveriesRouter.use("/*", companyMiddleware);

// --- POST /api/orders/:id/assign ---

const assignCourierRoute = createRoute({
  method: "post",
  path: "/orders/{id}/assign",
  tags: ["Deliveries"],
  summary: "Assign courier to order",
  description:
    "Assign a courier to an order, creating a delivery record. Order must be in 'pending' status.",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        "application/json": { schema: AssignCourierRequestSchema },
      },
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: DeliveryResponseSchema } },
      description: "Delivery created, courier assigned",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Invalid request or order not in pending status",
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

deliveriesRouter.openapi(assignCourierRoute, async (c) => {
  const { id: orderId } = c.req.valid("param");
  const { courier_id: courierId } = c.req.valid("json");
  const companyId = c.get("companyId");
  const user = c.get("user");

  try {
    const delivery = await assignCourier({
      orderId,
      courierId,
      companyId,
      actorId: user.id,
    });

    if (!delivery) {
      return c.json(
        { error: "Not Found", message: "Order not found", statusCode: 404 },
        404
      );
    }

    // SSE: broadcast to company (order_status=assigned) and courier (delivery_assigned)
    const assignEvent = {
      type: "order_status",
      order_id: orderId,
      status: "assigned",
      courier_id: courierId,
      delivery_id: delivery.id,
      timestamp: delivery.assigned_at,
    };
    sseManager.broadcast(companyChannel(companyId), assignEvent).catch(() => {});
    sseManager.broadcast(orderChannel(orderId), assignEvent).catch(() => {});
    sseManager.broadcast(courierChannel(courierId), {
      type: "delivery_assigned",
      delivery_id: delivery.id,
      order_id: orderId,
      timestamp: delivery.assigned_at,
    }).catch(() => {});

    return c.json(
      {
        id: delivery.id,
        order_id: delivery.order_id,
        courier_id: delivery.courier_id,
        company_id: delivery.company_id,
        status: delivery.status,
        assigned_at: delivery.assigned_at,
        accepted_at: delivery.accepted_at,
        picked_up_at: delivery.picked_up_at,
        delivered_at: delivery.delivered_at,
        actual_distance_km: delivery.actual_distance_km,
        actual_duration_min: delivery.actual_duration_min,
        created_at: delivery.created_at,
        updated_at: delivery.updated_at,
      },
      201
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Cannot assign courier";
    return c.json(
      { error: "Bad Request", message, statusCode: 400 },
      400
    );
  }
});

// --- POST /api/deliveries/:id/accept ---

const acceptDeliveryRoute = createRoute({
  method: "post",
  path: "/deliveries/{id}/accept",
  tags: ["Deliveries"],
  summary: "Accept a delivery",
  description:
    "Courier accepts the assigned delivery. Notifies company via SSE.",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: DeliveryResponseSchema } },
      description: "Delivery accepted",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Invalid status transition",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Delivery not found",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

deliveriesRouter.openapi(acceptDeliveryRoute, async (c) => {
  const { id: deliveryId } = c.req.valid("param");
  const companyId = c.get("companyId");
  const user = c.get("user");

  try {
    const delivery = await acceptDelivery(deliveryId, companyId, user.id);

    if (!delivery) {
      return c.json(
        {
          error: "Not Found",
          message: "Delivery not found",
          statusCode: 404,
        },
        404
      );
    }

    // SSE: broadcast delivery accepted to company and order channels
    const acceptEvent = {
      type: "order_status",
      order_id: delivery.order_id,
      delivery_id: delivery.id,
      courier_id: delivery.courier_id,
      status: "accepted",
      timestamp: delivery.accepted_at,
    };
    sseManager.broadcast(companyChannel(companyId), acceptEvent).catch(() => {});
    sseManager.broadcast(orderChannel(delivery.order_id), acceptEvent).catch(() => {});

    return c.json(
      {
        id: delivery.id,
        order_id: delivery.order_id,
        courier_id: delivery.courier_id,
        company_id: delivery.company_id,
        status: delivery.status,
        assigned_at: delivery.assigned_at,
        accepted_at: delivery.accepted_at,
        picked_up_at: delivery.picked_up_at,
        delivered_at: delivery.delivered_at,
        actual_distance_km: delivery.actual_distance_km,
        actual_duration_min: delivery.actual_duration_min,
        created_at: delivery.created_at,
        updated_at: delivery.updated_at,
      },
      200
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Cannot accept delivery";
    return c.json(
      { error: "Bad Request", message, statusCode: 400 },
      400
    );
  }
});

// --- POST /api/deliveries/:id/reject ---

const rejectDeliveryRoute = createRoute({
  method: "post",
  path: "/deliveries/{id}/reject",
  tags: ["Deliveries"],
  summary: "Reject a delivery",
  description:
    "Courier rejects the assigned delivery. Notifies company for reassignment. Order reverts to pending.",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        "application/json": { schema: RejectDeliveryRequestSchema },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: DeliveryResponseSchema } },
      description: "Delivery rejected, order reverted to pending",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Invalid status for rejection",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Delivery not found",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

deliveriesRouter.openapi(rejectDeliveryRoute, async (c) => {
  const { id: deliveryId } = c.req.valid("param");
  const body = c.req.valid("json");
  const companyId = c.get("companyId");
  const user = c.get("user");

  try {
    const delivery = await rejectDelivery(
      deliveryId,
      companyId,
      user.id,
      body.reason
    );

    if (!delivery) {
      return c.json(
        {
          error: "Not Found",
          message: "Delivery not found",
          statusCode: 404,
        },
        404
      );
    }

    // SSE: broadcast delivery rejected to company (for reassignment) and courier
    const rejectEvent = {
      type: "order_status",
      order_id: delivery.order_id,
      delivery_id: delivery.id,
      status: "pending",
      timestamp: delivery.updated_at,
    };
    sseManager.broadcast(companyChannel(companyId), rejectEvent).catch(() => {});
    sseManager.broadcast(orderChannel(delivery.order_id), rejectEvent).catch(() => {});
    sseManager.broadcast(courierChannel(delivery.courier_id), {
      type: "delivery_cancelled",
      delivery_id: delivery.id,
      order_id: delivery.order_id,
      timestamp: delivery.updated_at,
    }).catch(() => {});

    return c.json(
      {
        id: delivery.id,
        order_id: delivery.order_id,
        courier_id: delivery.courier_id,
        company_id: delivery.company_id,
        status: delivery.status,
        assigned_at: delivery.assigned_at,
        accepted_at: delivery.accepted_at,
        picked_up_at: delivery.picked_up_at,
        delivered_at: delivery.delivered_at,
        actual_distance_km: delivery.actual_distance_km,
        actual_duration_min: delivery.actual_duration_min,
        created_at: delivery.created_at,
        updated_at: delivery.updated_at,
      },
      200
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Cannot reject delivery";
    return c.json(
      { error: "Bad Request", message, statusCode: 400 },
      400
    );
  }
});

// --- GET /api/deliveries/:id ---

const getDeliveryRoute = createRoute({
  method: "get",
  path: "/deliveries/{id}",
  tags: ["Deliveries"],
  summary: "Get delivery details",
  description: "Get a single delivery by ID, scoped to the user's company.",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: DeliveryResponseSchema } },
      description: "Delivery details",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Delivery not found",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

deliveriesRouter.openapi(getDeliveryRoute, async (c) => {
  const { id: deliveryId } = c.req.valid("param");
  const companyId = c.get("companyId");

  const delivery = await getDeliveryById(deliveryId, companyId);

  if (!delivery) {
    return c.json(
      {
        error: "Not Found",
        message: "Delivery not found",
        statusCode: 404,
      },
      404
    );
  }

  return c.json(
    {
      id: delivery.id,
      order_id: delivery.order_id,
      courier_id: delivery.courier_id,
      company_id: delivery.company_id,
      status: delivery.status,
      assigned_at: delivery.assigned_at,
      accepted_at: delivery.accepted_at,
      picked_up_at: delivery.picked_up_at,
      delivered_at: delivery.delivered_at,
      actual_distance_km: delivery.actual_distance_km,
      actual_duration_min: delivery.actual_duration_min,
      created_at: delivery.created_at,
      updated_at: delivery.updated_at,
    },
    200
  );
});

// --- GET /api/deliveries/:id/events ---

const getDeliveryEventsRoute = createRoute({
  method: "get",
  path: "/deliveries/{id}/events",
  tags: ["Deliveries"],
  summary: "Get delivery events timeline",
  description:
    "Get all events for a delivery, ordered chronologically. Used for delivery timeline display.",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(DeliveryEventResponseSchema),
        },
      },
      description: "List of delivery events",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Delivery not found",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

deliveriesRouter.openapi(getDeliveryEventsRoute, async (c) => {
  const { id: deliveryId } = c.req.valid("param");
  const companyId = c.get("companyId");

  // Verify delivery exists and belongs to company
  const delivery = await getDeliveryById(deliveryId, companyId);

  if (!delivery) {
    return c.json(
      {
        error: "Not Found",
        message: "Delivery not found",
        statusCode: 404,
      },
      404
    );
  }

  const events = await getDeliveryEvents(deliveryId);

  return c.json(
    events.map((event) => ({
      id: event.id,
      delivery_id: event.delivery_id,
      event_type: event.event_type,
      old_status: event.old_status,
      new_status: event.new_status,
      description: event.description,
      actor_id: event.actor_id,
      lat: event.lat,
      lng: event.lng,
      created_at: event.created_at,
    })),
    200
  );
});

export { deliveriesRouter };
