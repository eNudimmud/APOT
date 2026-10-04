/* Render only the verified account's own composed signal. No uploaded media. */
'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const signal = require('../signature-engine');
const studio = require('../studio-engine');
const WIDTH = 1920, HEIGHT = 1080, FPS = 30;
let fontsReady = false;

async function render(account, tone, options = {}) {
  const sig = signal.derive(signal.seedForIdentity(account.id));
  const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
  if (!fontsReady) {
    for (const name of ['regular', 'semibold']) {
      if (!GlobalFonts.registerFromPath(path.join(__dirname, '../assets/fonts/space-grotesk-' + name + '.ttf'), 'Space')) throw new Error('Film fonts unavailable.');
    }
    fontsReady = true;
  }
  const executable = options.ffmpegPath || require('@ffmpeg-installer/ffmpeg').path;
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'apot-film-'));
  let canvas, child, timer, finished, cancelled = false;
  const cancel = () => { cancelled = true; child?.kill('SIGKILL'); };
  options.signal?.addEventListener('abort', cancel, { once: true });
  try {
    if (options.signal?.aborted) throw new Error('Film cancelled.');
    await fs.writeFile(path.join(directory, 'motif.wav'), Buffer.from(studio.wav(sig)));
    canvas = createCanvas(WIDTH, HEIGHT);
    const context = canvas.getContext('2d');
    child = spawn(executable, ['-hide_banner', '-loglevel', 'error', '-y',
      '-f', 'image2pipe', '-vcodec', 'png', '-framerate', String(FPS), '-i', 'pipe:0',
      '-i', path.join(directory, 'motif.wav'), '-map', '0:v:0', '-map', '1:a:0',
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-maxrate', '5M', '-bufsize', '10M',
      '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-flags', '+cgop', '-g', '60', '-r', String(FPS),
      '-c:a', 'aac', '-b:a', '128k', '-ar', String(studio.sampleRate), '-ac', '1',
      '-t', String(studio.duration), '-movflags', '+faststart', '-threads', '2', path.join(directory, 'signal.mp4')],
    { stdio: ['pipe', 'ignore', 'pipe'] });
    let diagnostic = '';
    child.stderr.on('data', chunk => { diagnostic = (diagnostic + chunk.toString()).slice(-2048); });
    child.stdin.on('error', () => {});
    finished = new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('close', code => code === 0 && !cancelled ? resolve() : reject(new Error('Film encoder failed: ' + diagnostic)));
    });
    finished.catch(() => {});
    timer = setTimeout(cancel, 45000);
    for (let frame = 0; frame < FPS * studio.duration; frame++) {
      if (cancelled || options.signal?.aborted) throw new Error('Film cancelled.');
      studio.paintFilm(context, sig, WIDTH, HEIGHT, tone, frame / FPS, account.username);
      if (!child.stdin.write(canvas.toBuffer('image/png'))) {
        await Promise.race([once(child.stdin, 'drain'), finished.then(() => { throw new Error('Film encoder closed early.'); })]);
      }
    }
    child.stdin.end();
    await finished;
    const file = path.join(directory, 'signal.mp4');
    if ((await fs.stat(file)).size > 4000000) throw new Error('Film exceeds the delivery limit.');
    return { bytes: await fs.readFile(file), seed: sig.seed, width: WIDTH, height: HEIGHT, duration: studio.duration };
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', cancel);
    if (child && child.exitCode === null) { child.kill('SIGKILL'); await finished?.catch(() => {}); }
    if (canvas) { canvas.width = 1; canvas.height = 1; }
    await fs.rm(directory, { recursive: true, force: true });
  }
}
module.exports = { render, width: WIDTH, height: HEIGHT, fps: FPS };
