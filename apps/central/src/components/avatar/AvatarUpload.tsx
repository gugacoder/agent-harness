import { useCallback, useRef, useState } from "react";
import { AvatarDisplay } from "./AvatarDisplay";
import { AvatarCropDialog } from "./AvatarCropDialog";
import { processImage } from "../../lib/image-pipeline";
import { supabase } from "../../lib/supabase";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB pre-crop
const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
];

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  userName: string;
  userId: string;
  onUploadComplete: (url: string) => void;
  size?: "sm" | "md" | "lg" | "xl";
}

export function AvatarUpload({
  currentAvatarUrl,
  userName,
  userId,
  onUploadComplete,
  size = "xl",
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      const file = e.target.files?.[0];
      if (!file) return;

      // Reset input so the same file can be selected again
      e.target.value = "";

      // Validate format
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Formato de imagem não suportado.");
        return;
      }

      // Validate size
      if (file.size > MAX_FILE_SIZE) {
        setError("Imagem muito grande. Máximo 10MB.");
        return;
      }

      // Read as data URL for crop dialog
      const reader = new FileReader();
      reader.onload = () => {
        setCropImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const handleCropConfirm = useCallback(
    async (croppedBlob: Blob) => {
      setUploading(true);
      setError(null);
      try {
        // Compress via processImage
        const file = new File([croppedBlob], "avatar.webp", {
          type: "image/webp",
        });
        const compressed = await processImage(file);

        // Upload to Supabase Storage
        const path = `avatars/${userId}.webp`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, compressed, {
            contentType: "image/webp",
            upsert: true,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(path);

        // Append cache-bust to avoid stale CDN cache
        const url = `${publicUrl}?t=${Date.now()}`;
        onUploadComplete(url);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao enviar imagem."
        );
      } finally {
        setUploading(false);
        setCropImage(null);
      }
    },
    [userId, onUploadComplete]
  );

  const handleCropCancel = useCallback(() => {
    setCropImage(null);
  }, []);

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <AvatarDisplay
        src={currentAvatarUrl}
        name={userName}
        size={size}
        editable={!uploading}
        onEdit={handleEdit}
      />

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {uploading && (
        <span className="text-xs text-muted-foreground">Enviando...</span>
      )}

      {error && <span className="text-xs text-destructive">{error}</span>}

      {cropImage && (
        <AvatarCropDialog
          open
          image={cropImage}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}
