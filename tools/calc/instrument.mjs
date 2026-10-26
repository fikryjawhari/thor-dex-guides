function once(source, before, after) {
  if (source.split(before).length !== 2) throw new Error(`Upstream hook drift: ${before}`);
  return source.replace(before, after);
}

function editFunction(source, name, edit) {
  const start = source.indexOf(`function ${name}(`);
  if (start === -1) throw new Error(`Missing upstream function ${name}`);
  const following = source.slice(start + 1).search(/\n(?:export )?function /);
  const end = following === -1 ? source.length : start + 1 + following;
  return source.slice(0, start) + edit(source.slice(start, end)) + source.slice(end);
}

function invocation(source, phase, value, state = '') {
  const header = source.slice(0, source.indexOf(') {'));
  const has = name => new RegExp(`\\b${name}\\s*:`).test(header);
  const locals = ['attacker', 'defender', 'move', 'field', 'desc'].filter(has);
  if (state) locals.push(`state: {${state}}`);
  return `applyPhase(${has('gen') ? 'gen' : 'attacker.gen'}, '${phase}', {${locals.join(',')}}, ${value})`;
}

export function instrument(source, filename) {
  if (filename === 'util.ts') {
    source = once(source, 'export function isGrounded(pokemon: Pokemon, field: Field) {',
      `export function isGrounded(pokemon: Pokemon, field: Field) {
  const guideGrounded = fieldGrounded(pokemon, field);
  if (guideGrounded !== undefined) return guideGrounded;`);
    source = once(source, '  // Pledge swamp would get applied here when implemented',
      '  if ((side as any).isSwamp) speedMods.push(1024);');
    source = once(source, 'export function getMoveEffectiveness(', 'function guideOriginalEffectiveness(');
    return `import {applyPhase, fieldGrounded} from 'guide-calc-rules';\n${source}\n
export function getMoveEffectiveness(gen: any, move: any, type: any, revealed?: boolean, gravity?: boolean, ring?: boolean) {
  const value = guideOriginalEffectiveness(gen, move, type, revealed, gravity, ring);
  return applyPhase(gen, 'effectiveness', {move, state: {effectivenessType: type}}, value);
}\n`;
  }
  const suffix = filename === 'gen4.ts' ? 'DPP' : filename === 'gen56.ts' ? 'BWXY' : 'SMSSSV';
  const modern = suffix !== 'DPP';
  source = editFunction(source, `calculate${suffix}`, body => {
    body = once(body, "!defender.hasItem('Iron Ball') && defender.hasAbility('Levitate'",
      "!(defender as any).guideGrounded && !defender.hasItem('Iron Ball') && defender.hasAbility('Levitate'");
    if (modern) body = once(body, "!field.isGravity && defender.hasItem('Air Balloon')",
      "!field.isGravity && !(defender as any).guideGrounded && defender.hasItem('Air Balloon')");
    const criticalStart = body.indexOf('  const isCritical');
    const criticalEnd = body.indexOf(';', criticalStart) + 1;
    if (criticalStart === -1 || !criticalEnd) throw new Error('Missing critical point');
    body = body.slice(0, criticalStart) + body.slice(criticalStart, criticalEnd).replace('const isCritical', 'let isCritical')
      + `\n  const guideNativeCrit = isCritical;\n  isCritical = ${invocation(body, 'critical', 'isCritical')};` + body.slice(criticalEnd);
    body = once(body, '  const isGhostRevealed', `  ${invocation(body, 'afterMoveType', 'undefined')};\n  const isGhostRevealed`);
    body = once(body, '  let typeEffectiveness = type1Effectiveness * type2Effectiveness;',
      `  let typeEffectiveness = type1Effectiveness * type2Effectiveness;\n  (gen as any).guideContext.state.typeEffectiveness = typeEffectiveness;`);
    const powerMarker = modern ? `  const basePower = calculateBasePower${suffix}(` : '  let basePower = calculateBasePowerDPP(';
    body = once(body, powerMarker, `  (gen as any).guideContext.state.typeEffectiveness = typeEffectiveness;\n${powerMarker}`);
    if (body.includes("  const turnOrder = attacker.stats.spe > defender.stats.spe ? 'first' : 'last';")) {
      body = once(body, "  const turnOrder = attacker.stats.spe > defender.stats.spe ? 'first' : 'last';",
        `  const turnOrder = ${invocation(body, 'turnOrder', "attacker.stats.spe > defender.stats.spe ? 'first' : 'last'")};`);
    }
    body = once(body, '    for (let times = 1; times < numAttacks; times++) {',
      `    for (let times = 1; times < numAttacks; times++) {\n      (gen as any).guideContext.state.hit = times + 1;\n      (gen as any).guideContext.state.hitCount = times;\n      isCritical = ${invocation(body, 'critical', 'guideNativeCrit')};`);
    if (modern) body = body.replaceAll('getFinalDamage(', 'guideRoll(gen, getFinalDamage, ');
    if (suffix === 'BWXY') {
      // Stock omits the hit number in the multi-hit loop, so Triple Kick stayed at its first-hit power.
      body = once(body, '        hasAteAbilityTypeChange,\n        desc\n      );', '        hasAteAbilityTypeChange,\n        desc,\n        times + 1\n      );');
      body = once(body, '      const newBaseDamage = getBaseDamage(attacker.level, newBasePower, newAtk, newDef);',
        `      const useGuideDamage = (gen as any).critMultiplier !== undefined || ['critical','beforeWeather','hitBaseDamage','baseDamage'].some(phase => (gen as any).guideRules[phase]?.length);\n      const newBaseDamage = useGuideDamage\n        ? calculateBaseDamageBWXY(gen, attacker, newBasePower, newAtk, newDef, move, field, desc, isCritical)\n        : getBaseDamage(attacker.level, newBasePower, newAtk, newDef);`);
    }
    if (!modern) {
      // Per-hit base damage after the native division, before Gen 4 burn and final mods (first hit, then loop).
      body = once(body, "  );\n\n  if (attacker.hasStatus('brn') && isPhysical && !attacker.hasAbility('Guts')) {",
        `  );\n  baseDamage = ${invocation(body, 'hitBaseDamage', 'baseDamage')};\n\n  if (attacker.hasStatus('brn') && isPhysical && !attacker.hasAbility('Guts')) {`);
      body = once(body, "      );\n      if (attacker.hasStatus('brn') && isPhysical && !attacker.hasAbility('Guts')) {",
        `      );\n      baseDamage = ${invocation(body, 'hitBaseDamage', 'baseDamage')};\n      if (attacker.hasStatus('brn') && isPhysical && !attacker.hasAbility('Guts')) {`);
      body = once(body, 'let newBasePower = calculateBasePowerDPP(gen, attacker, defender, move, field, desc);',
        'let newBasePower = calculateBasePowerDPP(gen, attacker, defender, move, field, desc, times + 1);');
      body = once(body, '        ) / defense',
        '        ) / (isCritical === guideNativeCrit ? defense : calculateDefenseDPP(gen, attacker, defender, move, field, desc, isCritical))');
      body = once(body, '  const damage: number[] = [];',
        `  const guideFinalMods = ${invocation(body, 'finalMods', '[]', 'typeEffectiveness, isCritical')};\n  const guideInputs = ${invocation(body, 'beforeRolls', '{baseDamage,stabMod,type1Effectiveness,type2Effectiveness,filterMod,ebeltMod,metronomeMod,tintedMod,berryMod}')};\n  ({baseDamage,stabMod,type1Effectiveness,type2Effectiveness,filterMod,ebeltMod,metronomeMod,tintedMod,berryMod}=guideInputs);\n  const damage: number[] = [];`);
      body = once(body, '    damage[i] = Math.max(1, damage[i]);',
        `    damage[i] = ${invocation(body, 'roll', 'Math.max(1, guideFinalMods.reduce((value, mod) => Math.floor(value * mod), damage[i]))', 'rollIndex:i')};`);
      body = once(body, '        damageArray[i] = newFinalDamage;',
        `        damageArray[i] = ${invocation(body, 'roll', 'Math.max(1, perHitFinalMods.reduce((value, mod) => Math.floor(value * mod), newFinalDamage))', 'rollIndex:i')};`);
      body = once(body, '      const damageArray = [];',
        `      const perHitFinalMods = ${invocation(body, 'finalMods', '[]', 'typeEffectiveness, isCritical')};\n      const perHitInputs = ${invocation(body, 'beforeRolls', '{baseDamage,stabMod,type1Effectiveness,type2Effectiveness,filterMod,ebeltMod,metronomeMod,tintedMod,berryMod}')};\n      ({baseDamage,stabMod,type1Effectiveness,type2Effectiveness,filterMod,ebeltMod,metronomeMod,tintedMod,berryMod}=perHitInputs);\n      const damageArray = [];`);
    }
    return body;
  });
  source = editFunction(source, `calculateBasePower${suffix}`, body => {
    const before = modern ? '  if (basePower === 0) {' : '  return basePower;';
    body = once(body, before, `  basePower = ${invocation(body, 'movePower', 'basePower', 'hit:(gen as any).guideContext.state.hit')};\n${before}`);
    if (modern) {
      // Triple Kick / Axel scale the move's own power per hit (a hack that changes it keeps 1x / 2x / 3x).
      body = once(body, '    basePower = hit * 10;', '    basePower = hit * move.bp;');
      if (suffix === 'SMSSSV') body = once(body, '    basePower = hit * 20;', '    basePower = hit * move.bp;');
    }
    return once(body, "  const turnOrder = attacker.stats.spe > defender.stats.spe ? 'first' : 'last';",
      `  const turnOrder = ${invocation(body, 'turnOrder', "attacker.stats.spe > defender.stats.spe ? 'first' : 'last'")};`);
  });
  for (const [functionPart, phase, variable] of modern
    ? [['BPMods', 'powerMods', 'bpMods'], ['AtMods', 'attackMods', 'atMods'], ['DfMods', 'defenseMods', 'dfMods'], ['FinalMods', 'finalMods', 'finalMods']]
    : [['BPMods', 'powerMods', 'basePower']]) {
    source = editFunction(source, `calculate${functionPart}${suffix}`, body => {
      const state = ['basePower', 'hitsPhysical', 'isCritical', 'typeEffectiveness', 'hitCount', 'hit'].filter(name => {
        const header = body.slice(0, body.indexOf(') {'));
        return new RegExp(`\\b${name}\\s*[:=]`).test(header);
      }).join(',');
      const call = modern ? invocation(body, phase, variable, state)
        : invocation(body, phase, variable, state).replace('applyPhase(', 'legacyMods(');
      return once(body, `  return ${variable};`, `  return ${call};`);
    });
  }
  for (const [part, phase, value] of [['Attack', 'attack', 'attack'], ['Defense', 'defense', 'defense']]) {
    source = editFunction(source, `calculate${part}${suffix}`, body => {
      const before = modern && suffix === 'SMSSSV' && phase === 'defense'
        ? '  return OF16(Math.max(1, pokeRound((defense * chainMods(dfMods, 410, 131072)) / 4096)));'
        : `  return ${value};`;
      const original = before.trim().slice(7, -1);
      let call = invocation(body, phase, original, 'isCritical');
      if (!modern) {
        const mods = invocation(body, `${phase}Mods`, original, 'isCritical').replace('applyPhase(', 'legacyMods(');
        call = invocation(body, phase, mods, 'isCritical');
      }
      return once(body, before, `  return ${call};`);
    });
  }
  const damageFunction = modern ? `calculateBaseDamage${suffix}` : 'calculateFinalModsDPP';
  source = editFunction(source, damageFunction, body => {
    const before = modern ? '  let baseDamage = getBaseDamage(attacker.level, basePower, attack, defense);'
      : "  const isPhysical = move.category === 'Physical';";
    body = once(body, before, `  ${invocation(body, 'beforeWeather', 'undefined')};\n${before}`);
    if (modern) {
      // Per-hit base damage after the native spread step, before Parental Bond (Child), weather and crit.
      body = once(body, "  if (attacker.hasAbility('Parental Bond (Child)')) {",
        `  baseDamage = ${invocation(body, 'hitBaseDamage', 'baseDamage')};\n  if (attacker.hasAbility('Parental Bond (Child)')) {`);
    }
    return once(body, '  return baseDamage;', `  return ${invocation(body, 'baseDamage', 'baseDamage', 'isCritical')};`);
  });
  return `import {applyPhase, legacyMods, guideRoll} from 'guide-calc-rules';\n${source}`;
}
