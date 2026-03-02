import { chromium } from 'playwright';

const browser = await chromium.connectOverCDP('http://localhost:9222');
const contexts = browser.contexts();
console.log(`Contexts: ${contexts.length}`);

for (let ci = 0; ci < contexts.length; ci++) {
  const ctx = contexts[ci];
  const pages = ctx.pages();
  console.log(`\nContext ${ci}: ${pages.length} pages`);

  for (let pi = 0; pi < pages.length; pi++) {
    const page = pages[pi];
    console.log(`  Page ${pi}: ${page.url()}`);

    const data = await page.evaluate(() => {
      const result = {};
      for (const [k, v] of Object.entries(localStorage)) {
        if (k.includes('supabase') || k.includes('auth') || k.includes('sb-')) {
          try {
            const parsed = JSON.parse(v);
            if (parsed.access_token) {
              const payload = JSON.parse(atob(parsed.access_token.split('.')[1]));
              result[k] = { email: payload.email, role: payload.app_metadata?.role, exp: new Date(payload.exp * 1000).toISOString() };
            } else {
              result[k] = v.substring(0, 100);
            }
          } catch {
            result[k] = v.substring(0, 100);
          }
        }
      }
      return result;
    });

    console.log(`  Auth keys:`, JSON.stringify(data, null, 4));
  }
}
