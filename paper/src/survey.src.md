# Jev and Typed Decision Models: An Empirical Survey of Calibration, Selective Control, and Open Implementations

::: meta
{{authors}} · Draft {{stat:version}} · Data cutoff {{stat:cutoff_long}} · Not peer-reviewed
:::

::: abstract
In September 2026 TypeSafe AI released Jev, a hosted "System One" model that answers typed questions about a text state with a probability distribution over declared options instead of generated text. Within a week a first wave of preprints evaluated it, built open alternatives and embedded it in judges, agents, annotation pipelines and edge systems. We review this evidence as it stood on {{stat:cutoff_long}}: {{stat:core}} core studies, {{stat:peripheral}} peripheral study and {{stat:background}} background references, extracted into {{stat:claims}} claim-level evidence records with locators, measurement scopes and sample sizes, plus an openness audit of {{stat:priority_repos}} implementation and evaluation resources. Seven findings emerge. A type-valid answer can still be wrong: rebinding option names to rubrics lowered hosted Jev's AUROC from .8146 to .5806 with zero type errors. A native probability makes calibration measurable, not guaranteed: reliability varies by task and construct, and recalibration on held-out labels helps. The most consistent use is a cheap first pass with confidence-gated escalation, whose value depends on thresholds set on separate data and on strong cheap baselines. Speed and cost figures come from incompatible measurement scopes. Open implementations reproduce the interface through at least six non-equivalent mechanisms, none of which establishes the commercial architecture. System-level gains need module-level attribution. And the evidence is young, clustered and unreplicated. We contribute a versioned evidence base, a synthesis that keeps incomparable numbers apart, an implementation and openness audit, and a proposed evaluation protocol. We compare the work with a prior public survey draft and make no priority claim.
:::

## Introduction

Many software decisions are small and bounded: route a ticket, accept or escalate a judgment, pick the next tool, code a variable from a narrative. Large language models can make such decisions, but they return strings that must be parsed, validated and retried, and their stated confidence is usually a verbalised estimate rather than a probability the program can threshold [@arxiv2207_05221; @arxiv2503_15850]. Typed decision models change the contract. The caller declares the admissible answers; the model returns one of them together with a probability for every option; no free text is generated, so a parse failure is impossible by construction.

TypeSafe AI's Jev, released in early access on 15 September 2026, made this contract prominent [@typesafe2026launch]. Its launch materials describe a "new class of frontier models" optimised with "Reinforcement Learning for Calibrated Decisions" and report end-to-end responses of 70–500 ms at $0.042 per million input tokens [@typesafe2026launch; @typesafe2026models]. Between 19 and 22 September 2026, thirteen arXiv preprints evaluated Jev, built open Jev-like models, or used typed decisions inside larger systems. The claims in this literature range from schema validity to calibration, cost, latency and end-task success; the measurement protocols range from 20 curated scientific choices to 499,500 crash narratives.

A public survey draft, *Decisions, Not Tokens*, dated 21 September 2026, already places typed decisions in the history of classification, calibration, selective prediction and routing, and proposes a five-dimensional taxonomy and four evaluation layers [@decisionsnottokens2026]. Its bibliography at the pinned commit contains none of the thirteen core preprints reviewed here. This survey therefore does something different: it is an **empirical survey and evidence audit** of the first wave, organised so that incomparable numbers stay apart.

We keep three objects distinct throughout: (A) the **commercial model**, TypeSafe's hosted Jev, whose architecture and training data are undisclosed; (B) the **paradigm**, Jev-like typed decision models and readouts built by others; and (C) **systems** whose results depend on typed decisions. A result about one is not evidence about another.

We ask six questions. **RQ1 (definition and lineage):** how do runtime-defined finite-option decisions relate to classifiers, zero-shot labelling, rerankers, reward models and constrained generation? **RQ2 (probability quality):** what do returned probabilities and confidence mean, and where do they hold? **RQ3 (efficiency attribution):** how much of a speed or cost gain comes from the readout, and how much from model size, batching, prefix sharing, caching or the network? **RQ4 (selective control):** which decisions can be delegated, and when should software escalate, abstain or defer to code? **RQ5 (robustness):** how do option names, order, rubric binding, missing options, language and distribution shift change decisions? **RQ6 (openness):** what do alternatives release, and how much of the literature survives a common protocol?

Our contributions are concrete artefacts rather than claims of priority:

