import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { InvoiceWithItems } from "@/types/api";

export function useInvoiceDetail(invoiceId: string | null) {
  return useQuery<InvoiceWithItems>({
    queryKey: ["invoice", invoiceId],
    queryFn: () =>
      api
        .get(`api/invoices/${invoiceId}`)
        .json<InvoiceWithItems>(),
    enabled: !!invoiceId,
  });
}
