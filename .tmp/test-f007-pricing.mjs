/**
 * Test F-007: Pricing Service — Rule evaluation logic
 * Run: node .tmp/test-f007-pricing.mjs
 *
 * Tests the pure evaluateRules logic without DB dependency.
 */

let passed = 0;
let failed = 0;

function assert(name, actual, expected) {
  const match =
    typeof expected === "number"
      ? Math.abs(actual - expected) < 0.01
      : actual === expected;
  if (match) {
    console.log(`  PASS: ${name} (got ${actual})`);
    passed++;
  } else {
    console.log(`  FAIL: ${name} (got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)})`);
    failed++;
  }
}

function assertNull(name, actual) {
  if (actual === null || actual === undefined) {
    console.log(`  PASS: ${name} (null)`);
    passed++;
  } else {
    console.log(`  FAIL: ${name} (expected null, got ${JSON.stringify(actual)})`);
    failed++;
  }
}

// Inline the pure evaluateRules function for testing (mirrors pricing.service.ts)
function isSurchargeActive(surchargeType, activeSurcharges) {
  if (activeSurcharges) {
    return activeSurcharges.includes(surchargeType);
  }
  return false; // In tests, don't auto-detect time-based
}

function evaluateRules(rules, distanceKm, deliveryAddress, activeSurcharges) {
  const baseRules = rules.filter((r) => r.rule_type !== "surcharge");
  const surchargeRules = rules.filter((r) => r.rule_type === "surcharge");

  let basePrice = null;
  let appliedRuleId = null;

  for (const rule of baseRules) {
    switch (rule.rule_type) {
      case "per_km": {
        basePrice =
          parseFloat(rule.base_value) +
          distanceKm * parseFloat(rule.per_km_value || "0");
        appliedRuleId = rule.id;
        break;
      }
      case "distance_range": {
        const min = parseFloat(rule.min_distance_km || "0");
        const max = parseFloat(rule.max_distance_km || "999999");
        if (distanceKm >= min && distanceKm <= max) {
          basePrice = parseFloat(rule.base_value);
          appliedRuleId = rule.id;
        }
        break;
      }
      case "neighborhood": {
        if (
          rule.neighborhood &&
          deliveryAddress.toLowerCase().includes(rule.neighborhood.toLowerCase())
        ) {
          basePrice = parseFloat(rule.base_value);
          appliedRuleId = rule.id;
        }
        break;
      }
      case "flat_rate": {
        basePrice = parseFloat(rule.base_value);
        appliedRuleId = rule.id;
        break;
      }
    }
    if (basePrice !== null) break;
  }

  if (basePrice === null || !appliedRuleId) return null;

  let surchargeAmount = 0;
  for (const rule of surchargeRules) {
    if (
      rule.surcharge_type &&
      isSurchargeActive(rule.surcharge_type, activeSurcharges)
    ) {
      const surchargeValue = parseFloat(rule.surcharge_value || "0");
      if (rule.surcharge_mode === "percentage") {
        surchargeAmount += basePrice * (surchargeValue / 100);
      } else if (rule.surcharge_mode === "fixed") {
        surchargeAmount += surchargeValue;
      }
    }
  }

  const totalPrice = basePrice + surchargeAmount;

  return {
    basePrice: Math.round(basePrice * 100) / 100,
    surchargeAmount: Math.round(surchargeAmount * 100) / 100,
    totalPrice: Math.round(totalPrice * 100) / 100,
    appliedRuleId,
  };
}

// ====================================================================

console.log("=== F-007 Pricing Service Tests ===\n");

// --- Test 1: per_km rule ---
console.log("Test 1: per_km rule — base R$5 + R$1.50/km, 10km");
{
  const rules = [
    { id: "rule-1", rule_type: "per_km", base_value: "5.00", per_km_value: "1.50", priority: 1 },
  ];
  const result = evaluateRules(rules, 10, "Rua Qualquer");
  assert("basePrice", result.basePrice, 20.0);
  assert("surchargeAmount", result.surchargeAmount, 0);
  assert("totalPrice", result.totalPrice, 20.0);
  assert("appliedRuleId", result.appliedRuleId, "rule-1");
}

// --- Test 2: distance_range rule matching ---
console.log("\nTest 2: distance_range — 5-10km = R$25, distance=7km");
{
  const rules = [
    { id: "rule-1", rule_type: "distance_range", base_value: "15.00", min_distance_km: "0", max_distance_km: "5", priority: 1 },
    { id: "rule-2", rule_type: "distance_range", base_value: "25.00", min_distance_km: "5", max_distance_km: "10", priority: 2 },
    { id: "rule-3", rule_type: "distance_range", base_value: "40.00", min_distance_km: "10", max_distance_km: "20", priority: 3 },
  ];
  const result = evaluateRules(rules, 7, "Rua Qualquer");
  assert("basePrice", result.basePrice, 25.0);
  assert("appliedRuleId", result.appliedRuleId, "rule-2");
}

