/* Checks the X sign-in helper without calling X or using real secrets. */
const assert = require('assert');
const oauth = require('./lib/x-oauth');
const start = require('./api/x/start');

function mockRes() {
  const headers = {};
  return {
    statusCode: 0,
    headers,
    body: '',
    setHeader(key, value) { headers[key.toLowerCase()] = value; },
    getHeader(key) { return headers[key.toLowerCase()]; },
    end(body) { this.body = body == null ? '' : body; }
  };
}

const secret = 'test-session-secret';
const session = {
  v: 1,
  username: 'APOTsignal',
  name: 'λP⊙T',
  avatar: 'https://pbs.twimg.com/profile_images/1/face_400x400.jpg',
  exp: Date.now() + 60000
};
const token = oauth.sign(session, secret);
const read = oauth.verify(token, secret);
assert.strictEqual(read.username, 'APOTsignal');
assert.strictEqual(oauth.verify(token + 'x', secret), null);
assert.strictEqual(oauth.verify(token, 'other-secret'), null);
const expired = oauth.sign(Object.assign({}, session, { exp: Date.now() - 1000 }), secret);
assert.strictEqual(oauth.verify(expired, secret), null);

assert.strictEqual(
  oauth.highResAvatar('https://pbs.twimg.com/profile_images/1/face_normal.jpg'),
  'https://pbs.twimg.com/profile_images/1/face_400x400.jpg'
);
assert.strictEqual(oauth.allowAvatarUrl('https://pbs.twimg.com/profile_images/1/face_400x400.jpg'), true);
assert.strictEqual(oauth.allowAvatarUrl('https://abs.twimg.com/sticky/default_profile_images/default.png'), true);
assert.strictEqual(oauth.allowAvatarUrl('http://pbs.twimg.com/profile_images/1/face.jpg'), false);
assert.strictEqual(oauth.allowAvatarUrl('https://example.com/profile_images/1/face.jpg'), false);
assert.strictEqual(oauth.allowAvatarUrl('https://pbs.twimg.com/media/not-an-avatar.jpg'), false);

const profile = oauth.sessionFromProfile({
  data: {
    username: 'signal_test',
    name: 'Signal',
    profile_image_url: 'https://pbs.twimg.com/profile_images/9/a_normal.jpg'
  }
});
assert.strictEqual(profile.avatar, 'https://pbs.twimg.com/profile_images/9/a_400x400.jpg');
assert.strictEqual(oauth.sessionFromProfile({ data: { username: 'bad name', profile_image_url: profile.avatar } }), null);
assert.strictEqual(oauth.sessionFromProfile({ data: { username: 'ok', profile_image_url: 'https://evil.example/a.jpg' } }), null);

assert.strictEqual(oauth.SCOPES, 'users.read tweet.read');
assert.ok(!/tweet\.write|dm\.|follows\.|like\.write|offline\.access|mute\.|block\./.test(oauth.SCOPES));

const saved = {};
oauth.ENV_NAMES.forEach(name => { saved[name] = process.env[name]; delete process.env[name]; });
const missingRes = mockRes();
start({ method: 'GET', headers: {} }, missingRes);
assert.strictEqual(missingRes.statusCode, 503);
const missingBody = JSON.parse(missingRes.body);
assert.deepStrictEqual(missingBody.missing, oauth.ENV_NAMES);
assert.ok(!JSON.stringify(missingBody).includes('secret-value'));

process.env.X_CLIENT_ID = 'client-id';
process.env.X_CLIENT_SECRET = 'client-secret';
process.env.X_REDIRECT_URI = 'https://apot.example/api/x/callback';
process.env.APOT_SESSION_SECRET = secret;
const begin = mockRes();
start({ method: 'GET', headers: { 'x-forwarded-proto': 'https' } }, begin);
assert.strictEqual(begin.statusCode, 302);
const location = new URL(begin.headers.location);
assert.strictEqual(location.origin + location.pathname, oauth.AUTHORIZE_URL);
assert.strictEqual(location.searchParams.get('scope'), oauth.SCOPES);
assert.strictEqual(location.searchParams.get('code_challenge_method'), 'S256');
assert.strictEqual(location.searchParams.get('client_id'), 'client-id');
assert.ok(!location.searchParams.get('client_secret'));
const cookie = begin.headers['set-cookie'];
assert.ok(String(cookie).includes('Secure'));
assert.ok(String(cookie).includes('HttpOnly'));
assert.ok(!String(cookie).includes('client-secret'));

const back = oauth.returnUrl('connected');
assert.strictEqual(back, 'https://apot.example/?x=connected#signature');

const callback = require('./api/x/callback');
const denied = mockRes();
callback({ method: 'GET', url: '/api/x/callback?error=access_denied', headers: {} }, denied).then(() => {
  assert.strictEqual(denied.statusCode, 302);
  assert.strictEqual(denied.headers.location, 'https://apot.example/?x=denied#signature');
  assert.ok(!String(denied.body).includes('client-secret'));
  oauth.ENV_NAMES.forEach(name => {
    if (saved[name] == null) delete process.env[name];
    else process.env[name] = saved[name];
  });
  console.log('x oauth check ok');
  console.log('scopes', oauth.SCOPES);
}).catch(error => {
  console.error(error);
  process.exit(1);
});
