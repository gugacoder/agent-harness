/**
 * Test F-008: Pricing Routes — Structure and registration verification
 * Run: node .tmp/test-f008-pricing-routes.mjs
 *
 * Verifies route file exists, exports correctly, and is registered in index.ts.
 * Also checks all expected endpoints are defined.
 */

import { readFileSync, existsSync } from "fs";

let passed = 0;
let failed = 0;

function assert(name, condition) {
  if (condition) {
    console.log(`  PASS: ${name}`);
    passed++;
  } else {
    console.log(`  FAIL: ${name}`);
    failed++;
  }
}

const routeFile = "apps/backbone/src/routes/pricing.ts";
const indexFile = "apps/backbone/src/index.ts";

// --- Test 1: File exists ---
console.log("\n=== F-008: Route File Existence ===");
assert("pricing.ts exists in routes/", existsSync(routeFile));

// --- Test 2: File exports pricingRouter ---
console.log("\n=== F-008: Exports ===");
const routeContent = readFileSync(routeFile, "utf-8");
assert("exports pricingRouter", routeContent.includes("export { pricingRouter }"));

// --- Test 3: Uses OpenAPIHono pattern ---
console.log("\n=== F-008: OpenAPIHono Pattern ===");
assert("imports OpenAPIHono, createRoute, z", routeContent.includes('import { OpenAPIHono, createRoute, z }'));
assert("creates OpenAPIHono router", routeContent.includes("new OpenAPIHono<AppType>"));
assert("applies authMiddleware", routeContent.includes("authMiddleware"));
assert("applies companyMiddleware", routeContent.includes("companyMiddleware"));

// --- Test 4: CRUD routes for pricing tables ---
console.log("\n=== F-008: Pricing Tables CRUD ===");
assert("GET /pricing-tables (list)", routeContent.includes('path: "/pricing-tables"') && routeContent.includes('method: "get"'));
assert("POST /pricing-tables (create)", routeContent.includes('path: "/pricing-tables"') && routeContent.includes('method: "post"'));
assert("PATCH /pricing-tables/{id} (update)", routeContent.includes('path: "/pricing-tables/{id}"') && routeContent.includes('method: "patch"'));
assert("DELETE /pricing-tables/{id} (delete)", routeContent.includes('path: "/pricing-tables/{id}"') && routeContent.includes('method: "delete"'));

// --- Test 5: CRUD routes for pricing rules ---
console.log("\n=== F-008: Pricing Rules CRUD ===");
assert("GET /pricing-tables/{id}/rules (list)", routeContent.includes('path: "/pricing-tables/{id}/rules"'));
assert("POST /pricing-tables/{id}/rules (create)", routeContent.includes('path: "/pricing-tables/{id}/rules"'));
assert("PATCH /pricing-rules/{id} (update)", routeContent.includes('path: "/pricing-rules/{id}"'));
assert("DELETE /pricing-rules/{id} (delete)", routeContent.includes('path: "/pricing-rules/{id}"'));

// --- Test 6: Simulate endpoint ---
console.log("\n=== F-008: Simulation ===");
assert("POST /pricing-tables/{id}/simulate", routeContent.includes('path: "/pricing-tables/{id}/simulate"'));
assert("uses evaluateRules from pricing.service", routeContent.includes('evaluateRules'));
assert("simulation does not persist (no db.insert in simulate handler)", (() => {
  // Find the simulate handler section
  const simulateIdx = routeContent.indexOf("simulatePriceRoute");
  const simulateSection = routeContent.slice(simulateIdx, routeContent.indexOf("pricing-override", simulateIdx));
  return !simulateSection.includes("db.insert");
})());

// --- Test 7: Shop pricing override routes ---
console.log("\n=== F-008: Shop Pricing Overrides ===");
assert("GET /shops/{id}/pricing-override", routeContent.includes('path: "/shops/{id}/pricing-override"'));
assert("PUT /shops/{id}/pricing-override (set/update)", routeContent.includes('method: "put"'));
assert("DELETE /shops/{id}/pricing-override (remove)", (() => {
  // Check there's a delete route for pricing override
  const overrideIdx = routeContent.lastIndexOf('"/shops/{id}/pricing-override"');
  const beforeOverride = routeContent.slice(Math.max(0, overrideIdx - 200), overrideIdx);
  return beforeOverride.includes('"delete"');
})());

// --- Test 8: Activation logic ---
console.log("\n=== F-008: Activation Logic ===");
assert("deactivates previous active table on create", (() => {
  const createIdx = routeContent.indexOf("createPricingTableRoute,");
  const createSection = routeContent.slice(createIdx, routeContent.indexOf("updatePricingTableRoute"));
  return createSection.includes("active: false") && createSection.includes("body.active");
})());
assert("deactivates previous active table on update", (() => {
  const updateIdx = routeContent.indexOf("updatePricingTableRoute,");
  const updateSection = routeContent.slice(updateIdx, routeContent.indexOf("deletePricingTableRoute"));
  return updateSection.includes("active: false") && updateSection.includes("body.active === true");
})());

// --- Test 9: Delete protection ---
console.log("\n=== F-008: Delete Protection ===");
assert("checks deliveryPrices before delete", routeContent.includes("deliveryPrices") && routeContent.includes("Cannot delete pricing table"));

// --- Test 10: Multi-tenancy ---
console.log("\n=== F-008: Multi-Tenancy ===");
assert("filters by companyId", routeContent.includes('c.get("companyId")'));
assert("uses company_id in queries", routeContent.includes("company_id, companyId") || routeContent.includes("company_id: companyId"));

// --- Test 11: Registered in index.ts ---
console.log("\n=== F-008: Router Registration ===");
const indexContent = readFileSync(indexFile, "utf-8");
assert("imported in index.ts", indexContent.includes('import { pricingRouter }'));
assert("mounted via app.route()", indexContent.includes('app.route("/", pricingRouter)'));

// --- Summary ---
console.log(`\n=== Results: ${passed}/${passed + failed} passed ===`);
if (failed > 0) {
  process.exit(1);
}
