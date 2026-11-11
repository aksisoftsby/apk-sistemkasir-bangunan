// Convert selected E2E screenshots to lightweight WebP for the README gallery.
const fs = require('fs');
const sharp = require('sharp');

const T = 'C:/Users/USER/AppData/Local/Temp/opencode';
const OUT = 'docs/screenshots';
fs.mkdirSync(OUT, { recursive: true });

const picks = [
  ['pos', `${T}/kokoh-test/04-pos.png`],
  ['cart', `${T}/kokoh-test/07-cart-footer.png`],
  ['payment', `${T}/kokoh-test2/16-payment-tempo.png`],
  ['success', `${T}/kokoh-test/09-success.png`],
  ['detail', `${T}/kokoh-test/10-detail.png`],
  ['products', `${T}/kokoh-test5/02-products.png`],
  ['stock', `${T}/kokoh-test2/05-stock.png`],
  ['customers', `${T}/kokoh-test2/18-piutang.png`],
  ['purchase', `${T}/kokoh-test2/12-purchase-list.png`],
  ['shift', `${T}/kokoh-test2/09-shift-open.png`],
  ['reports', `${T}/kokoh-test5/04-reports.png`],
  ['delivery', `${T}/kokoh-test5/01-delivery.png`],
  ['settings', `${T}/kokoh-test2/12-settings.png`],
];

(async () => {
  for (const [name, src] of picks) {
    if (!fs.existsSync(src)) {
      console.log('skip (missing):', name);
      continue;
    }
    const out = `${OUT}/${name}.webp`;
    await sharp(src).resize({ width: 390, withoutEnlargement: true }).webp({ quality: 78 }).toFile(out);
    console.log(name, (fs.statSync(out).size / 1024).toFixed(0) + ' KB');
  }
})();
