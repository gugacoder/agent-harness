import { useState } from "react";

interface TeamInviteStepProps {
  onComplete: (metadata?: Record<string, unknown>) => void;
}

export function TeamInviteStep({ onComplete }: TeamInviteStepProps) {
  const [motoboyContact, setMotoboyContact] = useState("");
  const [lojistaContact, setLojistaContact] = useState("");

  const handleNext = () => {
    const invitedCount =
      (motoboyContact.trim() ? 1 : 0) + (lojistaContact.trim() ? 1 : 0);
    onComplete({ skipped: false, invited_count: invitedCount });
  };

  const handleSkip = () => {
    onComplete({ skipped: true });
  };

  return (
    <div className="flex flex-col gap-4 px-6 py-4">
      <h3 className="text-lg font-semibold text-foreground">Convide sua equipe</h3>
      <p className="text-sm text-muted-foreground">
        Adicione telefone ou email de um motoboy e um lojista para convidar.
      </p>

      <p className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
        Convites serao enviados quando o sistema de convites estiver disponivel.
      </p>

      <div className="flex flex-col gap-1">
        <label htmlFor="motoboy" className="text-sm font-medium text-foreground">
          Motoboy (telefone ou email)
        </label>
        <input
          id="motoboy"
          type="text"
          value={motoboyContact}
          onChange={(e) => setMotoboyContact(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="(11) 99999-9999 ou email@exemplo.com"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="lojista" className="text-sm font-medium text-foreground">
          Lojista (telefone ou email)
        </label>
        <input
          id="lojista"
          type="text"
          value={lojistaContact}
          onChange={(e) => setLojistaContact(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="(11) 99999-9999 ou email@exemplo.com"
        />
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
