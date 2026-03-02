import { useState } from "react";
import { Filter, X } from "lucide-react";
import type { OrderStatus } from "@/types/api";

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "delivered", label: "Entregue" },
  { value: "cancelled", label: "Cancelado" },
];

export interface HistoryFilters {
  dateFrom: string;
  dateTo: string;
  statuses: OrderStatus[];
}

interface OrderHistoryFiltersProps {
  filters: HistoryFilters;
  onChange: (filters: HistoryFilters) => void;
  resultCount: number;
}

function getDefaultDateFrom() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 10);
}

function getDefaultDateTo() {
  return new Date().toISOString().slice(0, 10);
}

export const DEFAULT_FILTERS: HistoryFilters = {
  dateFrom: getDefaultDateFrom(),
  dateTo: getDefaultDateTo(),
  statuses: [],
};

export function OrderHistoryFilters({
  filters,
  onChange,
  resultCount,
}: OrderHistoryFiltersProps) {
  const [open, setOpen] = useState(false);

  const hasActiveFilters =
    filters.statuses.length > 0 ||
    filters.dateFrom !== DEFAULT_FILTERS.dateFrom ||
    filters.dateTo !== DEFAULT_FILTERS.dateTo;

  const toggleStatus = (status: OrderStatus) => {
    const next = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onChange({ ...filters, statuses: next });
  };

  const clearFilters = () => {
    onChange({ ...DEFAULT_FILTERS });
  };

  return (
    <div className="space-y-2">
      {/* Toggle button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          <Filter className="h-4 w-4" />
          Filtros
          {hasActiveFilters && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
              !
            </span>
          )}
        </button>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Limpar
          </button>
        )}
      </div>

      {/* Filter panel */}
      {open && (
        <div className="space-y-3 rounded-lg border bg-card p-3">
          {/* Date range */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Período
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) =>
                  onChange({ ...filters, dateFrom: e.target.value })
                }
                className="flex-1 rounded-md border bg-background px-2 py-1.5 text-sm"
              />
              <span className="text-xs text-muted-foreground">até</span>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) =>
                  onChange({ ...filters, dateTo: e.target.value })
                }
                className="flex-1 rounded-md border bg-background px-2 py-1.5 text-sm"
              />
            </div>
          </div>

          {/* Status filter */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((opt) => {
                const active = filters.statuses.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleStatus(opt.value)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      active
                        ? "bg-primary text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Result count */}
      <p className="text-xs text-muted-foreground">
        {resultCount} {resultCount === 1 ? "pedido encontrado" : "pedidos encontrados"}
      </p>
    </div>
  );
}
