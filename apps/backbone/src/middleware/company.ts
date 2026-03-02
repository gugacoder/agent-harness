import { createMiddleware } from "hono/factory";
import type { AppType } from "../types.js";

/**
 * Company middleware — enforces multi-tenancy isolation.
 *
 * Reads company_id from the authenticated user context (set by auth middleware),
 * injects it into Hono context for downstream route handlers, and blocks
 * cross-tenant access attempts.
 *
 * Must be applied AFTER auth middleware.
 */
export const companyMiddleware = createMiddleware<AppType>(async (c, next) => {
  const user = c.get("user");

  // Super admin bypass: doesn't require companyId, can impersonate via header
  if (user.role === "super_admin") {
    const impersonateCompany = c.req.header("X-Impersonate-Company");
    if (impersonateCompany) {
      c.set("companyId", impersonateCompany);
    }
    await next();
    return;
  }

  if (!user?.companyId) {
    return c.json(
      {
        error: "Forbidden",
        message: "User is not associated with any company",
        statusCode: 403,
      },
      403
    );
  }

  // Inject companyId into context for downstream query filtering
  c.set("companyId", user.companyId);

  // Cross-tenant check: if route has a :companyId param, it must match
  const paramCompanyId = c.req.param("companyId");
  if (paramCompanyId && paramCompanyId !== user.companyId) {
    return c.json(
      {
        error: "Forbidden",
        message: "Access denied: cross-tenant access is not allowed",
        statusCode: 403,
      },
      403
    );
  }

  await next();
});
