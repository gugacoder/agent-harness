import { chromium } from 'playwright';

const browser = await chromium.connectOverCDP('http://localhost:9222');
const page = browser.contexts()[0].pages()[0];

// Get the JWT from the browser
const token = await page.evaluate(async () => {
  const { data } = await window.__supabase_auth || {};
  // Try to get from supabase client
  const keys = Object.keys(localStorage).filter(k => k.includes('supabase'));
  for (const k of keys) {
    try {
      const val = JSON.parse(localStorage.getItem(k));
      if (val?.access_token) return val.access_token;
    } catch {}
  }
  return null;
});

if (!token) {
  console.log('No token found');
  await browser.close();
  process.exit(1);
}

// Test each endpoint directly
const endpoints = [
  '/api/profiles/me',
  '/api/onboarding/progress?flow=tutorial',
  '/api/couriers/me',
  '/api/company/config',
];

for (const ep of endpoints) {
  const res = await fetch(`http://localhost:3005${ep}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const body = await res.text();
  console.log(`[${res.status}] ${ep}`);
  if (res.status >= 400) console.log(`  ${body.substring(0, 150)}`);
}

await browser.close();
