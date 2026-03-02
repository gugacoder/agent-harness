import { useState, useMemo, useCallback } from "react";
import {
  Bike,
  Plus,
  X,
  ChevronLeft,
  User,
  Phone,
  AlertCircle,
  Loader2,
  Power,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCouriers } from "@/hooks/useCouriers";
import { useCourierDetail } from "@/hooks/useCourierDetail";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { CourierStatusBadge } from "@/components/ui/StatusBadge";
import { CourierDetailView } from "@/components/couriers/CourierDetailView";
import { CourierEditForm } from "@/components/couriers/CourierEditForm";
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

// --- Main Page ---

type View =
  | { type: "list" }
  | { type: "new" }
  | { type: "detail"; courierId: string };

export function MotoboysPage() {
  const [view, setView] = useState<View>({ type: "list" });
  const [editCourierId, setEditCourierId] = useState<string | null>(null);
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
        .patch(`api/couriers/${courier.id}/active`, {
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

  // Courier detail for edit form drawer
  const { data: editCourierData } = useCourierDetail(editCourierId);

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
  if (view.type === "detail") {
    return (
      <>
        <CourierDetailView
          courierId={view.courierId}
          onBack={() => setView({ type: "list" })}
          onEdit={() => setEditCourierId(view.courierId)}
        />
        {editCourierData && (
          <CourierEditForm
            courier={editCourierData}
            open={editCourierId === view.courierId}
            onClose={() => setEditCourierId(null)}
          />
        )}
      </>
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
                  ? "bg-green-100 text-green-800"
                  : key === "busy"
                    ? "bg-amber-100 text-amber-800"
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
                : "Cadastre o primeiro motoboy clicando em 'Novo Motoboy'"
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
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
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
