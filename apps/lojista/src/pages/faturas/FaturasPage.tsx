import { FileText } from "lucide-react";

export function FaturasPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <FileText className="h-12 w-12 text-muted-foreground" />
      <h1 className="text-xl font-semibold">Faturas</h1>
      <p className="text-sm text-muted-foreground">
        Em breve você poderá visualizar suas faturas aqui.
      </p>
    </div>
  );
}
