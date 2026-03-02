import { chromium } from 'playwright';

const browser = await chromium.connectOverCDP('http://localhost:9222');
const page = browser.contexts()[0].pages()[0];

// Verify user
const token = await page.evaluate(() => {
  const raw = localStorage.getItem('sb-localhost-auth-token');
  if (!raw) return null;
  return JSON.parse(raw).access_token || null;
});
if (token) {
  const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
  console.log('User:', payload.email, '| Role:', payload.app_metadata?.role);
}

const errors = [];
page.on('console', msg => {
  if (msg.type() === 'error') errors.push(`[console] ${msg.text()}`);
});
page.on('response', res => {
  if (res.status() >= 400 && res.url().includes('/api/')) {
    errors.push(`[HTTP ${res.status()}] ${res.url()}`);
  }
});

// Check all motoboy pages
const routes = ['/', '/extrato', '/status', '/historico', '/perfil', '/docs'];
for (const route of routes) {
  errors.length = 0;
  await page.goto(`http://localhost:3004${route}`, { waitUntil: 'networkidle' });
  await new Promise(r => setTimeout(r, 2000));
  if (errors.length === 0) {
    console.log(`${route}: OK`);
  } else {
    console.log(`${route}: ${errors.length} errors`);
    for (const e of errors) console.log(`  ${e}`);
  }
}
