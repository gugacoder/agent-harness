import { chromium } from 'playwright';

const browser = await chromium.connectOverCDP('http://localhost:9222');
const page = browser.contexts()[0].pages()[0];

const results = [];

page.on('response', async res => {
  if (res.status() >= 400 && res.url().includes('/api/')) {
    let body = '';
    try { body = await res.text(); } catch {}
    const reqHeaders = res.request().headers();
    results.push({
      url: res.url(),
      status: res.status(),
      hasAuth: !!reqHeaders['authorization'],
      authPrefix: reqHeaders['authorization']?.substring(0, 20),
      body,
    });
  }
});

await page.reload({ waitUntil: 'networkidle' });
await new Promise(r => setTimeout(r, 3000));

for (const r of results) {
  console.log(`\n[${r.status}] ${r.url}`);
  console.log(`  Auth header present: ${r.hasAuth} (${r.authPrefix}...)`);
  console.log(`  Response: ${r.body.substring(0, 200)}`);
}

await browser.close();
