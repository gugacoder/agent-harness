import { serve } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import type { AppType } from "./types.js";
import { errorHandler } from "./middleware/error-handler.js";
import { healthRouter } from "./routes/health.js";
import { authRouter, otpAuthRouter } from "./routes/auth.js";
import { companiesRouter } from "./routes/companies.js";
import { shopsRouter } from "./routes/shops.js";
import { ordersRouter } from "./routes/orders.js";
import { deliveriesRouter } from "./routes/deliveries.js";
import { couriersRouter } from "./routes/couriers.js";
import { pricingRouter } from "./routes/pricing.js";
import { companyConfigRouter } from "./routes/company-config.js";
import { financialRouter } from "./routes/financial.js";
import { earningsRouter } from "./routes/earnings.js";
import { deliveryProofRouter } from "./routes/delivery-proof.js";
import { invoicesRouter } from "./routes/invoices.js";
import { analyticsRouter } from "./routes/analytics.js";
import { eventsRouter } from "./routes/events.js";
import { profilesRouter } from "./routes/profiles.js";
import { usersRouter } from "./routes/users.js";

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
app.route("/", otpAuthRouter);

// OpenAPI doc endpoint (F-012) — public, lazily generates spec from all routes
app.get("/doc", (c) => {
  const doc = app.getOpenAPIDocument({
    openapi: "3.1.0",
    info: {
      title: "Chega.la Backbone API",
      version: "1.0.0",
      description: "Backend API for the Chega.la delivery platform",
    },
    servers: [{ url: "/api" }],
  });
  return c.json(doc);
});

// SSE event streams (F-011) — mounted before authenticated routers
// so the events router's own auth middleware (supports ?token= query param) runs first
app.route("/", eventsRouter);

// Routes — authenticated
app.route("/", authRouter);
app.route("/", companiesRouter);
app.route("/", shopsRouter);
app.route("/", ordersRouter);
app.route("/", deliveriesRouter);
app.route("/", couriersRouter);
app.route("/", pricingRouter);
app.route("/", companyConfigRouter);
app.route("/", financialRouter);
app.route("/", earningsRouter);
app.route("/", deliveryProofRouter);
app.route("/", invoicesRouter);
app.route("/", analyticsRouter);
app.route("/", profilesRouter);
app.route("/", usersRouter);

const port = parseInt(process.env.BACKBONE_PORT!, 10);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Backbone listening on http://localhost:${info.port}`);
});

export default app;
