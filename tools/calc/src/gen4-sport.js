import {getItemBoostType} from '@smogon/calc/src/items';

export function sportPowerDPP(context) {
  const {atk, def, move, field} = context;
  let power = context.state.basePower;
  const scale = modifier => { power = Math.floor(power * modifier); };
  if (field.attackerSide.isCharge && move.hasType('Electric')) scale(2);
  if (field.attackerSide.isHelpingHand) scale(1.5);
  if (atk.hasAbility('Technician') && power <= 60) scale(1.5);
  const physical = move.category === 'Physical';
  if ((atk.hasItem('Muscle Band') && physical) || (atk.hasItem('Wise Glasses') && !physical)) scale(1.1);
  else if (move.hasType(getItemBoostType(atk.item))
    || atk.hasItem('Adamant Orb') && atk.named('Dialga') && move.hasType('Steel', 'Dragon')
    || atk.hasItem('Lustrous Orb') && atk.named('Palkia') && move.hasType('Water', 'Dragon')
    || atk.hasItem('Griseous Orb') && atk.named('Giratina-Origin') && move.hasType('Ghost', 'Dragon')
    || move.named('Struggle') && getItemBoostType(atk.item) === 'Normal') scale(1.2);
  if (def.hasAbility('Thick Fat') && move.hasType('Fire', 'Ice')) scale(0.5);
  scale(0.5);
  if (atk.curHP() <= atk.maxHP() / 3 && (
    atk.hasAbility('Overgrow') && move.hasType('Grass') || atk.hasAbility('Blaze') && move.hasType('Fire')
    || atk.hasAbility('Torrent') && move.hasType('Water') || atk.hasAbility('Swarm') && move.hasType('Bug'))) scale(1.5);
  if (def.hasAbility('Heatproof') && move.hasType('Fire')) scale(0.5);
  else if (def.hasAbility('Dry Skin') && move.hasType('Fire')) scale(1.25);
  if (atk.hasAbility('Rivalry') && ![atk.gender, def.gender].includes('N')) scale(atk.gender === def.gender ? 1.25 : 0.75);
  if (atk.hasAbility('Reckless') && (move.recoil || move.hasCrashDamage) || atk.hasAbility('Iron Fist') && move.flags.punch) scale(1.2);
  return power;
}
