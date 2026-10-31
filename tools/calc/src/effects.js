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
// Ability flags (Showdown abilities.ts at the pin): cantsuppress (no ability change or suppression), failroleplay (=
// noentrain: Role Play / Doodle copy fails, Entrainment from it fails), failskillswap.
const CANT_SUPPRESS = new Set(['As One (Glastrier)', 'As One (Spectrier)', 'Battle Bond', 'Comatose', 'Disguise',
  'Gulp Missile', 'Ice Face', 'Multitype', 'Power Construct', 'RKS System', 'Schooling', 'Shields Down',
  'Stance Change', 'Tera Shift', 'Zen Mode', 'Zero to Hero']);
const FAIL_COPY = new Set(['As One (Glastrier)', 'As One (Spectrier)', 'Battle Bond', 'Comatose', 'Commander',
  'Disguise', 'Embody Aspect (Cornerstone)', 'Embody Aspect (Hearthflame)', 'Embody Aspect (Teal)',
  'Embody Aspect (Wellspring)', 'Flower Gift', 'Forecast', 'Hunger Switch', 'Ice Face', 'Illusion', 'Imposter',
  'Multitype', 'Neutralizing Gas', 'Poison Puppeteer', 'Power Construct', 'Power of Alchemy', 'Protosynthesis',
  'Quark Drive', 'Receiver', 'RKS System', 'Schooling', 'Shields Down', 'Stance Change', 'Teraform Zero', 'Tera Shell',
  'Tera Shift', 'Trace', 'Wonder Guard', 'Zen Mode', 'Zero to Hero']);
const FAIL_SWAP = new Set([...FAIL_COPY].filter(name => !['Flower Gift', 'Forecast', 'Imposter', 'Power of Alchemy',
  'Receiver', 'Trace'].includes(name)));
// Items a move can't take or swap (Showdown takeItem / onTakeItem): Z-Crystals, Mega Stones, Primal Orbs, and the
// form items on their own species.
const KEPT_ITEM = (item, mon) => / (Z|ium Z)$|ite( [XY])?$|^(Red|Blue) Orb$/.test(item)
  || / Plate$/.test(item) && /^Arceus/.test(mon.name) || / Memory$/.test(item) && /^Silvally/.test(mon.name)
  || /^Rusted (Sword|Shield)$/.test(item) && /^Zaci|^Zama/.test(mon.name)
  || /^Griseous (Orb|Core)$/.test(item) && /^Giratina/.test(mon.name) || / Drive$/.test(item) && /^Genesect/.test(mon.name)
  || item === 'Booster Energy' && mon.hasAbility('Protosynthesis', 'Quark Drive');
