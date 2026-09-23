// Interactive explainers. Every number generated here is ILLUSTRATIVE (hand-made or simulated)
// and is labelled as such in the page; reported values live in data/claims.json and are rendered by the build.
const SVGNS = 'http://www.w3.org/2000/svg';
const $ = (s, r = document) => r.querySelector(s);
function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) { if (v == null) continue; if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v; else e.setAttribute(k, v); }
  kids.flat().forEach(k => k != null && e.append(k instanceof Node ? k : document.createTextNode(String(k))));
  return e;
}
function svg(tag, attrs = {}, ...kids) {
  const e = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) e.setAttribute(k, v);
  kids.flat().forEach(k => k != null && e.append(k instanceof Node ? k : document.createTextNode(String(k))));
  return e;
}
const pct = (v, d = 0) => (v * 100).toFixed(d) + '%';

/** Line chart with hairline grid, one y-axis, legend, direct end labels, crosshair tooltip and keyboard access. */
function lineChart(box, {series, xLabel, yLabel, xDomain = [0, 1], yDomain = [0, 1], xFmt = v => v.toFixed(1), yFmt = v => pct(v), ref = null, marker = null, height = 260, desc, xTicks = 5}) {
  box.replaceChildren();
  const W = 560, H = height, m = {l: 46, r: 96, t: 14, b: 40};
  const x = v => m.l + (v - xDomain[0]) / (xDomain[1] - xDomain[0]) * (W - m.l - m.r);
  const y = v => H - m.b - (v - yDomain[0]) / (yDomain[1] - yDomain[0]) * (H - m.t - m.b);
  const root = svg('svg', {viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': desc || yLabel});
  for (let i = 0; i <= 4; i++) {
    const v = yDomain[0] + (yDomain[1] - yDomain[0]) * i / 4;
    root.append(svg('line', {x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), class: i ? 'grid' : 'axis'}), svg('text', {x: m.l - 8, y: y(v) + 4, 'text-anchor': 'end', class: 'tick'}, yFmt(v)));
  }
  for (let i = 0; i <= xTicks; i++) { const v = xDomain[0] + (xDomain[1] - xDomain[0]) * i / xTicks; root.append(svg('text', {x: x(v), y: H - m.b + 18, 'text-anchor': 'middle', class: 'tick'}, xFmt(v))); }
  root.append(svg('text', {x: (m.l + W - m.r) / 2, y: H - 4, 'text-anchor': 'middle', class: 'tick'}, xLabel));
  if (ref) root.append(svg('line', {x1: x(ref[0][0]), y1: y(ref[0][1]), x2: x(ref[1][0]), y2: y(ref[1][1]), class: 'ref'}));
  if (marker != null) root.append(svg('line', {x1: x(marker), x2: x(marker), y1: m.t, y2: H - m.b, class: 'axis', 'stroke-width': 1.5}));
  series.forEach((s, i) => {
    const d = s.points.map((p, j) => `${j ? 'L' : 'M'}${x(p[0]).toFixed(1)} ${y(p[1]).toFixed(1)}`).join('');
    root.append(svg('path', {d, class: `l${s.slot}`}));
    if (s.dots) s.points.forEach(p => root.append(svg('circle', {cx: x(p[0]), cy: y(p[1]), r: 4.5, class: `d${s.slot}`})));
    const last = s.points[s.points.length - 1];
    root.append(svg('text', {x: x(last[0]) + 8, y: y(last[1]) + 4 + (s.labelDy || 0), class: 'lab'}, s.name));
  });
  // crosshair + tooltip
  const cross = svg('line', {y1: m.t, y2: H - m.b, class: 'axis', visibility: 'hidden'});
  const hit = svg('rect', {x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, fill: 'transparent', tabindex: 0, 'aria-label': 'Chart values: use left and right arrow keys'});
  root.append(cross, hit);
  const tip = el('div', {class: 'tooltip', hidden: ''});
  box.append(root, tip);
  const xs = series[0].points.map(p => p[0]);
  let idx = Math.floor(xs.length / 2);
  function show(i) {
    idx = Math.max(0, Math.min(xs.length - 1, i));
    const xv = xs[idx], px = x(xv);
    cross.setAttribute('x1', px); cross.setAttribute('x2', px); cross.setAttribute('visibility', 'visible');
    tip.replaceChildren(el('div', {text: `${xLabel}: ${xFmt(xv)}`}), ...series.map(s => el('div', {}, el('b', {text: yFmt(s.points[idx][1]) + ' '}), s.name)));
    tip.hidden = false;
    const r = root.getBoundingClientRect(), scale = r.width / W;
    tip.style.left = Math.min(r.width - 170, Math.max(0, px * scale + 10)) + 'px'; tip.style.top = (m.t * scale) + 'px';
  }
  const hide = () => { tip.hidden = true; cross.setAttribute('visibility', 'hidden'); };
  hit.addEventListener('pointermove', e => { const r = root.getBoundingClientRect(); const px = (e.clientX - r.left) * W / r.width; let best = 0; xs.forEach((v, i) => { if (Math.abs(x(v) - px) < Math.abs(x(xs[best]) - px)) best = i; }); show(best); });
  hit.addEventListener('pointerleave', hide); hit.addEventListener('blur', hide); hit.addEventListener('focus', () => show(idx));
  hit.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { e.preventDefault(); show(idx + 1); } if (e.key === 'ArrowLeft') { e.preventDefault(); show(idx - 1); } });
  return {x, y};
}

