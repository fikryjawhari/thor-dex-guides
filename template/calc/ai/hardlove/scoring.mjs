import * as helpers from './helpers.mjs';
import * as calc from './calc.mjs';

const id = value => String(value?.name ?? value ?? 'NONE').toUpperCase().replace(/[^A-Z0-9]/g, '') || 'NONE';
const effect = value => String(value ?? '').replace(/^MOVE_EFFECT_/, '').toUpperCase();
const FLAGS = {
    STATUS_SLEEP: 7, STATUS_PARALYSIS: 8, STATUS_POISON_ALL: 48, STATUS_BURN: 64, STATUS_BAD_POISON: 32,
    STATUS2_TORMENT: 1, STATUS2_NIGHTMARE: 2, STATUS2_SUBSTITUTE: 4, STATUS2_FOCUS_ENERGY: 8,
    STATUS2_ATTRACT: 16, STATUS2_CONFUSION: 32,
    MOVE_EFFECT_FLAG_YAWN: 1, MOVE_EFFECT_FLAG_NO_CRITICAL: 2, MOVE_EFFECT_FLAG_INGRAIN: 4,
    MOVE_EFFECT_FLAG_AQUA_RING: 8, MOVE_EFFECT_FLAG_LOCK_ON: 16, MOVE_EFFECT_FLAG_LEECH_SEED: 32,
    MOVE_EFFECT_FLAG_IMPRISONED: 64,
    FIELD_CONDITION_SANDSTORM_ALL: 1, FIELD_CONDITION_SNOW_ALL: 2, FIELD_CONDITION_HAIL_ALL: 4,
    FIELD_CONDITION_RAIN_ALL: 8, FIELD_CONDITION_SUN_ALL: 16, FIELD_CONDITION_FOG: 32,
    FIELD_CONDITION_TRICK_ROOM: 64, FIELD_CONDITION_GRAVITY: 128, FIELD_CONDITION_UPROAR: 256,
    SIDE_STATUS_STEALTH_ROCK: 1, SIDE_STATUS_STICKY_WEB: 2, SIDE_STATUS_LUCKY_CHANT: 4,
    SIDE_STATUS_SPIKES: 8, SIDE_STATUS_TOXIC_SPIKES: 16, SIDE_STATUS_REFLECT: 32,
    SIDE_STATUS_LIGHT_SCREEN: 64, SIDE_STATUS_AURORA_VEIL: 128, SIDE_STATUS_SAFEGUARD: 256,
};
const volatileFlags = {
    torment: 'STATUS2_TORMENT', nightmare: 'STATUS2_NIGHTMARE', substitute: 'STATUS2_SUBSTITUTE',
    focusEnergy: 'STATUS2_FOCUS_ENERGY', attract: 'STATUS2_ATTRACT', confusion: 'STATUS2_CONFUSION',
};
const moveEffectFlags = {
    yawn: 'MOVE_EFFECT_FLAG_YAWN', noCritical: 'MOVE_EFFECT_FLAG_NO_CRITICAL', ingrain: 'MOVE_EFFECT_FLAG_INGRAIN',
    aquaRing: 'MOVE_EFFECT_FLAG_AQUA_RING', lockOn: 'MOVE_EFFECT_FLAG_LOCK_ON', leechSeed: 'MOVE_EFFECT_FLAG_LEECH_SEED',
    imprisoned: 'MOVE_EFFECT_FLAG_IMPRISONED',
};
const sideFlags = {
    stealthRock: 'SIDE_STATUS_STEALTH_ROCK', stickyWeb: 'SIDE_STATUS_STICKY_WEB', luckyChant: 'SIDE_STATUS_LUCKY_CHANT',
    spikes: 'SIDE_STATUS_SPIKES', toxicSpikes: 'SIDE_STATUS_TOXIC_SPIKES', reflect: 'SIDE_STATUS_REFLECT',
    lightScreen: 'SIDE_STATUS_LIGHT_SCREEN', auroraVeil: 'SIDE_STATUS_AURORA_VEIL', safeguard: 'SIDE_STATUS_SAFEGUARD',
};
const bits = (facts, names) => Object.entries(names).reduce((mask, [name, flag]) => mask | (facts[name] ? FLAGS[flag] : 0), 0);
const integer = value => Math.trunc(value);
const unsigned = value => integer(value) >>> 0;

function sourceContext(state, inputAi, random) {
    if (typeof random !== 'function') throw new TypeError('Scoring requires an explicit random(modulus) function');
    if (inputAi.isDoubleBattle) throw new RangeError('Hardlove scoring currently supports singles only');
    const attackerMon = sourceMon(inputAi.attackerMon ?? state.attacker);
    const defenderMon = sourceMon(inputAi.defenderMon ?? state.defender);
    const field = state.field ?? {};
    const facts = field.facts ?? {};
    const sides = [field.attacker ?? {}, field.defender ?? {}];
    const weather = id(field.weather);
    let field_condition = ({ SAND: 1, SANDSTORM: 1, SNOW: 2, HAIL: 4, RAIN: 8, RAINDANCE: 8, SUN: 16, SUNNYDAY: 16, HARSHSUNSHINE: 16, HEAVYRAIN: 8, DESOLATELAND: 16, PRIMORDIALSEA: 8, FOG: 32 }[weather] ?? 0);
    for (const name of ['fog', 'trickRoom', 'gravity', 'uproar']) if (facts[name] ?? field[name]) field_condition |= FLAGS[`FIELD_CONDITION_${name.replace(/[A-Z]/g, letter => `_${letter}`).toUpperCase()}`];
    const ai = { ...inputAi, attackerMon, defenderMon, attacker: 0, defender: 1, attackerSide: 0, defenderSide: 1, isDoubleBattle: false, isAllyAlive: false };
    for (const name of ['attackerLastUsedMove', 'defenderLastUsedMove', 'partnerMoveNo']) ai[name] = id(ai[name]);
    ai.defenderLastUsedMoveEffect = effect(ai.defenderLastUsedMoveEffect);
    const moveTbl = Object.fromEntries([...(state.attacker.moves ?? []), ...(state.defender.moves ?? [])].map(move => [id(move.name), { ...move, effect: effect(move.effect), split: id(move.category), secondaryEffectChance: move.secondaryEffectChance ?? 0, target: move.target }]));
    moveTbl.NONE = { effect: '', split: 'STATUS', secondaryEffectChance: 0 };
    const context = {
        state, ai, battlemon: [attackerMon, defenderMon], moveTbl, field_condition,
        terrainOverlay: { type: id(field.terrain).replace(/TERRAIN$/, ''), numberOfTurnsLeft: facts.terrainTurns ?? field.terrainTurns ?? (field.terrain ? 1 : 0) },
        side_condition: sides.map(side => bits({ ...side, spikes: side.spikes ?? side.spikesLayers, toxicSpikes: side.toxicSpikes ?? side.toxicSpikesLayers }, sideFlags)),
        scw: sides.map(side => ({ spikesLayers: side.spikesLayers ?? side.spikes ?? 0, toxicSpikesLayers: side.toxicSpikesLayers ?? side.toxicSpikes ?? 0 })),
        tailwindCount: sides.map(side => side.tailwindCount ?? side.tailwind ?? 0),
        moveConditionsFlags: [attackerMon, defenderMon].map(mon => ({ throatChopTimer: mon.facts.throatChopTimer ?? 0, laserFocusTimer: mon.facts.laserFocusTimer ?? 0 })),
        binding_turns: [attackerMon, defenderMon].map(mon => mon.facts.bindingTurns ?? 0),
        protectSuccessTurns: [attackerMon, defenderMon].map(mon => mon.facts.protectSuccessTurns ?? 0),
        recycle_item: [attackerMon, defenderMon].map(mon => id(mon.facts.recycleItem)),
        fcc: {
            future_prediction_count: [attackerMon, defenderMon].map(mon => mon.facts.futurePredictionCount ?? 0),
            wish_count: [attackerMon, defenderMon].map(mon => mon.facts.wishCount ?? 0),
        },
    };
    const battleSystem = { sp: context, random: modulus => {
        const draw = random(modulus);
        if (!Number.isInteger(draw) || draw < 0 || draw >= modulus) throw new RangeError(`random(${modulus}) must return an integer in [0, ${modulus})`);
        return draw;
    } };
    return { battleSystem, ai };
}

function RecoveryScoringPort(battleSystem, attacker, moveIndex, ai)
{
    let moveScore = 0;
    const context = battleSystem.sp;
    let isHealingMove = 1;

    ai.attackerMove = context.battlemon[attacker].move[moveIndex];
    ai.attackerMoveEffect = context.moveTbl[ai.attackerMove].effect;

    let aiShouldRecover = shouldRecoverPort(battleSystem, attacker, ai.attackerMoveEffect, ai);
    if (ai.attackerMon.percenthp >= 85) {
        moveScore -= 6;
    }

    switch (ai.attackerMoveEffect) {
    case "STRENGTH_SAP": 
        if (aiShouldRecover) {
            moveScore += 7;
        } else {
            moveScore += 5;
        }
        break;
    case "HEAL_IN_3_TURNS":
        if (context.fcc.wish_count[ai.attacker] != 0) {
            moveScore -= 80;
            break;
        }
        
    case "HEAL_HALF_REMOVE_FLYING_TYPE":
    case "RESTORE_HALF_HP":
        if (aiShouldRecover) {
            moveScore += 7;
        } else {
            moveScore += 5;
        }
        break;
    case "HEAL_HALF_DIFFERENT_IN_WEATHER": {
        let recoverAmount = GetRecoverAmountPercentPort(battleSystem, ai.attackerMove, "HEAL_HALF_DIFFERENT_IN_WEATHER", ai);
        if (aiShouldRecover && recoverAmount > 50) {
            moveScore += 7;
        } else if (recoverAmount == 50 && shouldRecoverPort(battleSystem, attacker, "RESTORE_HALF_HP", ai)) {
            moveScore += 7;
        } else {
            moveScore += 5;
        }
        break;
    }
    case "RECOVER_HEALTH_AND_SLEEP": {
        let partnerHasSweetVeil = ai.isDoubleBattle && ai.isAllyAlive && ai.aimonAlly.ability == "SWEETVEIL";
        let blockedByTerrain = ai.attackerMon.isGrounded && context.terrainOverlay.numberOfTurnsLeft > 0
            && (context.terrainOverlay.type == "ELECTRIC" || context.terrainOverlay.type == "MISTY");
        if ((context.field_condition & FLAGS.FIELD_CONDITION_UPROAR)
            || ai.attackerMon.ability == "SWEETVEIL"
            || partnerHasSweetVeil || blockedByTerrain) {
            moveScore -= 80;
            break;
        }

        if (aiShouldRecover) {
            if (ai.attackerMon.item == "CHESTOBERRY" || ai.attackerMon.item == "LUMBERRY"
                || ai.attackerMon.ability == "EARLYBIRD" || ai.attackerMon.ability == "SHEDSKIN"
                || (ai.isDoubleBattle && ai.aimonAlly.ability == "HEALER")
                || BattlerKnowsMove(battleSystem, attacker, "SLEEPTALK", ai) || BattlerKnowsMove(battleSystem, attacker, "SNORE", ai)
                || (ai.attackerMon.ability == "HYDRATION" && (context.field_condition & FLAGS.FIELD_CONDITION_RAIN_ALL))) {
                moveScore += 8;
            } else {
                moveScore += 7;
            }
        } else {
            moveScore += 5;
        }
    }
        break;
    default:
        isHealingMove = 0;
        break;
    }

    if (!isHealingMove) {
        moveScore = 0;
    } else if (context.battlemon[attacker].moveeffect.healBlockTurns) {
        moveScore = 0 - 20;
    } else if (ai.attackerMon.percenthp == 100) {
        moveScore = 0 - 20;
    }

    return moveScore;
}

