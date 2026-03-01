import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Order, OrderStatus } from "@/types/api";

interface UseOrdersOptions {
  status?: OrderStatus;
}

export function useOrders(options?: UseOrdersOptions) {
  return useQuery<Order[]>({
    queryKey: ["orders", options?.status],
    queryFn: async () => {
      const searchParams: Record<string, string> = {};
      if (options?.status) searchParams.status = options.status;
      return api.get("api/orders", { searchParams }).json<Order[]>();
    },
  });
}
