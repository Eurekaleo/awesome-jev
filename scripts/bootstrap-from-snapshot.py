#!/usr/bin/env python3
"""One-time migration: research snapshot + editorial curation -> canonical data/*.json.

    python3 scripts/bootstrap-from-snapshot.py --force

Inputs (never modified):
  research/snapshot-2026-09-23/        immutable 2026-09-23 research pack (papers, logs, audits)
  research/increments/2026-09-23T0818Z first incremental rerun (queries, screening, GitHub delta)
  research/curation/*.py               frozen English annotations, claims, repositories, relations

Outputs: data/papers.json, claims.json, repositories.json, taxonomy.json,
review-relations.json, sources.json, search-runs.json.

After the first release data/*.json is the source of truth. Re-running this
script overwrites manual edits, so it refuses to run without --force.
Every snapshot field is preserved under `source_record` for provenance, and
scripts/validate-data.py checks that no snapshot record was lost.
"""
import argparse
import csv
import importlib.util
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
SNAP = ROOT / 'research' / 'snapshot-2026-09-23'
INC = ROOT / 'research' / 'increments' / '2026-09-23T0818Z'
CUR = ROOT / 'research' / 'curation'
DATA = ROOT / 'data'
PACK_PREFIX = 'Jev_Claude_Handoff_20260923/research_pack/'  # local evidence paths are relative to the handoff package


def load_module(name):
    spec = importlib.util.spec_from_file_location(name, CUR / f'{name}.py')
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def read_csv(path):
    with open(path, encoding='utf-8-sig') as f:
        return list(csv.DictReader(f))


VENUE_PATTERNS = [
    (r'\bICML\b[^0-9]*(\d{4})', 'ICML'), (r'\bICLR\b[^0-9]*(\d{4})', 'ICLR'), (r'International Conference on Learning Representations (\d{4})', 'ICLR'),
    (r'NeurIPS (\d{4}) Datasets and Benchmarks', 'NeurIPS Datasets and Benchmarks'), (r'Advances in Neural Information Processing Systems, (\d{4})', 'NeurIPS'),
    (r'\bEMNLP ?(\d{4})', 'EMNLP'), (r'\bFOCS (\d{4})', 'FOCS'), (r'\bFORC (\d{4})', 'FORC'), (r"MLSys '(\d{2})", 'MLSys'),
]


def venue_from(meta):
    """Venue only as stated in arXiv metadata; never inferred from memory."""
    if meta.get('journal_ref'):
        return dict(publication_type='journal', venue=meta['journal_ref'], venue_source='arxiv_journal_ref')
    comment = meta.get('comment') or ''
    if re.search(r'submitted to', comment, re.I):
        return dict(publication_type='preprint', venue='arXiv', venue_source='arxiv_comment_submitted',
                    venue_note=re.search(r'submitted to [^,;.]+', comment, re.I).group(0))
    for pat, name in VENUE_PATTERNS:
        m = re.search(pat, comment)
        if m:
            year = m.group(1)
            year = '20' + year if len(year) == 2 else year
            return dict(publication_type='conference', venue=f'{name} {year}', venue_source='arxiv_comment')
    return dict(publication_type='preprint', venue='arXiv', venue_source='arxiv_metadata')


STAGES_BY_GROUP = {
    'classification': ['readout'], 'calibration': ['probability'], 'selective': ['control'],
    'decision-calibration': ['probability', 'control'], 'structured-output': ['contract', 'readout'],
    'judging': ['use'], 'routing': ['control', 'use'], 'label-robustness': ['contract'],
}


