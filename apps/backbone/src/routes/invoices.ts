import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AppType } from "../types.js";
import { authMiddleware } from "../middleware/auth.js";
import { companyMiddleware } from "../middleware/company.js";
import { requireRole } from "../middleware/role.js";
import {
  generateInvoice,
  sendInvoice,
  payInvoice,
  listInvoices,
  getInvoiceById,
} from "../services/invoice.service.js";
import { generateInvoicePdf } from "../services/pdf.service.js";
import { eq, and } from "drizzle-orm";
import { db } from "../db.js";
import { shops } from "../../db/schema/index.js";

// --- Schemas ---

const InvoiceItemResponseSchema = z.object({
  id: z.string().uuid(),
  invoice_id: z.string().uuid(),
  delivery_id: z.string().uuid(),
  order_number: z.number().int(),
  pickup_address: z.string(),
  delivery_address: z.string(),
  distance_km: z.string(),
  price: z.string(),
  delivered_at: z.string(),
});

const InvoiceResponseSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  shop_id: z.string().uuid(),
  invoice_number: z.number().int(),
  period_start: z.string(),
  period_end: z.string(),
  total_deliveries: z.number().int(),
  total_distance_km: z.string(),
  total_amount: z.string(),
  status: z.string(),
  sent_at: z.string().nullable(),
  paid_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

const InvoiceWithItemsResponseSchema = InvoiceResponseSchema.extend({
  items: z.array(InvoiceItemResponseSchema),
});

const CreateInvoiceRequestSchema = z.object({
  shop_id: z.string().uuid(),
  period_start: z.string(),
  period_end: z.string(),
});

const InvoiceListQuerySchema = z.object({
  shop_id: z.string().uuid().optional(),
  status: z.enum(["draft", "sent", "paid"]).optional(),
  period_start: z.string().optional(),
  period_end: z.string().optional(),
});

const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number().int(),
});

// --- Router ---

const invoicesRouter = new OpenAPIHono<AppType>({
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

invoicesRouter.use("/invoices/*", authMiddleware);
invoicesRouter.use("/invoices/*", companyMiddleware);
invoicesRouter.use("/invoices/*", requireRole("operator", "super_admin"));
invoicesRouter.use("/shops/*", authMiddleware);
invoicesRouter.use("/shops/*", companyMiddleware);
invoicesRouter.use("/shops/*", requireRole("operator", "super_admin"));

// --- GET /api/invoices ---

const listInvoicesRoute = createRoute({
  method: "get",
  path: "/invoices",
  tags: ["Invoices"],
  summary: "List invoices",
  description:
    "List invoices with optional filters by shop_id, status, and period.",
  request: {
    query: InvoiceListQuerySchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(InvoiceResponseSchema),
        },
      },
      description: "List of invoices",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
    500: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Internal server error",
    },
  },
});

invoicesRouter.openapi(listInvoicesRoute, async (c) => {
  const query = c.req.valid("query");
  const companyId = c.get("companyId");

  try {
    const invoiceList = await listInvoices({
      companyId,
      shopId: query.shop_id,
      status: query.status,
      periodStart: query.period_start,
      periodEnd: query.period_end,
    });

    return c.json(
      invoiceList.map((inv) => ({
        id: inv.id,
        company_id: inv.company_id,
        shop_id: inv.shop_id,
        invoice_number: inv.invoice_number,
        period_start: inv.period_start,
        period_end: inv.period_end,
        total_deliveries: inv.total_deliveries,
        total_distance_km: inv.total_distance_km,
        total_amount: inv.total_amount,
        status: inv.status,
        sent_at: inv.sent_at,
        paid_at: inv.paid_at,
        created_at: inv.created_at,
        updated_at: inv.updated_at,
      })),
      200
    );
  } catch (err) {
    console.error("Error listing invoices:", err);
    const message =
      err instanceof Error ? err.message : "Failed to list invoices";
    return c.json(
      { error: "Internal Server Error", message, statusCode: 500 },
      500
    );
  }
});

// --- POST /api/invoices ---