function legend(items) {
  return el('div', {class: 'chart-legend'}, items.map(([name, slot]) => el('span', {}, (() => { const i = el('i'); i.style.setProperty('--c', `var(--s${slot})`); return i; })(), name)));
}
function tableView(caption, head, rows) {
  const t = el('table', {class: 'viz-table', hidden: ''}, el('caption', {class: 'sr-only', text: caption}),
    el('thead', {}, el('tr', {}, head.map(hd => el('th', {scope: 'col', text: hd})))), el('tbody', {}, rows.map(r => el('tr', {}, r.map(c => el('td', {text: c}))))));
  const b = el('button', {type: 'button', class: 'table-toggle', 'aria-pressed': 'false', text: 'Table view'});
  return {table: t, button: b, bind(chart) { b.addEventListener('click', () => { const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(on)); t.hidden = !on; chart.hidden = on; b.textContent = on ? 'Chart view' : 'Table view'; }); }};
}

// ------------------------------------------------------------------ 01 names vs rubrics
function bindingDemo(root) {
  const opts = [...root.querySelectorAll('.bd-opt')];
  const explain = root.querySelector('[data-bd-explain]');
  const R = ['The request does <b>not</b> meet the refund policy.', 'The request <b>meets</b> the refund policy.'];
  const states = {
    aligned: {names: ['no', 'yes'], rub: [0, 1], text: 'Names and rubrics as the task ships them.'},
    order: {names: ['yes', 'no'], rub: [1, 0], text: 'Same pairs, listed in the other order. Each name still sits in front of its own rubric — this tests position, not binding.'},
    rebind: {names: ['yes', 'no'], rub: [0, 1], text: 'Same order, same rubric text — but “yes” now labels the rubric that means refuse. A model that follows the name instead of the rubric flips.'},
    neutral: {names: ['A', 'B'], rub: [0, 1], text: 'Neutral identifiers carry no polarity; the rubric must carry the meaning.'},
    random: {names: ['qzv', 'kxt'], rub: [0, 1], text: 'Opaque strings: in the study, flips fell back to the neutral regime without costing accuracy.'},
  };
  root.querySelectorAll('[data-bd]').forEach(btn => btn.addEventListener('click', () => {
    root.querySelectorAll('[data-bd]').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    const s = states[btn.dataset.bd];
    opts.forEach((o, i) => {
      o.querySelector('.bd-name').textContent = s.names[i];
      o.querySelector('.bd-rubric').innerHTML = R[s.rub[i]]; // static strings defined above, not data
      o.classList.toggle('is-changed', btn.dataset.bd !== 'aligned' && (s.names[i] !== states.aligned.names[i] || s.rub[i] !== i));
    });
    explain.textContent = s.text;
  }));
}

