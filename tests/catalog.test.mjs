// Run with: node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import {normalize, matches, sortRows, csvCell, toCSV, safeUrl, escapeHtml, filtersFromParams, filtersToParams} from '../site/catalog.mjs';

const row = (o = {}) => ({tier: 'core', year: '2026', date: '2026-09-22', title: 'b title', stages: ['probability'], families: ['hosted_service'],
  rel: ['commercial_jev'], topics: ['calibration'], open: ['code'], search: 'arxiv:2609.24574 Evaluating Decision Models — CSS', ...o});

test('normalize folds case, accents and dashes', () => {
  assert.equal(normalize('Type-Safe  Is Not   Error–Free'), 'type safe is not error free');
  assert.equal(normalize('Café'), 'cafe');
});
test('search requires every term', () => {
  assert.ok(matches(row(), {query: 'decision css'}));
  assert.ok(!matches(row(), {query: 'decision video'}));
  assert.ok(matches(row(), {query: '2609.24574'}));
});
test('facets combine with AND', () => {
  assert.ok(matches(row(), {tier: 'core', stage: 'probability', family: 'hosted_service', rel: 'commercial_jev', topic: 'calibration', open: 'code', year: '2026'}));
  assert.ok(!matches(row(), {stage: 'control'}));
  assert.ok(!matches(row(), {open: 'weights'}));
  assert.ok(!matches(row(), {tier: 'background'}));
});
test('sorting modes', () => {
  const rows = [row({tier: 'background', date: '2019-01-01', title: 'a'}), row({tier: 'core', date: '2026-09-19', title: 'c'}), row({tier: 'core', date: '2026-09-22', title: 'z'})];
  assert.deepEqual(sortRows(rows, 'tier').map(r => r.title), ['z', 'c', 'a']);
  assert.deepEqual(sortRows(rows, 'old').map(r => r.title), ['a', 'c', 'z']);
  assert.deepEqual(sortRows(rows, 'title').map(r => r.title), ['a', 'c', 'z']);
});
test('CSV cells neutralise formula injection and quote safely', () => {
  for (const bad of ['=HYPERLINK("x")', '+1', '-2', '@SUM(A1)', '\tx']) assert.ok(csvCell(bad).replace(/^"/, '').startsWith("'"), bad);
  assert.equal(csvCell('a,b'), '"a,b"');
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  assert.equal(csvCell(['x', 'y']), 'x; y');
  assert.equal(toCSV([{a: 1}], [['A', r => r.a]]), 'A\n1\n');
});
test('URLs and HTML are sanitised', () => {
  assert.equal(safeUrl('javascript:alert(1)'), null);
  assert.equal(safeUrl('data:text/html,x'), null);
  assert.equal(safeUrl('https://arxiv.org/abs/2609.24574v1'), 'https://arxiv.org/abs/2609.24574v1');
  assert.equal(escapeHtml('<img src=x onerror="1">'), '&lt;img src=x onerror=&quot;1&quot;&gt;');
});
test('URL state round-trips and rejects unknown values', () => {
  const f = {query: 'calibration', tier: 'core', family: 'hosted_service', sort: 'tier'};
  const p = filtersToParams(f);
  assert.equal(p.get('sort'), null);
  assert.deepEqual(filtersFromParams(p, {tier: new Set(['core'])}), {query: 'calibration', tier: 'core', family: 'hosted_service'});
  assert.deepEqual(filtersFromParams(new URLSearchParams('tier=evil'), {tier: new Set(['core'])}), {});
});
