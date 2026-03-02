// Shared Hono app type — used across index.ts, middleware, and routes
export type Role = "operator" | "shop" | "courier" | "super_admin";

export type AppType = {
  Variables: {
    user: { id: string; companyId: string | undefined; role: Role };
    companyId: string;
  };
};
