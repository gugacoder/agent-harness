import { useState, useMemo, useCallback } from "react";
import {
  Package,
  Plus,
  X,
  ChevronLeft,
  Clock,
  User,
  MapPin,
  Phone,
  FileText,
  Bike,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useOrders } from "@/hooks/useOrders";
import { useShops } from "@/hooks/useShops";
import { useCouriers } from "@/hooks/useCouriers";
import { api } from "@/lib/api";
import type { Order, OrderStatus, Courier, Delivery } from "@/types/api";

// --- Constants ---

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendente",
  assigned: "Atribuído",
  picked_up: "Coletado",
  in_transit: "Em Trânsito",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  assigned: "bg-secondary text-secondary-foreground",
  picked_up: "bg-accent text-accent-foreground",
  in_transit: "bg-secondary text-secondary-foreground",
  delivered: "bg-primary text-primary-foreground",
  cancelled: "bg-destructive text-white",
};

const ALL_STATUSES: OrderStatus[] = [
  "pending",
  "assigned",
  "picked_up",
  "in_transit",
  "delivered",
  "cancelled",
];

// --- Status Badge ---

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

// --- Skeleton ---

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted ${className ?? ""}`}
    />
  );
}

// --- Timeline Event ---

function TimelineItem({
  icon: Icon,
  title,
  description,
  time,
  isLast,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  time: string;
  isLast?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        {!isLast && <div className="w-px flex-1 bg-border" />}
      </div>
      <div className={`pb-4 ${isLast ? "" : ""}`}>
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
        <p className="mt-0.5 text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}

// --- New Order Form ---

interface NewOrderFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

function NewOrderForm({ onClose, onSuccess }: NewOrderFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    pickup_address: "",
    delivery_address: "",
    recipient_name: "",
    recipient_phone: "",
    notes: "",
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = useCallback(() => {
    const errors: Record<string, string> = {};
    if (!form.pickup_address.trim())
      errors.pickup_address = "Endereço de coleta é obrigatório";
    if (!form.delivery_address.trim())
      errors.delivery_address = "Endereço de entrega é obrigatório";
    if (!form.recipient_name.trim())
      errors.recipient_name = "Nome do destinatário é obrigatório";
    if (!form.recipient_phone.trim())
      errors.recipient_phone = "Telefone do destinatário é obrigatório";
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
      await api
        .post("api/orders", {
          json: {
            pickup_address: form.pickup_address.trim(),
            pickup_lat: "0",
            pickup_lng: "0",
            delivery_address: form.delivery_address.trim(),
            delivery_lat: "0",
            delivery_lng: "0",
            recipient_name: form.recipient_name.trim(),
            recipient_phone: form.recipient_phone.trim(),
            notes: form.notes.trim() || undefined,
          },
        })
        .json();
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao criar pedido",
      );
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
        <h2 className="text-lg font-semibold">Novo Pedido</h2>
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
            Endereço de Coleta *
          </label>
          <input
            type="text"
            value={form.pickup_address}
            onChange={(e) => updateField("pickup_address", e.target.value)}
            placeholder="Rua, número, bairro..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          {fieldErrors.pickup_address && (
            <p className="mt-1 text-xs text-destructive">
              {fieldErrors.pickup_address}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Endereço de Entrega *
          </label>
          <input
            type="text"
            value={form.delivery_address}
            onChange={(e) => updateField("delivery_address", e.target.value)}
            placeholder="Rua, número, bairro..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          {fieldErrors.delivery_address && (
            <p className="mt-1 text-xs text-destructive">
              {fieldErrors.delivery_address}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Nome do Destinatário *
            </label>
            <input
              type="text"
              value={form.recipient_name}
              onChange={(e) => updateField("recipient_name", e.target.value)}
              placeholder="Nome completo"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            {fieldErrors.recipient_name && (
              <p className="mt-1 text-xs text-destructive">
                {fieldErrors.recipient_name}
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Telefone do Destinatário *
            </label>
            <input
              type="text"
              value={form.recipient_phone}
              onChange={(e) => updateField("recipient_phone", e.target.value)}
              placeholder="(00) 00000-0000"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            {fieldErrors.recipient_phone && (
              <p className="mt-1 text-xs text-destructive">
                {fieldErrors.recipient_phone}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Observações</label>
          <textarea
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            placeholder="Instruções especiais, referências..."
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
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
            Criar Pedido
          </button>
        </div>
      </form>
    </div>
  );
}

// --- Assign Courier Modal ---

interface AssignCourierProps {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}

function AssignCourierPanel({ order, onClose, onSuccess }: AssignCourierProps) {
  const { data: couriers, isLoading } = useCouriers({
    status: "available",
    active: true,
  });
  const [assigning, setAssigning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAssign = async (courierId: string) => {
    setAssigning(courierId);
    setError(null);
    try {
      await api
        .post(`api/orders/${order.id}/assign`, {
          json: { courier_id: courierId },
        })
        .json<Delivery>();
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao atribuir motoboy",
      );
      setAssigning(null);
    }
  };

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-lg font-semibold">
          Atribuir Motoboy — #{order.order_number}
        </h2>
        <button
          onClick={onClose}
          className="rounded-md p-1 hover:bg-muted"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="p-4">
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : !couriers || couriers.length === 0 ? (
          <div className="py-8 text-center">
            <Bike className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">
              Nenhum motoboy disponível
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Não há motoboys com status disponível no momento
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {couriers.map((courier) => (
              <li
                key={courier.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="text-sm font-medium">{courier.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {courier.phone} · {courier.total_deliveries} entregas
                  </p>
                </div>
                <button
                  onClick={() => handleAssign(courier.id)}
                  disabled={assigning !== null}
                  className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {assigning === courier.id && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  Atribuir
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// --- Order Detail ---

interface OrderDetailProps {
  order: Order;
  shopName: string | null;
  courierName: string | null;
  onBack: () => void;
  onAssign: () => void;
  onCancel: () => void;
  cancelling: boolean;
}

function OrderDetail({
  order,
  shopName,
  courierName,
  onBack,
  onAssign,
  onCancel,
  cancelling,
}: OrderDetailProps) {
  const canAssign = order.status === "pending";
  const canCancel =
    order.status === "pending" || order.status === "assigned";

  // Build a timeline from the order data
  const timelineItems = useMemo(() => {
    const items: {
      icon: React.ComponentType<{ className?: string }>;
      title: string;
      description?: string;
      time: string;
    }[] = [];

    const formatDate = (iso: string) =>
      new Date(iso).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

    items.push({
      icon: Package,
      title: "Pedido criado",
      description: `#${order.order_number}`,
      time: formatDate(order.created_at),
    });

    if (
      order.status === "assigned" ||
      order.status === "picked_up" ||
      order.status === "in_transit" ||
      order.status === "delivered"
    ) {
      items.push({
        icon: Bike,
        title: "Motoboy atribuído",
        description: courierName ?? undefined,
        time: formatDate(order.updated_at),
      });
    }

    if (
      order.status === "picked_up" ||
      order.status === "in_transit" ||
      order.status === "delivered"
    ) {
      items.push({
        icon: MapPin,
        title: "Pedido coletado",
        time: formatDate(order.updated_at),
      });
    }

    if (order.status === "in_transit" || order.status === "delivered") {
      items.push({
        icon: Clock,
        title: "Em trânsito",
        time: formatDate(order.updated_at),
      });
    }

    if (order.status === "delivered") {
      items.push({
        icon: CheckCircle2,
        title: "Entregue",
        time: formatDate(order.updated_at),
      });
    }

    if (order.status === "cancelled") {
      items.push({
        icon: X,
        title: "Cancelado",
        time: formatDate(order.updated_at),
      });
    }

    return items;
  }, [order, courierName]);

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
            <h2 className="text-xl font-bold">Pedido #{order.order_number}</h2>
            <StatusBadge status={order.status} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Order Info */}
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="border-b px-4 py-3">
            <h3 className="font-semibold">Informações</h3>
          </div>
          <div className="space-y-3 p-4">
            {shopName && (
              <div className="flex items-start gap-2">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Lojista</p>
                  <p className="text-sm">{shopName}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Coleta</p>
                <p className="text-sm">{order.pickup_address}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Entrega</p>
                <p className="text-sm">{order.delivery_address}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Destinatário</p>
                <p className="text-sm">{order.recipient_name}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Telefone</p>
                <p className="text-sm">{order.recipient_phone}</p>
              </div>
            </div>
            {order.notes && (
              <div className="flex items-start gap-2">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Observações</p>
                  <p className="text-sm">{order.notes}</p>
                </div>
              </div>
            )}
            {courierName && (
              <div className="flex items-start gap-2">
                <Bike className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Motoboy</p>
                  <p className="text-sm">{courierName}</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          {(canAssign || canCancel) && (
            <div className="flex gap-2 border-t px-4 py-3">
              {canAssign && (
                <button
                  onClick={onAssign}
                  className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Bike className="h-4 w-4" />
                  Atribuir Motoboy
                </button>
              )}
              {canCancel && (
                <button
                  onClick={onCancel}
                  disabled={cancelling}
                  className="flex items-center gap-1 rounded-md border border-destructive px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
                >
                  {cancelling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  Cancelar Pedido
                </button>
              )}
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="border-b px-4 py-3">
            <h3 className="font-semibold">Timeline</h3>
          </div>
          <div className="p-4">
            {timelineItems.map((item, idx) => (
              <TimelineItem
                key={idx}
                icon={item.icon}
                title={item.title}
                description={item.description}
                time={item.time}
                isLast={idx === timelineItems.length - 1}
              />
            ))}
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
  | { type: "detail"; orderId: string }
  | { type: "assign"; orderId: string };

export function PedidosPage() {
  const [view, setView] = useState<View>({ type: "list" });
  const [statusFilter, setStatusFilter] = useState<OrderStatus | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const queryClient = useQueryClient();
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { data: shops } = useShops();
  const { data: couriers } = useCouriers();

  // Lookup maps
  const shopMap = useMemo(() => {
    const map = new Map<string, string>();
    if (shops) {
      for (const s of shops) map.set(s.id, s.trade_name);
    }
    return map;
  }, [shops]);

  const courierMap = useMemo(() => {
    const map = new Map<string, string>();
    if (couriers) {
      for (const c of couriers) map.set(c.id, c.full_name);
    }
    return map;
  }, [couriers]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    let list = [...orders];
    if (statusFilter) {
      list = list.filter((o) => o.status === statusFilter);
    }
    return list.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [orders, statusFilter]);

  // Status counts for filter badges
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    if (orders) {
      counts.all = orders.length;
      for (const s of ALL_STATUSES) {
        counts[s] = orders.filter((o) => o.status === s).length;
      }
    }
    return counts;
  }, [orders]);

  const invalidateOrders = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["orders"] });
  }, [queryClient]);

  const handleCancelOrder = async (orderId: string) => {
    setCancelling(true);
    try {
      await api.delete(`api/orders/${orderId}`).json();
      invalidateOrders();
      setView({ type: "list" });
    } catch {
      // Error handling — stay on detail view
    } finally {
      setCancelling(false);
    }
  };

  // Get current order for detail/assign views
  const currentOrder = useMemo(() => {
    if (view.type === "detail" || view.type === "assign") {
      return orders?.find((o) => o.id === view.orderId) ?? null;
    }
    return null;
  }, [orders, view]);

  // --- Render New Order Form ---
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
          <h1 className="text-2xl font-bold">Novo Pedido</h1>
        </div>
        <NewOrderForm
          onClose={() => setView({ type: "list" })}
          onSuccess={() => {
            invalidateOrders();
            setView({ type: "list" });
          }}
        />
      </div>
    );
  }

  // --- Render Assign Courier ---
  if (view.type === "assign" && currentOrder) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              setView({ type: "detail", orderId: currentOrder.id })
            }
            className="rounded-md p-1 hover:bg-muted"
            aria-label="Voltar"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold">Atribuir Motoboy</h1>
        </div>
        <AssignCourierPanel
          order={currentOrder}
          onClose={() =>
            setView({ type: "detail", orderId: currentOrder.id })
          }
          onSuccess={() => {
            invalidateOrders();
            queryClient.invalidateQueries({ queryKey: ["couriers"] });
            setView({ type: "detail", orderId: currentOrder.id });
          }}
        />
      </div>
    );
  }

  // --- Render Order Detail ---
  if (view.type === "detail" && currentOrder) {
    return (
      <OrderDetail
        order={currentOrder}
        shopName={
          currentOrder.shop_id
            ? shopMap.get(currentOrder.shop_id) ?? null
            : null
        }
        courierName={null}
        onBack={() => setView({ type: "list" })}
        onAssign={() =>
          setView({ type: "assign", orderId: currentOrder.id })
        }
        onCancel={() => handleCancelOrder(currentOrder.id)}
        cancelling={cancelling}
      />
    );
  }

  // --- Render Order List ---
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pedidos</h1>
          <p className="mt-1 text-muted-foreground">
            Gerenciamento de pedidos
          </p>
        </div>
        <button
          onClick={() => setView({ type: "new" })}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Novo Pedido
        </button>
      </div>

      {/* Status Filter Badges */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter(null)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            statusFilter === null
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Todos ({statusCounts.all})
        </button>
        {ALL_STATUSES.map((status) => (
          <button
            key={status}
            onClick={() =>
              setStatusFilter(statusFilter === status ? null : status)
            }
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === status
                ? STATUS_COLORS[status]
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {STATUS_LABELS[status]} ({statusCounts[status] ?? 0})
          </button>
        ))}
      </div>

      {/* Orders Table/List */}
      <div className="rounded-lg border bg-card shadow-sm">
        {ordersLoading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">
              {statusFilter
                ? `Nenhum pedido com status "${STATUS_LABELS[statusFilter]}"`
                : "Nenhum pedido encontrado"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              {statusFilter
                ? "Tente outro filtro ou crie um novo pedido"
                : "Crie o primeiro pedido clicando em 'Novo Pedido'"}
            </p>
          </div>
        ) : (
          <>
            {/* Table header - desktop only */}
            <div className="hidden border-b px-4 py-2 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-12 sm:gap-4">
              <div className="col-span-2">Número</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-3">Lojista</div>
              <div className="col-span-3">Destinatário</div>
              <div className="col-span-2">Criado em</div>
            </div>
            <ul className="divide-y">
              {filteredOrders.map((order) => (
                <li
                  key={order.id}
                  onClick={() =>
                    setView({ type: "detail", orderId: order.id })
                  }
                  className="cursor-pointer px-4 py-3 transition-colors hover:bg-muted/50 sm:grid sm:grid-cols-12 sm:items-center sm:gap-4"
                >
                  {/* Mobile layout */}
                  <div className="sm:hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          #{order.order_number}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleTimeString(
                          "pt-BR",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {order.shop_id
                        ? shopMap.get(order.shop_id) ?? ""
                        : ""}{" "}
                      → {order.recipient_name}
                    </p>
                  </div>

                  {/* Desktop layout */}
                  <div className="col-span-2 hidden sm:block">
                    <span className="font-medium">#{order.order_number}</span>
                  </div>
                  <div className="col-span-2 hidden sm:block">
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="col-span-3 hidden truncate text-sm sm:block">
                    {order.shop_id
                      ? shopMap.get(order.shop_id) ?? "—"
                      : "—"}
                  </div>
                  <div className="col-span-3 hidden truncate text-sm sm:block">
                    {order.recipient_name}
                  </div>
                  <div className="col-span-2 hidden text-sm text-muted-foreground sm:block">
                    {new Date(order.created_at).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
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
