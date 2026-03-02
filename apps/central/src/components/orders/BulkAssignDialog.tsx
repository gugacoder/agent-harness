import { useState } from "react";
import { X, Loader2, AlertCircle, CheckCircle2, Bike } from "lucide-react";
import { useCouriers } from "@/hooks/useCouriers";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Courier } from "@/types/api";

interface BulkAssignResult {
  order_id: string;
  success: boolean;
  error?: string;
}

interface BulkAssignResponse {
  results: BulkAssignResult[];
}

interface BulkAssignDialogProps {
  open: boolean;
  orderIds: string[];
  onClose: () => void;
  onSuccess: () => void;
}

const ERROR_LABELS: Record<string, string> = {
  already_assigned: "Já atribuído",
  order_not_found: "Pedido não encontrado",
  invalid_status: "Status inválido",
};

export function BulkAssignDialog({
  open,
  orderIds,
  onClose,
  onSuccess,
}: BulkAssignDialogProps) {
  const { data: couriers, isLoading: couriersLoading } = useCouriers({
    active: true,
  });
  const [selectedCourier, setSelectedCourier] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BulkAssignResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const availableCouriers = couriers?.filter(
    (c: Courier) => c.status === "available" || c.status === "busy",
  );

  const handleSubmit = async () => {
    if (!selectedCourier) return;
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const res = await api
        .post("api/orders/bulk-assign", {
          json: { order_ids: orderIds, courier_id: selectedCourier },
        })
        .json<BulkAssignResponse>();
      setResult(res);
      const successCount = res.results.filter((r) => r.success).length;
      if (successCount > 0) {
        onSuccess();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao atribuir pedidos",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedCourier("");
    setResult(null);
    setError(null);
    onClose();
  };

  const successCount = result
    ? result.results.filter((r) => r.success).length
    : 0;
  const failedResults = result
    ? result.results.filter((r) => !r.success)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold">
            Atribuir {orderIds.length}{" "}
            {orderIds.length === 1 ? "pedido" : "pedidos"}
          </h2>
          <button
            onClick={handleClose}
            className="rounded-md p-1 hover:bg-muted"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Success result */}
          {result && successCount > 0 && (
            <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {successCount}{" "}
              {successCount === 1
                ? "pedido atribuído"
                : "pedidos atribuídos"}{" "}
              com sucesso
            </div>
          )}

          {/* Partial failure list */}
          {failedResults.length > 0 && (
            <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3">
              <p className="mb-2 text-sm font-medium text-destructive">
                {failedResults.length}{" "}
                {failedResults.length === 1 ? "falha" : "falhas"}:
              </p>
              <ul className="space-y-1">
                {failedResults.map((r) => (
                  <li
                    key={r.order_id}
                    className="text-xs text-destructive/80"
                  >
                    Pedido {r.order_id.slice(0, 8)}...:{" "}
                    {ERROR_LABELS[r.error ?? ""] ?? r.error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Courier selection */}
          {!result && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Selecionar Motoboy
                </label>
                {couriersLoading ? (
                  <Skeleton className="h-10" />
                ) : !availableCouriers || availableCouriers.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                    <Bike className="h-4 w-4" />
                    Nenhum motoboy disponível
                  </div>
                ) : (
                  <select
                    value={selectedCourier}
                    onChange={(e) => setSelectedCourier(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Escolha um motoboy...</option>
                    {availableCouriers.map((courier: Courier) => (
                      <option key={courier.id} value={courier.id}>
                        {courier.full_name} ({courier.status === "available" ? "Disponível" : "Ocupado"}) — {courier.total_deliveries} entregas
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!selectedCourier || submitting}
                  className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Atribuir
                </button>
              </div>
            </>
          )}

          {/* Close button after result */}
          {result && (
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
