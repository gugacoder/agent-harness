import { useState, useMemo } from "react";
import {
  ArrowLeft,
  Send,
  Banknote,
  Download,
  Loader2,
  AlertCircle,
  Calendar,
  Package,
  MapPin,
} from "lucide-react";
import { api } from "@/lib/api";
import { useInvoiceDetail } from "@/hooks/useInvoiceDetail";
import { InvoiceStatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Shop } from "@/types/api";

interface InvoiceDetailProps {
  invoiceId: string;
  shops: Shop[] | undefined;
  onBack: () => void;
  onInvalidate: () => void;
}

function formatCurrency(value: string) {
  return `R$ ${parseFloat(value).toFixed(2).replace(".", ",")}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("pt-BR");
}

export function InvoiceDetail({
  invoiceId,
  shops,
  onBack,
  onInvalidate,
}: InvoiceDetailProps) {
  const { data: invoice, isLoading, refetch } = useInvoiceDetail(invoiceId);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const shopName = useMemo(() => {
    if (!invoice || !shops) return "Lojista";
    return shops.find((s) => s.id === invoice.shop_id)?.trade_name ?? "Lojista";
  }, [invoice, shops]);

  const handleSend = async () => {
    setActionLoading("send");
    setError(null);
    try {
      await api.patch(`api/invoices/${invoiceId}/send`).json();
      await refetch();
      onInvalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar fatura");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePay = async () => {
    setActionLoading("pay");
    setError(null);
    try {
      await api.patch(`api/invoices/${invoiceId}/pay`).json();
      await refetch();
      onInvalidate();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao marcar como paga",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportPdf = async () => {
    setActionLoading("pdf");
    setError(null);
    try {
      const response = await api.get(`api/invoices/${invoiceId}/pdf`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fatura-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao exportar PDF");
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <p className="text-muted-foreground">Fatura não encontrada.</p>
      </div>
    );
  }

  const isPaid = invoice.status === "paid";
  const isDraft = invoice.status === "draft";
  const isSent = invoice.status === "sent";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={onBack}
          className="mb-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">
            {shopName}{" "}
            <span className="text-base font-normal text-muted-foreground">
              #{invoice.invoice_number}
            </span>
          </h2>
          <InvoiceStatusBadge status={invoice.status} />
        </div>
        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {formatDate(invoice.period_start)} —{" "}
          {formatDate(invoice.period_end)}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            Entregas
          </div>
          <p className="mt-1 text-2xl font-bold">{invoice.total_deliveries}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            Distância Total
          </div>
          <p className="mt-1 text-2xl font-bold">
            {parseFloat(invoice.total_distance_km).toFixed(1)} km
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Banknote className="h-4 w-4" />
            Valor Total
          </div>
          <p className="mt-1 text-2xl font-bold">
            {formatCurrency(invoice.total_amount)}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {isDraft && (
          <button
            onClick={handleSend}
            disabled={!!actionLoading}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {actionLoading === "send" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Enviar
          </button>
        )}
        {isSent && (
          <button
            onClick={handlePay}
            disabled={!!actionLoading}
            className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {actionLoading === "pay" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Banknote className="h-4 w-4" />
            )}
            Marcar como Paga
          </button>
        )}
        <button
          onClick={handleExportPdf}
          disabled={!!actionLoading}
          className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          {actionLoading === "pdf" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Exportar PDF
        </button>
      </div>

      {/* Delivery items table */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="border-b px-4 py-3">
          <h3 className="font-medium">Entregas Incluídas</h3>
        </div>
        {invoice.items.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            Nenhuma entrega nesta fatura.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    Data
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    Pedido
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    Coleta
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    Entrega
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                    Distância
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoice.items.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                      {formatDateTime(item.delivered_at)}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">
                      #{item.order_number}
                    </td>
                    <td className="px-4 py-2 max-w-[200px] truncate" title={item.pickup_address}>
                      {item.pickup_address}
                    </td>
                    <td className="px-4 py-2 max-w-[200px] truncate" title={item.delivery_address}>
                      {item.delivery_address}
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      {parseFloat(item.distance_km).toFixed(1)} km
                    </td>
                    <td className="px-4 py-2 text-right font-medium whitespace-nowrap">
                      {formatCurrency(item.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t bg-muted/30 font-medium">
                  <td className="px-4 py-2" colSpan={4}>
                    Total
                  </td>
                  <td className="px-4 py-2 text-right">
                    {parseFloat(invoice.total_distance_km).toFixed(1)} km
                  </td>
                  <td className="px-4 py-2 text-right">
                    {formatCurrency(invoice.total_amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {isPaid && (
        <p className="text-sm text-muted-foreground italic">
          Fatura paga em {formatDateTime(invoice.paid_at!)} — imutável.
        </p>
      )}
    </div>
  );
}