// ------------------------------------------------------------------ 02 confidence summaries
function confidenceDemo(root) {
  const names = ['refund', 'exchange', 'other'];
  let p = [0.62, 0.28, 0.10];
  const bars = el('div', {class: 'bars', 'aria-hidden': 'true'});
  const labels = el('div', {class: 'bar-labels', 'aria-hidden': 'true'}, names.map(n => el('span', {text: n})));
  const sliders = el('div', {class: 'sliders'});
  const tiles = el('div', {class: 'stat-tiles'});
  tiles.style.gridTemplateColumns = 'repeat(2,minmax(0,1fr))';
  const presets = el('div', {class: 'seg', role: 'group', 'aria-label': 'Example distributions'});
  const live = el('p', {class: 'sr-only', 'aria-live': 'polite'});
  root.replaceChildren(bars, labels, sliders, presets, tiles, live, el('p', {class: 'demo-note', text: 'Illustrative. The last tile reproduces the formula shown in the vendor documentation’s interactive demo, which the documentation labels as how that demo computes confidence — not as the production implementation.'}));
  const inputs = names.map((n, i) => {
    const input = el('input', {type: 'range', min: 0, max: 100, step: 1, id: `conf-${n}`, 'aria-label': `Probability of ${n}`});
    const out = el('output', {for: `conf-${n}`});
    sliders.append(el('div', {class: 'slider-row'}, el('label', {for: `conf-${n}`, text: n}), input, out));
    input.addEventListener('input', () => set(i, input.value / 100));
    return {input, out};
  });
  [['Clear winner', [0.9, 0.06, 0.04]], ['Two-way tie', [0.46, 0.46, 0.08]], ['Spread out', [0.4, 0.33, 0.27]]].forEach(([lab, v]) => {
    const b = el('button', {type: 'button', text: lab, 'aria-pressed': 'false'}); b.addEventListener('click', () => { p = [...v]; draw(); }); presets.append(b);
  });
  function set(i, v) {
    const rest = 1 - v, others = [0, 1, 2].filter(j => j !== i), prev = others.reduce((s, j) => s + p[j], 0);
    others.forEach(j => { p[j] = prev > 0 ? rest * p[j] / prev : rest / 2; }); p[i] = v; draw();
  }
  function tile(label, value, note) { return el('div', {class: 'stat-tile'}, el('span', {text: label}), el('strong', {text: value}), el('em', {text: note})); }
  function draw() {
    const K = p.length, sorted = [...p].sort((a, b) => b - a), top = p.indexOf(sorted[0]);
    const H = -p.reduce((s, v) => s + (v > 0 ? v * Math.log(v) : 0), 0) / Math.log(K);
    const demo = Math.max(0, Math.min(1, (K * sorted[0] - 1) / (K - 1)));
    bars.replaceChildren(...p.map((v, i) => { const b = el('div', {class: 'bar' + (i === top ? ' is-top' : '')}, el('span', {text: pct(v)})); b.style.height = Math.max(1, v * 100) + '%'; return b; }));
    inputs.forEach(({input, out}, i) => { input.value = Math.round(p[i] * 100); out.textContent = pct(p[i]); });
    tiles.replaceChildren(tile('Max probability', sorted[0].toFixed(2), 'probability of the chosen option'),
      tile('Margin', (sorted[0] - sorted[1]).toFixed(2), 'top option minus runner-up'),
      tile('1 − normalised entropy', (1 - H).toFixed(2), 'how concentrated the whole distribution is'),
      tile('Docs-demo formula', demo.toFixed(2), '(K·max − 1)/(K − 1), as shown in the vendor demo'));
    live.textContent = `Chosen: ${names[top]}. Max ${sorted[0].toFixed(2)}, margin ${(sorted[0] - sorted[1]).toFixed(2)}, entropy-based ${(1 - H).toFixed(2)}.`;
  }
  draw();
}

