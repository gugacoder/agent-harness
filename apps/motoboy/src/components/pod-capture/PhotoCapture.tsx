import { useState, useRef, useCallback } from "react";
import { Camera, RotateCcw, Check, AlertCircle } from "lucide-react";
import imageCompression from "browser-image-compression";

interface PhotoCaptureProps {
  onCapture: (photo: Blob, previewUrl: string) => void;
  onBack: () => void;
}

export function PhotoCapture({ onCapture, onBack }: PhotoCaptureProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const blobRef = useRef<Blob | null>(null);

  const handleCapture = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setError(null);
      setCompressing(true);

      try {
        const compressed = await imageCompression(file, {
          maxWidthOrHeight: 1280,
          maxSizeMB: 2,
          initialQuality: 0.8,
          useWebWorker: true,
          fileType: "image/jpeg",
        });

        const url = URL.createObjectURL(compressed);
        setPreview(url);
        blobRef.current = compressed;
      } catch {
        setError("Erro ao processar a foto. Tente novamente.");
      } finally {
        setCompressing(false);
      }
    },
    [],
  );

  const handleRetake = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    blobRef.current = null;
    setError(null);
    // Reset input so same file can be re-selected
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleConfirm = () => {
    if (blobRef.current && preview) {
      onCapture(blobRef.current, preview);
    }
  };

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col p-4">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-foreground">
          Passo 1 de 3 — Foto
        </h2>
        <p className="text-sm text-muted-foreground">
          Tire uma foto como comprovante da entrega.
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {!preview ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <label className="flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
            {compressing ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <>
                <Camera className="h-5 w-5" />
                Tirar Foto
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCapture}
              className="hidden"
              disabled={compressing}
            />
          </label>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4">
          <div className="overflow-hidden rounded-lg border border-border">
            <img
              src={preview}
              alt="Preview da foto"
              className="h-auto w-full object-contain"
            />
          </div>

          <div className="mt-auto flex gap-3">
            <button
              type="button"
              onClick={handleRetake}
              className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-3 text-base font-semibold text-foreground transition-colors hover:bg-muted"
            >
              <RotateCcw className="h-4 w-4" />
              Refazer
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Check className="h-4 w-4" />
              Proximo
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onBack}
        className="mt-4 w-full py-2 text-center text-sm text-muted-foreground hover:text-foreground"
      >
        Cancelar
      </button>
    </div>
  );
}
