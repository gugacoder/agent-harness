import { cn } from "@/lib/utils";
import type { PeriodFilter } from "@/types/earnings";

interface PeriodSelectorProps {
  value: PeriodFilter;
  onChange: (period: PeriodFilter) => void;
}

const options: { value: PeriodFilter; label: string }[] = [
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
];

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            value === opt.value
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
