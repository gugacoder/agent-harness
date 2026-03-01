import { useCourierStatus } from "@/hooks/useCourierStatus";
import { StatusToggle } from "@/components/ui/StatusToggle";

export function StatusPage() {
  const { status, isLoading, isToggling, toggleStatus, error } =
    useCourierStatus();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="h-16 w-full animate-pulse rounded-2xl bg-muted" />
        <div className="mt-6 h-4 w-48 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">
          Sua disponibilidade
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quando você está disponível, você recebe novas entregas.
        </p>
      </div>

      <StatusToggle
        status={status}
        isToggling={isToggling}
        onToggle={toggleStatus}
      />

      {status === "busy" && (
        <p className="text-center text-sm text-muted-foreground">
          Seu status será atualizado automaticamente quando a entrega for
          concluída.
        </p>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          Não foi possível atualizar seu status. Tente novamente.
        </div>
      )}
    </div>
  );
}
