import { useState, useCallback, useMemo } from "react";
import { FileText, Plus, Filter } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useInvoices } from "@/hooks/useInvoices";
import { useShops } from "@/hooks/useShops";
import { InvoiceList } from "@/components/invoices/InvoiceList";
import { InvoiceDetail } from "@/components/invoices/InvoiceDetail";
import { CreateInvoiceForm } from "@/components/invoices/CreateInvoiceForm";
import type { InvoiceStatus } from "@/types/api";

type View = { type: "list" } | { type: "detail"; invoiceId: string };

function formatCurrency(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

export function FaturasPage() {
  const [view, setView] = useState<View>({ type: "list" });
  const [showCreate, setShowCreate] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterShopId, setFilterShopId] = useState("");
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | "">("");
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");

  const queryClient = useQueryClient();
  const { data: shops } = useShops();

  const filterOptions = useMemo(
    () => ({
      shopId: filterShopId || undefined,
      status: (filterStatus || undefined) as InvoiceStatus | undefined,
      periodStart: filterStart || undefined,
      periodEnd: filterEnd || undefined,
    }),
    [filterShopId, filterStatus, filterStart, filterEnd],
  );

  const { data: invoices, isLoading } = useInvoices(filterOptions);

  const invalidateInvoices = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
  }, [queryClient]);

  // Summary calculations
  const summary = useMemo(() => {
    if (!invoices) return { pending: 0, paid: 0 };
    let pending = 0;
    let paid = 0;
    for (const inv of invoices) {
      const amount = parseFloat(inv.total_amount);
      if (inv.status === "paid") {
        paid += amount;
      } else {
        pending += amount;
      }
    }
    return { pending, paid };
  }, [invoices]);

  // --- Detail view ---
  if (view.type === "detail") {
    return (
      <InvoiceDetail
        invoiceId={view.invoiceId}
        shops={shops}
        onBack={() => setView({ type: "list" })}
        onInvalidate={invalidateInvoices}
      />
    );
  }

  // --- List view ---
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Faturas</h1>
        </div>
        <p className="mt-1 text-muted-foreground">
          Gerencie as faturas dos lojistas.
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
          <CreateInvoiceForm
            shops={shops}
            onCreated={() => {
              setShowCreate(false);
              invalidateInvoices();
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
              Gerar Fatura
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
              Lojista
            </label>
            <select
              value={filterShopId}
              onChange={(e) => setFilterShopId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Todos</option>
              {shops?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.trade_name}
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
                setFilterStatus(e.target.value as InvoiceStatus | "")
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Todos</option>
              <option value="draft">Rascunho</option>
              <option value="sent">Enviada</option>
              <option value="paid">Paga</option>
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

      {/* Invoice list */}
      <InvoiceList
        invoices={invoices}
        shops={shops}
        isLoading={isLoading}
        onSelect={(invoiceId) => setView({ type: "detail", invoiceId })}
      />
    </div>
  );
}
