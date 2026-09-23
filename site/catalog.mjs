// Pure helpers for the literature explorer. No DOM access: unit-tested in tests/catalog.test.mjs.

export const normalize = (s = '') => String(s).toLocaleLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[-‐‑–—_/]/g, ' ').replace(/\s+/g, ' ').trim();

/** @param {{tier:string,year:string,stages:string[],families:string[],rel:string[],topics:string[],open:string[],search:string}} row */
export function matches(row, f = {}) {
  if (f.tier && row.tier !== f.tier) return false;
  if (f.year && String(row.year) !== String(f.year)) return false;
  if (f.stage && !row.stages.includes(f.stage)) return false;
  if (f.family && !row.families.includes(f.family)) return false;
  if (f.rel && !row.rel.includes(f.rel)) return false;
  if (f.topic && !row.topics.includes(f.topic)) return false;
  if (f.open && !row.open.includes(f.open)) return false;
  const terms = normalize(f.query).split(' ').filter(Boolean);
  if (!terms.length) return true;
  const hay = normalize(row.search);
  return terms.every(t => hay.includes(t));
}

export const filterRows = (rows, f) => rows.filter(r => matches(r, f));

const TIER_ORDER = {core: 0, peripheral: 1, background: 2};
export function sortRows(rows, mode = 'tier') {
  const byDateDesc = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
  const out = [...rows];
  if (mode === 'new') out.sort((a, b) => byDateDesc(a, b) || a.title.localeCompare(b.title));
  else if (mode === 'old') out.sort((a, b) => -byDateDesc(a, b) || a.title.localeCompare(b.title));
  else if (mode === 'title') out.sort((a, b) => a.title.localeCompare(b.title));
  else out.sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier] || byDateDesc(a, b) || a.title.localeCompare(b.title));
  return out;
}

export function escapeHtml(v = '') {
  return String(v).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

export function safeUrl(v) {
  try {
    const u = new URL(v, 'https://example.invalid/');
    return ['http:', 'https:'].includes(u.protocol) ? (u.host === 'example.invalid' ? null : u.href) : null;
  } catch { return null; }
}

/** Spreadsheet-safe cell: neutralises leading = + - @ tab CR (formula injection) and quotes as needed. */
export function csvCell(v) {
  let s = v == null ? '' : Array.isArray(v) ? v.join('; ') : typeof v === 'object' ? JSON.stringify(v) : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? '"' + s.replaceAll('"', '""') + '"' : s;
}

export function toCSV(records, columns) {
  const head = columns.map(c => csvCell(c[0])).join(',');
  const lines = records.map(r => columns.map(([, get]) => csvCell(get(r))).join(','));
  return [head, ...lines].join('\n') + '\n';
}

export const FILTER_KEYS = ['query', 'tier', 'stage', 'family', 'rel', 'topic', 'open', 'year', 'sort'];
export function filtersFromParams(params, allowed = {}) {
  const f = {};
  for (const k of FILTER_KEYS) {
    const v = params.get(k === 'query' ? 'q' : k);
    if (v == null || v === '') continue;
    if (allowed[k] && !allowed[k].has(v)) continue;
    f[k] = v;
  }
  return f;
}
export function filtersToParams(f) {
  const p = new URLSearchParams();
  for (const k of FILTER_KEYS) if (f[k] && !(k === 'sort' && f[k] === 'tier')) p.set(k === 'query' ? 'q' : k, f[k]);
  return p;
}