1. A versioned evidence base of {{stat:papers}} references and {{stat:claims}} evidence records. Each record carries a source locator, evidence type, test level, measurement scope, sample size and model version, with explicit reasons where a value is missing (§3).
2. A synthesis into seven findings, each listing supporting *and* qualifying evidence (§7). Study families are synthesised once, and nothing is pooled across incompatible scopes.
3. An implementation lineage of six readout families and an openness audit that separates code, weights, data, raw predictions, recomputability and reproduction (§6, §9).
4. A catalogue of failure modes with sources and mitigations (§8), and a proposed evaluation protocol whose first experiment targets the intersection of name binding, calibration and escalation (§10).
5. A public website, generated README, BibTeX and CSV exports, all produced from the same data by scripts with validation and link checks.

## Scope, definitions and what is documented

### The interface

A caller sends a `state` (a string, JSON object or array of text values) and a map of typed questions; the model evaluates every question independently against the shared state and returns one answer per question [@typesafe2026state; @typesafe2026primitives]. Three primitives exist. A **Choice** selects among named options, each defined by a description; the answer includes the chosen option, a probability for every option and a `confidence` value. The launch post states support for up to 255 options, with a two-stage procedure for high cardinality [@typesafe2026launch]. A **Score** places the answer on two to ten ordered, described levels; it returns a position that may fall between levels, probabilities per level and `confidence`. The vendor warns against interpolating exact magnitudes from it [@typesafe2026jaggedness]. A **Noul** returns the probability that a yes/no proposition holds and carries no separate confidence [@typesafe2026primitives; @typesafe2026confidence].

At the cutoff the documented model was `jev-1.13.0`. The aliases `jev-latest` and `jev-preview` both pointed to it, and the vendor advises pinning the versioned ID when thresholds are tuned to a version [@typesafe2026models]. Input is text only; images, audio and video must first be converted to text or structured fields, and English is the primary training language [@typesafe2026models; @typesafe2026state]. Visual Jev and JEVQA, discussed below, do not change this: one is an independent model and the other feeds text features to hosted Jev.

### Probability semantics

Probabilities and confidence are different objects. The documentation defines `confidence` as a statistic computed from the returned distribution and recommends thresholds tested on the user's own data [@typesafe2026confidence]. The exact statistic is not specified in prose; an interactive demo on the documentation page computes a normalised maximum probability and labels it as how *that demo* computes confidence. We therefore do not treat the demo formula as the production implementation. Empirically, one study found that native confidence ranked items almost exactly like the maximum label probability (Spearman 0.948–0.999) [@arxiv2609_26550]. The vendor also states that calibration is measured across groups of predictions and does not guarantee that an individual answer is correct [@typesafe2026systemone]. Two independent sources observe that probabilities are returned on a 0.01 grid, which bounds calibration error for rare events from below and can put exactly zero on a correct answer [@arxiv2609_24052; @gh_scienthoon_jev_ood_calibration].

### What is not disclosed

The launch post names a new architecture, a parallel sampler and the RLCD training method, and the documentation says one set of weights serves every account without per-customer fine-tuning [@typesafe2026launch; @typesafe2026models]. The architecture, training data and objective are not published. Community reconstructions exist; Kev, for example, follows an architecture described in a third-party blog post. They remain speculation and are not evidence about the commercial model [@gh_jaredpalmer_kev].

### Vendor claims as hypotheses

The headline "193.6× faster, 444.6× cheaper" comes from the vendor's workflow evaluations. Their reference answers average two external frontier models; the vendor expects the gains to be at the high end of real-world use and notes that its own capabilities team wrote the workflows [@typesafe2026launch]. The plotted 0% type-error rate is described as analytical rather than empirical, and latency figures were measured from the vendor's West Coast laptops [@typesafe2026launch]. We record these as vendor claims, not as evaluations.

### Names that collide

Several names mean different things. TypeSafe's *System One* borrows Kahneman's System 1 metaphor, but System 1/2 reasoning literature predates the product and is broader [@arxiv2502_17419]. *RLCD* in the Jev context expands to Reinforcement Learning for Calibrated Decisions and is unrelated to RLCD, Reinforcement Learning from Contrastive Distillation (2023); one core study makes the same distinction [@arxiv2609_24574]. *OpenJev* names three different things: the former name of SemIf (a frozen-decoder readout), a DiffusionGemma server, and the "Open-Jev" of one paper's title (JevLite) [@gh_theoleecj_semif; @gh_razorback16_openjev; @arxiv2609_23959]. *Visual Jev* is independent research, not a TypeSafe release [@arxiv2609_25845]. One repository called a "synthetic survey" is a questionnaire experiment [@gh_jjd_lab_jev_synthetic_survey]. Adjacency in name implies neither the same algorithm nor copying.

## Review method

### Search

