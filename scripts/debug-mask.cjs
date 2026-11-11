const fs = require('fs');
const sharp = require('sharp');
const SRC = 'public/assets/logo.webp';
const size = 1024;

function backgroundMask(data, size) {
  const mask = new Uint8Array(size * size);
  const stack = [];
  const isNavy = (i) => {
    const p = i * 3;
    const r = data[p], g = data[p + 1], b = data[p + 2];
    return b > r + 12 && b > g + 6 && b > 60;
  };
  const push = (i) => { if (!mask[i] && isNavy(i)) { mask[i] = 1; stack.push(i); } };
  for (let x = 0; x < size; x++) { push(x); push((size - 1) * size + x); }
  for (let y = 0; y < size; y++) { push(y * size); push(y * size + size - 1); }
  let guard = 0;
  while (stack.length && guard++ < 20e6) {
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
  const { data } = await sharp(SRC).resize(size, size, { fit: 'cover' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const mask = backgroundMask(data, size);
  const rgba = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    rgba[i * 4] = data[i * 3];
    rgba[i * 4 + 1] = data[i * 3 + 1];
    rgba[i * 4 + 2] = data[i * 3 + 2];
    rgba[i * 4 + 3] = mask[i] ? 0 : 255;
  }
  await sharp(rgba, { raw: { width: size, height: size, channels: 4 } }).png().toFile('assets/_debug-fg-noblur.png');

  // alpha-only preview
  const alphaRaw = Buffer.alloc(size * size);
  for (let i = 0; i < size * size; i++) alphaRaw[i] = rgba[i * 4 + 3];
  await sharp(alphaRaw, { raw: { width: size, height: size, channels: 1 } }).png().toFile('assets/_debug-mask.png');
  const blurred = await sharp(alphaRaw, { raw: { width: size, height: size, channels: 1 } }).blur(1.2).raw().toBuffer();
  console.log('alphaRaw len', alphaRaw.length, 'blurred len', blurred.length);
  let kept = 0;
  for (let i = 0; i < mask.length; i++) if (!mask[i]) kept++;
  console.log('kept %', ((kept / mask.length) * 100).toFixed(1));
})();
