'use strict';
// Live, verifiable on-chain facts for $APOT. No price, market cap or volume, by design.
const MINT = 'GsUXfGLgAvfMKxiCUVoe8iNaMR4dqP5xBbXcD8BbAP4o';
const DEV = '7DRuQujbpHZBzZWoSWvGBQg1yW2zWcMunj6XEHFaqkhF';
const TOKEN_2022 = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
const PUBLIC_RPC = 'https://api.mainnet-beta.solana.com';
const JUP = 'https://lite-api.jup.ag/tokens/v2/search?query=' + MINT;

function sendJson(res, status, body, cache) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', cache || 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(body));
}

async function rpc(url, method, params, fetchImpl) {
  const response = await fetchImpl(url, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new Error(method + ' HTTP ' + response.status);
  const json = await response.json();
  if (json.error) throw new Error(method + ': ' + json.error.message);
  return json.result;
}

function readU64LE(base64) {
  const bytes = Buffer.from(base64, 'base64');
  return bytes.length >= 8 ? bytes.readBigUInt64LE(0) : 0n;
}

function share(part, whole) {
  if (!whole) return null;
  return Number((part * 1000000n) / whole) / 10000; // percent, 4 decimals
}

async function collect(fetchImpl, env) {
  const url = (env && env.SOLANA_RPC_URL) || PUBLIC_RPC;
  const mint = await rpc(url, 'getAccountInfo', [MINT, { encoding: 'jsonParsed' }], fetchImpl);
  const info = mint && mint.value && mint.value.data && mint.value.data.parsed && mint.value.data.parsed.info;
  if (!info) throw new Error('Mint account not readable');
  const supply = BigInt(info.supply);
  const devAccounts = await rpc(url, 'getTokenAccountsByOwner', [DEV, { mint: MINT }, { encoding: 'jsonParsed' }], fetchImpl);
  const devRaw = (devAccounts.value || []).reduce((sum, a) => sum + BigInt(a.account.data.parsed.info.tokenAmount.amount), 0n);
  const facts = {
    mint: MINT,
    program: mint.value.owner === TOKEN_2022 ? 'spl-token-2022' : mint.value.data.program,
    mintAuthorityDisabled: info.mintAuthority === null,
    freezeAuthorityDisabled: info.freezeAuthority === null,
    creatorWallet: DEV,
    creatorSharePercent: share(devRaw, supply),
    tokenAccountsWithBalance: null,
    holderCountJupiter: null,
    source: url === PUBLIC_RPC ? 'solana-public-rpc' : 'solana-rpc',
    updatedAt: new Date().toISOString()
  };
  try {
    const accounts = await rpc(url, 'getProgramAccounts', [TOKEN_2022, {
      encoding: 'base64', dataSlice: { offset: 64, length: 8 },
      filters: [{ memcmp: { offset: 0, bytes: MINT } }]
    }], fetchImpl);
    facts.tokenAccountsWithBalance = accounts.filter(a => readU64LE(a.account.data[0]) > 0n).length;
  } catch (_) { /* Optional: public RPCs may refuse getProgramAccounts. */ }
  try {
    const response = await fetchImpl(JUP, { signal: AbortSignal.timeout(5000) });
    const list = response.ok ? await response.json() : [];
    const token = Array.isArray(list) ? list.find(t => t.id === MINT) : null;
    if (token && Number.isInteger(token.holderCount)) facts.holderCountJupiter = token.holderCount;
  } catch (_) { /* Optional secondary source. */ }
  return facts;
}

async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { message: 'On-chain facts are read with GET.' });
  }
  try {
    const facts = await collect(globalThis.fetch, process.env);
    sendJson(res, 200, facts, 'public, s-maxage=300, stale-while-revalidate=600');
  } catch (_) {
    sendJson(res, 502, { message: 'Live on-chain data is unavailable.' });
  }
}

module.exports = handler;
module.exports.collect = collect;
module.exports.MINT = MINT;
