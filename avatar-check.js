/* Exercise the real authenticated avatar route: original first, safe fallbacks. */
'use strict';
const assert = require('node:assert/strict');
const oauth = require('./lib/x-oauth');
const avatar = require('./api/x/avatar');
const savedEnv = Object.fromEntries(oauth.ENV_NAMES.map(name => [name, process.env[name]]));
Object.assign(process.env, { X_CLIENT_ID: 'fixture-client', X_CLIENT_SECRET: 'fixture-secret',
  X_REDIRECT_URI: 'https://apot.example/api/x/callback', APOT_SESSION_SECRET: 'fixture-avatar-secret' });
const profile = { v: 1, id: '1847291056384729103', username: 'APOTsignal',
  avatar: 'https://pbs.twimg.com/profile_images/1/face_400x400.jpg', exp: Date.now() + 60000 };
const cookie = data => data ? oauth.SESSION_COOKIE + '=' + encodeURIComponent(oauth.sign(data, process.env.APOT_SESSION_SECRET)) : '';
const response = () => ({ headers: {}, statusCode: 0, body: null,
  setHeader(key, value) { this.headers[key.toLowerCase()] = value; }, end(body) { this.body = body; } });
const original = 'https://pbs.twimg.com/profile_images/1/face.jpg';
const normal = 'https://pbs.twimg.com/profile_images/1/face_normal.jpg';
const image = { type: 'image/png', bytes: Buffer.from('fixture pixels') };
const originalFetch = oauth.fetchAvatarBytes;
async function run() {
  let calls = [];
  oauth.fetchAvatarBytes = async url => { calls.push(url); return image; };
  for (const data of [null, { ...profile, exp: Date.now() - 1 }]) {
    const res = response(); await avatar({ method: 'GET', headers: { cookie: cookie(data) } }, res);
    assert.equal(res.statusCode, 401);
  }
  assert.equal(calls.length, 0, 'Avatar access requires a verified live X session.');
  for (const unavailable of [0, 1, 2]) {
    calls = [];
    oauth.fetchAvatarBytes = async url => { calls.push(url); return calls.length <= unavailable ? null : image; };
    const res = response(); await avatar({ method: 'GET', headers: { cookie: cookie(profile) } }, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(calls, [original, profile.avatar, normal].slice(0, unavailable + 1));
    assert.equal(res.headers['x-apot-account'], profile.id);
    assert.equal(res.headers['cache-control'], 'private, no-store');
    assert.equal(res.body, image.bytes);
  }
  calls = [];
  oauth.fetchAvatarBytes = async url => { calls.push(url); if (calls.length === 1) throw new Error('original unavailable'); return image; };
  const fallback = response(); await avatar({ method: 'GET', headers: { cookie: cookie(profile) } }, fallback);
  assert.equal(fallback.statusCode, 200); assert.deepEqual(calls, [original, profile.avatar]);
  calls = [];
  oauth.fetchAvatarBytes = async url => { calls.push(url); return null; };
  const nativeProfile = { ...profile, avatar: original };
  const missing = response(); await avatar({ method: 'GET', headers: { cookie: cookie(nativeProfile) } }, missing);
  assert.equal(missing.statusCode, 502); assert.deepEqual(calls, [original], 'Duplicate candidates must never be requested twice.');
  console.log('avatar check ok — X required, original first, 400/normal fallbacks, transient failure handled, account binding retained');
}
run().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  oauth.fetchAvatarBytes = originalFetch;
  for (const [key, value] of Object.entries(savedEnv)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
});
