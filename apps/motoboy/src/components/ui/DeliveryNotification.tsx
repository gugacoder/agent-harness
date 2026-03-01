import { MapPin, FileText } from "lucide-react";
import { ActionButton } from "./ActionButton";
import type { Order } from "@/types/delivery";

interface DeliveryNotificationProps {
  order: Order;
  onAccept: () => void;
  onReject: () => void;
  isAccepting: boolean;
  isRejecting: boolean;
}

export function DeliveryNotification({
  order,
  onAccept,
  onReject,
  isAccepting,
  isRejecting,
}: DeliveryNotificationProps) {
  const isLoading = isAccepting || isRejecting;

  return (
    <div className="mx-auto w-full max-w-lg animate-in fade-in slide-in-from-top-4 rounded-xl border-2 border-primary bg-card p-4 shadow-lg">
      <h2 className="mb-4 text-center text-lg font-bold text-primary">
        Nova Entrega!
      </h2>

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

      <div className="mt-5 flex gap-3">
        <ActionButton
          label="Recusar"
          variant="destructive"
          onClick={onReject}
          loading={isRejecting}
          className="flex-1"
        />
        <ActionButton
          label="Aceitar"
          variant="primary"
          onClick={onAccept}
          loading={isAccepting}
          className="flex-1"
        />
      </div>
    </div>
  );
}
