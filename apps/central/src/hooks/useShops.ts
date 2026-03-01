import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Shop } from "@/types/api";

export function useShops() {
  return useQuery<Shop[]>({
    queryKey: ["shops"],
    queryFn: () => api.get("api/shops").json<Shop[]>(),
  });
}
