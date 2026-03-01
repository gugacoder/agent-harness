import { createContext, useContext, type ReactNode } from "react";
import {
  useCompanyEvents,
} from "@/hooks/useCompanyEvents";
import type { CourierLocation } from "@/hooks/useCompanyEvents";

interface CompanyEventsContextValue {
  connected: boolean;
  courierLocations: Map<string, CourierLocation>;
  orderCourierMap: Map<string, CourierLocation>;
}

const CompanyEventsContext = createContext<CompanyEventsContextValue | null>(
  null,
);

/**
 * Provider that establishes a single SSE connection to the company channel.
 * Place inside AuthProvider (needs auth) and QueryClientProvider (invalidates queries).
 *
 * All authenticated routes share this single SSE connection.
 */
export function CompanyEventsProvider({ children }: { children: ReactNode }) {
  const value = useCompanyEvents();

  return (
    <CompanyEventsContext.Provider value={value}>
      {children}
    </CompanyEventsContext.Provider>
  );
}

export function useCompanyEventsContext() {
  const ctx = useContext(CompanyEventsContext);
  if (!ctx) {
    throw new Error(
      "useCompanyEventsContext deve ser usado dentro de CompanyEventsProvider",
    );
  }
  return ctx;
}
