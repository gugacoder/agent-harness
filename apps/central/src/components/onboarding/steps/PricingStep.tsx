import { useState } from "react";
import { usePricingTables } from "@/hooks/usePricingTables";
import { usePricingRules } from "@/hooks/usePricingRules";

interface PricingStepProps {
  onComplete: (metadata?: Record<string, unknown>) => void;
}

export function PricingStep({ onComplete }: PricingStepProps) {
  const { data: tables } = usePricingTables();
  const activeTable = tables?.find((t) => t.active) ?? tables?.[0] ?? null;
  const { data: rules } = usePricingRules(activeTable?.id ?? null);

  const perKmRule = rules?.find((r) => r.rule_type === "per_km");

  const [baseValue, setBaseValue] = useState("");
  const [perKmValue, setPerKmValue] = useState("");
  const [simulatorKm, setSimulatorKm] = useState("");

  // Pre-fill from existing rules
  const effectiveBase = baseValue || perKmRule?.base_value || "5.00";
  const effectivePerKm = perKmValue || perKmRule?.per_km_value || "2.00";

  // Simulator calculation
  const km = parseFloat(simulatorKm) || 0;
  const base = parseFloat(effectiveBase) || 0;
  const perKm = parseFloat(effectivePerKm) || 0;
  const estimatedPrice = km > 0 ? (base + perKm * km).toFixed(2) : "0.00";

  const handleNext = () => {
    onComplete({ template_used: true, base_value: effectiveBase, per_km_value: effectivePerKm });
  };

  const handleSkip = () => {
    onComplete({ skipped: true });
  };

  return (
    <div className="flex flex-col gap-4 px-6 py-4">
      <h3 className="text-lg font-semibold text-foreground">Tabela de precos</h3>
      <p className="text-sm text-muted-foreground">
        Configure o preco por km para suas entregas. Voce pode ajustar depois.
      </p>

      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-sm font-medium text-foreground">Preco por km (padrao)</p>

        <div className="mt-3 grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="base_value" className="text-xs font-medium text-muted-foreground">
              Valor base (R$)
            </label>
            <input
              id="base_value"
              type="number"
              step="0.01"
              min="0"
              value={baseValue || effectiveBase}
              onChange={(e) => setBaseValue(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="per_km_value" className="text-xs font-medium text-muted-foreground">
              Valor por km (R$)
            </label>
            <input
              id="per_km_value"
              type="number"
              step="0.01"
              min="0"
              value={perKmValue || effectivePerKm}
              onChange={(e) => setPerKmValue(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      {/* Simulator */}
      <div className="rounded-lg border border-border p-4">
        <p className="text-sm font-medium text-foreground">Simulador de preco</p>
        <div className="mt-2 flex items-center gap-3">
          <input
            type="number"
            step="0.1"
            min="0"
            placeholder="km"
            value={simulatorKm}
            onChange={(e) => setSimulatorKm(e.target.value)}
            className="w-24 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <span className="text-sm text-muted-foreground">km</span>
          <span className="text-sm text-muted-foreground">=</span>
          <span className="text-lg font-semibold text-foreground">
            R$ {estimatedPrice}
          </span>
        </div>
      </div>

      <div className="mt-2 flex justify-between">
        <button
          type="button"
          onClick={handleSkip}
          className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Pular
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Proximo
        </button>
      </div>
    </div>
  );
}
