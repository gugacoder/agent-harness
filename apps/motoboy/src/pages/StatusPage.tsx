import { useState } from "react";
import { useCourierStatus } from "@/hooks/useCourierStatus";
import { StatusToggle } from "@/components/ui/StatusToggle";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Tutorial } from "@/components/onboarding/Tutorial";

export function StatusPage() {
  const { status, isLoading, isToggling, toggleStatus, error } =
    useCourierStatus();
  const [showReviewTutorial, setShowReviewTutorial] = useState(false);

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
    </div>
  );
}
