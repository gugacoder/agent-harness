import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  ShopDetail,
  ShopOrdersResponse,
  ShopFinancialSummary,
} from "@/types/api";

export function useShopDetail(shopId: string | null) {
  return useQuery<ShopDetail>({
    queryKey: ["shop", shopId],
    queryFn: () => api.get(`api/shops/${shopId}`).json<ShopDetail>(),
    enabled: !!shopId,
  });
}

export function useShopOrders(
  shopId: string | null,
  options?: { limit?: number; offset?: number; status?: string; period?: number }
) {
  return useQuery<ShopOrdersResponse>({
    queryKey: ["shop-orders", shopId, options],
    queryFn: () => {
      const searchParams: Record<string, string> = {};
      if (options?.limit) searchParams.limit = String(options.limit);
      if (options?.offset) searchParams.offset = String(options.offset);
      if (options?.status) searchParams.status = options.status;
      if (options?.period) searchParams.period = String(options.period);
      return api
        .get(`api/shops/${shopId}/orders`, { searchParams })
        .json<ShopOrdersResponse>();
    },
    enabled: !!shopId,
  });
}

export function useShopFinancialSummary(shopId: string | null) {
  return useQuery<ShopFinancialSummary>({
    queryKey: ["shop-financial", shopId],
    queryFn: () =>
      api
        .get(`api/shops/${shopId}/financial-summary`)
        .json<ShopFinancialSummary>(),
    enabled: !!shopId,
  });
}

export function useUpdateShop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      shopId,
      data,
    }: {
      shopId: string;
      data: {
        trade_name?: string;
        phone?: string;
        address?: string;
        lat?: string;
        lng?: string;
        contact_name?: string | null;
      };
    }) => api.patch(`api/shops/${shopId}`, { json: data }).json(),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["shop", variables.shopId] });
      queryClient.invalidateQueries({ queryKey: ["shops"] });
    },
  });
}

export function useToggleShopStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      shopId,
      active,
    }: {
      shopId: string;
      active: boolean;
    }) =>
      api.patch(`api/shops/${shopId}/status`, { json: { active } }).json(),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["shop", variables.shopId] });
      queryClient.invalidateQueries({ queryKey: ["shops"] });
    },
  });
}
