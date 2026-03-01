import { useState, useEffect, useCallback } from "react";
import { Store, Loader2, AlertCircle, X } from "lucide-react";
import { api } from "@/lib/api";
import { useShops } from "@/hooks/useShops";
import type { PricingTable, Shop, ShopPricingOverride } from "@/types/api";

interface ShopOverridesProps {
  tables: PricingTable[];
}

interface ShopOverrideRow {
  shop: Shop;
  override: ShopPricingOverride | null;
}

export function ShopOverrides({ tables }: ShopOverridesProps) {
  const { data: shops } = useShops();
  const [overrides, setOverrides] = useState<Map<string, ShopPricingOverride>>(
    new Map(),
  );
  const [loadingOverrides, setLoadingOverrides] = useState(true);
  const [savingShopId, setSavingShopId] = useState<string | null>(null);
  const [removingShopId, setRemovingShopId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchOverrides = useCallback(async () => {
    if (!shops) return;
    setLoadingOverrides(true);
    const map = new Map<string, ShopPricingOverride>();
    for (const shop of shops) {
      try {
        const override = await api
          .get(`api/shops/${shop.id}/pricing-override`)
          .json<ShopPricingOverride>();
        map.set(shop.id, override);
      } catch {
        // 404 = no override, skip
      }
    }
    setOverrides(map);
    setLoadingOverrides(false);
  }, [shops]);

  useEffect(() => {
    fetchOverrides();
  }, [fetchOverrides]);

  const handleSetOverride = async (shopId: string, tableId: string) => {
    setSavingShopId(shopId);
    setError(null);
    try {
      const override = await api
        .put(`api/shops/${shopId}/pricing-override`, {
          json: { pricing_table_id: tableId },
        })
        .json<ShopPricingOverride>();
      setOverrides((prev) => {
        const next = new Map(prev);
        next.set(shopId, override);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar override");
    } finally {
      setSavingShopId(null);
    }
  };

  const handleRemoveOverride = async (shopId: string) => {
    setRemovingShopId(shopId);
    setError(null);
    try {
      await api.delete(`api/shops/${shopId}/pricing-override`).json();
      setOverrides((prev) => {
        const next = new Map(prev);
        next.delete(shopId);
        return next;
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao remover override",
      );
    } finally {
      setRemovingShopId(null);
    }
  };

  const rows: ShopOverrideRow[] = (shops ?? []).map((shop) => ({
    shop,
    override: overrides.get(shop.id) ?? null,
  }));

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Store className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold">Overrides por Lojista</h3>
      </div>

      {error && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="p-4">
        {loadingOverrides || !shops ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum lojista cadastrado
          </p>
        ) : (
          <ul className="space-y-2">
            {rows.map(({ shop, override }) => (
              <li
                key={shop.id}
                className="flex items-center gap-3 rounded-md border px-3 py-2"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Store className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">
                    {shop.trade_name}
                  </p>
                  {override && (
                    <p className="text-xs text-muted-foreground">
                      Tabela:{" "}
                      {tables.find((t) => t.id === override.pricing_table_id)
                        ?.name ?? "—"}
                    </p>
                  )}
                </div>

                <select
                  value={override?.pricing_table_id ?? ""}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleSetOverride(shop.id, e.target.value);
                    }
                  }}
                  disabled={savingShopId === shop.id}
                  className="rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Padrão (tabela ativa)</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                      {t.active ? " (ativa)" : ""}
                    </option>
                  ))}
                </select>

                {savingShopId === shop.id && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}

                {override && (
                  <button
                    onClick={() => handleRemoveOverride(shop.id)}
                    disabled={removingShopId === shop.id}
                    className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    title="Remover override"
                  >
                    {removingShopId === shop.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
