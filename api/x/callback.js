const oauth = require('../../lib/x-oauth');

module.exports = async function callback(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return oauth.sendJson(res, 405, { message: 'X returns here with a code.' });
  }
  const env = oauth.requiredEnv();
  if (!env.ok) return oauth.notConfigured(res, env.missing);

  const requestUrl = new URL(req.url, 'https://apot.local');
  const error = requestUrl.searchParams.get('error');
  if (error) {
    oauth.clearState(res, req);
    return oauth.redirect(res, oauth.returnUrl(error === 'access_denied' ? 'denied' : 'error'));
  }

  const code = requestUrl.searchParams.get('code') || '';
  const state = requestUrl.searchParams.get('state') || '';
  const pending = oauth.readState(req);
  oauth.clearState(res, req);
  if (!pending || !pending.verifier || !pending.state || pending.state !== state || !code) {
    return oauth.redirect(res, oauth.returnUrl('error'));
  }

  try {
    const accessToken = await oauth.exchangeCode(code, pending.verifier);
    const profile = accessToken ? await oauth.fetchProfile(accessToken) : null;
    const session = oauth.sessionFromProfile(profile);
    if (!session) return oauth.redirect(res, oauth.returnUrl('error'));
    oauth.writeSession(res, req, session);
    return oauth.redirect(res, oauth.returnUrl('connected'));
  } catch (_) {
    return oauth.redirect(res, oauth.returnUrl('error'));
  }
};
