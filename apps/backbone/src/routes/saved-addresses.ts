import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  CreateSavedAddressSchema,
  UpdateSavedAddressSchema,
  SavedAddressResponseSchema,
  SavedAddressListResponseSchema,
} from "@chegala/schemas";
import type { AppType } from "../types.js";
import { authMiddleware } from "../middleware/auth.js";
import { companyMiddleware } from "../middleware/company.js";
import {
  listSavedAddresses,
  createSavedAddress,
  updateSavedAddress,
  deleteSavedAddress,
} from "../services/address.service.js";

const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number().int(),
});

const savedAddressesRouter = new OpenAPIHono<AppType>({
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

savedAddressesRouter.use("/*", authMiddleware);
savedAddressesRouter.use("/*", companyMiddleware);

// --- GET /saved-addresses ---

const listRoute = createRoute({
  method: "get",
  path: "/saved-addresses",
  tags: ["Saved Addresses"],
  summary: "List saved addresses",
  description:
    "List saved addresses for the authenticated user. Supports search and sort query params.",
  request: {
    query: z.object({
      search: z.string().optional(),
      sort: z.enum(["most_used", "recent", "alpha"]).optional(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: SavedAddressListResponseSchema },
      },
      description: "List of saved addresses",
    },
  },
});

savedAddressesRouter.openapi(listRoute, async (c) => {
  const user = c.get("user");
  const companyId = c.get("companyId");
  const { search, sort } = c.req.valid("query");

  const addresses = await listSavedAddresses(user.id, companyId, {
    search,
    sort,
  });

  return c.json(addresses, 200);
});

// --- POST /saved-addresses ---

const createRoute_ = createRoute({
  method: "post",
  path: "/saved-addresses",
  tags: ["Saved Addresses"],
  summary: "Create saved address",
  request: {
    body: {
      content: {
        "application/json": { schema: CreateSavedAddressSchema },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": { schema: SavedAddressResponseSchema },
      },
      description: "Created saved address",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Validation error",
    },
  },
});

savedAddressesRouter.openapi(createRoute_, async (c) => {
  const user = c.get("user");
  const companyId = c.get("companyId");
  const body = c.req.valid("json");

  const created = await createSavedAddress({
    companyId,
    profileId: user.id,
    address: body.address,
    lat: body.lat,
    lng: body.lng,
    label: body.label,
    complement: body.complement,
    reference: body.reference,
    isFavorite: body.is_favorite,
  });

  return c.json(created, 201);
});

// --- PATCH /saved-addresses/:id ---

const updateRoute = createRoute({
  method: "patch",
  path: "/saved-addresses/{id}",
  tags: ["Saved Addresses"],
  summary: "Update saved address",
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ param: { name: "id", in: "path" } }),
    }),
    body: {
      content: {
        "application/json": { schema: UpdateSavedAddressSchema },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: SavedAddressResponseSchema },
      },
      description: "Updated saved address",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Validation error",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Address not found or not owned",
    },
  },
});

savedAddressesRouter.openapi(updateRoute, async (c) => {
  const user = c.get("user");
  const companyId = c.get("companyId");
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");

  const updated = await updateSavedAddress(id, user.id, companyId, {
    label: body.label,
    address: body.address,
    lat: body.lat,
    lng: body.lng,
    complement: body.complement,
    reference: body.reference,
    isFavorite: body.is_favorite,
  });

  if (!updated) {
    return c.json(
      {
        error: "Not Found",
        message: "Address not found or not owned by current user",
        statusCode: 404,
      },
      404
    );
  }

  return c.json(updated, 200);
});

// --- DELETE /saved-addresses/:id ---

const deleteRoute = createRoute({
  method: "delete",
  path: "/saved-addresses/{id}",
  tags: ["Saved Addresses"],
  summary: "Delete saved address",
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ param: { name: "id", in: "path" } }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: SavedAddressResponseSchema },
      },
      description: "Deleted saved address",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Address not found or not owned",
    },
  },
});

savedAddressesRouter.openapi(deleteRoute, async (c) => {
  const user = c.get("user");
  const companyId = c.get("companyId");
  const { id } = c.req.valid("param");

  const deleted = await deleteSavedAddress(id, user.id, companyId);

  if (!deleted) {
    return c.json(
      {
        error: "Not Found",
        message: "Address not found or not owned by current user",
        statusCode: 404,
      },
      404
    );
  }

  return c.json(deleted, 200);
});

export { savedAddressesRouter };
