import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Eraser, Check, ArrowLeft } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface SignatureCaptureProps {
  onCapture: (signature: Blob, previewUrl: string) => void;
  onBack: () => void;
}

export function SignatureCapture({ onCapture, onBack }: SignatureCaptureProps) {
  const sigRef = useRef<SignatureCanvas | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const { resolved } = useTheme();

  const handleClear = () => {
    sigRef.current?.clear();
    setIsEmpty(true);
  };

  const handleConfirm = () => {
    if (!sigRef.current || sigRef.current.isEmpty()) return;

    sigRef.current.getTrimmedCanvas().toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          onCapture(blob, url);
        }
      },
      "image/png",
      1.0,
    );
  };

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col p-4">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-foreground">
          Passo 2 de 3 — Assinatura
        </h2>
        <p className="text-sm text-muted-foreground">
          Solicite a assinatura do recebedor no campo abaixo.
        </p>
      </div>

      <div className="flex-1">
        <div className="rounded-lg border-2 border-dashed border-border bg-background">
          <SignatureCanvas
            ref={sigRef}
            canvasProps={{
              className: "w-full touch-none",
              style: { width: "100%", height: 250 },
            }}
            onBegin={() => setIsEmpty(false)}
            penColor={resolved === "dark" ? "#ffffff" : "#000000"}
            minWidth={1.5}
            maxWidth={3}
          />
        </div>

        <button
          type="button"
          onClick={handleClear}
          className="mt-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <Eraser className="h-3.5 w-3.5" />
          Limpar
        </button>
      </div>

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-3 text-base font-semibold text-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isEmpty}
          className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
          Proximo
        </button>
      </div>
    </div>
  );
}
