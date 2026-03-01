// Shared Hono app type — used across index.ts, middleware, and routes
export type AppType = {
  Variables: {
    user: { id: string; companyId: string; role: string };
    companyId: string;
  };
};
