import { useOrderDelivery } from "@/hooks/useOrderDelivery";
import { useDeliveryProof } from "@/hooks/useDeliveryProof";
import { DeliveryProofViewer } from "./DeliveryProofViewer";
import { Skeleton } from "@/components/ui/Skeleton";

interface OrderProofSectionProps {
  orderId: string;
}

export function OrderProofSection({ orderId }: OrderProofSectionProps) {
  const { data: delivery, isLoading: deliveryLoading } =
    useOrderDelivery(orderId);
  const { data: proof, isLoading: proofLoading } = useDeliveryProof(
    delivery?.id ?? null,
  );

  if (deliveryLoading || proofLoading) {
    return <Skeleton className="h-48" />;
  }

  if (!proof) {
    return null;
  }

  return <DeliveryProofViewer proof={proof} />;
}
