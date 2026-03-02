import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AppType } from "../types.js";
import { authMiddleware } from "../middleware/auth.js";
import { companyMiddleware } from "../middleware/company.js";
import {
  listCouriers,
  createCourier,
  getCourierByProfileId,
  updateCourierStatus,
  updateCourierActive,
  recordLocation,
} from "../services/courier.service.js";
import { getDeliveryById } from "../services/delivery.service.js";
import { sseManager } from "../sse/manager.js";
import { companyChannel, orderChannel } from "../sse/channels.js";

// --- Schemas ---

const CourierResponseSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  profile_id: z.string().uuid(),
  full_name: z.string(),
  phone: z.string(),
  photo_url: z.string().nullable(),
  status: z.enum(["available", "busy", "offline"]),
  total_deliveries: z.number().int(),
  active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

const CreateCourierRequestSchema = z.object({
  profile_id: z.string().uuid(),
  full_name: z.string().min(1),
  phone: z.string().min(1),
  photo_url: z.string().nullable().optional(),
});

const UpdateStatusRequestSchema = z.object({
  status: z.enum(["available", "busy", "offline"]),
});

const UpdateActiveRequestSchema = z.object({
  active: z.boolean(),
});

const SendLocationRequestSchema = z.object({
  lat: z.string(),
  lng: z.string(),
  accuracy: z.string().optional().default("0"),
  delivery_id: z.string().uuid().nullable().optional(),
});

const LocationResponseSchema = z.object({
  id: z.string().uuid(),
  courier_id: z.string().uuid(),
  company_id: z.string().uuid(),
  delivery_id: z.string().uuid().nullable(),
  lat: z.string(),
  lng: z.string(),
  accuracy: z.string(),
  recorded_at: z.string(),
  created_at: z.string(),
});

const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number().int(),
});

// --- Router ---