// ------------------------------------------------------------------ 03 reliability diagram (illustrative)
function calibrationDemo(root) {
  const bins = [0.55, 0.65, 0.75, 0.85, 0.95];
  const weight = [0.10, 0.15, 0.20, 0.25, 0.30];
  const regimes = {
    raw: {name: 'Raw scores (overconfident)', slot: 1, acc: [0.46, 0.52, 0.60, 0.70, 0.83]},
    recal: {name: 'Recalibrated on held-out labels', slot: 3, acc: [0.54, 0.64, 0.74, 0.83, 0.93]},
    shift: {name: 'Same model, shifted domain', slot: 2, acc: [0.40, 0.44, 0.49, 0.55, 0.66]},
  };
  let shown = new Set(['raw', 'recal']);
  const seg = el('div', {class: 'seg', role: 'group', 'aria-label': 'Curves shown'});
  const box = el('div', {class: 'chart-box'});
  const ece = el('div', {class: 'stat-tiles'});
  const tv = tableView('Illustrative reliability diagram values', ['Confidence bin', ...Object.values(regimes).map(r => r.name)], bins.map((b, i) => [b.toFixed(2), ...Object.values(regimes).map(r => r.acc[i].toFixed(2))]));
  const lg = el('div');
  root.replaceChildren(seg, el('div', {class: 'viz-head'}, lg, tv.button), box, tv.table, ece,
    el('p', {class: 'demo-note', text: 'Illustrative, hand-made accuracies per confidence bin. ECE here = Σ weight × |accuracy − confidence| over five bins. Real audits report ECE with their own binning; compare only within a study.'}));
  tv.bind(box);
  Object.entries(regimes).forEach(([k, r]) => {
    const b = el('button', {type: 'button', 'aria-pressed': String(shown.has(k)), text: r.name});
    b.addEventListener('click', () => { shown.has(k) ? shown.delete(k) : shown.add(k); if (!shown.size) shown.add(k); b.setAttribute('aria-pressed', String(shown.has(k))); draw(); });
    seg.append(b);
  });
  function draw() {
    const series = [...shown].map(k => ({name: regimes[k].name.split(' (')[0].replace('Recalibrated on held-out labels', 'Recalibrated'), slot: regimes[k].slot, dots: true,
      points: bins.map((b, i) => [b, regimes[k].acc[i]])}));
    lg.replaceChildren(legend([...shown].map(k => [regimes[k].name, regimes[k].slot])));
    lineChart(box, {series, xLabel: 'Stated confidence', yLabel: 'Observed accuracy', xDomain: [0.5, 1], yDomain: [0.2, 1], xFmt: v => v.toFixed(2), yFmt: v => pct(v),
      ref: [[0.5, 0.5], [1, 1]], desc: 'Illustrative reliability diagram: observed accuracy against stated confidence; the diagonal is perfect calibration.'});
    ece.replaceChildren(...[...shown].map(k => { const r = regimes[k]; const v = bins.reduce((s, b, i) => s + weight[i] * Math.abs(r.acc[i] - b), 0);
      return el('div', {class: 'stat-tile'}, el('span', {text: 'ECE · ' + r.name.split(' (')[0]}), el('strong', {text: v.toFixed(3)}), el('em', {text: 'illustrative'})); }));
  }
  draw();
}

