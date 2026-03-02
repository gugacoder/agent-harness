import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { InvoiceWithItems } from "@/types/api";

export function useInvoice(invoiceId: string | null) {
  return useQuery<InvoiceWithItems | null>({
    queryKey: ["invoice", invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null;
      return api.get(`api/invoices/${invoiceId}`).json<InvoiceWithItems>();
    },
    enabled: !!invoiceId,
  });
}
