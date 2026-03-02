import { chromium } from 'playwright';

const browser = await chromium.connectOverCDP('http://localhost:9222');
const page = browser.contexts()[0].pages()[0];

const token = await page.evaluate(() => {
  const raw = localStorage.getItem('sb-localhost-auth-token');
  if (!raw) return null;
  return JSON.parse(raw).access_token || null;
});

if (token) {
  const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
  console.log('User:', payload.email, '| Role:', payload.app_metadata?.role);
}

const endpoints = [
  '/api/couriers/me',
  '/api/company/config',
  '/api/couriers/me/earnings/summary',
  '/api/couriers/me/earnings?period_start=2026-03-01&period_end=2026-03-02',
];

for (const ep of endpoints) {
  const res = await fetch(`http://localhost:3005${ep}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const body = await res.text();
  console.log(`[${res.status}] ${ep}`);
  if (res.status >= 400) console.log(`  ${body.substring(0, 200)}`);
}
