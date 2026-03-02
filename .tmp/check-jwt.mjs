import { chromium } from 'playwright';

const browser = await chromium.connectOverCDP('http://localhost:9222');
const page = browser.contexts()[0].pages()[0];

const data = await page.evaluate(() => {
  // Supabase stores session in localStorage
  const keys = Object.keys(localStorage).filter(k => k.includes('supabase') || k.includes('auth'));
  const result = {};
  for (const k of keys) {
    try { result[k] = JSON.parse(localStorage.getItem(k)); } catch { result[k] = localStorage.getItem(k); }
  }
  return result;
});

// Extract and decode JWT
for (const [key, val] of Object.entries(data)) {
  console.log(`Key: ${key}`);
  if (val?.access_token || val?.currentSession?.access_token) {
    const token = val.access_token || val.currentSession.access_token;
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    console.log('JWT app_metadata:', JSON.stringify(payload.app_metadata, null, 2));
    console.log('JWT user_metadata:', JSON.stringify(payload.user_metadata, null, 2));
    console.log('JWT sub:', payload.sub);
  }
}

await browser.close();