function shouldRecoverPort(battleSystem, attacker, attackerMoveEffect, ai)
{
    let recoverAmountPercent = GetRecoverAmountPercentPort(battleSystem, ai.attackerMove, attackerMoveEffect, ai);

    let recoverAmountHP = integer(recoverAmountPercent * ai.attackerMon.maxhp / 100);
    if ((recoverAmountHP + ai.attackerMon.hp) > ai.attackerMon.maxhp) {
        recoverAmountHP = ai.attackerMon.maxhp - ai.attackerMon.hp; 
    }

    if (ai.attackerMon.condition & FLAGS.STATUS_BAD_POISON && attackerMoveEffect != "RECOVER_HEALTH_AND_SLEEP") {
        return 0;
    }
    if (ai.maxDamageReceived > recoverAmountHP) {
        return 0;
    }
    if (ai.aiMovesFirst) {
        if (ai.playerCanOneShotMonWithAnyMove && ai.maxDamageReceived < (ai.attackerMon.hp + recoverAmountHP)) { 
            return 1;
        }
        if (!ai.playerCanOneShotMonWithAnyMove) {
            if (ai.attackerMon.percenthp < 40) {
                return 1;
            } else if (ai.attackerMon.percenthp < 66) {
                return 0 + (battleSystem.random(2));
            }
        }
    } else {
        if (ai.attackerMon.percenthp < 50) {
            return 1;
        } else if (ai.attackerMon.percenthp < 70 && (battleSystem.random(4)) != 0) { 
            return 1;
        }
    }

    return 0;
}

function GetRecoverAmountPercentPort(battleSystem, attackerMove, attackerMoveEffect, ai)
{
    const context = battleSystem.sp;
    let recoverAmountPercent = 50;
    switch (attackerMoveEffect) {
    case "RECOVER_HEALTH_AND_SLEEP":
        recoverAmountPercent = 100;
        break;
    case "HEAL_HALF_DIFFERENT_IN_WEATHER":
        if ((attackerMove == "SHOREUP" && (context.field_condition & FLAGS.FIELD_CONDITION_SANDSTORM_ALL))
            || (attackerMove != "SHOREUP" && ((context.field_condition & FLAGS.FIELD_CONDITION_SUN_ALL) || ai.attackerMon.ability == "MEGASOL"))) {
            recoverAmountPercent = 67;
        } else if (attackerMove != "SHOREUP"
            && (context.field_condition & (FLAGS.FIELD_CONDITION_RAIN_ALL | FLAGS.FIELD_CONDITION_SANDSTORM_ALL | FLAGS.FIELD_CONDITION_HAIL_ALL | FLAGS.FIELD_CONDITION_SNOW_ALL))) {
            recoverAmountPercent = 25;
        }
        break;
    default:
        break;
    }
    return recoverAmountPercent;
}

