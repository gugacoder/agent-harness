import { Wallet } from "lucide-react";

export function ExtratoPage() {
  return (
    <div className="flex flex-col gap-6 py-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Extrato</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe seus ganhos e pagamentos.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Wallet className="h-12 w-12 mb-3 opacity-40" />
        <p className="text-sm">Nenhum extrato disponível.</p>
      </div>
    </div>
  );
}
