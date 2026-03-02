import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Phone,
  MapPin,
  User,
  Bike,
  Edit,
  Package,
  Clock,
  TrendingUp,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  useCourierDetail,
  useCourierDeliveries,
  useCourierMetrics,
  useToggleCourierActive,
} from "@/hooks/useCourierDetail";
import { CourierStatusBadge } from "@/components/ui/StatusBadge";
import { CourierGpsBadge } from "@/components/couriers/CourierGpsBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface CourierDetailViewProps {
  courierId: string;
  onBack: () => void;
  onEdit: () => void;
}

const BLUE_ICON = new L.Icon({
  iconUrl:
    "data:image/svg+xml," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#1dace7"/>
        <circle cx="12" cy="12" r="5" fill="white"/>
      </svg>`,
    ),
  iconSize: [24, 36],
  iconAnchor: [12, 36],
});

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const VEHICLE_LABELS: Record<string, string> = {
  moto: "Moto",
  bicicleta: "Bicicleta",
  carro: "Carro",
};

export function CourierDetailView({ courierId, onBack, onEdit }: CourierDetailViewProps) {
  const { data: courier, isLoading: courierLoading } = useCourierDetail(courierId);
  const [deliveriesPage, setDeliveriesPage] = useState(0);
  const { data: deliveriesData, isLoading: deliveriesLoading } = useCourierDeliveries(
    courierId,
    { limit: 10, offset: deliveriesPage * 10 }
  );
  const { data: metrics, isLoading: metricsLoading } = useCourierMetrics(courierId);

  const toggleActive = useToggleCourierActive();
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const hasLocation = useMemo(() => {
    if (!courier?.last_location) return false;
    const lat = parseFloat(courier.last_location.lat);
    const lng = parseFloat(courier.last_location.lng);
    return !isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0);
  }, [courier]);

  const totalPages = useMemo(() => {
    if (!deliveriesData) return 0;
    return Math.ceil(deliveriesData.total / 10);
  }, [deliveriesData]);

  if (courierLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!courier) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Voltar
        </button>
        <EmptyState icon={Bike} title="Motoboy não encontrado" />
      </div>
    );
  }

  const handleToggleActive = () => {
    toggleActive.mutate(
      { courierId: courier.id, active: !courier.active },
      { onSuccess: () => setConfirmDeactivate(false) }
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="rounded-md p-1 hover:bg-muted"
            aria-label="Voltar"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            {courier.photo_url ? (
              <img
                src={courier.photo_url}
                alt={courier.full_name}
                className="h-10 w-10 rounded-full object-cover border"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{courier.full_name}</h2>
                <CourierGpsBadge lastRecordedAt={courier.last_location?.recorded_at ?? null} />
              </div>
              <div className="flex items-center gap-2">
                <CourierStatusBadge status={courier.status} />
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
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <Edit className="h-4 w-4" />
            Editar
          </button>
          <button
            onClick={() => setConfirmDeactivate(true)}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              courier.active
                ? "border border-red-200 text-red-700 hover:bg-red-50"
                : "border border-green-200 text-green-700 hover:bg-green-50"
            }`}
          >
            {courier.active ? "Desativar" : "Reativar"}
          </button>
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
            {courier.vehicle_type && (
              <div className="flex items-start gap-2">
                <Bike className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Veículo</p>
                  <p className="text-sm">
                    {VEHICLE_LABELS[courier.vehicle_type] ?? courier.vehicle_type}
                  </p>
                </div>
              </div>
            )}
            {courier.plate_number && (
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Placa</p>
                  <p className="text-sm">{courier.plate_number}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Map Card */}
        {hasLocation && courier.last_location && (
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="border-b px-4 py-3">
              <h3 className="font-semibold">Última Localização</h3>
              <p className="text-xs text-muted-foreground">
                {formatDate(courier.last_location.recorded_at)}
              </p>
            </div>
            <div className="h-[200px] overflow-hidden rounded-b-lg">
              <MapContainer
                center={[
                  parseFloat(courier.last_location.lat),
                  parseFloat(courier.last_location.lng),
                ]}
                zoom={17}
                scrollWheelZoom={false}
                dragging={false}
                className="h-full w-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker
                  position={[
                    parseFloat(courier.last_location.lat),
                    parseFloat(courier.last_location.lng),
                  ]}
                  icon={BLUE_ICON}
                />
              </MapContainer>
            </div>
          </div>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Package className="h-4 w-4" />
            <span className="text-xs">Entregas Hoje</span>
          </div>
          {metricsLoading ? (
            <Skeleton className="mt-1 h-8 w-16" />
          ) : (
            <p className="mt-1 text-2xl font-bold">{metrics?.deliveries_today ?? 0}</p>
          )}
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">Entregas Mês</span>
          </div>
          {metricsLoading ? (
            <Skeleton className="mt-1 h-8 w-16" />
          ) : (
            <p className="mt-1 text-2xl font-bold">{metrics?.deliveries_month ?? 0}</p>
          )}
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-xs">Tempo Médio</span>
          </div>
          {metricsLoading ? (
            <Skeleton className="mt-1 h-8 w-16" />
          ) : (
            <p className="mt-1 text-2xl font-bold">
              {metrics?.avg_delivery_time_min ? `${Math.round(metrics.avg_delivery_time_min)}min` : "—"}
            </p>
          )}
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs">Taxa Conclusão</span>
          </div>
          {metricsLoading ? (
            <Skeleton className="mt-1 h-8 w-16" />
          ) : (
            <p className="mt-1 text-2xl font-bold">
              {metrics?.completion_rate != null ? `${Math.round(metrics.completion_rate)}%` : "—"}
            </p>
          )}
        </div>
      </div>

      {/* Delivery History */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="border-b px-4 py-3">
          <h3 className="font-semibold">Histórico de Entregas (últimos 30 dias)</h3>
        </div>
        <div className="p-4">
          {deliveriesLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : !deliveriesData || deliveriesData.data.length === 0 ? (
            <EmptyState icon={Package} title="Nenhuma entrega neste período" />
          ) : (
            <>
              <ul className="space-y-2">
                {deliveriesData.data.map((delivery) => (
                  <li
                    key={delivery.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div>
                      <span className="text-sm font-medium">
                        #{delivery.order_number}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {delivery.recipient_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          delivery.status === "delivered"
                            ? "bg-green-100 text-green-800"
                            : delivery.status === "failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {delivery.status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(delivery.assigned_at)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
              {totalPages > 1 && (
                <div className="mt-3 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setDeliveriesPage((p) => Math.max(0, p - 1))}
                    disabled={deliveriesPage === 0}
                    className="rounded-md p-1 hover:bg-muted disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-muted-foreground">
                    {deliveriesPage + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setDeliveriesPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                    disabled={deliveriesPage >= totalPages - 1}
                    className="rounded-md p-1 hover:bg-muted disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Confirm Deactivate Dialog */}
      <ConfirmDialog
        open={confirmDeactivate}
        title={courier.active ? "Desativar motoboy" : "Reativar motoboy"}
        description={
          courier.active
            ? `Desativar ${courier.full_name}? Entregas em andamento serão mantidas.`
            : `Reativar ${courier.full_name}?`
        }
        confirmLabel={courier.active ? "Desativar" : "Reativar"}
        onConfirm={handleToggleActive}
        onCancel={() => setConfirmDeactivate(false)}
        loading={toggleActive.isPending}
      />
    </div>
  );
}
