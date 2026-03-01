import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Courier, CourierStatus } from "@/types/api";

interface UseCouriersOptions {
  status?: CourierStatus;
  active?: boolean;
}

export function useCouriers(options?: UseCouriersOptions) {
  return useQuery<Courier[]>({
    queryKey: ["couriers", options?.status, options?.active],
    queryFn: async () => {
      const searchParams: Record<string, string> = {};
      if (options?.status) searchParams.status = options.status;
      if (options?.active !== undefined)
        searchParams.active = String(options.active);
      return api.get("api/couriers", { searchParams }).json<Courier[]>();
    },
  });
}
