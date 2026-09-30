const oauth = require('../../lib/x-oauth');

module.exports = function logout(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return oauth.sendJson(res, 405, { message: 'Disconnect with POST.' });
  }
  oauth.clearSession(res, req);
  oauth.sendJson(res, 200, { connected: false });
};
