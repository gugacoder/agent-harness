import { chromium } from 'playwright';

const browser = await chromium.connectOverCDP('http://localhost:9222');
const page = browser.contexts()[0].pages()[0];

const errors = [];
page.on('console', msg => {
  if (msg.type() === 'error') errors.push(`[console] ${msg.text()}`);
});
page.on('response', res => {
  if (res.status() >= 400 && res.url().includes('/api/')) {
    errors.push(`[HTTP ${res.status()}] ${res.url()}`);
  }
});

// Navigate to current page (reload)
const url = page.url();
console.log('Current URL:', url);
await page.reload({ waitUntil: 'networkidle' });
await new Promise(r => setTimeout(r, 3000));

if (errors.length === 0) {
  console.log('No errors!');
} else {
  console.log(`${errors.length} errors:`);
  for (const e of errors) console.log(`  ${e}`);
}
