'use strict';
const path = require('node:path');
const signal = require('../signature-engine');
const share = require('../share-engine');
let fonts = false;
function png(seed) {
  const sig = signal.derive(seed);
  if (!sig || !share.valid(seed)) return null;
  const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
  if (!fonts) {
    for (const n of ['regular', 'semibold']) GlobalFonts.registerFromPath(path.join(__dirname, '../assets/fonts/space-grotesk-' + n + '.ttf'), 'Space');
    fonts = true;
  }
  const canvas = createCanvas(share.width, share.height);
  share.paint(canvas.getContext('2d'), sig, share.width, share.height);
  return canvas.toBuffer('image/png');
}
module.exports = { png };
