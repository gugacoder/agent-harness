import { chromium } from "playwright";

const BASE = "http://localhost:3003";
const PAGES = [
  { path: "/", label: "Pedidos (home)" },
  { path: "/faturas", label: "Faturas" },
  { path: "/nova", label: "Nova Entrega" },
  { path: "/historico", label: "Histórico" },
  { path: "/enderecos", label: "Endereços" },
  { path: "/perfil", label: "Meu Perfil" },
  { path: "/docs", label: "Ajuda / Docs" },
];

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const allErrors = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      allErrors.push({ url: page.url(), type: "console.error", text: msg.text() });
    }
  });
  page.on("pageerror", (err) => {
    allErrors.push({ url: page.url(), type: "pageerror", text: err.message });
  });

  // Login
  console.log("--- Logging in ---");
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState("networkidle");

  // Click "Entrar com email e senha" to reveal the form
  await page.click('button:has-text("Entrar com email e senha")');
  await page.waitForTimeout(500);

  await page.fill('input[name="email"]', "lojista@mail.com");
  await page.fill('input[name="password"]', "12345678");
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/`, { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  console.log("✓ Logged in");

  // Navigate each page
  for (const { path, label } of PAGES) {
    console.log(`\n--- ${label} (${path}) ---`);
    const errorsBefore = allErrors.length;

    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);

    const safeName = label.replace(/[^a-zA-Z0-9]/g, "_");
    await page.screenshot({ path: `.tmp/lojista-${safeName}.png`, fullPage: true });

    // Check UserMenu avatar
    const avatar = page.locator('button[aria-label="Menu do usuário"]');
    const avatarVisible = await avatar.isVisible().catch(() => false);
    console.log(`  Avatar menu: ${avatarVisible ? "✓" : "✗ NOT FOUND"}`);

    if (avatarVisible) {
      await avatar.click();
      await page.waitForTimeout(300);

      const sair = page.locator("text=Sair");
      const sairOk = await sair.isVisible().catch(() => false);
      console.log(`  Dropdown "Sair": ${sairOk ? "✓" : "✗"}`);

      const tema = page.locator("text=Tema");
      const temaOk = await tema.isVisible().catch(() => false);
      console.log(`  Dropdown "Tema": ${temaOk ? "✓" : "✗"}`);

      const roleLabel = page.locator('.text-xs.text-muted-foreground:has-text("Lojista")');
      const roleOk = await roleLabel.isVisible().catch(() => false);
      console.log(`  Role label "Lojista": ${roleOk ? "✓" : "✗"}`);

      // Close dropdown
      await page.locator("header").click();
      await page.waitForTimeout(200);
    }

    // Check Help button
    const help = page.locator('[title="Como funciona"]');
    const helpOk = await help.first().isVisible().catch(() => false);
    console.log(`  Help button: ${helpOk ? "✓" : "✗ NOT FOUND"}`);

    const newErrors = allErrors.slice(errorsBefore);
    if (newErrors.length) {
      console.log(`  ⚠ ${newErrors.length} error(s):`);
      for (const e of newErrors) {
        console.log(`    [${e.type}] ${e.text.slice(0, 300)}`);
      }
    } else {
      console.log(`  No errors ✓`);
    }
  }

  // Summary
  console.log("\n\n========== SUMMARY ==========");
  if (allErrors.length === 0) {
    console.log("✓ All pages clean — no console errors or page errors");
  } else {
    console.log(`⚠ Total errors: ${allErrors.length}`);
    for (const e of allErrors) {
      console.log(`  [${e.type}] ${e.url} → ${e.text.slice(0, 300)}`);
    }
  }

  const critical = allErrors.filter((e) => e.type === "pageerror");
  if (critical.length) {
    console.log(`\n✗ CRITICAL: ${critical.length} page error(s) found!`);
  }

  await browser.close();
  process.exit(critical.length > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