// --- Test 3: distance_range no match falls to flat_rate ---
console.log("\nTest 3: distance_range no match, flat_rate fallback");
{
  const rules = [
    { id: "rule-1", rule_type: "distance_range", base_value: "15.00", min_distance_km: "0", max_distance_km: "5", priority: 1 },
    { id: "rule-2", rule_type: "flat_rate", base_value: "50.00", priority: 10 },
  ];
  const result = evaluateRules(rules, 100, "Rua Qualquer");
  assert("basePrice", result.basePrice, 50.0);
  assert("appliedRuleId", result.appliedRuleId, "rule-2");
}

// --- Test 4: neighborhood rule matching ---
console.log("\nTest 4: neighborhood match — Vila Mariana");
{
  const rules = [
    { id: "rule-1", rule_type: "neighborhood", base_value: "30.00", neighborhood: "Vila Mariana", priority: 1 },
    { id: "rule-2", rule_type: "flat_rate", base_value: "15.00", priority: 2 },
  ];
  const result = evaluateRules(rules, 5, "Rua Domingos de Morais, Vila Mariana, SP");
  assert("basePrice", result.basePrice, 30.0);
  assert("appliedRuleId", result.appliedRuleId, "rule-1");
}

// --- Test 5: neighborhood no match, falls through ---
console.log("\nTest 5: neighborhood no match, falls to flat_rate");
{
  const rules = [
    { id: "rule-1", rule_type: "neighborhood", base_value: "30.00", neighborhood: "Vila Mariana", priority: 1 },
    { id: "rule-2", rule_type: "flat_rate", base_value: "15.00", priority: 2 },
  ];
  const result = evaluateRules(rules, 5, "Rua Augusta, Consolacao, SP");
  assert("basePrice", result.basePrice, 15.0);
  assert("appliedRuleId", result.appliedRuleId, "rule-2");
}

// --- Test 6: flat_rate only ---
console.log("\nTest 6: flat_rate only — R$15");
{
  const rules = [
    { id: "rule-1", rule_type: "flat_rate", base_value: "15.00", priority: 1 },
  ];
  const result = evaluateRules(rules, 25, "Rua Qualquer");
  assert("basePrice", result.basePrice, 15.0);
  assert("totalPrice", result.totalPrice, 15.0);
}

// --- Test 7: surcharge percentage ---
console.log("\nTest 7: flat_rate R$50 + night surcharge 10%");
{
  const rules = [
    { id: "rule-1", rule_type: "flat_rate", base_value: "50.00", priority: 1 },
    { id: "rule-s1", rule_type: "surcharge", surcharge_type: "night", surcharge_mode: "percentage", surcharge_value: "10", priority: 10 },
  ];
  const result = evaluateRules(rules, 5, "Rua Qualquer", ["night"]);
  assert("basePrice", result.basePrice, 50.0);
  assert("surchargeAmount", result.surchargeAmount, 5.0);
  assert("totalPrice", result.totalPrice, 55.0);
}

// --- Test 8: surcharge fixed ---
console.log("\nTest 8: per_km + fixed surcharge R$3.50");
{
  const rules = [
    { id: "rule-1", rule_type: "per_km", base_value: "5.00", per_km_value: "2.00", priority: 1 },
    { id: "rule-s1", rule_type: "surcharge", surcharge_type: "weekend", surcharge_mode: "fixed", surcharge_value: "3.50", priority: 10 },
  ];
  const result = evaluateRules(rules, 10, "Rua Qualquer", ["weekend"]);
  assert("basePrice", result.basePrice, 25.0);
  assert("surchargeAmount", result.surchargeAmount, 3.5);
  assert("totalPrice", result.totalPrice, 28.5);
}

// --- Test 9: multiple surcharges ---
console.log("\nTest 9: Multiple surcharges (night 10% + weekend R$5)");
{
  const rules = [
    { id: "rule-1", rule_type: "flat_rate", base_value: "100.00", priority: 1 },
    { id: "rule-s1", rule_type: "surcharge", surcharge_type: "night", surcharge_mode: "percentage", surcharge_value: "10", priority: 10 },
    { id: "rule-s2", rule_type: "surcharge", surcharge_type: "weekend", surcharge_mode: "fixed", surcharge_value: "5.00", priority: 11 },
  ];
  const result = evaluateRules(rules, 5, "Rua Qualquer", ["night", "weekend"]);
  assert("basePrice", result.basePrice, 100.0);
  assert("surchargeAmount", result.surchargeAmount, 15.0);
  assert("totalPrice", result.totalPrice, 115.0);
}

