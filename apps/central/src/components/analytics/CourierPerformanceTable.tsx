import { Users } from "lucide-react";
import type { CourierPerformance } from "@/types/api";

interface CourierPerformanceTableProps {
  couriers?: CourierPerformance[];
  isLoading: boolean;
}

function formatMinutes(min: number) {
  if (min < 60) return `${min.toFixed(0)} min`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${h}h ${m}min`;
}

export function CourierPerformanceTable({
  couriers,
  isLoading,
}: CourierPerformanceTableProps) {
  const sorted = couriers
    ? [...couriers].sort((a, b) => b.total_deliveries - a.total_deliveries)
    : [];

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Users className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Performance por Motoboy</h3>
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">Motoboy</th>
                <th className="px-4 py-2 text-right">Entregas</th>
                <th className="px-4 py-2 text-right">Tempo Médio</th>
                <th className="px-4 py-2 text-right">Distância Média</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c, i) => (
                <tr key={c.courier_id} className="border-b last:border-b-0">
                  <td className="px-4 py-2 font-medium text-muted-foreground">
                    {i + 1}
                  </td>
                  <td className="px-4 py-2 font-medium">{c.courier_name}</td>
                  <td className="px-4 py-2 text-right">{c.total_deliveries}</td>
                  <td className="px-4 py-2 text-right">
                    {formatMinutes(c.avg_delivery_time_minutes)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {c.avg_distance_km.toFixed(1)} km
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
