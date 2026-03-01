import { serve } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import type { AppType } from "./types.js";
import { errorHandler } from "./middleware/error-handler.js";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { companiesRouter } from "./routes/companies.js";
import { shopsRouter } from "./routes/shops.js";
import { ordersRouter } from "./routes/orders.js";
import { deliveriesRouter } from "./routes/deliveries.js";
import { couriersRouter } from "./routes/couriers.js";

// Re-export for convenience
export type { AppType };

const app = new OpenAPIHono<AppType>({
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
}).basePath("/api");

// Global error handler
app.onError(errorHandler);

// Global middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// Routes — public
app.route("/", healthRouter);

// Routes — authenticated
app.route("/", authRouter);
app.route("/", companiesRouter);
app.route("/", shopsRouter);
app.route("/", ordersRouter);
app.route("/", deliveriesRouter);
app.route("/", couriersRouter);

// Route mounts will be added by subsequent features:
// - F-011: SSE event routes
// - F-012: OpenAPI doc endpoint

const port = parseInt(process.env.BACKBONE_PORT || "3205", 10);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Backbone listening on http://localhost:${info.port}`);
});

export default app;
