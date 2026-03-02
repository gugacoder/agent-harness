import { createMiddleware } from "hono/factory";
import type { AppType, Role } from "../types.js";

export const requireRole = (...roles: Role[]) => {
  return createMiddleware<AppType>(async (c, next) => {
    const user = c.get("user");

    if (!roles.includes(user.role)) {
      console.warn(
        `[RBAC] Blocked: user_id=${user.id}, endpoint=${c.req.method} ${c.req.path}, role_atual=${user.role}, roles_requeridos=${roles.join(",")}`
      );
      return c.json(
        {
          error: "Forbidden",
          message: "Voce nao tem permissao para esta acao",
          statusCode: 403,
        },
        403
      );
    }

    await next();
  });
};
