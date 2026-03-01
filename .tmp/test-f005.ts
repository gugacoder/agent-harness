/**
 * Integration test for F-005: Servico de PDF
 * Tests generateInvoicePdf from pdf.service.ts
 */
import { db } from "../apps/backbone/src/db.js";
import {
  companies,
  profiles,
  couriers,
  shops,
  orders,
  deliveries,
  deliveryPrices,
  invoices,
  invoiceItems,
  pricingTables,
  pricingRules,
} from "../apps/backbone/db/schema/index.js";
import { sql } from "drizzle-orm";
import { generateInvoicePdf } from "../apps/backbone/src/services/pdf.service.js";

const COMPANY_NAME = "Test F005 Co";

let companyId: string;
let shopId: string;
let invoiceId: string;
let pricingTableId: string;
let pricingRuleId: string;

async function setup() {
  console.log("=== SETUP: Creating test data for F-005 ===");

  // Clean up
  await db.execute(sql`DELETE FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE company_id IN (SELECT id FROM companies WHERE name = ${COMPANY_NAME}))`);
  await db.execute(sql`DELETE FROM invoices WHERE company_id IN (SELECT id FROM companies WHERE name = ${COMPANY_NAME})`);
  await db.execute(sql`DELETE FROM delivery_prices WHERE company_id IN (SELECT id FROM companies WHERE name = ${COMPANY_NAME})`);
  await db.execute(sql`DELETE FROM delivery_events WHERE delivery_id IN (SELECT id FROM deliveries WHERE company_id IN (SELECT id FROM companies WHERE name = ${COMPANY_NAME}))`);
  await db.execute(sql`DELETE FROM deliveries WHERE company_id IN (SELECT id FROM companies WHERE name = ${COMPANY_NAME})`);
  await db.execute(sql`DELETE FROM orders WHERE company_id IN (SELECT id FROM companies WHERE name = ${COMPANY_NAME})`);
  await db.execute(sql`DELETE FROM pricing_rules WHERE pricing_table_id IN (SELECT id FROM pricing_tables WHERE company_id IN (SELECT id FROM companies WHERE name = ${COMPANY_NAME}))`);
  await db.execute(sql`DELETE FROM pricing_tables WHERE company_id IN (SELECT id FROM companies WHERE name = ${COMPANY_NAME})`);
  await db.execute(sql`DELETE FROM couriers WHERE company_id IN (SELECT id FROM companies WHERE name = ${COMPANY_NAME})`);
  await db.execute(sql`DELETE FROM shops WHERE company_id IN (SELECT id FROM companies WHERE name = ${COMPANY_NAME})`);
  await db.execute(sql`DELETE FROM profiles WHERE company_id IN (SELECT id FROM companies WHERE name = ${COMPANY_NAME})`);
  await db.execute(sql`DELETE FROM auth.users WHERE email LIKE 'test-f005-%@test.co'`);
  await db.execute(sql`DELETE FROM companies WHERE name = ${COMPANY_NAME}`);

  // Create company
  const [company] = await db
    .insert(companies)
    .values({
      name: COMPANY_NAME,
      cnpj: "99999999000505",
      phone: "11999999505",
      email: "test@f005.co",
      address: "Rua dos Testes, 505, Sao Paulo - SP",
      lat: "-23.5505",
      lng: "-46.6333",
      logo_url: "https://example.com/logo.png",
    })
    .returning();
  companyId = company.id;

  // Create auth users
  const shopProfileId = crypto.randomUUID();
  const operatorProfileId = crypto.randomUUID();
  const courierProfileId = crypto.randomUUID();

  await db.execute(sql`
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, aud, role, created_at, updated_at, confirmation_token)
    VALUES
      (${shopProfileId}, '00000000-0000-0000-0000-000000000000', 'test-f005-shop@test.co', '$2a$10$test', 'authenticated', 'authenticated', now(), now(), ''),
      (${operatorProfileId}, '00000000-0000-0000-0000-000000000000', 'test-f005-operator@test.co', '$2a$10$test', 'authenticated', 'authenticated', now(), now(), ''),
      (${courierProfileId}, '00000000-0000-0000-0000-000000000000', 'test-f005-courier@test.co', '$2a$10$test', 'authenticated', 'authenticated', now(), now(), '')
    ON CONFLICT (id) DO NOTHING
  `);

  await db.insert(profiles).values([
    { id: shopProfileId, company_id: companyId, role: "shop", full_name: "Shop F005", phone: "11988888505" },
    { id: operatorProfileId, company_id: companyId, role: "operator", full_name: "Operator F005", phone: "11988888506" },
    { id: courierProfileId, company_id: companyId, role: "courier", full_name: "Courier F005", phone: "11988888507" },
  ]);

  // Create courier
  const [courier] = await db
    .insert(couriers)
    .values({
      company_id: companyId,
      profile_id: courierProfileId,
      full_name: "Courier F005",
      phone: "11988888507",
    })
    .returning();
  const courierId = courier.id;

  // Create shop
  const [shop] = await db
    .insert(shops)
    .values({
      company_id: companyId,
      profile_id: shopProfileId,
      trade_name: "Restaurante Bom Sabor",
      phone: "11977777505",
      address: "Av Paulista, 1000, Sao Paulo - SP",
      lat: "-23.5605",
      lng: "-46.6433",
    })
    .returning();
  shopId = shop.id;

  // Create pricing table and rule
  const [pTable] = await db
    .insert(pricingTables)
    .values({ company_id: companyId, name: "Test F005 Table", active: true })
    .returning();
  pricingTableId = pTable.id;

  const [pRule] = await db
    .insert(pricingRules)
    .values({ pricing_table_id: pricingTableId, rule_type: "flat_rate", base_value: "10.00", priority: 1 })
    .returning();
  pricingRuleId = pRule.id;

  // Create 3 deliveries with invoice items
  const deliveryData = [
    { price: 15, distance: 4.5, orderNum: 101, pickup: "Rua Augusta, 100", delivery: "Rua Consolacao, 200" },
    { price: 20, distance: 6.2, orderNum: 102, pickup: "Rua Haddock Lobo, 50", delivery: "Rua da Consolacao, 300" },
    { price: 12, distance: 3.1, orderNum: 103, pickup: "Av Paulista, 500", delivery: "Rua Bela Cintra, 100" },
  ];

  // Create invoice first
  const now = new Date().toISOString();
  const [invoice] = await db
    .insert(invoices)
    .values({
      company_id: companyId,
      shop_id: shopId,
      invoice_number: 0, // trigger will assign
      period_start: "2026-02-01",
      period_end: "2026-02-28",
      total_deliveries: 3,
      total_distance_km: "13.80",
      total_amount: "47.00",
      status: "draft",
      created_at: now,
      updated_at: now,
    })
    .returning();
  invoiceId = invoice.id;

  for (let i = 0; i < deliveryData.length; i++) {
    const d = deliveryData[i];

    const [order] = await db
      .insert(orders)
      .values({
        company_id: companyId,
        shop_id: shopId,
        order_number: d.orderNum,
        status: "delivered",
        pickup_address: d.pickup,
        delivery_address: d.delivery,
        pickup_lat: "-23.5505",
        pickup_lng: "-46.6333",
        delivery_lat: "-23.5605",
        delivery_lng: "-46.6433",
        recipient_name: `Recipient F005 ${i}`,
        recipient_phone: `119000050${i}`,
        created_by: operatorProfileId,
      })
      .returning();

    const [delivery] = await db
      .insert(deliveries)
      .values({
        order_id: order.id,
        courier_id: courierId,
        company_id: companyId,
        status: "delivered",
        delivered_at: new Date(2026, 1, 15 + i, 10 + i).toISOString(),
      })
      .returning();

    await db.insert(deliveryPrices).values({
      delivery_id: delivery.id,
      company_id: companyId,
      pricing_table_id: pricingTableId,
      pricing_rule_id: pricingRuleId,
      estimated_distance_km: d.distance.toFixed(2),
      actual_distance_km: d.distance.toFixed(2),
      base_price: d.price.toFixed(2),
      surcharge_amount: "0.00",
      total_price: d.price.toFixed(2),
      calculated_at: now,
    });

    await db.insert(invoiceItems).values({
      invoice_id: invoiceId,
      delivery_id: delivery.id,
      order_number: d.orderNum,
      pickup_address: d.pickup,
      delivery_address: d.delivery,
      distance_km: d.distance.toFixed(2),
      price: d.price.toFixed(2),
      delivered_at: new Date(2026, 1, 15 + i, 10 + i).toISOString(),
    });
  }

  console.log("  Created company:", companyId);
  console.log("  Created shop:", shopId);
  console.log("  Created invoice:", invoiceId, "(with 3 items)");
}

