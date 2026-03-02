/**
 * Integration test for F-003: Rotas de Extrato do Motoboy
 * Tests GET /api/couriers/me/earnings and GET /api/couriers/me/earnings/summary
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

const COMPANY_NAME = "Test F003 Co";

let companyId: string;
let courierId: string;
let courierProfileId: string;
let operatorProfileId: string;
let shopId: string;
let shopProfileId: string;
let pricingTableId: string;
let pricingRuleId: string;
let closingId: string;
let courierToken: string;
let operatorToken: string;

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
  console.log("=== SETUP: Creating test data for F-003 ===");

  // Clean up any existing test data
  await db.execute(sql`DELETE FROM financial_closing_items WHERE closing_id IN (SELECT id FROM financial_closings WHERE company_id IN (SELECT id FROM companies WHERE name = ${COMPANY_NAME}))`);
  await db.execute(sql`DELETE FROM financial_closings WHERE company_id IN (SELECT id FROM companies WHERE name = ${COMPANY_NAME})`);
  await db.execute(sql`DELETE FROM delivery_prices WHERE company_id IN (SELECT id FROM companies WHERE name = ${COMPANY_NAME})`);
  await db.execute(sql`DELETE FROM delivery_events WHERE delivery_id IN (SELECT id FROM deliveries WHERE company_id IN (SELECT id FROM companies WHERE name = ${COMPANY_NAME}))`);
  await db.execute(sql`DELETE FROM deliveries WHERE company_id IN (SELECT id FROM companies WHERE name = ${COMPANY_NAME})`);
  await db.execute(sql`DELETE FROM orders WHERE company_id IN (SELECT id FROM companies WHERE name = ${COMPANY_NAME})`);
  await db.execute(sql`DELETE FROM pricing_rules WHERE pricing_table_id IN (SELECT id FROM pricing_tables WHERE company_id IN (SELECT id FROM companies WHERE name = ${COMPANY_NAME}))`);
  await db.execute(sql`DELETE FROM pricing_tables WHERE company_id IN (SELECT id FROM companies WHERE name = ${COMPANY_NAME})`);
  await db.execute(sql`DELETE FROM couriers WHERE company_id IN (SELECT id FROM companies WHERE name = ${COMPANY_NAME})`);
  await db.execute(sql`DELETE FROM shops WHERE company_id IN (SELECT id FROM companies WHERE name = ${COMPANY_NAME})`);
  await db.execute(sql`DELETE FROM profiles WHERE company_id IN (SELECT id FROM companies WHERE name = ${COMPANY_NAME})`);
  await db.execute(sql`DELETE FROM auth.users WHERE email LIKE 'test-f003-%@test.co'`);
  await db.execute(sql`DELETE FROM companies WHERE name = ${COMPANY_NAME}`);

  // Create company
  const [company] = await db
    .insert(companies)
    .values({
      name: COMPANY_NAME,
      cnpj: "99999999000303",
      phone: "11999999303",
      email: "test@f003.co",
      address: "Test St F003",
      lat: "-23.5505",
      lng: "-46.6333",
    })
    .returning();
  companyId = company.id;

  // Create auth users
  courierProfileId = crypto.randomUUID();
  operatorProfileId = crypto.randomUUID();
  shopProfileId = crypto.randomUUID();

  await db.execute(sql`
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, aud, role, created_at, updated_at, confirmation_token)
    VALUES
      (${courierProfileId}, '00000000-0000-0000-0000-000000000000', 'test-f003-courier@test.co', '$2a$10$test', 'authenticated', 'authenticated', now(), now(), ''),
      (${operatorProfileId}, '00000000-0000-0000-0000-000000000000', 'test-f003-operator@test.co', '$2a$10$test', 'authenticated', 'authenticated', now(), now(), ''),
      (${shopProfileId}, '00000000-0000-0000-0000-000000000000', 'test-f003-shop@test.co', '$2a$10$test', 'authenticated', 'authenticated', now(), now(), '')
    ON CONFLICT (id) DO NOTHING
  `);

  // Create profiles
  await db.insert(profiles).values([
    { id: courierProfileId, company_id: companyId, role: "courier", full_name: "Courier F003", phone: "11988888303" },
    { id: operatorProfileId, company_id: companyId, role: "operator", full_name: "Operator F003", phone: "11988888304" },
    { id: shopProfileId, company_id: companyId, role: "shop", full_name: "Shop F003", phone: "11988888305" },
  ]);

  // Create courier
  const [courier] = await db
    .insert(couriers)
    .values({
      company_id: companyId,
      profile_id: courierProfileId,
      full_name: "Courier F003",
      phone: "11988888303",
    })
    .returning();
  courierId = courier.id;

  // Create shop
  const [shop] = await db
    .insert(shops)
    .values({
      company_id: companyId,
      profile_id: shopProfileId,
      trade_name: "Loja Sabor F003",
      phone: "11977777303",
      address: "Shop St F003",
      lat: "-23.5505",
      lng: "-46.6333",
    })
    .returning();
  shopId = shop.id;

  // Create pricing table and rule
  const [pTable] = await db
    .insert(pricingTables)
    .values({ company_id: companyId, name: "Test F003 Table", active: true })
    .returning();
  pricingTableId = pTable.id;

  const [pRule] = await db
    .insert(pricingRules)
    .values({ pricing_table_id: pricingTableId, rule_type: "flat_rate", base_value: "10.00", priority: 1 })
    .returning();
  pricingRuleId = pRule.id;

  // Create deliveries at different dates:
  // - Today: 2 deliveries
  // - Yesterday: 1 delivery
  // - Last week (within current month): 1 delivery
  // - February (previous period): 2 deliveries
  const now = new Date();
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const lastWeekDate = new Date(todayDate);
  lastWeekDate.setDate(lastWeekDate.getDate() - 5);
  const febDate = new Date(2026, 1, 15); // Feb 15, 2026

  const deliveryDates = [
    { date: new Date(todayDate.getTime() + 10 * 3600000), price: 15, distance: 4 },
    { date: new Date(todayDate.getTime() + 14 * 3600000), price: 20, distance: 5 },
    { date: new Date(yesterdayDate.getTime() + 11 * 3600000), price: 25, distance: 6 },
    { date: new Date(lastWeekDate.getTime() + 12 * 3600000), price: 30, distance: 7 },
    { date: new Date(febDate.getTime() + 10 * 3600000), price: 18, distance: 3 },
    { date: new Date(febDate.getTime() + 14 * 3600000), price: 22, distance: 5 },
  ];

  const deliveryIds: string[] = [];

  for (let i = 0; i < deliveryDates.length; i++) {
    const { date, price, distance } = deliveryDates[i];

    const [order] = await db
      .insert(orders)
      .values({
        company_id: companyId,
        shop_id: shopId,
        order_number: i + 1,
        status: "delivered",
        pickup_address: "Pickup F003 " + i,
        delivery_address: "Delivery F003 " + i,
        pickup_lat: "-23.5505",
        pickup_lng: "-46.6333",
        delivery_lat: "-23.5605",
        delivery_lng: "-46.6433",
        recipient_name: "Recipient F003 " + i,
        recipient_phone: "119000003" + i.toString().padStart(2, "0"),
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
        delivered_at: date.toISOString(),
      })
      .returning();

    deliveryIds.push(delivery.id);

    await db.insert(deliveryPrices).values({
      delivery_id: delivery.id,
      company_id: companyId,
      pricing_table_id: pricingTableId,
      pricing_rule_id: pricingRuleId,
      estimated_distance_km: distance.toFixed(2),
      actual_distance_km: distance.toFixed(2),
      base_price: price.toFixed(2),
      surcharge_amount: "0.00",
      total_price: price.toFixed(2),
      calculated_at: new Date().toISOString(),
    });
  }

  // Create a financial closing for the Feb deliveries (to test closing_status)
  const [closing] = await db
    .insert(financialClosings)
    .values({
      company_id: companyId,
      courier_id: courierId,
      period_start: "2026-02-01",
      period_end: "2026-02-28",
      total_deliveries: 2,
      total_distance_km: "8.00",
      total_amount: "40.00",
      status: "paid",
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .returning();
  closingId = closing.id;

  // Link Feb deliveries to the closing
  for (let i = 4; i < 6; i++) {
    await db.insert(financialClosingItems).values({
      closing_id: closingId,
      delivery_id: deliveryIds[i],
      delivery_price: deliveryDates[i].price.toFixed(2),
      distance_km: deliveryDates[i].distance.toFixed(2),
      delivered_at: deliveryDates[i].date.toISOString(),
    });
  }

  // Create JWTs
  courierToken = await createJWT(courierProfileId, companyId, "courier");
  operatorToken = await createJWT(operatorProfileId, companyId, "operator");

  console.log("  Created company:", companyId);
  console.log("  Created courier:", courierId, "(profile:", courierProfileId, ")");
  console.log("  Created 6 deliveries (2 today, 1 yesterday, 1 last week, 2 February)");
  console.log("  Created financial closing for Feb deliveries (status: paid)");
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
  await db.execute(sql`DELETE FROM auth.users WHERE email LIKE 'test-f003-%@test.co'`);
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

async function apiWithToken(token: string, method: string, path: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const data = await res.json();
  return { status: res.status, data };
}

// --- TEST 1: GET /api/couriers/me/earnings returns list of deliveries ---
async function testListEarnings() {
  console.log("\n=== TEST 1: GET /api/couriers/me/earnings returns list of deliveries ===");

  const { status, data } = await apiWithToken(courierToken, "GET", "/couriers/me/earnings");

  assert(status === 200, `Status is 200 (got ${status})`);
  assert(Array.isArray(data), "Response is an array");
  assert(data.length === 6, `Has 6 deliveries (got ${data.length})`);

  // Each item has required fields
  const first = data[0];
  assert(!!first.delivery_id, "Has delivery_id");
  assert(!!first.delivered_at, "Has delivered_at (date)");
  assert(first.shop_name === "Loja Sabor F003", `Has shop_name 'Loja Sabor F003' (got '${first.shop_name}')`);
  assert(first.distance_km !== null && first.distance_km !== undefined, "Has distance_km");
  assert(!!first.value, "Has value (amount earned)");

  // Sorted newest first
  const dates = data.map((d: any) => new Date(d.delivered_at).getTime());
  let isSorted = true;
  for (let i = 1; i < dates.length; i++) {
    if (dates[i] > dates[i - 1]) { isSorted = false; break; }
  }
  assert(isSorted, "Results sorted by delivered_at DESC (newest first)");
}

// --- TEST 2: GET /api/couriers/me/earnings supports period filtering ---
async function testPeriodFilter() {
  console.log("\n=== TEST 2: GET /api/couriers/me/earnings supports period filtering ===");

  // Filter for Feb 14-16 only (narrow range to only catch the 2 Feb 15 deliveries)
  const { status, data } = await apiWithToken(
    courierToken,
    "GET",
    "/couriers/me/earnings?period_start=2026-02-14T00:00:00Z&period_end=2026-02-16T23:59:59Z"
  );

  assert(status === 200, `Status is 200 (got ${status})`);
  assert(data.length === 2, `Feb 14-16 has 2 deliveries (got ${data.length})`);

  // Verify the closing status is "paid" for Feb deliveries (linked to financial closing)
  for (const item of data) {
    assert(item.closing_status === "paid", `Closing status is 'paid' (got '${item.closing_status}')`);
  }

  // Filter for today only — should have 2
  const todayStr = new Date().toISOString().slice(0, 10);
  const { data: todayData } = await apiWithToken(
    courierToken,
    "GET",
    `/couriers/me/earnings?period_start=${todayStr}T00:00:00Z&period_end=${todayStr}T23:59:59Z`
  );
  assert(todayData.length === 2, `Today has 2 deliveries (got ${todayData.length})`);

  // Today's deliveries should have no closing (null)
  for (const item of todayData) {
    assert(item.closing_status === null, `Today delivery closing_status is null (got '${item.closing_status}')`);
  }
}

// --- TEST 3: GET /api/couriers/me/earnings/summary returns correct totals ---
async function testEarningsSummary() {
  console.log("\n=== TEST 3: GET /api/couriers/me/earnings/summary returns correct totals ===");

  const { status, data } = await apiWithToken(courierToken, "GET", "/couriers/me/earnings/summary");

  assert(status === 200, `Status is 200 (got ${status})`);

  // Today: 2 deliveries, prices 15 + 20 = 35
  assert(data.today !== undefined, "Has 'today' field");
  assert(parseFloat(data.today.total_amount) === 35, `Today total_amount is 35 (got ${data.today.total_amount})`);
  assert(data.today.total_deliveries === 2, `Today total_deliveries is 2 (got ${data.today.total_deliveries})`);

  // Week: today (35) + yesterday (25) + last_week_if_in_week
  // The exact week total depends on whether "lastWeekDate" falls within current week
  assert(data.week !== undefined, "Has 'week' field");
  assert(parseFloat(data.week.total_amount) >= 35, `Week total_amount >= 35 (got ${data.week.total_amount})`);
  assert(data.week.total_deliveries >= 2, `Week total_deliveries >= 2 (got ${data.week.total_deliveries})`);

  // Month: today (35) + yesterday (25) + last_week (30) = at least 90 if all in same month
  assert(data.month !== undefined, "Has 'month' field");
  assert(parseFloat(data.month.total_amount) >= 35, `Month total_amount >= 35 (got ${data.month.total_amount})`);
  assert(data.month.total_deliveries >= 2, `Month total_deliveries >= 2 (got ${data.month.total_deliveries})`);
}

// --- TEST 4: Non-courier roles get 403 ---
async function testNonCourierAccess() {
  console.log("\n=== TEST 4: Non-courier roles get 403 ===");

  // Operator trying to access courier earnings
  const { status: s1, data: d1 } = await apiWithToken(operatorToken, "GET", "/couriers/me/earnings");
  assert(s1 === 403, `Operator gets 403 on /earnings (got ${s1})`);
  assert(d1.error === "Forbidden", `Error is 'Forbidden' (got '${d1.error}')`);

  const { status: s2 } = await apiWithToken(operatorToken, "GET", "/couriers/me/earnings/summary");
  assert(s2 === 403, `Operator gets 403 on /earnings/summary (got ${s2})`);

  // No auth token
  const noAuthRes = await fetch(`${BASE_URL}/couriers/me/earnings`);
  assert(noAuthRes.status === 401, `No token gets 401 (got ${noAuthRes.status})`);
}

async function main() {
  try {
    await setup();
    console.log("\n=== Testing against backbone at", BASE_URL, "===\n");

    await testListEarnings();
    await testPeriodFilter();
    await testEarningsSummary();
    await testNonCourierAccess();

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
