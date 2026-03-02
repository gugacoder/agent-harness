import imageCompression from "browser-image-compression";
import heic2any from "heic2any";

export async function processImage(file: File): Promise<Blob> {
  let blob: Blob = file;

  // HEIC/HEIF → JPEG
  if (file.type === "image/heic" || file.type === "image/heif") {
    blob = (await heic2any({ blob: file, toType: "image/jpeg" })) as Blob;
  }

  // Compress to WebP, max 500KB, 512x512
  const compressed = await imageCompression(blob as File, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 512,
    fileType: "image/webp",
  });

  return compressed;
}
