import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Shop } from "@/types/api";

/**
 * Fetch the current user's shop (first shop in their company).
 * Used to pre-fill pickup address on the new order form.
 */
export function useShop() {
  return useQuery<Shop | null>({
    queryKey: ["shop"],
    queryFn: async () => {
      const shops = await api.get("api/shops").json<Shop[]>();
      return shops[0] ?? null;
    },
  });
}
