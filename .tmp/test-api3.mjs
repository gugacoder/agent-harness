import { chromium } from 'playwright';

const browser = await chromium.connectOverCDP('http://localhost:9222');
const page = browser.contexts()[0].pages()[0];

const token = await page.evaluate(() => {
  const raw = localStorage.getItem('sb-localhost-auth-token');
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  return parsed.access_token || null;
});

console.log('Token found:', !!token);

const endpoints = [
  '/api/company/config',
  '/api/profiles/me',
  '/api/onboarding/progress?flow=tutorial',
  '/api/couriers/me',
];

for (const ep of endpoints) {
  const res = await fetch(`http://localhost:3005${ep}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const body = await res.text();
  console.log(`[${res.status}] ${ep}`);
  if (res.status >= 400) console.log(`  ${body.substring(0, 200)}`);
}

await browser.close();
