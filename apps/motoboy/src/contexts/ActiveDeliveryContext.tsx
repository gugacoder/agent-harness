import { createContext, useContext, type ReactNode } from "react";
import { useActiveDelivery } from "@/hooks/useActiveDelivery";

type ActiveDeliveryValue = ReturnType<typeof useActiveDelivery>;

const ActiveDeliveryContext = createContext<ActiveDeliveryValue | null>(null);

/**
 * Provider that holds a single shared useActiveDelivery instance.
 * Place inside AuthProvider + QueryClientProvider.
 * Both AppShell and EntregasPage consume this context.
 */
export function ActiveDeliveryProvider({ children }: { children: ReactNode }) {
  const value = useActiveDelivery();
  return (
    <ActiveDeliveryContext.Provider value={value}>
      {children}
    </ActiveDeliveryContext.Provider>
  );
}

export function useActiveDeliveryContext() {
  const ctx = useContext(ActiveDeliveryContext);
  if (!ctx) {
    throw new Error(
      "useActiveDeliveryContext deve ser usado dentro de ActiveDeliveryProvider",
    );
  }
  return ctx;
}
