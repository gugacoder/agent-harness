import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  FileText,
  ChevronLeft,
  Download,
  Calendar,
  Filter,
  DollarSign,
  MapPin,
  Truck,
} from "lucide-react";
import { useInvoices } from "@/hooks/useInvoices";
import { useInvoice } from "@/hooks/useInvoice";
import { useCompanyEventsContext } from "@/contexts/CompanyEventsContext";
import {
  InvoiceStatusBadge,
  getDisplayStatus,
  STATUS_LABELS,
  type DisplayInvoiceStatus,
} from "@/components/invoices/InvoiceStatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { api } from "@/lib/api";
import type { Invoice, InvoiceWithItems } from "@/types/api";

// --- Helpers ---

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatCurrency(value: string) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatPeriod(start: string, end: string) {
  return `${formatDate(start)} — ${formatDate(end)}`;
}

// --- Invoice Card (List Item) ---

function InvoiceCard({
  invoice,
  onClick,
  highlight,
}: {
  invoice: Invoice;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-3 text-left transition-colors hover:bg-muted/50 ${highlight ? "animate-highlight-fade bg-primary/10" : ""}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">#{invoice.invoice_number}</span>
          <InvoiceStatusBadge
            status={invoice.status}
            periodEnd={invoice.period_end}
          />
        </div>
        <span className="text-sm font-semibold">
          {formatCurrency(invoice.total_amount)}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {formatPeriod(invoice.period_start, invoice.period_end)}
        </span>
        <span className="text-xs text-muted-foreground">
          {invoice.total_deliveries}{" "}
          {invoice.total_deliveries === 1 ? "entrega" : "entregas"}
        </span>
      </div>
    </button>
  );
}

// --- Invoice Detail ---

