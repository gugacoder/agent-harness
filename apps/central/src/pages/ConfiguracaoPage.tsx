import { useState } from "react";
import { Settings, Loader2, CheckCircle2, Circle, Camera, AlertTriangle, RefreshCw, Calendar } from "lucide-react";
import { useCompanyConfig, useUpdateCompanyConfig } from "@/hooks/useCompanyConfig";
import { Skeleton } from "@/components/ui/Skeleton";
import { HelpTooltip } from "@/components/ui/HelpTooltip";

export function ConfiguracaoPage() {
  const { data: config, isLoading, error, refetch } = useCompanyConfig();
  const updateConfig = useUpdateCompanyConfig();
  const [toggling, setToggling] = useState(false);

  const handleTogglePodRequired = async () => {
    if (!config || toggling) return;
    setToggling(true);
    try {
      await updateConfig.mutateAsync({ pod_required: !config.pod_required });
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        </div>
        <p className="mt-1 text-muted-foreground">
          Gerencie as configurações da sua empresa.
        </p>
      </div>

      {/* POD Section */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Comprovante de Entrega (POD)</h2>
          </div>
        </div>

        <div className="px-6 py-5">
          {isLoading ? (
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-5 w-64" />
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 rounded-md bg-destructive/10 p-4">
              <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-destructive">
                  Não foi possível carregar as configurações
                </p>
                <p className="text-xs text-destructive/80">
                  {error instanceof Error ? error.message : "Erro desconhecido"}
                </p>
              </div>
              <button
                onClick={() => refetch()}
                className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Tentar novamente
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium">POD obrigatório</p>
                  <HelpTooltip
                    content="Quando ativado, motoboys precisam tirar foto e coletar assinatura para confirmar a entrega"
                    learnMoreUrl="/docs#configuracao"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Quando ativado, motoboys devem enviar foto e assinatura ao concluir cada entrega.
                </p>
              </div>

              <button
                onClick={handleTogglePodRequired}
                disabled={toggling}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                aria-label={config?.pod_required ? "Desativar POD obrigatório" : "Ativar POD obrigatório"}
              >
                {toggling ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : config?.pod_required ? (
                  <CheckCircle2 className="h-6 w-6 text-cs-success" />
                ) : (
                  <Circle className="h-6 w-6 text-muted-foreground" />
                )}
                <span className={config?.pod_required ? "text-cs-success" : "text-muted-foreground"}>
                  {config?.pod_required ? "Ativado" : "Desativado"}
                </span>
              </button>
            </div>
          )}

          {updateConfig.isError && (
            <p className="mt-3 text-sm text-destructive">
              Erro ao atualizar: {updateConfig.error instanceof Error ? updateConfig.error.message : "Erro desconhecido"}
            </p>
          )}
        </div>
      </div>
      {/* Periodo de Fechamento Section */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Período de Fechamento</h2>
          </div>
        </div>

        <div className="px-6 py-5">
          {isLoading ? (
            <div className="flex items-center gap-4">
              <Skeleton className="h-5 w-48" />
            </div>
          ) : error ? null : (
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium">Período de fechamento</p>
                  <HelpTooltip
                    content="Define de quanto em quanto tempo o sistema calcula os ganhos dos motoboys (diário, semanal, mensal)"
                    learnMoreUrl="/docs#financeiro"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {config?.default_closing_period === "daily" && "Diário"}
                  {config?.default_closing_period === "weekly" && "Semanal"}
                  {config?.default_closing_period === "monthly" && "Mensal"}
                  {config?.default_closing_period && !["daily", "weekly", "monthly"].includes(config.default_closing_period) && config.default_closing_period}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
