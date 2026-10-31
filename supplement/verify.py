"""Independent exhaustive checks of the browser's pure calculation engine.

Python's standard-library correlation and Fraction arithmetic provide separate
oracles. This does not assert browser usability or screen-reader compatibility.
"""
from fractions import Fraction
from itertools import product
from pathlib import Path
import hashlib
import json
import math
import statistics
import subprocess

ROOT = Path(__file__).resolve().parent
script = """
const m = require('./src/core.js');
const all = m.enumerate();
const comparisons = all.map((x, i) => {
  const y = all[(i * 19 + 113) % all.length];
  return {left: x.b, right: y.b, same: m.sameCorrelation(x.b, y.b)};
});
let rejected = 0;
for (const b of [[], [1,2,3], [1,2,3,4,5], [0,2,3,4], [1,2,3,8],
                 [1,2,3,2.5], [1,2,3,NaN], [1,2,3,'4']]) {
  try { m.measure(b); } catch(e) { if (e instanceof RangeError) rejected++; }
}
console.log(JSON.stringify({all: all.map(x => ({...x, display:m.correlation(x)})), comparisons, rejected}));
"""
actual = json.loads(subprocess.check_output(["node", "-e", script], cwd=ROOT, text=True))
a = (1, 2, 3, 4)
domain = list(product(range(1, 8), repeat=4))
assert len(actual['all']) == len(domain) == 2401
assert actual['rejected'] == 8
counts = dict(positive=0, negative=0, undefined=0, two_matches=0, four_matches=0)
reference = {}
for b, got in zip(domain, actual['all']):
    assert tuple(got['b']) == b
    mean = Fraction(sum(b), 4)
    da = [Fraction(x) - Fraction(5, 2) for x in a]
    db = [Fraction(x) - mean for x in b]
    cross = sum(x*y for x,y in zip(da, db))
    squares_a = sum(x*x for x in da)
    squares_b = sum(x*x for x in db)
    reference[b] = (cross, squares_a*squares_b)
    assert got['sab'] == cross and got['saa'] == squares_a and got['sbb'] == squares_b
    matches = sum(x == y for x,y in zip(a,b))
    within = sum(abs(x-y) <= 1 for x,y in zip(a,b))
    assert got['matches'] == matches and got['within'] == within
    assert got['maxDifference'] == max(abs(x-y) for x,y in zip(a,b))
    constant = len(set(b)) == 1
    if constant:
        assert got['r'] is None
        assert got['display']['value'] == 'undefined'
        counts['undefined'] += 1
    else:
        expected_r = statistics.correlation(a,b)
        assert math.isclose(got['r'], expected_r, rel_tol=1e-12, abs_tol=1e-12)
    differences = [b[i+1]-b[i] for i in range(3)]
    perfect = (1 if differences[0] > 0 else -1) if len(set(differences)) == 1 and not constant else 0
    assert got['perfect'] == perfect
    if perfect == 1: counts['positive'] += 1
    if perfect == -1: counts['negative'] += 1
    counts['two_matches'] += matches == 2
    counts['four_matches'] += matches == 4
    # Every display labelled exact has a rational value that meets the exact
    # squared-correlation equation, with the correct sign.
    if got['display']['qualifier'] == 'exact':
        displayed = Fraction(got['display']['value'].removeprefix('= ').replace('−','-'))
        assert displayed**2 * squares_a * squares_b == cross**2
        assert (displayed > 0) - (displayed < 0) == (cross > 0) - (cross < 0)
    for i,row in enumerate(got['rows']):
        assert row['da'] == da[i] and row['db'] == db[i]
        assert row['product'] == da[i]*db[i]
        assert row['aa'] == da[i]**2 and row['bb'] == db[i]**2

assert counts == dict(positive=5, negative=5, undefined=7, two_matches=216, four_matches=1)
for pair in actual['comparisons']:
    c1,d1 = reference[tuple(pair['left'])]
    c2,d2 = reference[tuple(pair['right'])]
    equal = bool(d1 and d2 and c1*c2 >= 0 and c1*c1/d1 == c2*c2/d2)
    assert pair['same'] == equal

html = (ROOT/'dist/index.html').read_text()
assert '/* STYLE */' not in html and '/* CORE */' not in html and '/* APP */' not in html
assert '<script src=' not in html
# The canonical URL is metadata, not an asset dependency. The only other link
# element is the inline empty favicon; styles and scripts remain embedded.
assert html.count('<link ') == 2 and '<link rel="icon" href="data:,">' in html
assert '<link rel="canonical" href="https://brettreynolds.ca/correlation-and-agreement/">' in html
assert 'fetch(' not in html and 'XMLHttpRequest' not in html
manifest = json.loads((ROOT/'dist/manifest.json').read_text())
assert manifest['sha256'] == hashlib.sha256(html.encode()).hexdigest()
report = {'version':manifest['version'], 'datasets_checked':2401,
          'exact_comparisons_checked':len(actual['comparisons']), 'invalid_vectors_rejected':8,
          'enumeration_counts':counts, 'standalone_html_sha256':manifest['sha256'],
          'status':'PASS'}
(ROOT/'verification.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
