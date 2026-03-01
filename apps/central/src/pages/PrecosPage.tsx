import { useState, useCallback, useMemo } from "react";
import { DollarSign } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { usePricingTables } from "@/hooks/usePricingTables";
import { PricingTableList } from "@/components/pricing/PricingTableList";
import { PricingTableDetail } from "@/components/pricing/PricingTableDetail";
import { ShopOverrides } from "@/components/pricing/ShopOverrides";

type View =
  | { type: "list" }
  | { type: "detail"; tableId: string };

export function PrecosPage() {
  const [view, setView] = useState<View>({ type: "list" });
  const queryClient = useQueryClient();
  const { data: tables, isLoading } = usePricingTables();

  const invalidateTables = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["pricing-tables"] });
  }, [queryClient]);

  const currentTable = useMemo(() => {
    if (view.type === "detail") {
      return tables?.find((t) => t.id === view.tableId) ?? null;
    }
    return null;
  }, [tables, view]);

  // --- Detail view ---
  if (view.type === "detail" && currentTable) {
    return (
      <PricingTableDetail
        table={currentTable}
        onBack={() => setView({ type: "list" })}
        onInvalidateTables={invalidateTables}
      />
    );
  }

  // --- List view ---
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <DollarSign className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Preços</h1>
        </div>
        <p className="mt-1 text-muted-foreground">
          Gerencie as tabelas de preço da sua empresa.
        </p>
      </div>

      <PricingTableList
        tables={tables}
        isLoading={isLoading}
        onSelect={(tableId) => setView({ type: "detail", tableId })}
        onInvalidate={invalidateTables}
      />

      {/* Shop overrides section */}
      {tables && tables.length > 0 && <ShopOverrides tables={tables} />}
    </div>
  );
}
