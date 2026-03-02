import { useState, useCallback } from "react";
import { Package, Camera, SkipForward } from "lucide-react";
import { useActiveDeliveryContext } from "@/contexts/ActiveDeliveryContext";
import { useCompanyConfig } from "@/hooks/useCompanyConfig";
import { DeliveryPreview } from "@/components/delivery/DeliveryPreview";
import { DeliveryCard } from "@/components/ui/DeliveryCard";
import { DeliveryTimeline } from "@/components/ui/DeliveryTimeline";
import { EmptyState } from "@/components/ui/EmptyState";
import { PodCaptureFlow } from "@/components/pod-capture/PodCaptureFlow";

type PodState =
  | { mode: "none" }
  | { mode: "choice"; orderId: string }
  | { mode: "capturing"; orderId: string };

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

  const { data: companyConfig } = useCompanyConfig();
  const [podState, setPodState] = useState<PodState>({ mode: "none" });

  const handleStatusUpdate = useCallback(
    (orderId: string, status: string) => {
      // Only intercept "delivered" transition
      if (status !== "delivered") {
        updateStatus({ orderId, status });
        return;
      }

      const podRequired = companyConfig?.pod_required ?? false;

      if (podRequired) {
        // POD mandatory — go straight to capture
        setPodState({ mode: "capturing", orderId });
      } else {
        // POD optional — show choice dialog
        setPodState({ mode: "choice", orderId });
      }
    },
    [updateStatus, companyConfig],
  );

  const handlePodComplete = useCallback(() => {
    if (podState.mode === "none") return;
    const { orderId } = podState;
    setPodState({ mode: "none" });
    updateStatus({ orderId, status: "delivered" });
  }, [podState, updateStatus]);

  const handlePodCancel = useCallback(() => {
    setPodState({ mode: "none" });
  }, []);

  const handleSkipPod = useCallback(() => {
    if (podState.mode !== "choice") return;
    const { orderId } = podState;
    setPodState({ mode: "none" });
    updateStatus({ orderId, status: "delivered" });
  }, [podState, updateStatus]);

  const handleCapturePod = useCallback(() => {
    if (podState.mode !== "choice") return;
    setPodState({ mode: "capturing", orderId: podState.orderId });
  }, [podState]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Full-screen POD capture flow
  if (podState.mode === "capturing" && activeDelivery) {
    return (
      <PodCaptureFlow
        deliveryId={activeDelivery.delivery.id}
        orderNumber={activeDelivery.order.order_number}
        recipientName={activeDelivery.order.recipient_name}
        onComplete={handlePodComplete}
        onCancel={handlePodCancel}
      />
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Pending delivery preview */}
      {pendingDelivery && pendingOrder && (
        <DeliveryPreview
          delivery={pendingDelivery}
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
            onStatusUpdate={handleStatusUpdate}
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

      {/* POD choice dialog (optional POD) */}
      {podState.mode === "choice" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4">
          <div className="w-full max-w-[480px] rounded-t-xl bg-card p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-foreground">
              Comprovante de entrega
            </h3>
            <p className="mb-5 text-sm text-muted-foreground">
              Deseja registrar um comprovante de entrega com foto e assinatura?
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleCapturePod}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Camera className="h-5 w-5" />
                Capturar comprovante
              </button>
              <button
                type="button"
                onClick={handleSkipPod}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-6 py-3 text-base font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <SkipForward className="h-5 w-5" />
                Pular
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
