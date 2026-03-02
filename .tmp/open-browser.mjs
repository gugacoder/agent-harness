import { chromium } from 'playwright';

const browser = await chromium.launch({
  headless: false,
  args: ['--remote-debugging-port=9222'],
});
const page = await browser.newPage();
await page.setViewportSize({ width: 480, height: 900 });
await page.goto('http://localhost:3004/login');
console.log('Browser aberto em http://localhost:3004/login');
console.log('CDP disponivel em ws://localhost:9222');
console.log('Aguardando... (Ctrl+C para fechar)');
// keep alive
await new Promise(() => {});
