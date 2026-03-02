import { useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { HelpTooltip } from "@/components/ui/HelpTooltip";
import type { PricingRule, RuleType, SurchargeType, SurchargeMode } from "@/types/api";

const RULE_TYPE_LABELS: Record<RuleType, string> = {
  per_km: "Por Km",
  distance_range: "Faixa de Distância",
  neighborhood: "Por Bairro",
  flat_rate: "Taxa Fixa",
  surcharge: "Surcharge",
};

const SURCHARGE_TYPE_LABELS: Record<SurchargeType, string> = {
  rain: "Chuva",
  night: "Noturno",
  weekend: "Fim de Semana",
};

interface PricingRuleFormProps {
  tableId: string;
  editingRule?: PricingRule | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function PricingRuleForm({
  tableId,
  editingRule,
  onClose,
  onSuccess,
}: PricingRuleFormProps) {
  const isEdit = !!editingRule;

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [ruleType, setRuleType] = useState<RuleType>(
    editingRule?.rule_type ?? "per_km",
  );
  const [baseValue, setBaseValue] = useState(editingRule?.base_value ?? "");
  const [perKmValue, setPerKmValue] = useState(
    editingRule?.per_km_value ?? "",
  );
  const [minDistance, setMinDistance] = useState(
    editingRule?.min_distance_km ?? "",
  );
  const [maxDistance, setMaxDistance] = useState(
    editingRule?.max_distance_km ?? "",
  );
  const [neighborhood, setNeighborhood] = useState(
    editingRule?.neighborhood ?? "",
  );
  const [surchargeType, setSurchargeType] = useState<SurchargeType>(
    editingRule?.surcharge_type ?? "rain",
  );
  const [surchargeMode, setSurchargeMode] = useState<SurchargeMode>(
    editingRule?.surcharge_mode ?? "fixed",
  );
  const [surchargeValue, setSurchargeValue] = useState(
    editingRule?.surcharge_value ?? "",
  );
  const [priority, setPriority] = useState(
    editingRule?.priority?.toString() ?? "0",
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload: Record<string, unknown> = {
      rule_type: ruleType,
      base_value: baseValue || "0",
      priority: parseInt(priority) || 0,
    };

    if (ruleType === "per_km") {
      payload.per_km_value = perKmValue || "0";
    }
    if (ruleType === "distance_range") {
      payload.min_distance_km = minDistance || "0";
      payload.max_distance_km = maxDistance || "0";
    }
    if (ruleType === "neighborhood") {
      payload.neighborhood = neighborhood;
    }
    if (ruleType === "surcharge") {
      payload.surcharge_type = surchargeType;
      payload.surcharge_mode = surchargeMode;
      payload.surcharge_value = surchargeValue || "0";
    }

    try {
      if (isEdit) {
        await api
          .patch(`api/pricing-rules/${editingRule!.id}`, { json: payload })
          .json();
      } else {
        await api
          .post(`api/pricing-tables/${tableId}/rules`, { json: payload })
          .json();
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar regra");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="border-b px-4 py-3">
        <h3 className="font-semibold">
          {isEdit ? "Editar Regra" : "Nova Regra"}
        </h3>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Rule Type */}
        <div>
          <label className="mb-1 block text-sm font-medium">Tipo</label>
          <select
            value={ruleType}
            onChange={(e) => setRuleType(e.target.value as RuleType)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            {(Object.keys(RULE_TYPE_LABELS) as RuleType[]).map((rt) => (
              <option key={rt} value={rt}>
                {RULE_TYPE_LABELS[rt]}
              </option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            Prioridade (menor = avaliada primeiro)
          </label>
          <input
            type="number"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Per KM fields */}
        {ruleType === "per_km" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="mb-1 flex items-center gap-1.5">
                <label className="block text-sm font-medium">
                  Valor Base (R$)
                </label>
                <HelpTooltip
                  content="Valor fixo cobrado em toda entrega, independente da distância"
                  learnMoreUrl="/docs#precos"
                />
              </div>
              <input
                type="text"
                value={baseValue}
                onChange={(e) => setBaseValue(e.target.value)}
                placeholder="5.00"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <div className="mb-1 flex items-center gap-1.5">
                <label className="block text-sm font-medium">
                  Valor por Km (R$)
                </label>
                <HelpTooltip
                  content="Valor adicional cobrado por quilômetro rodado"
                  learnMoreUrl="/docs#precos"
                />
              </div>
              <input
                type="text"
                value={perKmValue}
                onChange={(e) => setPerKmValue(e.target.value)}
                placeholder="1.50"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        )}

        {/* Distance range fields */}
        {ruleType === "distance_range" && (
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Distância Mín (km)
              </label>
              <input
                type="text"
                value={minDistance}
                onChange={(e) => setMinDistance(e.target.value)}
                placeholder="0"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Distância Máx (km)
              </label>
              <input
                type="text"
                value={maxDistance}
                onChange={(e) => setMaxDistance(e.target.value)}
                placeholder="5"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Valor (R$)
              </label>
              <input
                type="text"
                value={baseValue}
                onChange={(e) => setBaseValue(e.target.value)}
                placeholder="10.00"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        )}

        {/* Neighborhood fields */}
        {ruleType === "neighborhood" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Bairro</label>
              <input
                type="text"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Nome do bairro"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Valor Fixo (R$)
              </label>
              <input
                type="text"
                value={baseValue}
                onChange={(e) => setBaseValue(e.target.value)}
                placeholder="15.00"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        )}

        {/* Flat rate fields */}
        {ruleType === "flat_rate" && (
          <div>
            <label className="mb-1 block text-sm font-medium">
              Valor Fixo (R$)
            </label>
            <input
              type="text"
              value={baseValue}
              onChange={(e) => setBaseValue(e.target.value)}
              placeholder="12.00"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}

        {/* Surcharge fields */}
        {ruleType === "surcharge" && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Tipo de Surcharge
                </label>
                <select
                  value={surchargeType}
                  onChange={(e) =>
                    setSurchargeType(e.target.value as SurchargeType)
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  {(
                    Object.keys(SURCHARGE_TYPE_LABELS) as SurchargeType[]
                  ).map((st) => (
                    <option key={st} value={st}>
                      {SURCHARGE_TYPE_LABELS[st]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Modo</label>
                <select
                  value={surchargeMode}
                  onChange={(e) =>
                    setSurchargeMode(e.target.value as SurchargeMode)
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="fixed">Fixo (R$)</option>
                  <option value="percentage">Percentual (%)</option>
                </select>
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center gap-1.5">
                <label className="block text-sm font-medium">
                  Valor{" "}
                  {surchargeMode === "percentage" ? "(%)" : "(R$)"}
                </label>
                {surchargeType === "rain" && (
                  <HelpTooltip
                    content="Acréscimo aplicado quando chove. Ex: 20% = entrega de R$10 vira R$12"
                    learnMoreUrl="/docs#precos"
                  />
                )}
              </div>
              <input
                type="text"
                value={surchargeValue}
                onChange={(e) => setSurchargeValue(e.target.value)}
                placeholder={surchargeMode === "percentage" ? "10" : "5.00"}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Salvar" : "Adicionar"}
          </button>
        </div>
      </form>
    </div>
  );
}

export { RULE_TYPE_LABELS, SURCHARGE_TYPE_LABELS };