function HarassmentScoringPort(battleSystem, attacker, moveIndex, ai)
{
    let moveScore = 0;
    let sharesMoves = 0;
    const context = battleSystem.sp;

    ai.attackerMove = context.battlemon[attacker].move[moveIndex];
    ai.attackerMoveEffect = context.moveTbl[ai.attackerMove].effect;

    switch (ai.attackerMoveEffect) {
    case "CALL_RANDOM_MOVE":
        moveScore += 6;
        break;
    case "DISABLE":
        if (context.battlemon[ai.defender].moveeffect.disabledTurns) {
            moveScore -= 20;
            break;
        }

        if (context.battlemon[ai.defender].moveeffect.moveNoChoice != "NONE") {
            moveScore += 6;
            if (ai.aiMovesFirst) {
                moveScore += 3;
            }
        } else if (ai.playerMovesFirst) {
            let itemEffect = HeldItemHoldEffectGet(context, ai.defender);
            if (itemEffect == "CHOICEATK" || itemEffect == "CHOICESPEED" || itemEffect == "CHOICESPATK") {
                moveScore += 6;
                if (ai.anyPlayerMonCanOneShotMonWithAnyMove) {
                    moveScore += 3;
                }
            }
        }
        break;
    case "PARTING_SHOT":
    {
        if (ai.defenderImmuneToStatDrop)
        {
            moveScore -= 20;
            break;
        }

        if (ai.effectivenessOnPlayer[moveIndex] > 0) {
            if (ai.livingMembersAttacker > (1 + ai.isDoubleBattle)) {
                moveScore += 6;
            }
            if (ai.shouldSwitch) {
                moveScore += 3;
            }
            if (ai.attackerMon.ability == "REGENERATOR" && ai.attackerMon.percenthp < 67) {
                moveScore += 1;
            }
        }
        break;
    }
    case "TAUNT":
        if (context.battlemon[ai.defender].moveeffect.tauntTurns > 0)
        {
            moveScore -= 20;
        }
        else if (ai.defenderMon.ability == "OBLIVIOUS" || ai.defenderMon.ability == "AROMAVEIL"
            || (ai.isDoubleBattle && context.battlemon[BATTLER_ALLY(ai.defender)].hp > 0 && context.battlemon[BATTLER_ALLY(ai.defender)].ability == "AROMAVEIL"))
        {
            moveScore -= 20;
        }
        else
        {
            
            let playerSideHasHazards = (context.side_condition[ai.defenderSide] & (FLAGS.SIDE_STATUS_SPIKES | FLAGS.SIDE_STATUS_TOXIC_SPIKES | FLAGS.SIDE_STATUS_STEALTH_ROCK | FLAGS.SIDE_STATUS_STICKY_WEB))
                || context.scw[ai.defenderSide].spikesLayers
                || context.scw[ai.defenderSide].toxicSpikesLayers;
            let blocksUsefulMove = (playerSideHasHazards && BattlerKnowsMove(battleSystem, ai.defender, "DEFOG", ai))
                || (!context.tailwindCount[ai.defenderSide] && BattlerKnowsMove(battleSystem, ai.defender, "TAILWIND", ai))
                || (!(context.field_condition & FLAGS.FIELD_CONDITION_TRICK_ROOM) && BattlerKnowsMove(battleSystem, ai.defender, "TRICKROOM", ai));

            if (blocksUsefulMove && ai.aiMovesFirst) {
                moveScore += 9;
            } else if (ai.defenderHasAtleastOneStatusMove) {
                moveScore += 6;
            } else {
                moveScore += 5;
            }
        }
        break;
    case "RECYCLE": {
        if (ai.attackerMon.item == "NONE" && context.recycle_item[attacker] == "BERRYJUICE") {
            moveScore += 6;
        } else {
            moveScore -= 20;
        }
        break;
    }
    case "GRAVITY":
    {
        if (context.field_condition & FLAGS.FIELD_CONDITION_GRAVITY) {
            moveScore -= 20;
        } else {
            moveScore += 6;
        }
        break;
    }
    case "STEALTH_ROCK":
    case "SET_SPIKES":
    case "TOXIC_SPIKES":
        if (ai.attackerMon.firstTurnOut) {
            moveScore += 8;
        } else {
            moveScore += 6;
        }
        if (battleSystem.random(4) != 0) {
            moveScore += 1;
        }
        if (context.scw[ai.defenderSide].spikesLayers > 0 && ai.attackerMoveEffect == "SET_SPIKES") {
            moveScore -= 1;
        }
        if (context.scw[ai.defenderSide].toxicSpikesLayers > 0 && ai.attackerMoveEffect == "TOXIC_SPIKES") {
            moveScore -= 1;
        }
        break;
    case "STICKY_WEB":
        if (ai.attackerMon.firstTurnOut) {
            moveScore += 9;
        } else {
            moveScore += 6;
        }
        if (battleSystem.random(4) != 0) {
            moveScore += 3;
        }
        break;
    case "SURVIVE_WITH_1_HP": 
    {
        let monDiesEndTurnEndure = MonDiesFromResidualDamage(context, ai.attacker, ai.attackerMon.condition, (context.battlemon[ai.attacker].effect_of_moves & FLAGS.MOVE_EFFECT_FLAG_LEECH_SEED));

        if (IsMonInflictedWithAnyNegativeStatus(context, attacker)) {
            moveScore -= 1;
        }
        if (ai.playerMovesFirst && ai.anyPlayerMonCanOneShotMonWithAnyMove) {
            moveScore += 6;
            if (IS_ITEM_BERRY(ai.attackerMon.item)) {
                moveScore += 2;
            }
        }
        if (context.protectSuccessTurns[ai.attacker] == 1) {
            if (battleSystem.random(2) == 0) {
                moveScore -= 20;
            }
        }
        if (context.protectSuccessTurns[ai.attacker] > 1 || monDiesEndTurnEndure) {
            moveScore -= 80;
        }
        break;
    }

    case "PROTECT": 
    {
        let monDiesEndTurn = MonDiesFromResidualDamage(context, ai.attacker, ai.attackerMon.condition, (context.battlemon[ai.attacker].effect_of_moves & FLAGS.MOVE_EFFECT_FLAG_LEECH_SEED));
        moveScore += 6;
        if (IsMonInflictedWithAnyNegativeStatus(context, attacker)) {
            moveScore -= 1;
        }
        if (IsMonInflictedWithAnyNegativeStatus(context, ai.defender)) {
            moveScore += 1;
        }
        if (ai.attackerMon.firstTurnOut && ai.isDoubleBattle) {
            moveScore -= 1;
        }
        if (ai.attackerMon.firstTurnOut
            && ai.attackerMon.item == "TOXICORB" && ai.attackerMon.ability == "POISONHEAL") {
            moveScore += 1;
        }
        if (context.protectSuccessTurns[ai.attacker] == 1) {
            if (battleSystem.random(2) == 0) {
                moveScore -= 20;
            }
        } else if (context.protectSuccessTurns[ai.attacker] > 1) {
            moveScore -= 80;
        }
        if (monDiesEndTurn || ai.defenderMon.ability == "UNSEENFIST" || ai.defenderMon.ability == "PIERCINGDRILL"
            || ai.attackerMon.ability == "TRUANT") {
            moveScore -= 80;
        }
        break;
    }
    case "MAKE_SHARED_MOVES_UNUSEABLE":
        if (context.battlemon[ai.defender].effect_of_moves & FLAGS.MOVE_EFFECT_FLAG_IMPRISONED) {
            moveScore -= 20;
        } else {
            for (let defenderMoveIndex = 0; defenderMoveIndex < 4; ++defenderMoveIndex) {
                for (let slotIndex = 0; slotIndex < 4; ++slotIndex) {
                    if (context.battlemon[ai.attacker].move[slotIndex] == context.battlemon[ai.defender].move[defenderMoveIndex] && context.battlemon[ai.defender].move[defenderMoveIndex] != "NONE") {
                        sharesMoves = 1;
                        break;
                    }
                }
                if (sharesMoves == 1) {
                    break;
                }
            }
            if (sharesMoves == 1) {
                moveScore += 9;
            }
        }
        break;
    case "PASS_STATS_AND_STATUS":
        if (ai.livingMembersAttacker > (1 + ai.isDoubleBattle)) {
            if ((ai.attackerPositiveStatChangesSum >= 1) || context.battlemon[ai.attacker].condition2 & FLAGS.STATUS2_SUBSTITUTE) {
                moveScore += 9;
            }
        }
        if (ai.livingMembersAttacker == 1) {
            moveScore -= 20;
        }
        break;
    case "DOUBLE_SPEED_3_TURNS":
        if (context.tailwindCount[ai.attackerSide]) {
            moveScore -= 20;
            break;
        }
        if (IsBattleMonSlowerThanOpposition(context, ai, ai.attackerMon)
            || (ai.isDoubleBattle 
                && ai.isAllyAlive
                && IsBattleMonSlowerThanOpposition(context, ai, ai.aimonAlly))) { 
            moveScore += 9;
        } else {
            moveScore += 5;
        }

        break;
    case "TRICK_ROOM":
        if (context.field_condition & FLAGS.FIELD_CONDITION_TRICK_ROOM) {
            moveScore -= 20;
            break;
        }
        if (IsBattleMonSlowerThanOpposition(context, ai, ai.attackerMon)
            || (ai.isDoubleBattle 
                && ai.isAllyAlive
                && IsBattleMonSlowerThanOpposition(context, ai, ai.aimonAlly))) { 
            moveScore += 10;
        } else {
            moveScore += 5;
        }

        break;
    case "APPLY_TERRAINS":
        if (ai.attackerMon.item == "TERRAINEXTENDER") {
            moveScore += 9;
        } else {
            moveScore += 8;
        }
        break;
    case "SET_REFLECT":
        if (context.side_condition[ai.attackerSide] & FLAGS.SIDE_STATUS_REFLECT) {
            moveScore -= 20;
        } else {
            moveScore += 6;
            if (ai.defenderHasAtleastOnePhysicalMove) {
                if (ai.attackerMon.item == "LIGHTCLAY") {
                    moveScore += 1;
                }
                if (battleSystem.random(2) == 0) {
                    moveScore += 1;
                }
            }
        }
        break;
    case "SET_LIGHT_SCREEN":
        if (context.side_condition[ai.attackerSide] & FLAGS.SIDE_STATUS_LIGHT_SCREEN) {
            moveScore -= 20;
        } else {
            moveScore += 6;
            if (ai.defenderHasAtleastOneSpecialMove) {
                if (ai.attackerMon.item == "LIGHTCLAY") {
                    moveScore += 1;
                }
                if (battleSystem.random(2) == 0) {
                    moveScore += 1;
                }
            }
        }
        break;
    case "SET_AURORA_VEIL":
        if (context.side_condition[ai.attackerSide] & FLAGS.SIDE_STATUS_AURORA_VEIL || (context.field_condition & FLAGS.FIELD_CONDITION_SNOW_ALL) == 0) {
            moveScore -= 20;
        } else {
            moveScore += 6;
            if (ai.attackerMon.item == "LIGHTCLAY") {
                moveScore += 1;
            }
            if (battleSystem.random(2) == 0) {
                moveScore += 2;
            }
        }
        break;
    case "MAKE_GLOBAL_TARGET":
        if (ai.defenderMon.ability == "STALWART" || ai.defenderMon.ability == "PROPELLERTAIL") {
            moveScore -= 20;
        } else if (ai.isDoubleBattle && ai.isAllyAlive) {
            moveScore += 6;
            if (battleSystem.random(10) < 2) {
                moveScore += 2;
            }
        } else {
            moveScore -= 20;
        }
        break;
    case "SHED_TAIL":
    case "SET_SUBSTITUTE":
        moveScore += 6;
        if (context.battlemon[ai.attacker].condition2 & FLAGS.STATUS2_SUBSTITUTE) {
            moveScore -= 80;
        }
        if (ai.aiMovesFirst && (context.battlemon[ai.defender].effect_of_moves & FLAGS.MOVE_EFFECT_FLAG_LEECH_SEED)) {
            moveScore += 2;
        }
        if (ai.defenderMon.condition & FLAGS.STATUS_SLEEP) {
            moveScore += 2;
        }
        if (battleSystem.random(2) == 0) {
            moveScore -= 1;
        }
        if (ai.defenderMon.ability == "INFILTRATOR" || ai.attackerMon.percenthp < 50) {
            moveScore -= 20;
        }
        if (ai.defenderHasAtleastOneUsefulSoundMove && (ai.defenderMon.hasMoldBreaker || ai.attackerMon.ability != "SOUNDPROOF")) {
            moveScore -= 8;
        }
        break;
    case "FAINT_AND_ATK_SP_ATK_DOWN_2":
        moveScore += 6;
        if (ai.attackerMon.percenthp < 10) {
            moveScore += 10;
        } else if (ai.attackerMon.percenthp < 33) {
            if (battleSystem.random(10) < 7) { 
                moveScore += 8;
            }
        } else if (ai.attackerMon.percenthp < 66) {
            if (battleSystem.random(2)) { 
                moveScore += 7;
            }
        } else {
            if (battleSystem.random(20) == 0) { 
                moveScore += 7;
            }
        }

        if (ai.livingMembersAttacker == 1) {
            moveScore -= 20;
        }
        break;
    case "PARALYZE_HIT":
        if (ai.attackerMove != "NUZZLE") {
            break;
        }
        
    case "STATUS_PARALYZE":
        if (ai.playerMovesFirst || 
            (BattlerKnowsMove(battleSystem, attacker, "HEX", ai) == 1) 
            || (BattlerKnowsFlinchingMove(battleSystem, attacker, ai) == 1 && !ai.defenderImmuneToFlinch) 
            || context.battlemon[ai.defender].condition2 & FLAGS.STATUS2_ATTRACT 
            || context.battlemon[ai.defender].condition2 & FLAGS.STATUS2_CONFUSION) {
            moveScore += 8;
        } else {
            moveScore += 7;
        }
        if (battleSystem.random(2)) { 
            moveScore -= 1;
        }
        break;
    case "STATUS_BURN":
        moveScore += 6;
        if (battleSystem.random(3) == 0) {
            if ((BattlerKnowsMove(battleSystem, attacker, "HEX", ai) == 1)
                || (ai.isDoubleBattle && BattlerKnowsMove(battleSystem, BATTLER_ALLY(attacker), "HEX", ai))) { 
                moveScore += 1;
            }
            if (ai.defenderHasAtleastOnePhysicalMove) {
                moveScore += 1;
            }
        }
        break;
    case "STATUS_SLEEP":
        if (ai.attackerMon.ability == "PRANKSTER") {
            moveScore += 2;
        }
        
    case "STATUS_SLEEP_NEXT_TURN":
        moveScore += 6;
        if (!ai.monCanOneShotPlayerWithAnyMove && (battleSystem.random(4) == 0)) 
        {
            if (!ai.defenderImmuneToSleep) {
                moveScore += 1;
            }
            if (((BattlerKnowsMove(battleSystem, attacker, "DREAMEATER", ai) == 1) || (BattlerKnowsMove(battleSystem, attacker, "NIGHTMARE", ai) == 1))
                && (BattlerKnowsMove(battleSystem, ai.defender, "SNORE", ai) == 0) && (BattlerKnowsMove(battleSystem, ai.defender, "SLEEPTALK", ai) == 0)) {
                moveScore += 1;
            }
            if ((BattlerKnowsMove(battleSystem, attacker, "HEX", ai) == 1)
                || (ai.isDoubleBattle && BattlerKnowsMove(battleSystem, BATTLER_ALLY(attacker), "HEX", ai))) 
            {
                moveScore += 1;
            }
        }
        break;
    case "STATUS_POISON":
    case "STATUS_BADLY_POISON":
        moveScore += 6;
        if (!ai.monCanOneShotPlayerWithAnyMove && (battleSystem.random(3) == 0)) 
        {
            if (!ai.defenderImmuneToPoison && ai.defenderMon.percenthp > 20) {
                if (ai.maxDamageReceived < integer(ai.attackerMon.hp / 2) && (BattlerKnowsMove(battleSystem, attacker, "HEX", ai) || BattlerKnowsMove(battleSystem, attacker, "VENOMDRENCH", ai) || BattlerKnowsMove(battleSystem, attacker, "VENOSHOCK", ai) || ai.attackerMon.ability == "MERCILESS")) {
                    moveScore += 2;
                }
            }
        }
        break;
    case "SWITCH_HELD_ITEMS":
        if ((ai.attackerMon.item == "TOXICORB" && !ai.defenderImmuneToPoison) || (ai.attackerMon.item == "FLAMEORB" && !ai.defenderImmuneToBurn)) {
            moveScore += 6;
            if (battleSystem.random(2)) { 
                moveScore += 1;
            }
        } else if (ai.attackerMon.item == "IRONBALL" || ai.attackerMon.item == "LAGGINGTAIL" || ai.attackerMon.item == "STICKYBARB") {
            moveScore += 7;
        }
        break;
    case "SP_ATK_UP_CAUSE_CONFUSION":
    case "ATK_UP_2_STATUS_CONFUSION":
    case "STATUS_CONFUSE":
        if ((context.battlemon[ai.defender].condition2 & FLAGS.STATUS2_CONFUSION)
            || (context.side_condition[ai.defenderSide] & FLAGS.SIDE_STATUS_SAFEGUARD)
            || (!ai.attackerMon.hasMoldBreaker && ai.defenderMon.ability == "OWNTEMPO")) {
            moveScore -= 20;
        } else {
            moveScore += 6;
            if (ai.defenderMon.condition & FLAGS.STATUS_PARALYSIS || context.battlemon[ai.defender].condition2 & FLAGS.STATUS2_ATTRACT) {
                moveScore += 2;
            }
        }
        break;
    case "INFATUATE":
        if (context.battlemon[ai.defender].condition2 & FLAGS.STATUS2_ATTRACT
            || (!ai.attackerMon.hasMoldBreaker && ai.defenderMon.ability == "OBLIVIOUS")
            || ai.attackerMon.sex == "UNKNOWN"
            || ai.defenderMon.sex == "UNKNOWN"
            || ai.attackerMon.sex == ai.defenderMon.sex
        )

        {
            moveScore -= 20;
        } else {
            moveScore += 6;
            if (ai.defenderMon.condition & FLAGS.STATUS_PARALYSIS || context.battlemon[ai.defender].condition2 & FLAGS.STATUS2_CONFUSION) {
                moveScore += 2;
            }
        }
        break;
    case "STATUS_LEECH_SEED":
        if ((context.battlemon[ai.defender].effect_of_moves & FLAGS.MOVE_EFFECT_FLAG_LEECH_SEED) || HasType(context, ai.defender, "GRASS") || ai.defenderMon.ability == "MAGICGUARD") {
            moveScore -= 20;
        } else {
            moveScore += 6;
            if (ai.playerCanOneShotMonWithAnyMove == 0 && ai.defenderMon.percenthp > 20) {
                moveScore += 1;
                if (battleSystem.random(2)) { 
                    moveScore += 1;
                }
            }
            if (context.battlemon[ai.defender].condition2 & FLAGS.STATUS2_ATTRACT || context.battlemon[ai.defender].condition2 & FLAGS.STATUS2_CONFUSION) {
                moveScore += 1;
            }
            if (ai.defenderMon.condition & (FLAGS.STATUS_POISON_ALL | FLAGS.STATUS_BURN | FLAGS.STATUS_PARALYSIS)) {
                moveScore += 1;
            }
        }
        break;
    case "USE_RANDOM_LEARNED_MOVE_SLEEP":
    case "DAMAGE_WHILE_ASLEEP": {
        
        let sleepCounter = context.battlemon[attacker].condition & FLAGS.STATUS_SLEEP;
        let sleepCounterDecrease = (GetBattlerAbility(context, attacker) == "EARLYBIRD") ? 2 : 1;
        let wokenByUproar = (context.field_condition & FLAGS.FIELD_CONDITION_UPROAR) && GetBattlerAbility(context, attacker) != "SOUNDPROOF";
        let staysAsleep = sleepCounter > sleepCounterDecrease && !wokenByUproar;

        if (staysAsleep) {
            moveScore += 24;
        } else {
            moveScore -= 20;
        }
        break;
    }
    case "CURSE":
        if (!HasType(context, attacker, "GHOST")) {
            break;
        }
        
    case "KO_MON_THAT_DEFEATED_USER":
        if (ai.playerCanOneShotMonWithAnyMove && ai.aiMovesFirst) {
            moveScore += 6;
            if (battleSystem.random(5) == 0) {
                moveScore += 1;
            }
        } else if (ai.playerMovesFirst) {
            moveScore += 5;
            if (battleSystem.random(2)) {
                moveScore += 1;
            }
        }
        break;
    case "ION_DELUGE":
        if (ai.isDoubleBattle)
        {   
            if (HasType(context, ai.defender, "GROUND") 
                || ai.defenderMon.ability == "VOLTABSORB") {
                moveScore -= 20;
            } else {
                moveScore += 6;
            }
        }
        break;
    case "CHANGE_TO_WATER_TYPE":
        if (HasType(context, ai.defender, "WATER")) {
            moveScore -= 20;
        } else {
            moveScore += 6;
        }
        break;
    case "ATK_DOWN":
    case "ATK_DOWN_2":
    case "ATK_DOWN_3":
    case "ATK_DEF_DOWN":
        if (ai.defenderHasAtleastOnePhysicalMove)
        {
            moveScore += 5;
            if (2 * ai.maxDamageReceived < ai.attackerMon.hp && 2 * ai.attackerRolledMaxDamage < ai.defenderMon.hp)
            {
                if (!ai.defenderImmuneToStatDrop)
                {
                    if (ai.attackerMon.hasMoldBreaker || ai.defenderMon.ability != "HYPERCUTTER")
                    {
                        moveScore += 1;
                    }
                }
                if (ai.playerMovesFirst)
                {
                    moveScore -= 1;
                }
            }
        } else {
            moveScore -= 20;
        }
        break;
    case "SP_ATK_DOWN":
    case "SP_ATK_DOWN_2":
    case "SP_ATK_DOWN_3":
    case "SP_ATK_DOWN_2_OPPOSITE_GENDER":
    case "ATK_SP_ATK_DOWN":
        if (ai.defenderHasAtleastOneSpecialMove) {
            moveScore += 5;
            if (2 * ai.maxDamageReceived < ai.attackerMon.hp && 2 * ai.attackerRolledMaxDamage < ai.defenderMon.hp)
            {
                if (!ai.defenderImmuneToStatDrop) {
                    moveScore += 1;
                }
                if (ai.playerMovesFirst)
                {
                    moveScore -= 1;
                }
            }
        } else {
            moveScore -= 20;
        }
        break;
    case "DEF_DOWN":
    case "DEF_DOWN_2":
    case "DEF_DOWN_3":
        if (2 * ai.maxDamageReceived < ai.attackerMon.hp && 2 * ai.attackerRolledMaxDamage < ai.defenderMon.hp) {
            if (ai.attackerMon.hasMoldBreaker || (ai.defenderMon.ability != "CLEARBODY" && ai.defenderMon.ability != "WHITESMOKE" && ai.defenderMon.ability != "BIGPECKS" && ai.defenderMon.ability != "CONTRARY")) {
                moveScore += 7;
            }
        }
        break;
    case "SP_DEF_DOWN":
    case "SP_DEF_DOWN_2":
    case "SP_DEF_DOWN_3":
        if (2 * ai.maxDamageReceived < ai.attackerMon.hp && 2 * ai.attackerRolledMaxDamage < ai.defenderMon.hp) {
            if (!ai.defenderImmuneToStatDrop) {
                moveScore += 7;
            }
        }
        break;
    case "EVA_DOWN":
    case "EVA_DOWN_2":
    case "EVA_DOWN_3":
    case "ACC_DOWN":
    case "ACC_DOWN_2":
    case "ACC_DOWN_3":
        moveScore += 5;
        if (!ai.defenderImmuneToStatDrop) {
            if (ai.attackerMon.hasMoldBreaker || ai.defenderMon.ability != "KEENEYE") {
                moveScore += 1;
            }
        }
        if (ai.playerMovesFirst) {
            moveScore -= 1;
        }
        break;
    case "VENOM_DRENCH":
        if (ai.defenderMon.condition & FLAGS.STATUS_POISON_ALL) {
            if ((ai.defenderHasAtleastOnePhysicalMove && context.battlemon[ai.defender].states["attack"] >= 6) || (ai.defenderHasAtleastOneSpecialMove && context.battlemon[ai.defender].states["spAttack"] >= 6)) {
                moveScore += 5;
                if (!ai.defenderImmuneToStatDrop) {
                    moveScore += 1;
                }
                if (ai.playerMovesFirst) {
                    moveScore -= 1;
                }
            } else {
                moveScore -= 20;
            }
        } else {
            moveScore -= 20;
        }
        break;
    case "METAL_BURST":
        moveScore += 6;
        if (ai.attackerHasSturdyOrFocusSashActive) {
            moveScore += 2;
        }
        if (ai.aiMovesFirst && battleSystem.random(4) == 0) {
            moveScore -= 1;
        }
        if (ai.defenderHasAtleastOneStatusMove && battleSystem.random(4) == 0) {
            moveScore -= 1;
        }
        break;
    case "MIRROR_COAT":
    case "COUNTER":
        moveScore += 6;
        if (ai.playerCanOneShotMonWithAnyMove && !ai.attackerHasSturdyOrFocusSashActive) {
            moveScore -= 20;
        }
        
        if (ai.attackerMoveEffect == "COUNTER"  && !ai.defenderHasAtleastOneSpecialMove) {
            moveScore += 2;
            if (ai.attackerHasSturdyOrFocusSashActive) {
                moveScore += 2;
            }
        }

        if (ai.attackerMoveEffect == "MIRROR_COAT" && !ai.defenderHasAtleastOnePhysicalMove) {
            moveScore += 2;
            if (ai.attackerHasSturdyOrFocusSashActive) {
                moveScore += 2;
            }
        }

        if (ai.aiMovesFirst && battleSystem.random(4) == 0) {
            moveScore -= 1;
        }
        if (ai.defenderHasAtleastOneStatusMove && battleSystem.random(4) == 0) {
            moveScore -= 1;
        }
        break;
    case "FORCE_SWITCH":
        if ((ai.defenderMon.ability == "SUCTIONCUPS" && !ai.attackerMon.hasMoldBreaker)
            || (ai.defenderMon.effect_of_moves & FLAGS.MOVE_EFFECT_FLAG_INGRAIN)) {
            moveScore -= 80;
            break;
        }
        if (ai.livingMembersDefender > 1) {
            moveScore += 6;
            if (battleSystem.random(2) == 0) {
                moveScore += 1;
            }
        } else {
            moveScore -= 20;
        }
        break;
    case "ENCORE":
        if (ai.defenderMon.firstTurnOut
            || context.battlemon[ai.defender].moveeffect.encoredTurns > 0
            || context.battlemon[ai.defender].moveeffect.moveNoChoice != "NONE")
        {
            moveScore -= 20;
        }
        else
        {
            let isEncouraged = IsUsedMoveEncouragedToEncore(battleSystem, ai.defenderLastUsedMove, ai.defenderLastUsedMoveEffect);
            if (ai.attackerMon.species == "WOBBUFFET" && !isEncouraged) {
                moveScore += 7;
            }
            if (ai.attackerMon.species != "WOBBUFFET") {
                if (ai.aiMovesFirst && isEncouraged) {
                    moveScore += 7;
                } else {
                    moveScore += 5;
                    if (battleSystem.random(2) == 0) {
                        moveScore += 1;
                    }
                }
            }
        }
    default:
        break;
    }

    return moveScore;
}

