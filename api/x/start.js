const oauth = require('../../lib/x-oauth');

module.exports = function start(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return oauth.sendJson(res, 405, { message: 'Use Connect with X.' });
  }
  const env = oauth.requiredEnv();
  if (!env.ok) return oauth.notConfigured(res, env.missing);
  let redirectUri;
  try { redirectUri = new URL(process.env.X_REDIRECT_URI); }
  catch (_) { return oauth.notConfigured(res, ['X_REDIRECT_URI']); }
  if (redirectUri.protocol !== 'https:' && redirectUri.hostname !== 'localhost' && redirectUri.hostname !== '127.0.0.1') {
    return oauth.notConfigured(res, ['X_REDIRECT_URI']);
  }
  const state = oauth.randomToken(24);
  const verifier = oauth.randomToken(48);
  oauth.writeStateCookie(res, req, state, verifier);
  oauth.redirect(res, oauth.authorizeUrl(state, oauth.codeChallenge(verifier)));
};
