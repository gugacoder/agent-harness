import { useState } from "react";
import { Calculator, Loader2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import type { SimulationResult } from "@/types/api";

interface PriceSimulatorProps {
  tableId: string;
}

export function PriceSimulator({ tableId }: PriceSimulatorProps) {
  const [distance, setDistance] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    const dist = parseFloat(distance);
    if (isNaN(dist) || dist <= 0) return;

    setSimulating(true);
    setError(null);
    setResult(null);

    try {
      const payload: { distance: number; neighborhood?: string } = {
        distance: dist,
      };
      if (neighborhood.trim()) {
        payload.neighborhood = neighborhood.trim();
      }
      const res = await api
        .post(`api/pricing-tables/${tableId}/simulate`, { json: payload })
        .json<SimulationResult>();
      setResult(res);
    } catch (err) {
      if (
        err instanceof Error &&
        err.message.includes("No matching pricing rules")
      ) {
        setError("Nenhuma regra encontrada para os parâmetros informados");
      } else {
        setError(
          err instanceof Error ? err.message : "Erro ao simular preço",
        );
      }
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Calculator className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold">Simulação de Preço</h3>
      </div>
      <form onSubmit={handleSimulate} className="space-y-3 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Distância (km)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder="5.0"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Bairro (opcional)
            </label>
            <input
              type="text"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Nome do bairro"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={simulating || !distance}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {simulating && <Loader2 className="h-4 w-4 animate-spin" />}
          Calcular
        </button>

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {result && (
          <div className="rounded-md bg-muted/50 p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Base</p>
                <p className="text-lg font-semibold">
                  R$ {parseFloat(result.basePrice).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Surcharge</p>
                <p className="text-lg font-semibold">
                  R$ {parseFloat(result.surchargeAmount).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold text-primary">
                  R$ {parseFloat(result.totalPrice).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
