import { chromium } from 'playwright';

const browser = await chromium.connectOverCDP('http://localhost:9222');
const page = browser.contexts()[0].pages()[0];

// Get the JWT from localStorage
const token = await page.evaluate(() => {
  for (const [k, v] of Object.entries(localStorage)) {
    if (!k.includes('supabase')) continue;
    try {
      const parsed = JSON.parse(v);
      if (parsed?.access_token) return parsed.access_token;
      // Supabase v2 stores session nested
      if (parsed?.currentSession?.access_token) return parsed.currentSession.access_token;
    } catch {}
  }
  return null;
});

console.log('Token found:', !!token);
if (!token) {
  // Debug: show what's in localStorage
  const keys = await page.evaluate(() => Object.keys(localStorage));
  console.log('localStorage keys:', keys);
  const allData = await page.evaluate(() => {
    const result = {};
    for (const [k, v] of Object.entries(localStorage)) {
      result[k] = v.substring(0, 200);
    }
    return result;
  });
  console.log(JSON.stringify(allData, null, 2));
  await browser.close();
  process.exit(1);
}

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