The snapshot of 23 September 2026 ran {{stat:arxiv_queries}} accepted arXiv API queries. They returned {{stat:arxiv_hits}} hits and {{stat:arxiv_screened}} unique records after de-duplication by unversioned arXiv ID (Appendix A). Queries combined the brand and interface vocabulary (`jev`, `typesafe`, "System One", "typed decision", "calibrated decisions") with open-model names, survey terms and a date-bounded "decision model" query. The last matters: arXiv `all:` searches metadata rather than full text, and it found a core study that brand-name queries missed [@arxiv2609_24574]. One compound query reported 1,232,608 results and was stopped by rate limiting; it was rejected rather than screened and replaced by narrow title/abstract queries. Six background references came from these queries and 38 more were retrieved by explicit ID as a purposive seed for theory and baselines.

A same-day increment re-ran all {{stat:arxiv_queries}} queries. The totals were identical. It then added {{stat:increment_queries}} expansion queries on interface vocabulary and open-model names; four were rejected by rule because the API parsed their phrases so loosely that they returned thousands of records. It screened {{stat:increment_new}} new records by title and abstract and added {{stat:increment_added}} as background references. No new core study appeared, which is expected: arXiv announces new submissions around 00:00 UTC. For repositories, five GitHub searches produced {{stat:github_discovery}} unique discovery results. From these we audited {{stat:catalogues}} catalogues and research guides ({{stat:readmes}} READMEs at pinned commits) and {{stat:priority_repos}} priority implementation and evaluation resources. The {{stat:outgoing_candidates}} outgoing links found in catalogue READMEs are kept as unverified candidates and never counted as projects.

### Eligibility

A study is **core** if it evaluates TypeSafe Jev, a clearly identified Jev-like typed-decision implementation, or a system whose contribution materially depends on such decisions. **Peripheral** studies fall within reach of the scope but rest on contested, self-reported claims; they stay visible but are not pooled. **Background** references are adjacent methods with a stated role. We excluded name matches (Japanese encephalitis, JEPA, unrelated uses of "TypeSafe", other expansions of RLCD) and generic System 1/2 work without a typed-decision link.

### Reading depth and extraction

We read the core and peripheral studies in full, checking key tables and limitation sections. Background references were checked against metadata and abstracts; one reranker paper was spot-checked in full [@arxiv2606_22807]. Repository evidence comes from READMEs at pinned commits and {{stat:source_files_read}} source files read in {{stat:source_repos_read}} repositories. Nothing was executed and no experiment was re-run.

Each checkable statement became an evidence record. A record stores its subject, text, headline and source locator, and an evidence type: author-reported experiment, vendor documentation, vendor-reported result, community report, or code/README inspection. It also stores the metric, value and baseline; the sample size, model version and hardware, each with a reason when unknown; the **test level** (model test, system test, hybrid, simulation); and the **measurement scope** (single request, amortized per question, batch, end to end, simulation, author estimate, vendor claim). Each record links to the findings of §7 as *supporting* or *qualifying* evidence. Openness is recorded as six independent fields per study: code visible, weights available, data available, raw predictions available, recomputable, independently reproduced.

### Synthesis and its limits

Tasks, metrics, binning and scopes are heterogeneous, so we pool nothing and rank nothing. Findings are stated at the strength their records allow, with qualifying records listed beside supporting ones. The two edge-orchestration studies share authors and a service path, so they form one study family [@arxiv2609_23136; @arxiv2609_22753]. The review was carried out by one AI-assisted reviewer and is not a registered or PRISMA-compliant systematic review; §12 lists what this implies.

## Related surveys and positioning

*Decisions, Not Tokens* treats machine-native decision models broadly, from classical classifiers to Jev [@decisionsnottokens2026]. It offers an operational definition, a five-dimensional taxonomy (output contract, inference mechanism, learning objective, uncertainty interface, system control), four evaluation layers and a fair replication protocol. We adopt its separation of structural validity, semantic correctness, probabilistic reliability and decision utility, and credit it for that framing. The differences are empirical and procedural. At its pinned commit the draft lists search sources and keyword families but publishes no query log or screening decisions, and it cites none of the thirteen core preprints. Its failure analysis is conceptual, and its figures are labelled conceptual illustrations. This survey adds the evidence records, a synthesis that keeps scopes apart, an implementation and openness audit, and a data pipeline that regenerates every table. A dimension-by-dimension comparison is maintained in the repository (`docs/related-surveys.md`). Because both documents are working drafts, the comparison describes pinned versions and may change.

Adjacent surveys cover uncertainty quantification and calibration in LLMs [@arxiv2503_15850], the move from System 1 to System 2 reasoning [@arxiv2502_17419], efficient reasoning under budgets [@arxiv2503_24377] and decision-focused learning [@arxiv2307_13565]. None of them addresses typed decision APIs. Community catalogues and evidence guides helped with discovery but are not evidence in themselves.

