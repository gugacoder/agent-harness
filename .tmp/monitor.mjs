import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/gugac/AppData/Roaming/npm/node_modules/playwright");

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();

// Login
await page.goto("http://localhost:3004/login", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2000);

const emailInput = page.locator('input[type="email"]');
if (await emailInput.isVisible()) {
  await emailInput.fill("motoboy@mail.com");
  await page.fill('input[type="password"]', "12345678");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
}

// Navigate to /status
if (!page.url().includes("/status")) {
  await page.goto("http://localhost:3004/status", { waitUntil: "domcontentloaded" });
}

console.log("Browser open at", page.url());
console.log("Press Ctrl+C to close.");

// Keep alive
await new Promise(() => {});