def paper_record(meta, tier, cur, bg, included_by, inclusion_reason, retrieved_at, source_record, local_paths, group_zh):
    aid = meta['arxiv_id']
    rec = dict(
        id='arxiv:' + aid, arxiv_id=aid, versioned_id=meta['versioned_id'], doi=meta.get('doi') or None,
        title=meta['title'], short_title=None, authors=meta['authors'],
        published_at=meta['published'], updated_at=meta['updated'], retrieved_at=retrieved_at,
        year=int(meta['published'][:4]), month=int(meta['published'][5:7]),
        tier=tier, **venue_from(meta), venue_verified_at=None,
        categories=meta['categories'], abstract=meta['abstract'],
        url='https://arxiv.org/abs/' + meta['versioned_id'], pdf_url='https://arxiv.org/pdf/' + meta['versioned_id'],
        bibtex_key='arxiv' + aid.replace('.', '_').replace('/', '_'),
        included_by=included_by, inclusion_reason=inclusion_reason, local_evidence_paths=local_paths,
        source_record=source_record,
    )
    if cur:
        rec.update(
            short_title=cur['short_title'], relationship=cur['relationship'], summary=cur['summary'], task=cur['task'],
            datasets=cur['datasets'], baselines=cur['baselines'], models=cur['models'], main_finding=cur['main_finding'],
            caveats=cur['caveats'], survey_use=cur['survey_use'], topics=cur['topics'], stages=cur['stages'],
            method_families=cur['method_families'], applications=cur['applications'], model_relationship=cur['model_relationship'],
            test_level=cur['test_level'], model_versions=cur['model_versions'], study_family_id=cur.get('study_family_id'),
            openness=cur['openness'], evidence_locator=cur['locator'], priority=cur['priority'],
            review_depth='full_text_and_selected_tables', background_group=None, role=None)
    else:
        group, role, topics = bg
        rec.update(
            relationship=None, summary=None, task=None, datasets=[], baselines=[], models=[], main_finding=None, caveats=[],
            survey_use=None, topics=topics, stages=STAGES_BY_GROUP[group], method_families=[], applications=[],
            model_relationship=['adjacent_method'], test_level=None, model_versions=[], study_family_id=None,
            openness={f: {'status': 'not_assessed'} for f in ['code', 'weights', 'data', 'predictions', 'recomputable', 'reproduction']},
            evidence_locator=None, priority='context',
            review_depth='full_text_spot_check' if (source_record or {}).get('review_depth') == 'full_text_spot_check' else 'metadata_and_abstract',
            background_group=group, role=role)
    rec['claims'] = []
    return rec


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--force', action='store_true', help='overwrite data/*.json (destroys manual edits)')
    args = ap.parse_args()
    if (DATA / 'papers.json').exists() and not args.force:
        sys.exit('data/papers.json exists. This is a one-time migration; pass --force to overwrite.')

    cur = load_module('curation_2026_09_23')
    cl = load_module('claims_2026_09_23')
    rp = load_module('repos_2026_09_23')
    sy = load_module('synthesis_2026_09_23')

    snap_papers = json.loads((SNAP / 'papers.json').read_text())
    screening = {r['arxiv_id']: r for r in read_csv(SNAP / 'screening_log.csv')}
    group_zh = {g['zh']: g['id'] for g in cur.BACKGROUND_GROUPS}

    papers = []
    for m in snap_papers:
        aid = m['arxiv_id']
        tier = m['tier']
        c = cur.PAPERS.get(aid)
        bg = cur.BACKGROUND.get(aid)
        if tier in ('core', 'peripheral') and not c:
            sys.exit(f'missing curation for {tier} paper {aid}')
        if tier == 'background':
            if not bg:
                sys.exit(f'missing background curation for {aid}')
            if group_zh[m['category']] != bg[0]:
                sys.exit(f'background group mismatch for {aid}')
        s = screening.get(aid)
        included_by = (json.loads(s['queries']) if s else ['background_by_id'])
        reason = (s['reason'] if s and tier != 'background' else
                  'Purposively selected background reference, retrieved by explicit arXiv ID and checked against arXiv metadata.'
                  if tier == 'background' else s['reason'])
        if tier == 'background' and s:
            reason = 'Found by the snapshot queries and retained as background: ' + s['reason']
        local = [PACK_PREFIX + f'papers/{m["versioned_id"]}.pdf', PACK_PREFIX + f'papers/{m["versioned_id"]}.txt'] \
            if (ROOT.parent / PACK_PREFIX / 'papers' / f'{m["versioned_id"]}.pdf').exists() else []
        source_record = {k: v for k, v in m.items() if k not in ('abstract',)}
        papers.append(paper_record(m, tier, c, bg, included_by, reason, m['retrieval_date'], source_record, local, group_zh))

    # increment additions (background)
    inc_meta = {r['arxiv_id']: r for r in json.loads((INC / 'records.json').read_text())}
    inc_screen = [r for r in json.loads((INC / 'screening.json').read_text()) if r['screening_decision'] == 'include_background']
    INC_BG = {
        '2609.17977': ('selective', 'A cheap stacked ensemble that escalates only its least-confident predictions to an LLM; on IEMOCAP the ensemble alone beat every LLM configuration — trained cheap models are the first baseline for escalation designs.', ['selective-control', 'routing', 'classification']),
        '2608.04355': ('structured-output', 'Format recovery can masquerade as reasoning gains; grammar-constrained decoding closes much of the gap, so parseability must be separated from content when typed and generative outputs are compared.', ['structured-output', 'evaluation-methodology']),
        '2609.07305': ('label-robustness', 'In synthetic survey panels the response contract (committed sets vs per-option probabilities) dominates measured fidelity — the same interface dependence seen with Noul vs Choice.', ['interface-semantics', 'calibration']),
        '2606.30531': ('label-robustness', 'Entity binding failures — the right tool acting on the wrong entity — separate tool correctness from entity correctness, a close analogue of option-name binding.', ['interface-semantics', 'agents', 'selective-control']),
        '2609.04445': ('selective', 'Conformal coverage calibrated in isolation breaks under a score-mechanism shift (peer pressure); an attacker can target the low-confidence items a gate still covers.', ['selective-control', 'calibration', 'robustness']),
        '2608.06571': ('calibration', 'Answer-preserving attacks move confidence readouts, bounding what confidence gates can certify.', ['calibration', 'robustness']),
        '2608.19558': ('calibration', 'Under domain shift the ranking of confidence signals changes: whole-output probability is the best in-domain error detector but degrades out of domain.', ['calibration', 'selective-control', 'robustness']),
        '2608.20630': ('structured-output', 'Typed AI primitives with a shared confidence-gated execution interface in SQL: the same design pattern arising independently in data systems.', ['structured-output', 'selective-control']),
        '2609.13288': ('calibration', 'Answer-level reliability scores built from option-probability lists can be refined under target shift, without changing answers, when a labelled target pilot exists.', ['calibration', 'robustness', 'multimodal']),
    }
    for s in inc_screen:
        m = dict(inc_meta[s['arxiv_id']])
        rec = paper_record(m, 'background', None, INC_BG[s['arxiv_id']], s['queries'],
                           'Added in increment 2026-09-23T0818Z after title/abstract screening: ' + s['reason'],
                           '2026-09-23', {'increment': '2026-09-23T0818Z', 'queries': s['queries']}, [], group_zh)
        papers.append(rec)

    # claims -> attach ids to papers
    claims = cl.CLAIMS
    by_id = {p['id']: p for p in papers}
    for c in claims:
        if c['subject'] in by_id:
            by_id[c['subject']]['claims'].append(c['id'])

    order = {'core': 0, 'peripheral': 1, 'background': 2}
    papers.sort(key=lambda p: (order[p['tier']], p['published_at']), reverse=False)
    papers.sort(key=lambda p: (order[p['tier']], -int(p['published_at'][:10].replace('-', ''))))

    meta = dict(
        schema='jev-survey/papers@1', cutoff=cur.CUTOFF, timezone='Asia/Singapore',
        snapshot='research/snapshot-2026-09-23', increments=['research/increments/2026-09-23T0818Z'],
        note='Counts are derived by scripts/build.py. Venues are stated only as given in arXiv metadata (journal_ref or author comment); proceedings were not checked (venue_verified_at is null).')
    write('papers.json', dict(meta=meta, papers=papers))
    write('claims.json', dict(meta=dict(schema='jev-survey/claims@1', cutoff=cur.CUTOFF,
                                        note='Author- or vendor-reported values; none independently reproduced by this review.'), claims=claims))

    # repositories: 30 priority + 81 catalogues, merged by normalised name
    pri = {r['full_name'].lower(): r for r in read_csv(SNAP / 'priority_repositories.csv')}
    cats = {r['full_name'].lower(): r for r in read_csv(SNAP / 'catalogues.csv')}
    code_ev = json.loads((SNAP / 'code_evidence.json').read_text())
    curated = {r['full_name'].lower(): r for r in rp.PRIORITY}
    repos = []
    for key in sorted(set(pri) | set(cats)):
        p, c, k = pri.get(key), cats.get(key), curated.get(key)
        src = p or c
        rec = dict(
            id='gh:' + key, full_name=src['full_name'], url=src['html_url'], sets=[s for s, v in (('priority', p), ('catalogue', c)) if v],
            commit=(p or c)['commit'] or None, commit_date=(p or c).get('commit_date') or None,
            readme_url=(p or c).get('readme_permanent_url') or None, accessed_at=(p or c).get('retrieved_at_utc'),
            license=src.get('license') or None, stars_at_snapshot=int(src['stargazers_count']) if src.get('stargazers_count') else None,
            description=src.get('description') or None,
            audit_depth=(p['audit_depth'] if p else ('README_metadata' if c['status'] == 'ok' else 'metadata_only_readme_unavailable')),
            readme_fetched=bool((p and p.get('readme_permanent_url')) or (c and c['status'] == 'ok')),
            selected_source_read=sorted({e['path'] for e in code_ev if e['repo'].lower() == key}),
            executed=False,
        )
        if k:
            rec.update(type=k['type'], summary=k['summary'], boundary=k['boundary'], method_family=k['method_family'],
                       base_model=k['base_model'], related_papers=k['related_papers'], affiliation=k['affiliation'],
                       availability=k['availability'], notes=k['notes'])
        else:
            rec.update(type='catalogue', summary=rp.CATALOGUE_NOTES.get(key, 'Community catalogue audited as a discovery source; entries require primary-source verification.'),
                       boundary='Discovery source, not evidence; link counts include unrelated infrastructure and baselines.',
                       method_family=None, base_model=None, related_papers=[], affiliation='independent', availability=None, notes=None)
        if c:
            rec['catalogue_audit'] = dict(
                status=c['status'], error=c['error'] or None,
                outgoing_candidate_links=int(c['external_candidate_repo_links'] or 0),
                overlap_with_seed=int(c['overlap_with_hellogumbo'] or 0), additional_vs_seed=int(c['additional_links_vs_hellogumbo'] or 0),
                readme_arxiv_ids=json.loads(c['readme_arxiv_ids'] or '[]'))
        if key == 'youzizzz1028/awesome-jev':
            rec['type'] = 'guide'
        repos.append(rec)
    write('repositories.json', dict(meta=dict(
        schema='jev-survey/repositories@1', cutoff=cur.CUTOFF,
        note='30 priority resources and 81 audited catalogues/guides; 2 appear in both sets. README outgoing links (4,666 candidates) are NOT repository records here; see research/snapshot-2026-09-23/repository_candidates.csv.',
        unverified_outgoing_candidates=4666, seed_outgoing_candidates=793, github_discovery_unique=1082), repositories=repos))

    taxonomy = dict(
        schema='jev-survey/taxonomy@1', note='An analytical organisation for this survey. It is not the architecture of any commercial model and is not claimed as the first such taxonomy.',
        stages=cur.STAGES, method_families=cur.METHOD_FAMILIES, topics=cur.TOPICS, applications=cur.APPLICATIONS,
        model_relationships=cur.MODEL_RELATIONSHIPS, test_levels=cur.TEST_LEVELS, measurement_scopes=cur.MEASUREMENT_SCOPES,
        evidence_types=cur.EVIDENCE_TYPES, openness_fields=cur.OPENNESS_FIELDS, openness_statuses=cur.OPENNESS_STATUSES,
        findings=cur.FINDINGS, background_groups=[{k: v for k, v in g.items() if k != 'zh'} | {'label_zh': g['zh']} for g in cur.BACKGROUND_GROUPS],
        repository_types=rp.REPO_TYPES, failure_modes=sy.FAILURE_MODES, application_cards=sy.APPLICATION_CARDS)
    write('taxonomy.json', taxonomy)
    write('review-relations.json', dict(schema='jev-survey/relations@1', relations=rp.RELATIONS,
                                        related_surveys=rp.RELATED_SURVEYS,
                                        survey_matrix=[dict(dimension=d, prior=a, this_survey=b, evidence=e) for d, a, b, e in rp.SURVEY_MATRIX]))
    write('sources.json', dict(schema='jev-survey/sources@1', note='Official and first-party sources. Snapshot paths are relative to research_pack/ in the handoff package.',
                               sources=rp.SOURCES))
    write('search-runs.json', build_search_runs())
    print(f'papers={len(papers)} claims={len(claims)} repositories={len(repos)}')


def build_search_runs():
    snap_log = json.loads((SNAP / 'search_log.json').read_text()) + json.loads((SNAP / 'supplement_log.json').read_text())
    rejected = json.loads((SNAP / 'supplement_log_initial_with_rejected_query.json').read_text())
    gh_log = json.loads((SNAP / 'github_search_log.json').read_text())
    inc_log = json.loads((INC / 'query_log.json').read_text())
    inc_first = json.loads((INC / 'query_log.first_pass.json').read_text())
    inc_screen = json.loads((INC / 'screening.json').read_text())
    gh_inc_dirs = sorted((ROOT / 'research' / 'increments').glob('*/github/summary.json'))
    gh_inc = json.loads(gh_inc_dirs[-1].read_text()) if gh_inc_dirs else None
    gh_watch = json.loads((gh_inc_dirs[-1].parent / 'watched_repositories.json').read_text()) if gh_inc_dirs else []
    rej = [r for r in rejected if 'Q12_open_variants' in (r.get('query_id') or '')]
    runs = [
        dict(id='snapshot-arxiv-2026-09-23', kind='arxiv_keyword', date='2026-09-23', retrieved_between=[snap_log[0]['retrieved_at_utc'], snap_log[-1]['retrieved_at_utc']],
             source='research/snapshot-2026-09-23/search_log.json + supplement_log.json',
             queries=[dict(id=l['query_id'], query=l['query'], total=l.get('total_results'), returned=l.get('returned')) for l in snap_log],
             accepted_queries=len(snap_log), hits_before_dedup=sum(l.get('returned') or 0 for l in snap_log), unique_screened=197,
             dedup_key='unversioned arXiv ID',
             decisions=dict(core=13, peripheral=1, background=6, outside_core_scope=177),
             note='`all:` searches arXiv metadata fields, not PDF full text.'),
        dict(id='snapshot-arxiv-rejected', kind='arxiv_keyword_rejected', date='2026-09-23', source='research/snapshot-2026-09-23/supplement_log_initial_with_rejected_query.json',
             query=(rej[0]['query'] if rej else None), reported_total=(rej[0].get('total_results') if rej else None),
             note='Implausibly broad compound query (reported 1,232,608), 400 records fetched then HTTP 429; rejected, not screened, replaced by Q12a–d.'),
        dict(id='snapshot-background-by-id', kind='arxiv_id_list', date='2026-09-23', source='research/snapshot-2026-09-23/background_log.json',
             added_background=38, note='Purposive background references retrieved by explicit arXiv ID (44 background = 6 from queries + 38 by ID).'),
        dict(id='snapshot-github-2026-09-23', kind='github_repository_search', date='2026-09-23', source='research/snapshot-2026-09-23/github_search_log.json',
             queries=sorted({g['query'] for g in gh_log}), unique_results=1082, catalogues_audited=81, readmes_fetched=79, priority_resources=30,
             overlap_priority_catalogue=2, outgoing_candidates_all=4666, outgoing_candidates_seed=793,
             note='Outgoing README links are unverified candidates, not validated projects.'),
        dict(id='increment-arxiv-2026-09-23T0818Z', kind='arxiv_keyword_increment', date='2026-09-23',
             retrieved_between=[inc_first[0]['retrieved_at_utc'], inc_log[-1]['retrieved_at_utc']], source='research/increments/2026-09-23T0818Z/',
             accepted_rerun=dict(queries=17, hits_before_dedup=sum(l.get('returned') or 0 for l in inc_log if l['query_id'].startswith('Q')),
                                 reproduced_snapshot_totals=all(
                                     next((x.get('total_results') for x in snap_log if x['query_id'] == l['query_id']), None) == l.get('total_results')
                                     for l in inc_log if l['query_id'].startswith('Q'))),
             expansion=[dict(id=l['query_id'], query=l['query'], total=l.get('total_results'), returned=l.get('returned'), status=l.get('status'))
                        for l in inc_log if l['query_id'].startswith('X')],
             new_candidates=len(inc_screen),
             decisions={d: sum(1 for r in inc_screen if r['screening_decision'] == d) for d in sorted({r['screening_decision'] for r in inc_screen})},
             id_refresh=dict(ids=58, metadata_changes=0, source='api/id_refresh_0.xml, api/id_refresh_50.xml (first pass, 2026-09-23T08:32Z)'),
             note='arXiv announces new submissions around 00:00 UTC; this same-day rerun primarily verifies the snapshot and widens vocabulary. Four broad phrase queries were rejected by rule (>2,000 results).'),
    ]
    if gh_inc:
        runs.append(dict(id='increment-github-' + gh_inc['run_id'], kind='github_repository_search_increment', date='2026-09-23',
                         source=f'research/increments/{gh_inc["run_id"]}/github/', unique_results=gh_inc['unique_results'],
                         already_known=gh_inc['already_known'], new_unverified_candidates=gh_inc['new_unverified_candidates'],
                         added_to_repositories=0, watched=gh_watch,
                         note='New candidates are unverified (mostly awesome-list copies created on 2026-09-23); none added. Prior survey head unchanged at f3703012.'))
    return dict(schema='jev-survey/search-runs@1', runs=runs)


def write(name, obj):
    DATA.mkdir(exist_ok=True)
    (DATA / name).write_text(json.dumps(obj, ensure_ascii=False, indent=1) + '\n')


if __name__ == '__main__':
    main()
