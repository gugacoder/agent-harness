import { Calendar } from "lucide-react";
import type { AnalyticsPeriod } from "@/types/api";

interface PeriodFilterProps {
  period: AnalyticsPeriod;
  periodStart: string;
  periodEnd: string;
  onPeriodChange: (period: AnalyticsPeriod) => void;
  onStartChange: (start: string) => void;
  onEndChange: (end: string) => void;
}

const periodOptions: { value: AnalyticsPeriod; label: string }[] = [
  { value: "day", label: "Hoje" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
  { value: "custom", label: "Personalizado" },
];

export function PeriodFilter({
  period,
  periodStart,
  periodEnd,
  onPeriodChange,
  onStartChange,
  onEndChange,
}: PeriodFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <div className="flex gap-1 rounded-md border border-input p-1">
        {periodOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onPeriodChange(opt.value)}
            className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
              period === opt.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {period === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={periodStart}
            onChange={(e) => onStartChange(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <span className="text-sm text-muted-foreground">até</span>
          <input
            type="date"
            value={periodEnd}
            onChange={(e) => onEndChange(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      )}
    </div>
  );
}
