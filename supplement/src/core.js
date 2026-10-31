/* Pure calculations for the four-clip teaching domain. No empirical data. */
(function (root) {
  'use strict';
  const A = Object.freeze([1, 2, 3, 4]);
  const VERSION = '1.0.0';
  const presets = Object.freeze([
    {name: 'Same counts', b: [1, 2, 3, 4]},
    {name: 'B is one higher', b: [2, 3, 4, 5]},
    {name: 'Reverse order', b: [4, 3, 2, 1]},
    {name: 'Stretch B', b: [1, 3, 5, 7]},
    {name: 'Constant B', b: [2, 2, 2, 2]},
    {name: 'Three matches, difference 1', b: [1, 2, 3, 5]},
    {name: 'Three matches, difference 3', b: [1, 2, 3, 7]},
    {name: 'Two matches, positive r', b: [1, 2, 4, 3]},
    {name: 'Two matches, negative r', b: [4, 2, 3, 1]}
  ].map(p => Object.freeze({name: p.name, b: Object.freeze(p.b)})));

  function validate(b) {
    if (!Array.isArray(b) || b.length !== 4 ||
        !b.every(v => Number.isInteger(v) && v >= 1 && v <= 7)) {
      throw new RangeError('Use four whole-number counts from 1 to 7.');
    }
  }

  function measure(b) {
    validate(b);
    const sumB = b.reduce((s, x) => s + x, 0);
    const meanA = 2.5, meanB = sumB / 4;
    const rows = A.map((a, i) => {
      const da4 = 4 * a - 10, db4 = 4 * b[i] - sumB;
      return {clip: i + 1, a, b: b[i], da: da4 / 4, db: db4 / 4,
        product: da4 * db4 / 16, aa: da4 * da4 / 16,
        bb: db4 * db4 / 16, difference: b[i] - a,
        match: a === b[i], within: Math.abs(b[i] - a) <= 1,
        da4, db4};
    });
    // Four times each centred value is an integer. All exact target checks
    // use these integer sums, never a tolerance or rounded correlation.
    const c = rows.reduce((s, x) => s + x.da4 * x.db4, 0);
    const qa = rows.reduce((s, x) => s + x.da4 * x.da4, 0);
    const qb = rows.reduce((s, x) => s + x.db4 * x.db4, 0);
    const r = qb === 0 ? null : c / Math.sqrt(qa * qb);
    return {b: [...b], rows, meanA, meanB, sumB, c, qa, qb, r,
      sab: c / 16, saa: qa / 16, sbb: qb / 16,
      perfect: qb > 0 && c * c === qa * qb ? Math.sign(c) : 0,
      matches: rows.filter(x => x.match).length,
      within: rows.filter(x => x.within).length,
      maxDifference: Math.max(...rows.map(x => Math.abs(x.difference)))};
  }

  function sameCorrelation(left, right) {
    const x = measure(left), y = measure(right);
    if (x.r === null || y.r === null) return false;
    return Math.sign(x.c) === Math.sign(y.c) && x.c * x.c * y.qb === y.c * y.c * x.qb;
  }

  function gcd(a, b) { return b ? gcd(b, a % b) : a; }
  function number(x) { return String(Object.is(x, -0) ? 0 : x).replace('-', '−'); }
  function correlation(m) {
    if (m.r === null) return {value: 'undefined', qualifier: "B's counts do not vary", speech: "Correlation is undefined because B's counts do not vary."};
    const denominator = Math.sqrt(m.qa * m.qb);
    if (Number.isInteger(denominator)) {
      const divisor = gcd(Math.abs(m.c), denominator);
      let d = denominator / divisor;
      while (d % 2 === 0) d /= 2;
      while (d % 5 === 0) d /= 5;
      const value = d === 1 ? number(m.r) : `${number(m.c / divisor)}/${denominator / divisor}`;
      return {value: `= ${value}`, qualifier: 'exact', speech: `Correlation equals ${value}, exactly.`};
    }
    const value = m.r.toFixed(3).replace('-', '−');
    return {value: `≈ ${value}`, qualifier: 'rounded', speech: `Correlation is approximately ${value}, rounded.`};
  }

  function enumerate() {
    const all = [];
    for (let a = 1; a <= 7; a++) for (let b = 1; b <= 7; b++)
      for (let c = 1; c <= 7; c++) for (let d = 1; d <= 7; d++) all.push(measure([a, b, c, d]));
    return all;
  }

  const api = Object.freeze({A, VERSION, presets, validate, measure, sameCorrelation, correlation, number, enumerate});
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ReliabilityDemo = api;
})(globalThis);