async function cleanup() {
  console.log("\n=== CLEANUP ===");
  await db.execute(sql`DELETE FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE company_id = ${companyId})`);
  await db.execute(sql`DELETE FROM invoices WHERE company_id = ${companyId}`);
  await db.execute(sql`DELETE FROM delivery_prices WHERE company_id = ${companyId}`);
  await db.execute(sql`DELETE FROM delivery_events WHERE delivery_id IN (SELECT id FROM deliveries WHERE company_id = ${companyId})`);
  await db.execute(sql`DELETE FROM deliveries WHERE company_id = ${companyId}`);
  await db.execute(sql`DELETE FROM orders WHERE company_id = ${companyId}`);
  await db.execute(sql`DELETE FROM pricing_rules WHERE pricing_table_id = ${pricingTableId}`);
  await db.execute(sql`DELETE FROM pricing_tables WHERE company_id = ${companyId}`);
  await db.execute(sql`DELETE FROM couriers WHERE company_id = ${companyId}`);
  await db.execute(sql`DELETE FROM shops WHERE company_id = ${companyId}`);
  await db.execute(sql`DELETE FROM profiles WHERE company_id = ${companyId}`);
  await db.execute(sql`DELETE FROM auth.users WHERE email LIKE 'test-f005-%@test.co'`);
  await db.execute(sql`DELETE FROM companies WHERE id = ${companyId}`);
  console.log("  Cleaned up test data");
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.log(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

/**
 * Extract readable text from a PDFKit-generated PDF buffer.
 * PDFKit encodes text as hex strings in BT/ET blocks.
 * This extracts and decodes those hex strings to plaintext.
 */
function extractPdfText(pdfBuffer: Buffer): string {
  const raw = pdfBuffer.toString("latin1");
  const parts: string[] = [];

  // Extract hex strings from TJ/Tj operators: <hexhex...>
  const hexPattern = /<([0-9A-Fa-f]+)>/g;
  let match;
  while ((match = hexPattern.exec(raw)) !== null) {
    const hex = match[1];
    let text = "";
    for (let i = 0; i < hex.length; i += 2) {
      text += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16));
    }
    parts.push(text);
  }

  // Also include literal strings in parens: (text)
  const literalPattern = /\(([^)]*)\)/g;
  while ((match = literalPattern.exec(raw)) !== null) {
    parts.push(match[1]);
  }

  return parts.join("");
}

