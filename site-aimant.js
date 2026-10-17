(() => {
  'use strict';
  const pad = n => String(n).padStart(2, '0');
  const utc = iso => { const d = new Date(iso); return isNaN(d) ? null : pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ' UTC'; };

  function validWitness(w) {
    return w && typeof w.text === 'string' && w.text.trim() && Number.isInteger(w.number) && w.number > 0 &&
      typeof w.x_url === 'string' && /^https:\/\/(x|twitter)\.com\/APOTsignal\/status\/\d+$/i.test(w.x_url);
  }
  function renderWitness(data) {
    const section = document.getElementById('today');
    if (!section) return;
    const list = Array.isArray(data) ? data : [data];
    const w = list.filter(validWitness).sort((a, b) => b.number - a.number)[0];
    if (!w) { section.hidden = true; return; }
    const text = w.text.trim();
    const cut = text.search(/[.!?]\s/);
    const title = document.getElementById('today-title');
    title.textContent = '';
    if (cut > 0) {
      title.append(text.slice(0, cut + 1), document.createElement('br'));
      const em = document.createElement('em'); em.textContent = text.slice(cut + 2); title.append(em);
    } else title.textContent = text;
    document.getElementById('witness-number').textContent = 'WITNESS #' + String(w.number).padStart(3, '0');
    document.getElementById('witness-date').textContent = typeof w.date === 'string' ? w.date : '';
    document.getElementById('witness-link').href = w.x_url;
    section.hidden = false;
  }
  fetch('/witness.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(renderWitness).catch(() => renderWitness(null));

  function renderOnchain(box, f) {
    const set = (k, v) => { box.querySelector('[data-fact="' + k + '"]').textContent = v; };
    if (!f || typeof f.mintAuthorityDisabled !== 'boolean' || typeof f.freezeAuthorityDisabled !== 'boolean' || !utc(f.updatedAt)) {
      box.dataset.onchain = 'error';
      set('status', 'Live data unavailable — check on Solscan.');
      return;
    }
    set('mint', f.mintAuthorityDisabled ? 'Disabled' : 'Active');
    set('freeze', f.freezeAuthorityDisabled ? 'Disabled' : 'Active');
    set('creator', typeof f.creatorSharePercent === 'number' ? f.creatorSharePercent.toFixed(2) + '% of supply' : 'Unavailable');
    const holders = Number.isInteger(f.tokenAccountsWithBalance) ? f.tokenAccountsWithBalance : f.holderCountJupiter;
    set('holders', Number.isInteger(holders) ? String(holders) : 'Unavailable');
    set('status', 'Live from Solana · Updated ' + utc(f.updatedAt) + '.');
    box.dataset.onchain = 'live';
  }
  const box = document.querySelector('.onchain');
  if (box) fetch('/api/onchain').then(r => r.ok ? r.json() : null).then(f => renderOnchain(box, f)).catch(() => renderOnchain(box, null));

  if (typeof module !== 'undefined') module.exports = { validWitness, renderOnchain, renderWitness };
})();
