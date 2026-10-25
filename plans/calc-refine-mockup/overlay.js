// Mockup overlay: draws U1 (Protean / Libero type) and U2 (residual per turn) on the real calc. Not shipped.
(() => {
  const M = {eot: 'sand', pro: 'mine', pty: {mine: '', foe: ''}, tox: {mine: 1, foe: 1}};
  const SC = {
    off: {},
    sand: {mine: [['Leftovers', 1, 16]], foe: [['sandstorm', -1, 16]]},
    toxic: {mine: [['Black Sludge', -1, 8]], foe: [['toxic', -1, 16, 1]]},
    hack: {mine: [['Self Sufficient', 1, 16]], foe: [['Grassy Terrain', 1, 16], ['poison', -1, 8]]},
  };
  const TYPES = ['Normal', 'Fighting', 'Flying', 'Poison', 'Ground', 'Rock', 'Bug', 'Ghost', 'Steel', 'Fire', 'Water',
    'Grass', 'Electric', 'Psychic', 'Ice', 'Dragon', 'Dark', 'Fairy'];
  const st = document.createElement('style');
  st.textContent = `.deot{display:flex;gap:3px;align-items:stretch;grid-column:1/-1;min-width:0}
.deot>span{flex:none;align-self:center;color:var(--mut);font:600 10px system-ui}
.deot button{flex:1 1 0;min-width:0;min-height:26px;display:flex;gap:4px;align-items:center;padding:0 6px;border:1px solid var(--line);border-radius:6px;background:var(--panel2);color:var(--fg);font:600 12px system-ui;cursor:pointer;touch-action:manipulation}
.deot button .v{flex:none;position:static;font-weight:700;margin-right:4px}.deot button{display:flex!important}.deot button .v.dn{color:#ff7b6b}.deot button .v.up{color:#5fd37a}
.deot button .n{position:static;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--mut);font-size:11px}
.mr .dd .eotl{color:var(--mut)}
.ed .e2.pty{display:flex;align-items:center;gap:4px}.ed .e2.pty>span{flex:none;color:var(--mut);font:600 11px system-ui}
.ed .e2.pty>select{flex:1;min-width:0}
.cc .cn .td{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:4px;vertical-align:1px}`;
  document.head.appendChild(st);

  const card = side => document.querySelector(`.dmatch .cc[data-s="${side}"]`);
  const maxHp = side => Number((card(side)?.querySelector('.mx')?.textContent || '/0').slice(1));
  const curHp = side => Number(card(side)?.querySelector(`[data-hp="${side}"]`)?.value || 0);
  const nameOf = side => card(side)?.querySelector('.cn b')?.textContent.trim() || side;
  // HP change on one turn (turn 1 = the next end of turn), with each part's label.
  function turn(side, n) {
    const max = maxHp(side);
    return (SC[M.eot][side] || []).map(([label, sign, d, tox]) => {
      const v = Math.max(1, Math.floor(max * (tox ? M.tox[side] + n - 1 : 1) / d));
      return [label, sign * v];
    });
  }
  const total = (side, n) => turn(side, n).reduce((s, [, v]) => s + v, 0);
  const sgn = v => (v > 0 ? '+' : '−') + Math.abs(v);

  // KO count with the defender's end-of-turn change after each turn (rolls: 16 values, one hit per turn).
  function ko(rolls, side) {
    const hp = curHp(side), room = maxHp(side) - hp;
    if (hp <= 0) return {n: 0, p: 0};
    let dist = new Map([[0, 1]]), p = 0;
    for (let n = 1; n <= 4; n++) {
      const next = new Map(), eot = total(side, n);
      for (const [dmg, pr] of dist) for (const r of rolls) {
        let d = dmg + r;
        if (d >= hp) { p += pr / 16; continue; }
        d = Math.max(-room, d - eot);
        if (d >= hp) { p += pr / 16; continue; }
        next.set(d, (next.get(d) || 0) + pr / 16);
      }
      dist = next;
      if (p > 0) return {n, p: Math.min(1, p)};
    }
    return {n: 0, p: 0};
  }
  const koTxt = k => !k.n ? '5+ hits' : (k.n === 1 ? 'OHKO' : k.n + 'HKO') + (k.p < 1 ? ' ' + Math.min(99, Math.max(1, Math.round(k.p * 100))) + '%' : '');

  const OWN = {Garchomp: 'Dragon/Ground', Snover: 'Grass/Ice'};
  const obs = new MutationObserver(() => apply());
  function apply() {
    obs.disconnect();
    try {
      const dm = document.querySelector('.dmatch');
      if (!dm) return;
      // U2: strip under the cards.
      dm.querySelector('.deot')?.remove();
      const sides = ['mine', 'foe'].filter(s => card(s) && turn(s, 1).length);
      if (sides.length) {
        const strip = document.createElement('div');
        strip.className = 'deot';
        strip.innerHTML = '<span>Turn end</span>' + sides.map(s => {
          const v = total(s, 1);
          return `<button data-eot="${s}" title="${turn(s, 1).map(([l, x]) => sgn(x) + ' ' + l).join(', ')}"><span class="v ${v < 0 ? "dn" : "up"}">${v ? sgn(v) : "±0"}</span><span class="n">${nameOf(s)}</span></button>`;
        }).join('');
        card('foe').after(strip);
      }
      // U2: KO text and the details line on the attacker's rows.
      const att = document.querySelector('.dmatch .cc.att')?.dataset.s, def = att === 'mine' ? 'foe' : 'mine';
      document.querySelectorAll('.dres:not(.na) .mr').forEach(row => {
        const rolls = row.querySelector('.rolls')?.textContent.trim().split(/\s+/).map(Number);
        const k = row.querySelector('.r2 .ko');
        if (!rolls || rolls.length !== 16 || !k) return;
        row.querySelector('.eotl')?.remove();
        const parts = turn(def, 1);
        if (!parts.length) return;
        const r = ko(rolls, def);
        k.textContent = koTxt(r);
        k.className = 'ko' + (r.n === 1 ? ' k1' : r.n === 2 ? ' k2' : '');
        const line = document.createElement('div');
        line.className = 'eotl';
        line.textContent = 'Turn end: ' + parts.map(([l, x]) => sgn(x) + ' ' + l).join(', ') + (parts.some(([l]) => l === 'toxic') ? ' (rising)' : '');
        row.querySelector('.rolls')?.before(line);
      });
      // U1: type choice in the edit panel, dot on the name.
      for (const s of ['mine', 'foe']) {
        const c = card(s);
        if (!c) continue;
        c.querySelector('.cn .td')?.remove();
        const on = M.pro === s, t = on && M.pty[s];
        if (t) c.querySelector('.cn b')?.insertAdjacentHTML('afterbegin', `<i class="td" style="background:${TC[t.toLowerCase()]}"></i>`);
        const ed = c.querySelector('.ed');
        ed?.querySelector('.pty')?.remove();
        if (on && ed) {
          const own = OWN[c.querySelector('.cn b').textContent.trim()] || 'Own';
          const row = document.createElement('div');
          row.className = 'e2 pty';
          row.innerHTML = `<span>Type</span><select data-pty="${s}" data-b="1"><option value="">${own} (own)</option>${TYPES.map(x => `<option${x === M.pty[s] ? ' selected' : ''}>${x}</option>`).join('')}</select>`;
          ed.querySelectorAll('.e2')[1].after(row);
        }
      }
    } finally {
      obs.observe(document.body, {childList: true, subtree: true});
    }
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-eot]');
    if (!b) return;
    e.stopPropagation();
    const s = b.dataset.eot, input = card(s).querySelector(`[data-hp="${s}"]`);
    input.value = Math.max(0, Math.min(maxHp(s), curHp(s) + total(s, 1)));
    if (turn(s, 1).some(([l]) => l === 'toxic')) M.tox[s]++;
    input.dispatchEvent(new Event('input', {bubbles: true}));
    input.dispatchEvent(new Event('change', {bubbles: true}));
    setTimeout(apply, 50);
  }, true);
  document.addEventListener('change', e => {
    const sel = e.target.closest('[data-pty]');
    if (!sel) return;
    e.stopPropagation();
    M.pty[sel.dataset.pty] = sel.value;
    apply();
  }, true);
  apply();
  window.setOption = (k, v) => {
    if (k === 'eot') { M.eot = v; M.tox = {mine: 1, foe: 1}; }
    if (k === 'pro') M.pro = v;
    apply();
  };
})();
