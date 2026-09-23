#!/usr/bin/env python3
"""Check every external link in data/*.json and index.html.

    python3 scripts/check-links.py [--out reports/link-check.json] [--warn-only]

Uses curl (HEAD, then a one-byte GET when HEAD is refused), follows redirects,
throttles per host (arXiv is checked sequentially with a pause), and writes a
JSON report. Exit status is 1 when a link is broken (4xx other than 401/403/429,
5xx, or no response), unless --warn-only.
"""
import argparse
import collections
import concurrent.futures as cf
import datetime as dt
import json
import pathlib
import re
import shutil
import subprocess
import sys
import threading
import time
from urllib.parse import urlparse

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import jevlib  # noqa: E402

UA = 'JevSurveyLinkCheck/1.0 (+academic survey maintenance)'
SLOW_HOSTS = {'arxiv.org': 3.2, 'export.arxiv.org': 3.2}
_locks = collections.defaultdict(threading.Lock)
_last = {}


def collect():
    d = jevlib.load_all()
    urls = collections.defaultdict(set)

    def add(u, where):
        if u and str(u).startswith(('http://', 'https://')):
            urls[str(u)].add(where)
    for p in d['papers']['papers']:
        add(p['url'], p['id'])
        for k in ('code', 'weights', 'data', 'predictions'):
            add(p['openness'][k].get('url'), p['id'])
    for c in d['claims']['claims']:
        add(c['source_url'], c['id'])
    for r in d['repositories']['repositories']:
        add(r.get('readme_url') or r['url'], r['id'])
    for s in d['sources']['sources']:
        add(s['url'], s['id'])
    for rs in d['review-relations']['related_surveys']:
        add(rs['url'], rs['id'])
    html = (jevlib.ROOT / 'index.html').read_text(encoding='utf-8')
    for u in re.findall(r'<a\s[^>]*href="(https?://[^"]+)"', html):  # anchors only; preconnect hints are not links
        add(u.replace('&amp;', '&'), 'index.html')
    return urls


def status(url):
    host = urlparse(url).netloc
    delay = SLOW_HOSTS.get(host, 0)
    with _locks[host] if delay else _locks['_none_' + url]:
        if delay:
            wait = _last.get(host, 0) + delay - time.time()
            if wait > 0:
                time.sleep(wait)
        codes = []
        for args in (['-I'], ['-r', '0-0']):
            out = subprocess.run(['curl', '-sS', '-o', '/dev/null', '-w', '%{http_code} %{url_effective}', '-L', '--max-time', '25', '-A', UA, *args, url],
                                 capture_output=True, text=True)
            code = int((out.stdout.split() or ['0'])[0]) if out.stdout else 0
            codes.append(code)
            if 200 <= code < 400:
                break
        if delay:
            _last[host] = time.time()
    final = max(codes) if all(c >= 400 or c == 0 for c in codes) else next(c for c in codes if 200 <= c < 400)
    return final


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default='reports/link-check.json')
    ap.add_argument('--warn-only', action='store_true')
    args = ap.parse_args()
    if not shutil.which('curl'):
        sys.exit('curl is required')
    urls = collect()
    results = {}
    with cf.ThreadPoolExecutor(max_workers=8) as ex:
        futs = {ex.submit(status, u): u for u in urls}
        for f in cf.as_completed(futs):
            results[futs[f]] = f.result()
    broken = {u: c for u, c in results.items() if c == 0 or (c >= 400 and c not in (401, 403, 429))}
    restricted = {u: c for u, c in results.items() if c in (401, 403, 429)}
    report = dict(checked_at=dt.datetime.now(dt.timezone.utc).isoformat(), total=len(results), ok=len(results) - len(broken) - len(restricted),
                  restricted=[dict(url=u, status=c, used_by=sorted(urls[u])) for u, c in sorted(restricted.items())],
                  broken=[dict(url=u, status=c, used_by=sorted(urls[u])) for u, c in sorted(broken.items())])
    out = jevlib.ROOT / args.out
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2) + '\n')
    print(f'{report["total"]} links: {report["ok"]} ok, {len(restricted)} restricted (401/403/429), {len(broken)} broken → {args.out}')
    for b in report['broken']:
        print('BROKEN', b['status'], b['url'], '←', ', '.join(b['used_by'][:3]))
    if broken and not args.warn_only:
        sys.exit(1)


if __name__ == '__main__':
    main()