## Lineage and an analytical frame

### Lineages

Typed decisions recombine long-standing ideas. **Discriminative classification** with bidirectional encoders [@arxiv1810_04805; @arxiv2412_13663], few-shot classifiers [@arxiv2209_11055] and generalist lightweight classifiers [@arxiv2508_07662; @arxiv2311_08526] are the natural baselines, and zero-shot labelling via label descriptions anticipated runtime-defined options [@arxiv1909_00161]. Task-agnostic discriminative modules [@arxiv2306_07536] and domain probabilistic decision systems such as SalesRLAgent [@arxiv2503_23303] predate the product. They establish context, not shared architecture or priority. **Calibration** and temperature scaling [@arxiv1706_04599] and the failure of calibration under shift [@arxiv1906_02530] frame every probability claim, alongside the gap between models' self-knowledge and verbalised confidence [@arxiv2207_05221], semantic uncertainty [@arxiv2302_09664] and RL-trained confidence expression [@arxiv2503_02623]. **Selective prediction** [@arxiv1705_08500; @arxiv1901_09192], learning to defer [@arxiv2006_01862] and conformal methods [@arxiv2107_07511; @arxiv2310_05921] supply the theory of acting on confidence. Decision-aware calibration measures what matters downstream [@arxiv2404_13503; @arxiv2504_15582; @arxiv2511_13699; @arxiv2510_07750]. **Structured output** research shows that constrained decoding guarantees validity but not semantics [@arxiv2109_05093; @arxiv2307_09702; @arxiv2411_15100], that prefix sharing and scheduling yield their own speed-ups [@arxiv2312_07104], and that schema compliance and forced forms need their own benchmarks [@arxiv2501_10868; @arxiv2604_25359; @arxiv2607_20492]. **Judges and reward models** [@arxiv2306_05685; @arxiv2310_08491; @arxiv2403_13787], **routing and cascades** [@arxiv2305_05176; @arxiv2406_18665; @arxiv2601_07206; @arxiv2510_01237] and **label and format sensitivity** [@arxiv2309_04992; @arxiv2310_11324; @arxiv2608_08254] complete the background.

### Five places a claim can live

We read each study by where its claim sits on the path from a declared question to a workflow outcome (Table 1). This is an analytical organisation for comparing evidence. It is not the internal architecture of any model, and we do not claim it as the first such taxonomy.

{{table:stages}}

## Implementation families

Implementations share the request and response shape, not the mechanism that produces the probabilities. We distinguish six families by their readout (Table 2).

{{table:families}}

**Hosted service.** TypeSafe's Jev documents its interface, prices, limits, versions and known failure modes. It is observable only as a black box that can change behind aliases.

**Encoder decision heads.** Laya uses ModernBERT-large and mmBERT-base checkpoints with a router and reports 33 ms per question on a T4 in its README [@gh_nandhakishorm_laya]. The option-binding study audits two open encoder heads, one scoring a marker token and one mean-pooling the option span, and shows that readout geometry sets how much the option name can matter [@arxiv2609_26758].

**Frozen decoder readouts.** SemIf reads option-token probabilities from an unmodified open model and states that it reproduces the interface pattern, not Jev's model or training [@gh_theoleecj_semif]. AnyJev adds label-free permutation calibration. For a frozen Qwen3-8B on BANKING77 (n = 300) it reports that flips under option reversal fall from 0.230 to 0.073 and that the share of items decidable at ≤5% error rises from 7.7% to 52.0% with 100–500 labels [@gh_nokia_applied_research_anyjev]. These training-free readouts are the natural low-cost baseline for any trained decision model.

**Fine-tuned decoder models.** Kev (0.8B–9B, Qwen3.5 with LoRA and a pointer head), decider (Qwen3.5 2B/4B/35B), this-that-model-1.0 (adapted from decider-2b), NanoJev (0.6B), Bespoke Nimble (9B), JevLite and Visual Jev train a decoder so that a designated position yields calibrated option probabilities in one pass [@gh_jaredpalmer_kev; @gh_mapika_decider; @arxiv2609_23886; @gh_tianyucodings_nanojev; @gh_bespokelabsai_nimble; @arxiv2609_23959; @arxiv2609_25845]. Two same-backbone ablations locate the gain. JevLite's two-label readout decides 4.9× faster than the same Qwen3-4B fine-tuned to generate its answer [@arxiv2609_23959]. In Visual Jev, a matched typed head brings no consistent accuracy advantage over reading the LM head [@arxiv2609_25845]. Derived checkpoints are not independent methods: this-that-model's own paper records its lineage from decider-2b and its reuse of NanoJev's recorded cohort [@arxiv2609_23886].