const createInvoiceRoute = createRoute({
  method: "post",
  path: "/invoices",
  tags: ["Invoices"],
  summary: "Create invoice",
  description:
    "Generate a new invoice for a shop in a given period.",
  request: {
    body: {
      content: {
        "application/json": { schema: CreateInvoiceRequestSchema },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: InvoiceWithItemsResponseSchema,
        },
      },
      description: "Invoice created",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Invalid request or no eligible deliveries",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Shop not found",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

invoicesRouter.openapi(createInvoiceRoute, async (c) => {
  const body = c.req.valid("json");
  const companyId = c.get("companyId");

  try {
    const result = await generateInvoice({
      shopId: body.shop_id,
      companyId,
      periodStart: body.period_start,
      periodEnd: body.period_end,
    });

    if (!result) {
      return c.json(
        {
          error: "Not Found",
          message: "Shop not found",
          statusCode: 404,
        },
        404
      );
    }

    return c.json(
      {
        id: result.id,
        company_id: result.company_id,
        shop_id: result.shop_id,
        invoice_number: result.invoice_number,
        period_start: result.period_start,
        period_end: result.period_end,
        total_deliveries: result.total_deliveries,
        total_distance_km: result.total_distance_km,
        total_amount: result.total_amount,
        status: result.status,
        sent_at: result.sent_at,
        paid_at: result.paid_at,
        created_at: result.created_at,
        updated_at: result.updated_at,
        items: result.items.map((item) => ({
          id: item.id,
          invoice_id: item.invoice_id,
          delivery_id: item.delivery_id,
          order_number: item.order_number,
          pickup_address: item.pickup_address,
          delivery_address: item.delivery_address,
          distance_km: item.distance_km,
          price: item.price,
          delivered_at: item.delivered_at,
        })),
      },
      201
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Cannot create invoice";
    return c.json(
      { error: "Bad Request", message, statusCode: 400 },
      400
    );
  }
});

// --- GET /api/invoices/:id ---

const getInvoiceRoute = createRoute({
  method: "get",
  path: "/invoices/{id}",
  tags: ["Invoices"],
  summary: "Get invoice details",
  description:
    "Get a single invoice by ID, including its items.",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: InvoiceWithItemsResponseSchema,
        },
      },
      description: "Invoice details with items",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Invoice not found",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
    500: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Internal server error",
    },
  },
});

invoicesRouter.openapi(getInvoiceRoute, async (c) => {
  const { id: invoiceId } = c.req.valid("param");
  const companyId = c.get("companyId");

  try {
    const result = await getInvoiceById({ invoiceId, companyId });

    if (!result) {
      return c.json(
        {
          error: "Not Found",
          message: "Invoice not found",
          statusCode: 404,
        },
        404
      );
    }

    return c.json(
      {
        id: result.id,
        company_id: result.company_id,
        shop_id: result.shop_id,
        invoice_number: result.invoice_number,
        period_start: result.period_start,
        period_end: result.period_end,
        total_deliveries: result.total_deliveries,
        total_distance_km: result.total_distance_km,
        total_amount: result.total_amount,
        status: result.status,
        sent_at: result.sent_at,
        paid_at: result.paid_at,
        created_at: result.created_at,
        updated_at: result.updated_at,
        items: result.items.map((item) => ({
          id: item.id,
          invoice_id: item.invoice_id,
          delivery_id: item.delivery_id,
          order_number: item.order_number,
          pickup_address: item.pickup_address,
          delivery_address: item.delivery_address,
          distance_km: item.distance_km,
          price: item.price,
          delivered_at: item.delivered_at,
        })),
      },
      200
    );
  } catch (err) {
    console.error("Error fetching invoice:", err);
    const message =
      err instanceof Error ? err.message : "Failed to fetch invoice";
    return c.json(
      { error: "Internal Server Error", message, statusCode: 500 },
      500
    );
  }
});

// --- PATCH /api/invoices/:id/send ---

const sendInvoiceRoute = createRoute({
  method: "patch",
  path: "/invoices/{id}/send",
  tags: ["Invoices"],
  summary: "Send invoice",
  description:
    "Send an invoice, transitioning status from draft to sent.",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: InvoiceResponseSchema },
      },
      description: "Invoice sent",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Invalid status transition",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Invoice not found",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

