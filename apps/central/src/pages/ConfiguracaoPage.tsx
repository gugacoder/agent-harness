import { useState } from "react";
import { useNavigate } from "react-router";
import { Settings, Loader2, CheckCircle2, Circle, Camera, RotateCcw } from "lucide-react";
import { useCompanyConfig, useUpdateCompanyConfig } from "@/hooks/useCompanyConfig";
import { useOnboarding } from "@/hooks/useOnboarding";
import { Skeleton } from "@/components/ui/Skeleton";

export function ConfiguracaoPage() {
  const { data: config, isLoading, error } = useCompanyConfig();
  const updateConfig = useUpdateCompanyConfig();
  const { resetProgress } = useOnboarding("wizard");
  const navigate = useNavigate();
  const [toggling, setToggling] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleResetOnboarding = async () => {
    if (resetting) return;
    setResetting(true);
    try {
      await resetProgress();
      navigate("/");
    } finally {
      setResetting(false);
    }
  };

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
            <p className="text-sm text-destructive">
              Erro ao carregar configurações: {error instanceof Error ? error.message : "Erro desconhecido"}
            </p>
          ) : (
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">POD obrigatório</p>
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
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : (
                  <Circle className="h-6 w-6 text-muted-foreground" />
                )}
                <span className={config?.pod_required ? "text-green-600" : "text-muted-foreground"}>
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

      {/* Onboarding Reset Section */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Configuracao Inicial</h2>
          </div>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-muted-foreground">
            Reexecute o assistente de configuracao inicial para revisar ou atualizar suas preferencias.
          </p>
          <button
            type="button"
            onClick={handleResetOnboarding}
            disabled={resetting}
            className="mt-3 rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
          >
            {resetting ? "Reiniciando..." : "Reexecutar configuracao inicial"}
          </button>
        </div>
      </div>
    </div>
  );
}