// The Showdown id a record names in `n` ("Showdown moves.ts soak onHit"), else the move name's id.
const moveId = (record, name) => /\.ts (\w+) /.exec(record?.n || '')?.[1] || String(name).toLowerCase().replace(/[^a-z0-9]/g, '');

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
  {id: 'safeguard', on: ['status', 'confusion'], side: 'Safeguard', gen: [4, 9], foe: true, test: c => c.entry || !(c.gen >= 6 && c.source.hasAbility('Infiltrator'))},
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
  // Accuracy drops: Keen Eye in every generation; Mind's Eye (new) and Illuminate (given onTryBoost) from Gen 9
  // (Showdown abilities.ts; mods/gen8 abilities illuminate has no onTryBoost). A hack whose Illuminate does nothing
  // in battle sets rules.blockers.illuminate false (Emerald Imperium). Accuracy isn't stored: the row decides the
  // button's Fails / log and whether the drop counts for Defiant, Competitive, White Herb and Eject Pack.
  {id: 'keen-eye', on: ['drop:acc'], ability: 'Keen Eye', gen: [4, 9], ign: true, foe: true},
  {id: 'minds-eye', on: ['drop:acc'], ability: "Mind's Eye", gen: [9, 9], ign: true, foe: true},
  {id: 'illuminate', on: ['drop:acc'], ability: 'Illuminate', gen: [9, 9], ign: true, foe: true},
  {id: 'mist', on: ['drop'], side: 'Mist', gen: [4, 9], foe: true, test: c => c.entry || !(c.gen >= 6 && c.source.hasAbility('Infiltrator'))},
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
    const mold = !ctx.entry && ctx.foe && ctx.source?.hasAbility(...MOLD);
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
  // The guide's name of a Pokémon's ability now ('' = none / suppressed).
  const abilityOf = state => state.mon.guideAbility ?? (state.mon.ability === 'Guide no ability' ? '' : state.mon.ability);
  const reason = row => row.ability ? list(row.ability)[0] : row.item ? row.item : row.type ? list(row.type).join(' / ') + ' type'
    : row.terrain ? row.terrain + ' Terrain' : row.side;

  // One use of `name`: `phase` 'status' (a status move's button), 'after' (a damaging move's effects after its
  // damage, `hit` = {landed, ko, dealt}) or 'entry' (an entry hazard on the target as it comes in: the record's
  // `st` / `b` land on the target as caused by the foe, with no move-level checks, Mold Breaker or Infiltrator
  // (the setter isn't using a move), no Synchronize (Showdown: not from Toxic Spikes), then the reactions). users: actionState-like objects with mon / update / logs / change / consume
  // and `st` (current status); field: the Smogon Field; values: the page's field values (atk = user's side).
  function resolve({name, record, user, target, field, values, phase = 'status', hit = {}, moveType, toggles = false}) {
    const gen = env.gen();
    const out = {parts: [], log: [], fails: null};
    const sides = {atk: user, def: target};
    const other = who => who === 'atk' ? 'def' : 'atk';
    const entry = phase === 'entry';
    const ctxFor = (who, foe) => ({target: sides[who].mon, source: sides[other(who)].mon, foe,
      field, values, side: who, entry});
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
        const broken = !entry && foe && sides[other(who)].mon.hasAbility(...MOLD);
        if (gen >= 5 && mon.hasAbility('Simple') && !broken) by *= 2;
        if (gen >= 5 && mon.hasAbility('Contrary') && !broken) by *= -1;
        if (by < 0 && foe) {
          const row = blocker('drop:' + stat, ctxFor(who, true));
          if (row) { note(`${reason(row)}: ${STAT_LABEL[stat]} not lowered`); out.parts.push({who, stat, blocked: reason(row)}); continue; }
          if (gen >= 8 && !mirrored && mon.hasAbility('Mirror Armor') && (entry || !sides[other(who)].mon.hasAbility(...MOLD))) {
            if ((mon.boosts[stat] ?? 0) > -6) reflect[stat] = amount;
            continue;
          }
        }
        if (!STATS.includes(stat)) {
          out.parts.push({who, stat, by, untracked: true});
          note(`${STAT_LABEL[stat]} ${signed(by)} (not tracked)`);
          any = true;
          // An accuracy / evasion drop is still a lowered stat (Showdown Defiant onAfterEachBoost, White Herb,
          // Eject Pack: any negative boost). The stage isn't stored, so a drop at −6 can't be told apart.
          if (by < 0) { lowered = true; state.untrackedDrop = true; }
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
      if (foe && !entry && state.mon.hasAbility('Synchronize') && ['brn', 'par', 'psn', 'tox'].includes(st)) {
        note('Synchronize');
        status(other(who), gen <= 4 && st === 'tox' ? 'psn' : st, true);
      }
      return true;
    };

    const volatile = (who, id, foe) => {
      const state = sides[who];
      if (!state.mon.curHP()) return false;
      if (id === 'trapped' && gen >= 6 && state.mon.hasType('Ghost')) {
        out.parts.push({who, v: id, blocked: 'Ghost type'});
        note('Ghost type: cannot be trapped');
        return false;
      }
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

    if (entry) {
      if (record0.st) status('def', record0.st, true);
      if (record0.b) stages('def', record0.b, true, name);
      reactions(['def']);
      return out;
    }

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
          return {...bounced, ...(bounced.field ? {field: flipValues(bounced.field)} : {}), log: ['Magic Bounce', ...bounced.log], bounced: true};
        }
      }
      const tgt = record0.tg === 'o' ? 'def' : 'atk';
      const foe = tgt === 'def';
      let any = false;
      if (record0.k) any = kind(record0, tgt, foe) || any;
      if (record0.b && !['venom', 'growth', 'maxatk', 'cheeks'].includes(record0.k)) any = stages(tgt, record0.b, foe, name) || any;
      if (record0.st) any = status(tgt, record0.st, foe, true) || any;
      if (record0.v && !SWITCH_VOLATILES.has(record0.v) && record0.v !== 'gastroacid') any = volatile(tgt, record0.v, foe) || any;
      if (record0.sb) any = stages('atk', record0.sb, false, name) || any;
      reactions();
      if (!any && !out.parts.some(part => part.cured)) {
        if (out.fails) return out;
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
      if (entry.k && entry.k !== 'fn' && (entry.tg === 's' || record0.tg === 's')) kind(entry, 'atk', false);
      else if (entry.k && entry.k !== 'fn' && target.mon.curHP()) kind(entry, 'def', true);
    };
    if (record0.sb) stages('atk', record0.sb, false, name);
    const secondaries = (record0.sec || []).filter(sec => !sec.k || sec.k === 'log' || sec.b || sec.st || sec.v || sec.sb);
    for (const sec of sheer && secondaries.length ? [] : secondaries) {
      if (env.chance(sec.c ?? 100) < 100) continue;
      if (sec.sb) stages('atk', sec.sb, false, name);
      if (!(sec.b || sec.st || sec.v || sec.k === 'log') || !target.mon.curHP()) continue;
      const row = blocker('sec', ctxFor('def', true));
      if (row) { note(`${reason(row)}: no added effect`); out.parts.push({who: 'def', blocked: reason(row)}); continue; }
      if (sec.b) stages('def', sec.b, true, name);
      if (sec.st) status('def', sec.st, true);
      if (sec.v && sec.v !== 'flinch' && !SWITCH_VOLATILES.has(sec.v)) volatile('def', sec.v, true);
      if (sec.k === 'log') kind(sec, 'def', true);
    }
    if (record0.k) after(record0);
    for (const sec of record0.sec || []) if (sec.k && sec.k !== 'log' && !(sec.b || sec.st || sec.v || sec.sb)) after(sec);
    if (hit.contact) contactAbility();
    reactions();
    return out;

    // Mummy / Lingering Aroma pass to a contact attacker, Wandering Spirit swaps (Showdown onDamagingHit).
    function contactAbility() {
      const mon = target.mon;
      const own = user.mon;
      const spread = gen >= 5 && mon.hasAbility('Mummy') || gen >= 9 && mon.hasAbility('Lingering Aroma');
      if (spread) {
        if (CANT_SUPPRESS.has(own.ability) || own.ability === mon.ability) return;
        if (gen >= 9 && own.hasItem('Ability Shield') && env.holds(own, field)) return;
        user.setAbility(abilityOf(target));
        out.parts.push({who: 'atk', ab: abilityOf(user)});
        note(`${mon.ability}: the user's ability is now ${abilityOf(user)}`);
      } else if (gen >= 8 && mon.hasAbility('Wandering Spirit')) {
        if (FAIL_SWAP.has(own.ability) || gen >= 9 && own.hasItem('Ability Shield') && env.holds(own, field)) return;
        const mine = abilityOf(user);
        user.setAbility(abilityOf(target));
        target.setAbility(mine);
        out.parts.push({who: 'both', ab: 'swap'});
        note('Wandering Spirit: abilities swapped');
      }
    }

    // Hand-mapped kinds (record.k): Showdown's onHit functions, named in move-effects.json.
    function kind(entry, who, foe) {
      const state = sides[who];
      const self = sides.atk;
      switch (entry.k) {
        case 'speedswap': {
          const mine = self.mon.rawStats.spe;
          const theirs = sides.def.mon.rawStats.spe;
          self.setRaw('spe', theirs);
          sides.def.setRaw('spe', mine);
          out.parts.push({who: 'both', swap: true});
          note('Raw Speed swapped; stages stay');
          return true;
        }
        case 'rest': {
          if (self.st === 'slp' || self.mon.hasAbility('Comatose')) return refuse('already asleep');
          if (self.mon.curHP() === self.mon.maxHP()) return refuse('HP full');
          const row = blocker('slp', ctxFor('atk', false));
          if (row) return refuse(reason(row));
          self.setStatus('');
          if (!status('atk', 'slp', false, true)) return false;
          self.setHP(self.mon.maxHP());
          note('HP fully restored; sleeps for two turns (duration not tracked)');
          return true;
        }
        case 'defog': {
          const hazards = ['Spikes', 'ToxicSpikes', 'StealthRock', ...(gen >= 6 ? ['StickyWeb'] : []), ...(gen >= 8 ? ['Steelsurge'] : [])];
          const changes = {};
          for (const key of ['Reflect', 'LightScreen', 'Safeguard', 'Mist', ...(gen >= 7 ? ['AuroraVeil'] : []), ...hazards]) changes['def' + key] = false;
          if (gen >= 6) for (const key of hazards) changes['atk' + key] = false;
          if (gen >= 8) changes.terrain = '';
          out.field = changes;
          stages('def', {eva: -1}, true, name);
          out.parts.push({who: 'both', log: 'Field cleared'});
          note(gen >= 6 ? 'Hazards cleared on both sides; target screens cleared' : 'Target hazards and screens cleared');
          if (gen >= 8) note('Terrain cleared');
          return true;
        }
        case 'courtchange': {
          out.field = {};
          for (const key of ['Reflect', 'LightScreen', 'AuroraVeil', 'Safeguard', 'Mist', 'Tailwind', 'StealthRock', 'Spikes', 'ToxicSpikes', 'StickyWeb', 'Steelsurge', 'SeaOfFire', 'Swamp', 'Rainbow']) {
            out.field['atk' + key] = values['def' + key] || false;
            out.field['def' + key] = values['atk' + key] || false;
          }
          out.parts.push({who: 'both', log: 'Sides swapped'});
          note('Side conditions swapped');
          return true;
        }
        case 'grassboost': {
          let any = false;
          for (const key of ['atk', 'def']) {
            if (!sides[key].mon.hasType('Grass')) continue;
            if (name === 'Rototiller' && !env.grounded(sides[key].mon, field)) continue;
            any = stages(key, name === 'Rototiller' ? {atk: 1, spa: 1} : {def: 1}, key === 'def', name) || any;
          }
          return any;
        }
        case 'plusminus': {
          if (!self.mon.hasAbility('Plus', 'Minus')) return refuse('user needs Plus or Minus');
          return stages('atk', name === 'Gear Up' ? {atk: 1, spa: 1} : {def: 1, spd: 1}, false, name);
        }
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
        case 'cheeks': {
          // Stuff Cheeks (Showdown onTry / onHit): needs a held berry; eats it, then Def +2.
          const item = env.heldName(self.mon, self);
          if (!item.endsWith(' Berry')) { out.parts.push({who: 'atk', blocked: 'no berry'}); note('No berry'); return false; }
          self.consume(item);
          out.parts.push({who: 'atk', item, lost: 'eat'});
          return stages('atk', entry.b, false, name) || true;
        }
        case 'purify': {
          if (!state.st) { out.parts.push({who, blocked: 'no status'}); note('Target has no status'); return false; }
          state.setStatus('');
          out.parts.push({who, cured: true});
          note('Target cured');
          return true;
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
          const held = state.held();
          state.lose();
          if (entry.k === 'steal') self.setItem(held);
          out.parts.push({who, item, lost: entry.k});
          note({knock: `${item} knocked off`, steal: `${item} stolen`, eat: `${item} eaten by the user`,
            burnitem: `${item} burned up`}[entry.k]);
          return true;
        }
        case 'trick': {
          // Trick / Switcheroo (Showdown onTryImmunity Sticky Hold, takeItem on both): swaps the two held items.
          const other = sides[who];
          const mine = self.held();
          const theirs = other.held();
          if (other.mon.hasAbility('Sticky Hold') && !self.mon.hasAbility(...MOLD)) return refuse('Sticky Hold');
          if (!mine && !theirs) return refuse('no items');
          const kept = [[mine, self.mon], [theirs, other.mon]].find(([item, mon]) => item && KEPT_ITEM(item, mon));
          if (kept) return refuse(kept[0] + ' stays');
          self.setItem(theirs);
          other.setItem(mine);
          out.parts.push({who: 'both', swapItems: true});
          note(`Items swapped: user ${theirs || 'no item'}, target ${mine || 'no item'}`);
          return true;
        }
        case 'bestow': {
          // Bestow (Showdown onHit): the target must hold nothing; the user's item moves to it.
          const other = sides[who];
          const mine = self.held();
          if (other.held()) return refuse('target holds an item');
          if (!mine) return refuse('user holds no item');
          if (KEPT_ITEM(mine, self.mon)) return refuse(mine + ' stays');
          self.lose();
          other.setItem(mine);
          out.parts.push({who, item: mine, gave: true});
          note(`${mine} given to the target`);
          return true;
        }
        case 'type': return typeKind(entry, who);
        case 'ability': return abilityKind(entry, who);
        case 'drowsy': {
          if (state.st) { out.parts.push({who, blocked: 'already ' + STATUS_TEXT[state.st]}); return false; }
          const row = blocker('slp', ctxFor(who, foe));
          if (row) { out.parts.push({who, blocked: reason(row)}); note(`${reason(row)}: no Yawn`); return false; }
          note('Drowsy: sleeps at the end of next turn (not tracked)');
          out.parts.push({who, v: 'yawn'});
          return true;
        }
        case 'random': case 'log':
          out.parts.push({who, log: entry.k});
          note(entry.k === 'random' ? 'Random stat +2 (set it in Edit)' : entry.text || `${name} (not tracked)`);
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

    // A reason the move fails: the status button says Fails (a damaging move's after-part just doesn't happen).
    function refuse(text) { if (phase === 'status') out.fails ||= text; else note(`${name}: ${text}`); return false; }
    // Showdown setType: Arceus / Silvally keep their types (Gen 4: Multitype).
    function fixedType(mon) {
      return gen >= 5 && /^(Arceus|Silvally)/.test(mon.name) || gen === 4 && mon.hasAbility('Multitype');
    }
    // Type changes (Showdown setType / addType; an added type replaces the previous added one).
    function typeKind(entry, who) {
      const self = sides.atk;
      const state = sides[who];
      const mon = state.mon;
      const id = moveId(entry.n ? entry : record0, name);
      const base = mon.guideAdded ? mon.types.slice(0, -1) : [...mon.types];
      const label = state === self ? 'User' : 'Target';
      const pure = type => {
        if (mon.types.join() === type) return refuse('already ' + type);
        if (fixedType(mon)) return refuse(mon.name + ' keeps its type');
        state.setTypes([type]);
        out.parts.push({who, types: [type]});
        note(`${label} is now ${type} type`);
        return true;
      };
      const add = type => {
        if (mon.types.includes(type)) return refuse('already ' + type);
        state.setTypes(base, type);
        out.parts.push({who, added: type});
        note(`${type} added to the ${label.toLowerCase()}'s types`);
        return true;
      };
      switch (id) {
        case 'soak': return pure('Water');
        case 'magicpowder': return pure('Psychic');
        case 'trickortreat': return add('Ghost');
        case 'forestscurse': return add('Grass');
        case 'camouflage': {
          const terrain = gen >= 6 && ['Electric', 'Grassy', 'Misty', 'Psychic'].find(t => field.hasTerrain(t));
          return pure(gen === 5 ? 'Ground' : terrain ? {Grassy: 'Grass', Misty: 'Fairy'}[terrain] || terrain : 'Normal');
        }
        case 'conversion': {
          const moves = env.moves(mon);
          const types = gen >= 6 ? moves.slice(0, 1).map(move => move.type)
            : moves.filter(move => move.name !== 'Conversion' && !mon.types.includes(move.type)).map(move => move.type);
          if (!types.length) return refuse(gen >= 6 ? 'no first move' : 'no move of a new type');
          if (gen >= 6 && mon.types.includes(types[0])) return refuse('already ' + types[0]);
          const done = pure(types[0]);
          if (done && new Set(types).size > 1) note(`In game one of ${[...new Set(types)].join(' / ')} at random`);
          return done;
        }
        case 'conversion2':
          out.parts.push({who: 'atk', log: 'type'});
          note('Conversion 2: a random type that resists the target\'s last move (set it in Edit → Fight)');
          return true;
        case 'reflecttype': {
          // The user copies the target's types (Arceus / Silvally fail); a typeless target with an added type gives
          // Normal + that type, one with none fails.
          const source = sides.def.mon;
          if (fixedType(self.mon)) return refuse(self.mon.name + ' keeps its type');
          let types = (source.guideAdded ? source.types.slice(0, -1) : source.types).filter(type => type !== '???');
          if (!types.length) {
            if (!source.guideAdded) return refuse('target has no type');
            types = ['Normal'];
          }
          self.setTypes(types, source.guideAdded);
          out.parts.push({who: 'atk', types: self.mon.types});
          note(`User is now ${self.mon.types.join(' / ')} type`);
          return true;
        }
        case 'burnup':
        case 'doubleshock': {
          const type = id === 'burnup' ? 'Fire' : 'Electric';
          if (!self.mon.types.includes(type)) return false;
          const left = (self.mon.guideAdded ? self.mon.types.slice(0, -1) : self.mon.types).filter(t => t !== type);
          self.setTypes(left.length ? left : ['???'], self.mon.guideAdded === type ? '' : self.mon.guideAdded);
          out.parts.push({who: 'atk', types: self.mon.types, lostType: type});
          note(`User loses its ${type} type`);
          return true;
        }
        default:
          out.parts.push({who, log: 'type'});
          note('Type changed (set it in Edit → Fight)');
          return true;
      }
    }

    // Showdown setAbility: Ability Shield (Gen 9) or a cantsuppress ability keeps the ability.
    function canSet(state) {
      const mon = state.mon;
      if (CANT_SUPPRESS.has(mon.ability)) return refuse(mon.ability);
      if (gen >= 9 && mon.hasItem('Ability Shield') && env.holds(mon, field)) return refuse('Ability Shield');
      return true;
    }
    // Ability changes by move (Showdown onTryHit / onHit of each).
    function abilityKind(entry, who) {
      const self = sides.atk;
      const state = sides[who];
      const mon = state.mon;
      const own = self.mon;
      const id = moveId(entry.n ? entry : record0, name);
      const set = (to, ability, suffix = '') => {
        to.setAbility(ability);
        out.parts.push({who: to === self ? 'atk' : 'def', ab: ability || 'none'});
        note(`${to === self ? 'User' : 'Target'}: ${ability || 'ability suppressed'}${suffix}`);
        return true;
      };
      switch (id) {
        case 'worryseed':
          if (mon.hasAbility('Truant', 'Insomnia')) return refuse(mon.ability);
          if (!canSet(state)) return false;
          set(state, 'Insomnia');
          if (state.st === 'slp') { state.setStatus(''); out.parts.push({who, cured: true}); note('Target wakes up'); }
          return true;
        case 'simplebeam':
          if (mon.hasAbility('Simple', 'Truant')) return refuse(mon.ability);
          return canSet(state) && set(state, 'Simple');
        case 'entrainment':
          if (mon.ability === own.ability) return refuse('same ability');
          if (mon.hasAbility('Truant')) return refuse('Truant');
          if (FAIL_COPY.has(own.ability)) return refuse(own.ability);
          return canSet(state) && set(state, abilityOf(self));
        case 'roleplay':
        case 'doodle':
          if (mon.ability === own.ability) return refuse('same ability');
          if (FAIL_COPY.has(mon.ability)) return refuse(mon.ability);
          return canSet(self) && set(self, abilityOf(state));
        case 'skillswap': {
          const fixed = [own, mon].find(m => FAIL_SWAP.has(m.ability));
          if (fixed) return refuse(fixed.ability);
          if (gen <= 5 && own.ability === mon.ability) return refuse('same ability');
          if (!canSet(state) || !canSet(self)) return false;
          const mine = abilityOf(self);
          const theirs = abilityOf(state);
          self.setAbility(theirs);
          state.setAbility(mine);
          out.parts.push({who: 'both', ab: 'swap'});
          note(`Abilities swapped: user ${theirs || 'none'}, target ${mine || 'none'}`);
          return true;
        }
        case 'gastroacid':
        case 'coreenforcer':
          if (!abilityOf(state)) return refuse('no ability');
          if (!canSet(state)) return false;
          return set(state, '', id === 'coreenforcer' ? ' (if it already moved this turn)' : '');
        default:
          out.parts.push({who, log: 'ability'});
          note('Ability changed (set it in Edit → Fight)');
          return true;
      }
    }

    // After the parts: status berries / Mental Herb cure on the spot, White Herb restores lowered stats, Eject Pack.
    function reactions(whom = ['def', 'atk']) {
      for (const who of whom) {
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
        if (item === 'White Herb' && (STATS.some(stat => mon.boosts[stat] < 0) || state.untrackedDrop)) {
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
    const whose = part.who === 'def' ? 'target ' : 'user ';
    if (part.types) { pieces.push(part.types.join('/')); full.push(whose + 'becomes ' + part.types.join(' / ')); }
    if (part.added) { pieces.push('+' + part.added); full.push(whose + 'gains ' + part.added); }
    if (part.ab === 'swap') { pieces.push('Swap'); full.push('abilities swapped'); }
    else if (part.ab) { pieces.push(part.ab === 'none' ? 'No abil.' : part.ab); full.push(whose + (part.ab === 'none' ? 'ability suppressed' : 'ability ' + part.ab)); }
    if (part.swapItems) { pieces.push('Swap'); full.push('items swapped'); }
    if (part.gave) { pieces.push('Give'); full.push(part.item + ' given'); }
    if (part.log) {
      pieces.push({type: 'Type', ability: 'Ability', random: '+2 ?'}[part.log] || 'Use');
      full.push({ability: 'ability changed (set it in Edit → Fight)', type: 'type changed (set it in Edit → Fight)',
        random: 'a random stat +2 (set it in Edit)'}[part.log] || part.log);
    }
  }
  const drops = parts.filter(part => part.by < 0 || part.st || part.v || part.lost).length;
  const raises = parts.filter(part => part.by > 0 || part.cured && !part.item).length;
  const label = pieces.join(' ') || 'Use';
  return {label: label.length > 14 ? pieces[0] + '…' : label, text: full.join('; ') || out.log.join(', '),
    cls: raises && !drops ? 'up' : drops && !raises ? 'dn' : ''};
}