invoicesRouter.openapi(sendInvoiceRoute, async (c) => {
  const { id: invoiceId } = c.req.valid("param");
  const companyId = c.get("companyId");

  try {
    const result = await sendInvoice({ invoiceId, companyId });

    if (!result) {
      return c.json(
        {
          error: "Not Found",
          message: "Invoice not found",
          statusCode: 404,
        },
        404
      );
    }

    return c.json(
      {
        id: result.id,
        company_id: result.company_id,
        shop_id: result.shop_id,
        invoice_number: result.invoice_number,
        period_start: result.period_start,
        period_end: result.period_end,
        total_deliveries: result.total_deliveries,
        total_distance_km: result.total_distance_km,
        total_amount: result.total_amount,
        status: result.status,
        sent_at: result.sent_at,
        paid_at: result.paid_at,
        created_at: result.created_at,
        updated_at: result.updated_at,
      },
      200
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Cannot send invoice";
    return c.json(
      { error: "Bad Request", message, statusCode: 400 },
      400
    );
  }
});

// --- PATCH /api/invoices/:id/pay ---

const payInvoiceRoute = createRoute({
  method: "patch",
  path: "/invoices/{id}/pay",
  tags: ["Invoices"],
  summary: "Pay invoice",
  description:
    "Mark an invoice as paid, transitioning status from sent to paid.",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: InvoiceResponseSchema },
      },
      description: "Invoice paid",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Invalid status transition",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Invoice not found",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

invoicesRouter.openapi(payInvoiceRoute, async (c) => {
  const { id: invoiceId } = c.req.valid("param");
  const companyId = c.get("companyId");

  try {
    const result = await payInvoice({ invoiceId, companyId });

    if (!result) {
      return c.json(
        {
          error: "Not Found",
          message: "Invoice not found",
          statusCode: 404,
        },
        404
      );
    }

    return c.json(
      {
        id: result.id,
        company_id: result.company_id,
        shop_id: result.shop_id,
        invoice_number: result.invoice_number,
        period_start: result.period_start,
        period_end: result.period_end,
        total_deliveries: result.total_deliveries,
        total_distance_km: result.total_distance_km,
        total_amount: result.total_amount,
        status: result.status,
        sent_at: result.sent_at,
        paid_at: result.paid_at,
        created_at: result.created_at,
        updated_at: result.updated_at,
      },
      200
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Cannot pay invoice";
    return c.json(
      { error: "Bad Request", message, statusCode: 400 },
      400
    );
  }
});

// --- GET /api/invoices/:id/pdf ---

const getInvoicePdfRoute = createRoute({
  method: "get",
  path: "/invoices/{id}/pdf",
  tags: ["Invoices"],
  summary: "Download invoice PDF",
  description:
    "Download a PDF version of the invoice.",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/pdf": {
          schema: z.any(),
        },
      },
      description: "PDF file stream",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Invoice not found",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
  },
});

invoicesRouter.openapi(getInvoicePdfRoute, async (c) => {
  const { id: invoiceId } = c.req.valid("param");
  const companyId = c.get("companyId");

  try {
    const pdfBuffer = await generateInvoicePdf({ invoiceId, companyId });

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="invoice-${invoiceId}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Cannot generate PDF";

    if (message.includes("not found")) {
      return c.json(
        { error: "Not Found", message, statusCode: 404 },
        404
      );
    }

    return c.json(
      { error: "Internal Server Error", message, statusCode: 500 },
      500
    );
  }
});

// --- GET /api/shops/me/invoices ---

const getMyInvoicesRoute = createRoute({
  method: "get",
  path: "/shops/me/invoices",
  tags: ["Invoices"],
  summary: "Get invoices for authenticated shop",
  description:
    "Returns invoices belonging to the authenticated shop user via JWT.",
  request: {
    query: z.object({
      status: z.enum(["draft", "sent", "paid"]).optional(),
      period_start: z.string().optional(),
      period_end: z.string().optional(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(InvoiceResponseSchema),
        },
      },
      description: "List of invoices for the authenticated shop",
    },
    403: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Not a shop user",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Shop profile not found",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Missing or invalid authentication",
    },
    500: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Internal server error",
    },
  },
});

invoicesRouter.openapi(getMyInvoicesRoute, async (c) => {
  const user = c.get("user");
  const companyId = c.get("companyId");
  const query = c.req.valid("query");

  if (user.role !== "shop") {
    return c.json(
      {
        error: "Forbidden",
        message: "Only shop users can access this endpoint",
        statusCode: 403,
      },
      403
    );
  }

  try {
    // Find shop by profile_id (JWT sub) + company_id
    const [shop] = await db
      .select({ id: shops.id })
      .from(shops)
      .where(
        and(
          eq(shops.profile_id, user.id),
          eq(shops.company_id, companyId)
        )
      );

    if (!shop) {
      return c.json(
        {
          error: "Not Found",
          message: "Shop profile not found",
          statusCode: 404,
        },
        404
      );
    }

    const invoiceList = await listInvoices({
      companyId,
      shopId: shop.id,
      status: query.status,
      periodStart: query.period_start,
      periodEnd: query.period_end,
    });

    return c.json(
      invoiceList.map((inv) => ({
        id: inv.id,
        company_id: inv.company_id,
        shop_id: inv.shop_id,
        invoice_number: inv.invoice_number,
        period_start: inv.period_start,
        period_end: inv.period_end,
        total_deliveries: inv.total_deliveries,
        total_distance_km: inv.total_distance_km,
        total_amount: inv.total_amount,
        status: inv.status,
        sent_at: inv.sent_at,
        paid_at: inv.paid_at,
        created_at: inv.created_at,
        updated_at: inv.updated_at,
      })),
      200
    );
  } catch (err) {
    console.error("Error fetching shop invoices:", err);
    const message =
      err instanceof Error ? err.message : "Failed to fetch invoices";
    return c.json(
      { error: "Internal Server Error", message, statusCode: 500 },
      500
    );
  }
});

export { invoicesRouter };
