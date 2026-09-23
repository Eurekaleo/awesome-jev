# Notice: third-party material and provenance

This project reviews other people’s work. The MIT License in `LICENSE` covers only the original code; the CC BY 4.0 licence in `LICENSE-CONTENT.md` covers only original text, figures and curated records. The following remain under their owners’ terms.

| Material | Where it appears | Source and terms |
| --- | --- | --- |
| Titles, author lists, dates, categories and abstracts of arXiv papers | `data/papers.json`, `research/` | Retrieved from the arXiv API. arXiv’s [API Terms of Use](https://info.arxiv.org/help/api/tou.html) release descriptive metadata — explicitly including titles, abstracts, authors and identifiers — under CC0 1.0 (checked 23 September 2026). Abstracts stay in the data for provenance and are **not** displayed on the website, which shows original summaries and links to arXiv. |
| Paper PDFs and full texts | not included | Read locally from the research handoff package; never redistributed. Records link to arXiv instead. |
| Vendor documentation (TypeSafe AI) | summarised in `data/claims.json`, `data/sources.json`, the site and the paper | Facts are paraphrased with links and access dates. Snapshots used during the review live in the handoff package, not in this repository. “Jev”, “TypeSafe” and “System One” are names used by their owner; this project is independent and not affiliated with or endorsed by TypeSafe AI. |
| Facts from third-party GitHub repositories | `data/repositories.json`, `data/claims.json` | Taken from READMEs at pinned commits and cited by URL. Licence fields are GitHub’s detection (`NOASSERTION` = not identified, not “no licence”). |
| Prior survey draft “Decisions, Not Tokens” | discussed in `docs/related-surveys.md` | Cited and compared; no text reused. Apache-2.0 per its repository. |
| Design reference | visual language of the site | The site’s layout rhythm (dark hero, alternating editorial sections, tabbed atlas, reading room) is informed by the MIT-licensed project [Eurekaleo/awesome-ai-for-games](https://github.com/Eurekaleo/awesome-ai-for-games) at commit `5815804c`. All code, text, illustrations and data here are original to this project; no game-domain content, imagery or counts are reused. |
| Web fonts | loaded from Google Fonts | DM Sans, Space Grotesk and Instrument Serif are licensed under the SIL Open Font License. |

## Trademarks and affiliation

Product and project names belong to their respective owners. Naming a project (for example “OpenJev” or “Visual Jev”) does not imply that TypeSafe AI released or endorsed it, and this survey does not claim any affiliation.
