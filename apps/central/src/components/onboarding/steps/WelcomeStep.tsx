import { Package, Bike, CheckCircle } from "lucide-react";

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="flex flex-col items-center px-6 py-8 text-center">
      <h2 className="text-2xl font-bold text-foreground">
        Bem-vindo ao Chega.la!
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Vamos configurar sua operacao em 5 minutos.
      </p>

      {/* Flow illustration */}
      <div className="mt-8 flex items-center gap-4">
        <div className="flex flex-col items-center gap-1">
          <Package className="h-10 w-10 text-primary" />
          <span className="text-xs text-muted-foreground">Pacote</span>
        </div>
        <div className="h-0.5 w-8 bg-muted" />
        <div className="flex flex-col items-center gap-1">
          <Bike className="h-10 w-10 text-secondary" />
          <span className="text-xs text-muted-foreground">Entrega</span>
        </div>
        <div className="h-0.5 w-8 bg-muted" />
        <div className="flex flex-col items-center gap-1">
          <CheckCircle className="h-10 w-10 text-green-500" />
          <span className="text-xs text-muted-foreground">Concluido</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="mt-8 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Comecar
      </button>
    </div>
  );
}
