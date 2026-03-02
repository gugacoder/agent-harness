// Playwright login test for all 3 frontend apps
// All apps default to OTP login but have a "Entrar com email e senha" fallback

import { test, expect } from '@playwright/test';

const apps = [
  { name: 'Central', url: 'http://localhost:3002', email: 'central@mail.com', password: '12345678' },
  { name: 'Lojista', url: 'http://localhost:3003', email: 'lojista@mail.com', password: '12345678' },
  { name: 'Motoboy', url: 'http://localhost:3004', email: 'motoboy@mail.com', password: '12345678' },
];

for (const app of apps) {
  test(`Login ${app.name} (${app.email})`, async ({ page }) => {
    // Go to the app
    await page.goto(app.url, { waitUntil: 'networkidle', timeout: 15000 });

    // All apps default to OTP mode. Click "Entrar com email e senha" to switch.
    const passwordModeButton = page.getByText('Entrar com email e senha');
    await expect(passwordModeButton).toBeVisible({ timeout: 10000 });
    await passwordModeButton.click();

    // Now we should see email + password fields
    const emailInput = page.locator('#email');
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await emailInput.fill(app.email);

    const passwordInput = page.locator('#password');
    await expect(passwordInput).toBeVisible({ timeout: 5000 });
    await passwordInput.fill(app.password);

    // Submit
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Wait for navigation away from login page
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 });

    const currentUrl = page.url();
    console.log(`  ${app.name}: logged in successfully -> ${currentUrl}`);

    // Take a screenshot
    await page.screenshot({ path: `.tmp/login-${app.name.toLowerCase()}.png` });
  });
}
