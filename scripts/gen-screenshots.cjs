// Convert selected E2E screenshots to lightweight WebP for the README gallery.
const fs = require('fs');
const sharp = require('sharp');

const T = 'C:/Users/USER/AppData/Local/Temp/opencode/kokoh-shots';
const OUT = 'docs/screenshots';
fs.mkdirSync(OUT, { recursive: true });

const picks = [
  ['pos', `${T}/pos.png`],
  ['cart', `${T}/cart.png`],
  ['payment', `${T}/payment.png`],
  ['success', `${T}/success.png`],
  ['detail', `${T}/detail.png`],
  ['products', `${T}/products.png`],
  ['stock', `${T}/stock.png`],
  ['customers', `${T}/customers.png`],
  ['purchase', `${T}/purchase.png`],
  ['shift', `${T}/shift.png`],
  ['reports', `${T}/reports.png`],
  ['delivery', `${T}/delivery.png`],
  ['settings', `${T}/settings.png`],
  ['databases', `${T}/databases.png`],
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
