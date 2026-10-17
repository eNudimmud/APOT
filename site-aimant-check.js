/* Regression: live on-chain facts never show price/stale values; WITNESS hides when empty. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const api = require('./api/onchain');

(async () => {
  // API: parses mint + creator share from mocked RPC, no price fields.
  const fake = async (url, opts) => {
    if (url.includes('jup.ag')) return { ok: true, json: async () => [{ id: api.MINT, holderCount: 5, usdPrice: 1, mcap: 9 }] };
    const { method } = JSON.parse(opts.body);
    const result = {
      getAccountInfo: { value: { owner: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb', data: { program: 'spl-token-2022', parsed: { info: { supply: '1000000000000000', mintAuthority: null, freezeAuthority: null } } } } },
      getTokenAccountsByOwner: { value: [{ account: { data: { parsed: { info: { tokenAmount: { amount: '6534390966188' } } } } } }] },
      getProgramAccounts: [{ account: { data: [Buffer.from([1,0,0,0,0,0,0,0]).toString('base64')] } }, { account: { data: [Buffer.alloc(8).toString('base64')] } }]
    }[method];
    return { ok: true, json: async () => ({ result }) };
  };
  const f = await api.collect(fake, {});
  assert.equal(f.mintAuthorityDisabled, true);
  assert.equal(f.freezeAuthorityDisabled, true);
  assert.equal(f.creatorSharePercent, 0.6534);
  assert.equal(f.tokenAccountsWithBalance, 1);
  assert.equal(f.holderCountJupiter, 5);
  for (const k of Object.keys(f)) assert.ok(!/price|mcap|fdv|volume|liquidity/i.test(k), 'no market field: ' + k);
  await assert.rejects(api.collect(async () => ({ ok: false, status: 429 }), {}));

  // Front-end: run with stub DOM.
  const el = () => ({ textContent: '', hidden: true, href: '', dataset: {}, append(...n) { this.textContent += n.map(x => typeof x === 'string' ? x : (x.textContent || '\n')).join(''); } });
  const ids = { today: el(), 'today-title': el(), 'witness-number': el(), 'witness-date': el(), 'witness-link': el() };
  const facts = {}; const box = { dataset: {}, querySelector: s => (facts[s] ||= el()) };
  const sandbox = { module: { exports: {} }, fetch: () => new Promise(() => {}), document: { getElementById: id => ids[id], querySelector: () => box, createElement: () => el() } };
  vm.runInNewContext(fs.readFileSync(__dirname + '/site-aimant.js', 'utf8'), sandbox);
  const ui = sandbox.module.exports;
  ui.renderWitness(null); assert.equal(ids.today.hidden, true);
  ui.renderWitness(JSON.parse(fs.readFileSync(__dirname + '/witness.json', 'utf8'))); assert.equal(ids.today.hidden, true, 'committed witness.json keeps block hidden');
  ui.renderWitness({ number: 3, text: 'x', x_url: 'https://evil.example/' }); assert.equal(ids.today.hidden, true);
  ui.renderWitness({ number: 3, date: '2026-10-17', text: 'One. Two.', x_url: 'https://x.com/APOTsignal/status/123' });
  assert.equal(ids.today.hidden, false); assert.equal(ids['witness-number'].textContent, 'WITNESS #003');
  ui.renderOnchain(box, null);
  assert.equal(box.dataset.onchain, 'error'); assert.match(facts['[data-fact="status"]'].textContent, /unavailable/i);
  ui.renderOnchain(box, { ...f, updatedAt: '2026-10-17T00:45:00Z' });
  assert.equal(box.dataset.onchain, 'live'); assert.equal(facts['[data-fact="creator"]'].textContent, '0.65% of supply');
  assert.match(facts['[data-fact="status"]'].textContent, /Updated 00:45 UTC/);
  const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
  assert.ok(!/EXAMPLE|0\.65%/.test(html), 'no hardcoded example or numbers in HTML');
  console.log('site-aimant-check: ok');
})().catch(e => { console.error(e); process.exit(1); });
