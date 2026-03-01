import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AppType } from "../types.js";

const healthRouter = new OpenAPIHono<AppType>();

const HealthResponseSchema = z.object({
  status: z.literal("ok"),
  timestamp: z.string().datetime(),
});

const healthRoute = createRoute({
  method: "get",
  path: "/health",
  tags: ["System"],
  summary: "Health check",
  responses: {
    200: {
      content: { "application/json": { schema: HealthResponseSchema } },
      description: "Service is healthy",
    },
  },
});

healthRouter.openapi(healthRoute, (c) => {
  return c.json(
    { status: "ok" as const, timestamp: new Date().toISOString() },
    200
  );
});

export { healthRouter };
