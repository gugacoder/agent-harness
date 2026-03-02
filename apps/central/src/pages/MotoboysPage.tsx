import { useState, useMemo, useCallback } from "react";
import {
  Bike,
  Plus,
  X,
  ChevronLeft,
  User,
  AlertCircle,
  Loader2,
  Search,
  Pencil,
  PowerOff,
  MapPin,
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import { type LatLngBoundsExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useQueryClient } from "@tanstack/react-query";
import { useCouriers } from "@/hooks/useCouriers";
import { useCourierDetail, useToggleCourierActive } from "@/hooks/useCourierDetail";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyEventsContext } from "@/contexts/CompanyEventsContext";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CourierStatusBadge, COURIER_STATUS_LABELS } from "@/components/ui/StatusBadge";
import { CourierDetailView } from "@/components/couriers/CourierDetailView";
import { CourierEditForm } from "@/components/couriers/CourierEditForm";
import { CourierGpsBadge } from "@/components/couriers/CourierGpsBadge";
import type { Courier, CourierStatus } from "@/types/api";
import { PageHelpLink } from "@/components/ui/PageHelpLink";
import type { CourierLocation } from "@/hooks/useCourierLocations";

// --- Mini Map Helpers ---

const MARKER_COLORS: Record<CourierStatus, string> = {
  available: "#1dace7",
  busy: "#fca322",
  offline: "#9ca3af",
};

