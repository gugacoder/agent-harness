import { MapPin } from "lucide-react";

export function LocationDeniedAlert() {
  return (
    <div className="mb-4 flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
      <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
      <div className="text-sm">
        <p className="font-medium text-destructive">
          Localização desativada
        </p>
        <p className="mt-1 text-muted-foreground">
          Para receber entregas, ative a permissão de localização nas
          configurações do seu navegador e recarregue a página.
        </p>
      </div>
    </div>
  );
}
