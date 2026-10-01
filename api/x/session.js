const oauth = require('../../lib/x-oauth');

module.exports = function session(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return oauth.sendJson(res, 405, { message: 'Read the X session with GET.' });
  }
  const env = oauth.requiredEnv();
  if (!env.ok) return oauth.notConfigured(res, env.missing);
  const current = oauth.readSession(req);
  if (!current) return oauth.sendJson(res, 401, { connected: false });
  oauth.sendJson(res, 200, { connected: true, username: current.username, name: current.name || '' });
};
