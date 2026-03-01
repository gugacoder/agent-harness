import { useState } from "react";
import { Camera, PenTool, MapPin, Clock, X } from "lucide-react";
import type { DeliveryProof } from "@/types/api";

interface DeliveryProofViewerProps {
  proof: DeliveryProof;
}

function PhotoModal({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background shadow-md hover:bg-muted"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
        <img
          src={src}
          alt={alt}
          className="max-h-[85vh] max-w-[85vw] rounded-lg object-contain"
        />
      </div>
    </div>
  );
}

export function DeliveryProofViewer({ proof }: DeliveryProofViewerProps) {
  const [enlargedImage, setEnlargedImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const formatCoords = (lat: string, lng: string) =>
    `${parseFloat(lat).toFixed(6)}, ${parseFloat(lng).toFixed(6)}`;

  return (
    <>
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="border-b px-4 py-3">
          <h3 className="font-semibold">Comprovante de Entrega</h3>
        </div>
        <div className="space-y-4 p-4">
          {/* Photo */}
          <div>
            <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Camera className="h-3.5 w-3.5" />
              <span>Foto</span>
            </div>
            <button
              onClick={() =>
                setEnlargedImage({
                  src: proof.photo_url,
                  alt: "Foto do comprovante",
                })
              }
              className="overflow-hidden rounded-md border transition-opacity hover:opacity-80"
            >
              <img
                src={proof.photo_url}
                alt="Foto do comprovante de entrega"
                className="h-40 w-full object-cover"
              />
            </button>
            <p className="mt-1 text-xs text-muted-foreground">
              Clique para ampliar
            </p>
          </div>

          {/* Signature */}
          <div>
            <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <PenTool className="h-3.5 w-3.5" />
              <span>Assinatura</span>
            </div>
            <button
              onClick={() =>
                setEnlargedImage({
                  src: proof.signature_url,
                  alt: "Assinatura digital",
                })
              }
              className="overflow-hidden rounded-md border bg-white transition-opacity hover:opacity-80"
            >
              <img
                src={proof.signature_url}
                alt="Assinatura digital"
                className="h-24 w-full object-contain p-2"
              />
            </button>
          </div>

          {/* GPS Coordinates */}
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Coordenadas GPS</p>
              <p className="text-sm font-mono">
                {formatCoords(proof.lat, proof.lng)}
              </p>
            </div>
          </div>

          {/* Capture Time */}
          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">
                Horario da Captura
              </p>
              <p className="text-sm">{formatDate(proof.captured_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {enlargedImage && (
        <PhotoModal
          src={enlargedImage.src}
          alt={enlargedImage.alt}
          onClose={() => setEnlargedImage(null)}
        />
      )}
    </>
  );
}