function SetupScoringPort(battleSystem, attacker, moveIndex, ai)
{
    let moveScore = 0;
    const context = battleSystem.sp;
    let hasSitrus = (ai.attackerMon.item == "SITRUSBERRY");
    let shouldSetup = 1;
    let isSetupMove = 1;

    ai.attackerMove = context.battlemon[attacker].move[moveIndex];
    ai.attackerMoveEffect = context.moveTbl[ai.attackerMove].effect;

    if (ai.anyPlayerMonCanOneShotMonWithAnyMove || ai.defenderCanForceSwitching) {
        return 0;
    }
    if (ai.defenderMon.ability == "UNAWARE" && (battleSystem.random(4) > 0)) {
        return 0;
    }

    switch (ai.attackerMoveEffect) {
    case "WEATHER_RAIN":
        if (context.field_condition & FLAGS.FIELD_CONDITION_RAIN_ALL) {
            moveScore -= 20;
        } else {
            if (ai.attackerMon.ability == "SWIFTSWIM"
                || ai.attackerMon.ability == "RAINDISH"
                || ai.attackerMon.ability == "HYDRATION"
                || ai.attackerMon.ability == "DRYSKIN") {
                moveScore += 9;
            }
            if (ai.attackerMon.item == "DAMPROCK") {
                moveScore += 1;
            }
        }
        break;
    case "WEATHER_HAIL":
    case "WEATHER_SNOW":
        
        if (context.field_condition & (FLAGS.FIELD_CONDITION_SNOW_ALL|FLAGS.FIELD_CONDITION_HAIL_ALL)) {
            moveScore -= 20;
        } else {
            if (HasType(context, attacker, "ICE")
                || ai.attackerMon.ability == "ICEBODY" || ai.attackerMon.ability == "SNOWCLOAK"
                || ai.attackerMon.ability == "SLUSHRUSH") {
                moveScore += 9;
            }
            if (ai.attackerMon.item == "ICYROCK") {
                moveScore += 1;
            }
        }
        break;
    case "WEATHER_SUN":
        if (context.field_condition & FLAGS.FIELD_CONDITION_SUN_ALL) {
            moveScore -= 20;
        } else {
            if (HasType(context, attacker, "FIRE") || ai.attackerMon.ability == "SOLARPOWER" || ai.attackerMon.ability == "CHLOROPHYLL") {
                moveScore += 9;
            }
            if (ai.attackerMon.item == "HEATROCK") {
                moveScore += 1;
            }
        }
        break;
    case "WEATHER_SANDSTORM":
        if (context.field_condition & FLAGS.FIELD_CONDITION_SANDSTORM_ALL) {
            moveScore -= 20;
        } else {
            if (HasType(context, attacker, "ROCK") || HasType(context, attacker, "GROUND") || HasType(context, attacker, "STEEL")
                || ai.attackerMon.ability == "SANDFORCE" || ai.attackerMon.ability == "SANDRUSH" || ai.attackerMon.ability == "SANDVEIL") {
                moveScore += 9;
            }
            if (ai.attackerMon.item == "SMOOTHROCK") {
                moveScore += 1;
            }
        }
        break;
    case "COPY_STAT_CHANGES": {
        let sumStatChange = BattlerPositiveStatChangesSum(battleSystem, ai.defender);
        if (sumStatChange > 0) {
            moveScore += 5;
        }
        if (sumStatChange > 1) {
            moveScore += sumStatChange;
        }
        break;
    }
    case "EVA_UP":
    case "EVA_UP_2":
    case "EVA_UP_3":
    case "EVA_UP_2_MINIMIZE":
        moveScore += 6;
        if (ai.defenderMon.ability == "NOGUARD" || context.battlemon[attacker].states["evasion"] >= 12) {
            moveScore -= 20;
        }
        if (context.battlemon[attacker].states["evasion"] >= 7) {
            moveScore -= 1;
        } else if (2 * ai.maxDamageReceived < ai.attackerMon.hp) {
            moveScore += 2;
        }
        if (ai.isDefenderIncapacitated) {
            moveScore += 2;
        }
        break;
    case "REMOVE_HAZARDS_AND_BINDING": 
    case "RAISE_SPEED_HIT": 
        if (context.moveTbl[ai.attackerMove].secondaryEffectChance < 100 || ai.attackerRolledMaxDamage == ai.attackerRolledMoveDamages[moveIndex]) 
        {
            isSetupMove = 0;
            break;
        }
        
    case "SPEED_UP_2": 
    case "AUTOTOMIZE":
        if (ai.playerMovesFirst) {
            moveScore += 7;
        } else {
            moveScore -= 20;
        }
        break;
    case "CRIT_UP_2": { 
        let targetCantBeCritted = (!ai.attackerMon.hasMoldBreaker && (ai.defenderMon.ability == "SHELLARMOR" || ai.defenderMon.ability == "BATTLEARMOR"))
            || (context.side_condition[ai.defenderSide] & FLAGS.SIDE_STATUS_LUCKY_CHANT)
            || (ai.defenderMon.effect_of_moves & FLAGS.MOVE_EFFECT_FLAG_NO_CRITICAL);
        if (targetCantBeCritted || context.battlemon[attacker].condition2 & FLAGS.STATUS2_FOCUS_ENERGY) {
            moveScore -= 20;
        } else if (ai.attackerMon.ability == "SUPERLUCK" || ai.attackerMon.ability == "SNIPER" || ai.attackerMon.item == "SCOPELENS") { 
            moveScore += 7;
        } else {
            moveScore += 5;
        }
        break;
    }
    case "LASER_FOCUS": {
        let targetCantBeCritted = (!ai.attackerMon.hasMoldBreaker && (ai.defenderMon.ability == "SHELLARMOR" || ai.defenderMon.ability == "BATTLEARMOR"))
            || (context.side_condition[ai.defenderSide] & FLAGS.SIDE_STATUS_LUCKY_CHANT)
            || (ai.defenderMon.effect_of_moves & FLAGS.MOVE_EFFECT_FLAG_NO_CRITICAL);
        if (context.moveConditionsFlags[attacker].laserFocusTimer || targetCantBeCritted) {
            moveScore -= 20;
        } else {
            moveScore += 6;
        }
        break;
    }
    
    case "MAX_ATK_LOSE_HALF_MAX_HP": 
        if (ai.attackerMon.hp <= integer(ai.attackerMon.maxhp / 2) || context.battlemon[attacker].states["attack"] == 12) {
            moveScore -= 80;
            break;
        }
        moveScore += 4;
        if (ai.isDefenderIncapacitated) {
            moveScore += 5;
        } else if (2 * ai.attackerMon.hp > ai.attackerMon.maxhp) {
            if (hasSitrus) {
                if (2 * ai.maxDamageReceived < unsigned(integer(25 * ai.attackerMon.hp / 10) - ai.attackerMon.maxhp)) { 
                    moveScore += 4;
                }
            } else if (2 * ai.maxDamageReceived < unsigned(2 * ai.attackerMon.hp - ai.attackerMon.maxhp)) { 
                moveScore += 4;
            }
        }
        break;
    case "RAISE_ALL_STATS_LOSE_THIRD_MAX_HP": 
    case "ATK_SP_ATK_SPEED_UP_2_DEF_SP_DEF_DOWN": 
        moveScore += 6;
        if (ai.isDefenderIncapacitated) {
            moveScore += 3;
        }
        if (ai.aiMovesFirst) 
        {
            if (ai.attackerMon.item == "WHITEHERB" || 2 * ai.maxDamageReceived < ai.attackerMon.hp) { 
                moveScore += 2;
            } else {
                moveScore -= 2;
            }
        }
        if (context.battlemon[attacker].states["attack"] > 7 || context.battlemon[attacker].states["spAttack"] > 7) {
            moveScore -= 20;
        }
        break;
    case "RAISE_SP_ATK_HIT": 
    case "RAISE_ATTACK_HIT": 
        if (context.moveTbl[ai.attackerMove].secondaryEffectChance < 100 || ai.attackerRolledMaxDamage == ai.attackerRolledMoveDamages[moveIndex]) 
        {
            isSetupMove = 0;
            break;
        }
        
    case "SP_ATK_UP": 
    case "SP_ATK_UP_2": 
    case "SP_ATK_UP_3": 
    case "ATK_SP_ATK_UP": 
    case "ATK_ACC_UP": 
    case "ATK_UP": 
    case "ATK_UP_2": 
    case "ATK_UP_3":
        if (context.battlemon[attacker].states["attack"] > 11 || context.battlemon[attacker].states["spAttack"] > 11) {
            moveScore -= 80;
        }
        if (context.battlemon[attacker].states["attack"] > 7 || context.battlemon[attacker].states["spAttack"] > 7) {
            moveScore -= 2;
        }
        if (context.battlemon[attacker].states["attack"] > 8 || context.battlemon[attacker].states["spAttack"] > 8) {
            moveScore -= 1;
        }
        moveScore += 6;
        moveScore += OffensiveSetupPort(battleSystem, attacker, moveIndex, ai);
        break;
    case "ATK_SPEED_UP": 
    case "SPEED_UP_2_ATK_UP": 
    case "TIDY_UP": 
    case "ATK_DEF_SPEED_UP": 
    case "RANDOM_STAT_UP_2": 
        if (context.battlemon[attacker].states["attack"] > 11 || context.battlemon[attacker].states["spAttack"] > 11) {
            moveScore -= 80;
        }
        if (context.battlemon[attacker].states["attack"] > 7 || context.battlemon[attacker].states["spAttack"] > 7 || ai.aiMovesFirst) {
            moveScore -= 2;
        }
        if (context.battlemon[attacker].states["attack"] > 8 || context.battlemon[attacker].states["spAttack"] > 8 || ai.aiMovesFirst) {
            moveScore -= 1;
        }
        moveScore += 6;
        moveScore += OffensiveSetupPort(battleSystem, attacker, moveIndex, ai);
        break;
    case "GROUND_TRAP_USER_CONTINUOUS_HEAL": 
        if (context.battlemon[attacker].effect_of_moves & FLAGS.MOVE_EFFECT_FLAG_INGRAIN) {
            moveScore -= 80;
            break;
        }
        moveScore += 6;
        break;
    case "RESTORE_HP_EVERY_TURN": 
        
        if (context.battlemon[attacker].effect_of_moves & FLAGS.MOVE_EFFECT_FLAG_AQUA_RING) {
            moveScore -= 80;
            break;
        }
        moveScore += 6;
        break;
    case "DEF_UP": 
    case "DEF_UP_2": 
    case "DEF_UP_3": 
        if (ai.defenderHasAtleastOnePhysicalMove == 0) {
            break;
        }
        
    case "SP_DEF_UP":
    case "SP_DEF_UP_2": 
    case "SP_DEF_UP_3":
        if (ai.attackerMoveEffect == "SP_DEF_UP" || ai.attackerMoveEffect == "SP_DEF_UP_2" || ai.attackerMoveEffect == "SP_DEF_UP_3") {
            if (ai.defenderHasAtleastOneSpecialMove == 0) {
                break;
            }
        }
        
    case "DEF_UP_DOUBLE_ROLLOUT_POWER": 
    case "SP_DEF_UP_DOUBLE_ELECTRIC_POWER": 
    case "DEF_SP_DEF_UP": 
    case "STUFF_CHEEKS":
        if (context.battlemon[attacker].states["defense"] > 11 || context.battlemon[attacker].states["spDefense"] > 11) {
            moveScore -= 80;
        }
        if (context.battlemon[attacker].states["defense"] > 7 || context.battlemon[attacker].states["spDefense"] > 7) {
            moveScore -= 3;
        }
        if (context.battlemon[attacker].states["defense"] > 8 || context.battlemon[attacker].states["spDefense"] > 8) {
            moveScore -= 1;
        }
        if (ai.attackerMoveEffect == "STUFF_CHEEKS" && !IS_ITEM_BERRY(ai.attackerMon.item)) {
            moveScore -= 80;
        }
        moveScore += 6;
        moveScore += DefensiveSetupPort(battleSystem, attacker, moveIndex, ai);
        break;
    case "STOCKPILE":
        if (context.battlemon[attacker].states["defense"] > 8 || context.battlemon[attacker].states["spDefense"] > 8) {
            moveScore -= 80;
        }
        if (context.battlemon[attacker].states["defense"] > 7 || context.battlemon[attacker].states["spDefense"] > 7) {
            moveScore -= 3;
        }
        moveScore += 6;
        moveScore += DefensiveSetupPort(battleSystem, attacker, moveIndex, ai);
        break;
    case "SP_ATK_SP_DEF_SPEED_UP": 
    case "SP_ATK_SP_DEF_UP": 
        moveScore += 6;
        if (context.battlemon[attacker].states["spAttack"] > 11 || context.battlemon[attacker].states["spDefense"] > 11) {
            moveScore -= 80;
        }
        if (context.battlemon[attacker].states["spAttack"] > 7 || context.battlemon[attacker].states["spDefense"] > 7) {
            moveScore -= 2;
        }
        if (context.battlemon[attacker].states["spAttack"] > 8 || context.battlemon[attacker].states["spDefense"] > 8) {
            moveScore -= 1;
        }
        if (ai.defenderHasAtleastOnePhysicalMove == 0 && ai.defenderHasAtleastOneSpecialMove) {
            moveScore += DefensiveSetupPort(battleSystem, attacker, moveIndex, ai);
        } else {
            moveScore += OffensiveSetupPort(battleSystem, attacker, moveIndex, ai);
        }
        break;
    case "CURSE":
        if (HasType(context, attacker, "GHOST")) {
            isSetupMove = 0;
            break;
        }
        
    case "ATK_DEF_UP": 
    case "ATK_DEF_ACC_UP": 
        
        moveScore += 6;
        if (context.battlemon[attacker].states["attack"] > 11 || context.battlemon[attacker].states["defense"] > 11) {
            moveScore -= 80;
        }
        if (context.battlemon[attacker].states["attack"] > 7 || context.battlemon[attacker].states["defense"] > 7) {
            moveScore -= 2;
        }
        if (context.battlemon[attacker].states["attack"] > 8 || context.battlemon[attacker].states["defense"] > 8) {
            moveScore -= 1;
        }
        if (ai.defenderHasAtleastOnePhysicalMove && ai.defenderHasAtleastOneSpecialMove == 0) {
            moveScore += DefensiveSetupPort(battleSystem, attacker, moveIndex, ai);
        } else {
            moveScore += OffensiveSetupPort(battleSystem, attacker, moveIndex, ai);
        }
        break;
    case "CHARGE_TURN_ATK_SP_ATK_SPEED_UP_2": 
        if (ai.attackerMon.item == "POWERHERB") {
            moveScore += 9;
        } else {
            moveScore -= 20;
        }
        break;
    case "NEXT_ATTACK_ALWAYS_HITS": 
        if (context.field_condition & FLAGS.FIELD_CONDITION_FOG
            && (BattlerKnowsMove(battleSystem, ai.defender, "DEFOG", ai) == 0)
            && (context.battlemon[ai.defender].effect_of_moves & FLAGS.MOVE_EFFECT_FLAG_LOCK_ON) == 0) {

            moveScore += 6;
            if (ai.aiMovesFirst) {
                if (!ai.anyPlayerMonCanOneShotMonWithAnyMove) {
                    moveScore += 3;
                }
            }
        }
        else
        {
            moveScore -= 20;
        }
        break;
    default:
        isSetupMove = 0;
        break;
    }
    if (shouldSetup == 0) {
        moveScore = 0;
    }
    if (isSetupMove == 0) {
        moveScore = 0;
    }

    return moveScore;
}

