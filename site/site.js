import {matches, sortRows, safeUrl, toCSV, filtersFromParams, filtersToParams} from './catalog.mjs';

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const DRAWER_URL = 'site/data/drawer.json';
let drawerData = null;

/** Create an element; text is always assigned via textContent (data strings are treated as untrusted). */
function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v; else if (k === 'text') el.textContent = v; else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  return el;
}
const icon = id => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('class', 'icon'); s.setAttribute('aria-hidden', 'true');
  const u = document.createElementNS('http://www.w3.org/2000/svg', 'use'); u.setAttribute('href', '#' + id); s.append(u); return s; };

/** URL state is a convenience: some embedding frames refuse history writes, so failures are ignored. */
function setUrl(url) { try { history.replaceState(null, '', url); } catch { /* sandboxed frame */ } }

async function loadDrawer() {
  if (drawerData) return drawerData;
  const r = await fetch(DRAWER_URL);
  if (!r.ok) throw new Error('evidence data unavailable');
  drawerData = await r.json();
  return drawerData;
}

// ---------------------------------------------------------------- header & menu
const header = $('.site-header');
let ticking = false;
addEventListener('scroll', () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { header.classList.toggle('is-scrolled', scrollY > 80); ticking = false; }); }, {passive: true});
const menu = $('#menu-toggle'), mobileNav = $('#mobile-nav');
const closeMenu = () => { menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Open navigation'); mobileNav.hidden = true; };
menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); mobileNav.hidden = !open; });
$$('#mobile-nav a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !mobileNav.hidden) { closeMenu(); menu.focus(); } });
matchMedia('(min-width:1021px)').addEventListener('change', e => { if (e.matches) closeMenu(); });

// ---------------------------------------------------------------- tabs (roving tabindex, arrow keys)
function tabs(listSel, attr, show) {
  const list = $(listSel); if (!list) return;
  const btns = $$('[role="tab"]', list);
  const select = (btn, focus) => {
    btns.forEach(b => { const on = b === btn; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    show(btn.dataset[attr]); if (focus) btn.focus();
  };
  btns.forEach((b, i) => {
    b.addEventListener('click', () => select(b));
    b.addEventListener('keydown', e => {
      const map = {ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: btns.length - 1};
      if (!(e.key in map)) return; e.preventDefault(); select(btns[(map[e.key] + btns.length) % btns.length], true);
    });
  });
}
tabs('.atlas-tabs', 'atlas', id => $$('.atlas-panel').forEach(p => p.classList.toggle('is-active', p.dataset.panel === id)));
tabs('.lab-tabs', 'lab', id => $$('.lab-panel').forEach(p => { p.hidden = p.dataset.labPanel !== id; }));

// ---------------------------------------------------------------- table views & ecosystem filter
$$('[data-table-toggle]').forEach(btn => btn.addEventListener('click', () => {
  const t = $(`[data-table="${btn.dataset.tableToggle}"]`), chart = $(`[data-chart="${btn.dataset.tableToggle}"]`);
  const on = btn.getAttribute('aria-pressed') !== 'true'; btn.setAttribute('aria-pressed', String(on)); t.hidden = !on; if (chart) chart.hidden = on;
  btn.textContent = on ? 'Chart view' : 'Table view';
}));
$$('[data-eco-filter]').forEach(btn => btn.addEventListener('click', () => {
  $$('[data-eco-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
  const t = btn.dataset.ecoFilter; $$('.eco-table tbody tr').forEach(r => { r.hidden = !!t && r.dataset.type !== t; });
}));

// ---------------------------------------------------------------- literature explorer
const list = $('#paper-list');
const rows = $$('.paper-row', list).map(el => ({
  el, id: el.dataset.id, tier: el.dataset.tier, year: el.dataset.year, date: el.dataset.date, title: el.dataset.title,
  stages: el.dataset.stages.split(' ').filter(Boolean), families: el.dataset.families.split(' ').filter(Boolean),
  rel: el.dataset.rel.split(' ').filter(Boolean), topics: el.dataset.topics.split(' ').filter(Boolean), open: el.dataset.open.split(' ').filter(Boolean),
  search: `${el.dataset.id} ${el.dataset.topics} ${el.querySelector('.paper-main').textContent}`,
}));
const ui = {q: $('#paper-search'), stage: $('#f-stage'), family: $('#f-family'), rel: $('#f-rel'), topic: $('#f-topic'), open: $('#f-open'), year: $('#f-year'), sort: $('#f-sort'),
  status: $('#catalog-status'), empty: $('#empty-state'), more: $('#load-more')};
const PAGE = 20;
const state = {tier: '', visible: rows, limit: PAGE};
const selects = ['stage', 'family', 'rel', 'topic', 'open', 'year', 'sort'];
const current = () => ({query: ui.q.value, tier: state.tier, ...Object.fromEntries(selects.map(k => [k, ui[k].value]))});

function render({pushUrl = true, reset = true} = {}) {
  const f = current();
  if (reset) state.limit = PAGE;
  const hits = sortRows(rows.filter(r => matches(r, f)), f.sort);
  const shown = new Set(hits.slice(0, state.limit));
  rows.forEach(r => { r.el.hidden = !shown.has(r); });
  hits.forEach(r => list.append(r.el));
  state.visible = hits;
  const n = hits.length, active = Object.entries(f).filter(([k, v]) => v && k !== 'sort').length;
  ui.status.textContent = `${n} ${n === 1 ? 'reference' : 'references'}${active ? (n === 1 ? ' matches' : ' match') + ' the current filters' : ''}${n > state.limit ? ` · showing ${state.limit}` : ''}`;
  ui.empty.hidden = n > 0;
  ui.more.hidden = n <= state.limit;
  if (!ui.more.hidden) ui.more.textContent = `Show ${Math.min(PAGE, n - state.limit)} more of ${n - state.limit} remaining`;
  $$('[data-tier-filter]').forEach(b => { const on = b.dataset.tierFilter === state.tier; b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); });
  if (pushUrl) {
    const p = filtersToParams(f); const paper = new URLSearchParams(location.search).get('paper'); if (paper) p.set('paper', paper);
    setUrl(location.pathname + (p.toString() ? '?' + p : '') + location.hash);
  }
}
let debounce;
ui.q.addEventListener('input', () => { clearTimeout(debounce); debounce = setTimeout(render, 90); });
ui.more.addEventListener('click', () => {
  const first = state.limit; state.limit += PAGE; render({reset: false});
  state.visible[first]?.el.querySelector('.paper-title')?.focus({preventScroll: true});
});
selects.forEach(k => ui[k].addEventListener('change', () => render()));
$$('[data-tier-filter]').forEach(b => b.addEventListener('click', () => { state.tier = b.dataset.tierFilter; render(); }));
$('#clear-filters').addEventListener('click', () => { ui.q.value = ''; state.tier = ''; selects.forEach(k => { ui[k].value = k === 'sort' ? 'tier' : ''; }); render(); ui.q.focus({preventScroll: true}); });
(function restore() {
  const allowed = Object.fromEntries(selects.map(k => [k, new Set([...ui[k].options].map(o => o.value))]));
  allowed.tier = new Set(['core', 'peripheral', 'background']);
  const f = filtersFromParams(new URLSearchParams(location.search), allowed);
  ui.q.value = f.query || ''; state.tier = f.tier || ''; selects.forEach(k => { if (f[k]) ui[k].value = f[k]; });
  render({pushUrl: false});
})();

// ---------------------------------------------------------------- exports of the current result set
function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], {type}));
  const a = h('a', {href: url, download: name}); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$$('[data-export]').forEach(btn => btn.addEventListener('click', async () => {
  try {
    const data = await loadDrawer();
    const recs = state.visible.map(r => data[r.id]).filter(Boolean);
    if (btn.dataset.export === 'bib') download('jev-survey-selection.bib', recs.map(r => r.bibtex).join('\n'), 'application/x-bibtex');
    else download('jev-survey-selection.csv', toCSV(recs, [['id', r => r.id], ['tier', r => r.tier], ['title', r => r.title], ['authors', r => r.authors], ['published', r => r.published],
      ['version', r => r.vid], ['venue', r => r.venue], ['url', r => r.url], ['relationship', r => r.rel], ['main_finding_or_role', r => r.finding || r.role],
      ['code', r => r.openness.code.label], ['weights', r => r.openness.weights.label], ['bibtex_key', r => r.key]]), 'text/csv');
  } catch (e) { ui.status.textContent = 'Export failed: ' + e.message; }
}));