const couriersRouter = new OpenAPIHono<AppType>({
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
couriersRouter.use("/*", authMiddleware);
couriersRouter.use("/*", companyMiddleware);

// --- GET /api/couriers/me ---

const getMeRoute = createRoute({
  method: "get",
  path: "/couriers/me",
  tags: ["Couriers"],
  summary: "Get current courier profile",
  description:
    "Return the courier record linked to the authenticated user's profile_id.",
  responses: {
    200: {
      content: { "application/json": { schema: CourierResponseSchema } },
      description: "Courier profile",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Courier not found for this user",
    },
  },
});

couriersRouter.openapi(getMeRoute, async (c) => {
  const user = c.get("user");
  const companyId = c.get("companyId");

  const courier = await getCourierByProfileId(user.id, companyId);

  if (!courier) {
    return c.json(
      {
        error: "Not Found",
        message: "Courier not found for this user",
        statusCode: 404,
      },
      404
    );
  }

  return c.json(
    {
      id: courier.id,
      company_id: courier.company_id,
      profile_id: courier.profile_id,
      full_name: courier.full_name,
      phone: courier.phone,
      photo_url: courier.photo_url,
      status: courier.status,
      total_deliveries: courier.total_deliveries,
      active: courier.active,
      created_at: courier.created_at,
      updated_at: courier.updated_at,
    },
    200
  );
});

// --- GET /api/couriers ---

const listCouriersRoute = createRoute({
  method: "get",
  path: "/couriers",
  tags: ["Couriers"],
  summary: "List couriers",
  description:
    "List all couriers for the authenticated user's company. Optionally filter by status or active flag.",
  request: {
    query: z.object({
      status: z.enum(["available", "busy", "offline"]).optional(),
      active: z
        .string()
        .transform((v) => v === "true")
        .optional(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.array(CourierResponseSchema) },
      },
      description: "List of couriers",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

couriersRouter.openapi(listCouriersRoute, async (c) => {
  const companyId = c.get("companyId");
  const query = c.req.valid("query");

  const result = await listCouriers({
    companyId,
    status: query.status,
    active: query.active,
  });

  return c.json(
    result.map((courier) => ({
      id: courier.id,
      company_id: courier.company_id,
      profile_id: courier.profile_id,
      full_name: courier.full_name,
      phone: courier.phone,
      photo_url: courier.photo_url,
      status: courier.status,
      total_deliveries: courier.total_deliveries,
      active: courier.active,
      created_at: courier.created_at,
      updated_at: courier.updated_at,
    })),
    200
  );
});

// --- POST /api/couriers ---

const createCourierRoute = createRoute({
  method: "post",
  path: "/couriers",
  tags: ["Couriers"],
  summary: "Create a courier",
  description:
    "Register a new courier (motoboy) under the authenticated user's company.",
  request: {
    body: {
      content: {
        "application/json": { schema: CreateCourierRequestSchema },
      },
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: CourierResponseSchema } },
      description: "Courier created successfully",
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

couriersRouter.openapi(createCourierRoute, async (c) => {
  const body = c.req.valid("json");
  const companyId = c.get("companyId");

  const created = await createCourier({
    companyId,
    profileId: body.profile_id,
    fullName: body.full_name,
    phone: body.phone,
    photoUrl: body.photo_url,
  });

  return c.json(
    {
      id: created.id,
      company_id: created.company_id,
      profile_id: created.profile_id,
      full_name: created.full_name,
      phone: created.phone,
      photo_url: created.photo_url,
      status: created.status,
      total_deliveries: created.total_deliveries,
      active: created.active,
      created_at: created.created_at,
      updated_at: created.updated_at,
    },
    201
  );
});

// --- PATCH /api/couriers/:id/status ---

const updateCourierStatusRoute = createRoute({
  method: "patch",
  path: "/couriers/{id}/status",
  tags: ["Couriers"],
  summary: "Update courier status",
  description:
    "Change courier status: available/offline manually, busy automatically when courier has an active delivery.",
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
      content: { "application/json": { schema: CourierResponseSchema } },
      description: "Courier status updated",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Invalid status value",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Courier not found",
    },
  },
});

couriersRouter.openapi(updateCourierStatusRoute, async (c) => {
  const { id } = c.req.valid("param");
  const { status } = c.req.valid("json");
  const companyId = c.get("companyId");

  try {
    const updated = await updateCourierStatus(id, companyId, status);

    if (!updated) {
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
        id: updated.id,
        company_id: updated.company_id,
        profile_id: updated.profile_id,
        full_name: updated.full_name,
        phone: updated.phone,
        photo_url: updated.photo_url,
        status: updated.status,
        total_deliveries: updated.total_deliveries,
        active: updated.active,
        created_at: updated.created_at,
        updated_at: updated.updated_at,
      },
      200
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid status";
    return c.json(
      { error: "Bad Request", message, statusCode: 400 },
      400
    );
  }
});

// --- POST /api/couriers/:id/location ---

const sendLocationRoute = createRoute({
  method: "post",
  path: "/couriers/{id}/location",
  tags: ["Couriers"],
  summary: "Send courier location",
  description:
    "Record courier GPS location. Inserts into courier_locations table and emits SSE event.",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        "application/json": { schema: SendLocationRequestSchema },
      },
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: LocationResponseSchema } },
      description: "Location recorded",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Courier not found",
    },
  },
});

couriersRouter.openapi(sendLocationRoute, async (c) => {
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");
  const companyId = c.get("companyId");

  const location = await recordLocation({
    courierId: id,
    companyId,
    lat: body.lat,
    lng: body.lng,
    accuracy: body.accuracy,
    deliveryId: body.delivery_id,
  });

  if (!location) {
    return c.json(
      {
        error: "Not Found",
        message: "Courier not found",
        statusCode: 404,
      },
      404
    );
  }

  // SSE: broadcast courier_location to company channel
  const locationEvent = {
    type: "courier_location" as const,
    courier_id: id,
    lat: location.lat,
    lng: location.lng,
    accuracy: location.accuracy,
    delivery_id: location.delivery_id,
    timestamp: location.recorded_at,
  };
  sseManager.broadcast(companyChannel(companyId), locationEvent).catch(() => {});

  // If linked to a delivery, also broadcast to the associated order channel
  if (location.delivery_id) {
    const delivery = await getDeliveryById(location.delivery_id, companyId);
    if (delivery) {
      sseManager.broadcast(orderChannel(delivery.order_id), {
        ...locationEvent,
        order_id: delivery.order_id,
      }).catch(() => {});
    }
  }

  return c.json(
    {
      id: location.id,
      courier_id: location.courier_id,
      company_id: location.company_id,
      delivery_id: location.delivery_id,
      lat: location.lat,
      lng: location.lng,
      accuracy: location.accuracy,
      recorded_at: location.recorded_at,
      created_at: location.created_at,
    },
    201
  );
});

// --- PATCH /api/couriers/:id ---

const updateCourierRoute = createRoute({
  method: "patch",
  path: "/couriers/{id}",
  tags: ["Couriers"],
  summary: "Activate/deactivate courier",
  description:
    "Toggle courier active status. Used by operators to enable or disable a courier.",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        "application/json": { schema: UpdateActiveRequestSchema },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: CourierResponseSchema } },
      description: "Courier updated",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Courier not found",
    },
  },
});

couriersRouter.openapi(updateCourierRoute, async (c) => {
  const { id } = c.req.valid("param");
  const { active } = c.req.valid("json");
  const companyId = c.get("companyId");

  const updated = await updateCourierActive(id, companyId, active);

  if (!updated) {
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
      id: updated.id,
      company_id: updated.company_id,
      profile_id: updated.profile_id,
      full_name: updated.full_name,
      phone: updated.phone,
      photo_url: updated.photo_url,
      status: updated.status,
      total_deliveries: updated.total_deliveries,
      active: updated.active,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
    },
    200
  );
});

export { couriersRouter };
