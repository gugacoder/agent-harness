import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3003";

const PAGES = [
  "/",
  "/faturas",
  "/nova",
  "/historico",
  "/enderecos",
  "/perfil",
  "/docs",
];

test("lojista: login and navigate all pages", async ({ page }) => {
  const allErrors = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      allErrors.push({ page: page.url(), type: "console.error", text: msg.text() });
    }
  });
  page.on("pageerror", (err) => {
    allErrors.push({ page: page.url(), type: "pageerror", text: err.message });
  });

  // Login
  await page.goto(`${BASE}/login`);
  await page.fill('input[name="email"]', "lojista@mail.com");
  await page.fill('input[name="password"]', "12345678");
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/`, { timeout: 10000 });
  await page.waitForLoadState("networkidle");
  console.log("✓ Logged in successfully");

  // Navigate each page
  for (const path of PAGES) {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const safeName = path.replace(/\//g, "_") || "home";
    await page.screenshot({ path: `.tmp/lojista-page${safeName}.png`, fullPage: true });

    // Check UserMenu avatar
    const avatar = page.locator('button[aria-label="Menu do usuário"]');
    const avatarVisible = await avatar.isVisible().catch(() => false);
    console.log(`[${path}] Avatar menu visible: ${avatarVisible}`);

    if (avatarVisible) {
      await avatar.click();
      await page.waitForTimeout(300);

      const sair = page.locator("text=Sair");
      const sairVisible = await sair.isVisible().catch(() => false);
      console.log(`[${path}] Dropdown "Sair" visible: ${sairVisible}`);

      const tema = page.locator("text=Tema");
      const temaVisible = await tema.isVisible().catch(() => false);
      console.log(`[${path}] Dropdown "Tema" visible: ${temaVisible}`);

      // Close by clicking body
      await page.locator("header").click();
      await page.waitForTimeout(200);
    }

    // Check Help button
    const help = page.locator('[title="Como funciona"]');
    const helpVisible = await help.first().isVisible().catch(() => false);
    console.log(`[${path}] Help button visible: ${helpVisible}`);
  }

  // Report all errors
  if (allErrors.length) {
    console.log("\n=== ALL CONSOLE ERRORS ===");
    for (const e of allErrors) {
      console.log(`  [${e.type}] ${e.page} → ${e.text.slice(0, 200)}`);
    }
  } else {
    console.log("\n✓ No console errors across all pages");
  }

  // Fail on pageerrors (real JS exceptions)
  const critical = allErrors.filter((e) => e.type === "pageerror");
  expect(critical, "Critical JS errors found").toHaveLength(0);
});
