import { eq, and } from "drizzle-orm";
import { db } from "../db.js";
import {
  deliveries,
  deliveryProofs,
  couriers,
} from "../../db/schema/index.js";
import {
  uploadDeliveryProof,
  getDeliveryProofSignedUrl,
} from "./storage.service.js";

const ADEQUATE_STATUSES = ["picked_up", "in_transit", "delivered"];

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

interface UploadProofParams {
  deliveryId: string;
  companyId: string;
  userId: string; // JWT sub (profile_id)
  photoBuffer: Buffer | Uint8Array;
  photoContentType: string;
  signatureBuffer: Buffer | Uint8Array;
  signatureContentType: string;
  lat: string;
  lng: string;
  capturedAt: string;
}

export async function uploadProof(params: UploadProofParams) {
  const {
    deliveryId,
    companyId,
    userId,
    photoBuffer,
    photoContentType,
    signatureBuffer,
    signatureContentType,
    lat,
    lng,
    capturedAt,
  } = params;

  // Find courier by profile_id (JWT sub)
  const [courier] = await db
    .select({ id: couriers.id })
    .from(couriers)
    .where(
      and(eq(couriers.profile_id, userId), eq(couriers.company_id, companyId))
    );

  if (!courier) {
    throw new Error("Courier profile not found");
  }

  // Find delivery and validate ownership + status
  const [delivery] = await db
    .select({
      id: deliveries.id,
      courier_id: deliveries.courier_id,
      company_id: deliveries.company_id,
      status: deliveries.status,
    })
    .from(deliveries)
    .where(
      and(eq(deliveries.id, deliveryId), eq(deliveries.company_id, companyId))
    );

  if (!delivery) {
    throw new Error("Delivery not found");
  }

  if (delivery.courier_id !== courier.id) {
    throw new Error("Delivery does not belong to this courier");
  }

  if (!ADEQUATE_STATUSES.includes(delivery.status)) {
    throw new Error(
      `Delivery status '${delivery.status}' is not adequate for proof upload`
    );
  }

  // Check if proof already exists for this delivery
  const [existingProof] = await db
    .select({ id: deliveryProofs.id })
    .from(deliveryProofs)
    .where(eq(deliveryProofs.delivery_id, deliveryId));

  if (existingProof) {
    throw new Error("Proof already exists for this delivery");
  }

  // Upload photo and signature to Supabase Storage
  const photoExt = MIME_TO_EXT[photoContentType] || "jpg";
  const signatureExt = MIME_TO_EXT[signatureContentType] || "png";

  const photoPath = `${companyId}/${deliveryId}/photo.${photoExt}`;
  const signaturePath = `${companyId}/${deliveryId}/signature.${signatureExt}`;

  const [storedPhotoPath, storedSignaturePath] = await Promise.all([
    uploadDeliveryProof(photoPath, photoBuffer, photoContentType),
    uploadDeliveryProof(signaturePath, signatureBuffer, signatureContentType),
  ]);

  // Insert delivery proof record
  const [proof] = await db
    .insert(deliveryProofs)
    .values({
      delivery_id: deliveryId,
      company_id: companyId,
      courier_id: courier.id,
      photo_url: storedPhotoPath,
      signature_url: storedSignaturePath,
      lat,
      lng,
      captured_at: capturedAt,
    })
    .returning();

  // Generate signed URLs for the response
  const [photoSignedUrl, signatureSignedUrl] = await Promise.all([
    getDeliveryProofSignedUrl(proof.photo_url),
    getDeliveryProofSignedUrl(proof.signature_url),
  ]);

  return {
    id: proof.id,
    delivery_id: proof.delivery_id,
    photo_url: photoSignedUrl,
    signature_url: signatureSignedUrl,
    lat: proof.lat,
    lng: proof.lng,
    captured_at: proof.captured_at,
    created_at: proof.created_at,
  };
}

interface GetProofParams {
  deliveryId: string;
  companyId: string;
}

export async function getProof(params: GetProofParams) {
  const { deliveryId, companyId } = params;

  const [proof] = await db
    .select()
    .from(deliveryProofs)
    .where(
      and(
        eq(deliveryProofs.delivery_id, deliveryId),
        eq(deliveryProofs.company_id, companyId)
      )
    );

  if (!proof) {
    return null;
  }

  // Generate signed URLs for photo and signature
  const [photoSignedUrl, signatureSignedUrl] = await Promise.all([
    getDeliveryProofSignedUrl(proof.photo_url),
    getDeliveryProofSignedUrl(proof.signature_url),
  ]);

  return {
    id: proof.id,
    delivery_id: proof.delivery_id,
    photo_url: photoSignedUrl,
    signature_url: signatureSignedUrl,
    lat: proof.lat,
    lng: proof.lng,
    captured_at: proof.captured_at,
    created_at: proof.created_at,
  };
}
