# Search and screening protocol / 检索记录

## Snapshot and scope

- Cutoff: 2026-09-23, Asia/Singapore. Individual API retrieval timestamps are UTC and are retained in raw JSON logs.
- Scope: TypeSafe Jev and directly related finite-option typed decision models; commercial-model evaluations, explicitly related open models, and systems making material use of them.
- Evidence types are separate: arXiv preprints, official documentation/claims, public code, community evaluation, and directory/discovery links.
- Review was conducted by one AI-assisted research workflow. This is not a registered review, duplicate independent screening, or a completed PRISMA-compliant systematic review.

## arXiv queries actually executed and accepted

| ID | 实际执行检索式 | 返回记录 |
| --- | --- | --- |
| Q01_jev | `all:jev` | 14 |
| Q02_typesafe | `all:typesafe` | 5 |
| Q03_system_one | `all:"System One" AND submittedDate:[202601010000 TO 202609232359]` | 84 |
| Q04_typed_decision | `all:"typed decision"` | 20 |
| Q05_calibrated_decisions | `all:"calibrated decisions"` | 46 |
| Q06_jevqa | `all:jevqa` | 1 |
| Q07_jev_survey | `(all:jev OR all:typesafe OR all:"System One") AND (ti:survey OR ti:review)` | 25 |
| Q08_decision_survey | `(all:"decision model" OR all:"decision models") AND (ti:survey OR ti:review) AND submittedDate:[202501010000 TO 202609232359]` | 5 |
| Q09_rlcd | `all:RLCD AND (cat:cs.AI OR cat:cs.CL OR cat:cs.LG)` | 2 |
| Q10_recent_decision_models | `(ti:"decision model" OR abs:"decision model" OR abs:"decision-only" OR abs:"typed decisions" OR abs:"typed questions") AND submittedDate:[202609140000 TO 202609232359]` | 12 |
| Q11_recent_systemone | `(all:"system-one" OR all:systemone OR all:"TypeSafe AI") AND submittedDate:[202609140000 TO 202609232359]` | 6 |
| Q12a_openjev | `ti:openjev OR abs:openjev` |  |
| Q12b_nanojev | `ti:nanojev OR abs:nanojev` |  |
| Q12c_jevlite | `ti:jevlite OR abs:jevlite` | 1 |
| Q12d_jevlike | `ti:jevlike OR abs:jevlike` |  |
| Q13_rlcd_expanded | `all:"Reinforcement Learning for Calibrated Decisions"` |  |
| Q14_typed_surveys | `(ti:survey OR ti:review OR ti:overview) AND (all:"typed decision" OR all:"decision-only" OR all:"non-generative") AND submittedDate:[202001010000 TO 202609232359]` | 4 |

Accepted queries: **17**. Returned records before de-duplication: **225**. Unique metadata records screened: **197**. De-duplication key is the unversioned arXiv ID; retrieved version IDs, titles, authors, dates, URLs, categories and abstracts are preserved.

The accepted query pool contains 13 core papers, 1 peripheral paper, 6 selected background records, and 177 records outside the core scope. The final bibliography adds purposefully selected background records, yielding **58 = 13 core + 1 peripheral + 44 background**. These additional background references were retrieved by explicit ID and checked against arXiv metadata; they are not represented as discoveries from the 17 keyword queries. Do not confuse the two denominators.

Sources: [search_log.json](search_log.json), [supplement_log.json](supplement_log.json), [screening_log.csv](screening_log.csv), `sources/api/*.xml`. `all:` searches arXiv metadata fields, not all PDF body text. A broader recent decision-model query found 2609.24574, which was absent from `all:jev`.

### Rejected query / recovery

The initial compound open-variant query returned an implausible total of 1,232,608 records, fetched 400 and then encountered HTTP 429. That result was rejected rather than screened or counted. The exact original query and response metadata remain in `supplement_log_initial_with_rejected_query.json`, with the corresponding raw XML. It was replaced by four separate title/abstract searches (Q12a–d) and the corrected supplement log. The corrected script aborts if a narrow supplementary query reports over 10,000 results. This anomaly limits confidence in unsupported arXiv phrase syntax; the accepted logs report complete result pages for their returned totals.

### Inclusion/exclusion and reading depth

