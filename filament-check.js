'use strict';
// Exercise the actual renderer through a small Canvas 2D recorder, without a browser.
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(process.argv[2] || path.join(__dirname, 'signal.js'), 'utf8');
let failed = false;

for (const [width, height, dpr] of [[320, 170, 1], [600, 130, 1], [900, 130, 2]]) {
  let pending = null, clock = 0, coordinates = 0, outside = 0;
  let matrix = [1, 0, 0, 1, 0, 0];
  const stack = [];
  const record = (x, y) => {
    const px = (matrix[0] * x + matrix[2] * y + matrix[4]) / dpr;
    const py = (matrix[1] * x + matrix[3] * y + matrix[5]) / dpr;
    coordinates++;
    if (!Number.isFinite(px) || !Number.isFinite(py) || px < 0 || px > width || py < 0 || py > height) outside++;
  };
  const context = {
    setTransform(...value) { matrix = value; },
    save() { stack.push([...matrix]); },
    restore() { matrix = stack.pop(); },
    translate(x, y) {
      matrix[4] += matrix[0] * x + matrix[2] * y;
      matrix[5] += matrix[1] * x + matrix[3] * y;
    },
    scale(x, y) {
      matrix[0] *= x; matrix[1] *= x; matrix[2] *= y; matrix[3] *= y;
    },
    moveTo: record, lineTo: record,
    beginPath() {}, stroke() {}, clearRect() {}, drawImage() {}
  };
  const canvas = { dataset: {}, getContext: () => context };
  const scene = { getBoundingClientRect: () => ({ width, height, left: 0, top: 0 }) };
  const events = {};
  const stage = { addEventListener: (name, fn) => { events[name] = fn; } };
  const window = { addEventListener() {} };
  const document = {
    hidden: false,
    documentElement: { classList: { add() {} } },
    addEventListener() {},
    createElement: () => ({ getContext: () => null }),
    querySelector: selector => ({ '#signal-canvas': canvas, '.signal-scene': scene, '.signal-world': stage }[selector])
  };
  vm.runInNewContext(source, {
    window, document, devicePixelRatio: dpr,
    performance: { now: () => clock },
    matchMedia: query => ({ matches: query.includes('760') && width <= 760, addEventListener() {} }),
    requestAnimationFrame: fn => { pending = fn; return 1; },
    cancelAnimationFrame: () => { pending = null; }
  });
  // 96 simulated seconds cover more than a full orbit and five open/close cycles.
  for (let i = 0; i < 3000; i++) {
    if (i % 600 === 0) {
      window.LambdaSignal.setScroll((i / 600) % 2);
      events.pointermove({ clientX: i % 1200 ? width : 0, clientY: i % 1200 ? height : 0, pointerType: 'mouse' });
    }
    clock += 32;
    const callback = pending; pending = null; callback(clock);
  }
  window.LambdaSignal.setPaused(true);
  window.LambdaSignal.setScroll(0);
  if (pending) { clock += 32; const callback = pending; pending = null; callback(clock); }
  if (!coordinates || outside || stack.length) failed = true;
  console.log(JSON.stringify({ width, height, dpr, frames: 3000, coordinates, outside, transformStack: stack.length }));
}
process.exitCode = failed ? 1 : 0;
