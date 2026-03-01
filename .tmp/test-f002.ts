/**
 * Integration test for F-002: Rotas de Fechamento Financeiro
 * Tests all 5 API routes against a running backbone server.
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
  pricingTables,
  pricingRules,
  financialClosings,
  financialClosingItems,
} from "../apps/backbone/db/schema/index.js";
import { sql } from "drizzle-orm";
import { sign } from "hono/jwt";

const BACKBONE_PORT = process.env.BACKBONE_PORT || "4205";
const BASE_URL = `http://localhost:${BACKBONE_PORT}/api`;
const JWT_SECRET = process.env.JWT_SECRET!;

let companyId: string;
let courierId: string;
let profileId: string;
let shopId: string;
let shopProfileId: string;
let pricingTableId: string;
let authToken: string;

async function createJWT(userId: string, companyId: string, role: string) {
  const payload = {
    sub: userId,
    app_metadata: { company_id: companyId, role },
    iss: "supabase",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  return sign(payload, JWT_SECRET, "HS256");
}

async function setup() {
  console.log("=== SETUP: Creating test data for F-002 ===");

  // Clean up any existing test data
  await db.execute(sql`DELETE FROM financial_closing_items WHERE closing_id IN (SELECT id FROM financial_closings WHERE company_id IN (SELECT id FROM companies WHERE name = 'Test F002 Co'))`);
  await db.execute(sql`DELETE FROM financial_closings WHERE company_id IN (SELECT id FROM companies WHERE name = 'Test F002 Co')`);
  await db.execute(sql`DELETE FROM delivery_prices WHERE company_id IN (SELECT id FROM companies WHERE name = 'Test F002 Co')`);
  await db.execute(sql`DELETE FROM delivery_events WHERE delivery_id IN (SELECT id FROM deliveries WHERE company_id IN (SELECT id FROM companies WHERE name = 'Test F002 Co'))`);
  await db.execute(sql`DELETE FROM deliveries WHERE company_id IN (SELECT id FROM companies WHERE name = 'Test F002 Co')`);
  await db.execute(sql`DELETE FROM orders WHERE company_id IN (SELECT id FROM companies WHERE name = 'Test F002 Co')`);
  await db.execute(sql`DELETE FROM pricing_rules WHERE pricing_table_id IN (SELECT id FROM pricing_tables WHERE company_id IN (SELECT id FROM companies WHERE name = 'Test F002 Co'))`);
  await db.execute(sql`DELETE FROM pricing_tables WHERE company_id IN (SELECT id FROM companies WHERE name = 'Test F002 Co')`);
  await db.execute(sql`DELETE FROM couriers WHERE company_id IN (SELECT id FROM companies WHERE name = 'Test F002 Co')`);
  await db.execute(sql`DELETE FROM shops WHERE company_id IN (SELECT id FROM companies WHERE name = 'Test F002 Co')`);
  await db.execute(sql`DELETE FROM profiles WHERE company_id IN (SELECT id FROM companies WHERE name = 'Test F002 Co')`);
  await db.execute(sql`DELETE FROM auth.users WHERE email IN ('courier-test-f002@test.co', 'shop-test-f002@test.co')`);
  await db.execute(sql`DELETE FROM companies WHERE name = 'Test F002 Co'`);

  // Create company
  const [company] = await db
    .insert(companies)
    .values({
      name: "Test F002 Co",
      cnpj: "99999999000202",
      phone: "11999999202",
      email: "test@f002.co",
      address: "Test St F002",
      lat: "-23.5505",
      lng: "-46.6333",
    })
    .returning();
  companyId = company.id;

  // Create auth users
  const courierProfileUuid = crypto.randomUUID();
  const shopProfileUuid = crypto.randomUUID();

  await db.execute(sql`
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, aud, role, created_at, updated_at, confirmation_token)
    VALUES
      (${courierProfileUuid}, '00000000-0000-0000-0000-000000000000', 'courier-test-f002@test.co', '$2a$10$test', 'authenticated', 'authenticated', now(), now(), ''),
      (${shopProfileUuid}, '00000000-0000-0000-0000-000000000000', 'shop-test-f002@test.co', '$2a$10$test', 'authenticated', 'authenticated', now(), now(), '')
    ON CONFLICT (id) DO NOTHING
  `);

  const [courierProfile] = await db
    .insert(profiles)
    .values({
      id: courierProfileUuid,
      company_id: companyId,
      role: "operator",
      full_name: "Test Operator F002",
      phone: "11988888202",
    })
    .returning();
  profileId = courierProfile.id;

  const [shopProfile] = await db
    .insert(profiles)
    .values({
      id: shopProfileUuid,
      company_id: companyId,
      role: "shop",
      full_name: "Test Shop F002",
      phone: "11977777202",
    })
    .returning();
  shopProfileId = shopProfile.id;

  // Create courier
  const [courier] = await db
    .insert(couriers)
    .values({
      company_id: companyId,
      profile_id: profileId,
      full_name: "Test Courier F002",
      phone: "11988888202",
    })
    .returning();
  courierId = courier.id;

  // Create shop
  const [shop] = await db
    .insert(shops)
    .values({
      company_id: companyId,
      profile_id: shopProfileId,
      trade_name: "Test Shop F002",
      phone: "11977777202",
      address: "Shop St F002",
      lat: "-23.5505",
      lng: "-46.6333",
    })
    .returning();
  shopId = shop.id;

  // Create pricing table and rule
  const [pTable] = await db
    .insert(pricingTables)
    .values({
      company_id: companyId,
      name: "Test F002 Table",
      active: true,
    })
    .returning();
  pricingTableId = pTable.id;

  const [pRule] = await db
    .insert(pricingRules)
    .values({
      pricing_table_id: pricingTableId,
      rule_type: "flat_rate",
      base_value: "10.00",
      priority: 1,
    })
    .returning();

  // Create 3 delivered orders with deliveries and delivery_prices
  for (let i = 0; i < 3; i++) {
    const [order] = await db
      .insert(orders)
      .values({
        company_id: companyId,
        shop_id: shopId,
        order_number: i + 1,
        status: "delivered",
        pickup_address: "Pickup F002 " + i,
        delivery_address: "Delivery F002 " + i,
        pickup_lat: "-23.5505",
        pickup_lng: "-46.6333",
        delivery_lat: "-23.5605",
        delivery_lng: "-46.6433",
        recipient_name: "Recipient F002 " + i,
        recipient_phone: "1190000020" + i,
        created_by: profileId,
      })
      .returning();

    const deliveredAt = new Date("2026-02-10T10:00:00Z");
    deliveredAt.setHours(deliveredAt.getHours() + i);

    const [delivery] = await db
      .insert(deliveries)
      .values({
        order_id: order.id,
        courier_id: courierId,
        company_id: companyId,
        status: "delivered",
        delivered_at: deliveredAt.toISOString(),
      })
      .returning();

    const price = 15 + i * 5; // 15, 20, 25
    const distance = 4 + i; // 4, 5, 6
    await db.insert(deliveryPrices).values({
      delivery_id: delivery.id,
      company_id: companyId,
      pricing_table_id: pricingTableId,
      pricing_rule_id: pRule.id,
      estimated_distance_km: distance.toFixed(2),
      actual_distance_km: distance.toFixed(2),
      base_price: price.toFixed(2),
      surcharge_amount: "0.00",
      total_price: price.toFixed(2),
      calculated_at: new Date().toISOString(),
    });
  }

  // Create JWT for the operator
  authToken = await createJWT(profileId, companyId, "operator");

  console.log("  Created company:", companyId);
  console.log("  Created courier:", courierId);
  console.log("  Created 3 delivered deliveries with prices");
  console.log("  JWT created for operator");
}

async function cleanup() {
  console.log("\n=== CLEANUP ===");
  await db.execute(sql`DELETE FROM financial_closing_items WHERE closing_id IN (SELECT id FROM financial_closings WHERE company_id = ${companyId})`);
  await db.execute(sql`DELETE FROM financial_closings WHERE company_id = ${companyId}`);
  await db.execute(sql`DELETE FROM delivery_prices WHERE company_id = ${companyId}`);
  await db.execute(sql`DELETE FROM delivery_events WHERE delivery_id IN (SELECT id FROM deliveries WHERE company_id = ${companyId})`);
  await db.execute(sql`DELETE FROM deliveries WHERE company_id = ${companyId}`);
  await db.execute(sql`DELETE FROM orders WHERE company_id = ${companyId}`);
  await db.execute(sql`DELETE FROM pricing_rules WHERE pricing_table_id = ${pricingTableId}`);
  await db.execute(sql`DELETE FROM pricing_tables WHERE company_id = ${companyId}`);
  await db.execute(sql`DELETE FROM couriers WHERE company_id = ${companyId}`);
  await db.execute(sql`DELETE FROM shops WHERE company_id = ${companyId}`);
  await db.execute(sql`DELETE FROM profiles WHERE company_id = ${companyId}`);
  await db.execute(sql`DELETE FROM auth.users WHERE email IN ('courier-test-f002@test.co', 'shop-test-f002@test.co')`);
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

async function api(method: string, path: string, body?: unknown) {
  const opts: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const data = await res.json();
  return { status: res.status, data };
}

// --- TEST 1: POST /api/financial/closings ---
async function testCreateClosing() {
  console.log("\n=== TEST 1: POST /api/financial/closings creates closing and returns 201 ===");

  const { status, data } = await api("POST", "/financial/closings", {
    courier_id: courierId,
    period_start: "2026-02-01",
    period_end: "2026-02-28",
  });

  assert(status === 201, `Status is 201 (got ${status})`);
  assert(data.status === "draft", `Closing status is 'draft' (got ${data.status})`);
  assert(data.items?.length === 3, `Has 3 items (got ${data.items?.length})`);
  assert(parseFloat(data.total_amount) === 60, `total_amount is 60.00 (got ${data.total_amount})`);
  assert(parseFloat(data.total_distance_km) === 15, `total_distance_km is 15.00 (got ${data.total_distance_km})`);
  assert(data.total_deliveries === 3, `total_deliveries is 3 (got ${data.total_deliveries})`);
  assert(data.company_id === companyId, `company_id matches`);
  assert(data.courier_id === courierId, `courier_id matches`);

  return data.id;
}

// --- TEST 2: GET /api/financial/closings ---
async function testListClosings(closingId: string) {
  console.log("\n=== TEST 2: GET /api/financial/closings lists with filters ===");

  // List all
  const { status: s1, data: all } = await api("GET", "/financial/closings");
  assert(s1 === 200, `Status is 200 (got ${s1})`);
  assert(Array.isArray(all), "Response is an array");
  assert(all.length >= 1, `At least 1 closing (got ${all.length})`);

  // Filter by courier_id
  const { data: byCourier } = await api("GET", `/financial/closings?courier_id=${courierId}`);
  assert(byCourier.length >= 1, `Filtered by courier_id has >= 1 (got ${byCourier.length})`);

  // Filter by status
  const { data: byStatus } = await api("GET", "/financial/closings?status=draft");
  assert(byStatus.length >= 1, `Filtered by status=draft has >= 1 (got ${byStatus.length})`);

  // Filter by period
  const { data: byPeriod } = await api("GET", "/financial/closings?period_start=2026-02-01&period_end=2026-02-28");
  assert(byPeriod.length >= 1, `Filtered by period has >= 1 (got ${byPeriod.length})`);
}

// --- TEST 3: GET /api/financial/closings/:id ---
async function testGetClosingById(closingId: string) {
  console.log("\n=== TEST 3: GET /api/financial/closings/:id returns details with items ===");

  const { status, data } = await api("GET", `/financial/closings/${closingId}`);
  assert(status === 200, `Status is 200 (got ${status})`);
  assert(data.id === closingId, `Correct closing ID`);
  assert(data.items?.length === 3, `Has 3 items (got ${data.items?.length})`);
  assert(data.status === "draft", `Status is draft (got ${data.status})`);

  // Verify items have snapshot data
  for (const item of data.items) {
    assert(!!item.delivery_price, `Item has delivery_price`);
    assert(!!item.distance_km, `Item has distance_km`);
    assert(!!item.delivered_at, `Item has delivered_at`);
  }

  // Non-existent closing
  const { status: s404 } = await api("GET", `/financial/closings/00000000-0000-0000-0000-000000000000`);
  assert(s404 === 404, `Non-existent closing returns 404 (got ${s404})`);
}

// --- TEST 4: PATCH /api/financial/closings/:id/confirm ---
async function testConfirmClosing(closingId: string) {
  console.log("\n=== TEST 4: PATCH /api/financial/closings/:id/confirm transitions to confirmed ===");

  const { status, data } = await api("PATCH", `/financial/closings/${closingId}/confirm`);
  assert(status === 200, `Status is 200 (got ${status})`);
  assert(data.status === "confirmed", `Status is 'confirmed' (got ${data.status})`);
  assert(data.confirmed_at !== null, `confirmed_at is set`);
}

// --- TEST 5: PATCH /api/financial/closings/:id/pay ---
async function testPayClosing(closingId: string) {
  console.log("\n=== TEST 5: PATCH /api/financial/closings/:id/pay transitions to paid ===");

  const { status, data } = await api("PATCH", `/financial/closings/${closingId}/pay`);
  assert(status === 200, `Status is 200 (got ${status})`);
  assert(data.status === "paid", `Status is 'paid' (got ${data.status})`);
  assert(data.paid_at !== null, `paid_at is set`);

  // Try to pay again (should fail - already paid)
  const { status: s400 } = await api("PATCH", `/financial/closings/${closingId}/pay`);
  assert(s400 === 400, `Paying paid closing returns 400 (got ${s400})`);

  // Try to confirm a paid closing (should fail)
  const { status: s400b } = await api("PATCH", `/financial/closings/${closingId}/confirm`);
  assert(s400b === 400, `Confirming paid closing returns 400 (got ${s400b})`);
}

async function main() {
  try {
    await setup();

    // Start backbone server if not running
    console.log("\n=== Testing against backbone at", BASE_URL, "===\n");

    // TEST 1: Create closing
    const closingId = await testCreateClosing();

    // TEST 2: List closings with filters
    await testListClosings(closingId);

    // TEST 3: Get closing by ID with items
    await testGetClosingById(closingId);

    // TEST 4: Confirm closing
    await testConfirmClosing(closingId);

    // TEST 5: Pay closing
    await testPayClosing(closingId);

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