function DefensiveSetupPort(battleSystem, attacker, moveIndex, ai)
{
    let moveScore = 0;
    if (ai.isDefenderIncapacitated) {
        moveScore += 2;
    }
    if (ai.playerMovesFirst && 2 * ai.maxDamageReceived >= ai.attackerMon.hp) {
        moveScore -= 5;
    }
    if (3 * ai.maxDamageReceived < ai.attackerMon.hp) {
        moveScore += 3;
        if (ai.aiMovesFirst) {
            moveScore += 1;
        }
    }
    return moveScore;
}

function OffensiveSetupPort(battleSystem, attacker, moveIndex, ai)
{
    let moveScore = 0;
    if (ai.isDefenderIncapacitated) {
        moveScore += 3;
    }

    let shouldSetup = 1;
    if (ai.defenderHasSturdyOrFocusSashActive) {
        shouldSetup = 0;
    }

    if (shouldSetup) {
        if (ai.aiMovesFirst) {
            if (!ai.anyPlayerMonCanOneShotMonWithAnyMove && !ai.isDoubleBattle) {
                moveScore += 2;
            }
        }

        if (3 * ai.maxDamageReceived < ai.attackerMon.hp) {
            moveScore += 3;
            if (ai.aiMovesFirst) {
                moveScore += 1;
            }
        }
    }

    if (!ai.aiMovesFirst && (2 * ai.maxDamageReceived >= ai.attackerMon.hp)) {
        moveScore -= 5;
    }
    if ((2 * ai.maxDamageReceived >= ai.attackerMon.hp) && (battleSystem.random(2) == 0))
    {
        moveScore -= 2;
    }

    return moveScore;
}