**Diffusion structured reads.** djev and OpenJev seed a discrete diffusion model's canvas with the answer template and read each answer slot after one denoising step. They rely on request extensions proposed in an unmerged vLLM pull request and define their own confidence [@gh_mmastrac_djev; @gh_razorback16_openjev].

**Generative adapters.** TypeSafe's official adapter routes typed questions to general LLM APIs for comparisons [@gh_typesafe_ai_system_one_adapter_python]. LocalJev asks a model for JSON probabilities, then validates, retries and normalises them; its README calls the result wire-compatible but "not mathematically equivalent" to a logit read [@gh_githubnext_localjev].

The implication for RQ1 and RQ6 is direct. The interface can be reproduced by at least six mechanisms whose probabilities mean different things, and none of them reveals how the commercial model works.

## Evidence synthesis

### The evidence base

The thirteen core studies appeared over four days, beginning four days after the launch (Figure 1). Relationships overlap: {{stat:rel_commercial_core}} studies evaluate or use hosted Jev, {{stat:rel_independent_core}} build or evaluate independent Jev-like models, and {{stat:rel_downstream_core}} embed typed decisions in a larger system (Table 3). Of the {{stat:jev_querying}} studies that query hosted Jev, {{stat:jev_versioned}} state the version they called (`jev-1.13.0` or `jev-1.13`; one uses `typesafe/jev1.13` through OpenRouter [@arxiv2609_24574]) and {{stat:jev_unversioned}} state none. Every core study is an arXiv v1 preprint.

{{figure:timeline}}

{{table:core}}

### F1 · A type-valid answer can still be the wrong answer

Typed interfaces remove parse and schema failures by construction, and nothing more. In the most direct test, the authors held question, state, rubric wording and the set of option names fixed and changed only which name was bound to which rubric [@arxiv2609_26758]. For hosted Jev, rebinding the rubrics behind *no/yes* flipped 32.50% of answers, against 2.08% and 1.67% under neutral names. It lowered balanced accuracy from .7127 to .5163 and AUROC from .8146 to .5806 on 1,200 items. The swap produced 24× the model's test–retest floor, while the type-error rate stayed at 0% in every condition. The larger reversal in the abstract, AUROC .9376 → .2315, belongs to an open marker-readout head, not to Jev. That head is also where neutral renaming of multi-way options changed 52.42% of answers. Random character-string names returned flip rates to the neutral regime without costing accuracy, which suggests that polarity, not naming itself, drives the effect. Community audits add closed-set and primitive effects. Removing an abstain option drove accuracy on unanswerable items from 0.950 to 0.000 at 0.79 confidence, and a Noul and a two-option Choice over the same question differed by 0.125 on average [@gh_jujumilk3_jev_calibration_audit]. In a synthetic-panel study, the choice of primitive reversed a comparison with GPT-4.1 [@gh_jjd_lab_jev_synthetic_survey]. In agents, reliability depends on the size of the action set and on near-valid alternatives near authorisation boundaries [@arxiv2609_26532]. In scientific workflows, wrong selections changed derived counts while the final label stayed correct [@arxiv2609_24965]. The vendor's own list of weaknesses — literal reading, arithmetic, dates, indirection, large irrelevant state and adversarial text — points the same way [@typesafe2026jaggedness].

Two qualifications matter. Order is a different intervention from binding: one community audit saw no argmax flips in 400 order permutations on hosted Jev [@gh_jujumilk3_jev_calibration_audit], whereas frozen open readouts are order-sensitive until calibrated [@gh_nokia_applied_research_anyjev]. And the mitigations the authors propose (neutral identifiers, randomised names in training) have not been evaluated. Related work outside the Jev literature reaches the same conclusion from other directions: schema descriptions act as prompts [@arxiv2608_08254], forced forms invite invented answers [@arxiv2607_20492], and tool-using agents fail by binding the right action to the wrong entity [@arxiv2606_30531].

### F2 · A native probability makes calibration measurable, not guaranteed

Every call returns a distribution, so reliability can be audited on each run. Measured reliability varies. Across 15 computational-social-science tasks, Jev's median ECE was 0.157 (95% CI 0.108–0.233). That beat the verbalised confidence of 16 of 19 LLMs but not three frontier Claude models (best 0.066) [@arxiv2609_24574]. The same study shows how a global average hides a local failure: on empathy in peer-support dialogues the model was confident while near chance, a task ECE of 0.538. On crash narratives, probabilities ranked well but overstated prevalence. Recalibration fitted on half of 2,416 blinded human judgments cut calibration error by about 3.3×, and calibration varied by model rather than by paradigm [@arxiv2609_24052]. Community audits disagree across datasets. One pre-registered audit found ECE 0.0204 on CLINC150 and 0.0936 on Banking77 [@gh_jourdanlabs_assay_001]. Another found that a temperature of about 3.4 was needed on a task whose rule is not recoverable from the text [@gh_scienthoon_jev_ood_calibration]. A third found that a Spanish state cost 3.0–6.4 accuracy points and doubled ECE on the hardest tasks [@gh_marcosmartinez_jev_acento]. Open models show the same pattern: JevLite reaches calibration error .052 with a temperature-scaled two-label readout, but on synthetic calls and with a recipe chosen under test-set exposure [@arxiv2609_23959].

