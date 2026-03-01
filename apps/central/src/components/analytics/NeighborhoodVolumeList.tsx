import { MapPin } from "lucide-react";
import type { NeighborhoodVolume } from "@/types/api";

interface NeighborhoodVolumeListProps {
  neighborhoods?: NeighborhoodVolume[];
  isLoading: boolean;
}

export function NeighborhoodVolumeList({
  neighborhoods,
  isLoading,
}: NeighborhoodVolumeListProps) {
  const sorted = neighborhoods
    ? [...neighborhoods].sort(
        (a, b) => b.total_deliveries - a.total_deliveries,
      )
    : [];

  const maxDeliveries = sorted.length > 0 ? sorted[0].total_deliveries : 1;

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Volume por Bairro</h3>
      </div>
      {isLoading ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
          Carregando...
        </p>
      ) : sorted.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
          Nenhum dado disponível para o período.
        </p>
      ) : (
        <div className="space-y-2 p-4">
          {sorted.map((n, i) => (
            <div key={n.neighborhood} className="flex items-center gap-3">
              <span className="w-6 text-right text-xs font-medium text-muted-foreground">
                {i + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{n.neighborhood}</span>
                  <span className="text-muted-foreground">
                    {n.total_deliveries}
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-muted">
                  <div
                    className="h-1.5 rounded-full bg-primary transition-all"
                    style={{
                      width: `${(n.total_deliveries / maxDeliveries) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