// ---------------------------------------------------------------- evidence drawer
const dialog = $('#paper-drawer'), body = $('#drawer-body');
let lastFocus = null;
function field(label, value) { return value ? h('div', {}, h('dt', {text: label}), h('dd', {text: value})) : null; }
function section(title, ...content) { return h('section', {class: 'd-section'}, h('h3', {text: title}), ...content); }
function listOf(items) { return items && items.length ? h('ul', {class: 'd-list'}, items.map(t => h('li', {text: t}))) : null; }
const GLYPH = {available: '●', partial: '◐', restricted: '◑', project_page_only: '◔', claimed_not_located: '○', not_located: '○', not_applicable: '–', not_assessed: '·', not_attempted: '·', no: '○'};

function renderRecord(r) {
  const links = [];
  const add = (href, label, id) => { const u = safeUrl(href); if (u) links.push(h('a', {href: u, target: '_blank', rel: 'noopener noreferrer'}, icon(id), label)); };
  add(r.url, 'arXiv abstract', 'i-paper'); add(r.pdf, 'PDF', 'i-down');
  if (r.openness?.code?.url) add(r.openness.code.url, 'Code', 'i-code');
  if (r.openness?.weights?.url) add(r.openness.weights.url, 'Weights', 'i-data');
  const copy = h('button', {type: 'button'}, icon('i-copy'), 'Copy BibTeX');
  copy.addEventListener('click', async () => { try { await navigator.clipboard.writeText(r.bibtex); copy.lastChild.textContent = 'Copied'; } catch { copy.lastChild.textContent = 'Copy failed — select the text below'; } });
  links.push(copy);
  const venue = r.venue_source === 'arxiv_comment' ? `${r.venue} (per arXiv comment; not verified against proceedings)` : r.venue_source === 'arxiv_journal_ref' ? `${r.venue} (per arXiv journal reference)` : r.venue_note ? `arXiv preprint · ${r.venue_note}` : 'arXiv preprint';
  const kids = [
    h('p', {class: 'd-kicker'}, h('span', {class: `tier-badge tier-${r.tier}`, text: r.tier}), r.short || r.group || '', ' · ', r.rel.join(' · ')),
    h('h2', {id: 'drawer-title', text: r.title}),
    h('p', {class: 'paper-authors', text: r.authors.join(', ')}),
    h('dl', {class: 'd-meta'}, field('First submitted', r.published), field('Version read', r.vid), field('Last updated', r.updated), field('Retrieved', r.retrieved),
      field('Status', venue), field('Reading depth', r.depth.replaceAll('_', ' '))),
    h('div', {class: 'd-links'}, links),
  ];
  if (r.tier !== 'background') {
    kids.push(section('What the study does', h('p', {text: r.summary})), section('Relationship to Jev', h('p', {text: r.relationship})),
      section('Task and data', h('p', {text: r.task}), listOf(r.datasets)), section('Main finding (author-reported)', h('p', {text: r.finding})),
      section('Limitations and reading notes', listOf(r.caveats)), section('Use in this survey', h('p', {text: r.use})));
    if (r.versions?.length) kids.push(section('Model versions', listOf(r.versions.map(v => `${v.model}: ${v.version ?? 'not reported'}${v.note ? ' — ' + v.note : ''}`))));
    const open = h('dl', {class: 'd-open'}, Object.entries({code: 'Code', weights: 'Weights', data: 'Data', predictions: 'Raw predictions', recomputable: 'Recomputable', reproduction: 'Reproduced'})
      .map(([k, lab]) => { const o = r.openness[k]; return h('div', {}, h('dt', {text: lab}), h('dd', {}, h('span', {'aria-hidden': 'true', text: GLYPH[o.status] || '·'}), o.label), o.note ? h('small', {text: o.note}) : null); }));
    kids.push(section('Openness (six separate fields)', open));
    kids.push(section(`Evidence records (${r.claims.length})`, h('div', {class: 'd-claims'}, r.claims.map(c => h('article', {class: 'd-claim'},
      h('strong', {text: c.headline}), h('p', {text: c.text}),
      h('div', {class: 'd-tags'}, [c.type, c.test, c.scope, c.locator, c.n?.n != null ? `n = ${c.n.n.toLocaleString()} ${c.n.unit}` : `n: ${(c.n?.reason || 'not reported').replaceAll('_', ' ')}`,
        `version: ${c.version?.value ?? (c.version?.reason || 'not reported').replaceAll('_', ' ')}`, ...c.findings].map(t => h('span', {text: t}))),
      c.limitations?.length ? h('p', {text: 'Limits: ' + c.limitations.join(' ')}) : null)))));
    if (r.family) kids.push(section('Study family', h('p', {text: 'Shares authors and service path with another core study; synthesised as one family, not as independent replications.'})));
  } else {
    kids.push(section('Role in this survey', h('p', {text: r.role})), section('Group', h('p', {text: r.group})));
  }
  kids.push(section('Inclusion', h('p', {text: r.reason}), h('p', {class: 'fine', text: 'Found by: ' + (r.included_by || []).join(', ')})));
  kids.push(section('BibTeX', h('pre', {class: 'd-bib', text: r.bibtex})));
  kids.push(h('p', {class: 'd-note', text: 'Values are as reported by the source; this survey did not re-run any experiment. The full abstract is available on arXiv.'}));
  body.replaceChildren(...kids.filter(Boolean));
}

