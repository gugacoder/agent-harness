import { useOrderDelivery } from "@/hooks/useOrderDelivery";
import { useDeliveryProof } from "@/hooks/useDeliveryProof";
import { ProofBadge } from "./ProofBadge";

interface OrderProofBadgeProps {
  orderId: string;
}

export function OrderProofBadge({ orderId }: OrderProofBadgeProps) {
  const { data: delivery } = useOrderDelivery(orderId);
  const { data: proof } = useDeliveryProof(delivery?.id ?? null);

  if (!proof) return null;

  return <ProofBadge />;
}
