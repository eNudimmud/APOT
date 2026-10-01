/* X OAuth 2.0 for the profile image and the numeric user id.
   The browser never sees the client secret or the access token.
   The signed cookie keeps the id so the page can restore one seed.
   Scopes are fixed: users.read and tweet.read. tweet.read is the read
   scope X requires for GET /2/users/me. Nothing here posts, follows, or messages. */
const crypto = require('crypto');

const SCOPES = 'users.read tweet.read';
const AUTHORIZE_URL = 'https://x.com/i/oauth2/authorize';
const TOKEN_URL = 'https://api.x.com/2/oauth2/token';
const ME_URL = 'https://api.x.com/2/users/me?user.fields=id,profile_image_url,name,username';
const ENV_NAMES = ['X_CLIENT_ID', 'X_CLIENT_SECRET', 'X_REDIRECT_URI', 'APOT_SESSION_SECRET'];
const STATE_COOKIE = 'apot_x_state';
const SESSION_COOKIE = 'apot_x';
const STATE_MS = 10 * 60 * 1000;
const SESSION_MS = 12 * 60 * 60 * 1000;

function requiredEnv() {
  const missing = ENV_NAMES.filter(name => !String(process.env[name] || '').trim());
  return { ok: missing.length === 0, missing };
}

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function randomToken(bytes) {
  return base64url(crypto.randomBytes(bytes));
}

function codeChallenge(verifier) {
  return base64url(crypto.createHash('sha256').update(verifier).digest());
}

function sign(payload, secret) {
  const body = base64url(Buffer.from(JSON.stringify(payload), 'utf8'));
  const mac = base64url(crypto.createHmac('sha256', secret).update(body).digest());
  return body + '.' + mac;
}

function verify(token, secret) {
  if (!token || !secret || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const expected = base64url(crypto.createHmac('sha256', secret).update(parts[0]).digest());
  const left = Buffer.from(parts[1]);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return null;
  let payload;
  try {
    payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
  } catch (_) {
    return null;
  }
  if (!payload || typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
  return payload;
}

function readCookie(req, name) {
  const header = req && req.headers ? req.headers.cookie || '' : '';
  const pieces = String(header).split(';');
  for (let i = 0; i < pieces.length; i++) {
    const piece = pieces[i].trim();
    const eq = piece.indexOf('=');
    if (eq < 1) continue;
    if (piece.slice(0, eq) !== name) continue;
    try { return decodeURIComponent(piece.slice(eq + 1)); }
    catch (_) { return ''; }
  }
  return '';
}

function isSecure(req) {
  const proto = String((req.headers && req.headers['x-forwarded-proto']) || '').split(',')[0].trim();
  return proto === 'https';
}

function appendCookie(res, line) {
  const current = res.getHeader('Set-Cookie');
  if (!current) res.setHeader('Set-Cookie', line);
  else if (Array.isArray(current)) res.setHeader('Set-Cookie', current.concat(line));
  else res.setHeader('Set-Cookie', [current, line]);
}

function writeCookie(res, req, name, value, opts) {
  const parts = [name + '=' + encodeURIComponent(value), 'Path=' + (opts.path || '/'), 'HttpOnly', 'SameSite=Lax'];
  if (opts.maxAge != null) parts.push('Max-Age=' + String(opts.maxAge));
  if (isSecure(req)) parts.push('Secure');
  appendCookie(res, parts.join('; '));
}

function clearCookie(res, req, name, path) {
  writeCookie(res, req, name, '', { path: path || '/', maxAge: 0 });
}

function authorizeUrl(state, challenge) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.X_CLIENT_ID,
    redirect_uri: process.env.X_REDIRECT_URI,
    scope: SCOPES,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256'
  });
  return AUTHORIZE_URL + '?' + params.toString();
}

function siteOrigin() {
  return new URL(process.env.X_REDIRECT_URI).origin;
}

function returnUrl(flag) {
  const url = new URL('/', siteOrigin());
  if (flag) url.searchParams.set('x', flag);
  url.hash = 'signature';
  return url.toString();
}

function highResAvatar(url) {
  if (typeof url !== 'string') return '';
  return url.replace('_normal.', '_400x400.');
}

function normalAvatar(url) {
  if (typeof url !== 'string') return '';
  return url.replace('_400x400.', '_normal.');
}

function allowAvatarUrl(url) {
  let parsed;
  try { parsed = new URL(url); }
  catch (_) { return false; }
  if (parsed.protocol !== 'https:') return false;
  if (parsed.username || parsed.password) return false;
  const path = parsed.pathname;
  if (parsed.hostname === 'pbs.twimg.com' && path.startsWith('/profile_images/')) return true;
  if (parsed.hostname === 'abs.twimg.com' && path.startsWith('/sticky/default_profile_images/')) return true;
  return false;
}

