export function assumedTrainerSet(data, supplied, level) {
  if (supplied.m?.length) return {...supplied, m:supplied.m.slice()};
  const species = data.P.find(entry => String(entry.id) === String(supplied.id));
  if (!species) throw new Error(`Unknown Unbound species ${supplied.id}`);
  if (!Number.isFinite(level) || level < 1 || level > 100) throw new Error('Assumed moves need a resolved level');
  const learned = [];
  const rows = (species.lv || []).map(([at,move],order) => ({at,move,order})).filter(row => row.at <= level)
    .sort((left,right) => left.at-right.at || left.order-right.order);
  for (const {move} of rows) {
    if (!data.MV[move]) throw new Error(`Unknown Unbound level-up move ${move}`);
    const previous = learned.indexOf(move);
    if (previous >= 0) learned.splice(previous,1);
    learned.push(move);
  }
  return {...supplied, l:level, m:learned.slice(-4), na:'Hardy', iv:Array(6).fill(31), ev:Array(6).fill(0),
    mGuess:true, naGuess:true, ivGuess:true, evGuess:true};
}
