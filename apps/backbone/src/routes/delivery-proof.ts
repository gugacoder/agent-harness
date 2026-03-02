import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AppType } from "../types.js";
import { authMiddleware } from "../middleware/auth.js";
import { companyMiddleware } from "../middleware/company.js";
import { requireRole } from "../middleware/role.js";
import { uploadProof, getProof } from "../services/pod.service.js";

// --- Schemas ---

const DeliveryProofResponseSchema = z.object({
  id: z.string().uuid(),
  delivery_id: z.string().uuid(),
  photo_url: z.string(),
  signature_url: z.string(),
  lat: z.string(),
  lng: z.string(),
  captured_at: z.string(),
  created_at: z.string(),
});

const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number().int(),
});

const DeliveryIdParamSchema = z.object({
  id: z.string().uuid(),
});

// --- Router ---

const deliveryProofRouter = new OpenAPIHono<AppType>({
  defaultHook: (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: "Bad Request",
          message: "Validation failed",
          statusCode: 400,
          details: result.error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        },
        400
      );
    }
  },
});

deliveryProofRouter.use("/deliveries/*", authMiddleware);
deliveryProofRouter.use("/deliveries/*", companyMiddleware);
deliveryProofRouter.use("/deliveries/*", requireRole("courier", "super_admin"));

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

// --- POST /api/deliveries/:id/proof ---

const uploadProofRoute = createRoute({
  method: "post",
  path: "/deliveries/{id}/proof",
  tags: ["Delivery Proof"],
  summary: "Upload proof of delivery",
  description:
    "Upload photo and signature as proof of delivery. Restricted to courier role.",
  request: {
    params: DeliveryIdParamSchema,
    body: {
      content: {
        "multipart/form-data": {
          schema: z.object({
            photo: z.any(),
            signature: z.any(),
            lat: z.string(),
            lng: z.string(),
            captured_at: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": { schema: DeliveryProofResponseSchema },
      },
      description: "Proof of delivery uploaded successfully",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Invalid request or file validation failed",
    },
    403: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Access denied — not a courier or delivery does not belong to courier",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Delivery not found",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

deliveryProofRouter.openapi(uploadProofRoute, async (c) => {
  const { id: deliveryId } = c.req.valid("param");
  const user = c.get("user");
  const companyId = c.get("companyId");

  // Auth: upload restricted to courier role
  if (user.role !== "courier") {
    return c.json(
      {
        error: "Forbidden",
        message: "Only couriers can upload delivery proofs",
        statusCode: 403,
      },
      403
    );
  }

  // Parse multipart form data
  const body = await c.req.parseBody();

  const photo = body["photo"];
  const signature = body["signature"];
  const lat = body["lat"];
  const lng = body["lng"];
  const capturedAt = body["captured_at"];

  // Validate required fields
  if (!photo || !(photo instanceof File)) {
    return c.json(
      {
        error: "Bad Request",
        message: "Missing or invalid photo file",
        statusCode: 400,
      },
      400
    );
  }

  if (!signature || !(signature instanceof File)) {
    return c.json(
      {
        error: "Bad Request",
        message: "Missing or invalid signature file",
        statusCode: 400,
      },
      400
    );
  }

  if (typeof lat !== "string" || typeof lng !== "string" || typeof capturedAt !== "string") {
    return c.json(
      {
        error: "Bad Request",
        message: "Missing required fields: lat, lng, captured_at",
        statusCode: 400,
      },
      400
    );
  }

  // Validate file sizes (max 2MB each)
  if (photo.size > MAX_FILE_SIZE) {
    return c.json(
      {
        error: "Bad Request",
        message: "Photo file exceeds maximum size of 2MB",
        statusCode: 400,
      },
      400
    );
  }

  if (signature.size > MAX_FILE_SIZE) {
    return c.json(
      {
        error: "Bad Request",
        message: "Signature file exceeds maximum size of 2MB",
        statusCode: 400,
      },
      400
    );
  }

  // Validate MIME types
  if (!ALLOWED_MIME_TYPES.includes(photo.type)) {
    return c.json(
      {
        error: "Bad Request",
        message: `Invalid photo type: ${photo.type}. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`,
        statusCode: 400,
      },
      400
    );
  }

  if (!ALLOWED_MIME_TYPES.includes(signature.type)) {
    return c.json(
      {
        error: "Bad Request",
        message: `Invalid signature type: ${signature.type}. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`,
        statusCode: 400,
      },
      400
    );
  }

  // Convert File to buffer
  const photoBuffer = new Uint8Array(await photo.arrayBuffer());
  const signatureBuffer = new Uint8Array(await signature.arrayBuffer());

  try {
    const result = await uploadProof({
      deliveryId,
      companyId,
      userId: user.id,
      photoBuffer,
      photoContentType: photo.type,
      signatureBuffer,
      signatureContentType: signature.type,
      lat,
      lng,
      capturedAt,
    });

    return c.json(result, 201);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Cannot upload proof";

    if (message.includes("not found")) {
      return c.json(
        { error: "Not Found", message, statusCode: 404 },
        404
      );
    }

    if (
      message.includes("does not belong") ||
      message.includes("not adequate") ||
      message.includes("Courier profile not found")
    ) {
      return c.json(
        { error: "Forbidden", message, statusCode: 403 },
        403
      );
    }

    return c.json(
      { error: "Bad Request", message, statusCode: 400 },
      400
    );
  }
});

// --- GET /api/deliveries/:id/proof ---

const getProofRoute = createRoute({
  method: "get",
  path: "/deliveries/{id}/proof",
  tags: ["Delivery Proof"],
  summary: "Get proof of delivery",
  description:
    "Get proof of delivery data including signed URLs for photo and signature. Accessible to operator, shop, and courier roles.",
  request: {
    params: DeliveryIdParamSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: DeliveryProofResponseSchema },
      },
      description: "Proof of delivery data",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Proof not found",
    },
    403: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Access denied",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

deliveryProofRouter.openapi(getProofRoute, async (c) => {
  const { id: deliveryId } = c.req.valid("param");
  const user = c.get("user");
  const companyId = c.get("companyId");

  // Auth: GET allowed for operator, shop, and courier
  if (!["operator", "shop", "courier"].includes(user.role)) {
    return c.json(
      {
        error: "Forbidden",
        message: "Access denied",
        statusCode: 403,
      },
      403
    );
  }

  const proof = await getProof({ deliveryId, companyId });

  if (!proof) {
    return c.json(
      {
        error: "Not Found",
        message: "Proof not found for this delivery",
        statusCode: 404,
      },
      404
    );
  }

  return c.json(proof, 200);
});

export { deliveryProofRouter };