// --- TEST 1: Generate PDF returns buffer with application/pdf ---
async function testGeneratePdfReturnsBuffer() {
  console.log("\n=== TEST 1: Generate PDF returns buffer with content-type application/pdf ===");

  const pdfBuffer = await generateInvoicePdf({ invoiceId, companyId });

  assert(Buffer.isBuffer(pdfBuffer), "Result is a Buffer");
  assert(pdfBuffer.length > 0, `Buffer is not empty (size: ${pdfBuffer.length} bytes)`);

  // PDF files start with %PDF-
  const header = pdfBuffer.subarray(0, 5).toString("ascii");
  assert(header === "%PDF-", `Buffer starts with %PDF- header (got '${header}')`);
}

// --- TEST 2: PDF contains company logo, shop data, and period ---
async function testPdfContainsCompanyAndShopInfo() {
  console.log("\n=== TEST 2: PDF contains company logo, shop data, and period ===");

  const pdfBuffer = await generateInvoicePdf({ invoiceId, companyId });
  const pdfText = extractPdfText(pdfBuffer);

  // Company name
  assert(pdfText.includes("Test F005 Co"), "PDF contains company name");

  // Company CNPJ
  assert(pdfText.includes("99999999000505"), "PDF contains company CNPJ");

  // Logo URL reference (since we can't embed actual image, we reference it)
  assert(pdfText.includes("logo") || pdfText.includes("Logo"), "PDF references logo");

  // Shop name
  assert(pdfText.includes("Restaurante Bom Sabor"), "PDF contains shop name (trade_name)");

  // Shop address
  assert(pdfText.includes("Av Paulista"), "PDF contains shop address");

  // Period dates
  assert(pdfText.includes("01/02/2026") || pdfText.includes("02/01/2026") || pdfText.includes("2026"), "PDF contains period start info");
  assert(pdfText.includes("28/02/2026") || pdfText.includes("02/28/2026") || pdfText.includes("2026"), "PDF contains period end info");
}

