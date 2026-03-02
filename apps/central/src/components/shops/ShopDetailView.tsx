import { useState, useMemo } from "react";
import {
  ChevronLeft,
  Phone,
  MapPin,
  Store,
  User,
  Power,
  Package,
  DollarSign,
  Calendar,
  Clock,
  Edit,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  useShopDetail,
  useShopOrders,
  useShopFinancialSummary,
  useToggleShopStatus,
} from "@/hooks/useShopDetail";
import { OrderStatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { OrderStatus } from "@/types/api";

interface ShopDetailViewProps {
  shopId: string;
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

function formatCurrency(value: string) {
  const num = parseFloat(value);
  if (isNaN(num)) return "R$ 0,00";
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ShopDetailView({ shopId, onBack, onEdit }: ShopDetailViewProps) {
  const { data: shop, isLoading: shopLoading } = useShopDetail(shopId);
  const [ordersPage, setOrdersPage] = useState(0);
  const { data: ordersData, isLoading: ordersLoading } = useShopOrders(shopId, {
    limit: 10,
    offset: ordersPage * 10,
  });
  const { data: financial, isLoading: financialLoading } =
    useShopFinancialSummary(shopId);

  const toggleStatus = useToggleShopStatus();
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const hasValidCoords = useMemo(() => {
    if (!shop) return false;
    const lat = parseFloat(shop.lat);
    const lng = parseFloat(shop.lng);
    return !isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0);
  }, [shop]);

  const totalPages = useMemo(() => {
    if (!ordersData) return 0;
    return Math.ceil(ordersData.total / 10);
  }, [ordersData]);

  if (shopLoading) {
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

  if (!shop) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Voltar
        </button>
        <EmptyState icon={Store} title="Loja não encontrada" />
      </div>
    );
  }

  const handleToggleStatus = () => {
    toggleStatus.mutate(
      { shopId: shop.id, active: !shop.active },
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
          <div>
            <h2 className="text-xl font-bold">{shop.trade_name}</h2>
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
              shop.active
                ? "border border-red-200 text-red-700 hover:bg-red-50"
                : "border border-green-200 text-green-700 hover:bg-green-50"
            }`}
          >
            {shop.active ? "Desativar" : "Reativar"}
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
            {shop.contact_name && (
              <div className="flex items-start gap-2">
                <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Contato</p>
                  <p className="text-sm">{shop.contact_name}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Map Card */}
        {hasValidCoords && (
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="border-b px-4 py-3">
              <h3 className="font-semibold">Localização</h3>
            </div>
            <div className="h-[200px] overflow-hidden rounded-b-lg">
              <MapContainer
                center={[parseFloat(shop.lat), parseFloat(shop.lng)]}
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
                  position={[parseFloat(shop.lat), parseFloat(shop.lng)]}
                  icon={BLUE_ICON}
                />
              </MapContainer>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Package className="h-4 w-4" />
            <span className="text-xs">Total Pedidos</span>
          </div>
          <p className="mt-1 text-2xl font-bold">{shop.total_orders}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs">Total Faturado</span>
          </div>
          {financialLoading ? (
            <Skeleton className="mt-1 h-8 w-24" />
          ) : (
            <p className="mt-1 text-2xl font-bold">
              {formatCurrency(financial?.total_invoiced ?? "0")}
            </p>
          )}
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-xs">Pendente</span>
          </div>
          {financialLoading ? (
            <Skeleton className="mt-1 h-8 w-24" />
          ) : (
            <p className="mt-1 text-2xl font-bold">
              {formatCurrency(financial?.total_pending ?? "0")}
            </p>
          )}
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-xs">Último Pagamento</span>
          </div>
          {financialLoading ? (
            <Skeleton className="mt-1 h-8 w-24" />
          ) : (
            <p className="mt-1 text-lg font-bold">
              {financial?.last_payment_date
                ? formatDate(financial.last_payment_date)
                : "—"}
            </p>
          )}
        </div>
      </div>

      {/* Order History */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="border-b px-4 py-3">
          <h3 className="font-semibold">Histórico de Pedidos (últimos 30 dias)</h3>
        </div>
        <div className="p-4">
          {ordersLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : !ordersData || ordersData.data.length === 0 ? (
            <EmptyState icon={Package} title="Nenhum pedido neste período" />
          ) : (
            <>
              <ul className="space-y-2">
                {ordersData.data.map((order) => (
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
                      <OrderStatusBadge status={order.status as OrderStatus} />
                      <span className="text-xs text-muted-foreground">
                        {formatDate(order.created_at)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
              {totalPages > 1 && (
                <div className="mt-3 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setOrdersPage((p) => Math.max(0, p - 1))}
                    disabled={ordersPage === 0}
                    className="rounded-md p-1 hover:bg-muted disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-muted-foreground">
                    {ordersPage + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setOrdersPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                    disabled={ordersPage >= totalPages - 1}
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
        title={shop.active ? "Desativar loja" : "Reativar loja"}
        description={
          shop.active
            ? `Desativar loja ${shop.trade_name}? Pedidos em andamento serão mantidos.`
            : `Reativar loja ${shop.trade_name}?`
        }
        confirmLabel={shop.active ? "Desativar" : "Reativar"}
        onConfirm={handleToggleStatus}
        onCancel={() => setConfirmDeactivate(false)}
        loading={toggleStatus.isPending}
      />
    </div>
  );
}