// ------------------------------------------------------------------ 04 forced choice
function closedDemo(root) {
  const withAbstain = {shipping: 0.18, billing: 0.07, returns: 0.09, 'none of these': 0.66};
  let abstain = true;
  const state = el('div', {class: 'bd-opt'}, el('span', {class: 'bd-name', text: 'state'}), el('span', {class: 'bd-rubric', text: '“The app shows someone else’s address on my order.”'}));
  const q = el('p', {class: 'demo-note', text: 'Question: which team should handle this? (The right answer — account security — is not an option.)'});
  const toggle = el('div', {class: 'seg', role: 'group', 'aria-label': 'Abstain option'});
  const bars = el('div', {class: 'bars', 'aria-hidden': 'true'}), labels = el('div', {class: 'bar-labels', 'aria-hidden': 'true'});
  const tiles = el('div', {class: 'stat-tiles'}), live = el('p', {class: 'sr-only', 'aria-live': 'polite'});
  [['With “none of these”', true], ['Option removed', false]].forEach(([lab, v]) => {
    const b = el('button', {type: 'button', 'aria-pressed': String(v === abstain), text: lab});
    b.addEventListener('click', () => { abstain = v; toggle.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); draw(); }); toggle.append(b);
  });
  root.replaceChildren(state, q, toggle, bars, labels, tiles, live, el('p', {class: 'demo-note', text: 'Illustrative numbers. Removing the exit renormalises the remaining mass: the answer is still type-valid, and now necessarily wrong.'}));
  function draw() {
    let dist = {...withAbstain};
    if (!abstain) { delete dist['none of these']; const s = Object.values(dist).reduce((a, b) => a + b, 0); for (const k in dist) dist[k] /= s; }
    const entries = Object.entries(dist), top = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
    bars.replaceChildren(...entries.map(([k, v]) => { const b = el('div', {class: 'bar' + (k === top[0] ? ' is-top' : '')}, el('span', {text: pct(v)})); b.style.height = v * 100 + '%'; return b; }));
    labels.replaceChildren(...entries.map(([k]) => el('span', {text: k})));
    tiles.style.gridTemplateColumns = 'repeat(2,minmax(0,1fr))';
    tiles.replaceChildren(el('div', {class: 'stat-tile'}, el('span', {text: 'Returned answer'}), el('strong', {text: top[0]}), el('em', {text: abstain ? 'abstains, as it should' : 'type-valid and wrong'})),
      el('div', {class: 'stat-tile'}, el('span', {text: 'Max probability'}), el('strong', {text: top[1].toFixed(2)}), el('em', {text: abstain ? '' : 'mass forced onto wrong options'})));
    live.textContent = `Answer: ${top[0]} with probability ${top[1].toFixed(2)}.`;
  }
  draw();
}