function DamagingMoveScoringPort(battleSystem, attacker, moveIndex, ai)
{
    let moveScore = 0;
    const context = battleSystem.sp;
    let isMoveHighestDamage = 0;

    if (context.moveTbl[ai.attackerMove].split == "STATUS") {
        return 0;
    }

    ai.attackerMove = context.battlemon[attacker].move[moveIndex];
    ai.attackerMoveEffect = context.moveTbl[ai.attackerMove].effect;

    switch (ai.attackerMove) {
    case "SELFDESTRUCT":
    case "EXPLOSION":
    case "MISTYEXPLOSION": {
        
        let dampOnField = 0;
        for (let slotIndex = 0; slotIndex < BattleWorkClientSetMaxGet(battleSystem); slotIndex++) {
            if (context.battlemon[slotIndex].hp && GetBattlerAbility(context, slotIndex) == "DAMP") {
                dampOnField = 1;
            }
        }
        if ((!dampOnField || ai.attackerMon.hasMoldBreaker) && ai.effectivenessOnPlayer[moveIndex] > 0) 
        {
            if (ai.attackerMon.percenthp < 10) {
                moveScore += 10;
            } else if (ai.attackerMon.percenthp < 33) {
                if (battleSystem.random(10) < 7) { 
                    moveScore += 8;
                }
            } else if (ai.attackerMon.percenthp < 66) {
                if (battleSystem.random(2)) { 
                    moveScore += 7;
                }
            } else {
                if (battleSystem.random(20) == 0) { 
                    moveScore += 7;
                }
            }
        }
        break;
    }
    case "FINALGAMBIT":
        if (ai.effectivenessOnPlayer[moveIndex] > 0) {
            if (ai.aiMovesFirst && ai.attackerMon.hp >= ai.defenderMon.hp) {
                moveScore += 8;
            } else if (ai.aiMovesFirst && ai.playerCanOneShotMonWithAnyMove) {
                moveScore += 7;
            } else {
                moveScore += 6;
            }
        }
        break;
    case "ICEBALL":
    case "ROLLOUT":
        moveScore += 7;
        break;
    case "METEORBEAM":
        if (ai.attackerMon.item == "POWERHERB") {
            moveScore += 9;
        } else {
            moveScore -= 20;
        }
        break;
    case "ELECTROSHOT":
        if (ai.attackerMon.item == "POWERHERB" || context.field_condition & FLAGS.FIELD_CONDITION_RAIN_ALL) {
            moveScore += 9;
        } else {
            moveScore -= 20;
        }
        break;
    case "SANDTOMB":
        if (!ai.defenderMon.isGrounded) {
            break;
        }
        
    case "BIND":
    case "CLAMP":
    case "FIRESPIN":
    case "WRAP":
    case "WHIRLPOOL":
    case "INFESTATION":
        if (context.binding_turns[ai.defender] != 0 || HasType(context, ai.defender, "GHOST") || ai.defenderMon.item == "SHEDSHELL") {
            moveScore -= 20;
        } else {
            moveScore += 6;
            if (battleSystem.random(10) < 2) {
                moveScore += 2;
            }
        }
        break;
    case "RELICSONG": 
        break;
    case "DOOMDESIRE":
    case "FUTURESIGHT":
        if (context.fcc.future_prediction_count[ai.defender] != 0) {
            moveScore -= 80;
            break;
        }
        if (ai.aiMovesFirst && ai.playerCanOneShotMonWithAnyMove) {
            moveScore += 7;
        } else {
            moveScore += 6;
        }
        break;
    default:
        if (ai.attackerRolledMaxDamage == ai.attackerRolledMoveDamages[moveIndex]) {
            isMoveHighestDamage = 1;
            moveScore += 6;
            if ((ai.attackerMoveEffect != "ONE_HIT_KO" || ai.attackerMon.ability == "NOGUARD")
                && ((battleSystem.random(4)) == 0)) { 
                moveScore += 2;
            }
        }
        break;
    }

    if (ai.monCanOneShotPlayerWithMove[moveIndex]) 
    {
        if (ai.aiMovesFirst || (ai.playerMovesFirst && HasMovePriority(battleSystem, ai.attacker, ai.attackerMove, ai.attackerMon.ability, ai.defender))) {
            moveScore += 6; 
        } else if (ai.playerMovesFirst) {
            moveScore += 3;
        }
        if (ai.attackerMon.ability == "MOXIE" || ai.attackerMon.ability == "BEASTBOOST" 
            || ai.attackerMon.ability == "CHILLINGNEIGH" || ai.attackerMon.ability == "GRIMNEIGH"
            || ai.attackerMon.ability == "EELEVATE") {
            moveScore += 1;
        }
    }

    if (ai.attackerMoveEffect == "HIGH_CRITICAL" 
        && (ai.effectivenessOnPlayer[moveIndex] == 20 || ai.effectivenessOnPlayer[moveIndex] == 40 || ai.effectivenessOnPlayer[moveIndex] == 30)) {
        if (battleSystem.random(2) == 0) {
            moveScore += 2;
        }
    }

    if (ai.playerMovesFirst && ai.playerCanOneShotMonWithAnyMove)
    {
        if (HasMovePriority(battleSystem, ai.attacker, ai.attackerMove, ai.attackerMon.ability, ai.defender)) {
            moveScore += 11;
        }
    }
    if (!isMoveHighestDamage) {
        switch (ai.attackerMoveEffect) {
        case "LOWER_SPEED_HIT":
            if (context.moveTbl[ai.attackerMove].secondaryEffectChance == 100 && !ai.defenderImmuneToStatDrop)
            {
                if (ai.playerMovesFirst) {
                    moveScore += 6;
                } else {
                    moveScore += 5;
                }
                if (ai.isDoubleBattle) {
                    if (ai.attackerMove == "ICYWIND" || ai.attackerMove == "ELECTROWEB") {
                        moveScore += 1;
                    }
                }
            }
            break;
        case "LOWER_ATTACK_HIT":
            if (context.moveTbl[ai.attackerMove].secondaryEffectChance == 100 && !ai.defenderImmuneToStatDrop) {
                if (ai.defenderHasAtleastOnePhysicalMove) {
                    moveScore += 6;
                } else {
                    moveScore += 5;
                }

                if (ai.isDoubleBattle) {
                    if (context.moveTbl[ai.attackerMove].target == "ADJACENTOPPONENTS") {
                        moveScore += 1;
                    }
                }
            }
            break;
        case "LOWER_SP_ATK_HIT":
            if (context.moveTbl[ai.attackerMove].secondaryEffectChance == 100 && !ai.defenderImmuneToStatDrop) {
                if (ai.defenderHasAtleastOneSpecialMove) {
                    moveScore += 6;
                } else {
                    moveScore += 5;
                }

                if (ai.isDoubleBattle) {
                    if (context.moveTbl[ai.attackerMove].target == "ADJACENTOPPONENTS") {
                        moveScore += 1;
                    }
                }
            }
            break;
        case "USER_DEF_DOWN_HIT":
        case "USER_SPEED_DOWN_2_HIT":
        case "USER_SPEED_DOWN_HIT":
        case "USER_SP_ATK_DOWN_2":
        case "MAKE_IT_RAIN":
        case "USER_DEF_SP_DEF_DOWN_HIT":
        case "USER_ATK_DEF_DOWN_HIT":
        case "USER_DEF_SP_DEF_SPEED_DOWN_HIT":
            if (ai.attackerMon.ability == "CONTRARY") { 
                if (ai.isDefenderIncapacitated) {
                    moveScore += 3;
                }
                if (ai.aiMovesFirst) {
                    moveScore += 3;
                }
                if (3 * ai.maxDamageReceived < ai.attackerMon.hp) {
                    moveScore += 3;
                    if (ai.aiMovesFirst) {
                        moveScore += 1;
                    }
                }
            }
            break;
        default:
            break;
        }
    }

    switch (ai.attackerMove) {
    case "UTURN":
    case "FLIPTURN":
    case "VOLTSWITCH":
        if (ai.effectivenessOnPlayer[moveIndex] > 0) {
            if (!isMoveHighestDamage && ai.livingMembersAttacker > (1+ai.isDoubleBattle)) {
                moveScore += 6;
            }
            if (ai.shouldSwitch) {
                moveScore += 3;
            }
            if (ai.attackerMon.ability == "REGENERATOR" && ai.attackerMon.percenthp < 67) {
                moveScore += 1;
            }
        }
        break;
    case "ACIDSPRAY": {
        if (!ai.defenderImmuneToStatDrop) {
            if (ai.defenderMon.ability != "BULLETPROOF" || ai.attackerMon.hasMoldBreaker) {
                moveScore += 6;
            }
        }
        break;
    }
    case "SUCKERPUNCH": {
        if (ai.attackerLastUsedMove == "SUCKERPUNCH") {
            if (battleSystem.random(2) == 0) {
                moveScore -= 20;
            }
        }
        break;
    }
    case "FIRSTIMPRESSION": {
        if (ai.attackerMon.firstTurnOut) {
            moveScore += 9;
        } else {
            moveScore -= 80;
        }
        break;
    }
    case "FAKEOUT": {
        if (ai.attackerMon.firstTurnOut && !ai.defenderImmuneToFlinch) {
            moveScore += 9;
        } else {
            moveScore -= 80;
        }
        break;
    }
    case "PURSUIT": {
        if (ai.aiMovesFirst) {
            moveScore += 3;
        }

        if (ai.monCanOneShotPlayerWithMove[moveIndex]) {
            moveScore += 10;
        } else if (ai.defenderMon.percenthp < 20) {
            moveScore += 10;
        } else if (ai.defenderMon.percenthp < 40) {
            if (battleSystem.random(2) == 0) {
                moveScore += 8;
            }
        }
        break;
    }
    case "FELLSTINGER": {
        if (context.battlemon[ai.attacker].states["attack"] < 12 && ai.monCanOneShotPlayerWithMove[moveIndex]) {
            if (ai.aiMovesFirst) {
                moveScore += 12;
            } else {
                moveScore += 6;
            }
        }
        break;
    }
    case "FOCUSPUNCH":
    {
        if (ai.isDefenderIncapacitated || context.battlemon[ai.attacker].condition2 & FLAGS.STATUS2_SUBSTITUTE) {
            moveScore += 2;
        } else {
            moveScore -= 80;
        }
        break;
    }
    case "DRAGONTAIL":
    case "CIRCLETHROW":
        if (ai.aiMovesFirst)
        {
            moveScore -= 2;
        }
        break;
    case "EARTHQUAKE":
    case "MAGNITUDE": {
        if (ai.isDoubleBattle && ai.isAllyAlive) {
            if (ai.isPartnerGrounded && ai.aimonAlly.ability != "TELEPATHY") 
            {
                let movetype = BattleAI_GetDynamicMoveType(battleSystem, context, ai.attackerMon, ai.attackerMove);
                let moveEffectiveness = BattleAI_GetTypeEffectiveness(battleSystem, context, ai.attackerMove, movetype, ai.attacker, BATTLER_ALLY(ai.attacker), ai.attackerMon, ai.aimonAlly);
                if (moveEffectiveness > 10) {
                    moveScore -= 10;
                } else if (moveEffectiveness == 10) {
                    moveScore -= 3;
                } else {
                    moveScore += 2;
                }
            } else {
                moveScore += 2;
            }
        }
    }
    default:
        break;
    }

    return moveScore;
}

