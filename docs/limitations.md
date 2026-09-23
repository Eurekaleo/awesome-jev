# Limitations

What this release can and cannot support, stated plainly so that nothing downstream overstates it.

## The review process

- **One AI-assisted reviewer.** Screening, extraction and synthesis were done by a single AI-assisted workflow. There is no second independent screener, no inter-rater agreement and no registered protocol; this is not a PRISMA-compliant systematic review. Before submission, a second person should re-screen the 197 + 128 arXiv records and re-extract the core evidence records.
- **Search coverage.** arXiv `all:` queries search metadata, not full text; the snapshot and the same-day increment use the arXiv API only for literature. Scopus, Web of Science, ACL Anthology, OpenReview and Google Scholar were not searched exhaustively. Absence from the results is not evidence of absence.
- **Timing.** The cutoff is 23 September 2026 (Asia/Singapore). The core literature appeared between 19 and 22 September 2026; new preprints are likely within days. arXiv announces around 00:00 UTC, so the same-day increment mostly verified the snapshot.
- **Background depth.** The 53 background references were checked against metadata and abstracts (one spot-checked in full text); they support framing and baselines, not detailed claims.
- **Repositories.** README files at pinned commits and 12 selected source files were read. Nothing was installed or executed. Repository claims are the maintainers’ own and are labelled as community reports.

## The evidence

- **Nothing was reproduced.** Every number is author-, vendor- or community-reported. `independently_reproduced` is false everywhere, and the validator refuses `true` without a public run log.
- **Single versions.** All core studies are arXiv v1 preprints; results may change in later versions. Several do not pin the Jev version they called.
- **Clustering.** Two core studies share authors and a service path and are synthesised as one family. Others share benchmarks (RewardBench, LoCoMo) or base models (Qwen, ModernBERT); these overlaps limit independence.
- **Heterogeneity.** Tasks, metrics, bins, sample sizes and measurement scopes differ. The survey therefore does not pool effects or rank systems; charts that look comparable (scope groups, matrices) are organised to prevent pooling.
- **Hosted-model drift.** Hosted Jev is non-deterministic and can change behind aliases; black-box results describe a model at a point in time.
- **Vendor material.** Documentation and launch posts are used for what the interface is and what the vendor claims; they are never treated as independent evaluation.

## The artefacts

- **Illustrative explainers.** The website’s interactive panels labelled *Illustrative* use hand-made or simulated numbers. They explain mechanisms; they are not measurements.
- **Taxonomy.** The five stages and six readout families are an analytical organisation for this survey. They are not the architecture of any commercial model and are not claimed as the first such taxonomy.
- **Licences and identity.** The code licence is MIT; the licence for original text and data (CC BY 4.0) is proposed and awaits confirmation. Author names, affiliations, DOI and publication status are intentionally unset.
- **Performance figures.** Page-weight numbers are static byte counts from `scripts/measure.py`; no Lighthouse score or field Core Web Vitals were collected.
