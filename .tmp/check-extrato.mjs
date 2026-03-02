import { chromium } from 'playwright';

const browser = await chromium.connectOverCDP('http://localhost:9222');
const page = browser.contexts()[0].pages()[0];

const errors = [];
page.on('console', msg => {
  if (msg.type() === 'error') errors.push(`[console] ${msg.text()}`);
});
page.on('pageerror', err => {
  errors.push(`[pageerror] ${err.message}`);
});
page.on('response', res => {
  if (res.status() >= 400 && res.url().includes('/api/')) {
    errors.push(`[HTTP ${res.status()}] ${res.url()}`);
  }
});

await page.goto('http://localhost:3004/extrato', { waitUntil: 'networkidle' });
await new Promise(r => setTimeout(r, 3000));

if (errors.length === 0) {
  console.log('No errors on /extrato!');
} else {
  console.log(`${errors.length} errors found on /extrato:`);
  for (const e of errors) console.log(`  ${e}`);
}

// Don't close browser - user is watching
