// Move effects: the one resolver every move effect goes through (plans/calc-move-effects.md, tools/calc/README.md →
// Move effects). Status-move buttons (`DMG.effect`), damaging moves' guaranteed secondaries (`DMG.hit`) and the move
// switches all call `resolve`. The move never decides who it lands on: each part names `who` (the user or its
// target) and the blockers below decide whether it lands. Generation ranges follow Pokémon Showdown at the pinned
// commit in tools/calc/move-effects.json (data/abilities.ts, items.ts, conditions.ts, typechart and the gen mods);
// a hack that differs sets `over.effects.rules.blockers[id]` (false = off, [from, to] = its generations).

const STATS = ['atk', 'def', 'spa', 'spd', 'spe'];
export const STAT_LABEL = {atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe', acc: 'Acc', eva: 'Eva'};
export const STATUS_LABEL = {par: 'Par', brn: 'Brn', psn: 'Psn', tox: 'Tox', slp: 'Slp', frz: 'Frz'};
const STATUS_TEXT = {par: 'paralysed', brn: 'burned', psn: 'poisoned', tox: 'badly poisoned', slp: 'asleep', frz: 'frozen'};
const MOLD = ['Mold Breaker', 'Teravolt', 'Turboblaze'];
// Volatiles the page already keeps as a Field / Edit state with a move switch (template/calc.js MOVE_OWN /
// MOVE_OTHER / vol): the switch is that part; the resolver only adds the move's other parts.
export const SWITCH_VOLATILES = new Set(['leechseed', 'focusenergy', 'charge', 'ingrain', 'aquaring', 'magnetrise',
  'telekinesis', 'laserfocus', 'foresight', 'miracleeye', 'tartshot', 'tarshot', 'powertrick', 'smackdown', 'curse',
  'nightmare', 'saltcure', 'minimize', 'defensecurl', 'protect', 'roost', 'glaiverush', 'dragoncheer', 'luckychant',
  'helpinghand', 'stockpile', 'partiallytrapped', 'banefulbunker', 'spikyshield', 'kingsshield', 'obstruct', 'silktrap',
  'burningbulwark', 'detect', 'endure']);
// Berries / herbs that cure on the spot (Showdown items.ts onUpdate); Mental Herb's list is Gen 5+, attract only in Gen 4.
const CURE_BERRY = {'Cheri Berry': ['par'], 'Chesto Berry': ['slp'], 'Pecha Berry': ['psn', 'tox'],
  'Rawst Berry': ['brn'], 'Aspear Berry': ['frz'], 'Lum Berry': ['par', 'slp', 'psn', 'tox', 'brn', 'frz', 'confusion'],
  'Persim Berry': ['confusion']};
const MENTAL = ['attract', 'taunt', 'encore', 'torment', 'disable', 'healblock'];

// Blocker table. `on`: what it stops (a status key, `confusion` / another volatile, `drop` = a stat drop caused by the
// opponent, `drop:<stat>`, `sec` = the opponent's secondaries on this Pokémon, `move:<flag>` = the whole move, `status`
// = any major status). `by`: ability / item / type / field. `gen`: [first, last]. `ign`: Mold Breaker ignores it.
// `foe`: only when the opponent causes it. `test(ctx)`: an extra condition. Sources: Showdown data at the pinned commit.
export const BLOCKERS = [
  {id: 'limber', on: ['par'], ability: 'Limber', gen: [4, 9], ign: true},
  {id: 'electric-par', on: ['par'], type: 'Electric', gen: [6, 9]},
  {id: 'insomnia', on: ['slp'], ability: ['Insomnia', 'Vital Spirit'], gen: [4, 9], ign: true},
  {id: 'sweet-veil', on: ['slp'], ability: 'Sweet Veil', gen: [6, 9], ign: true},
  {id: 'electric-terrain', on: ['slp'], terrain: 'Electric', grounded: true, gen: [6, 9]},
  {id: 'water-veil', on: ['brn'], ability: 'Water Veil', gen: [4, 9], ign: true},
  {id: 'water-bubble', on: ['brn'], ability: 'Water Bubble', gen: [7, 9], ign: true},
  {id: 'thermal-exchange', on: ['brn'], ability: 'Thermal Exchange', gen: [9, 9], ign: true},
  {id: 'fire-brn', on: ['brn'], type: 'Fire', gen: [4, 9]},
  {id: 'immunity', on: ['psn', 'tox'], ability: 'Immunity', gen: [4, 9], ign: true},
  {id: 'pastel-veil', on: ['psn', 'tox'], ability: 'Pastel Veil', gen: [8, 9], ign: true},
  {id: 'poison-psn', on: ['psn', 'tox'], type: ['Poison', 'Steel'], gen: [4, 9], test: c => !(c.gen >= 7 && c.foe && c.source.hasAbility('Corrosion'))},
  {id: 'magma-armor', on: ['frz'], ability: 'Magma Armor', gen: [4, 9], ign: true},
  {id: 'ice-frz', on: ['frz'], type: 'Ice', gen: [4, 9]},
  {id: 'comatose', on: ['status'], ability: 'Comatose', gen: [7, 9]},
  {id: 'purifying-salt', on: ['status'], ability: 'Purifying Salt', gen: [9, 9], ign: true},
  {id: 'leaf-guard', on: ['status'], ability: 'Leaf Guard', gen: [4, 9], ign: true, test: c => c.field.hasWeather('Sun', 'Harsh Sunshine')},
  {id: 'flower-veil', on: ['status', 'drop'], ability: 'Flower Veil', gen: [6, 9], ign: true, foe: true, test: c => c.target.hasType('Grass')},
  {id: 'shields-down', on: ['status'], ability: 'Shields Down', gen: [7, 9], test: c => c.target.curHP() > c.target.maxHP() / 2},
  {id: 'safeguard', on: ['status', 'confusion'], side: 'Safeguard', gen: [4, 9], foe: true, test: c => !(c.gen >= 6 && c.source.hasAbility('Infiltrator'))},
  {id: 'misty-terrain', on: ['status'], terrain: 'Misty', grounded: true, gen: [6, 9]},
  {id: 'misty-confusion', on: ['confusion'], terrain: 'Misty', grounded: true, gen: [7, 9]},
  {id: 'own-tempo', on: ['confusion'], ability: 'Own Tempo', gen: [4, 9], ign: true},
  {id: 'oblivious', on: ['attract'], ability: 'Oblivious', gen: [4, 9], ign: true},
  {id: 'oblivious-taunt', on: ['taunt'], ability: 'Oblivious', gen: [6, 9], ign: true},
  {id: 'aroma-veil', on: MENTAL, ability: 'Aroma Veil', gen: [6, 9], ign: true},
  {id: 'inner-focus', on: ['flinch'], ability: 'Inner Focus', gen: [4, 9], ign: true},
  {id: 'clear-body', on: ['drop'], ability: ['Clear Body', 'White Smoke'], gen: [4, 9], ign: true, foe: true},
  {id: 'full-metal-body', on: ['drop'], ability: 'Full Metal Body', gen: [7, 9], foe: true},
  {id: 'hyper-cutter', on: ['drop:atk'], ability: 'Hyper Cutter', gen: [4, 9], ign: true, foe: true},
  {id: 'big-pecks', on: ['drop:def'], ability: 'Big Pecks', gen: [5, 9], ign: true, foe: true},
  {id: 'keen-eye', on: ['drop:acc'], ability: ['Keen Eye', "Mind's Eye", 'Illuminate'], gen: [4, 9], ign: true, foe: true,
    test: c => c.target.hasAbility('Keen Eye') || c.gen >= 9},
  {id: 'mist', on: ['drop'], side: 'Mist', gen: [4, 9], foe: true, test: c => !(c.gen >= 6 && c.source.hasAbility('Infiltrator'))},
  {id: 'clear-amulet', on: ['drop'], item: 'Clear Amulet', gen: [9, 9], foe: true},
  {id: 'shield-dust', on: ['sec'], ability: 'Shield Dust', gen: [4, 9], ign: true},
  {id: 'covert-cloak', on: ['sec'], item: 'Covert Cloak', gen: [9, 9]},
  {id: 'grass-powder', on: ['move:powder'], type: 'Grass', gen: [6, 9]},
  {id: 'overcoat', on: ['move:powder'], ability: 'Overcoat', gen: [6, 9], ign: true},
  {id: 'safety-goggles', on: ['move:powder'], item: 'Safety Goggles', gen: [6, 9]},
  {id: 'soundproof', on: ['move:sound'], ability: 'Soundproof', gen: [4, 9], ign: true},
  {id: 'bulletproof', on: ['move:bullet'], ability: 'Bulletproof', gen: [6, 9], ign: true},
  {id: 'good-as-gold', on: ['move:status'], ability: 'Good as Gold', gen: [9, 9], ign: true},
  {id: 'prankster-dark', on: ['move:status'], type: 'Dark', gen: [7, 9], test: c => c.source.hasAbility('Prankster')},
];

const list = value => value == null ? [] : Array.isArray(value) ? value : [value];
const signed = by => (by > 0 ? '+' : '−') + Math.abs(by);

// env: {gen, rules, record(name), typeEffect(type, mon), grounded(mon, field), holds(mon, field), unnerved(mon)}
export function createEffects(env) {
  const blockerOn = (row, gen) => {
    const override = env.rules()?.blockers?.[row.id];
    if (override === false) return false;
    const [from, to] = Array.isArray(override) ? override : row.gen;
    return gen >= from && gen <= to;
  };

  // The first blocker that stops `what` on `ctx.target`, or null. ctx: {target, source, foe, field, values, side}.
  function blocker(what, ctx) {
    const gen = env.gen();
    const mold = ctx.foe && ctx.source?.hasAbility(...MOLD);
    for (const row of BLOCKERS) {
      if (!row.on.some(on => on === what || on === 'status' && STATUS_LABEL[what]
        || on === 'drop' && what.startsWith('drop'))) continue;
      if (!blockerOn(row, gen) || row.foe && !ctx.foe) continue;
      const c = {...ctx, gen};
      if (row.ability && (!list(row.ability).some(name => ctx.target.hasAbility(name)) || row.ign && mold)) continue;
      if (row.item && !(env.holds(ctx.target, ctx.field) && list(row.item).some(name => ctx.target.hasItem(name)))) continue;
      if (row.type && !list(row.type).some(type => ctx.target.hasType(type))) continue;
      if (row.terrain && !(ctx.field.hasTerrain(row.terrain) && (!row.grounded || env.grounded(ctx.target, ctx.field)))) continue;
      if (row.side && !ctx.values[ctx.side + row.side]) continue;
      if (row.test && !row.test(c)) continue;
      return row;
    }
    return null;
  }
  const reason = row => row.ability ? list(row.ability)[0] : row.item ? row.item : row.type ? list(row.type).join(' / ') + ' type'
    : row.terrain ? row.terrain + ' Terrain' : row.side;

  // One use of `name`: `phase` 'status' (a status move's button) or 'after' (a damaging move's effects after its
  // damage, `hit` = {landed, ko, dealt}). users: actionState-like objects with mon / update / logs / change / consume
  // and `st` (current status); field: the Smogon Field; values: the page's field values (atk = user's side).
  function resolve({name, record, user, target, field, values, phase = 'status', hit = {}, moveType, toggles = false}) {
    const gen = env.gen();
    const out = {parts: [], log: [], fails: null};
    const sides = {atk: user, def: target};
    const other = who => who === 'atk' ? 'def' : 'atk';
    const ctxFor = (who, foe) => ({target: sides[who].mon, source: sides[other(who)].mon, foe,
      field, values, side: who});
    const note = text => out.log.push(text);
    const fail = text => { out.fails ||= text; return out; };

    // Stage changes (Showdown boost(): ChangeBoost (Simple, Contrary), cap, TryBoost (blockers, Mirror Armor), apply,
    // then Defiant / Competitive on a foe-caused drop).
    const stages = (who, boosts, foe, src, mirrored = false) => {
      const state = sides[who];
      const mon = state.mon;
      let lowered = false;
      let any = false;
      const reflect = {};
      for (const [stat, amount] of Object.entries(boosts || {})) {
        if (!amount) continue;
        let by = amount;
        // Gen 5+ Simple / Contrary change the stored stage (Showdown onChangeBoost); Gen 4 Simple doubles the stage's
        // effect at calc time instead (abilities-gen4.ts onModifyBoost; the engine's Gen 4 formula does that).
        const broken = foe && sides[other(who)].mon.hasAbility(...MOLD);
        if (gen >= 5 && mon.hasAbility('Simple') && !broken) by *= 2;
        if (gen >= 5 && mon.hasAbility('Contrary') && !broken) by *= -1;
        if (by < 0 && foe) {
          const row = blocker('drop:' + stat, ctxFor(who, true));
          if (row) { note(`${reason(row)}: ${STAT_LABEL[stat]} not lowered`); out.parts.push({who, stat, blocked: reason(row)}); continue; }
          if (gen >= 8 && !mirrored && mon.hasAbility('Mirror Armor') && !sides[other(who)].mon.hasAbility(...MOLD)) {
            if ((mon.boosts[stat] ?? 0) > -6) reflect[stat] = amount;
            continue;
          }
        }
        if (!STATS.includes(stat)) {
          out.parts.push({who, stat, by, untracked: true});
          note(`${STAT_LABEL[stat]} ${signed(by)} (not tracked)`);
          any = true;
          continue;
        }
        const before = mon.boosts[stat];
        const after = Math.max(-6, Math.min(6, before + by));
        if (after === before) {
          out.parts.push({who, stat, capped: by > 0 ? 6 : -6});
          note(`${STAT_LABEL[stat]} won't go ${by > 0 ? 'higher' : 'lower'}`);
          continue;
        }
        state.set(stat, after);
        out.parts.push({who, stat, by: after - before, src});
        note(`${STAT_LABEL[stat]} ${signed(after - before)}`);
        any = true;
        if (after < before) lowered = true;
      }
      if (Object.keys(reflect).length) {
        note('Mirror Armor');
        any = stages(other(who), reflect, true, 'Mirror Armor', true) || any;
      }
      if (lowered) {
        state.lowered = true;
        if (foe && gen >= 5 && mon.hasAbility('Defiant')) stages(who, {atk: 2}, false, 'Defiant');
        if (foe && gen >= 6 && mon.hasAbility('Competitive')) stages(who, {spa: 2}, false, 'Competitive');
      }
      return any;
    };

    // A major status. `move`: the move's own status (a failing status move), not a secondary.
    const status = (who, st, foe, move = false) => {
      const state = sides[who];
      if (!state.mon.curHP()) return false;
      if (state.st) {
        out.parts.push({who, st, blocked: 'already ' + STATUS_TEXT[state.st]});
        if (move) note(`${STATUS_TEXT[state.st].replace(/^./, c => c.toUpperCase())} already`);
        return false;
      }
      const row = blocker(st, ctxFor(who, foe));
      if (row) {
        out.parts.push({who, st, blocked: reason(row)});
        note(`${reason(row)}: not ${STATUS_TEXT[st]}`);
        return false;
      }
      state.setStatus(st);
      out.parts.push({who, st});
      note(STATUS_TEXT[st].replace(/^./, c => c.toUpperCase()));
      // Synchronize passes burn / paralysis / poison back to the opponent who caused it (Gen 4: Toxic as poison).
      if (foe && state.mon.hasAbility('Synchronize') && ['brn', 'par', 'psn', 'tox'].includes(st)) {
        note('Synchronize');
        status(other(who), gen <= 4 && st === 'tox' ? 'psn' : st, true);
      }
      return true;
    };

    const volatile = (who, id, foe) => {
      const state = sides[who];
      if (!state.mon.curHP()) return false;
      if (id === 'attract' && (!state.mon.gender || state.mon.gender === 'N' || state.mon.gender === sides[other(who)].mon.gender)
        && state.mon.gender !== undefined && sides[other(who)].mon.gender) {
        out.parts.push({who, v: id, blocked: 'gender'});
        note('Attract: no effect (gender)');
        return false;
      }
      const row = blocker(id, ctxFor(who, foe));
      if (row) {
        out.parts.push({who, v: id, blocked: reason(row)});
        note(`${reason(row)}: no ${id}`);
        return false;
      }
      out.parts.push({who, v: id});
      state.volatiles.add(id);
      note(id === 'confusion' ? 'Confused (not tracked)' : `${id[0].toUpperCase() + id.slice(1)} (not tracked)`);
      return true;
    };

    const record0 = record || {};
    const flags = new Set(record0.fl || []);
    const foeParts = record0.tg === 'o' && (record0.b || record0.st || record0.v || record0.k);

    if (phase === 'status') {
      if (!user.mon.curHP()) return fail('user fainted');
      // Move-level checks against the opponent (the whole move fails).
      if (foeParts) {
        if (!target.mon.curHP()) return fail('no target');
        if (values.defProtect && !flags.has('bypassprotect')) return fail('Protect');
        if (record0.ti && env.typeEffect(moveType, target.mon) === 0) return fail(`${target.mon.types.join(' / ')} type`);
        for (const flag of ['powder', 'sound', 'bullet']) {
          if (!flags.has(flag)) continue;
          const row = blocker('move:' + flag, ctxFor('def', true));
          if (row) return fail(reason(row));
        }
        const row = blocker('move:status', ctxFor('def', true));
        if (row) return fail(reason(row) + (row.id === 'prankster-dark' ? ' (Prankster)' : ''));
        // Magic Bounce: the whole move resolves against its user instead, once.
        if (gen >= 5 && flags.has('reflectable') && !record0.bounced && target.mon.hasAbility('Magic Bounce')
          && !user.mon.hasAbility(...MOLD)) {
          const bounced = resolve({name, record: {...record0, bounced: true}, user: target, target: user,
            field, values: flipValues(values), phase, hit, moveType, toggles});
          return {...bounced, log: ['Magic Bounce', ...bounced.log], bounced: true};
        }
      }
      const tgt = record0.tg === 'o' ? 'def' : 'atk';
      const foe = tgt === 'def';
      let any = false;
      if (record0.k) any = kind(record0, tgt, foe) || any;
      if (record0.b && !(record0.k === 'venom' || record0.k === 'growth' || record0.k === 'maxatk')) any = stages(tgt, record0.b, foe, name) || any;
      if (record0.st) any = status(tgt, record0.st, foe, true) || any;
      if (record0.v && !SWITCH_VOLATILES.has(record0.v)) any = volatile(tgt, record0.v, foe) || any;
      if (record0.sb) any = stages('atk', record0.sb, false, name) || any;
      reactions();
      if (!any && !out.parts.some(part => part.cured)) {
        const blocked = out.parts.find(part => part.blocked || part.capped);
        out.fails = blocked ? blocked.blocked || `${STAT_LABEL[blocked.stat]} ${blocked.capped > 0 ? '+6' : '−6'}` : 'no effect';
      }
      return out;
    }

    // phase 'after': a damaging move that landed (`hit.landed`), its target possibly fainted. Showdown order: the
    // user's own drops (move.self), then the secondaries, then the move's own after-hit functions (hand kinds: Knock
    // Off, Clear Smog, Fell Stinger ...: not secondaries, so neither Sheer Force nor Shield Dust touches them).
    if (!hit.landed) return out;
    const sheer = gen >= 5 && user.mon.hasAbility('Sheer Force');
    const after = entry => {
      if (entry.k === 'ko3') { if (hit.ko) stages('atk', {atk: entry.by || 3}, false, name); return; }
      if (entry.k && entry.k !== 'fn' && target.mon.curHP()) kind(entry, 'def', true);
    };
    if (record0.sb) stages('atk', record0.sb, false, name);
    const secondaries = (record0.sec || []).filter(sec => !sec.k || sec.b || sec.st || sec.v || sec.sb);
    for (const sec of sheer && secondaries.length ? [] : secondaries) {
      if (env.chance(sec.c ?? 100) < 100) continue;
      if (sec.sb) stages('atk', sec.sb, false, name);
      if (!(sec.b || sec.st || sec.v) || !target.mon.curHP()) continue;
      const row = blocker('sec', ctxFor('def', true));
      if (row) { note(`${reason(row)}: no added effect`); out.parts.push({who: 'def', blocked: reason(row)}); continue; }
      if (sec.b) stages('def', sec.b, true, name);
      if (sec.st) status('def', sec.st, true);
      if (sec.v && sec.v !== 'flinch' && !SWITCH_VOLATILES.has(sec.v)) volatile('def', sec.v, true);
    }
    if (record0.k) after(record0);
    for (const sec of record0.sec || []) if (sec.k && !(sec.b || sec.st || sec.v || sec.sb)) after(sec);
    reactions();
    return out;

    // Hand-mapped kinds (record.k): Showdown's onHit functions, named in move-effects.json.
    function kind(entry, who, foe) {
      const state = sides[who];
      const self = sides.atk;
      switch (entry.k) {
        case 'haze': {
          let any = false;
          for (const key of ['atk', 'def']) for (const stat of STATS) {
            if (sides[key].mon.boosts[stat]) { sides[key].set(stat, 0); any = true; }
          }
          if (any) { out.parts.push({who: 'both', reset: true}); note('All stat changes removed'); }
          return any;
        }
        case 'clear': {
          let any = false;
          for (const stat of STATS) if (state.mon.boosts[stat]) { state.set(stat, 0); any = true; }
          if (any) { out.parts.push({who, reset: true}); note('Target stat changes removed'); }
          return any;
        }
        case 'copy': {
          let any = false;
          for (const stat of STATS) {
            const value = sides.def.mon.boosts[stat];
            if (self.mon.boosts[stat] !== value) { self.set(stat, value); any = true; }
          }
          if (any) { out.parts.push({who: 'atk', copy: true}); note('Copied the target\'s stat changes'); }
          return any;
        }
        case 'swap': {
          let any = false;
          for (const stat of (entry.stats || STATS).filter(stat => STATS.includes(stat))) {
            const mine = self.mon.boosts[stat];
            const theirs = sides.def.mon.boosts[stat];
            if (mine !== theirs) { self.set(stat, theirs); sides.def.set(stat, mine); any = true; }
          }
          if (any) { out.parts.push({who: 'both', swap: true}); note('Stat changes swapped'); }
          return any;
        }
        case 'invert': {
          let any = false;
          for (const stat of STATS) if (state.mon.boosts[stat]) { state.set(stat, -state.mon.boosts[stat]); any = true; }
          if (any) { out.parts.push({who, invert: true}); note('Stat changes inverted'); }
          return any;
        }
        case 'maxatk': {
          // Belly Drum (Showdown moves.ts bellydrum onHit): fails at half HP or less, or at +6; then boost atk 12.
          const mon = self.mon;
          if (mon.curHP() <= mon.maxHP() / 2) { out.parts.push({who: 'atk', blocked: 'HP too low'}); note('HP too low'); return false; }
          if (mon.boosts.atk >= 6 && !(gen >= 5 && mon.hasAbility('Contrary'))) { out.parts.push({who: 'atk', stat: 'atk', capped: 6}); return false; }
          return stages('atk', {atk: 12}, false, name);
        }
        case 'growth': {
          const sun = entry.sun && field.hasWeather('Sun', 'Harsh Sunshine') && !self.mon.hasItem('Utility Umbrella');
          return stages('atk', Object.fromEntries(Object.entries(entry.b || {}).map(([stat, by]) => [stat, by * (sun ? entry.sun : 1)])), false, name);
        }
        case 'venom': {
          if (!['psn', 'tox'].includes(state.st)) { out.parts.push({who, blocked: 'not poisoned'}); note('Target not poisoned'); return false; }
          return stages(who, entry.b, foe, name);
        }
        case 'cure': {
          const only = entry.only || Object.keys(STATUS_LABEL);
          if (!self.st || !only.includes(self.st)) { out.parts.push({who: 'atk', blocked: 'no status'}); return false; }
          self.setStatus('');
          out.parts.push({who: 'atk', cured: true});
          note('Status cured');
          return true;
        }
        case 'shift': {
          if (!self.st) { out.parts.push({who: 'atk', blocked: 'no status'}); note('User has no status'); return false; }
          const st = self.st;
          if (!status('def', st, true, true)) return false;
          self.setStatus('');
          note('User cured');
          return true;
        }
        case 'knock':
        case 'steal':
        case 'eat':
        case 'burnitem': {
          const mon = state.mon;
          const item = env.heldName(mon, state);
          if (!item) return false;
          const berry = item.endsWith(' Berry');
          if (entry.k === 'eat' && !berry || entry.k === 'burnitem' && !(berry || gen >= 6 && item.endsWith(' Gem'))) return false;
          if (entry.k === 'steal' && env.heldName(self.mon, self)) return false;
          if (mon.hasAbility('Sticky Hold') && entry.k !== 'eat' && entry.k !== 'burnitem' && !self.mon.hasAbility(...MOLD)) {
            out.parts.push({who, blocked: 'Sticky Hold'});
            note('Sticky Hold');
            return false;
          }
          if (/ (Z|ium Z)$|ite( [XY])?$|^(Red|Blue) Orb$/.test(item) && entry.k !== 'eat') return false;
          state.lose();
          out.parts.push({who, item, lost: entry.k});
          note({knock: `${item} knocked off`, steal: `${item} stolen (set it in Edit)`, eat: `${item} eaten by the user`,
            burnitem: `${item} burned up`}[entry.k]);
          return true;
        }
        case 'trick': note('Items swapped (set them in Edit)'); out.parts.push({who: 'both', log: 'trick'}); return true;
        case 'drowsy': {
          if (state.st) { out.parts.push({who, blocked: 'already ' + STATUS_TEXT[state.st]}); return false; }
          const row = blocker('slp', ctxFor(who, foe));
          if (row) { out.parts.push({who, blocked: reason(row)}); note(`${reason(row)}: no Yawn`); return false; }
          note('Drowsy: sleeps at the end of next turn (not tracked)');
          out.parts.push({who, v: 'yawn'});
          return true;
        }
        case 'ability': case 'type': case 'random': case 'log':
          out.parts.push({who, log: entry.k});
          note(entry.k === 'ability' ? 'Ability changed (set it in Edit)' : entry.k === 'type' ? 'Type changed (not tracked)'
            : entry.k === 'random' ? 'Random stat +2 (set it in Edit)' : `${name} (not tracked)`);
          return true;
        case 'stockpile':
        case 'curse':
        case 'memento':
        case 'sap':
          return false; // their stages are the record's `b`; HP is DMG.hp
        default:
          return false;
      }
    }

    // After the parts: status berries / Mental Herb cure on the spot, White Herb restores lowered stats, Eject Pack.
    function reactions() {
      for (const who of ['def', 'atk']) {
        const state = sides[who];
        const mon = state.mon;
        if (!mon.curHP() || !env.holds(mon, field)) continue;
        const item = mon.item;
        const cures = CURE_BERRY[item];
        const unnerved = env.unnerved(sides[other(who)].mon);
        if (cures && !unnerved) {
          const hit = cures.find(key => key === state.st || key === 'confusion' && state.volatiles.has('confusion'));
          if (hit) {
            if (hit === 'confusion') state.volatiles.delete('confusion');
            else state.setStatus('');
            state.consume(item);
            out.parts.push({who, cured: true, item});
            note(`${item}: cured`);
            continue;
          }
        }
        if (item === 'Mental Herb' && (gen >= 5 ? MENTAL : ['attract']).some(id => state.volatiles.has(id))) {
          for (const id of MENTAL) state.volatiles.delete(id);
          state.consume(item);
          out.parts.push({who, cured: true, item});
          note('Mental Herb: cured');
          continue;
        }
        if (item === 'White Herb' && STATS.some(stat => mon.boosts[stat] < 0)) {
          for (const stat of STATS) if (mon.boosts[stat] < 0) state.set(stat, 0);
          state.consume(item);
          out.parts.push({who, restored: true, item});
          note('White Herb: lowered stats restored');
          continue;
        }
        if (item === 'Eject Pack' && gen >= 8 && state.lowered) {
          state.consume(item);
          out.parts.push({who, item, eject: true});
          note('Eject Pack: switches out (switch in the calc)');
        }
      }
    }
  }

  function flipValues(values) {
    const flipped = {};
    for (const [key, value] of Object.entries(values)) {
      const swap = key.startsWith('atk') ? 'def' + key.slice(3) : key.startsWith('def') ? 'atk' + key.slice(3) : key;
      flipped[swap] = value;
    }
    return flipped;
  }

  return {resolve, blocker};
}

// The button text: the changes that happen now, short (≤ 11 characters where possible); the full text for title / log.
export function describe(out) {
  if (out.fails) return {label: 'Fails', text: 'Fails: ' + out.fails, cls: 'na'};
  const parts = out.parts.filter(part => !part.blocked && !part.capped);
  const byWho = {};
  for (const part of parts) if (part.by) (byWho[part.who] ||= []).push(part);
  const group = changes => {
    const amounts = [...new Set(changes.map(part => part.by))];
    if (amounts.length === 1 && changes.length >= 5) return signed(amounts[0]) + ' all';
    if (amounts.length === 1 && changes.length > 2) return signed(amounts[0]) + ' ×' + changes.length;
    if (amounts.length === 1) return changes.map(part => STAT_LABEL[part.stat]).join(' ') + signed(amounts[0]);
    return changes.map(part => STAT_LABEL[part.stat] + signed(part.by)).join(' ');
  };
  const pieces = [];
  const full = [];
  for (const who of ['def', 'atk']) {
    if (!byWho[who]) continue;
    const text = group(byWho[who]);
    pieces.push(text.length > 11 ? [...new Set(byWho[who].map(part => signed(part.by)))].join(' ') : text);
    full.push((who === 'def' ? 'target ' : 'user ') + byWho[who].map(part => STAT_LABEL[part.stat] + ' ' + signed(part.by)).join(', '));
  }
  for (const part of parts) {
    if (part.st) { pieces.push(STATUS_LABEL[part.st]); full.push((part.who === 'def' ? 'target ' : 'user ') + STATUS_TEXT[part.st]); }
    if (part.v === 'confusion') { pieces.push('Conf'); full.push('confused'); }
    else if (part.v) { pieces.push(part.v[0].toUpperCase() + part.v.slice(1, 5)); full.push(part.v); }
    if (part.lost) { pieces.push('Item'); full.push(`${part.item} ${part.lost === 'knock' ? 'knocked off' : 'removed'}`); }
    if (part.reset) { pieces.push('Reset'); full.push('stat changes removed'); }
    if (part.copy) { pieces.push('Copy'); full.push('stat changes copied'); }
    if (part.swap) { pieces.push('Swap'); full.push('stat changes swapped'); }
    if (part.invert) { pieces.push('Invert'); full.push('stat changes inverted'); }
    if (part.cured && !part.item) { pieces.push('Cure'); full.push('status cured'); }
    if (part.log) {
      pieces.push({trick: 'Swap', ability: 'Ability', type: 'Type', random: '+2 ?'}[part.log] || 'Use');
      full.push({trick: 'items swapped (set them in Edit)', ability: 'ability changed (set it in Edit)',
        type: 'type changed (not tracked)', random: 'a random stat +2 (set it in Edit)'}[part.log] || part.log);
    }
  }
  const drops = parts.filter(part => part.by < 0 || part.st || part.v || part.lost).length;
  const raises = parts.filter(part => part.by > 0 || part.cured && !part.item).length;
  const label = pieces.join(' ') || 'Use';
  return {label: label.length > 14 ? pieces[0] + '…' : label, text: full.join('; ') || out.log.join(', '),
    cls: raises && !drops ? 'up' : drops && !raises ? 'dn' : ''};
}
