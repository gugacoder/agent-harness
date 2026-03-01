import PDFDocument from "pdfkit";
import { eq, and } from "drizzle-orm";
import { db } from "../db.js";
import {
  invoices,
  invoiceItems,
  companies,
  shops,
} from "../../db/schema/index.js";

/**
 * Generate a professional PDF for an invoice.
 * Returns a Buffer with the PDF content.
 */
export async function generateInvoicePdf(params: {
  invoiceId: string;
  companyId: string;
}): Promise<Buffer> {
  const { invoiceId, companyId } = params;

  // Fetch invoice
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(
      and(eq(invoices.id, invoiceId), eq(invoices.company_id, companyId))
    );

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  // Fetch company
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, companyId));

  if (!company) {
    throw new Error("Company not found");
  }

  // Fetch shop
  const [shop] = await db
    .select()
    .from(shops)
    .where(eq(shops.id, invoice.shop_id));

  if (!shop) {
    throw new Error("Shop not found");
  }

  // Fetch invoice items
  const items = await db
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoice_id, invoiceId));

  // Build PDF
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      compress: false,
      info: {
        Title: `Fatura #${invoice.invoice_number}`,
        Author: company.name,
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - 100; // account for margins

    // --- Header: Company info ---
    doc.fontSize(18).font("Helvetica-Bold").text(company.name, { align: "left" });
    doc.fontSize(9).font("Helvetica").text(company.address);
    doc.text(`CNPJ: ${company.cnpj ?? "N/A"}`);
    doc.text(`Email: ${company.email} | Tel: ${company.phone}`);

    if (company.logo_url) {
      doc.fontSize(8).fillColor("#888888").text(`Logo: ${company.logo_url}`);
      doc.fillColor("#000000");
    }

    doc.moveDown(1.5);

    // --- Invoice title ---
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text(`FATURA #${invoice.invoice_number}`, { align: "center" });
    doc.moveDown(0.5);

    // --- Shop info ---
    doc.fontSize(10).font("Helvetica-Bold").text("Lojista:");
    doc.font("Helvetica").text(`Nome: ${shop.trade_name}`);
    doc.text(`Endereco: ${shop.address}`);
    doc.text(`Telefone: ${shop.phone}`);
    doc.moveDown(0.5);

    // --- Period ---
    doc.font("Helvetica-Bold").text("Periodo:");
    doc
      .font("Helvetica")
      .text(`De ${formatDate(invoice.period_start)} a ${formatDate(invoice.period_end)}`);
    doc.moveDown(0.5);

    // --- Summary ---
    doc.font("Helvetica-Bold").text("Resumo:");
    doc
      .font("Helvetica")
      .text(`Total de entregas: ${invoice.total_deliveries}`);
    doc.text(`Distancia total: ${invoice.total_distance_km} km`);
    doc.text(`Valor total: R$ ${formatCurrency(invoice.total_amount)}`);
    doc.moveDown(1);

    // --- Delivery details table ---
    doc.fontSize(11).font("Helvetica-Bold").text("Detalhamento das Entregas");
    doc.moveDown(0.5);

    // Table header
    const colWidths = {
      date: 65,
      order: 45,
      pickup: pageWidth * 0.2,
      delivery: pageWidth * 0.2,
      distance: 55,
      value: 65,
    };

    const tableTop = doc.y;
    drawTableHeader(doc, tableTop, colWidths);

    let y = tableTop + 20;

    // Table rows
    doc.fontSize(8).font("Helvetica");
    for (const item of items) {
      if (y > doc.page.height - 80) {
        doc.addPage();
        y = 50;
        drawTableHeader(doc, y, colWidths);
        y += 20;
        doc.fontSize(8).font("Helvetica");
      }

      let x = 50;

      doc.text(formatDate(item.delivered_at), x, y, {
        width: colWidths.date,
        lineBreak: false,
      });
      x += colWidths.date;

      doc.text(`#${item.order_number}`, x, y, {
        width: colWidths.order,
        lineBreak: false,
      });
      x += colWidths.order;

      doc.text(truncate(item.pickup_address, 30), x, y, {
        width: colWidths.pickup,
        lineBreak: false,
      });
      x += colWidths.pickup;

      doc.text(truncate(item.delivery_address, 30), x, y, {
        width: colWidths.delivery,
        lineBreak: false,
      });
      x += colWidths.delivery;

      doc.text(`${item.distance_km} km`, x, y, {
        width: colWidths.distance,
        align: "right",
        lineBreak: false,
      });
      x += colWidths.distance;

      doc.text(`R$ ${formatCurrency(item.price)}`, x, y, {
        width: colWidths.value,
        align: "right",
        lineBreak: false,
      });

      y += 15;
    }

    // Total line
    y += 5;
    doc
      .moveTo(50, y)
      .lineTo(50 + pageWidth, y)
      .stroke();
    y += 8;

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(
        `TOTAL: R$ ${formatCurrency(invoice.total_amount)}`,
        50,
        y,
        { align: "right", width: pageWidth }
      );

    doc.moveDown(2);

    // --- Footer ---
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#888888")
      .text(
        `Gerado em ${new Date().toLocaleString("pt-BR")} | ${company.name}`,
        50,
        doc.page.height - 50,
        { align: "center", width: pageWidth }
      );

    doc.end();
  });
}

function drawTableHeader(
  doc: PDFKit.PDFDocument,
  y: number,
  colWidths: Record<string, number>
) {
  doc.fontSize(8).font("Helvetica-Bold").fillColor("#000000");
  let x = 50;

  doc.text("Data", x, y, { width: colWidths.date, lineBreak: false });
  x += colWidths.date;

  doc.text("Pedido", x, y, { width: colWidths.order, lineBreak: false });
  x += colWidths.order;

  doc.text("Coleta", x, y, { width: colWidths.pickup, lineBreak: false });
  x += colWidths.pickup;

  doc.text("Entrega", x, y, { width: colWidths.delivery, lineBreak: false });
  x += colWidths.delivery;

  doc.text("Dist.", x, y, {
    width: colWidths.distance,
    align: "right",
    lineBreak: false,
  });
  x += colWidths.distance;

  doc.text("Valor", x, y, {
    width: colWidths.value,
    align: "right",
    lineBreak: false,
  });

  // Underline
  const pageWidth = doc.page.width - 100;
  doc
    .moveTo(50, y + 12)
    .lineTo(50 + pageWidth, y + 12)
    .stroke();
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatCurrency(value: string): string {
  const num = parseFloat(value);
  return isNaN(num) ? value : num.toFixed(2).replace(".", ",");
}

function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.substring(0, maxLen - 1) + "…" : str;
}