// ------------------------------------------------------------------ selective control explorer (synthetic)
function rng(seed) { return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }
function simulate(kind) {
  const r = rng(kind === 'good' ? 7 : 11), items = [];
  for (let i = 0; i < 2000; i++) {
    const c = 0.34 + 0.66 * Math.pow(r(), 0.7);                         // stated confidence (3-way task, so ≥ 1/3)
    const pCorrect = kind === 'good' ? Math.min(0.99, 0.15 + 0.85 * c) : 0.62 + 0.12 * (c - 0.66); // ranks errors well vs poorly
    items.push({c, ok: r() < pCorrect});
  }
  return items;
}
function controlExplorer(root) {
  const controls = root.querySelector('[data-ce-controls]'), chart = root.querySelector('[data-ce-chart]');
  const data = {good: simulate('good'), poor: simulate('poor')};
  const STRONG_ACC = 0.95, STRONG_COST = 50;
  let kind = 'good', tau = 0.7;
  const seg = el('div', {class: 'seg', role: 'group', 'aria-label': 'Synthetic confidence quality'});
  [['Confidence ranks errors well', 'good'], ['Confidence ranks errors poorly', 'poor']].forEach(([lab, k]) => {
    const b = el('button', {type: 'button', 'aria-pressed': String(k === kind), text: lab});
    b.addEventListener('click', () => { kind = k; seg.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); draw(); }); seg.append(b);
  });
  const slider = el('input', {type: 'range', min: 0.34, max: 0.99, step: 0.01, value: tau, id: 'ce-tau'});
  const out = el('output', {for: 'ce-tau'});
  slider.addEventListener('input', () => { tau = +slider.value; draw(); });
  const tiles = el('div', {class: 'stat-tiles'});
  tiles.style.gridTemplateColumns = 'repeat(2,minmax(0,1fr))';
  controls.replaceChildren(seg, el('label', {for: 'ce-tau'}, el('span', {}, 'Escalation threshold τ = ', out), slider), tiles);
  const box = el('div', {class: 'chart-box'});
  const grid = Array.from({length: 66}, (_, i) => 0.34 + i * 0.01);
  const metrics = (items, t) => {
    const acc = items.filter(i => i.c >= t), cov = acc.length / items.length;
    const risk = acc.length ? acc.filter(i => !i.ok).length / acc.length : 0;
    const sys = (acc.filter(i => i.ok).length + (items.length - acc.length) * STRONG_ACC) / items.length;
    const cost = (items.length * 1 + (items.length - acc.length) * STRONG_COST) / (items.length * STRONG_COST);
    return {cov, risk, esc: 1 - cov, sys, cost};
  };
  const tv = tableView('Synthetic selective-control values', ['τ', 'Error among accepted', 'Escalated share', 'System accuracy', 'Cost vs strong-only'],
    [0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map(t => { const m = metrics(data.good, t); return [t.toFixed(1), pct(m.risk, 1), pct(m.esc), pct(m.sys, 1), pct(m.cost)]; }));
  chart.replaceChildren(el('div', {class: 'viz-head'}, legend([['Error among accepted', 1], ['Share escalated', 2]]), tv.button), box, tv.table,
    el('p', {class: 'fine', text: 'Synthetic data (2,000 simulated items per preset; fixed seed). Table view lists the “ranks errors well” preset. Assumptions: fallback accuracy 95%, fallback cost 50× the typed call.'}));
  tv.bind(box);
  function draw() {
    const items = data[kind];
    out.textContent = tau.toFixed(2);
    const series = [{name: 'Error (accepted)', slot: 1, points: grid.map(t => [t, metrics(items, t).risk])},
      {name: 'Escalated', slot: 2, points: grid.map(t => [t, metrics(items, t).esc]), labelDy: 10}];
    lineChart(box, {series, xLabel: 'Threshold τ', yLabel: 'Share of items', xDomain: [0.3, 1], yDomain: [0, 1], xFmt: v => v.toFixed(1), marker: tau, xTicks: 7,
      desc: 'Synthetic: error rate among auto-accepted items and share escalated, as the threshold rises.'});
    const m = metrics(items, tau);
    const t = (lab, v, note) => el('div', {class: 'stat-tile'}, el('span', {text: lab}), el('strong', {text: v}), el('em', {text: note}));
    tiles.replaceChildren(t('Auto-accepted', pct(m.cov), 'answered by the typed model'), t('Error among accepted', pct(m.risk, 1), 'selective risk'),
      t('System accuracy', pct(m.sys, 1), 'accepted + escalated'), t('Cost vs strong-only', pct(m.cost), 'typed call on every item + fallback'));
  }
  draw();
}

export function init() {
  const b = $('[data-binding-demo]'); if (b) bindingDemo(b);
  const c = $('[data-conf-demo]'); if (c) confidenceDemo(c);
  const cal = $('[data-cal-demo]'); if (cal) calibrationDemo(cal);
  const cl = $('[data-closed-demo]'); if (cl) closedDemo(cl);
  const ce = $('[data-control-explorer]'); if (ce) controlExplorer(ce);
}
