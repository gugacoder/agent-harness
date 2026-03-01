import { useMemo } from "react";
import { ChevronRight, FileText, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { InvoiceStatusBadge } from "@/components/ui/StatusBadge";
import type { Invoice, Shop } from "@/types/api";

interface InvoiceListProps {
  invoices: Invoice[] | undefined;
  shops: Shop[] | undefined;
  isLoading: boolean;
  onSelect: (invoiceId: string) => void;
}

function formatCurrency(value: string) {
  return `R$ ${parseFloat(value).toFixed(2).replace(".", ",")}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

export function InvoiceList({
  invoices,
  shops,
  isLoading,
  onSelect,
}: InvoiceListProps) {
  const shopMap = useMemo(() => {
    const map = new Map<string, string>();
    shops?.forEach((s) => map.set(s.id, s.trade_name));
    return map;
  }, [shops]);

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      {isLoading ? (
        <div className="space-y-3 p-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : !invoices || invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhuma fatura encontrada"
          description="Gere uma nova fatura para um lojista"
        />
      ) : (
        <ul className="divide-y">
          {invoices.map((invoice) => (
            <li key={invoice.id}>
              <button
                onClick={() => onSelect(invoice.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">
                      {shopMap.get(invoice.shop_id) ?? "Lojista"}
                    </span>
                    <InvoiceStatusBadge status={invoice.status} />
                    <span className="text-xs text-muted-foreground font-mono">
                      #{invoice.invoice_number}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(invoice.period_start)} —{" "}
                      {formatDate(invoice.period_end)}
                    </span>
                    <span>{invoice.total_deliveries} entregas</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-semibold text-sm">
                    {formatCurrency(invoice.total_amount)}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
