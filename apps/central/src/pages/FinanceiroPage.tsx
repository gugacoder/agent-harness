import { Wallet } from "lucide-react";

export function FinanceiroPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Wallet className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
      </div>
      <p className="text-muted-foreground">
        Gerencie os fechamentos financeiros dos motoboys.
      </p>
    </div>
  );
}
