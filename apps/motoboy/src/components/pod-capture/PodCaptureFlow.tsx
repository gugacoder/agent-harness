import { useState, useCallback, useRef } from "react";
import { PhotoCapture } from "./PhotoCapture";
import { SignatureCapture } from "./SignatureCapture";
import { PodConfirmation } from "./PodConfirmation";
import { usePodCapture } from "@/hooks/usePodCapture";

type Step = "photo" | "signature" | "confirm";

interface PodCaptureFlowProps {
  deliveryId: string;
  orderNumber: number;
  recipientName: string;
  onComplete: () => void;
  onCancel: () => void;
}

export function PodCaptureFlow({
  deliveryId,
  orderNumber,
  recipientName,
  onComplete,
  onCancel,
}: PodCaptureFlowProps) {
  const [step, setStep] = useState<Step>("photo");
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Store captured data across steps
  const photoRef = useRef<{ blob: Blob; url: string } | null>(null);
  const signatureRef = useRef<{ blob: Blob; url: string } | null>(null);

  const podCapture = usePodCapture();

  const handlePhotoCapture = useCallback((blob: Blob, url: string) => {
    photoRef.current = { blob, url };
    setStep("signature");
  }, []);

  const handleSignatureCapture = useCallback((blob: Blob, url: string) => {
    signatureRef.current = { blob, url };
    setStep("confirm");
  }, []);

  const handleConfirm = useCallback(
    async (lat: string, lng: string) => {
      if (!photoRef.current || !signatureRef.current) return;

      setUploadError(null);

      try {
        await podCapture.mutateAsync({
          deliveryId,
          photo: photoRef.current.blob,
          signature: signatureRef.current.blob,
          lat,
          lng,
          capturedAt: new Date().toISOString(),
        });
        onComplete();
      } catch {
        setUploadError("Erro ao enviar comprovante. Tente novamente.");
      }
    },
    [deliveryId, podCapture, onComplete],
  );

  const handleBackFromSignature = () => setStep("photo");
  const handleBackFromConfirm = () => setStep("signature");

  switch (step) {
    case "photo":
      return <PhotoCapture onCapture={handlePhotoCapture} onBack={onCancel} />;

    case "signature":
      return (
        <SignatureCapture
          onCapture={handleSignatureCapture}
          onBack={handleBackFromSignature}
        />
      );

    case "confirm":
      return (
        <PodConfirmation
          photoPreview={photoRef.current!.url}
          signaturePreview={signatureRef.current!.url}
          orderNumber={orderNumber}
          recipientName={recipientName}
          isUploading={podCapture.isPending}
          uploadError={uploadError}
          onConfirm={handleConfirm}
          onBack={handleBackFromConfirm}
        />
      );
  }
}
