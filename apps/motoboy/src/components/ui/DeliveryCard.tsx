import { MapPin, User, Phone, FileText } from "lucide-react";
import { DeliveryStatusBadge } from "./DeliveryStatusBadge";
import { ActionButton } from "./ActionButton";
import { NavigateButton } from "@/components/delivery/NavigateButton";
import { NEXT_STATUS, type ActiveDeliveryData } from "@/types/delivery";

const NAVIGATE_STATUSES = new Set(["accepted", "picked_up", "in_transit"]);

interface DeliveryCardProps {
  data: ActiveDeliveryData;
  onStatusUpdate: (orderId: string, status: string) => void;
  isUpdating: boolean;
}

export function DeliveryCard({
  data,
  onStatusUpdate,
  isUpdating,
}: DeliveryCardProps) {
  const { delivery, order } = data;
  const nextAction = NEXT_STATUS[delivery.status] ?? null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">
          Entrega #{order.order_number}
        </h2>
        <DeliveryStatusBadge status={delivery.status} />
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-xs font-medium text-muted-foreground">Coleta</p>
            <p className="text-sm">{order.pickup_address}</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div>
            <p className="text-xs font-medium text-muted-foreground">Entrega</p>
            <p className="text-sm">{order.delivery_address}</p>
          </div>
        </div>

        {NAVIGATE_STATUSES.has(delivery.status) && (
          <NavigateButton
            lat={Number(order.delivery_lat)}
            lng={Number(order.delivery_lng)}
            address={order.delivery_address}
          />
        )}

        <div className="flex items-start gap-2">
          <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Destinatario
            </p>
            <p className="text-sm">{order.recipient_name}</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Telefone
            </p>
            <p className="text-sm">{order.recipient_phone}</p>
          </div>
        </div>

        {order.notes && (
          <div className="flex items-start gap-2">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Observacoes
              </p>
              <p className="text-sm">{order.notes}</p>
            </div>
          </div>
        )}
      </div>

      {nextAction && (
        <div className="mt-5">
          <ActionButton
            label={nextAction.label}
            onClick={() => onStatusUpdate(order.id, nextAction.status)}
            loading={isUpdating}
          />
        </div>
      )}
    </div>
  );
}
