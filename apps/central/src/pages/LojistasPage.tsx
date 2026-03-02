import { useState, useMemo, useCallback } from "react";
import {
  Store,
  Plus,
  X,
  ChevronLeft,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  Loader2,
  Power,
  Package,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useShops } from "@/hooks/useShops";
import { useOrders } from "@/hooks/useOrders";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { OrderStatusBadge, ORDER_STATUS_LABELS } from "@/components/ui/StatusBadge";
import type { Shop, Order } from "@/types/api";

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

// --- Shop Detail ---

interface ShopDetailProps {
  shop: Shop;
  orders: Order[];
  onBack: () => void;
}

function ShopDetail({ shop, orders, onBack }: ShopDetailProps) {
  const shopOrders = useMemo(
    () => orders.filter((o) => o.shop_id === shop.id),
    [orders, shop.id],
  );

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-md p-1 hover:bg-muted"
          aria-label="Voltar"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{shop.trade_name}</h2>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Info Card */}
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="border-b px-4 py-3">
            <h3 className="font-semibold">Informações</h3>
          </div>
          <div className="space-y-3 p-4">
            <div className="flex items-start gap-2">
              <Store className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Nome Fantasia</p>
                <p className="text-sm">{shop.trade_name}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Telefone</p>
                <p className="text-sm">{shop.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Endereço</p>
                <p className="text-sm">{shop.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Power className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="text-sm">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      shop.active
                        ? "bg-cs-success/10 text-cs-success"
                        : "bg-cs-error/10 text-cs-error"
                    }`}
                  >
                    {shop.active ? "Ativo" : "Inativo"}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Package className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Total de Pedidos</p>
                <p className="text-sm font-medium">{shopOrders.length}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 border-t px-4 py-3 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Cadastrado em</span>
              <span>{formatDate(shop.created_at)}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Última atualização</span>
              <span>{formatDate(shop.updated_at)}</span>
            </div>
          </div>
        </div>

        {/* Orders Card */}
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="border-b px-4 py-3">
            <h3 className="font-semibold">Pedidos Associados</h3>
          </div>
          <div className="p-4">
            {/* Metrics */}
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-2xl font-bold text-primary">
                  {shopOrders.length}
                </p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-2xl font-bold text-primary">
                  {shopOrders.filter((o) => o.status === "delivered").length}
                </p>
                <p className="text-xs text-muted-foreground">Entregues</p>
              </div>
            </div>

            {/* Order List */}
            {shopOrders.length === 0 ? (
              <EmptyState
                icon={Package}
                title="Nenhum pedido associado"
              />
            ) : (
              <ul className="space-y-2">
                {shopOrders
                  .sort(
                    (a, b) =>
                      new Date(b.created_at).getTime() -
                      new Date(a.created_at).getTime(),
                  )
                  .slice(0, 10)
                  .map((order) => (
                    <li
                      key={order.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div>
                        <span className="text-sm font-medium">
                          #{order.order_number}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {order.recipient_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <OrderStatusBadge status={order.status} />
                        <span className="text-xs text-muted-foreground">
                          {formatDate(order.created_at)}
                        </span>
                      </div>
                    </li>
                  ))}
                {shopOrders.length > 10 && (
                  <p className="pt-1 text-center text-xs text-muted-foreground">
                    ... e mais {shopOrders.length - 10} pedidos
                  </p>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>
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

  const queryClient = useQueryClient();
  const { data: shops, isLoading } = useShops();
  const { data: orders } = useOrders();

  // Filtered shops
  const filteredShops = useMemo(() => {
    if (!shops) return [];
    let list = [...shops];
    if (statusFilter === "active") {
      list = list.filter((s) => s.active);
    } else if (statusFilter === "inactive") {
      list = list.filter((s) => !s.active);
    }
    return list.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [shops, statusFilter]);

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

  const invalidateShops = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["shops"] });
  }, [queryClient]);

  // Get current shop for detail view
  const currentShop = useMemo(() => {
    if (view.type === "detail") {
      return shops?.find((s) => s.id === view.shopId) ?? null;
    }
    return null;
  }, [shops, view]);

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
  if (view.type === "detail" && currentShop) {
    return (
      <ShopDetail
        shop={currentShop}
        orders={orders ?? []}
        onBack={() => setView({ type: "list" })}
      />
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

      {/* Status Filter Badges */}
      <div className="flex flex-wrap gap-2">
        {filterButtons.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === key
                ? key === "active"
                  ? "bg-cs-success/10 text-cs-success"
                  : key === "inactive"
                    ? "bg-cs-error/10 text-cs-error"
                    : "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {label} ({statusCounts[key]})
          </button>
        ))}
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
              statusFilter !== "all"
                ? `Nenhum lojista ${statusFilter === "active" ? "ativo" : "inativo"}`
                : "Nenhuma loja cadastrada"
            }
            description={
              statusFilter !== "all"
                ? "Tente outro filtro ou cadastre um novo lojista"
                : "Cadastre sua primeira loja para começar a receber pedidos."
            }
            action={
              statusFilter === "all" ? (
                <button
                  type="button"
                  onClick={() => setView({ type: "new" })}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  Cadastrar loja
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Table header - desktop only */}
            <div className="hidden border-b px-4 py-2 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-12 sm:gap-4">
              <div className="col-span-3">Nome Fantasia</div>
              <div className="col-span-2">Telefone</div>
              <div className="col-span-3">Endereço</div>
              <div className="col-span-2">Pedidos</div>
              <div className="col-span-2">Status</div>
            </div>
            <ul className="divide-y">
              {filteredShops.map((shop) => (
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
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          shop.active
                            ? "bg-cs-success/10 text-cs-success"
                            : "bg-cs-error/10 text-cs-error"
                        }`}
                      >
                        {shop.active ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {shop.phone} · {shop.address}
                      {(orderCountByShop.get(shop.id) ?? 0) > 0 &&
                        ` · ${orderCountByShop.get(shop.id)} pedidos`}
                    </p>
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
                  <div className="col-span-3 hidden truncate text-sm sm:block">
                    {shop.address}
                  </div>
                  <div className="col-span-2 hidden text-sm sm:block">
                    {orderCountByShop.get(shop.id) ?? 0}
                  </div>
                  <div className="col-span-2 hidden text-sm sm:block">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        shop.active
                          ? "bg-cs-success/10 text-cs-success"
                          : "bg-cs-error/10 text-cs-error"
                      }`}
                    >
                      {shop.active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
