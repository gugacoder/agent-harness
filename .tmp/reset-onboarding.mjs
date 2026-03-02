import { chromium } from 'playwright';

const browser = await chromium.connectOverCDP('http://localhost:9222');
const page = browser.contexts()[0].pages()[0];

const token = await page.evaluate(() => {
  const raw = localStorage.getItem('sb-localhost-auth-token');
  if (!raw) return null;
  return JSON.parse(raw).access_token || null;
});

const res = await fetch('http://localhost:3005/api/onboarding/progress?flow=tutorial', {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` },
});

console.log(`Reset onboarding: ${res.status}`);
if (res.status >= 400) {
  const body = await res.text();
  console.log(body);
}
