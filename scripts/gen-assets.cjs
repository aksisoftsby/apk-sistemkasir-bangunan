// Generate Android launcher icon + splash source assets from the Kokoh logo.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SRC = 'public/assets/logo.webp';
const OUT = 'assets';
const NAVY = '#0B2A63';

fs.mkdirSync(OUT, { recursive: true });

/** Flood-fill the navy gradient background from the border so highlights inside
 *  the tool stay opaque. Returns an alpha mask (255 = keep, 0 = background). */
function backgroundMask(data, size) {
  const mask = new Uint8Array(size * size); // 1 = background
  const stack = [];
  const isNavy = (i) => {
    const p = i * 3;
    const r = data[p], g = data[p + 1], b = data[p + 2];
    return b > r + 12 && b > g + 6 && b > 60;
  };
  const push = (i) => {
    if (!mask[i] && isNavy(i)) {
      mask[i] = 1;
      stack.push(i);
    }
  };
  for (let x = 0; x < size; x++) {
    push(x);
    push((size - 1) * size + x);
  }
  for (let y = 0; y < size; y++) {
    push(y * size);
    push(y * size + size - 1);
  }
  while (stack.length) {
    const i = stack.pop();
    const x = i % size;
    const y = (i - x) / size;
    if (x > 0) push(i - 1);
    if (x < size - 1) push(i + 1);
    if (y > 0) push(i - size);
    if (y < size - 1) push(i + size);
  }
  return mask;
}

(async () => {
  const size = 1024;
  const { data } = await sharp(SRC)
    .resize(size, size, { fit: 'cover' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const mask = backgroundMask(data, size);

  const rgba = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    rgba[i * 4] = data[i * 3];
    rgba[i * 4 + 1] = data[i * 3 + 1];
    rgba[i * 4 + 2] = data[i * 3 + 2];
    rgba[i * 4 + 3] = mask[i] ? 0 : 255;
  }

  // Soften the cut-out edge (1px feather). sharp widens 1-channel raw input to
  // 3 channels on blur, so read every 3rd byte of the result.
  const alphaRaw = Buffer.alloc(size * size);
  for (let i = 0; i < size * size; i++) alphaRaw[i] = rgba[i * 4 + 3];
  const alphaPng = await sharp(alphaRaw, { raw: { width: size, height: size, channels: 1 } })
    .png()
    .toBuffer();
  const alphaSoft = await sharp(alphaPng).blur(1.0).raw().toBuffer();
  for (let i = 0; i < size * size; i++) rgba[i * 4 + 3] = alphaSoft[i * 3];

  const fgFull = await sharp(rgba, { raw: { width: size, height: size, channels: 4 } })
    .png()
    .toBuffer();

  // Trim transparent edges. Content fills the canvas because the generated
  // adaptive-icon XML already insets the foreground by 16.7% (66% safe zone).
  const trimmed = await sharp(fgFull).trim({ threshold: 1 }).png().toBuffer();
  const tMeta = await sharp(trimmed).metadata();
  const inner = Math.round(size * 0.97);
  const scaled = await sharp(trimmed)
    .resize(inner, inner, { fit: 'inside', withoutEnlargement: false })
    .toBuffer();
  const fg = await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: scaled, gravity: 'center' }])
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(OUT, 'icon-foreground.png'), fg);

  const bg = await sharp({
    create: { width: size, height: size, channels: 4, background: NAVY },
  })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(OUT, 'icon-background.png'), bg);

  const iconOnly = await sharp({
    create: { width: size, height: size, channels: 4, background: NAVY },
  })
    .composite([{ input: fg, gravity: 'center' }])
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(OUT, 'icon-only.png'), iconOnly);

  const splashLogo = await sharp(trimmed).resize(760, 760, { fit: 'inside' }).toBuffer();
  const splash = await sharp({
    create: { width: 2732, height: 2732, channels: 4, background: NAVY },
  })
    .composite([{ input: splashLogo, gravity: 'center' }])
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(OUT, 'splash.png'), splash);
  fs.writeFileSync(path.join(OUT, 'splash-dark.png'), splash);

  let bgCount = 0;
  for (let i = 0; i < mask.length; i++) bgCount += mask[i];
  console.log('background pixels removed:', ((bgCount / mask.length) * 100).toFixed(1) + '%');
})();
