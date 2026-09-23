# Changelog

All notable changes to the data, site and manuscript. Dates are UTC.

## 0.1.0 — 2026-09-23 · first public-ready draft

- Canonical data bootstrapped from the 2026-09-23 research snapshot: 13 core, 1 peripheral and 44 background records, with every snapshot field preserved under `source_record`.
- Same-day arXiv increment (`research/increments/2026-09-23T0818Z`): the 17 accepted queries reproduced the snapshot totals exactly; 19 expansion queries (4 rejected as implausibly broad); 128 new records screened, 9 added as background references.
- GitHub increment: 28 new unverified discovery candidates, none added; the prior survey draft and the official SDK heads were unchanged.
- 62 claim-level evidence records with locators, measurement scope, sample size, model version and links to seven cross-cutting findings.
- Corrections relative to the handoff notes: `jev-calibration-audit` ran about 7,000 API calls in seven experiments (11,759 is the size of a source dataset); the 6G study’s “real service” used simulated New Radio access; the this-that-model weights live at `flock-io/this-that-model-1.0` (the PDF text shows a line-break artefact).
- Static website, generated README, BibTeX, safe CSV exports, validation and link-check scripts, CI workflow and issue templates.
- Author and licences confirmed: Meng Luo (<https://eurekaleo.github.io/>); code under the MIT License, original text, figures and data under CC BY 4.0 (`LICENSE-CONTENT.md`). arXiv metadata, including abstracts, is CC0 under arXiv’s API Terms of Use. Published as [Eurekaleo/awesome-jev-survey](https://github.com/Eurekaleo/awesome-jev-survey) with GitHub Pages.
