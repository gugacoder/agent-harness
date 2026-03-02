import { chromium } from 'playwright';

const browser = await chromium.connectOverCDP('http://localhost:9222');
const contexts = browser.contexts();
const page = contexts[0].pages()[0];

// Listen for failed requests
const failedRequests = [];
page.on('requestfailed', req => {
  failedRequests.push({ url: req.url(), failure: req.failure()?.errorText });
});

// Listen for responses with error status
const errorResponses = [];
page.on('response', res => {
  if (res.status() >= 400) {
    errorResponses.push({ url: res.url(), status: res.status(), statusText: res.statusText() });
  }
});

// Listen for console messages
const consoleMessages = [];
page.on('console', msg => {
  consoleMessages.push({ type: msg.type(), text: msg.text(), location: msg.location() });
});

// Listen for page errors (uncaught exceptions)
const pageErrors = [];
page.on('pageerror', err => {
  pageErrors.push(err.message);
});

await page.reload({ waitUntil: 'networkidle' });
await new Promise(r => setTimeout(r, 4000));

console.log('=== HTTP Errors ===');
for (const r of errorResponses) {
  console.log(`[${r.status}] ${r.url}`);
}

console.log('\n=== Failed Requests ===');
for (const r of failedRequests) {
  console.log(`${r.url} - ${r.failure}`);
}

console.log('\n=== Page Errors (uncaught) ===');
for (const e of pageErrors) {
  console.log(e);
}

console.log('\n=== Console Errors/Warnings ===');
for (const m of consoleMessages) {
  if (['error', 'warning'].includes(m.type)) {
    console.log(`[${m.type.toUpperCase()}] ${m.text}`);
    if (m.location?.url) console.log(`  at ${m.location.url}:${m.location.lineNumber}`);
  }
}

await browser.close();
