/* Public card for one shared signal. The seed is already public in the post; no account data. */
const card = require('../../lib/share-card');
module.exports = function signalCard(req, res) {
  const seed = String(req.query?.id || '').toUpperCase().replace(/\.PNG$/, '');
  const bytes = /^[0-9A-F]{8}$/.test(seed) ? card.png(seed) : null;
  if (!bytes) { res.statusCode = 404; return res.end('Unknown signal.'); }
  res.statusCode = 200;
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.end(bytes);
};
