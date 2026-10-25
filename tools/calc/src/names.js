// Guide species names to stock engine names (shared by the adapter and the oracle harness).

export function speciesName(name) {
  // Accents and gender signs would vanish in the engine's ids (Nidoran-F / -M must stay apart; Flabebe is stock's).
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace('♀', '-F').replace('♂', '-M')
    .replace(/^Mega (.+?)(?: ([XY]))?$/, (_, base, suffix) => `${base}-Mega${suffix ? '-' + suffix : ''}`)
    .replace(/^Primal (.+)$/, '$1-Primal');
}

// Stock names to try for a guide form's weight when its own name is not a stock species ("Alolan Raichu",
// "Raichu Alolan", "Heat Rotom", "Shellos (East Sea)", "Pyroar Female", "Mega Absol Z"): most specific first, then the
// base species (cosmetic forms and a hack's own Megas take its weight unless the profile sets `weightkg`).
export function weightNames(name) {
  const regions = {Alolan: 'Alola', Galarian: 'Galar', Hisuian: 'Hisui', Paldean: 'Paldea'};
  const plain = name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace('♀', '-F').replace('♂', '-M');
  const paren = plain.match(/^(.*?) \((.+)\)$/);
  const forms = paren ? paren[2].split(/,\s*/) : [];
  let region = '', gender = '';
  const words = (paren ? paren[1] : plain).split(' ').filter(word => {
    if (regions[word]) region = regions[word];
    else if (word === 'Female' || word === 'Male') gender = word[0];
    else return true;
    return false;
  });
  const join = (...parts) => parts.filter(Boolean).join('-');
  const tail = [region, ...forms, gender];
  const mega = ['Mega', 'Primal'].includes(words[0]);
  const base = mega ? words[1] : words[0];
  return [join(words.join(' '), ...tail), join(words.slice(1).join(' '), words[0], ...tail), join(...words, ...tail),
    mega ? join(base, words[0], region) : '', join(words.join(' '), region, gender), join(base, region, gender),
    plain.split('-').reverse().join('-'), words.join(' '), base].filter(Boolean);
}
