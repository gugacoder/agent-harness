import { CheckCircle, Circle } from "lucide-react";

const STEP_LABELS: Record<string, string> = {
  welcome: "Boas-vindas",
  company_data: "Dados da empresa",
  pricing: "Tabela de precos",
  team_invite: "Convite da equipe",
};

interface CompletedStepProps {
  completedSteps: string[];
  onComplete: () => void;
}

export function CompletedStep({ completedSteps, onComplete }: CompletedStepProps) {
  const checklistSteps = ["welcome", "company_data", "pricing", "team_invite"];

  return (
    <div className="flex flex-col items-center px-6 py-8 text-center">
      {/* Animated check icon */}
      <div className="animate-[scale-in_300ms_ease-out]">
        <CheckCircle className="h-16 w-16 text-green-500" />
      </div>

      <h2 className="mt-4 text-2xl font-bold text-foreground">
        Sua operacao esta configurada!
      </h2>

      {/* Checklist */}
      <ul className="mt-6 flex flex-col gap-2 text-left">
        {checklistSteps.map((step) => {
          const isDone = completedSteps.includes(step);
          return (
            <li key={step} className="flex items-center gap-2">
              {isDone ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
              <span
                className={`text-sm ${isDone ? "text-foreground" : "text-muted-foreground"}`}
              >
                {STEP_LABELS[step] ?? step}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Hint for skipped steps */}
      {checklistSteps.some((s) => !completedSteps.includes(s)) && (
        <p className="mt-4 text-xs text-muted-foreground">
          Voce pode configurar isso a qualquer momento em Configuracao.
        </p>
      )}

      {/* Docs link */}
      <a
        href="/docs/central"
        className="mt-4 text-sm text-secondary hover:underline"
      >
        Ver guia completo
      </a>

      <button
        type="button"
        onClick={onComplete}
        className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Ir para o dashboard
      </button>
    </div>
  );
}
