(function () {
  'use strict';
  const M = globalThis.ReliabilityDemo;
  const $ = id => document.getElementById(id);
  // Capture the original self-contained page before any interactive mutations.
  // This also makes download work when a previously downloaded file is renamed.
  const offlineURL = URL.createObjectURL(new Blob(['<!doctype html>\n' + document.documentElement.outerHTML], {type:'text/html;charset=utf-8'}));
  $('offline-download').href = offlineURL;
  const n = M.number;
  const state = {b: [1, 2, 3, 4], undo: [], saved: [], selected: null,
    view: 'compare', path: 'correlation', steps: {correlation: 0, agreement: 0},
    within: false, invalid: new Set(), witnessPage: 0, enumeration: null};
  let announcementTimer;
  const same = (x, y) => x.every((v, i) => v === y[i]);
  const vector = b => b.join(', ');
  const agreement = count => `${count}/4 (${count * 25}%)`;
  const rText = m => { const f = M.correlation(m); return `r ${f.value} (${f.qualifier})`; };

  function announce(message) {
    clearTimeout(announcementTimer);
    announcementTimer = setTimeout(() => { $('live').textContent = message; }, 300);
  }
  function summarySpeech(m) {
    return `${M.correlation(m).speech} Exact matches ${m.matches} of 4.${state.within ? ` Within one count: ${m.within} of 4.` : ''}`;
  }

  $('count-rows').innerHTML = M.A.map((a, i) => `<tr id="row-${i}">
    <th scope="row"><button class="clip-button" data-clip="${i}" aria-label="Select clip ${i + 1}" aria-pressed="false">${i + 1}</button></th>
    <td>${a}</td><td><div class="count-editor"><button data-adjust="${i},-1" aria-label="Decrease B for clip ${i + 1}">−</button><input id="b-${i}" type="number" min="1" max="7" step="1" inputmode="numeric" value="${a}" aria-label="Observer B, clip ${i + 1} count" aria-describedby="error-${i}"><button data-adjust="${i},1" aria-label="Increase B for clip ${i + 1}">+</button></div><p id="error-${i}" class="input-error" hidden>Use a whole number from 1 to 7.</p></td>
    <td id="match-${i}"></td></tr>`).join('');
  $('preset').innerHTML = '<option value="custom" disabled>Your counts</option>' + M.presets.map((p, i) => `<option value="${i}">${p.name} (${vector(p.b)})</option>`).join('');
  $('version').textContent = M.VERSION;

  function setCounts(b, action = 'Counts changed', record = true) {
    M.validate(b);
    const before = M.measure(state.b);
    if (!same(b, state.b) && record) state.undo.push([...state.b]);
    state.b = [...b];
    state.invalid.clear();
    const after = M.measure(b);
    $('first-prompt').hidden = true;
    if (M.sameCorrelation(before.b, b) && before.matches !== after.matches) {
      $('last-change').textContent = `The correlation is unchanged. Exact matches changed from ${before.matches} to ${after.matches} of 4.`;
    } else {
      $('last-change').textContent = `${action}. ${rText(after)}; ${after.matches} of 4 pairs match exactly.`;
    }
    render();
    announce(`B is ${vector(b)}. ${summarySpeech(after)}`);
  }

  function setOneCount(i, value) {
    const b = [...state.b]; b[i] = value;
    const remainingInvalid = new Set(state.invalid); remainingInvalid.delete(i);
    const invalidText = [...remainingInvalid].map(j => [j, $('b-' + j).value]);
    setCounts(b, `Clip ${i + 1} changed`);
    state.invalid = remainingInvalid;
    invalidText.forEach(([j, text]) => { $('b-' + j).value = text; });
    render();
    if (remainingInvalid.size) announce(`Clip ${i + 1} changed to ${value}. Correct the other marked input; summaries still use its last valid count.`);
  }

  function render() {
    const m = M.measure(state.b), f = M.correlation(m);
    $('r-value').textContent = `r ${f.value}`;
    $('r-qualifier').textContent = `(${f.qualifier})`;
    $('agreement-value').textContent = agreement(m.matches);
    $('within-value').textContent = agreement(m.within);
    $('within-summary').hidden = !state.within;
    $('rule-explanation').hidden = !state.within;
    $('validity-note').hidden = state.invalid.size === 0;
    const presetIndex = M.presets.findIndex(p => same(p.b, state.b));
    $('current-vector').textContent = `B: ${vector(state.b)} · ${presetIndex < 0 ? 'Your counts' : M.presets[presetIndex].name}`;
    $('preset').value = presetIndex < 0 ? 'custom' : String(presetIndex);
    m.rows.forEach((row, i) => {
      if (!state.invalid.has(i)) $('b-' + i).value = row.b;
      $('b-' + i).setAttribute('aria-invalid', String(state.invalid.has(i)));
      $('error-' + i).hidden = !state.invalid.has(i);
      $(`row-${i}`).classList.toggle('selected-row', state.selected === i);
      $(`row-${i}`).querySelector('[data-clip]').setAttribute('aria-pressed', String(state.selected === i));
      document.querySelector(`[data-adjust="${i},-1"]`).disabled = row.b === 1;
      document.querySelector(`[data-adjust="${i},1"]`).disabled = row.b === 7;
      $(`match-${i}`).innerHTML = `<span class="match-symbol" aria-hidden="true">${row.match ? '=' : '≠'}</span><span class="match-word">${row.match ? 'match' : 'different'}</span>`;
    });
    $('undo').disabled = state.undo.length === 0;
    $('save').disabled = state.saved.length >= 2 || state.invalid.size > 0;
    $('save-limit').hidden = state.saved.length < 2;
    renderPlot(m);
    renderCalculation(m);
    renderSaved(m);
    renderTasks(m);
  }

  function renderPlot(m) {
    const lo = 58, hi = 418, unit = (hi - lo) / 8;
    const x = a => lo + a * unit, y = b => hi - b * unit;
    let grid = '';
    for (let i = 0; i <= 8; i++) grid += `<path d="M ${x(i)} ${lo} V ${hi} M ${lo} ${y(i)} H ${hi}" stroke="#d6d0c4" stroke-width="1"/><text x="${x(i)}" y="${hi + 24}" text-anchor="middle">${i}</text><text x="${lo - 16}" y="${y(i) + 5}" text-anchor="end">${i}</text>`;
    const points = m.rows.map((row, i) => `<g class="point" role="button" tabindex="0" data-clip="${i}" aria-label="Clip ${i + 1}: A ${row.a}, B ${row.b}, ${row.match ? 'exact match' : 'different counts'}" aria-pressed="${state.selected === i}">
      ${state.selected === i ? `<circle cx="${x(row.a)}" cy="${y(row.b)}" r="22" fill="none" stroke="#6b1f2a" stroke-width="3"/>` : ''}
      ${row.match ? `<circle cx="${x(row.a)}" cy="${y(row.b)}" r="18" fill="#fbf9f4" stroke="#1c1917" stroke-width="2"/>` : ''}
      <circle cx="${x(row.a)}" cy="${y(row.b)}" r="13" fill="#1c1917"/><text x="${x(row.a)}" y="${y(row.b) + 5}" fill="white" font-weight="650" text-anchor="middle">${i + 1}</text></g>`).join('');
    $('plot').innerHTML = `<svg viewBox="0 0 480 480" role="group" aria-labelledby="plot-title plot-desc" xmlns="http://www.w3.org/2000/svg"><title id="plot-title">Counts from observers A and B</title><desc id="plot-desc">${m.rows.map(row => `Clip ${row.clip}: A ${row.a}, B ${row.b}, ${row.match ? 'exact match' : 'different'}.`).join(' ')} The dashed line is A equals B. Both axes run from zero to eight; counts may be one to seven.</desc><g font-family="system-ui,sans-serif" font-size="14" fill="#57534e"><text x="${lo}" y="28">Observer B's count</text>${grid}<path d="M ${lo} ${lo} V ${hi} H ${hi}" stroke="#8a8378" fill="none" stroke-width="2"/><path d="M ${lo} ${hi} L ${hi} ${lo}" stroke="#8a8378" stroke-width="2" stroke-dasharray="7 5"/><text x="${hi - 8}" y="${hi - 14}" text-anchor="end">Dashed line: A = B</text><text x="238" y="472" text-anchor="middle">Observer A's count</text>${points}</g></svg>`;
  }

  const correlationSteps = ['Find the means', 'Subtract each mean', 'Multiply the deviations', 'Square and sum the deviations', 'Normalize with all three sums'];
  const agreementSteps = ['Compare the counts', 'Mark each exact match', 'Count the matches'];
  function renderCalculation(m) {
    const path = state.path, step = state.steps[path];
    const titles = path === 'correlation' ? correlationSteps : agreementSteps;
    $('step-heading').textContent = `Step ${step + 1} of ${titles.length} · ${titles[step]}`;
    $('previous').disabled = step === 0;
    $('next').disabled = step === titles.length - 1;
    $('next').textContent = step === titles.length - 1 ? 'Calculation complete' : 'Next';
    const final = step === titles.length - 1;
    let headings, cells, result, intro;
    if (path === 'correlation') {
      intro = `Means: A = ${n(m.meanA)} and B = ${n(m.meanB)}. Select a clip to follow its contribution.`;
      if (step === 0) { headings = ['A', 'B']; cells = r => [r.a, r.b]; result = `Mean A = 10 ÷ 4 = 2.5. Mean B = ${m.sumB} ÷ 4 = ${n(m.meanB)}.`; }
      if (step === 1) { headings = [`A − ${n(m.meanA)}`, `B − ${n(m.meanB)}`]; cells = r => [r.da, r.db]; result = 'Each count is now expressed as a deviation from its own observer’s mean.'; }
      if (step === 2) { headings = [`A − ${n(m.meanA)}`, `B − ${n(m.meanB)}`, 'Product']; cells = r => [r.da, r.db, r.product]; result = `Sum of products = ${n(m.sab)}. Next, calculate both sums of squared deviations. The final r uses all three sums.`; }
      if (step === 3) { headings = ['A deviation²', 'B deviation²']; cells = r => [r.aa, r.bb]; result = `Sum of A squares = ${n(m.saa)}. Sum of B squares = ${n(m.sbb)}. Sum of cross-products = ${n(m.sab)}.`; }
      if (final) {
        intro = 'The three sums now become one coefficient. Individual clip terms no longer appear separately.';
        const f = M.correlation(m);
        result = m.r === null ? `r = ${n(m.sab)} ÷ √(${n(m.saa)} × 0). Division by zero is undefined because B's counts do not vary.` : `r = ${n(m.sab)} ÷ √(${n(m.saa)} × ${n(m.sbb)}) ${f.value} (${f.qualifier}).`;
      }
    } else {
      intro = 'Compare each pair directly. A match contributes 1; any mismatch contributes 0.';
      if (step === 0) { headings = ['A', 'B', 'B − A']; cells = r => [r.a, r.b, r.difference]; result = 'The difference tells us whether the two counts are equal.'; }
      if (step === 1) { headings = ['A', 'B', 'Equal? (1/0)']; cells = r => [r.a, r.b, r.match ? '1 · match' : '0 · different']; result = 'Each pair becomes an indicator. Differences of one and three both contribute 0 under exact agreement.'; }
      if (final) {
        intro = m.matches === 4 ? 'All four pairs match, so B is identical to A.' : m.matches === 0 ? 'All four pairs differ. The total does not tell us the sizes of those differences.' : 'The indicators become a total. This total does not identify which clips matched or the mismatch sizes.';
        result = `Exact agreement = 100 × (${m.rows.map(r => r.match ? 1 : 0).join(' + ')}) ÷ 4 = ${m.matches * 25}%. There are ${m.matches} exact matches out of 4.`;
      }
      if (state.within) result += ` With the additional within-one rule, the indicators are ${m.rows.map(r => r.within ? 1 : 0).join(', ')}, giving ${agreement(m.within)}.`;
    }
    $('step-intro').textContent = intro;
    if (final) {
      $('ledger').innerHTML = path === 'correlation' ? `<table><caption>Totals across all four clips</caption><tbody><tr><th scope="row">Sum of cross-products</th><td>${n(m.sab)}</td></tr><tr><th scope="row">Sum of A squares</th><td>${n(m.saa)}</td></tr><tr><th scope="row">Sum of B squares</th><td>${n(m.sbb)}</td></tr></tbody></table>` : `<table><caption>Totals across all four clips</caption><tbody><tr><th scope="row">Exact matches</th><td>${m.matches} of 4</td></tr>${state.within ? `<tr><th scope="row">Within one count</th><td>${m.within} of 4</td></tr>` : ''}</tbody></table>`;
      $('contribution').innerHTML = '<h3>One summary of four pairs</h3><p>Use Work backwards to see whether a summary identifies one example or permits several.</p>';
    } else {
      $('ledger').innerHTML = `<table><caption class="sr-only">${titles[step]} for four clips</caption><thead><tr><th scope="col">Clip</th>${headings.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${m.rows.map((row, i) => `<tr class="${state.selected === i ? 'selected-row' : ''}"><th scope="row"><button class="clip-button" data-clip="${i}" aria-label="Select clip ${i + 1} in calculation" aria-pressed="${state.selected === i}">${i + 1}</button></th>${cells(row).map(v => `<td>${typeof v === 'number' ? n(v) : v}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
      if (state.selected === null) $('contribution').innerHTML = '<h3>Follow one clip</h3><p>Select a numbered row or point. Its current contribution will appear here.</p>';
      else {
        const r = m.rows[state.selected];
        let explanation;
        if (path === 'agreement') explanation = `${r.a} ${r.match ? '=' : '≠'} ${r.b}: ${r.match ? '1 (match)' : '0 (different)'}. The difference B − A is ${n(r.difference)}.`;
        else if (step === 0) explanation = `A contributes ${r.a} to a total of 10. B contributes ${r.b} to a total of ${m.sumB}. Each total is divided by 4.`;
        else if (step === 1) explanation = `${r.a} − ${n(m.meanA)} = ${n(r.da)}; ${r.b} − ${n(m.meanB)} = ${n(r.db)}.`;
        else if (step === 2) explanation = `(${n(r.da)}) × (${n(r.db)}) = ${n(r.product)}.`;
        else explanation = `(${n(r.da)})² = ${n(r.aa)}; (${n(r.db)})² = ${n(r.bb)}.`;
        $('contribution').innerHTML = `<h3>Selected: clip ${r.clip}</h3><p class="arithmetic">${explanation}</p><p>Each term still refers to a clip here. In the final sum, these terms no longer appear separately.</p>`;
      }
    }
    $('formula-result').textContent = result;
  }

  function renderSaved(current) {
    $('saved-section').hidden = state.saved.length === 0;
    if (!state.saved.length) { $('saved-table').replaceChildren(); $('saved-comparison').textContent = ''; return; }
    const metrics = [current, ...state.saved.map(M.measure)];
    const row = (label, fn) => `<tr><th scope="row">${label}</th>${metrics.map(m => `<td>${fn(m)}</td>`).join('')}</tr>`;
    $('saved-table').innerHTML = `<table><caption class="sr-only">Comparison of current counts with fixed saved snapshots</caption><thead><tr><th scope="col">Quantity</th><th scope="col">Current<span class="saved-label">Changes as you edit</span></th>${state.saved.map(b => `<th scope="col">Saved (${vector(b)})<span class="saved-label">Fixed snapshot</span></th>`).join('')}</tr></thead><tbody>${row('B counts', m => vector(m.b))}${row('Pearson correlation', rText)}${row('Exact matches', m => agreement(m.matches))}${state.within ? row('Within one count', m => agreement(m.within)) : ''}${row('Largest |B − A|', m => m.maxDifference)}<tr><th scope="row">Actions</th><td>Editing above</td>${state.saved.map((b, i) => `<td><div class="actions"><button data-restore="${i}" aria-label="Load saved ${vector(b)} into current">Load into current</button><button data-remove="${i}" aria-label="Remove saved ${vector(b)}">Remove</button></div></td>`).join('')}</tr></tbody></table>`;
    const messages = state.saved.map(b => {
      if (same(b, state.b)) return `Saved (${vector(b)}) currently has the same counts.`;
      if (M.sameCorrelation(b, state.b)) return `Saved (${vector(b)}) has exactly the same r with different counts.`;
      const a = M.measure(b), c = current;
      if (a.r !== null && c.r !== null && a.r.toFixed(3) === c.r.toFixed(3)) return `Saved (${vector(b)}) rounds to the same displayed r, but the exact values differ.`;
      return `Saved (${vector(b)}) has ${a.matches === c.matches ? 'the same' : 'a different'} exact match count.`;
    });
    $('saved-comparison').textContent = messages.join(' ');
  }

  function renderTasks(m) {
    const one = m.perfect === 1 && m.matches === 0;
    $('task-one').textContent = `${one ? '● Meets both conditions.' : '○ Keep exploring.'} Current: ${rText(m)}; ${m.matches} exact matches.`;
    const base = state.saved.map(M.measure).find(s => s.matches === m.matches && s.maxDifference < m.maxDifference);
    $('task-two').textContent = base ? `● Compared with saved (${vector(base.b)}), exact matches stay at ${m.matches}, and the largest difference rises from ${base.maxDifference} to ${m.maxDifference}.` : '○ Save a baseline, then preserve its match count while increasing the largest difference.';
    const saved = state.saved.map(M.measure);
    const positive = saved.some(s => s.matches === 2 && s.c > 0 && s.qb > 0);
    const negative = saved.some(s => s.matches === 2 && s.c < 0 && s.qb > 0);
    $('task-three').textContent = `${positive && negative ? '● Both saved examples found.' : '○ Keep exploring.'} Two matches with positive r: ${positive ? 'saved' : 'not yet saved'}. Two matches with negative r: ${negative ? 'saved' : 'not yet saved'}.`;
  }

  function renderWitnesses() {
    if (!state.enumeration) state.enumeration = M.enumerate();
    const all = state.enumeration;
    const filters = {positive: m => m.perfect === 1, negative: m => m.perfect === -1,
      two: m => m.matches === 2, undefined: m => m.r === null, four: m => m.matches === 4};
    $('enumeration-totals').textContent = `${all.length.toLocaleString('en')} combinations: ${all.filter(filters.positive).length} have r = 1; ${all.filter(filters.negative).length} have r = −1; ${all.filter(filters.undefined).length} have undefined r; ${all.filter(filters.two).length} have exactly two matches.`;
    const matches = all.filter(filters[$('witness-filter').value]);
    const pageSize = 6, start = state.witnessPage * pageSize;
    $('witness-count').textContent = `${matches.length} compatible examples. Showing ${start + 1}–${Math.min(start + pageSize, matches.length)} in numerical order.`;
    $('witnesses').innerHTML = matches.slice(start, start + pageSize).map(m => `<div class="witness"><span>B: ${vector(m.b)}<br>${rText(m)} · ${m.matches} exact ${m.matches === 1 ? 'match' : 'matches'}</span><button data-load="${m.b.join(',')}" aria-label="Load compatible B ${vector(m.b)}">Load</button></div>`).join('');
    $('witness-previous').disabled = start === 0;
    $('witness-next').disabled = start + pageSize >= matches.length;
  }

  function setView(view, focus = false) {
    state.view = view;
    for (const name of ['compare', 'calculation', 'backwards']) {
      $(`tab-${name}`).setAttribute('aria-selected', String(name === view));
      $(`tab-${name}`).tabIndex = name === view ? 0 : -1;
      $(`view-${name}`).hidden = name !== view;
    }
    if (focus) { $(`view-${view}`).focus({preventScroll: true}); $(`view-${view}`).scrollIntoView({block:'start'}); }
  }

  // Keep the actual input nodes in place so editing, focus and assistive
  // technology do not lose their position when other displays are refreshed.
  for (let i = 0; i < 4; i++) {
    $('b-' + i).addEventListener('input', event => {
      const raw = event.target.value, value = Number(raw);
      if (raw.trim() === '' || !Number.isInteger(value) || value < 1 || value > 7) {
        state.invalid.add(i); render(); announce(`Clip ${i + 1}: use a whole number from 1 to 7. Summaries show the last valid counts.`);
      } else {
        setOneCount(i, value);
      }
    });
  }

  document.addEventListener('click', event => {
    const control = event.target.closest('button,[data-clip]');
    if (!control || control.disabled) return;
    if (control.dataset.adjust) {
      const [i, delta] = control.dataset.adjust.split(',').map(Number);
      setOneCount(i, state.b[i] + delta);
    } else if (control.dataset.clip !== undefined) {
      const i = Number(control.dataset.clip);
      const inPlot = Boolean(control.closest('svg')), inLedger = Boolean(control.closest('#ledger'));
      state.selected = state.selected === i ? null : i;
      render();
      if (inPlot) $('plot').querySelector(`[data-clip="${i}"]`).focus({preventScroll:true});
      if (inLedger) $('ledger').querySelector(`[data-clip="${i}"]`)?.focus({preventScroll:true});
      announce(state.selected === null ? 'Clip selection cleared.' : `Clip ${i + 1} selected. A ${M.A[i]}, B ${state.b[i]}.`);
    } else if (control.dataset.view) setView(control.dataset.view);
    else if (control.dataset.go) setView(control.dataset.go, true);
    else if (control.dataset.path) {
      state.path = control.dataset.path;
      for (const path of ['correlation', 'agreement']) $('path-' + path).setAttribute('aria-pressed', String(path === state.path));
      renderCalculation(M.measure(state.b));
      announce($('step-heading').textContent);
    } else if (control.dataset.load) setCounts(control.dataset.load.split(',').map(Number), 'Example loaded');
    else if (control.dataset.restore !== undefined) {
      const i = Number(control.dataset.restore);
      setCounts(state.saved[i], 'Saved example loaded');
      $('saved-table').querySelector(`[data-restore="${i}"]`).focus({preventScroll:true});
    }
    else if (control.dataset.remove !== undefined) {
      const index = Number(control.dataset.remove), removed = state.saved[index];
      state.saved.splice(index, 1); render();
      const next = $('saved-table').querySelector('[data-remove]');
      (next || $('save')).focus();
      announce(`Removed saved (${vector(removed)}).`);
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && state.selected !== null) {
      const selected = state.selected;
      const restore = event.target.closest('svg,#ledger');
      state.selected = null; render();
      if (restore) $(`row-${selected}`).querySelector('[data-clip]').focus({preventScroll:true});
      announce('Clip selection cleared.');
    }
    const target = event.target;
    if (target.matches('g[data-clip]') && ['Enter', ' '].includes(event.key)) { event.preventDefault(); target.dispatchEvent(new MouseEvent('click', {bubbles:true})); }
    if (target.getAttribute('role') === 'tab' && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const views = ['compare', 'calculation', 'backwards'];
      let i = views.indexOf(state.view);
      i = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (i + (event.key === 'ArrowRight' ? 1 : 2)) % 3;
      setView(views[i]); $('tab-' + views[i]).focus();
    }
  });
  $('shift').addEventListener('click', () => {
    if (state.invalid.size) { $('last-change').textContent = 'Correct the marked input before adding 1 to every count.'; announce($('last-change').textContent); return; }
    if (state.b.some(x => x === 7)) { $('last-change').textContent = 'Adding 1 would exceed the teaching range of 1–7. Counts were left as they were.'; announce($('last-change').textContent); return; }
    setCounts(state.b.map(x => x + 1), 'Added 1 to every B count');
  });
  $('reset').addEventListener('click', () => setCounts([...M.A], 'Counts reset'));
  $('undo').addEventListener('click', () => { if (state.undo.length) setCounts(state.undo.pop(), 'Count change undone', false); });
  $('preset').addEventListener('change', () => { const p = M.presets[Number($('preset').value)]; if (p) setCounts(p.b, p.name); });
  $('save').addEventListener('click', () => {
    if (state.saved.length >= 2 || state.invalid.size) return;
    state.saved.push([...state.b]); render();
    if (state.saved.length === 2) (state.undo.length ? $('undo') : $('reset')).focus({preventScroll:true});
    announce(`Saved (${vector(state.b)}). This snapshot will stay unchanged as you edit.`);
  });
  $('within-toggle').addEventListener('change', () => { state.within = $('within-toggle').checked; render(); announce(state.within ? `Added within-one agreement. ${summarySpeech(M.measure(state.b))}` : 'Within-one agreement hidden. Exact agreement remains.'); });
  $('previous').addEventListener('click', () => { state.steps[state.path]--; renderCalculation(M.measure(state.b)); announce($('step-heading').textContent); });
  $('next').addEventListener('click', () => { state.steps[state.path]++; renderCalculation(M.measure(state.b)); announce($('step-heading').textContent); });
  $('enumeration').addEventListener('toggle', () => { if ($('enumeration').open) renderWitnesses(); });
  $('witness-filter').addEventListener('change', () => { state.witnessPage = 0; renderWitnesses(); announce($('witness-count').textContent); });
  $('witness-previous').addEventListener('click', () => { state.witnessPage--; renderWitnesses(); announce($('witness-count').textContent); });
  $('witness-next').addEventListener('click', () => { state.witnessPage++; renderWitnesses(); announce($('witness-count').textContent); });
  render();
  new ResizeObserver(entries => {
    document.documentElement.style.setProperty('--summary-height', `${entries[0].target.offsetHeight}px`);
  }).observe($('summary'));
})();
