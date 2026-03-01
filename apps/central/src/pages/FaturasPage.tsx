import { FileText } from "lucide-react";

export function FaturasPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Faturas</h1>
      </div>
      <p className="text-muted-foreground">
        Gerencie as faturas dos lojistas.
      </p>
    </div>
  );
}
