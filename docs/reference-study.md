# Reference study: what we learned from the AI for Games site, and what we changed

Observed on 23 September 2026. Two sources, kept apart:

- **Live site** (the user-specified visual reference): <https://ai-for-games-research.danielhzlin.chatgpt.site/>, viewed in a browser at about 800 px and 1440 px widths.
- **Pinned source** (engineering reference): [Eurekaleo/awesome-ai-for-games](https://github.com/Eurekaleo/awesome-ai-for-games) at commit `5815804c192984a9c37d2d0afbe92c6bd83f5651` (MIT), copied into the handoff package.

The two are not the same deployment. On the day of review the live site showed **421 references**, “Enter the survey map / Browse the literature” buttons, **six** playable worlds and no author block at the top; the pinned source renders **445 references**, “Read the paper / Explore the survey map” buttons, **nine** worlds, an authors section and an introduction video. None of these game-domain numbers, names or credits is used in this project.

## What the reference does well

| Observed | Where | Why it works |
| --- | --- | --- |
| A dark, scene-setting hero: thesis and actions on the left, a large concept visual on the right, compact counts along the bottom | live site; `index.html` | The reader gets the claim, the object and the scale before scrolling. |
| Alternating dark and near-white sections with a narrow left label column, large display headings with a serif-italic tail, generous white space | live site; `site/guide.css` tokens (`--night #10131b`, `--orange #f39a57`, `--teal #9bd7d3`, `--paper #f9fbfb`, DM Sans / Space Grotesk / Instrument Serif) | Editorial rhythm; long reading without fatigue. |
| A reading path: overview → organising map → tabbed atlas → cross-cutting discussion → evidence → reading room → contribute | live site | Moves from concepts to evidence to sources. |
| Each category explains output, applications, main claim, chapter structure, synthesis and anchors | role atlas | Categories are arguments, not lists. |
| A searchable reading room with category counts, year filter, reset, empty state, paging and BibTeX | `site/guide.js`, `site/catalog.mjs` | Direct access to sources. |
| Data-driven counts, README rendering, reference sync and quality checks in CI | `tools/*.mjs`, `.github/workflows/quality.yml` | The site, README and bibliography agree. |
| Accessibility: skip link, visible focus, tab roles with arrow keys, reduced motion, lazy images | source | A professional baseline. |

## What we kept, and what we rebuilt for Jev

| Kept (adapted) | Rebuilt as Jev-specific content |
| --- | --- |
| Palette family (charcoal, warm orange, pale teal, near-white) and the three-typeface editorial system | Tokens re-derived for Jev; chart colours come from a separately validated categorical palette (colour-blind checks run with the dataviz validator) |
| Dark hero with concept visual | Original SVG: state → typed questions (Choice / Score / Noul) → distributions → confidence gate → act or escalate, labelled “schematic, not measured” |
| Organising map with repeated questions | Five stages where a claim can live (contract, readout, probability, control, use) and six research questions — not six roles, and not the vendor’s architecture |
| Tabbed atlas | Six readout families (hosted service, encoder heads, frozen decoder readout, fine-tuned decoders, diffusion reads, generative adapters) with mechanism strips, disclosure limits and pinned repositories with availability glyphs |
| Cross-role discussion | Seven findings with supporting *and* qualifying evidence records, a study × finding matrix and a “numbers that cannot share a leaderboard” scope grid |
| Playable games | Four labelled explainers (name vs rubric, confidence summaries, calibration, forced choice) and a synthetic escalation explorer — every panel marked *Illustrative* or *Reported* |
| Projects in view | Open-ecosystem matrix of 30 resources × 7 availability fields, lineage and name-collision cards, and catalogue denominators (4,666 links shown as unverified) |
| Reading room | Tier, stage, family, relationship, topic, openness and year facets; evidence drawer with claims, versions and six openness fields; BibTeX / CSV / JSON exports; URL state |
| Node build tools | A Python standard-library pipeline (validate, build, README, docs, BibTeX, safe CSV, link check, page-weight budget, increments) — chosen because the same scripts also drive the literature increments |

## Deliberately not copied

The six game roles, castles and game worlds, playable games, the 421/445 counts, author and affiliation lists, the introduction video, the game-survey PDF and any game-domain citation. Tests in `tests/test_data.py` fail if game-domain strings reappear in the built page.