function InvoiceDetail({
  invoiceId,
  onBack,
}: {
  invoiceId: string;
  onBack: () => void;
}) {
  const { data: invoice, isLoading, error } = useInvoice(invoiceId);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPdf = useCallback(async () => {
    if (!invoice) return;
    setDownloading(true);
    try {
      const blob = await api.get(`api/invoices/${invoice.id}/pdf`).blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fatura-${invoice.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Silently handle — user can retry
    } finally {
      setDownloading(false);
    }
  }, [invoice]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </button>
        <ErrorAlert message="Não foi possível carregar a fatura." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-md p-1 hover:bg-muted"
          aria-label="Voltar"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold">
            Fatura #{invoice.invoice_number}
          </h2>
          <InvoiceStatusBadge
            status={invoice.status}
            periodEnd={invoice.period_end}
          />
        </div>
      </div>

      {/* Summary Card */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="border-b px-4 py-3">
          <h3 className="font-semibold">Resumo</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
          <div className="flex items-start gap-2">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Período</p>
              <p className="text-sm font-medium">
                {formatPeriod(invoice.period_start, invoice.period_end)}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Truck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Entregas</p>
              <p className="text-sm font-medium">{invoice.total_deliveries}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Distância Total</p>
              <p className="text-sm font-medium">
                {Number(invoice.total_distance_km).toFixed(1)} km
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <DollarSign className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Valor Total</p>
              <p className="text-sm font-semibold">
                {formatCurrency(invoice.total_amount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment / Status History */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="border-b px-4 py-3">
          <h3 className="font-semibold">Dados de Pagamento</h3>
        </div>
        <div className="space-y-2 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Emissão</span>
            <span>{formatDate(invoice.created_at)}</span>
          </div>
          {invoice.sent_at && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Enviada</span>
              <span>{formatDate(invoice.sent_at)}</span>
            </div>
          )}
          {invoice.paid_at && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Paga em</span>
              <span>{formatDate(invoice.paid_at)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <InvoiceStatusBadge
              status={invoice.status}
              periodEnd={invoice.period_end}
            />
          </div>
        </div>
      </div>

      {/* Items Table */}
      <InvoiceItemsTable invoice={invoice} />

      {/* PDF Export Button */}
      <button
        onClick={handleDownloadPdf}
        disabled={downloading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        <Download className="h-4 w-4" />
        {downloading ? "Baixando..." : "Exportar PDF"}
      </button>
    </div>
  );
}

// --- Invoice Items Table ---

function InvoiceItemsTable({ invoice }: { invoice: InvoiceWithItems }) {
  if (!invoice.items || invoice.items.length === 0) {
    return (
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="border-b px-4 py-3">
          <h3 className="font-semibold">Entregas</h3>
        </div>
        <EmptyState icon={Truck} title="Nenhuma entrega nesta fatura" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="border-b px-4 py-3">
        <h3 className="font-semibold">Entregas ({invoice.items.length})</h3>
      </div>

      {/* Mobile card layout */}
      <div className="divide-y sm:hidden">
        {invoice.items.map((item) => (
          <div key={item.id} className="space-y-1 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                #{item.order_number}
              </span>
              <span className="text-sm font-semibold">
                {formatCurrency(item.price)}
              </span>
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {item.delivery_address}
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatDate(item.delivered_at)}</span>
              <span>{Number(item.distance_km).toFixed(1)} km</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table layout */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
              <th className="px-4 py-2 font-medium">Data</th>
              <th className="px-4 py-2 font-medium">Pedido</th>
              <th className="px-4 py-2 font-medium">Destino</th>
              <th className="px-4 py-2 font-medium text-right">Distância</th>
              <th className="px-4 py-2 font-medium text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {invoice.items.map((item) => (
              <tr key={item.id} className="hover:bg-muted/30">
                <td className="whitespace-nowrap px-4 py-2">
                  {formatDate(item.delivered_at)}
                </td>
                <td className="px-4 py-2">#{item.order_number}</td>
                <td className="max-w-[200px] truncate px-4 py-2">
                  {item.delivery_address}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-right">
                  {Number(item.distance_km).toFixed(1)} km
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-right font-medium">
                  {formatCurrency(item.price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Filter Bar ---

const STATUS_FILTER_OPTIONS: {
  value: DisplayInvoiceStatus | "all";
  label: string;
}[] = [
  { value: "all", label: "Todas" },
  { value: "aberta", label: STATUS_LABELS.aberta },
  { value: "paga", label: STATUS_LABELS.paga },
  { value: "vencida", label: STATUS_LABELS.vencida },
];

function FilterBar({
  statusFilter,
  onStatusChange,
  periodStart,
  periodEnd,
  onPeriodStartChange,
  onPeriodEndChange,
}: {
  statusFilter: DisplayInvoiceStatus | "all";
  onStatusChange: (s: DisplayInvoiceStatus | "all") => void;
  periodStart: string;
  periodEnd: string;
  onPeriodStartChange: (v: string) => void;
  onPeriodEndChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Status filter chips */}
      <div className="flex items-center gap-1">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {STATUS_FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onStatusChange(opt.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === opt.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Period filter */}
      <div className="ml-auto flex items-center gap-1">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <input
          type="date"
          value={periodStart}
          onChange={(e) => onPeriodStartChange(e.target.value)}
          className="h-8 rounded-md border bg-background px-2 text-xs"
          aria-label="Período início"
        />
        <span className="text-xs text-muted-foreground">a</span>
        <input
          type="date"
          value={periodEnd}
          onChange={(e) => onPeriodEndChange(e.target.value)}
          className="h-8 rounded-md border bg-background px-2 text-xs"
          aria-label="Período fim"
        />
      </div>
    </div>
  );
}

// --- Main Page ---

type View = { type: "list" } | { type: "detail"; invoiceId: string };

const PAGE_SIZE = 20;

export function FaturasPage() {
  const [view, setView] = useState<View>({ type: "list" });
  const [statusFilter, setStatusFilter] = useState<
    DisplayInvoiceStatus | "all"
  >("all");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { data: invoices, isLoading, error } = useInvoices();
  const {
    newInvoiceIds,
    clearNewInvoiceId,
    dismissInvoiceToast,
  } = useCompanyEventsContext();

  // Dismiss any pending toast when user navigates to faturas page
  const dismissedRef = useRef(false);
  useEffect(() => {
    if (!dismissedRef.current) {
      dismissInvoiceToast();
      dismissedRef.current = true;
    }
  }, [dismissInvoiceToast]);

  // Auto-clear highlight after animation (3 seconds)
  useEffect(() => {
    if (newInvoiceIds.size === 0) return;
    const timer = setTimeout(() => {
      newInvoiceIds.forEach((id) => clearNewInvoiceId(id));
    }, 3000);
    return () => clearTimeout(timer);
  }, [newInvoiceIds, clearNewInvoiceId]);

  // Filter and sort invoices
  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];
    return invoices
      .filter((inv) => {
        // Status filter
        if (statusFilter !== "all") {
          const displayStatus = getDisplayStatus(inv.status, inv.period_end);
          if (displayStatus !== statusFilter) return false;
        }
        // Period filter
        if (periodStart && inv.period_start < periodStart) return false;
        if (periodEnd && inv.period_end > periodEnd) return false;
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.period_start).getTime() -
          new Date(a.period_start).getTime(),
      );
  }, [invoices, statusFilter, periodStart, periodEnd]);

  const visibleInvoices = useMemo(
    () => filteredInvoices.slice(0, visibleCount),
    [filteredInvoices, visibleCount],
  );

  const hasMore = visibleCount < filteredInvoices.length;

  // --- Detail View ---
  if (view.type === "detail") {
    return (
      <InvoiceDetail
        invoiceId={view.invoiceId}
        onBack={() => setView({ type: "list" })}
      />
    );
  }

  // --- List View ---
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Faturas</h1>

      {/* Filter Bar */}
      <FilterBar
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        periodStart={periodStart}
        periodEnd={periodEnd}
        onPeriodStartChange={setPeriodStart}
        onPeriodEndChange={setPeriodEnd}
      />

      {/* Invoice List */}
      <div className="rounded-lg border bg-card shadow-sm">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : error ? (
          <div className="p-4">
            <ErrorAlert message="Não foi possível carregar as faturas. Tente novamente mais tarde." />
          </div>
        ) : filteredInvoices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nenhuma fatura encontrada"
            description={
              statusFilter !== "all" || periodStart || periodEnd
                ? "Tente alterar os filtros para ver mais resultados"
                : "Suas faturas aparecerão aqui quando forem geradas"
            }
          />
        ) : (
          <>
            <div className="divide-y">
              {visibleInvoices.map((invoice) => (
                <InvoiceCard
                  key={invoice.id}
                  invoice={invoice}
                  highlight={newInvoiceIds.has(invoice.id)}
                  onClick={() =>
                    setView({ type: "detail", invoiceId: invoice.id })
                  }
                />
              ))}
            </div>
            {hasMore && (
              <div className="border-t px-4 py-3">
                <button
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="w-full rounded-md bg-muted px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/80"
                >
                  Carregar mais
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