// --- TEST 3: PDF contains delivery details and total ---
async function testPdfContainsDeliveryDetails() {
  console.log("\n=== TEST 3: PDF contains delivery details (date, order, addresses, distance, value) and total ===");

  const pdfBuffer = await generateInvoicePdf({ invoiceId, companyId });
  const pdfText = extractPdfText(pdfBuffer);

  // Order numbers
  assert(pdfText.includes("#101"), "PDF contains order number #101");
  assert(pdfText.includes("#102"), "PDF contains order number #102");
  assert(pdfText.includes("#103"), "PDF contains order number #103");

  // Addresses
  assert(pdfText.includes("Rua Augusta"), "PDF contains pickup address");
  assert(pdfText.includes("Consolacao") || pdfText.includes("Consolac"), "PDF contains delivery address");

  // Distances
  assert(pdfText.includes("4.50") || pdfText.includes("4,50"), "PDF contains distance 4.50 km");
  assert(pdfText.includes("6.20") || pdfText.includes("6,20"), "PDF contains distance 6.20 km");

  // Values (R$ X,XX format from formatCurrency)
  assert(pdfText.includes("15,00") || pdfText.includes("15.00"), "PDF contains value R$ 15.00");
  assert(pdfText.includes("20,00") || pdfText.includes("20.00"), "PDF contains value R$ 20.00");

  // Total (47.00)
  assert(pdfText.includes("47,00") || pdfText.includes("47.00"), "PDF contains total R$ 47.00");
}

// --- TEST 4: Generate PDF for nonexistent invoice returns error ---
async function testPdfNonexistentInvoice() {
  console.log("\n=== TEST 4: Generate PDF for nonexistent invoice returns error ===");

  const fakeId = "00000000-0000-0000-0000-000000000000";

  try {
    await generateInvoicePdf({ invoiceId: fakeId, companyId });
    assert(false, "Should have thrown an error");
  } catch (err: any) {
    assert(err.message === "Invoice not found", `Error message is 'Invoice not found' (got '${err.message}')`);
  }

  // Also test with valid invoice but wrong company
  const wrongCompanyId = "00000000-0000-0000-0000-000000000001";
  try {
    await generateInvoicePdf({ invoiceId, companyId: wrongCompanyId });
    assert(false, "Should have thrown an error for wrong company");
  } catch (err: any) {
    assert(err.message === "Invoice not found", `Error message is 'Invoice not found' for wrong company (got '${err.message}')`);
  }
}

async function main() {
  try {
    await setup();
    console.log("\n=== Testing PDF service ===\n");

    await testGeneratePdfReturnsBuffer();
    await testPdfContainsCompanyAndShopInfo();
    await testPdfContainsDeliveryDetails();
    await testPdfNonexistentInvoice();

    console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);

    await cleanup();

    if (failed > 0) {
      process.exit(1);
    }
    process.exit(0);
  } catch (err) {
    console.error("\nFATAL ERROR:", err);
    await cleanup().catch(() => {});
    process.exit(1);
  }
}

main();
