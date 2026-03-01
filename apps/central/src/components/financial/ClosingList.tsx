import { useMemo } from "react";
import {
  ChevronRight,
  Wallet,
  Calendar,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ClosingStatusBadge } from "@/components/ui/StatusBadge";
import type { FinancialClosing, Courier } from "@/types/api";

interface ClosingListProps {
  closings: FinancialClosing[] | undefined;
  couriers: Courier[] | undefined;
  isLoading: boolean;
  onSelect: (closingId: string) => void;
}

function formatCurrency(value: string) {
  return `R$ ${parseFloat(value).toFixed(2).replace(".", ",")}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

export function ClosingList({
  closings,
  couriers,
  isLoading,
  onSelect,
}: ClosingListProps) {
  const courierMap = useMemo(() => {
    const map = new Map<string, string>();
    couriers?.forEach((c) => map.set(c.id, c.full_name));
    return map;
  }, [couriers]);

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      {isLoading ? (
        <div className="space-y-3 p-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : !closings || closings.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Nenhum fechamento encontrado"
          description="Gere um novo fechamento para um motoboy"
        />
      ) : (
        <ul className="divide-y">
          {closings.map((closing) => (
            <li key={closing.id}>
              <button
                onClick={() => onSelect(closing.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">
                      {courierMap.get(closing.courier_id) ?? "Motoboy"}
                    </span>
                    <ClosingStatusBadge status={closing.status} />
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(closing.period_start)} — {formatDate(closing.period_end)}
                    </span>
                    <span>{closing.total_deliveries} entregas</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-semibold text-sm">
                    {formatCurrency(closing.total_amount)}
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
