// Génère carte-visite-vistaprint-88x58.pdf (2 pages : recto, verso) à partir de carte-visite.html.
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
  const opts = { width: '88mm', height: '58mm', printBackground: true, preferCSSPageSize: true,
                 margin: { top: 0, right: 0, bottom: 0, left: 0 } };
  // Fichier complet (2 pages) + recto seul + verso seul, pour l'import page par page sur Vistaprint.
  await page.pdf({ ...opts, path: path.join(dir, 'carte-visite-vistaprint-88x58.pdf') });
  await page.pdf({ ...opts, pageRanges: '1', path: path.join(dir, 'carte-visite-vistaprint-88x58-recto.pdf') });
  await page.pdf({ ...opts, pageRanges: '2', path: path.join(dir, 'carte-visite-vistaprint-88x58-verso.pdf') });
  await browser.close();
  console.log('PDF écrits : carte/print/carte-visite-vistaprint-88x58{,-recto,-verso}.pdf');
})();