function BasicScoringPort(battleSystem, attacker, moveIndex, ai)
{
    let moveScore = 0;
    const context = battleSystem.sp;

    ai.attackerMove = context.battlemon[attacker].move[moveIndex];
    ai.attackerMoveEffect = context.moveTbl[ai.attackerMove].effect;

    if (context.battlemon[ai.attacker].pp[moveIndex] == 0) {
        moveScore -= 80;
    }
    if (context.battlemon[ai.attacker].moveeffect.disabledTurns && ai.attackerMove == context.battlemon[ai.attacker].moveeffect.disabledMove) {
        moveScore -= 80;
    }
    if (context.battlemon[ai.attacker].condition2 & FLAGS.STATUS2_TORMENT && ai.attackerMove == ai.attackerLastUsedMove) {
        moveScore -= 80;
    }
    if (context.battlemon[ai.attacker].moveeffect.tauntTurns > 0 && context.moveTbl[ai.attackerMove].split == "STATUS") {
        moveScore -= 80; 
    }
    if (ai.attackerMove == "LEECHSEED" && HasType(context, ai.defender, "GRASS")) {
        moveScore -= 40;
    }
    if (ai.attackerMove == "HELPINGHAND") {
        moveScore -= 80; 
    }
    if (ai.partnerMoveNo == "HELPINGHAND" && context.moveTbl[ai.attackerMove].split == "STATUS") {
        moveScore -= 20; 
    }

    if (IsPowderMove(moveById(battleSystem, ai.attackerMove)) && ai.effectivenessOnPlayer[moveIndex] == 0 && context.moveTbl[ai.attackerMove].split == "STATUS") {
        moveScore -= 40;
    }

    if (HasMovePranksterPriority(battleSystem, ai.attacker, ai.attackerMove, ai.attackerMon.ability, ai.defender) && HasType(context, ai.defender, "DARK"))
    {
        moveScore -= 80; 
    }

    if (ai.effectivenessOnPlayer[moveIndex] == 0 && context.moveTbl[ai.attackerMove].split != "STATUS") 
    {
        moveScore -= 40;
    }

    if (context.moveConditionsFlags[ai.attacker].throatChopTimer && IsMoveSoundBased(moveById(battleSystem, ai.attackerMove))) {
        moveScore -= 80;
    }

    if ((context.terrainOverlay.type == "PSYCHIC" && context.terrainOverlay.numberOfTurnsLeft > 0)
        && ai.defenderMon.isGrounded
        && HasMovePriority(battleSystem, ai.attacker, ai.attackerMove, ai.attackerMon.ability, ai.defender)) {
        moveScore -= 80;
    }

    switch (ai.attackerMoveEffect) {
    case "FLING":
        if (ai.attackerMon.item == "NONE") {
            moveScore -= 80;
        }
        break;
    case "BELCH":
        if (ai.attackerMon.canBelch == 0) {
            moveScore -= 80;
        }
        break;
    case "STEALTH_ROCK":
        if (context.side_condition[ai.defenderSide] & FLAGS.SIDE_STATUS_STEALTH_ROCK || ai.livingMembersDefender == 1 || ai.defenderHasMagicBounce || ai.defenderAllyHasMagicBounce) {
            moveScore -= 20;
        }
        break;
    case "SET_SPIKES":
        if (context.scw[ai.defenderSide].spikesLayers >= 3 || ai.livingMembersDefender == 1 || ai.defenderHasMagicBounce || ai.defenderAllyHasMagicBounce) {
            moveScore -= 20;
        }
        break;
    case "TOXIC_SPIKES":
        if (context.scw[ai.defenderSide].toxicSpikesLayers >= 2 || ai.livingMembersDefender == 1 || ai.defenderHasMagicBounce || ai.defenderAllyHasMagicBounce) {
            moveScore -= 20;
        }
        break;
    case "STICKY_WEB":
        if (context.side_condition[ai.defenderSide] & FLAGS.SIDE_STATUS_STICKY_WEB || ai.livingMembersDefender == 1 || ai.defenderHasMagicBounce || ai.defenderAllyHasMagicBounce) {
            moveScore -= 20;
        }
        break;
    case "APPLY_TERRAINS": {
        switch (ai.attackerMove) {
        case "GRASSYTERRAIN":
            if (context.terrainOverlay.type == "GRASSY" && context.terrainOverlay.numberOfTurnsLeft > 0) {
                moveScore -= 20;
            }
            break;
        case "MISTYTERRAIN":
            if (context.terrainOverlay.type == "MISTY" && context.terrainOverlay.numberOfTurnsLeft > 0) {
                moveScore -= 20;
            }
            break;
        case "ELECTRICTERRAIN":
            if (context.terrainOverlay.type == "ELECTRIC" && context.terrainOverlay.numberOfTurnsLeft > 0) {
                moveScore -= 20;
            }
            break;
        case "PSYCHICTERRAIN":
            if (context.terrainOverlay.type == "PSYCHIC" && context.terrainOverlay.numberOfTurnsLeft > 0) {
                moveScore -= 20;
            }
            break;
        }
        break;
    }
    case "PARALYZE_HIT":
        if (ai.attackerMove != "NUZZLE")
        {
            break;
        }
        
    case "STATUS_PARALYZE":
        if (ai.defenderImmuneToParalysis || ai.effectivenessOnPlayer[moveIndex] == 0) {
            moveScore -= 20;
        }
        break;
    case "STATUS_BURN":
        if (ai.defenderImmuneToBurn || ai.effectivenessOnPlayer[moveIndex] == 0) {
            moveScore -= 20;
        }
        break;
    case "SWITCH_HELD_ITEMS":
        if ((ai.attackerMon.item == "NONE" && ai.defenderMon.item == "NONE")
            || (ai.defenderMon.ability == "STICKYHOLD" && !ai.attackerMon.hasMoldBreaker)) {
            moveScore -= 20;
        }
        break;
    case "STATUS_SLEEP":
    case "STATUS_SLEEP_NEXT_TURN":
        if (ai.defenderImmuneToSleep || (ai.defenderMon.effect_of_moves & FLAGS.MOVE_EFFECT_FLAG_YAWN)) {
            moveScore -= 20;
        }
        break;
    case "STATUS_POISON":
    case "STATUS_BADLY_POISON":
        if (ai.defenderImmuneToPoison) {
            moveScore -= 20;
        }
        break;
    case "STATUS_NIGHTMARE":
        if (context.battlemon[ai.defender].condition2 & FLAGS.STATUS2_NIGHTMARE || ai.defenderMon.ability == "MAGICGUARD"
            || (!(ai.defenderMon.condition & FLAGS.STATUS_SLEEP) && ai.defenderMon.ability != "COMATOSE")) {
            moveScore -= 20;
        }
        break;
    case "FAIL_IF_NOT_USED_ALL_OTHER_MOVES":
        if (context.battlemon[attacker].moveeffect.lastResortCount < ai.attackerMovesKnown - 1) {
            moveScore -= 20;
        }
        break;
    case "WEATHER_SANDSTORM":
        if (context.field_condition & FLAGS.FIELD_CONDITION_SANDSTORM_ALL) {
            moveScore -= 20;
        }
        break;
    case "WEATHER_HAIL":
    case "WEATHER_SNOW":
        if (context.field_condition & (FLAGS.FIELD_CONDITION_SNOW_ALL | FLAGS.FIELD_CONDITION_HAIL_ALL)) {
            moveScore -= 20;
        }
        break;
    case "WEATHER_RAIN":
        if (context.field_condition & FLAGS.FIELD_CONDITION_RAIN_ALL) {
            moveScore -= 20;
        }
        break;
    case "WEATHER_SUN":
        if (context.field_condition & FLAGS.FIELD_CONDITION_SUN_ALL) {
            moveScore -= 20;
        }
        break;
    default:
        break;
    }

    if (ai.attackerMove == "STEELROLLER" && context.terrainOverlay.type == "NONE") {
        moveScore -= 80;
    }

    if (ai.attackerMove == "GIGATONHAMMER" && ai.attackerLastUsedMove == "GIGATONHAMMER") {
        moveScore -= 80;
    }

    return moveScore;
}

