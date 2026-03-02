import { useState, useMemo, useCallback } from "react";
import {
  Bike,
  Plus,
  X,
  ChevronLeft,
  User,
  Phone,
  Mail,
  Camera,
  AlertCircle,
  Loader2,
  Power,
  Package,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCouriers } from "@/hooks/useCouriers";
import { useOrders } from "@/hooks/useOrders";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { CourierStatusBadge } from "@/components/ui/StatusBadge";
import type { Courier, CourierStatus } from "@/types/api";

// --- New Courier Form ---

interface NewCourierFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

function NewCourierForm({ onClose, onSuccess }: NewCourierFormProps) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    photo_url: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = useCallback(() => {
    const errors: Record<string, string> = {};
    if (!form.full_name.trim()) errors.full_name = "Nome é obrigatório";
    if (!form.phone.trim()) errors.phone = "Telefone é obrigatório";
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
            role: "courier",
            full_name: form.full_name.trim(),
            phone: form.phone.trim(),
          },
        })
        .json<{ user_id: string; email: string }>();

      // 2. Create profile via Supabase REST
      const { error: profileError } = await supabase.from("profiles").insert({
        id: inviteResult.user_id,
        company_id: user!.companyId,
        role: "courier",
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        avatar_url: form.photo_url.trim() || null,
      });

      if (profileError) {
        throw new Error(profileError.message);
      }

      // 3. Create courier via backbone API
      await api
        .post("api/couriers", {
          json: {
            profile_id: inviteResult.user_id,
            full_name: form.full_name.trim(),
            phone: form.phone.trim(),
            photo_url: form.photo_url.trim() || null,
          },
        })
        .json();

      onSuccess();
    } catch (err) {
      if (err instanceof Error) {
        // Handle duplicate email
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
        setError("Erro ao cadastrar motoboy");
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
        <h2 className="text-lg font-semibold">Novo Motoboy</h2>
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
          <label className="mb-1 block text-sm font-medium">Nome *</label>
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => updateField("full_name", e.target.value)}
            placeholder="Nome completo do motoboy"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          {fieldErrors.full_name && (
            <p className="mt-1 text-xs text-destructive">
              {fieldErrors.full_name}
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
              placeholder="motoboy@email.com"
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
          <label className="mb-1 block text-sm font-medium">
            Foto (URL)
          </label>
          <input
            type="url"
            value={form.photo_url}
            onChange={(e) => updateField("photo_url", e.target.value)}
            placeholder="https://exemplo.com/foto.jpg"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Opcional — insira a URL da foto do motoboy
          </p>
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
            Cadastrar Motoboy
          </button>
        </div>
      </form>
    </div>
  );
}

// --- Courier Detail ---

interface CourierDetailProps {
  courier: Courier;
  onBack: () => void;
  onToggleActive: () => void;
  toggling: boolean;
}

function CourierDetail({
  courier,
  onBack,
  onToggleActive,
  toggling,
}: CourierDetailProps) {
  const { data: orders } = useOrders();

  // Count delivered orders for this courier (via deliveries)
  // Since we don't have a deliveries-by-courier endpoint, use total_deliveries from courier data
  const deliveredCount = courier.total_deliveries;

  // Try to find active orders assigned to this courier
  // Orders don't have courier_id directly, so we show total_deliveries as the metric
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
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">{courier.full_name}</h2>
            <CourierStatusBadge status={courier.status} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Info Card */}
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="border-b px-4 py-3">
            <h3 className="font-semibold">Informações</h3>
          </div>
          <div className="space-y-3 p-4">
            {courier.photo_url && (
              <div className="flex justify-center pb-2">
                <img
                  src={courier.photo_url}
                  alt={courier.full_name}
                  className="h-20 w-20 rounded-full object-cover border"
                />
              </div>
            )}
            <div className="flex items-start gap-2">
              <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Nome</p>
                <p className="text-sm">{courier.full_name}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Telefone</p>
                <p className="text-sm">{courier.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Bike className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <div className="mt-0.5">
                  <CourierStatusBadge status={courier.status} />
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Power className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Ativo</p>
                <p className="text-sm">
                  {courier.active ? "Sim" : "Não"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Package className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">
                  Entregas Concluídas
                </p>
                <p className="text-sm font-medium">{deliveredCount}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 border-t px-4 py-3">
            <button
              onClick={onToggleActive}
              disabled={toggling}
              className={`flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium ${
                courier.active
                  ? "border border-destructive text-destructive hover:bg-destructive/10"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              } disabled:opacity-50`}
            >
              {toggling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Power className="h-4 w-4" />
              )}
              {courier.active ? "Desativar" : "Ativar"}
            </button>
          </div>
        </div>

        {/* Delivery History Card */}
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="border-b px-4 py-3">
            <h3 className="font-semibold">Histórico de Entregas</h3>
          </div>
          <div className="p-4">
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-2xl font-bold text-primary">
                  {deliveredCount}
                </p>
                <p className="text-xs text-muted-foreground">
                  Total de Entregas
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-2xl font-bold text-primary">
                  {courier.status === "busy" ? "1" : "0"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Em Andamento
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Cadastrado em</span>
                <span>{formatDate(courier.created_at)}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Última atualização</span>
                <span>{formatDate(courier.updated_at)}</span>
              </div>
            </div>
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
  | { type: "detail"; courierId: string };

export function MotoboysPage() {
  const [view, setView] = useState<View>({ type: "list" });
  const [toggling, setToggling] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    CourierStatus | "all" | "inactive"
  >("all");

  const queryClient = useQueryClient();
  const { data: couriers, isLoading } = useCouriers();

  // Filtered couriers
  const filteredCouriers = useMemo(() => {
    if (!couriers) return [];
    let list = [...couriers];
    if (statusFilter === "inactive") {
      list = list.filter((c) => !c.active);
    } else if (statusFilter !== "all") {
      list = list.filter((c) => c.status === statusFilter && c.active);
    }
    return list.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [couriers, statusFilter]);

  // Status counts
  const statusCounts = useMemo(() => {
    if (!couriers) return { all: 0, available: 0, busy: 0, offline: 0, inactive: 0 };
    return {
      all: couriers.length,
      available: couriers.filter((c) => c.status === "available" && c.active).length,
      busy: couriers.filter((c) => c.status === "busy" && c.active).length,
      offline: couriers.filter((c) => c.status === "offline" && c.active).length,
      inactive: couriers.filter((c) => !c.active).length,
    };
  }, [couriers]);

  const invalidateCouriers = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["couriers"] });
  }, [queryClient]);

  const handleToggleActive = async (courier: Courier) => {
    setToggling(true);
    try {
      await api
        .patch(`api/couriers/${courier.id}`, {
          json: { active: !courier.active },
        })
        .json();
      invalidateCouriers();
    } catch {
      // Error handling — stay on page
    } finally {
      setToggling(false);
    }
  };

  // Get current courier for detail view
  const currentCourier = useMemo(() => {
    if (view.type === "detail") {
      return couriers?.find((c) => c.id === view.courierId) ?? null;
    }
    return null;
  }, [couriers, view]);

  // --- Render New Courier Form ---
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
          <h1 className="text-2xl font-bold">Novo Motoboy</h1>
        </div>
        <NewCourierForm
          onClose={() => setView({ type: "list" })}
          onSuccess={() => {
            invalidateCouriers();
            setView({ type: "list" });
          }}
        />
      </div>
    );
  }

  // --- Render Courier Detail ---
  if (view.type === "detail" && currentCourier) {
    return (
      <CourierDetail
        courier={currentCourier}
        onBack={() => setView({ type: "list" })}
        onToggleActive={() => handleToggleActive(currentCourier)}
        toggling={toggling}
      />
    );
  }

  // --- Render Courier List ---
  const filterButtons: { key: CourierStatus | "all" | "inactive"; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "available", label: "Disponível" },
    { key: "busy", label: "Ocupado" },
    { key: "offline", label: "Offline" },
    { key: "inactive", label: "Inativos" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Motoboys</h1>
          <p className="mt-1 text-muted-foreground">
            Gerenciamento de motoboys
          </p>
        </div>
        <button
          onClick={() => setView({ type: "new" })}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Novo Motoboy
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
                ? key === "available"
                  ? "bg-cs-success/10 text-cs-success"
                  : key === "busy"
                    ? "bg-cs-warning/10 text-cs-warning"
                    : "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {label} ({statusCounts[key]})
          </button>
        ))}
      </div>

      {/* Couriers Table/List */}
      <div className="rounded-lg border bg-card shadow-sm">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : filteredCouriers.length === 0 ? (
          <EmptyState
            icon={Bike}
            title={
              statusFilter !== "all"
                ? `Nenhum motoboy com status "${filterButtons.find((f) => f.key === statusFilter)?.label}"`
                : "Nenhum motoboy cadastrado"
            }
            description={
              statusFilter !== "all"
                ? "Tente outro filtro ou cadastre um novo motoboy"
                : "Convide seu primeiro motoboy para começar a operar."
            }
            action={
              statusFilter === "all" ? (
                <button
                  type="button"
                  onClick={() => setView({ type: "new" })}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  Cadastrar motoboy
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Table header - desktop only */}
            <div className="hidden border-b px-4 py-2 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-12 sm:gap-4">
              <div className="col-span-3">Nome</div>
              <div className="col-span-2">Telefone</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Entregas</div>
              <div className="col-span-2">Ativo</div>
              <div className="col-span-1" />
            </div>
            <ul className="divide-y">
              {filteredCouriers.map((courier) => (
                <li
                  key={courier.id}
                  onClick={() =>
                    setView({ type: "detail", courierId: courier.id })
                  }
                  className="cursor-pointer px-4 py-3 transition-colors hover:bg-muted/50 sm:grid sm:grid-cols-12 sm:items-center sm:gap-4"
                >
                  {/* Mobile layout */}
                  <div className="sm:hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {courier.photo_url ? (
                          <img
                            src={courier.photo_url}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <span className="font-medium">
                          {courier.full_name}
                        </span>
                      </div>
                      <CourierStatusBadge status={courier.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {courier.phone} · {courier.total_deliveries} entregas
                      {!courier.active && " · Inativo"}
                    </p>
                  </div>

                  {/* Desktop layout */}
                  <div className="col-span-3 hidden items-center gap-2 sm:flex">
                    {courier.photo_url ? (
                      <img
                        src={courier.photo_url}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <span className="truncate font-medium">
                      {courier.full_name}
                    </span>
                  </div>
                  <div className="col-span-2 hidden text-sm sm:block">
                    {courier.phone}
                  </div>
                  <div className="col-span-2 hidden sm:block">
                    <CourierStatusBadge status={courier.status} />
                  </div>
                  <div className="col-span-2 hidden text-sm sm:block">
                    {courier.total_deliveries}
                  </div>
                  <div className="col-span-2 hidden text-sm sm:block">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        courier.active
                          ? "bg-cs-success/10 text-cs-success"
                          : "bg-cs-error/10 text-cs-error"
                      }`}
                    >
                      {courier.active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <div className="col-span-1 hidden sm:flex sm:justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleActive(courier);
                      }}
                      disabled={toggling}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                      title={courier.active ? "Desativar" : "Ativar"}
                    >
                      <Power className="h-4 w-4" />
                    </button>
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
