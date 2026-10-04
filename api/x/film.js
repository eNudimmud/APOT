const oauth = require('../../lib/x-oauth');
const film = require('../../lib/signal-film');
const active = new Set(), cache = new Map();

module.exports = async function signalFilm(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return oauth.sendJson(res, 405, { message: 'Create your film with POST.' });
  }
  const env = oauth.requiredEnv();
  if (!env.ok) return oauth.notConfigured(res, env.missing);
  const current = oauth.readSession(req);
  if (!current) return oauth.sendJson(res, 401, { connected: false });
  let origin, ownOrigin;
  try {
    origin = new URL(req.headers.origin || '').origin;
    ownOrigin = req.headers.host ? new URL('https://' + req.headers.host).origin : new URL(process.env.X_REDIRECT_URI).origin;
  } catch (_) {}
  if (!origin || origin !== ownOrigin) return oauth.sendJson(res, 403, { message: 'Create your film from apot.world.' });
  if (req.headers['x-apot-account'] !== current.id) return oauth.sendJson(res, 409, { message: 'Your X account changed. Reconnect before creating a film.' });
  if (!String(req.headers['content-type'] || '').startsWith('application/json')) return oauth.sendJson(res, 415, { message: 'An edition palette is required.' });
  let body = req.body;
  try {
    if (typeof body === 'string' || Buffer.isBuffer(body)) {
      if (Buffer.byteLength(body) > 1024) return oauth.sendJson(res, 413, { message: 'Invalid edition request.' });
      body = JSON.parse(body.toString());
    }
  } catch (_) { return oauth.sendJson(res, 400, { message: 'Invalid edition request.' }); }
  if (!body || Array.isArray(body) || Object.keys(body).some(key => key !== 'tone') || !['midnight', 'paper'].includes(body.tone)) return oauth.sendJson(res, 400, { message: 'Choose an edition palette.' });
  const key = JSON.stringify([current.id, current.username, body.tone]);
  const cached = cache.get(key);
  let result = cached && cached.expires > Date.now() ? cached.result : null, ownsSlot = false;
  const cancellation = new AbortController();
  const onClose = () => { if (!res.writableEnded) cancellation.abort(); };
  if (!result && (active.has(current.id) || active.size >= 2)) {
    res.setHeader('Retry-After', '5');
    return oauth.sendJson(res, 429, { message: 'The studio is rendering. Please retry in a moment.' });
  }
  try {
    if (!result) {
      active.add(current.id);
      ownsSlot = true;
      res.on?.('close', onClose);
      result = await film.render(current, body.tone, { signal: cancellation.signal });
      if (cancellation.signal.aborted) return;
      if (cache.size >= 6) cache.delete(cache.keys().next().value);
      cache.set(key, { result, expires: Date.now() + 5 * 60000 });
    }
    if (cancellation.signal.aborted) return;
    const verified = oauth.readSession(req);
    if (!verified || verified.id !== current.id) return oauth.sendJson(res, 401, { connected: false });
    res.statusCode = 200;
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-APOT-Account', current.id);
    res.setHeader('X-APOT-Seed', result.seed);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', 'attachment; filename="apot-' + result.seed + '-' + body.tone + '-signal.mp4"');
    res.end(result.bytes);
  } catch (_) {
    if (!cancellation.signal.aborted) oauth.sendJson(res, 503, { message: 'Your film could not be created. Please retry.' });
  } finally {
    if (ownsSlot) active.delete(current.id);
    res.off?.('close', onClose);
  }
};
