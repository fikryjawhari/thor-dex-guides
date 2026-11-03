// What domcompare blanks out of every snapshot before comparing: build stamps that change on every rebuild and say
// nothing about the template. normalise() also runs inside the page (domcompare injects its source), so it is
// self-contained: no imports, no closures.
// The footer's "· built 2026-11-03" (dex.js: D.built, the extract's date) is the only stamp in <body> today; the
// shell's provenance comment is in <head>, which domcompare doesn't snapshot.
export function normalise(html) {
  return html.replace(/(\bbuilt )\d{4}-\d{2}-\d{2}(?:[T ][\d:.]+Z?)?/g, '$1<date>');
}

// Route globs (--accept-routes): `*` any characters, the rest literal, matched against the whole route.
export function routeMatcher(globs) {
  const literal = s => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  const res = globs.filter(Boolean).map(g => new RegExp('^' + g.split('*').map(literal).join('.*') + '$'));
  return route => res.some(re => re.test(route));
}
