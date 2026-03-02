import { useQuery } from "@tanstack/react-query";
import { useCourierStatus } from "@/hooks/useCourierStatus";
import { StatusToggle } from "@/components/ui/StatusToggle";
import { StatusContext } from "@/components/status/StatusContext";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { api } from "@/lib/api";

export function StatusPage() {
  const { status, isLoading, isToggling, toggleStatus, error } =
    useCourierStatus();

  const isOnline = status === "available" || status === "busy";

  const pendingOrdersQuery = useQuery({
    queryKey: ["orders", "pending"],
    queryFn: () =>
      api.get("api/orders", { searchParams: { status: "pending" } }).json<unknown[]>(),
    enabled: isOnline,
    refetchInterval: isOnline ? 30_000 : false,
  });

  const pendingOrdersCount = pendingOrdersQuery.data?.length ?? 0;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <LoadingSkeleton className="h-16 w-full rounded-2xl" />
        <LoadingSkeleton className="mt-6 h-4 w-48" />
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

      <StatusContext
        status={status}
        pendingOrdersCount={pendingOrdersCount}
      />

      {status === "busy" && (
        <p className="text-center text-sm text-muted-foreground">
          Seu status será atualizado automaticamente quando a entrega for
          concluída.
        </p>
      )}

      {error && (
        <ErrorAlert message="Não foi possível atualizar seu status. Tente novamente." />
      )}
    </div>
  );
}
