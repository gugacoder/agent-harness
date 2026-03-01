import { Package } from "lucide-react";
import { useActiveDeliveryContext } from "@/contexts/ActiveDeliveryContext";
import { DeliveryNotification } from "@/components/ui/DeliveryNotification";
import { DeliveryCard } from "@/components/ui/DeliveryCard";
import { DeliveryTimeline } from "@/components/ui/DeliveryTimeline";
import { EmptyState } from "@/components/ui/EmptyState";

export function EntregasPage() {
  const {
    activeDelivery,
    pendingDelivery,
    pendingOrder,
    events,
    isLoading,
    acceptDelivery,
    rejectDelivery,
    updateStatus,
    isAccepting,
    isRejecting,
    isUpdatingStatus,
  } = useActiveDeliveryContext();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Pending delivery notification */}
      {pendingDelivery && pendingOrder && (
        <DeliveryNotification
          order={pendingOrder}
          onAccept={() => acceptDelivery(pendingDelivery.delivery_id)}
          onReject={() => rejectDelivery(pendingDelivery.delivery_id)}
          isAccepting={isAccepting}
          isRejecting={isRejecting}
        />
      )}

      {/* Active delivery card + timeline */}
      {activeDelivery && (
        <>
          <DeliveryCard
            data={activeDelivery}
            onStatusUpdate={(orderId, status) =>
              updateStatus({ orderId, status })
            }
            isUpdating={isUpdatingStatus}
          />
          {events.length > 0 && <DeliveryTimeline events={events} />}
        </>
      )}

      {/* Empty state */}
      {!activeDelivery && !pendingDelivery && (
        <EmptyState
          icon={Package}
          title="Nenhuma entrega no momento"
          description="Mantenha-se disponivel para receber novas entregas."
        />
      )}
    </div>
  );
}
