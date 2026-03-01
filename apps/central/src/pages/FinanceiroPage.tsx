import { useState, useCallback, useMemo } from "react";
import { Wallet, Plus, Filter } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useClosings } from "@/hooks/useClosings";
import { useCouriers } from "@/hooks/useCouriers";
import { ClosingList } from "@/components/financial/ClosingList";
import { ClosingDetail } from "@/components/financial/ClosingDetail";
import { CreateClosingForm } from "@/components/financial/CreateClosingForm";
import type { ClosingStatus } from "@/types/api";

type View = { type: "list" } | { type: "detail"; closingId: string };

function formatCurrency(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

export function FinanceiroPage() {
  const [view, setView] = useState<View>({ type: "list" });
  const [showCreate, setShowCreate] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterCourierId, setFilterCourierId] = useState("");
  const [filterStatus, setFilterStatus] = useState<ClosingStatus | "">("");
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");

  const queryClient = useQueryClient();
  const { data: couriers } = useCouriers();

  const filterOptions = useMemo(
    () => ({
      courierId: filterCourierId || undefined,
      status: (filterStatus || undefined) as ClosingStatus | undefined,
      periodStart: filterStart || undefined,
      periodEnd: filterEnd || undefined,
    }),
    [filterCourierId, filterStatus, filterStart, filterEnd],
  );

  const { data: closings, isLoading } = useClosings(filterOptions);

  const invalidateClosings = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["closings"] });
  }, [queryClient]);

  // Summary calculations
  const summary = useMemo(() => {
    if (!closings) return { pending: 0, paid: 0 };
    let pending = 0;
    let paid = 0;
    for (const c of closings) {
      const amount = parseFloat(c.total_amount);
      if (c.status === "paid") {
        paid += amount;
      } else {
        pending += amount;
      }
    }
    return { pending, paid };
  }, [closings]);

  // --- Detail view ---
  if (view.type === "detail") {
    return (
      <ClosingDetail
        closingId={view.closingId}
        couriers={couriers}
        onBack={() => setView({ type: "list" })}
        onInvalidate={invalidateClosings}
      />
    );
  }

  // --- List view ---
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <Wallet className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
        </div>
        <p className="mt-1 text-muted-foreground">
          Gerencie os fechamentos financeiros dos motoboys.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Pendente</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">
            {formatCurrency(summary.pending)}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Pago</p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {formatCurrency(summary.paid)}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {showCreate ? (
          <CreateClosingForm
            couriers={couriers}
            onCreated={() => {
              setShowCreate(false);
              invalidateClosings();
            }}
            onCancel={() => setShowCreate(false)}
          />
        ) : (
          <>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Gerar Fechamento
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm font-medium transition-colors ${
                showFilters ? "bg-muted" : "hover:bg-muted"
              }`}
            >
              <Filter className="h-4 w-4" />
              Filtros
            </button>
          </>
        )}
      </div>

      {/* Filters */}
      {showFilters && !showCreate && (
        <div className="grid grid-cols-2 gap-3 rounded-lg border bg-card p-4 shadow-sm md:grid-cols-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Motoboy
            </label>
            <select
              value={filterCourierId}
              onChange={(e) => setFilterCourierId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Todos</option>
              {couriers?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as ClosingStatus | "")
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Todos</option>
              <option value="draft">Rascunho</option>
              <option value="confirmed">Confirmado</option>
              <option value="paid">Pago</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Período início
            </label>
            <input
              type="date"
              value={filterStart}
              onChange={(e) => setFilterStart(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Período fim
            </label>
            <input
              type="date"
              value={filterEnd}
              onChange={(e) => setFilterEnd(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      )}

      {/* Closing list */}
      <ClosingList
        closings={closings}
        couriers={couriers}
        isLoading={isLoading}
        onSelect={(closingId) => setView({ type: "detail", closingId })}
      />
    </div>
  );
}
