import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Invoice, InvoiceStatus } from "@/types/api";

export interface UseInvoicesOptions {
  shopId?: string;
  status?: InvoiceStatus;
  periodStart?: string;
  periodEnd?: string;
}

export function useInvoices(options?: UseInvoicesOptions) {
  return useQuery<Invoice[]>({
    queryKey: [
      "invoices",
      options?.shopId,
      options?.status,
      options?.periodStart,
      options?.periodEnd,
    ],
    queryFn: async () => {
      const searchParams: Record<string, string> = {};
      if (options?.shopId) searchParams.shop_id = options.shopId;
      if (options?.status) searchParams.status = options.status;
      if (options?.periodStart) searchParams.period_start = options.periodStart;
      if (options?.periodEnd) searchParams.period_end = options.periodEnd;
      return api
        .get("api/invoices", { searchParams })
        .json<Invoice[]>();
    },
  });
}
