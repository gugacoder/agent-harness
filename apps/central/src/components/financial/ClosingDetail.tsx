import { useState, useMemo } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Banknote,
  Loader2,
  AlertCircle,
  Calendar,
  Package,
  MapPin,
} from "lucide-react";
import { api } from "@/lib/api";
import { useClosingDetail } from "@/hooks/useClosingDetail";
import { ClosingStatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Courier } from "@/types/api";

interface ClosingDetailProps {
  closingId: string;
  couriers: Courier[] | undefined;
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

export function ClosingDetail({
  closingId,
  couriers,
  onBack,
  onInvalidate,
}: ClosingDetailProps) {
  const { data: closing, isLoading, refetch } = useClosingDetail(closingId);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const courierName = useMemo(() => {
    if (!closing || !couriers) return "Motoboy";
    return couriers.find((c) => c.id === closing.courier_id)?.full_name ?? "Motoboy";
  }, [closing, couriers]);

  const handleConfirm = async () => {
    setActionLoading("confirm");
    setError(null);
    try {
      await api.patch(`api/financial/closings/${closingId}/confirm`).json();
      await refetch();
      onInvalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao confirmar");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePay = async () => {
    setActionLoading("pay");
    setError(null);
    try {
      await api.patch(`api/financial/closings/${closingId}/pay`).json();
      await refetch();
      onInvalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao marcar como pago");
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

  if (!closing) {
    return (
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <p className="text-muted-foreground">Fechamento não encontrado.</p>
      </div>
    );
  }

  const isPaid = closing.status === "paid";
  const isDraft = closing.status === "draft";
  const isConfirmed = closing.status === "confirmed";

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
          <h2 className="text-xl font-bold">{courierName}</h2>
          <ClosingStatusBadge status={closing.status} />
        </div>
        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {formatDate(closing.period_start)} — {formatDate(closing.period_end)}
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
          <p className="mt-1 text-2xl font-bold">{closing.total_deliveries}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            Distância Total
          </div>
          <p className="mt-1 text-2xl font-bold">
            {parseFloat(closing.total_distance_km).toFixed(1)} km
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Banknote className="h-4 w-4" />
            Valor Total
          </div>
          <p className="mt-1 text-2xl font-bold">
            {formatCurrency(closing.total_amount)}
          </p>
        </div>
      </div>

      {/* Actions */}
      {!isPaid && (
        <div className="flex gap-2">
          {isDraft && (
            <button
              onClick={handleConfirm}
              disabled={!!actionLoading}
              className="flex items-center gap-2 rounded-md bg-cs-info px-4 py-2 text-sm font-medium text-white hover:bg-cs-info/90 disabled:opacity-50"
            >
              {actionLoading === "confirm" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Confirmar
            </button>
          )}
          {isConfirmed && (
            <button
              onClick={handlePay}
              disabled={!!actionLoading}
              className="flex items-center gap-2 rounded-md bg-cs-success px-4 py-2 text-sm font-medium text-white hover:bg-cs-success/90 disabled:opacity-50"
            >
              {actionLoading === "pay" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Banknote className="h-4 w-4" />
              )}
              Marcar como Pago
            </button>
          )}
        </div>
      )}

      {/* Delivery items table */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="border-b px-4 py-3">
          <h3 className="font-medium">Entregas Incluídas</h3>
        </div>
        {closing.items.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            Nenhuma entrega neste fechamento.
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
                {closing.items.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2 text-muted-foreground">
                      {formatDateTime(item.delivered_at)}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {item.delivery_id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-2 text-right">
                      {parseFloat(item.distance_km).toFixed(1)} km
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      {formatCurrency(item.delivery_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t bg-muted/30 font-medium">
                  <td className="px-4 py-2" colSpan={2}>
                    Total
                  </td>
                  <td className="px-4 py-2 text-right">
                    {parseFloat(closing.total_distance_km).toFixed(1)} km
                  </td>
                  <td className="px-4 py-2 text-right">
                    {formatCurrency(closing.total_amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {isPaid && (
        <p className="text-sm text-muted-foreground italic">
          Fechamento pago em {formatDateTime(closing.paid_at!)} — imutável.
        </p>
      )}
    </div>
  );
}
