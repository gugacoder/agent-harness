import { serve } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import type { AppType } from "./types.js";

// Re-export for convenience
export type { AppType };

const app = new OpenAPIHono<AppType>().basePath("/api");

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

// Health check (no auth required)
app.get("/health", (c) =>
  c.json({ status: "ok", timestamp: new Date().toISOString() })
);

// Route mounts will be added by subsequent features:
// - F-002: auth middleware
// - F-003: company middleware
// - F-004: error handler middleware
// - F-005: health routes (enhanced), auth routes
// - F-006: companies routes
// - F-007: shops routes
// - F-008: orders routes
// - F-009: deliveries routes
// - F-010: couriers routes
// - F-011: SSE event routes
// - F-012: OpenAPI doc endpoint

const port = parseInt(process.env.BACKBONE_PORT || "3205", 10);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Backbone listening on http://localhost:${info.port}`);
});

export default app;