function validUserId(id) {
  return typeof id === 'string' && /^[0-9]{1,20}$/.test(id);
}

function sessionFromProfile(profile) {
  const data = profile && profile.data;
  if (!data || typeof data.username !== 'string' || typeof data.profile_image_url !== 'string') return null;
  if (!validUserId(data.id)) return null;
  if (!/^[A-Za-z0-9_]{1,15}$/.test(data.username)) return null;
  const avatar = highResAvatar(data.profile_image_url);
  if (!allowAvatarUrl(avatar) && !allowAvatarUrl(data.profile_image_url)) return null;
  const safeAvatar = allowAvatarUrl(avatar) ? avatar : data.profile_image_url;
  const name = typeof data.name === 'string' ? data.name.slice(0, 80) : '';
  return {
    v: 1,
    id: data.id,
    username: data.username,
    name,
    avatar: safeAvatar,
    exp: Date.now() + SESSION_MS
  };
}

function writeStateCookie(res, req, state, verifier) {
  const token = sign({ state, verifier, exp: Date.now() + STATE_MS }, process.env.APOT_SESSION_SECRET);
  writeCookie(res, req, STATE_COOKIE, token, { path: '/api/x', maxAge: Math.floor(STATE_MS / 1000) });
}

function readState(req) {
  return verify(readCookie(req, STATE_COOKIE), process.env.APOT_SESSION_SECRET);
}

function writeSession(res, req, session) {
  const token = sign(session, process.env.APOT_SESSION_SECRET);
  writeCookie(res, req, SESSION_COOKIE, token, { path: '/', maxAge: Math.floor(SESSION_MS / 1000) });
}

function readSession(req) {
  const session = verify(readCookie(req, SESSION_COOKIE), process.env.APOT_SESSION_SECRET);
  if (!session || session.v !== 1 || !allowAvatarUrl(session.avatar)) return null;
  if (!validUserId(session.id)) return null;
  if (!/^[A-Za-z0-9_]{1,15}$/.test(session.username || '')) return null;
  return session;
}

function clearState(res, req) {
  clearCookie(res, req, STATE_COOKIE, '/api/x');
}

function clearSession(res, req) {
  clearCookie(res, req, SESSION_COOKIE, '/');
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store');
  res.end(JSON.stringify(body));
}

function notConfigured(res, missing) {
  sendJson(res, 503, {
    configured: false,
    missing,
    message: 'X sign-in needs server secrets. Nothing was connected.'
  });
}

function redirect(res, location) {
  res.statusCode = 302;
  res.setHeader('Location', location);
  res.setHeader('Cache-Control', 'private, no-store');
  res.end();
}

async function exchangeCode(code, verifier) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.X_REDIRECT_URI,
    code_verifier: verifier,
    client_id: process.env.X_CLIENT_ID
  });
  const basic = Buffer.from(process.env.X_CLIENT_ID + ':' + process.env.X_CLIENT_SECRET).toString('base64');
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + basic,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body,
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) return null;
  const json = await response.json();
  if (!json || typeof json.access_token !== 'string' || !json.access_token) return null;
  return json.access_token;
}

async function fetchProfile(accessToken) {
  const response = await fetch(ME_URL, {
    headers: { Authorization: 'Bearer ' + accessToken },
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) return null;
  return response.json();
}

async function fetchAvatarBytes(url, depth) {
  if (!allowAvatarUrl(url) || depth > 2) return null;
  const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(8000) });
  if (response.status >= 300 && response.status < 400) {
    return fetchAvatarBytes(response.headers.get('location'), depth + 1);
  }
  if (!response.ok) return null;
  const type = String(response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (type !== 'image/jpeg' && type !== 'image/png' && type !== 'image/webp') return null;
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length || bytes.length > 4000000) return null;
  return { type, bytes };
}

module.exports = {
  SCOPES,
  AUTHORIZE_URL,
  TOKEN_URL,
  ME_URL,
  ENV_NAMES,
  STATE_COOKIE,
  SESSION_COOKIE,
  requiredEnv,
  randomToken,
  codeChallenge,
  sign,
  verify,
  readCookie,
  authorizeUrl,
  returnUrl,
  highResAvatar,
  normalAvatar,
  allowAvatarUrl,
  sessionFromProfile,
  writeStateCookie,
  readState,
  writeSession,
  readSession,
  clearState,
  clearSession,
  sendJson,
  notConfigured,
  redirect,
  exchangeCode,
  fetchProfile,
  fetchAvatarBytes
};
