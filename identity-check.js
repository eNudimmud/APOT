/* Execute the real account controller and studio against signed-cookie fixtures.
   No X requests, real credentials, DOM package or browser storage are needed. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const oauth = require('./lib/x-oauth');
const sessionRoute = require('./api/x/session');
const avatarRoute = require('./api/x/avatar');
const signal = require('./signature-engine');
const profile = require('./profile-engine');
const studio = require('./studio-engine');
const originalEnv = Object.fromEntries(oauth.ENV_NAMES.map(name => [name, process.env[name]]));
Object.assign(process.env, { X_CLIENT_ID: 'fixture-client', X_CLIENT_SECRET: 'fixture-secret',
  X_REDIRECT_URI: 'https://apot.example/api/x/callback', APOT_SESSION_SECRET: 'fixture-signing-secret' });
const ID = signal.FIXTURE_X_ID;
const account = (id = ID, username = 'APOTsignal') => ({ v: 1, id, username, name: 'λP⊙T',
  avatar: 'https://pbs.twimg.com/profile_images/1/avatar_400x400.jpg', exp: Date.now() + 3600000 });
const res = () => ({ headers: {}, statusCode: 0, body: '',
  setHeader(key, value) { this.headers[key.toLowerCase()] = value; },
  getHeader(key) { return this.headers[key.toLowerCase()]; }, end(body) { this.body = body; } });
const cookie = data => data ? oauth.SESSION_COOKIE + '=' + encodeURIComponent(oauth.sign(data, process.env.APOT_SESSION_SECRET)) : '';
function response(data, options = {}) {
  const result = res();
  sessionRoute({ method: 'GET', url: '/api/x/session?seed=7F2A91C4&id=123', headers: { cookie: cookie(data) } }, result);
  return { ok: result.statusCode === 200, status: result.statusCode, json: async () => ({ ...JSON.parse(result.body), ...options }) };
}
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const flush = () => new Promise(done => setImmediate(done));
function drawingContext() {
  const operations = [];
  const base = { operations, measureText: text => ({ width: text.length * 8 }),
    createRadialGradient: () => ({ addColorStop() {} }), createLinearGradient: () => ({ addColorStop() {} }) };
  return new Proxy(base, { get(target, key) {
    if (key in target) return target[key];
    return (...args) => {
      assert.ok(args.filter(arg => typeof arg === 'number').every(Number.isFinite), 'Drawing coordinates must stay finite.');
      operations.push([key, ...args]);
    };
  }, set(target, key, value) { target[key] = value; return true; } });
}
function harness(initial, options = {}) {
  let session = initial, clock = Date.now(), timerId = 0;
  const timers = new Map(), nodes = new Map(), downloads = [], bitmaps = [], calls = [];
  const delayed = { session: null, avatar: null, blob: null };
  class Element {
    constructor(tag = 'div', attrs = '') {
      this.tagName = tag; this.hidden = /(?:^|\s)hidden(?:\s|$)/.test(attrs);
      this.disabled = /(?:^|\s)disabled(?:\s|$)/.test(attrs); this.dataset = {}; this.attributes = {};
      this.listeners = {}; this.textContent = ''; this.innerHTML = ''; this.value = '45'; this.open = false;
      this.width = 720; this.height = 720; this.context = drawingContext();
      this.classList = { add() {}, remove() {} };
      for (const match of attrs.matchAll(/([\w-]+)="([^"]*)"/g)) {
        this.attributes[match[1]] = match[2];
        if (match[1].startsWith('data-')) this.dataset[match[1].slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = match[2];
        if (['width', 'height'].includes(match[1])) this[match[1]] = Number(match[2]);
      }
    }
    getContext() { return this.context; }
    setAttribute(key, value) { this.attributes[key] = String(value); }
    getAttribute(key) { return this.attributes[key] ?? null; }
    removeAttribute(key) { delete this.attributes[key]; }
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
    async fire(type, props = {}) {
      const event = { target: this, preventDefault() { this.prevented = true; }, ...props };
      await Promise.all((this.listeners[type] || []).map(fn => fn(event))); return event;
    }
    querySelector(selector) { if (selector === 'span') return this.span ||= new Element('span'); return null; }
    focus() {} remove() {}
    click() { if (this.download) downloads.push({ name: this.download, href: this.href }); else void this.fire('click'); }
    toBlob(done) { if (delayed.blob) delayed.blob.promise.then(() => done(new Blob(['fixture PNG']))); else done(new Blob(['fixture PNG'])); }
  }
  const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
  for (const match of html.matchAll(/<([\w-]+)([^>]*\bid="([^"]+)"[^>]*)>/g)) nodes.set('#' + match[3], new Element(match[1], match[2]));
  const palettes = ['midnight', 'paper'].map(tone => new Element('button', 'data-tone="' + tone + '" disabled'));
  const document = new Element();
  Object.assign(document, { hidden: false, body: { append() {}, classList: { add() {}, remove() {} } },
    fonts: { load: async () => [], ready: Promise.resolve() },
    querySelector: selector => { if (selector === '#study-dialog') return null; assert.ok(nodes.has(selector), 'Missing DOM element: ' + selector); return nodes.get(selector); },
    querySelectorAll: selector => selector === '[data-profile-mode]' ? ['#profile-tab-pfp', '#profile-tab-banner'].map(key => nodes.get(key)) : selector === '[data-tone]' ? palettes : [],
    createElement: tag => new Element(tag) });
  const window = new Element();
  const DateFixture = class extends Date { static now() { return clock; } };
  const sessionReply = () => options.status ? { ok: false, status: options.status } : response(session, options.data);
  let started = 0, stopped = 0;
  class Audio {
    resume() { return Promise.resolve(); } close() { return Promise.resolve(); }
    createBuffer(channels, length) { return { getChannelData: () => new Float32Array(length) }; }
    createBufferSource() { return { connect() {}, disconnect() {}, start() { started++; }, stop() { stopped++; } }; }
  }
  Object.assign(window, { ApotSignature: signal, ApotProfile: profile, ApotStudio: studio, AudioContext: Audio,
    location: { search: '?seed=7F2A91C4&tone=paper' },
    dispatchEvent(event) { (this.listeners[event.type] || []).forEach(fn => fn(event)); },
    setTimeout(fn, ms) { const id = ++timerId; timers.set(id, { fn, at: clock + ms }); return id; },
    clearTimeout(id) { timers.delete(id); } });
  const context = vm.createContext({ window, document, Date: DateFixture, console, URLSearchParams, Blob,
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
    URL: { createObjectURL: () => 'blob:fixture', revokeObjectURL() {} },
    navigator: { clipboard: { writeText: async () => {} } },
    sessionStorage: { getItem() { throw new Error('Legacy visitor seeds must never be read.'); } },
    createImageBitmap: async () => { const image = { width: 400, height: 400, closed: false, close() { this.closed = true; } }; bitmaps.push(image); return image; },
    fetch: async path => {
      calls.push(path);
      if (path === 'api/x/session' && options.networkFailure) throw new Error('Fixture network unavailable');
      if (path === 'api/x/session') return delayed.session ? delayed.session.promise : sessionReply();
      if (path === 'api/x/avatar') return delayed.avatar ? delayed.avatar.promise : { ok: !options.avatarFailure, status: options.avatarFailure ? 502 : 200,
        headers: { get: key => key === 'X-APOT-Account' ? session?.id : null }, blob: async () => new Blob(['avatar']) };
      if (path === 'api/x/logout') { session = null; return { ok: true, status: 200 }; }
      throw new Error('Unexpected request: ' + path);
    } });
  vm.runInContext(fs.readFileSync(__dirname + '/signature.js', 'utf8'), context, { filename: 'signature.js' });
  vm.runInContext(fs.readFileSync(__dirname + '/studio.js', 'utf8'), context, { filename: 'studio.js' });
  return { window, document, nodes, downloads, bitmaps, calls, delayed, palettes, get: key => nodes.get('#' + key),
    setSession(value) { session = value; },
    async refresh() { await document.fire('visibilitychange'); await flush(); },
    advance(ms) { clock += ms; for (const [id, timer] of [...timers]) if (timer.at <= clock) { timers.delete(id); timer.fn(); } },
    audio: () => ({ started, stopped }) };
}
function locked(h) {
  assert.equal(h.window.ApotStage.current(), null);
  for (const id of ['export-pfp', 'export-banner', 'export-card', 'export-sound', 'listen-signal', 'seed-copy']) assert.equal(h.get(id).disabled, true, id + ' must be locked.');
  assert.equal(h.get('share-card').getAttribute('aria-disabled'), 'true');
  assert.equal(h.get('profile-ready').hidden, true);
  assert.equal(h.get('edition-tools').hidden, true);
}
async function run() {
  const server = await response(account()).json();
  assert.equal(server.seed, signal.FIXTURE_X_SEED); assert.equal(server.binding, 'x-id-v1');
  assert.ok(Number.isFinite(server.expiresAt));
  const renamed = account(ID, 'new_handle'); renamed.avatar = 'https://pbs.twimg.com/profile_images/99/new.jpg';
  assert.equal((await response(renamed).json()).seed, server.seed, 'A changed handle or avatar must not change the signal.');
  assert.notEqual((await response(account('123456789')).json()).seed, server.seed);
  assert.equal(response(null).status, 401);
  assert.equal(response({ ...account(), exp: Date.now() - 1 }).status, 401);
  const forged = res(); sessionRoute({ method: 'GET', headers: { cookie: cookie(account()) + 'tampered' } }, forged); assert.equal(forged.statusCode, 401);
  const savedFetch = oauth.fetchAvatarBytes;
  oauth.fetchAvatarBytes = async () => ({ type: 'image/png', bytes: Buffer.from('fixture') });
  try { const image = res(); await avatarRoute({ method: 'GET', headers: { cookie: cookie(account()) } }, image); assert.equal(image.headers['x-apot-account'], ID); }
  finally { oauth.fetchAvatarBytes = savedFetch; }

  const anonymous = harness(null); await flush(); locked(anonymous);
  for (const id of ['export-pfp', 'export-banner', 'export-card', 'export-sound', 'listen-signal']) await anonymous.get(id).fire('click');
  assert.equal(anonymous.downloads.length, 0); assert.equal(anonymous.audio().started, 0);
  for (const options of [{ status: 503 }, { networkFailure: true }, { data: { seed: '7F2A91C4' } }, { data: { binding: 'visitor' } }, { data: { expiresAt: Date.now() - 1 } }]) {
    const invalid = harness(account(), options); await flush(); locked(invalid);
  }

  const h = harness(account()); await flush();
  const fixed = h.window.ApotStage.current(); assert.equal(fixed.seed, signal.FIXTURE_X_SEED, 'URL seed and old storage must not override X identity.');
  assert.equal(h.get('export-pfp').disabled, false); assert.equal(h.get('export-banner').disabled, false);
  assert.equal(h.get('card-preview').context.operations.length, 1, 'A hidden card must not be repainted.');
  h.get('edition-tools').open = true; await h.get('edition-tools').fire('toggle');
  for (const id of ['export-pfp', 'export-banner', 'export-card', 'export-sound']) { await h.get(id).fire('click'); await flush(); }
  assert.equal(h.downloads.length, 4); assert.ok(h.downloads.every(item => item.name.includes(fixed.seed)), 'Every edition must use the fixed account seed.');
  assert.ok(h.calls.filter(path => path === 'api/x/session').length >= 5, 'Every export must recheck the server session.');
  assert.equal(new URL(studio.permalink(fixed)).search, '');
  await h.get('listen-signal').fire('click'); assert.equal(h.audio().started, 1);
  h.setSession(renamed); await h.refresh(); assert.equal(h.window.ApotStage.current(), fixed);
  assert.equal(h.get('x-account').textContent, '@new_handle');
  await h.get('x-disconnect').fire('click'); await flush(); locked(h);
  assert.equal(h.audio().stopped, 1); assert.ok(h.bitmaps.every(bitmap => bitmap.closed));
  h.setSession(account()); await h.get('x-retry').fire('click'); await flush();
  assert.equal(signal.fingerprint(h.window.ApotStage.current()), signal.fingerprint(fixed), 'Reconnect must recover the exact same curve and network.');
  const otherBrowser = harness(renamed); await flush(); assert.equal(signal.fingerprint(otherBrowser.window.ApotStage.current()), signal.fingerprint(fixed));

  const expires = harness(account()); await flush(); expires.advance(3601000); locked(expires);
  const lost = harness(account()); await flush(); lost.setSession(null);
  await lost.get('export-sound').fire('click'); locked(lost); assert.equal(lost.downloads.length, 0);
  const switched = harness(account()); await flush(); switched.setSession(account('123456789'));
  await switched.get('export-banner').fire('click'); await flush();
  assert.equal(switched.downloads.length, 0, 'A changed server account must not export the previous signature.');
  assert.equal(switched.window.ApotStage.current().seed, signal.seedForIdentity('123456789'));

  const pending = harness(account()); await flush(); pending.delayed.blob = deferred();
  await pending.get('export-banner').fire('click'); await flush();
  await pending.get('x-disconnect').fire('click'); pending.delayed.blob.resolve(); await flush();
  locked(pending); assert.equal(pending.downloads.length, 0, 'An export finishing after logout must be discarded.');
  const pendingCard = harness(account()); await flush(); pendingCard.delayed.blob = deferred();
  const cardRequest = pendingCard.get('export-card').fire('click'); await flush();
  await pendingCard.get('x-disconnect').fire('click'); pendingCard.delayed.blob.resolve(); await cardRequest;
  locked(pendingCard); assert.equal(pendingCard.downloads.length, 0, 'A secondary card finishing after logout must be discarded.');
  const late = harness(account()); late.delayed.avatar = deferred(); await flush();
  await late.get('x-disconnect').fire('click');
  late.delayed.avatar.resolve({ ok: true, status: 200, headers: { get: () => ID }, blob: async () => new Blob(['avatar']) });
  await flush(); locked(late); assert.equal(late.get('export-pfp').disabled, true);
  const noAvatar = harness(account(), { avatarFailure: true }); await flush();
  assert.equal(noAvatar.get('export-pfp').disabled, true); assert.equal(noAvatar.get('export-banner').disabled, false);
  await noAvatar.get('export-banner').fire('click'); await flush(); assert.equal(noAvatar.downloads.length, 1);

  console.log('identity check ok — X required; stable ID binding; URL override blocked; all exports revalidated; logout, expiry and account races locked');
}
run().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  for (const name of oauth.ENV_NAMES) if (originalEnv[name] == null) delete process.env[name]; else process.env[name] = originalEnv[name];
});
