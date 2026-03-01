/**
 * F-009 — Rotas de Configuracao da Empresa — Structure Tests
 *
 * Validates:
 * 1. File company-config.ts exists in routes/
 * 2. Exports companyConfigRouter
 * 3. GET /api/company/config route defined
 * 4. PATCH /api/company/config route defined
 * 5. Upsert logic creates config with defaults (ensureConfig helper)
 * 6. Route registered in app index
 * 7. UpdateCompanyConfigRequestSchema validates correct input
 * 8. UpdateCompanyConfigRequestSchema rejects invalid input
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(
  "D:/sources/_unowned/agent-harness/.harness/worktrees/PRP-001-foundation-schemas-pricing"
);

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  PASS: ${name}`);
  } catch (e) {
    failed++;
    console.log(`  FAIL: ${name} — ${e.message}`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "Assertion failed");
}

console.log("=== F-009 Structure Tests ===\n");

// --- Test 1: File exists ---
const routeFile = resolve(ROOT, "apps/backbone/src/routes/company-config.ts");
test("company-config.ts exists in routes/", () => {
  assert(existsSync(routeFile), "File not found: " + routeFile);
});

// --- Read source for pattern tests ---
const src = readFileSync(routeFile, "utf-8");

// --- Test 2: Exports companyConfigRouter ---
test("Exports companyConfigRouter", () => {
  assert(
    src.includes("export { companyConfigRouter }") ||
      src.includes("export const companyConfigRouter"),
    "Missing export of companyConfigRouter"
  );
});

// --- Test 3: GET /company/config route defined ---
test("GET /company/config route defined", () => {
  assert(src.includes('method: "get"'), "Missing GET method");
  assert(
    src.includes('path: "/company/config"'),
    'Missing path "/company/config"'
  );
});

// --- Test 4: PATCH /company/config route defined ---
test("PATCH /company/config route defined", () => {
  assert(src.includes('method: "patch"'), "Missing PATCH method");
  // path already checked above, verify we have two route definitions
  const routeCount = (src.match(/createRoute\(/g) || []).length;
  assert(routeCount >= 2, `Expected at least 2 createRoute calls, got ${routeCount}`);
});

// --- Test 5: Upsert logic (ensureConfig) ---
test("Upsert logic with defaults (ensureConfig helper)", () => {
  assert(
    src.includes("ensureConfig"),
    "Missing ensureConfig helper for upsert logic"
  );
  // Verify it does an insert when not found
  assert(
    src.includes(".insert(companyConfigs)"),
    "ensureConfig should insert when config not found"
  );
});

// --- Test 6: Route registered in app index ---
const indexFile = resolve(ROOT, "apps/backbone/src/index.ts");
const indexSrc = readFileSync(indexFile, "utf-8");
test("Route registered in app index.ts", () => {
  assert(
    indexSrc.includes('import { companyConfigRouter }'),
    "Missing import of companyConfigRouter in index.ts"
  );
  assert(
    indexSrc.includes('app.route("/", companyConfigRouter)'),
    "Missing app.route registration for companyConfigRouter"
  );
});

// --- Test 7: UpdateCompanyConfigRequestSchema validates correct fields ---
test("UpdateCompanyConfigRequestSchema includes pod_required, closing/invoice period", () => {
  assert(src.includes("pod_required"), "Missing pod_required field");
  assert(
    src.includes("default_closing_period"),
    "Missing default_closing_period field"
  );
  assert(
    src.includes("default_invoice_period"),
    "Missing default_invoice_period field"
  );
});

// --- Test 8: Uses auth and company middleware ---
test("Uses auth and company middleware", () => {
  assert(src.includes("authMiddleware"), "Missing authMiddleware");
  assert(src.includes("companyMiddleware"), "Missing companyMiddleware");
});

// --- Test 9: Response schema includes all company config fields ---
test("Response schema includes all required fields", () => {
  assert(
    src.includes("CompanyConfigResponseSchema"),
    "Missing CompanyConfigResponseSchema"
  );
  // Check it includes essential fields
  for (const field of [
    "id",
    "company_id",
    "pod_required",
    "default_closing_period",
    "default_invoice_period",
    "created_at",
    "updated_at",
  ]) {
    assert(src.includes(field), `Missing field: ${field}`);
  }
});

// --- Test 10: Multi-tenancy - queries filter by companyId ---
test("Multi-tenancy: queries filter by companyId", () => {
  assert(
    src.includes('c.get("companyId")'),
    "Missing companyId from context"
  );
  assert(
    src.includes("companyConfigs.company_id"),
    "Missing company_id filter in queries"
  );
});

// --- Test 11: PATCH updates timestamp ---
test("PATCH updates updated_at timestamp", () => {
  assert(
    src.includes("updated_at") && src.includes("new Date().toISOString()"),
    "PATCH should update updated_at field"
  );
});

// --- Test 12: ClosingPeriod enum values ---
test("Uses correct ClosingPeriod enum values (daily, weekly, monthly)", () => {
  assert(src.includes('"daily"'), "Missing daily enum value");
  assert(src.includes('"weekly"'), "Missing weekly enum value");
  assert(src.includes('"monthly"'), "Missing monthly enum value");
});

console.log(`\n=== Results: ${passed} passed, ${failed} failed out of ${passed + failed} ===`);
process.exit(failed > 0 ? 1 : 0);