The qualifications are specific. Native confidence is essentially the maximum probability [@arxiv2609_26550], and the vendor presents calibration as a group property [@typesafe2026systemone]. The probabilities are quantised to two decimals [@arxiv2609_24052]. The background literature explains the rest: calibration degrades under shift [@arxiv1906_02530]; the ranking of confidence signals changes out of domain [@arxiv2608_19558]; answer-preserving attacks can move confidence readouts [@arxiv2608_06571]; and conformal certificates can fail under a change in how scores are produced [@arxiv2609_04445]. Calibration is therefore a property to verify per workload and per construct, with recalibration on held-out target labels. It is not a certificate.

### F3 · A bounded first pass with confidence-gated escalation

Across judging, annotation and agent control, the typed model is usually the cheapest and fastest component, and rarely the most accurate. As a judge, Jev stayed within three points of the strongest comparator (GPT-6 Astra) on ordinary preference and evidence-grounded factuality: 92.2% vs 93.5% on RewardBench and 87.5% vs 86.7% on HaluEval. A frozen two-order cascade kept 99% of the comparator's accuracy at 57% of its fee [@arxiv2609_26550]. In agent control, a Jev-gated agent reached 95% success with 1.12 strong-model calls per task against 88% and 4.10 calls for a strong-only agent [@arxiv2609_26532]. In annotation, Jev trailed the per-task best LLM on 14 of 15 tasks (median −11.6 macro-F1) at a median 44× lower cost. Routing its low-confidence items to an LLM matched or exceeded the LLM alone at a quarter to half of the cost [@arxiv2609_24574]. On crash narratives the typed model reached F1 0.908 against human labels, and one frontier model was 0.059 higher [@arxiv2609_24052].

Every one of these gains is conditional. Thresholds chosen on a selection set did not transfer for every fallback, and simulated cascade fees say nothing about real cascade latency [@arxiv2609_26550]. On BFCL and τ-style episodes, where ordinary routing is already accurate, a cheap generative cascade remained competitive [@arxiv2609_26532]. Trained feature models still beat zero-shot JEVQA on video quality [@arxiv2609_24395]. On multi-step arithmetic, an open typed model trails strong reasoning models [@arxiv2609_23886]. The prior art is also clear. Cascades and routers have long traded cost against quality [@arxiv2305_05176; @arxiv2406_18665; @arxiv2601_07206]. In one recent comparison a cheap trained ensemble beat every LLM configuration outright, and a hybrid escalated only its least-confident predictions to an LLM [@arxiv2609_17977]. The lesson for RQ4 is to include cheap trained and generative cascades as baselines, and to fix thresholds on data separate from the test set.

### F4 · Speed and cost claims decompose into different mechanisms and scopes

