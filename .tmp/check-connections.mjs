import { chromium } from 'playwright';

const browser = await chromium.connectOverCDP('http://localhost:9222');
const page = browser.contexts()[0].pages()[0];

// Check all active connections via Performance API
const connections = await page.evaluate(() => {
  const entries = performance.getEntriesByType('resource');
  const active = entries
    .filter(e => e.name.includes('localhost:3005'))
    .map(e => ({
      name: e.name.replace(/token=[^&]+/, 'token=...'),
      type: e.initiatorType,
      duration: Math.round(e.duration),
    }));
  return active;
});

console.log(`Total resource entries to backbone: ${connections.length}`);
const byPath = {};
for (const c of connections) {
  const url = new URL(c.name);
  const key = `${url.pathname}`;
  byPath[key] = (byPath[key] || 0) + 1;
}
console.log('\nConnections by path:');
for (const [path, count] of Object.entries(byPath).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${count}x ${path}`);
}

// Check EventSource instances via monkey-patching info
const esInfo = await page.evaluate(() => {
  // Check if there are any EventSource objects we can find
  const results = [];
  // Try to find SSE connections in the DOM
  const frames = performance.getEntriesByType('resource')
    .filter(e => e.name.includes('/api/events/'));
  return frames.map(f => ({
    url: f.name.replace(/token=[^&]+/, 'token=...'),
    duration: Math.round(f.duration),
    startTime: Math.round(f.startTime),
  }));
});

console.log(`\nSSE event connections: ${esInfo.length}`);
for (const e of esInfo) {
  console.log(`  start=${e.startTime}ms dur=${e.duration}ms ${e.url}`);
}
