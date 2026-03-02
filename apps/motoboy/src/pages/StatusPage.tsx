import { useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useCourierStatus } from "@/hooks/useCourierStatus";
import { StatusToggle } from "@/components/ui/StatusToggle";
import { StatusContext } from "@/components/status/StatusContext";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { api } from "@/lib/api";
import { Tutorial } from "@/components/onboarding/Tutorial";
import { PageHelpLink } from "@/components/ui/PageHelpLink";

export function StatusPage() {
  const { courierId, status, isLoading, isToggling, toggleStatus, error } =
    useCourierStatus();
  const [showReviewTutorial, setShowReviewTutorial] = useState(false);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            Sua disponibilidade
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quando você está disponível, você recebe novas entregas.
          </p>
        </div>
        <PageHelpLink url="/docs#status" />
      </div>

      {!courierId && !isLoading ? (
        <div className="rounded-lg border border-border bg-muted/50 p-4 text-center">
          <p className="text-sm font-medium text-foreground">
            Conta não registrada como motoboy
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Fale com o administrador da empresa para ativar seu cadastro de entregador.
          </p>
        </div>
      ) : (
        <StatusToggle
          status={status}
          isToggling={isToggling}
          onToggle={toggleStatus}
        />
      )}

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

      <button
        type="button"
        onClick={() => setShowReviewTutorial(true)}
        className="text-sm text-muted-foreground underline"
      >
        Rever tutorial
      </button>

      {showReviewTutorial && (
        <Tutorial
          reviewMode
          onComplete={() => setShowReviewTutorial(false)}
          onSkip={() => setShowReviewTutorial(false)}
        />
      )}

      <p className="text-xs text-muted-foreground text-center mt-8">
        Precisa de ajuda? <Link to="/docs" className="text-primary underline">Guia de uso</Link> · <Link to="/docs#faq" className="text-primary underline">FAQ</Link>
      </p>
    </div>
  );
}
