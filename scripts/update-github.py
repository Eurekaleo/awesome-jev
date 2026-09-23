#!/usr/bin/env python3
"""Incremental GitHub discovery for the Jev survey.

Re-runs the five repository searches used in the 2026-09-23 snapshot, removes
repositories already in the snapshot discovery set (or in earlier increments),
and writes the remainder as *unverified discovery candidates*. Nothing is added
to data/ automatically: a candidate becomes a repository record only after a
person reads it and fills the fields required by docs/data-contract.md.

It also records the head commit of watched repositories (prior surveys,
official SDKs) so that changes to competing work are noticed.

Uses `gh api` when the GitHub CLI is authenticated; otherwise GITHUB_TOKEN.
"""
import datetime as dt
import json
import os
import pathlib
import shutil
import subprocess
import time
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
QUERIES = [
    'awesome jev in:name fork:true',
    'awesome typesafe in:name fork:true',
    'jev survey in:name,description',
    'jev papers in:name,description',
    'jev research in:name,description',
]
WATCH = [
    'youzizzz1028/Awesome-Jev',          # prior public survey draft
    'hellogumbo/awesome-jev',            # seed catalogue of the snapshot
    'typesafe-ai/typesafe-sdk-python',
    'typesafe-ai/typesafe-sdk-js',
    'typesafe-ai/system-one-adapter-python',
]


def gh(path, params=None):
    query = ('?' + urllib.parse.urlencode(params)) if params else ''
    if shutil.which('gh'):
        out = subprocess.run(['gh', 'api', '-X', 'GET', path + query], capture_output=True, text=True)
        if out.returncode == 0:
            return json.loads(out.stdout)
        raise RuntimeError(out.stderr.strip())
    headers = {'Accept': 'application/vnd.github+json', 'User-Agent': 'jev-survey-update'}
    if os.environ.get('GITHUB_TOKEN'):
        headers['Authorization'] = 'Bearer ' + os.environ['GITHUB_TOKEN']
    with urllib.request.urlopen(urllib.request.Request('https://api.github.com/' + path + query, headers=headers), timeout=60) as r:
        return json.loads(r.read())


def main():
    run_id = dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%dT%H%MZ')
    out_dir = ROOT / 'research' / 'increments' / run_id / 'github'
    out_dir.mkdir(parents=True, exist_ok=True)
    snap = sorted((ROOT / 'research').glob('snapshot-*'))[-1]
    known = {r['full_name'].lower() for r in json.loads((snap / 'github_discovery_compact.json').read_text())}
    for prev in (ROOT / 'research' / 'increments').glob('*/github/discovery.json'):
        if prev.parent != out_dir:
            known |= {r['full_name'].lower() for r in json.loads(prev.read_text())}

    log, seen = [], {}
    for q in QUERIES:
        page = 1
        while True:
            stamp = dt.datetime.now(dt.timezone.utc).isoformat()
            res = gh('search/repositories', {'q': q, 'per_page': 100, 'page': page})
            items = res.get('items', [])
            log.append(dict(query=q, page=page, total_count=res.get('total_count'), returned=len(items),
                            incomplete_results=res.get('incomplete_results'), retrieved_at_utc=stamp))
            for it in items:
                rec = seen.setdefault(it['full_name'].lower(), dict(
                    full_name=it['full_name'], html_url=it['html_url'], description=(it.get('description') or '')[:300],
                    created_at=it.get('created_at'), pushed_at=it.get('pushed_at'), stargazers_count=it.get('stargazers_count'),
                    fork=it.get('fork'), license=(it.get('license') or {}).get('spdx_id'), queries=[]))
                rec['queries'].append(q)
            print(f'{q!r} page {page}: {len(items)} / total {res.get("total_count")}', flush=True)
            if len(items) < 100 or page * 100 >= min(res.get('total_count') or 0, 1000):
                break
            page += 1
            time.sleep(2.5)  # search API: 30 requests / minute when authenticated
        time.sleep(2.5)

    new = [r for k, r in seen.items() if k not in known]
    watched = []
    for repo in WATCH:
        try:
            meta = gh(f'repos/{repo}')
            head = gh(f'repos/{repo}/commits', {'per_page': 1})[0]
            watched.append(dict(repo=repo, pushed_at=meta.get('pushed_at'), head=head['sha'],
                                head_date=head['commit']['committer']['date'], message=head['commit']['message'][:200]))
        except Exception as exc:
            watched.append(dict(repo=repo, error=str(exc)))
    summary = dict(run_id=run_id, queries=len(QUERIES), unique_results=len(seen), already_known=len(seen) - len(new),
                   new_unverified_candidates=len(new), status='unverified_discovery_candidates')
    (out_dir / 'search_log.json').write_text(json.dumps(log, indent=2))
    (out_dir / 'discovery.json').write_text(json.dumps(list(seen.values()), ensure_ascii=False, indent=1))
    (out_dir / 'new_candidates.json').write_text(json.dumps(sorted(new, key=lambda r: r['created_at'] or ''), ensure_ascii=False, indent=1))
    (out_dir / 'watched_repositories.json').write_text(json.dumps(watched, indent=2))
    (out_dir / 'summary.json').write_text(json.dumps(summary, indent=2))
    print(json.dumps(summary, indent=2))
    for w in watched:
        print(w)


if __name__ == '__main__':
    main()
