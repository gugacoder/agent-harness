import { DollarSign } from "lucide-react";

export function PrecosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <DollarSign className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Preços</h1>
      </div>
      <p className="text-muted-foreground">
        Gerencie as tabelas de preço da sua empresa.
      </p>
    </div>
  );
}
