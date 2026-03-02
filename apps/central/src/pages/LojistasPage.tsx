import { useState, useMemo, useCallback } from "react";
import {
  Store,
  Plus,
  X,
  ChevronLeft,
  AlertCircle,
  Loader2,
  Search,
  Pencil,
  PowerOff,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useShops } from "@/hooks/useShops";
import { useOrders } from "@/hooks/useOrders";
import { useShopDetail, useToggleShopStatus } from "@/hooks/useShopDetail";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ShopDetailView } from "@/components/shops/ShopDetailView";
import { ShopEditForm } from "@/components/shops/ShopEditForm";
import type { Shop } from "@/types/api";

// --- New Shop Form ---

interface NewShopFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

function NewShopForm({ onClose, onSuccess }: NewShopFormProps) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    trade_name: "",
    phone: "",
    address: "",
    email: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = useCallback(() => {
    const errors: Record<string, string> = {};
    if (!form.trade_name.trim()) errors.trade_name = "Nome é obrigatório";
    if (!form.phone.trim()) errors.phone = "Telefone é obrigatório";
    if (!form.address.trim()) errors.address = "Endereço é obrigatório";
    if (!form.email.trim()) errors.email = "E-mail é obrigatório";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      errors.email = "E-mail inválido";
    return errors;
  }, [form]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    setError(null);
    try {
      // 1. Invite user via backbone auth API
      const inviteResult = await api
        .post("api/auth/invite", {
          json: {
            email: form.email.trim(),
            role: "shop",
            full_name: form.trade_name.trim(),
            phone: form.phone.trim(),
          },
        })
        .json<{ user_id: string; email: string }>();

      // 2. Create profile via Supabase REST
      const { error: profileError } = await supabase.from("profiles").insert({
        id: inviteResult.user_id,
        company_id: user!.companyId,
        role: "shop",
        full_name: form.trade_name.trim(),
        phone: form.phone.trim(),
        avatar_url: null,
      });

      if (profileError) {
        throw new Error(profileError.message);
      }

      // 3. Create shop via backbone API
      await api
        .post("api/shops", {
          json: {
            profile_id: inviteResult.user_id,
            trade_name: form.trade_name.trim(),
            phone: form.phone.trim(),
            address: form.address.trim(),
            lat: "0",
            lng: "0",
          },
        })
        .json();

      onSuccess();
    } catch (err) {
      if (err instanceof Error) {
        if (
          err.message.includes("already") ||
          err.message.includes("duplicate") ||
          err.message.includes("exists")
        ) {
          setError("Este e-mail já está cadastrado no sistema");
        } else {
          setError(err.message);
        }
      } else {
        setError("Erro ao cadastrar lojista");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-lg font-semibold">Novo Lojista</h2>
        <button
          onClick={onClose}
          className="rounded-md p-1 hover:bg-muted"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium">
            Nome Fantasia *
          </label>
          <input
            type="text"
            value={form.trade_name}
            onChange={(e) => updateField("trade_name", e.target.value)}
            placeholder="Nome da loja"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          {fieldErrors.trade_name && (
            <p className="mt-1 text-xs text-destructive">
              {fieldErrors.trade_name}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Telefone *
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="(00) 00000-0000"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            {fieldErrors.phone && (
              <p className="mt-1 text-xs text-destructive">
                {fieldErrors.phone}
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              E-mail para convite *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="lojista@email.com"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-destructive">
                {fieldErrors.email}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Endereço *</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => updateField("address", e.target.value)}
            placeholder="Rua, número, bairro, cidade"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          {fieldErrors.address && (
            <p className="mt-1 text-xs text-destructive">
              {fieldErrors.address}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Cadastrar Lojista
          </button>
        </div>
      </form>
    </div>
  );
}

// --- Main Page ---

type View =
  | { type: "list" }
  | { type: "new" }
  | { type: "detail"; shopId: string };

export function LojistasPage() {
  const [view, setView] = useState<View>({ type: "list" });
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editShopId, setEditShopId] = useState<string | null>(null);
  const [deactivateShop, setDeactivateShop] = useState<Shop | null>(null);

  const queryClient = useQueryClient();
  const { data: shops, isLoading } = useShops();
  const { data: orders } = useOrders();
  const toggleStatus = useToggleShopStatus();

  // Filtered shops (status + search)
  const filteredShops = useMemo(() => {
    if (!shops) return [];
    let list = [...shops];
    if (statusFilter === "active") {
      list = list.filter((s) => s.active);
    } else if (statusFilter === "inactive") {
      list = list.filter((s) => !s.active);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((s) => s.trade_name.toLowerCase().includes(q));
    }
    return list.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [shops, statusFilter, searchQuery]);

  // Status counts
  const statusCounts = useMemo(() => {
    if (!shops) return { all: 0, active: 0, inactive: 0 };
    return {
      all: shops.length,
      active: shops.filter((s) => s.active).length,
      inactive: shops.filter((s) => !s.active).length,
    };
  }, [shops]);

  // Count orders per shop
  const orderCountByShop = useMemo(() => {
    if (!orders) return new Map<string, number>();
    const counts = new Map<string, number>();
    for (const order of orders) {
      if (order.shop_id) {
        counts.set(order.shop_id, (counts.get(order.shop_id) ?? 0) + 1);
      }
    }
    return counts;
  }, [orders]);

  // Last order date per shop
  const lastOrderByShop = useMemo(() => {
    if (!orders) return new Map<string, string>();
    const dates = new Map<string, string>();
    for (const order of orders) {
      if (order.shop_id) {
        const prev = dates.get(order.shop_id);
        if (!prev || order.created_at > prev) {
          dates.set(order.shop_id, order.created_at);
        }
      }
    }
    return dates;
  }, [orders]);

  // Count pending orders per shop (for deactivation dialog)
  const pendingOrdersByShop = useMemo(() => {
    if (!orders) return new Map<string, number>();
    const counts = new Map<string, number>();
    for (const order of orders) {
      if (order.shop_id && order.status !== "delivered" && order.status !== "cancelled") {
        counts.set(order.shop_id, (counts.get(order.shop_id) ?? 0) + 1);
      }
    }
    return counts;
  }, [orders]);

  const invalidateShops = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["shops"] });
  }, [queryClient]);

  const formatShortDate = (iso: string) =>
    new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const handleDeactivateConfirm = useCallback(() => {
    if (!deactivateShop) return;
    toggleStatus.mutate(
      { shopId: deactivateShop.id, active: !deactivateShop.active },
      {
        onSuccess: () => {
          setDeactivateShop(null);
        },
      },
    );
  }, [deactivateShop, toggleStatus]);

  // Shop detail data for edit form
  const { data: editShopData } = useShopDetail(editShopId);

  // --- Render New Shop Form ---
  if (view.type === "new") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView({ type: "list" })}
            className="rounded-md p-1 hover:bg-muted"
            aria-label="Voltar"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold">Novo Lojista</h1>
        </div>
        <NewShopForm
          onClose={() => setView({ type: "list" })}
          onSuccess={() => {
            invalidateShops();
            setView({ type: "list" });
          }}
        />
      </div>
    );
  }

  // --- Render Shop Detail ---
  if (view.type === "detail") {
    return (
      <>
        <ShopDetailView
          shopId={view.shopId}
          onBack={() => setView({ type: "list" })}
          onEdit={() => setEditShopId(view.shopId)}
        />
        {editShopData && (
          <ShopEditForm
            shop={editShopData}
            open={editShopId === view.shopId}
            onClose={() => setEditShopId(null)}
          />
        )}
      </>
    );
  }

  // --- Render Shop List ---
  const filterButtons: { key: "all" | "active" | "inactive"; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "active", label: "Ativos" },
    { key: "inactive", label: "Inativos" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lojistas</h1>
          <p className="mt-1 text-muted-foreground">
            Gerenciamento de lojistas
          </p>
        </div>
        <button
          onClick={() => setView({ type: "new" })}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Novo Lojista
        </button>
      </div>

      {/* Search + Status Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome..."
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring sm:w-64"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filterButtons.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === key
                  ? key === "active"
                    ? "bg-green-100 text-green-800"
                    : key === "inactive"
                      ? "bg-red-100 text-red-800"
                      : "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {label} ({statusCounts[key]})
            </button>
          ))}
        </div>
      </div>

      {/* Shops Table/List */}
      <div className="rounded-lg border bg-card shadow-sm">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : filteredShops.length === 0 ? (
          <EmptyState
            icon={Store}
            title={
              searchQuery.trim()
                ? `Nenhum lojista encontrado para "${searchQuery.trim()}"`
                : statusFilter !== "all"
                  ? `Nenhum lojista ${statusFilter === "active" ? "ativo" : "inativo"}`
                  : "Nenhum lojista cadastrado"
            }
            description={
              searchQuery.trim()
                ? "Tente outro termo de busca"
                : statusFilter !== "all"
                  ? "Tente outro filtro ou cadastre um novo lojista"
                  : "Cadastre o primeiro lojista clicando em 'Novo Lojista'"
            }
          />
        ) : (
          <>
            {/* Table header - desktop only */}
            <div className="hidden border-b px-4 py-2 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-12 sm:gap-4">
              <div className="col-span-3">Nome Fantasia</div>
              <div className="col-span-2">Telefone</div>
              <div className="col-span-2">Pedidos</div>
              <div className="col-span-2">Último Pedido</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2 text-right">Ações</div>
            </div>
            <ul className="divide-y">
              {filteredShops.map((shop) => {
                const orderCount = orderCountByShop.get(shop.id) ?? 0;
                const lastOrder = lastOrderByShop.get(shop.id);
                return (
                  <li
                    key={shop.id}
                    onClick={() =>
                      setView({ type: "detail", shopId: shop.id })
                    }
                    className="cursor-pointer px-4 py-3 transition-colors hover:bg-muted/50 sm:grid sm:grid-cols-12 sm:items-center sm:gap-4"
                  >
                    {/* Mobile layout */}
                    <div className="sm:hidden">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            <Store className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span className="font-medium">
                            {shop.trade_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              shop.active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {shop.active ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {shop.phone}
                          {orderCount > 0 && ` · ${orderCount} pedidos`}
                          {lastOrder && ` · último ${formatShortDate(lastOrder)}`}
                        </p>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditShopId(shop.id);
                            }}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                            aria-label="Editar loja"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeactivateShop(shop);
                            }}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                            aria-label={shop.active ? "Desativar loja" : "Reativar loja"}
                            title={shop.active ? "Desativar" : "Reativar"}
                          >
                            <PowerOff className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Desktop layout */}
                    <div className="col-span-3 hidden items-center gap-2 sm:flex">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <Store className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="truncate font-medium">
                        {shop.trade_name}
                      </span>
                    </div>
                    <div className="col-span-2 hidden text-sm sm:block">
                      {shop.phone}
                    </div>
                    <div className="col-span-2 hidden text-sm sm:block">
                      {orderCount}
                    </div>
                    <div className="col-span-2 hidden text-sm text-muted-foreground sm:block">
                      {lastOrder ? formatShortDate(lastOrder) : "—"}
                    </div>
                    <div className="col-span-1 hidden text-sm sm:block">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          shop.active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {shop.active ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <div className="col-span-2 hidden items-center justify-end gap-1 sm:flex">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditShopId(shop.id);
                        }}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label="Editar loja"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeactivateShop(shop);
                        }}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label={shop.active ? "Desativar loja" : "Reativar loja"}
                        title={shop.active ? "Desativar" : "Reativar"}
                      >
                        <PowerOff className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {/* Edit drawer (from list) */}
      {editShopId && editShopData && (
        <ShopEditForm
          shop={editShopData}
          open={!!editShopId}
          onClose={() => setEditShopId(null)}
        />
      )}

      {/* Deactivation / Reactivation confirm dialog */}
      <ConfirmDialog
        open={!!deactivateShop}
        title={
          deactivateShop?.active
            ? `Desativar loja ${deactivateShop?.trade_name}?`
            : `Reativar loja ${deactivateShop?.trade_name}?`
        }
        description={
          deactivateShop?.active
            ? `${
                (pendingOrdersByShop.get(deactivateShop?.id ?? "") ?? 0) > 0
                  ? `Existem ${pendingOrdersByShop.get(deactivateShop?.id ?? "")} pedidos em andamento que serão mantidos.`
                  : "Pedidos em andamento serão mantidos."
              }`
            : `A loja voltará a receber pedidos.`
        }
        confirmLabel={deactivateShop?.active ? "Desativar" : "Reativar"}
        onConfirm={handleDeactivateConfirm}
        onCancel={() => setDeactivateShop(null)}
        loading={toggleStatus.isPending}
      />
    </div>
  );
}