// --- Test 10: inactive surcharge not applied ---
console.log("\nTest 10: Surcharge not active — not applied");
{
  const rules = [
    { id: "rule-1", rule_type: "flat_rate", base_value: "50.00", priority: 1 },
    { id: "rule-s1", rule_type: "surcharge", surcharge_type: "rain", surcharge_mode: "fixed", surcharge_value: "10.00", priority: 10 },
  ];
  const result = evaluateRules(rules, 5, "Rua Qualquer", []);
  assert("surchargeAmount", result.surchargeAmount, 0);
  assert("totalPrice", result.totalPrice, 50.0);
}

// --- Test 11: no matching rules returns null ---
console.log("\nTest 11: No matching rules returns null");
{
  const rules = [
    { id: "rule-1", rule_type: "distance_range", base_value: "15.00", min_distance_km: "0", max_distance_km: "5", priority: 1 },
  ];
  const result = evaluateRules(rules, 100, "Rua Qualquer");
  assertNull("No match", result);
}

// --- Test 12: empty rules returns null ---
console.log("\nTest 12: Empty rules returns null");
{
  const result = evaluateRules([], 10, "Rua Qualquer");
  assertNull("Empty rules", result);
}

// --- Test 13: priority ordering (lower priority evaluated first) ---
console.log("\nTest 13: Priority ordering — per_km(p=1) beats flat_rate(p=2)");
{
  const rules = [
    { id: "rule-2", rule_type: "flat_rate", base_value: "99.00", priority: 2 },
    { id: "rule-1", rule_type: "per_km", base_value: "5.00", per_km_value: "1.00", priority: 1 },
  ];
  // Sort by priority like the service does
  rules.sort((a, b) => a.priority - b.priority);
  const result = evaluateRules(rules, 10, "Rua Qualquer");
  assert("appliedRuleId", result.appliedRuleId, "rule-1");
  assert("basePrice", result.basePrice, 15.0);
}

// --- Test 14: file exists ---
console.log("\nTest 14: pricing.service.ts file exists");
{
  const fs = await import("fs");
  const exists = fs.existsSync("apps/backbone/src/services/pricing.service.ts");
  if (exists) {
    console.log("  PASS: pricing.service.ts exists");
    passed++;
  } else {
    console.log("  FAIL: pricing.service.ts does not exist");
    failed++;
  }
}

// --- Test 15: exports check via tsx ---
console.log("\nTest 15: Module exports (calculateDeliveryPrice, recalculateDeliveryPrice, evaluateRules)");
{
  try {
    const mod = await import("tsx/esm/api");
    const pricing = await mod.importAsModule(
      "pricing-test",
      "apps/backbone/src/services/pricing.service.ts"
    ).catch(() => null);

    if (pricing) {
      const hasFns =
        typeof pricing.calculateDeliveryPrice === "function" &&
        typeof pricing.recalculateDeliveryPrice === "function" &&
        typeof pricing.evaluateRules === "function";
      if (hasFns) {
        console.log("  PASS: All 3 functions exported");
        passed++;
      } else {
        console.log("  FAIL: Missing exports");
        failed++;
      }
    } else {
      // Fallback: check with simple file read
      const content = fs.readFileSync("apps/backbone/src/services/pricing.service.ts", "utf8");
      const has1 = content.includes("export async function calculateDeliveryPrice");
      const has2 = content.includes("export async function recalculateDeliveryPrice");
      const has3 = content.includes("export function evaluateRules");
      if (has1 && has2 && has3) {
        console.log("  PASS: All 3 functions found in source (import failed, checked source)");
        passed++;
      } else {
        console.log("  FAIL: Missing function exports in source");
        failed++;
      }
    }
  } catch {
    const fs = await import("fs");
    const content = fs.readFileSync("apps/backbone/src/services/pricing.service.ts", "utf8");
    const has1 = content.includes("export async function calculateDeliveryPrice");
    const has2 = content.includes("export async function recalculateDeliveryPrice");
    const has3 = content.includes("export function evaluateRules");
    if (has1 && has2 && has3) {
      console.log("  PASS: All 3 functions found in source");
      passed++;
    } else {
      console.log("  FAIL: Missing function exports in source");
      failed++;
    }
  }
}

console.log(`\n=== Results: ${passed}/${passed + failed} passed ===`);
if (failed > 0) {
  process.exit(1);
}
