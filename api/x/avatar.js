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
    let image = await oauth.fetchAvatarBytes(current.avatar, 0);
    if (!image) image = await oauth.fetchAvatarBytes(oauth.normalAvatar(current.avatar), 0);
    if (!image) return oauth.sendJson(res, 502, { message: 'The X avatar could not be read.' });
    res.statusCode = 200;
    res.setHeader('Content-Type', image.type);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.end(image.bytes);
  } catch (_) {
    oauth.sendJson(res, 502, { message: 'The X avatar could not be read.' });
  }
};