Include as core when the paper studies TypeSafe Jev, a clearly identified Jev-like typed decision implementation, or a system whose contribution materially depends on these decisions. Exclude author-name matches, Japanese encephalitis/JEPA, unrelated TypeSafe/Scala uses, generic System 1/2 studies with no direct Jev relationship, and RLCD acronym collisions from the core set. Related methods may still be selected for the historical background.

Titles were screened across the query pool; abstracts and full text were checked for potentially relevant and retained records. Thirteen core papers and the peripheral paper were read in PDF/text form with focused table and limitation checks. KaLM-Reranker was spot-checked in full text. Background reading otherwise means metadata/abstract verification. Two diagnostic PDF pages were rendered and visually checked (option-binding paper and Visual Jev) to verify table layout. No model experiments were rerun.

The two edge-service papers 2609.23136 and 2609.22753 share an author group and related service paths; they are tagged as one study family for synthesis. Metadata version histories and concurrent online services can change; report exact versions, not merely unversioned links, in an eventual review.

## GitHub discovery and source audit

| GitHub 查询 | 页数 | 返回条目（未去重） | API total_count |
| --- | --- | --- | --- |
| awesome jev in:name fork:true | 9 | 870 | 870 |
| awesome typesafe in:name fork:true | 3 | 236 | 236 |
| jev survey in:name,description | 1 | 6 | 6 |
| jev papers in:name,description | 1 | 11 | 11 |
| jev research in:name,description | 2 | 108 | 108 |

The 5 searches yielded **1,082 unique repository discovery records** at this snapshot; all fetched pages reported `incomplete_results=false`. Search results were paginated (100/page), and no query exceeded GitHub's 1,000-result window. Search indices and repositories can change while paging; the saved query totals, not a future live count, define this snapshot.

From these results, 79 catalogue candidates were selected for apparent topic relevance and non-fork status, with two additional research guides, producing an **81-item targeted audit**, not a statistically representative sample. Of these, 79 README snapshots were fetched; two empty repositories returned HTTP 409. Every successful audit retained a commit-pinned README URL, SHA256, metadata and extraction of GitHub links/arXiv IDs. Selection files preserve the actual inventory.

Outgoing repository names were normalized to lowercase and de-duplicated. The 81 known catalogue/research-guide identities were removed from outgoing sets. This yields **793 candidates** for hellogumbo/awesome-jev and **4,666 candidates** across all audited README files. Intersection and set difference against the seed define the overlap columns. These are not validated implementations. README counts omit links held only in other files or an external website, and may include non-Jev infrastructure/baselines.

An additional priority audit covers 30 distinct implementation/evaluation resources, two already included in the 81. Selected source-code reading covers 12 files in 10 repositories. Three initial official-repo probes used the wrong owner `TypeSafeAI` and returned 404; corrected repositories under `typesafe-ai` were retrieved and are the ones included in the valid priority table. Failed probes remain in the raw audit for transparency.

## Complementary source verification

Web discovery and source-following supplemented the API search: official TypeSafe launch/docs, exact paper titles and author code links, Jev survey/review terms, open-model names and existing directories. Those adaptive searches do not have a stable or exportable screening denominator and are not included in the 197-record arXiv count. No claim is made that Scopus, Web of Science or Google Scholar was exhaustively searched.

Official documentation snapshots are in `sources/official/`. The prior public survey's README, TeX/Chinese manuscript, bibliography, CITATION.cff and manuscript commit history are in `sources/github/youzizzz1028__Awesome-Jev/`. A Git timestamp is not independent evidence of first public disclosure. An absent search result is not evidence of absolute nonexistence.

## Updating and validating

1. Copy this pack into a new dated directory before rerunning collectors; the scripts overwrite current-date output filenames.
2. Update date ranges in `scripts/collect_arxiv.py` and `scripts/supplement_arxiv.py`; run sequentially and honor endpoint rate limits.
3. Rerun GitHub discovery and explicit priority lists with `scripts/collect_github.py`; review new results rather than inheriting inclusion decisions automatically.
4. Update annotations and fixed-version references after comparing new PDFs; then run `python3 scripts/build_pack.py`.
5. Before claiming novelty, perform another exact-title/survey search and manually inspect the competing draft's changes. Add a second independent reviewer for final eligibility and extraction.

The generated `manifest.json` records artifact sizes and SHA256 hashes for integrity. It cannot prove content accuracy, historical public availability, or experimental reproducibility.
