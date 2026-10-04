const oauth = require('../../lib/x-oauth');

module.exports = async function avatar(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return oauth.sendJson(res, 405, { message: 'The avatar is read with GET.' });
  }
  const env = oauth.requiredEnv();
  if (!env.ok) return oauth.notConfigured(res, env.missing);
  const current = oauth.readSession(req);
  if (!current) return oauth.sendJson(res, 401, { connected: false });

  try {
    let image = null;
    const candidates = [...new Set([oauth.originalAvatar(current.avatar), current.avatar, oauth.normalAvatar(current.avatar)])].filter(Boolean);
    for (const url of candidates) {
      try { image = await oauth.fetchAvatarBytes(url, 0); } catch (_) { /* Try the next verified X image size. */ }
      if (image) break;
    }
    if (!image) return oauth.sendJson(res, 502, { message: 'The X avatar could not be read.' });
    res.statusCode = 200;
    res.setHeader('Content-Type', image.type);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-APOT-Account', current.id);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.end(image.bytes);
  } catch (_) {
    oauth.sendJson(res, 502, { message: 'The X avatar could not be read.' });
  }
};
