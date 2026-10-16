// Renders the app icons (PNG) with the installed Chromium: node tools/make-icons.js
// Needs Playwright (npm i -g playwright) and a Chromium; the icons are committed, so this is only for redesigns.
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const svg = (size, pad) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="#34469C"/>
  <g transform="translate(${size * pad} ${size * pad}) scale(${size * (1 - 2 * pad) / 24})" fill="none" stroke="#F7F8F4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5.5 2.5h13M5.5 21.5h13"/><path d="M7 2.5v2.2c0 3.1 5 4.6 5 7.3s-5 4.2-5 7.3v2.2M17 2.5v2.2c0 3.1-5 4.6-5 7.3s5 4.2 5 7.3v2.2"/>
    <path d="M9 19.6c.6-1.4 1.8-2.3 3-2.8 1.2.5 2.4 1.4 3 2.8z" fill="#F7F8F4" stroke="none"/><path d="M9.6 6.2h4.8c-.5.9-1.4 1.6-2.4 2.1-1-.5-1.9-1.2-2.4-2.1z" fill="#F7F8F4" stroke="none"/></g></svg>`;
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  for (const [name, size, pad] of [['icon-192', 192, 0.17], ['icon-512', 512, 0.17], ['icon-maskable-512', 512, 0.27], ['apple-touch-icon', 180, 0.2]]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<body style="margin:0">${svg(size, pad)}</body>`);
    await page.screenshot({ path: path.join(__dirname, '..', 'assets', name + '.png'), clip: { x: 0, y: 0, width: size, height: size } });
  }
  await browser.close();
})();
