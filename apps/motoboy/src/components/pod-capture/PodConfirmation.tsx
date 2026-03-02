import { useState } from "react";
import {
  ArrowLeft,
  Send,
  CheckCircle,
  AlertCircle,
  MapPin,
  Loader2,
} from "lucide-react";

interface PodConfirmationProps {
  photoPreview: string;
  signaturePreview: string;
  orderNumber: number;
  recipientName: string;
  isUploading: boolean;
  uploadError: string | null;
  onConfirm: (lat: string, lng: string) => void;
  onBack: () => void;
}

export function PodConfirmation({
  photoPreview,
  signaturePreview,
  orderNumber,
  recipientName,
  isUploading,
  uploadError,
  onConfirm,
  onBack,
}: PodConfirmationProps) {
  const [gpsStatus, setGpsStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [gpsError, setGpsError] = useState<string | null>(null);

  const handleConfirm = () => {
    setGpsStatus("loading");
    setGpsError(null);

    if (!navigator.geolocation) {
      // Fallback: send zeros if GPS unavailable
      setGpsStatus("error");
      setGpsError("GPS nao disponivel. Enviando sem localizacao.");
      onConfirm("0", "0");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsStatus("success");
        onConfirm(
          pos.coords.latitude.toString(),
          pos.coords.longitude.toString(),
        );
      },
      () => {
        // Fallback: send zeros if permission denied
        setGpsStatus("error");
        setGpsError("Permissao de GPS negada. Enviando sem localizacao.");
        onConfirm("0", "0");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col p-4">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-foreground">
          Passo 3 de 3 — Confirmar
        </h2>
        <p className="text-sm text-muted-foreground">
          Revise os dados e confirme o envio do comprovante.
        </p>
      </div>

      {/* Order info */}
      <div className="mb-4 rounded-lg border border-border bg-card p-3">
        <p className="text-sm font-semibold text-foreground">
          Pedido #{orderNumber}
        </p>
        <p className="text-sm text-muted-foreground">
          Recebedor: {recipientName}
        </p>
      </div>

      {/* Photo preview */}
      <div className="mb-3">
        <p className="mb-1 text-xs font-medium text-muted-foreground">Foto</p>
        <div className="overflow-hidden rounded-lg border border-border">
          <img
            src={photoPreview}
            alt="Foto do comprovante"
            className="h-40 w-full object-cover"
          />
        </div>
      </div>

      {/* Signature preview */}
      <div className="mb-4">
        <p className="mb-1 text-xs font-medium text-muted-foreground">
          Assinatura
        </p>
        <div className="overflow-hidden rounded-lg border border-border bg-white p-2">
          <img
            src={signaturePreview}
            alt="Assinatura do recebedor"
            className="h-20 w-full object-contain"
          />
        </div>
      </div>

      {/* GPS status */}
      {gpsStatus === "loading" && (
        <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 animate-pulse" />
          Capturando localizacao...
        </div>
      )}
      {gpsStatus === "success" && (
        <div className="mb-3 flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="h-4 w-4" />
          Localizacao capturada
        </div>
      )}
      {gpsError && (
        <div className="mb-3 flex items-center gap-2 text-sm text-amber-600">
          <AlertCircle className="h-4 w-4" />
          {gpsError}
        </div>
      )}

      {/* Upload error */}
      {uploadError && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {uploadError}
        </div>
      )}

      {/* Upload progress */}
      {isUploading && (
        <div className="mb-3 flex items-center gap-2 text-sm text-primary">
          <Loader2 className="h-4 w-4 animate-spin" />
          Enviando comprovante...
        </div>
      )}

      <div className="mt-auto flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isUploading}
          className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-3 text-base font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isUploading}
          className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Send className="h-4 w-4" />
              Confirmar e Enviar
            </>
          )}
        </button>
      </div>
    </div>
  );
}