const HasType = (context, battler, type) => (context.battlemon[battler].types ?? []).some(name => id(name) === type);
const GetBattlerAbility = (context, battler) => context.battlemon[battler].ability;
const BattleWorkClientSetMaxGet = () => 2;
const BATTLER_ALLY = battler => battler ^ 2;
const IS_ITEM_BERRY = item => item.endsWith('BERRY');
const HeldItemHoldEffectGet = (context, battler) => ({ CHOICEBAND: 'CHOICEATK', CHOICESCARF: 'CHOICESPEED', CHOICESPECS: 'CHOICESPATK' }[context.battlemon[battler].item] ?? 'NONE');
const BattlerPositiveStatChangesSum = (battleSystem, battler) => helpers.BattlerPositiveStatChangesSum(battleSystem.sp.battlemon[battler].source);
const BattlerKnowsMove = (battleSystem, battler, move) => (battleSystem.sp.battlemon[battler].source.moves ?? []).some(known => id(known.name) === move);
const BattlerKnowsFlinchingMove = (battleSystem, battler) => helpers.BattlerKnowsFlinchingMove(battleSystem.sp.battlemon[battler].source);
const MonDiesFromResidualDamage = (context, battler, status, seeded) => helpers.MonDiesFromResidualDamage(context.state, context.battlemon[battler].source, context.battlemon[battler].source.status, Boolean(seeded));
const IsMonInflictedWithAnyNegativeStatus = (context, battler) => helpers.IsMonInflictedWithAnyNegativeStatus(context.battlemon[battler].source);
const IsUsedMoveEncouragedToEncore = (battleSystem, move, moveEffect) => helpers.IsUsedMoveEncouragedToEncore(moveById(battleSystem, move), moveEffect);
const IsBattleMonSlowerThanOpposition = (context, ai, mon) => calc.IsBattleMonSlowerThanOpposition(context.state, { ...ai, defenderMon: ai.defenderMon.source }, mon.source);

function moveById(battleSystem, move) {
    return [...(battleSystem.sp.state.attacker.moves ?? []), ...(battleSystem.sp.state.defender.moves ?? [])].find(known => id(known.name) === move) ?? { name: move };
}

const HasMovePranksterPriority = (battleSystem, attacker, move, ability, defender) => calc.HasMovePranksterPriority(battleSystem.sp.state, battleSystem.sp.battlemon[attacker].source, moveById(battleSystem, move), battleSystem.sp.battlemon[defender].source);
const HasMovePriority = (battleSystem, attacker, move, ability, defender) => calc.HasMovePriority(battleSystem.sp.state, battleSystem.sp.battlemon[attacker].source, moveById(battleSystem, move), battleSystem.sp.battlemon[defender].source);
const IsPowderMove = move => ['POWDER', 'SPORE', 'SLEEPPOWDER', 'POISONPOWDER', 'STUNSPORE', 'COTTONSPORE', 'RAGEPOWDER', 'MAGICPOWDER'].includes(id(move)) || (move.flags ?? []).some(flag => ['POWDER', 'FLAGPOWDER'].includes(id(flag)));
const IsMoveSoundBased = move => helpers.BattlerHasSoundBasedMove({ moves: [move] });

function invoke(scorer, state, moveIndex, inputAi, random) {
    const { battleSystem, ai } = sourceContext(state, inputAi, random);
    ai.attackerMove = battleSystem.sp.battlemon[0].move[moveIndex];
    ai.attackerMoveEffect = battleSystem.sp.moveTbl[ai.attackerMove].effect;
    inputAi.attackerMove = state.attacker.moves[moveIndex].name;
    inputAi.attackerMoveEffect = ai.attackerMoveEffect;
    return Number(scorer(battleSystem, 0, moveIndex, ai));
}

export const BasicScoring = (state, moveIndex, ai, random) => invoke(BasicScoringPort, state, moveIndex, ai, random);
export const DamagingMoveScoring = (state, moveIndex, ai, random) => invoke(DamagingMoveScoringPort, state, moveIndex, ai, random);
export const OffensiveSetup = (state, moveIndex, ai, random) => invoke(OffensiveSetupPort, state, moveIndex, ai, random);
export const DefensiveSetup = (state, moveIndex, ai, random) => invoke(DefensiveSetupPort, state, moveIndex, ai, random);
export const SetupScoring = (state, moveIndex, ai, random) => invoke(SetupScoringPort, state, moveIndex, ai, random);
export const HarassmentScoring = (state, moveIndex, ai, random) => invoke(HarassmentScoringPort, state, moveIndex, ai, random);
export const RecoveryScoring = (state, moveIndex, ai, random) => invoke(RecoveryScoringPort, state, moveIndex, ai, random);
export const GetRecoverAmountPercent = (state, moveIndex, ai, random) => invoke((battleSystem, attacker, index, context) => GetRecoverAmountPercentPort(battleSystem, context.attackerMove, context.attackerMoveEffect, context), state, moveIndex, ai, random);
export const shouldRecover = (state, moveIndex, ai, random) => invoke((battleSystem, attacker, index, context) => shouldRecoverPort(battleSystem, attacker, context.attackerMoveEffect, context), state, moveIndex, ai, random);

export function ScoreMovesAgainstDefender(state, moveIndex, ai, random) {
    const move = state.attacker.moves[moveIndex];
    if (!move || id(move.name) === 'NONE') return 0;
    const facts = state.attacker.facts ?? {};
    const forced = ((facts.encoredTurns ?? 0) > 0 && id(move.name) === id(facts.encoredMove))
        || (id(move.name) === id(facts.moveNoChoice) && ['CHOICEBAND', 'CHOICESCARF', 'CHOICESPECS'].includes(id(state.attacker.item)));
    const { battleSystem, ai: context } = sourceContext(state, ai, random);
    const score = (forced ? 1000 : 0)
        + BasicScoringPort(battleSystem, 0, moveIndex, context)
        + DamagingMoveScoringPort(battleSystem, 0, moveIndex, context)
        + SetupScoringPort(battleSystem, 0, moveIndex, context)
        + RecoveryScoringPort(battleSystem, 0, moveIndex, context)
        + HarassmentScoringPort(battleSystem, 0, moveIndex, context);
    ai.attackerMove = move.name;
    ai.attackerMoveEffect = effect(move.effect);
    return score;
}

export const scoreMove = ScoreMovesAgainstDefender;

function sourceMon(mon) {
    const facts = mon.facts ?? {};
    const stages = mon.statBoosts ?? mon.states ?? {};
    const moves = mon.moves ?? [];
    const maxhp = mon.maxhp ?? mon.totalHP;
    const hp = mon.hp ?? mon.currentHP;
    const moveeffect = Object.fromEntries(['disabledTurns', 'tauntTurns', 'lastResortCount', 'encoredTurns', 'healBlockTurns'].map(name => [name, facts[name] ?? 0]));
    for (const name of ['disabledMove', 'moveNoChoice', 'encoredMove']) moveeffect[name] = id(facts[name]);
    const condition = mon.status === 'slp' ? (facts.sleepCounter ?? 2) & 7
        : ({ par: 8, psn: 16, tox: 32, brn: 64 }[mon.status] ?? 0);
    return {
        ...facts, ...mon, source: mon, facts, hp, maxhp, percenthp: mon.percenthp ?? integer(100 * hp / maxhp),
        species: id(mon.species), ability: id(mon.ability), item: id(mon.item),
        sex: id(mon.sex ?? mon.gender ?? facts.sex ?? 'UNKNOWN'),
        condition, condition2: bits(facts, volatileFlags), effect_of_moves: bits(facts, moveEffectFlags),
        states: Object.fromEntries(['attack', 'defense', 'spAttack', 'spDefense', 'speed', 'accuracy', 'evasion'].map(name => [name, (stages[name] ?? 0) + 6])),
        move: Array.from({ length: 4 }, (_, index) => id(moves[index]?.name)),
        pp: Array.from({ length: 4 }, (_, index) => moves[index]?.pp ?? 0), moveeffect,
    };
}
