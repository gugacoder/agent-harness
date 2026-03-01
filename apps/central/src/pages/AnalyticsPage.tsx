import { BarChart3 } from "lucide-react";

export function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
      </div>
      <p className="text-muted-foreground">
        Acompanhe as métricas e performance das entregas.
      </p>
    </div>
  );
}
