import { useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import type { Shop } from "@/types/api";

interface CreateInvoiceFormProps {
  shops: Shop[] | undefined;
  onCreated: () => void;
  onCancel: () => void;
}

type PeriodPreset = "day" | "week" | "month" | "custom";

function getPresetDates(preset: PeriodPreset): { start: string; end: string } {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  switch (preset) {
    case "day": {
      return { start: today, end: today };
    }
    case "week": {
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(now);
      monday.setDate(now.getDate() - diff);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return {
        start: monday.toISOString().slice(0, 10),
        end: sunday.toISOString().slice(0, 10),
      };
    }
    case "month": {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return {
        start: firstDay.toISOString().slice(0, 10),
        end: lastDay.toISOString().slice(0, 10),
      };
    }
    default:
      return { start: today, end: today };
  }
}

export function CreateInvoiceForm({
  shops,
  onCreated,
  onCancel,
}: CreateInvoiceFormProps) {
  const [shopId, setShopId] = useState("");
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) return;

    const dates =
      periodPreset === "custom"
        ? { start: customStart, end: customEnd }
        : getPresetDates(periodPreset);

    if (!dates.start || !dates.end) return;

    setCreating(true);
    setError(null);
    try {
      await api
        .post("api/invoices", {
          json: {
            shop_id: shopId,
            period_start: dates.start,
            period_end: dates.end,
          },
        })
        .json();
      onCreated();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao gerar fatura",
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border bg-card p-4 shadow-sm"
    >
      <h3 className="font-medium">Gerar Fatura</h3>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Lojista</label>
        <select
          value={shopId}
          onChange={(e) => setShopId(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Selecione um lojista</option>
          {shops
            ?.filter((s) => s.active)
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.trade_name}
              </option>
            ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Período</label>
        <div className="flex gap-2">
          {(
            [
              ["day", "Dia"],
              ["week", "Semana"],
              ["month", "Mês"],
              ["custom", "Personalizado"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setPeriodPreset(value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                periodPreset === value
                  ? "bg-primary text-primary-foreground"
                  : "border border-input hover:bg-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {periodPreset === "custom" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Início</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Fim</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={creating || !shopId}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {creating && <Loader2 className="h-4 w-4 animate-spin" />}
          Gerar Fatura
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-input px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