function FitBounds({ bounds }: { bounds: LatLngBoundsExpression | null }) {
  const map = useMap();
  useMemo(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [map, bounds]);
  return null;
}

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
  const [searchQuery, setSearchQuery] = useState("");
  const [deactivateCourier, setDeactivateCourier] = useState<Courier | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    CourierStatus | "all" | "inactive"
  >("all");

  const queryClient = useQueryClient();
  const { data: couriers, isLoading } = useCouriers();
  const toggleActive = useToggleCourierActive();
  const { courierLocations: locations } = useCompanyEventsContext();

  // Filtered couriers (status + search)
  const filteredCouriers = useMemo(() => {
    if (!couriers) return [];
    let list = [...couriers];
    if (statusFilter === "inactive") {
      list = list.filter((c) => !c.active);
    } else if (statusFilter !== "all") {
      list = list.filter((c) => c.status === statusFilter && c.active);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((c) => c.full_name.toLowerCase().includes(q));
    }
    return list.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [couriers, statusFilter, searchQuery]);

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

  // --- Mini Map: build markers from courier locations ---
  const courierMap = useMemo(() => {
    const map = new Map<string, Courier>();
    if (couriers) {
      for (const c of couriers) map.set(c.id, c);
    }
    return map;
  }, [couriers]);

  const mapMarkers = useMemo(() => {
    const result: { courier: Courier; location: CourierLocation }[] = [];
    for (const [courierId, loc] of locations) {
      const courier = courierMap.get(courierId);
      if (courier && courier.active && loc.lat !== 0 && loc.lng !== 0) {
        result.push({ courier, location: loc });
      }
    }
    return result;
  }, [locations, courierMap]);

  const mapBounds: LatLngBoundsExpression | null = useMemo(() => {
    if (mapMarkers.length === 0) return null;
    const lats = mapMarkers.map((m) => m.location.lat);
    const lngs = mapMarkers.map((m) => m.location.lng);
    return [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ];
  }, [mapMarkers]);

  const handleDeactivateConfirm = useCallback(() => {
    if (!deactivateCourier) return;
    toggleActive.mutate(
      { courierId: deactivateCourier.id, active: !deactivateCourier.active },
      {
        onSuccess: () => {
          setDeactivateCourier(null);
        },
      },
    );
  }, [deactivateCourier, toggleActive]);

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
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-2xl font-bold">Motoboys</h1>
            <p className="mt-1 text-muted-foreground">
              Gerenciamento de motoboys
            </p>
          </div>
          <PageHelpLink url="/docs#motoboys" />
        </div>
        <button
          onClick={() => setView({ type: "new" })}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Novo Motoboy
        </button>
      </div>

      {/* Mini Map — active couriers */}
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="flex items-center gap-2 border-b px-4 py-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Motoboys ativos no mapa</span>
          <div className="ml-auto hidden items-center gap-3 text-xs sm:flex">
            <span className="flex items-center gap-1">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: MARKER_COLORS.available }}
              />
              Disponível
            </span>
            <span className="flex items-center gap-1">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: MARKER_COLORS.busy }}
              />
              Ocupado
            </span>
          </div>
        </div>
        <div className="relative" style={{ height: 200 }}>
          <MapContainer
            center={[-15.78, -47.93]}
            zoom={4}
            className="h-full w-full"
            attributionControl={false}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <FitBounds bounds={mapBounds} />
            {mapMarkers.map(({ courier, location }) => (
              <CircleMarker
                key={courier.id}
                center={[location.lat, location.lng]}
                radius={8}
                pathOptions={{
                  color: MARKER_COLORS[courier.status],
                  fillColor: MARKER_COLORS[courier.status],
                  fillOpacity: 0.8,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <Bike className="h-4 w-4" style={{ color: MARKER_COLORS[courier.status] }} />
                      <span className="font-semibold">{courier.full_name}</span>
                      <CourierGpsBadge lastRecordedAt={location.timestamp} />
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      <span
                        className="inline-block rounded-full px-2 py-0.5 text-white"
                        style={{ backgroundColor: MARKER_COLORS[courier.status] }}
                      >
                        {COURIER_STATUS_LABELS[courier.status]}
                      </span>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
          {mapMarkers.length === 0 && (
            <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center">
              <div className="rounded-lg bg-white/90 px-4 py-3 text-center shadow-sm">
                <Bike className="mx-auto mb-1 h-6 w-6 text-muted-foreground/50" />
                <p className="text-xs font-medium text-muted-foreground">
                  Nenhum motoboy com localização
                </p>
              </div>
            </div>
          )}
        </div>
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
              searchQuery.trim()
                ? `Nenhum motoboy encontrado para "${searchQuery.trim()}"`
                : statusFilter !== "all"
                  ? `Nenhum motoboy com status "${filterButtons.find((f) => f.key === statusFilter)?.label}"`
                  : "Nenhum motoboy cadastrado"
            }
            description={
              searchQuery.trim()
                ? "Tente outro termo de busca"
                : statusFilter !== "all"
                  ? "Tente outro filtro ou cadastre um novo motoboy"
                  : "Convide seu primeiro motoboy para começar a operar."
            }
            action={
              statusFilter === "all" && !searchQuery.trim() ? (
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
              <div className="col-span-1">Entregas</div>
              <div className="col-span-2">Ativo</div>
              <div className="col-span-2 text-right">Ações</div>
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
                        <CourierGpsBadge lastRecordedAt={locations.get(courier.id)?.timestamp ?? null} />
                      </div>
                      <CourierStatusBadge status={courier.status} />
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        {courier.phone} · {courier.total_deliveries} entregas
                        {!courier.active && " · Inativo"}
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditCourierId(courier.id);
                          }}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          aria-label="Editar motoboy"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeactivateCourier(courier);
                          }}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          aria-label={courier.active ? "Desativar motoboy" : "Reativar motoboy"}
                          title={courier.active ? "Desativar" : "Reativar"}
                        >
                          <PowerOff className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
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
                    <CourierGpsBadge lastRecordedAt={locations.get(courier.id)?.timestamp ?? null} />
                  </div>
                  <div className="col-span-2 hidden text-sm sm:block">
                    {courier.phone}
                  </div>
                  <div className="col-span-2 hidden sm:block">
                    <CourierStatusBadge status={courier.status} />
                  </div>
                  <div className="col-span-1 hidden text-sm sm:block">
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
                  <div className="col-span-2 hidden items-center justify-end gap-1 sm:flex">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditCourierId(courier.id);
                      }}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="Editar motoboy"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeactivateCourier(courier);
                      }}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label={courier.active ? "Desativar motoboy" : "Reativar motoboy"}
                      title={courier.active ? "Desativar" : "Reativar"}
                    >
                      <PowerOff className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Edit drawer (from list) */}
      {editCourierId && editCourierData && (
        <CourierEditForm
          courier={editCourierData}
          open={!!editCourierId}
          onClose={() => setEditCourierId(null)}
        />
      )}

      {/* Deactivation / Reactivation confirm dialog */}
      <ConfirmDialog
        open={!!deactivateCourier}
        title={
          deactivateCourier?.active
            ? `Desativar motoboy ${deactivateCourier?.full_name}?`
            : `Reativar motoboy ${deactivateCourier?.full_name}?`
        }
        description={
          deactivateCourier?.active
            ? "O motoboy não receberá novas entregas. Entregas em andamento serão mantidas."
            : "O motoboy voltará a receber entregas."
        }
        confirmLabel={deactivateCourier?.active ? "Desativar" : "Reativar"}
        onConfirm={handleDeactivateConfirm}
        onCancel={() => setDeactivateCourier(null)}
        loading={toggleActive.isPending}
      />
    </div>
  );
}
