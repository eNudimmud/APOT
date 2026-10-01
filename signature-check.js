/* Deterministic acceptance check for the λP⊙T signal signature.
   node signature-check.js */
'use strict';

const crypto = require('crypto');
const engine = require('./signature-engine.js');

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

const empty = crypto.createHash('sha256').update('').digest('hex');
const seeded = crypto.createHash('sha256').update(engine.FIXTURE_SEED).digest('hex');
if (engine.sha256Hex('') !== empty) fail('SHA-256 empty string does not match Node crypto');
if (engine.sha256Hex(engine.FIXTURE_SEED) !== seeded) fail('SHA-256 fixture seed does not match Node crypto');

const check = engine.selfCheck();
if (!check.ok) fail('Self-check failed: ' + check.problems.join(', '));

const sig = engine.derive(engine.FIXTURE_SEED);
const again = engine.derive(engine.FIXTURE_SEED);
if (engine.canonical(sig) !== engine.canonical(again)) fail('Canonical form changed between calls');
if (engine.fingerprint(sig) !== engine.FIXTURE) fail('Fingerprint does not match the frozen fixture');

const identityMaterial = 'apot-x-user:' + engine.FIXTURE_X_ID;
const identityHash = crypto.createHash('sha256').update(identityMaterial).digest('hex');
if (engine.sha256Hex(identityMaterial) !== identityHash) fail('X identity hash does not match Node crypto');
const identitySeed = engine.seedForIdentity(engine.FIXTURE_X_ID);
const identitySeedAgain = engine.seedForIdentity(engine.FIXTURE_X_ID);
if (identitySeed !== identitySeedAgain || identitySeed !== engine.FIXTURE_X_SEED) {
  fail('Fixed X id did not restore the same seed twice');
}
if (engine.seedForIdentity('APOTsignal') !== null) fail('A username must not produce an identity seed');
const identity = engine.derive(identitySeed);
const identityAgain = engine.derive(engine.seedForIdentity(engine.FIXTURE_X_ID));
if (!identity || !identityAgain) fail('X identity seed did not derive');
if (identity.lambdaId !== identityAgain.lambdaId || identity.lambdaId !== engine.FIXTURE_X_LAMBDA) {
  fail('Fixed X id did not restore the same λ-ID twice');
}
if (engine.canonical(identity) !== engine.canonical(identityAgain)) fail('X identity signal changed between generations');
if (engine.fingerprint(identity) !== engine.FIXTURE_X_FINGERPRINT) fail('X identity fingerprint does not match the frozen fixture');

const prints = engine.ARCHIVE.map(seed => {
  const item = engine.summary(engine.derive(seed));
  return item.lambdaId + '  ' + item.seed + '  ' + item.resting + ' mV  ' + item.threshold + ' mV  ' + item.amplitude + ' mV  ' + item.frequency.toFixed(1) + ' Hz  ' + item.clusters + ' clusters  ' + item.nodes + ' nodes  ' + item.edges + ' edges';
});

if (process.exitCode) {
  console.error('signature check failed');
} else {
  console.log('signature check ok');
  console.log(check.summary.lambdaId + '  fingerprint ' + check.summary.fingerprint);
  console.log(engine.FIXTURE_X_ID + '  ' + identity.lambdaId + '  ' + identity.seed + '  fingerprint ' + engine.fingerprint(identity));
  prints.forEach(line => console.log(line));
}
