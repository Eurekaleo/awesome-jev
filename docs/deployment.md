# Running, building and publishing

The repository is <https://github.com/Eurekaleo/awesome-jev>. GitHub Pages serves the site from `main` (repository root) at <https://eurekaleo.github.io/awesome-jev/>. No DOI or archival copy exists yet.

## Run locally

```sh
git clone https://github.com/Eurekaleo/awesome-jev.git
cd awesome-jev
python3 -m http.server 8000      # then open http://localhost:8000
```

Opening `index.html` directly from disk also works for reading; the evidence drawer and exports need a server because they fetch `site/data/drawer.json`.

## Rebuild after editing data

```sh
python3 scripts/validate-data.py
python3 scripts/build.py            # index.html, README.md, docs, BibTeX, CSV, stats, paper/survey.md and LaTeX sources
python3 -m unittest discover -s tests
node --test tests/*.test.mjs        # optional; needs Node 18+
python3 scripts/measure.py --budget
python3 scripts/check-links.py      # network
```

Build the manuscript PDF (needs matplotlib and TeX Live with latexmk and XeLaTeX; fonts: TeX Gyre Pagella, Fira Sans, DejaVu Sans Mono):

```sh
python3 scripts/build-paper.py --pdf   # figures, survey.md, sections/*.tex, then latexmk -xelatex
```

## Publishing a change

Commit and push to `main`. The `quality` workflow validates the data, checks that every generated file is current, runs the Python and JavaScript unit tests and the page-weight budget; GitHub Pages redeploys the site from `main` automatically. `.nojekyll` is included so that all folders are served as-is.

## Settings in `site.config.json`

| Key | Used for |
| --- | --- |
| `site_url`, `repository_url` | canonical link and social image, the hero “Repository” button, contribution cards (issue forms), footer links, README and `CITATION.cff` |
| `authors` | the site byline and `<meta name="author">`, the README author line and BibTeX, the manuscript title block; `CITATION.cff` must list the same people (a unit test checks this) |
| `doi`, `arxiv_id` | leave `null` until they exist; the build never invents identifiers |

## Workflows

- `quality` — on every push and pull request (see above).
- `links` — weekly link check of every outgoing anchor on the page.
- `increment` — on demand: runs the literature update and uploads the results as an artifact for human screening. It never commits.

## Before each release

- Run a fresh increment and re-check the prior survey (`docs/related-surveys.md`, “remaining checks”).
- Bump the version together in `scripts/jevlib.py` (`VERSION`), `CITATION.cff` and `CHANGELOG.md`.
- Replace `assets/og-image.png` if a different social image is preferred.
