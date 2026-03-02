import { Camera } from "lucide-react";

export function ProofBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
      title="Comprovante de entrega disponível"
    >
      <Camera className="h-3 w-3" />
      POD
    </span>
  );
}