Speed figures in this literature measure different things (Table 4). Single-request latencies include 0.335 s median for scientific Choices [@arxiv2609_24965], 64.5 ms for JevLite on a consumer GPU [@arxiv2609_23959] and 30.9 ms for this-that-model on a laptop GPU [@arxiv2609_23886]. Visual Jev's 5.7 ms is amortized over 32 questions sharing one image: the batch takes about 182 ms [@arxiv2609_25845]. End-to-end figures include network, queueing and retries [@arxiv2609_26550; @arxiv2609_22753]. Electricity-only marginal cost excludes hardware and operations and cannot be compared with an API bill [@arxiv2609_23886]. Several mechanisms produce speed-ups: avoiding autoregressive decoding (JevLite's 4.9× on the same backbone), prefix sharing and batching (Visual Jev's 8.9× and 3.4×), and caching. Caching alone largely removed the latency advantage of Jev over a structured-output LLM in an edge service [@arxiv2609_22753]. Faster decisions did not raise end-to-end success: in a real image service reached over simulated radio access, Jev completed 459 of 1,080 requests correctly and on time, against 463 for DeepSeek [@arxiv2609_23136]. Serving systems explain part of the effect independently of the model [@arxiv2312_07104]. For RQ3 the answer is that no single speed or cost number describes a typed decision model; each figure is valid only within its scope.

{{table:scopes}}

### F5 · Interface compatibility is not mechanism equivalence

§6 established that the request and response shape can be served by encoders, frozen or fine-tuned decoders, diffusion reads and prompted generators. The evidence adds three points. First, readout matters more than a "typed head" label. JevLite's gain over generation comes from reading two label logits on the same backbone, and a ModernBERT encoder was not significantly worse [@arxiv2609_23959]; Visual Jev's typed head gave no consistent gain [@arxiv2609_25845]. Second, comparisons between open and commercial models are fragile. this-that-model's 0.941 vs Jev's 0.765 on a third party's 68 questions rests on 12 items, and its 0.844 vs 0.803 on 2,250 questions uses question shapes the open model was trained on [@arxiv2609_23886]. Third, several projects state explicitly that they do not reproduce the commercial model [@gh_theoleecj_semif; @gh_githubnext_localjev; @gh_jaredpalmer_kev]. Typed primitives with confidence-gated execution also appear independently in data systems [@arxiv2608_20630].

### F6 · System-level gains need module-level attribution

Systems improve for many reasons at once. Jev-Mem reports a LoCoMo judge score of 0.777 (+11.0% relative), memory construction in 158 s and 0.93 s per query. Each figure is measured against a different baseline, and the quality metric is itself an LLM judge [@arxiv2609_23986]. JEVQA's quality depends mainly on feature engineering: metadata-only PLCC 0.737 rose to 0.824 with bitstream and pixel features, while a pixel-only variant failed [@arxiv2609_24395]. The choice of reference matters as much as the model. Administrative crash codes understated narrative fidelity by a median 0.26 kappa [@arxiv2609_24052], and correct final labels concealed wrong intermediate quantities in scientific workflows [@arxiv2609_24965]. Attribution needs ablations, matched baselines and references that measure what the workflow reuses.

### F7 · The evidence is young, clustered and unreplicated

Thirteen core preprints appeared within four days, each as a single version (Figure 2). Two form one study family [@arxiv2609_23136; @arxiv2609_22753]. The hosted model is non-deterministic: the test–retest floor was up to 1.33% answer flips [@arxiv2609_26758], and 50 identical requests produced 15 distinct answers in one audit [@gh_jujumilk3_jev_calibration_audit]. Several comparisons rest on small or test-informed samples. The recipe selection in one study had test-set exposure [@arxiv2609_23959], and the 68-question comparison above rests on 12 items. The peripheral study reports "0.0% injection bypass" with a 95% interval up to 30.8% [@arxiv2609_25498]. The vendor's workflow evaluations use model outputs as references [@typesafe2026launch]. None of the core results has been independently reproduced, and several claimed releases of code and raw predictions could not be located (§9).

{{figure:matrix}}

## Reliability and failure modes

Table 5 collects the failure modes reported so far, the stage where each arises, its sources and a mitigation. Most mitigations are procedural rather than architectural. Use neutral identifiers and put meaning in rubrics; include an explicit abstain option; fix the primitive in the protocol; keep arithmetic, counting and date logic in code; evaluate in the deployment language; measure a test–retest floor; and score intermediate quantities. None has been tested at scale on hosted Jev.

{{table:failures}}

## Openness and reproducibility

Openness is not a single property (Table 6, Figure 3). Among the {{stat:core_plus}} core and peripheral studies, code was located in full for {{stat:open_code_available}}, in part or as a project page only for {{stat:open_code_partial}}, and claimed but not located for {{stat:open_code_claimed}}. Weights were located for {{stat:open_weights_available}} study, and raw predictions were fully available for {{stat:open_predictions_available}}. The two studies whose code and per-item data are claimed but unlocated could not be matched to a public package [@arxiv2609_26758; @arxiv2609_26550]. Data restrictions are sometimes legitimate: crash narratives cannot be redistributed under their data agreement [@arxiv2609_24052]. The best recomputable case is the CSS replication package with complete per-call records [@arxiv2609_24574]. Among repositories, weights and inference code are common for open models; training code, evaluation data and raw predictions are not. Licence fields reported by GitHub as `NOASSERTION` mean "not identified", not "no licence". We record "not located" rather than "absent" throughout.

{{figure:openness}}

{{table:openness}}

## A proposed evaluation protocol

No experiment is reported in this survey. The protocol below is proposed so that the open questions of §7 can be answered with comparable numbers.

**Tasks.** Six compact tracks: intent/semantic classification, pairwise judging, tool and model routing, narrative variable coding, sequential agent control, and open-set detection with an explicit unknown option. Visual inputs form a separate track, and text-only systems receive the same extracted features.

**Systems and baselines.** A majority/rule baseline; TF-IDF or embedding plus a linear classifier; SetFit, ModernBERT and GLiClass [@arxiv2209_11055; @arxiv2412_13663; @arxiv2508_07662]; frozen-LM option logits with and without permutation calibration; constrained JSON generation with the same backbone [@arxiv2411_15100]; open decision models; version-pinned hosted Jev; a strong LLM; and two cascades (cheap generative, Jev-gated). Supervised systems report their training data and cost.

**Metrics.** Accuracy or macro-F1 (invalid outputs counted as errors); NLL, Brier and ECE with a stated binning and bootstrap intervals, keeping Choice and Noul separate; risk–coverage curves, AURC and coverage at fixed risk, with thresholds and temperatures fitted on validation data only; flip rates under order permutation, name–rubric rebinding, neutral and random names, negation, a missing correct option and language variants, each against a test–retest floor; single-request p50/p95, amortized per-question time, throughput and end-to-end time as separate columns; API bills per correct decision, and hardware and energy reported separately.

**Splits and records.** Group splits and bootstraps by scenario or document, so that 577 turn-level decisions are never treated as 577 independent cases. For each item keep the input, schema, option order, full distribution, model ID and version, timestamp, errors, retries and cost. Register the analysis plan before running it.

**First experiment.** Name–rubric binding × native calibration × selective escalation on a fixed test set. Measure the base error under each binding. Then test whether low-confidence escalation catches the binding-induced errors, and at what cost. This directly asks whether structured, probabilistic errors are in fact easier to intercept (F1 × F2 × F3).

## Open problems

1. **Semantic invariance by design.** Train or calibrate readouts so that decisions follow rubrics rather than option-name polarity, and report name-invariance next to type-error rates.
2. **Per-construct reliability.** Identify, before deployment, the constructs and languages on which confidence is uninformative, using small labelled pilots and recalibration.
3. **Escalation that transfers.** Find threshold-selection rules that survive distribution shift and a change of fallback model, under explicit risk budgets [@arxiv2310_05921; @arxiv2107_07511].
4. **Joint consistency.** Questions are answered independently against a shared state; logical constraints across answers (exclusion, implication) are unchecked.
5. **Open-set decisions.** Closed option sets force errors when the right answer is missing; abstain options and out-of-set detection need standard tests.
6. **Adversarial confidence.** Confidence gates are attack surfaces [@arxiv2608_06571; @arxiv2609_04445]; evaluation should include manipulation of state text and options.
7. **Reproducible commercial evaluation.** Pinned versions, raw responses and dated repeats are needed to separate model drift from effects.
8. **Honest efficiency accounting.** Report the scope of every timing and cost figure and attribute gains to readout, batching, caching and network.

## Limitations

This survey was carried out by one AI-assisted reviewer, without a second independent screener or a registered protocol. Literature search used the arXiv API (metadata fields) and GitHub; other databases were not searched exhaustively. The cutoff is 23 September 2026, and the field changes daily. Background references were checked at abstract depth. Repositories were read, not executed. No result was reproduced, and every number is author-, vendor- or community-reported. The five stages and six families are an analytical organisation, not an architecture. Author names, DOI and publication status are intentionally unset.

## Conclusion

Typed decision models make an old requirement concrete: software needs answers it can parse, probabilities it can act on and a principled route to escalate when unsure. The first week of evidence on Jev shows that the first requirement is met by construction, the second must be verified per workload, and the third works as a first pass with carefully chosen thresholds rather than as a replacement for stronger models. The open ecosystem already reproduces the interface in several ways, which is a strength for research and a warning against reading any of them as the commercial model. The most useful next steps are not new leaderboards but version-pinned, same-protocol experiments that measure name invariance, calibration and escalation together, with raw predictions released.

## References

{{references}}

## Appendix A · Search queries

{{table:queries}}

## Appendix B · Evidence record fields

Each record in `data/claims.json` contains: `id`, `subject` (paper, repository or vendor source), `claim_text`, `headline`, `source_url`, `locator`, `evidence_type`, `reported_by`, `independently_reproduced` (false unless a public run log exists), `metric`, `value`, `unit`, `baseline`, `task`, `sample_size` (n and unit, or a reason), `model`, `model_version` (value or reason), `hardware` (value or reason), `test_level`, `measurement_scope`, `findings` (F1–F7 with relation), `limitations` and `note`.

## Appendix C · Corrections to the handoff notes

The audit corrected four details relative to the research notes it started from. (1) The community calibration audit ran about 7,000 API calls in seven experiments; 11,759 is the size of a source dataset. (2) The 6G study's "real service" was reached over simulated New Radio access and is recorded as a hybrid test. (3) The this-that-model weights live at `flock-io/this-that-model-1.0`; the PDF text shows a line-break artefact. (4) Jev versions were recorded as stated in each paper, including three studies that state none.
