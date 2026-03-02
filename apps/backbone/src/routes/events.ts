import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { verify } from "hono/jwt";
import type { AppType } from "../types.js";
import { sseManager } from "../sse/manager.js";
import { companyChannel, courierChannel, orderChannel } from "../sse/channels.js";
import { getCourierById } from "../services/courier.service.js";

/**
 * SSE event routes — real-time event streams per channel (OSD120-OSD126).
 *
 * GET /events/company/:companyId — Central receives order/courier events
 * GET /events/courier/:courierId — Motoboy receives delivery events
 * GET /events/order/:orderId     — Lojista receives order status + courier location
 *
 * Auth: JWT via Authorization header OR ?token= query param (OSD125).
 * Heartbeat: every 30s via SSEManager (OSD126).
 */
export const eventsRouter = new Hono<AppType>().basePath("/events");

/**
 * SSE auth middleware — extracts JWT from header or query param.
 * For SSE, browsers using EventSource can only set URL params, not headers,
 * so we support ?token= as an alternative (OSD125).
 */
eventsRouter.use("/*", async (c, next) => {
  const authHeader = c.req.header("Authorization");
  let token: string | undefined;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  } else {
    token = c.req.query("token");
  }

  if (!token) {
    return c.json(
      { error: "Unauthorized", message: "Missing JWT token", statusCode: 401 },
      401
    );
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return c.json(
        { error: "Internal Server Error", message: "Auth configuration error", statusCode: 500 },
        500
      );
    }

    const payload = await verify(token, secret, "HS256");
    const userId = payload.sub as string | undefined;
    if (!userId) {
      return c.json(
        { error: "Unauthorized", message: "Invalid token: missing subject", statusCode: 401 },
        401
      );
    }

    const appMetadata = (payload as Record<string, unknown>).app_metadata as
      | Record<string, unknown>
      | undefined;

    const companyId = (appMetadata?.company_id as string) || "";
    const role = (appMetadata?.role as string) || "";

    c.set("user", { id: userId, companyId, role });

    await next();
  } catch {
    return c.json(
      { error: "Unauthorized", message: "Invalid or expired token", statusCode: 401 },
      401
    );
  }
});

/**
 * GET /events/company/:companyId — Company channel SSE stream.
 * Events: order_created, order_status, courier_location, courier_status
 * Auth: user must belong to the requested company (multi-tenancy).
 */
eventsRouter.get("/company/:companyId", (c) => {
  const user = c.get("user");
  const requestedCompanyId = c.req.param("companyId");

  if (user.companyId !== requestedCompanyId) {
    return c.json(
      { error: "Forbidden", message: "Access denied to this company channel", statusCode: 403 },
      403
    );
  }

  const channel = companyChannel(requestedCompanyId);

  return streamSSE(c, async (stream) => {
    const client = sseManager.subscribe(channel, stream);

    // Send initial connection event
    await stream.writeSSE({
      event: "connected",
      data: JSON.stringify({ type: "connected", channel, timestamp: new Date().toISOString() }),
    });

    // Keep connection alive until client disconnects
    stream.onAbort(() => {
      sseManager.unsubscribe(client);
    });

    // Block until stream closes
    while (true) {
      await stream.sleep(60_000);
    }
  });
});

/**
 * GET /events/courier/:courierId — Courier channel SSE stream.
 * Events: delivery_assigned, delivery_cancelled
 * Auth: user must be the courier or belong to the same company.
 */
eventsRouter.get("/courier/:courierId", async (c) => {
  const user = c.get("user");
  const courierId = c.req.param("courierId");

  // Operator from same company can subscribe to any courier channel.
  // Couriers can only subscribe to their own channel — verify via DB lookup.
  if (user.role !== "operator") {
    const courier = await getCourierById(courierId, user.companyId);
    if (!courier || courier.profile_id !== user.id) {
      return c.json(
        { error: "Forbidden", message: "Access denied to this courier channel", statusCode: 403 },
        403
      );
    }
  }

  const channel = courierChannel(courierId);

  return streamSSE(c, async (stream) => {
    const client = sseManager.subscribe(channel, stream);

    await stream.writeSSE({
      event: "connected",
      data: JSON.stringify({ type: "connected", channel, timestamp: new Date().toISOString() }),
    });

    stream.onAbort(() => {
      sseManager.unsubscribe(client);
    });

    while (true) {
      await stream.sleep(60_000);
    }
  });
});

/**
 * GET /events/order/:orderId — Order channel SSE stream.
 * Events: order_status, courier_location
 * Auth: user must belong to a company (any authenticated user can subscribe).
 */
eventsRouter.get("/order/:orderId", (c) => {
  const user = c.get("user");

  if (!user.companyId) {
    return c.json(
      { error: "Forbidden", message: "No company association", statusCode: 403 },
      403
    );
  }

  const orderId = c.req.param("orderId");
  const channel = orderChannel(orderId);

  return streamSSE(c, async (stream) => {
    const client = sseManager.subscribe(channel, stream);

    await stream.writeSSE({
      event: "connected",
      data: JSON.stringify({ type: "connected", channel, timestamp: new Date().toISOString() }),
    });

    stream.onAbort(() => {
      sseManager.unsubscribe(client);
    });

    while (true) {
      await stream.sleep(60_000);
    }
  });
});
