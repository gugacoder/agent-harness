import { Camera } from "lucide-react";

export function ProofBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-cs-success/10 px-2 py-0.5 text-xs font-medium text-cs-success"
      title="Comprovante de entrega disponivel"
    >
      <Camera className="h-3 w-3" />
      POD
    </span>
  );
}
