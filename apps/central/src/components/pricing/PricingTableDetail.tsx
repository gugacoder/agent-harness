import { useState, useCallback } from "react";
import {
  ChevronLeft,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  Check,
  X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { usePricingRules } from "@/hooks/usePricingRules";
import { PricingRuleForm, RULE_TYPE_LABELS, SURCHARGE_TYPE_LABELS } from "./PricingRuleForm";
import { PriceSimulator } from "./PriceSimulator";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { PricingTable, PricingRule, RuleType, SurchargeType } from "@/types/api";

interface PricingTableDetailProps {
  table: PricingTable;
  onBack: () => void;
  onInvalidateTables: () => void;
}

function getRuleDescription(rule: PricingRule): string {
  switch (rule.rule_type as RuleType) {
    case "per_km":
      return `Base R$ ${rule.base_value} + R$ ${rule.per_km_value}/km`;
    case "distance_range":
      return `${rule.min_distance_km}–${rule.max_distance_km} km → R$ ${rule.base_value}`;
    case "neighborhood":
      return `Bairro "${rule.neighborhood}" → R$ ${rule.base_value}`;
    case "flat_rate":
      return `Taxa fixa R$ ${rule.base_value}`;
    case "surcharge": {
      const typeName =
        SURCHARGE_TYPE_LABELS[rule.surcharge_type as SurchargeType] ??
        rule.surcharge_type;
      const modeStr =
        rule.surcharge_mode === "percentage"
          ? `${rule.surcharge_value}%`
          : `R$ ${rule.surcharge_value}`;
      return `${typeName}: ${modeStr}`;
    }
    default:
      return rule.rule_type;
  }
}

export function PricingTableDetail({
  table,
  onBack,
  onInvalidateTables,
}: PricingTableDetailProps) {
  const queryClient = useQueryClient();
  const { data: rules, isLoading: rulesLoading } = usePricingRules(table.id);

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(table.name);
  const [savingName, setSavingName] = useState(false);

  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const invalidateRules = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["pricing-rules", table.id] });
  }, [queryClient, table.id]);

  const handleSaveName = async () => {
    if (!nameValue.trim() || nameValue.trim() === table.name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    setError(null);
    try {
      await api
        .patch(`api/pricing-tables/${table.id}`, {
          json: { name: nameValue.trim() },
        })
        .json();
      onInvalidateTables();
      setEditingName(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao atualizar nome",
      );
    } finally {
      setSavingName(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    setDeletingRuleId(ruleId);
    setError(null);
    try {
      await api.delete(`api/pricing-rules/${ruleId}`).json();
      invalidateRules();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao remover regra",
      );
    } finally {
      setDeletingRuleId(null);
    }
  };

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
        <div className="flex flex-1 items-center gap-2">
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-1 text-lg font-bold outline-none focus:ring-2 focus:ring-ring"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName();
                  if (e.key === "Escape") {
                    setEditingName(false);
                    setNameValue(table.name);
                  }
                }}
              />
              <button
                onClick={handleSaveName}
                disabled={savingName}
                className="rounded-md p-1 hover:bg-muted"
              >
                {savingName ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 text-green-600" />
                )}
              </button>
              <button
                onClick={() => {
                  setEditingName(false);
                  setNameValue(table.name);
                }}
                className="rounded-md p-1 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{table.name}</h2>
              {table.active && (
                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                  Ativa
                </span>
              )}
              <button
                onClick={() => setEditingName(true)}
                className="rounded-md p-1 hover:bg-muted"
                title="Editar nome"
              >
                <Pencil className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Rule form (add/edit) */}
      {(showRuleForm || editingRule) && (
        <PricingRuleForm
          tableId={table.id}
          editingRule={editingRule}
          onClose={() => {
            setShowRuleForm(false);
            setEditingRule(null);
          }}
          onSuccess={() => {
            setShowRuleForm(false);
            setEditingRule(null);
            invalidateRules();
          }}
        />
      )}

      {/* Rules list */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold">Regras de Preço</h3>
          {!showRuleForm && !editingRule && (
            <button
              onClick={() => setShowRuleForm(true)}
              className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-3 w-3" />
              Nova Regra
            </button>
          )}
        </div>

        {rulesLoading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : !rules || rules.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="Nenhuma regra"
            description="Adicione regras para definir como os preços são calculados"
          />
        ) : (
          <ul className="divide-y">
            {rules.map((rule) => (
              <li
                key={rule.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                      {RULE_TYPE_LABELS[rule.rule_type as RuleType] ??
                        rule.rule_type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Prioridade: {rule.priority}
                    </span>
                  </div>
                  <p className="mt-1 text-sm">{getRuleDescription(rule)}</p>
                </div>

                <button
                  onClick={() => setEditingRule(rule)}
                  className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                  title="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  disabled={deletingRuleId === rule.id}
                  className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  title="Remover"
                >
                  {deletingRuleId === rule.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Price Simulator */}
      <PriceSimulator tableId={table.id} />
    </div>
  );
}
