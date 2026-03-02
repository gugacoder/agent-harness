import { chromium } from 'playwright';

const browser = await chromium.connectOverCDP('http://localhost:9222');
const page = browser.contexts()[0].pages()[0];

const errors = [];
page.on('console', msg => {
  if (msg.type() === 'error') errors.push(msg.text());
});
page.on('response', res => {
  if (res.status() >= 400 && res.url().includes('/api/')) {
    errors.push(`[${res.status()}] ${res.url()}`);
  }
});

await page.reload({ waitUntil: 'networkidle' });
await new Promise(r => setTimeout(r, 3000));

if (errors.length === 0) {
  console.log('No console errors!');
} else {
  console.log(`${errors.length} errors found:`);
  for (const e of errors) console.log(`  ${e}`);
}

await browser.close();
