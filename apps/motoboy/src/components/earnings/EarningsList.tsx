import { useMemo } from "react";
import { MapPin, Store } from "lucide-react";
import type { EarningItem } from "@/types/earnings";
import { ClosingStatusBadge } from "./ClosingStatusBadge";

interface EarningsListProps {
  items: EarningItem[];
}

interface DayGroup {
  date: string;
  label: string;
  total: number;
  items: EarningItem[];
}

function formatCurrency(value: string | number): string {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDateLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Hoje";
  if (date.toDateString() === yesterday.toDateString()) return "Ontem";

  return date.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupByDay(items: EarningItem[]): DayGroup[] {
  const groups = new Map<string, EarningItem[]>();

  for (const item of items) {
    const dateKey = new Date(item.delivered_at).toDateString();
    const existing = groups.get(dateKey);
    if (existing) {
      existing.push(item);
    } else {
      groups.set(dateKey, [item]);
    }
  }

  return Array.from(groups.entries()).map(([dateKey, dayItems]) => ({
    date: dateKey,
    label: formatDateLabel(dayItems[0].delivered_at),
    total: dayItems.reduce((sum, it) => sum + Number(it.value), 0),
    items: dayItems,
  }));
}

function EarningRow({ item }: { item: EarningItem }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {item.shop_name && (
            <span className="flex items-center gap-1 text-sm font-medium text-foreground truncate">
              <Store className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              {item.shop_name}
            </span>
          )}
          <ClosingStatusBadge status={item.closing_status} />
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
          <span>{formatTime(item.delivered_at)}</span>
          {item.distance_km && (
            <span className="flex items-center gap-0.5">
              <MapPin className="h-3 w-3" />
              {Number(item.distance_km).toFixed(1)} km
            </span>
          )}
        </div>
      </div>
      <span className="ml-3 text-sm font-semibold text-foreground whitespace-nowrap">
        {formatCurrency(item.value)}
      </span>
    </div>
  );
}

export function EarningsList({ items }: EarningsListProps) {
  const groups = useMemo(() => groupByDay(items), [items]);

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <div
          key={group.date}
          className="rounded-lg border bg-card shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between bg-muted/50 px-4 py-2">
            <span className="text-sm font-medium text-foreground">
              {group.label}
            </span>
            <span className="text-sm font-semibold text-primary">
              {formatCurrency(group.total)}
            </span>
          </div>
          <div className="divide-y">
            {group.items.map((item) => (
              <EarningRow key={item.delivery_id} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
