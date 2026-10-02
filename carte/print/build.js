// Génère carte-visite-91x61-fond-perdu.pdf (2 pages : recto, verso) à partir de carte-visite.html.
// Usage : node carte/print/build.js   (nécessite le paquet playwright + Chromium)
const path = require('path');
const { chromium } = require('playwright');
(async () => {
  const dir = __dirname;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + path.join(dir, 'carte-visite.html'));
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({
    path: path.join(dir, 'carte-visite-91x61-fond-perdu.pdf'),
    width: '91mm', height: '61mm', printBackground: true, preferCSSPageSize: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  await browser.close();
  console.log('PDF écrit : carte/print/carte-visite-91x61-fond-perdu.pdf');
})();
