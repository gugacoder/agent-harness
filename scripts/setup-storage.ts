/**
 * Setup script for Supabase Storage buckets.
 * Creates the delivery-proofs bucket if it doesn't exist.
 *
 * Usage: npx tsx scripts/setup-storage.ts
 *
 * Requires env vars: SUPABASE_PUBLIC_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { ensureDeliveryProofsBucket } from "../apps/backbone/src/services/storage.service.js";

async function main() {
  console.log("Setting up Supabase Storage buckets...");

  try {
    await ensureDeliveryProofsBucket();
    console.log("✓ Bucket 'delivery-proofs' is ready");
  } catch (err) {
    console.error("✗ Failed to setup storage:", err);
    process.exit(1);
  }
}

main();