async function openPaper(id, trigger) {
  lastFocus = trigger || document.activeElement;
  body.replaceChildren(h('h2', {id: 'drawer-title', class: 'sr-only', text: 'Evidence record'}), h('p', {text: 'Loading evidence…'}));
  if (!dialog.open) dialog.showModal();
  try {
    const data = await loadDrawer();
    if (!data[id]) throw new Error('record not found');
    renderRecord(data[id]);
    dialog.querySelector('.drawer-inner').scrollTop = 0;
    const p = new URLSearchParams(location.search); p.set('paper', id); setUrl(location.pathname + '?' + p + location.hash);
  } catch (e) {
    body.replaceChildren(h('h2', {id: 'drawer-title', text: 'Evidence could not be loaded'}), h('p', {text: e.message + '. Every record is also in data/papers.json.'}));
  }
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-open-paper]');
  if (!t) return;
  e.preventDefault(); openPaper(t.dataset.openPaper, t);
});
$('[data-close-drawer]').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
dialog.addEventListener('close', () => {
  const p = new URLSearchParams(location.search); p.delete('paper'); setUrl(location.pathname + (p.toString() ? '?' + p : '') + location.hash);
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus({preventScroll: true});
});
const deep = new URLSearchParams(location.search).get('paper');
if (deep && rows.some(r => r.id === deep)) openPaper(deep);

// ---------------------------------------------------------------- explainers load when their sections approach
const labTargets = $$('[data-lab-panel], [data-control-explorer]');
let labLoaded = false;
const loadLab = () => { if (labLoaded) return; labLoaded = true; import('./lab.js').then(m => m.init()).catch(err => console.error('explainers failed to load', err)); };
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { loadLab(); io.disconnect(); } }, {rootMargin: '600px 0px'});
  labTargets.forEach(t => io.observe(t));
} else loadLab();
