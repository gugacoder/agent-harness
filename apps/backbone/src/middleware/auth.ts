import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import type { AppType, Role } from "../types.js";

/**
 * Auth middleware — validates JWT from GoTrue (Supabase Auth).
 *
 * Extracts Bearer token from Authorization header, verifies signature
 * with JWT_SECRET (HS256), and injects user context into Hono's c.set().
 *
 * GoTrue JWT claims:
 *   sub — user UUID (same as profiles.id)
 *   app_metadata.company_id — tenant UUID
 *   app_metadata.role — "operator" | "shop" | "courier"
 */
export const authMiddleware = createMiddleware<AppType>(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json(
      {
        error: "Unauthorized",
        message: "Missing or invalid Authorization header",
        statusCode: 401,
      },
      401
    );
  }

  const token = authHeader.slice(7);

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET is not configured");
      return c.json(
        {
          error: "Internal Server Error",
          message: "Auth configuration error",
          statusCode: 500,
        },
        500
      );
    }

    const payload = await verify(token, secret, "HS256");

    const userId = payload.sub as string | undefined;
    if (!userId) {
      return c.json(
        {
          error: "Unauthorized",
          message: "Invalid token: missing subject",
          statusCode: 401,
        },
        401
      );
    }

    // GoTrue stores custom metadata in app_metadata
    const appMetadata =
      (payload as Record<string, unknown>).app_metadata as
        | Record<string, unknown>
        | undefined;

    const companyId = (appMetadata?.company_id as string) || undefined;
    const role = (appMetadata?.role || "") as Role;

    c.set("user", { id: userId, companyId, role });

    await next();
  } catch {
    return c.json(
      {
        error: "Unauthorized",
        message: "Invalid or expired token",
        statusCode: 401,
      },
      401
    );
  }
});
