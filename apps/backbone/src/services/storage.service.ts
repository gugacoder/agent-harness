import { supabaseAdmin } from "../lib/supabase.js";

const DELIVERY_PROOFS_BUCKET = "delivery-proofs";
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Ensures the delivery-proofs bucket exists in Supabase Storage.
 * Creates it if missing; no-ops if it already exists.
 */
export async function ensureDeliveryProofsBucket(): Promise<void> {
  const { data: existing } = await supabaseAdmin.storage.getBucket(
    DELIVERY_PROOFS_BUCKET
  );

  if (existing) return;

  const { error } = await supabaseAdmin.storage.createBucket(
    DELIVERY_PROOFS_BUCKET,
    {
      public: false,
      fileSizeLimit: MAX_FILE_SIZE,
      allowedMimeTypes: ALLOWED_MIME_TYPES,
    }
  );

  if (error) {
    throw new Error(`Failed to create bucket '${DELIVERY_PROOFS_BUCKET}': ${error.message}`);
  }
}

/**
 * Uploads a file to the delivery-proofs bucket.
 * Returns the storage path of the uploaded file.
 */
export async function uploadDeliveryProof(
  path: string,
  file: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(DELIVERY_PROOFS_BUCKET)
    .upload(path, file, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload to '${path}': ${error.message}`);
  }

  return data.path;
}

/**
 * Generates a signed URL for a file in the delivery-proofs bucket.
 * Default expiry: 1 hour.
 */
export async function getDeliveryProofSignedUrl(
  path: string,
  expiresIn = 3600
): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(DELIVERY_PROOFS_BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(`Failed to create signed URL for '${path}': ${error.message}`);
  }

  return data.signedUrl;
}
