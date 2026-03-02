import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  GeocodingCepResponseSchema,
  GeocodingSearchResultSchema,
  GeocodingReverseResponseSchema,
} from "@chegala/schemas";
import type { AppType } from "../types.js";
import { authMiddleware } from "../middleware/auth.js";
import { companyMiddleware } from "../middleware/company.js";
import {
  searchByCep,
  searchByText,
  reverseGeocode,
} from "../services/geocoding.service.js";

const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number().int(),
});

const geocodingRouter = new OpenAPIHono<AppType>({
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

geocodingRouter.use("/*", authMiddleware);
geocodingRouter.use("/*", companyMiddleware);

// --- GET /geocoding/cep/:cep ---

const cepRoute = createRoute({
  method: "get",
  path: "/geocoding/cep/{cep}",
  tags: ["Geocoding"],
  summary: "Search address by CEP",
  request: {
    params: z.object({
      cep: z
        .string()
        .regex(/^\d{8}$/, "CEP must be exactly 8 digits")
        .openapi({ param: { name: "cep", in: "path" } }),
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: GeocodingCepResponseSchema } },
      description: "Address found for CEP",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Invalid CEP format",
    },
    502: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Geocoding provider failure",
    },
  },
});

geocodingRouter.openapi(cepRoute, async (c) => {
  const { cep } = c.req.valid("param");
  try {
    const result = await searchByCep(cep);
    return c.json(result, 200);
  } catch (err) {
    return c.json(
      {
        error: "Bad Gateway",
        message: err instanceof Error ? err.message : "Geocoding provider failed",
        statusCode: 502,
      },
      502
    );
  }
});

// --- GET /geocoding/search ---

const searchRoute = createRoute({
  method: "get",
  path: "/geocoding/search",
  tags: ["Geocoding"],
  summary: "Search address by text",
  request: {
    query: z.object({
      q: z.string().min(3, "Query must be at least 3 characters"),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.array(GeocodingSearchResultSchema) },
      },
      description: "Search results",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Invalid query parameter",
    },
    502: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Geocoding provider failure",
    },
  },
});

geocodingRouter.openapi(searchRoute, async (c) => {
  const { q } = c.req.valid("query");
  try {
    const results = await searchByText(q);
    return c.json(results, 200);
  } catch (err) {
    return c.json(
      {
        error: "Bad Gateway",
        message: err instanceof Error ? err.message : "Geocoding provider failed",
        statusCode: 502,
      },
      502
    );
  }
});

// --- GET /geocoding/reverse ---

const reverseRoute = createRoute({
  method: "get",
  path: "/geocoding/reverse",
  tags: ["Geocoding"],
  summary: "Reverse geocode coordinates",
  request: {
    query: z.object({
      lat: z.coerce.number().min(-90).max(90),
      lng: z.coerce.number().min(-180).max(180),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: GeocodingReverseResponseSchema },
      },
      description: "Reverse geocoding result",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Invalid coordinates",
    },
    502: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Geocoding provider failure",
    },
  },
});

geocodingRouter.openapi(reverseRoute, async (c) => {
  const { lat, lng } = c.req.valid("query");
  try {
    const result = await reverseGeocode(lat, lng);
    return c.json(result, 200);
  } catch (err) {
    return c.json(
      {
        error: "Bad Gateway",
        message: err instanceof Error ? err.message : "Geocoding provider failed",
        statusCode: 502,
      },
      502
    );
  }
});

export { geocodingRouter };
