---
purpose: Define deterministic rules for scoring, ranking, selecting, and
  presenting startup and technology news in a Europe-wide daily edition.
status: implementation_specification
title: European Tech Story Scoring, Selection, and Presentation Engine
version: 1
---

# European Tech Story Scoring, Selection, and Presentation Engine

## 1. Purpose and scope

Implement the ranking and editorial-selection layer for an existing
European startup and technology news application.

The application already collects stories and performs deduplication.
**Do not rebuild or replace ingestion, source discovery, or
deduplication.** Consume the existing deduplicated story/event records
and refine only:

1.  Story scoring.
2.  Candidate eligibility and quality gating.
3.  Diversity-aware ranking and selection.
4.  Daily edition sizing, ordering, and story tiers.
5.  Presentation fields and concise explanations.
6.  Ranking-quality metrics, logging, and tests.

The goal is to help people across Europe's startup and technology
ecosystem understand the most consequential developments from the last
24 hours, including stories that are important locally but may not be
widely covered internationally.

This is not a personalised feed in the first release. All readers
receive the same Europe-wide edition for a given edition timestamp and
configuration.

### Product principles

-   Maximise meaningful information, not article volume.
-   Prefer stories with real business, technology, or ecosystem impact.
-   Reward freshness without allowing trivial breaking news to dominate.
-   Avoid country, source, language, company-brand, funding, or topic
    concentration.
-   Include important smaller-market and emerging-sector stories when
    they are genuinely useful.
-   Never fill the edition with weak stories simply to reach the
    maximum.
-   Make ranking decisions explainable and auditable.
-   Preserve uncertainty; do not invent facts or treat promotional
    claims as verified facts.

## 2. Explicit non-goals

Do not implement these as part of this change:

-   Article crawling, source discovery, or ingestion.
-   Story/event deduplication or clustering; this already exists.
-   Personalisation, user profiles, user-specific ranking, or individual
    preferences.
-   Replacing the existing database or rewriting unrelated product
    architecture.
-   A black-box model whose scores cannot be inspected.
-   Popularity ranking based primarily on clicks, social mentions, or
    article counts.
-   Fixed quotas that force low-quality stories from every country or
    topic.
-   New external APIs or paid services unless the existing application
    already uses them or implementation is explicitly approved.

First inspect the current codebase and data model. Reuse existing fields
and services where practical. Do not assume fields exist simply because
they are described below; map them to the existing schema and document
any necessary minimal additions.

## 3. Daily edition contract

### 3.1 Edition window

-   Default edition window: the rolling 24 hours ending at a single
    `edition_as_of` timestamp.
-   Calculate timestamps in UTC. Convert to a reader's local timezone
    only for display.
-   Use a half-open interval:
    `edition_as_of - 24 hours <= published_at <= edition_as_of`.
-   `edition_as_of` must be fixed for a ranking run so all candidates
    are evaluated against the same cutoff.
-   Use the best available trustworthy original publication timestamp.
    Do not substitute `updated_at` for `published_at`.
-   An article updated during the window is eligible only if it contains
    material new information during the window and the existing data
    model can establish that fact. Otherwise, use its original
    publication time.
-   If the timestamp is missing, malformed, in the future beyond a small
    configurable clock-skew tolerance, or not trustworthy, do not
    silently assign freshness. Exclude it from the main ranked edition
    or route it to an existing review mechanism.
-   The ranking layer consumes the existing deduplicated story/event
    object. It must not create multiple edition entries for different
    articles about the same event.

### 3.2 Edition size

-   Default target: 25 stories.
-   Hard maximum: 30 stories.
-   Never return more than 30 stories in one edition.
-   Return fewer stories when fewer candidates pass the quality
    threshold.
-   A configurable target between 20 and 30 may be supported, but the
    hard cap remains 30.
-   Do not add weak stories just to fill the target.
-   The same event must appear no more than once in the edition.

### 3.3 Stable ranking

-   Given the same input snapshot, configuration, and `edition_as_of`,
    results should be deterministic.
-   Resolve ties using, in order: higher intrinsic score, higher
    evidence confidence, greater freshness, higher marginal diversity
    contribution, then a stable story/event ID.
-   Store the scoring configuration version and ranking run timestamp
    with the edition.

## 4. Story scoring model

Each candidate receives six independent dimension scores, each on a
0--100 scale. Compute an intrinsic score before applying selection
diversity.

  ------------------------------------------------------------------------
  Dimension                                   Weight What to assess
  --------------------- ---------------------------- ---------------------
  Economic and business                          25% Capital deployed,
  impact                                             commercial scale,
                                                     strategic
                                                     transactions,
                                                     customers, jobs,
                                                     market consequences,
                                                     or material business
                                                     risk

  Technology and                                 20% Technical novelty,
  strategic                                          defensibility,
  significance                                       infrastructure,
                                                     capability,
                                                     scientific progress,
                                                     and relevance to
                                                     Europe's
                                                     technological
                                                     capacity

  Novelty and                                    15% Whether the
  information value                                  information is new,
                                                     unexpected,
                                                     exclusive, materially
                                                     changes
                                                     understanding, or
                                                     provides original
                                                     evidence

  Ecosystem                                      15% Implications for
  significance                                       founders, investors,
                                                     talent, competition,
                                                     multiple companies,
                                                     sectors, countries,
                                                     or the European
                                                     ecosystem

  Freshness                                      15% Recency of the
                                                     underlying news,
                                                     using the freshness
                                                     formula in Section 5

  Evidence and source                            10% Original reporting,
  confidence                                         primary evidence,
                                                     named sources,
                                                     corroboration,
                                                     factual clarity, and
                                                     transparent
                                                     attribution
  ------------------------------------------------------------------------

Formula:

`intrinsic_score = 0.25*economic_impact + 0.20*technology_significance + 0.15*novelty + 0.15*ecosystem_significance + 0.15*freshness + 0.10*evidence_confidence`

The result is between 0 and 100. Keep the unrounded value internally;
round only for display.

### 4.1 Dimension scoring anchors

Use consistent scoring anchors across stories and countries:

-   **0--19: Negligible** --- little demonstrated relevance or
    information value.
-   **20--39: Low** --- narrow, routine, weakly evidenced, or relevant
    mainly to a small audience.
-   **40--59: Moderate** --- credible and useful development with
    meaningful but limited implications.
-   **60--79: High** --- material business, technical, or ecosystem
    significance.
-   **80--94: Very high** --- major development with substantial
    implications across a company, sector, or multiple markets.
-   **95--100: Exceptional** --- rare, potentially ecosystem-shaping
    event with strong evidence.

A score of 80+ should be uncommon and supported by an explicit
rationale. Avoid giving all dimensions a high score because a story
feels impressive overall.

### 4.2 Economic and business impact (25%)

Consider: - Funding amount, financing type, stage, and use of proceeds,
when known. - Funding amount relative to company stage and sector. -
Acquisitions, exits, mergers, major investments, insolvencies, and
restructurings. - Verified customer wins, deployments, commercial scale,
revenue, or market expansion. - Impact on competition, jobs, supply
chains, or business viability. - Strategic importance of the investor,
buyer, customer, or partner when relevant to the event.

Funding rules: - Do not rank solely on absolute amount. - Apply
diminishing returns to amount, such as logarithmic scaling. - Compare
funding with recent rounds at a similar stage and in a similar sector
when reliable reference data exists. - Distinguish equity, debt, grants,
secondary transactions, commitments, and acquisition consideration. Do
not treat them as interchangeable. - Do not infer undisclosed round
size, valuation, revenue, or investor participation. - A small first
institutional round can be meaningful in context; a large routine
follow-on should not automatically dominate. - Investor reputation is
contextual evidence, not proof that a company's claims are true.

### 4.3 Technology and strategic significance (20%)

Consider: - Technical novelty and credible evidence of capability. -
Progress toward commercial deployment or repeatable use. - Strategic
infrastructure and enabling technologies. - Relevance to AI, software,
industrial technology, robotics, chips, energy, climate, mobility,
space, biotech, cybersecurity, quantum, or other significant sectors. -
Implications for European competitiveness or resilience where supported
by evidence.

Do not score a story highly merely because it uses fashionable terms
such as AI, quantum, climate, or deeptech. Assess the underlying
development.

### 4.4 Novelty and information value (15%)

High scores require genuinely new information, not simply a well-written
article.

Reward: - Original interviews, documents, data, investigations, or
exclusive reporting. - Material changes to a company's strategy, status,
technology, financing, or market. - Surprising developments that change
the reader's understanding. - First credible reporting of an event,
where it adds meaningful information.

Lower scores for: - Routine announcements with little consequence. -
Commentary that contains no new evidence. - Rewrites of already-known
information. - Articles that merely repeat a press release without added
reporting.

The event's novelty and the article's originality are related but
distinct. An important event can be new even if first announced by a
company; the evidence-confidence score must still reflect the source's
interested-party status.

### 4.5 Ecosystem significance (15%)

Assess who may be affected: - One company or a narrow customer group. -
A meaningful sector, founder community, investor network, or talent
market. - Multiple companies, sectors, or countries. - European
technology capacity, competition, capital availability, or policy.

Reward credible local stories with lessons that other European founders,
operators, or investors can use. Do not award a high score just because
a story is geographically unusual.

### 4.6 Evidence and source confidence (10%)

Assess the evidence supporting the material claims: - Original reporting
with named sources or direct documents. - Official company, investor,
regulator, or institutional announcements. - Independent confirmation by
a credible newsroom. - Clear distinction between fact, estimate,
prediction, and interested-party claim. - Specificity and traceability
of claims.

Indicative anchors: - **90--100:** Strong original reporting or primary
documentation, with material claims well supported and independently
corroborated where appropriate. - **75--89:** Credible direct reporting
or official announcement with clear provenance; no major unresolved
contradiction. - **55--74:** Plausible report with partial sourcing or
limited independent confirmation. - **30--54:** Mostly promotional,
anonymous without adequate context, or materially incomplete. -
**0--29:** Unverifiable, misleading, contradictory, or lacking credible
evidence.

Primary sources are authoritative about what they themselves announced,
but not necessarily about outcomes or promotional claims. A press
release can score well on evidence for the existence and terms of an
announcement while still receiving low novelty or modest impact scores.

If a story's central material claim is contradicted by credible
evidence, route it to review or exclude it from the main edition until
resolved.

## 5. Freshness scoring

Freshness is both an eligibility gate and one scoring dimension. Avoid
adding another full freshness bonus elsewhere in the ranking.

Let `age_hours = max(0, edition_as_of - event_published_at)` in hours.

Use a configurable exponential half-life formula:

`freshness_score = 100 * 2 ** (-age_hours / freshness_half_life_hours)`

Default `freshness_half_life_hours = 12`.

Examples: - 1 hour old: approximately 94 - 3 hours old: approximately
84 - 6 hours old: approximately 71 - 12 hours old: 50 - 18 hours old:
approximately 35 - 24 hours old: 25

Use the original credible publication time for the underlying event when
available. If the event time is unknown, use the earliest credible
article publication time and record that the timestamp is an
article-time proxy.

Do not: - Treat `first_seen_at` as publication time. - Reset freshness
when an old story is syndicated, republished, or updated without
material new information. - Add separate uncalibrated freshness bonuses
after calculating this dimension.

## 6. Additional signals and guardrails

These signals inform the six dimensions; they are not additional
weighted dimensions unless future evaluation justifies a documented
model change.

### 6.1 Startup and investor prominence

Use established prominence only as context. Possible signals include
verified company scale, customers, track record, prior consequential
outcomes, and investor relevance to the event.

Do not allow fame alone to make a routine announcement important. Do not
use raw social mentions, number of articles, or press-release
distribution volume as a proxy for quality.

### 6.2 Sector momentum

Track sector activity over rolling 7-day and 30-day windows, where data
supports it: - Number of distinct consequential events. - Funding and
commercial deployment trends. - Number and geographic spread of active
companies. - Technical, regulatory, or customer-adoption developments.

Compare with the sector's own historical baseline. Use momentum only as
a modest contextual input to technology significance or ecosystem
significance. Do not add an unrestricted multiplier that makes every
story in a fashionable sector rank highly.

Do not let a trend score override evidence or materiality. Label sector
momentum as uncertain when the sample size is small.

### 6.3 Evidence gaps

Missing information is not evidence of low impact, but it must not be
invented. Use a neutral/default score or uncertainty marker where
appropriate, and avoid assigning extreme scores without support. Record
which dimensions relied on inference and why.

## 7. Quality gate and candidate eligibility

A candidate must satisfy all applicable conditions: 1. It belongs to the
existing deduplicated story/event set. 2. It falls inside the edition's
24-hour publication window. 3. It has a credible timestamp. 4. It
contains material new information. 5. It has enough evidence to
summarise without inventing facts. 6. It is not materially contradicted
by credible evidence. 7. It meets the minimum quality threshold.

Set `MINIMUM_QUALITY_SCORE` as a configuration parameter, not a
hard-coded assumption. Start with 50/100 for offline evaluation, then
calibrate against manually reviewed editions. Do not assume this value
is optimal.

Recommended initial evidence floor: `evidence_confidence >= 30`, except
when an existing editorial review workflow explicitly permits a clearly
labelled developing story. Stories below the evidence floor should not
enter the normal ranked edition.

Avoid a rigid high score threshold that systematically excludes
smaller-market stories just because public data is sparse. Apply the
same scoring anchors across markets and make uncertainty explicit.

## 8. Diversity-aware selection

After scoring and quality gating, select up to the edition limit. This
is a portfolio-selection step, not a second intrinsic score.

### 8.1 Selection objective

Select the set that balances: - High intrinsic story importance. -
Geographic breadth. - Topic breadth. - Different event types. -
Different companies and investors. - Reduced redundancy and repetitive
coverage.

Use a deterministic greedy marginal-value algorithm for the first
release. At each step, choose the candidate with the highest value after
considering its intrinsic score and its marginal contribution to the
edition's diversity, subject to hard limits.

Conceptual objective:

`selection_value(candidate) = intrinsic_score + diversity_bonus(candidate, selected) - redundancy_penalty(candidate, selected)`

The diversity and redundancy functions must be bounded and configurable.
They must not overwhelm a large, clearly consequential story or elevate
weak stories simply because they are unusual.

### 8.2 Country balancing

Use a story's relevant operating or event geography, not merely the
publisher's location. A story can concern more than one country.

Initial guardrails for a 25-story edition: - Soft maximum: one country
should normally contribute no more than 25% of selected stories. -
Top-ten guardrail: one country should normally contribute no more than 3
of the top 10. - Cross-border events can be tagged to multiple
countries, but count each selected event once in the total edition
size. - Do not require every country to appear. - Do not fill a country
allocation with low-quality stories. - If the next best story violates a
country cap, select the next-highest marginal-value candidate that meets
the constraints. - If no eligible candidate can satisfy all soft caps,
relax the least consequential soft cap, record the relaxation, and
continue. Never return fewer stories solely because a soft cap blocks an
otherwise good selection when a documented relaxation is safe. - A
genuinely exceptional event can override a soft cap, but the override
must have a recorded reason and must not bypass the evidence floor or
hard edition-size cap.

Implement country caps as soft constraints, not automatic score
inflation for underrepresented countries. Diversity rewards should be
based on the coverage already present in the selected set and the
candidate's relevance.

### 8.3 Topic balancing

Use a controlled multi-label taxonomy. Initial topic families: - Funding
and venture capital. - Company developments, acquisitions, exits,
growth, and failures. - AI and software. - Deeptech, industrial
technology, robotics, chips, quantum, and space. - Climate, energy, and
mobility. - Biotech, health technology, and life sciences. -
Cybersecurity and infrastructure. - Policy, regulation, and public
funding. - Talent, founders, and ecosystem infrastructure.

A story can have multiple topics. Do not force topics to be mutually
exclusive.

Avoid fixed per-topic quotas. Apply a soft redundancy penalty when the
edition over-concentrates on a topic, while allowing a topic to dominate
if there is an exceptional amount of genuinely important news.

### 8.4 Source, company, investor, and event-type concentration

-   The number of articles covering an event must not increase its
    intrinsic score.
-   Do not reward a story merely because many monitored sources repeat
    it.
-   Prefer the best original source and add independent corroborating
    links where useful.
-   Reduce marginal value for repetitive stories about the same company,
    investor, event type, or narrow subtopic, unless the new event has
    distinct material significance.
-   Avoid a hard source-country relationship: the location of the
    publisher is not necessarily the location of the story.
-   Source independence should be assessed where possible. Syndicated
    copies do not count as independent confirmation.

### 8.5 Recommended initial implementation

Use a greedy selector: 1. Sort candidates deterministically by intrinsic
score. 2. Start with an empty edition. 3. For every remaining candidate,
compute its marginal value given the current selection. 4. Exclude
candidates that violate hard rules. 5. Select the highest-value eligible
candidate. 6. Repeat until the target size is reached, the hard cap is
reached, or no candidate meets the quality gate. 7. Apply and log
controlled soft-cap relaxations if needed. 8. Assign tiers and display
order after selection.

Do not add a separate arbitrary "underrepresented country bonus" to
intrinsic scores. Keep intrinsic importance and selection diversity
separately inspectable.

## 9. Story tiers and presentation

Use three editorial tiers. They describe usefulness to the reader, not
source quality.

-   **Tier 1 --- Must know:** Usually 5--8 stories, if enough qualify.
    Major company events, consequential funding or exits, important
    technical advances, or policy developments with broad implications.
-   **Tier 2 --- Worth knowing:** Often 10--12 stories. Material
    company, funding, customer, technology, and local ecosystem
    developments.
-   **Tier 3 --- Emerging signals:** Often 5--10 stories. Credible
    smaller developments that expose a relevant new company, market,
    technical direction, or early trend.

These are flexible ranges, not fixed quotas. A story's tier must reflect
its importance and confidence, not be assigned merely to fill a tier.
The total edition remains at or below 30, and the quality gate always
takes precedence.

For every selected story, present: - Headline. - Concise summary that
adds context rather than repeating the headline. - Country or countries
involved. - Primary topic and optional secondary topics. - Event type
(e.g. funding, acquisition, deployment, regulation, technical
milestone). - Publication time and age. - Tier. - A short "Why it
matters" explanation grounded in known facts. - A short "Why selected"
explanation where useful, including the relevant diversity
contribution. - Best source link and additional independent confirmation
links, if available. - Evidence/provenance label: original reporting,
independently corroborated reporting, primary announcement, ecosystem
listing, or developing/unverified. - Confidence or uncertainty indicator
when relevant.

Do not display a long list of numeric subscores by default. Keep them
available for audit and debugging. Show a few meaningful labels such as
"Major development", "Emerging signal", "Deeptech", or "Cross-border
impact" when supported.

### 9.1 Explanation generation

Generate explanations from structured evidence and the computed score
components. Do not ask a language model to invent a rationale after
ranking.

Each explanation should answer: - What happened? - Why is it
consequential? - What evidence supports the claim? - Why is it included
in this edition?

Do not claim that a story is "first", "exclusive", "record-breaking", or
"Europe-leading" unless the source material supports it. Clearly
attribute company and investor claims. Separate fact from
interpretation.

## 10. Ranking metrics and monitoring

Record metrics for each edition and over time.

### Coverage and concentration

-   Number of selected stories.
-   Number of distinct countries and regions represented.
-   Country share distribution and share of the top three countries.
-   Number of countries with eligible candidates but no selected story.
-   Source share distribution and share of the top three publishers.
-   Topic distribution and share of the largest topic.
-   Event-type distribution.
-   Cross-border story count.

### Quality and evidence

-   Share of stories with primary-source links.
-   Share with independent corroboration.
-   Share of stories based on original reporting, where assessable.
-   Share with unknown or proxy timestamps.
-   Share of evidence-confidence scores below 55.
-   Number of stories excluded by the quality gate and reasons.
-   Number of material claims flagged as disputed or uncertain.

### Freshness and duplication health

-   Age distribution at edition publication.
-   Share published within 3, 6, 12, and 24 hours.
-   Share using event-time versus article-time proxy.
-   Duplicate event leakage (the same event appearing more than once).
-   Share of selected stories later found to be old news or materially
    misdated.

### Reader usefulness and calibration

-   Opens, saves, shares, and explicit helpful/not-helpful feedback, if
    available.
-   Do not optimise solely for clicks.
-   Editorial review of the top stories and the bottom of the selected
    list.
-   Important missed stories discovered after publication.
-   False positives: stories selected that reviewers judge low-value.
-   False negatives: consequential stories omitted from the edition.
-   Ranking changes between runs and their causes.

Do not use raw country coverage counts as a target without accounting
for the number of eligible, high-quality stories from that market. A
quiet market should not be penalised or artificially filled.

## 11. Configuration

Keep tunable parameters in one configuration object or equivalent, not
scattered through code.

Suggested defaults: - `edition_window_hours = 24` -
`edition_target_size = 25` - `edition_max_size = 30` -
`freshness_half_life_hours = 12` - `minimum_quality_score = 50` (initial
calibration value) - `minimum_evidence_confidence = 30` -
`country_soft_cap_share = 0.25` - `top_ten_country_soft_cap = 3` -
`allow_soft_cap_relaxation = true` -
`weights = { economic: 0.25, technology: 0.20, novelty: 0.15, ecosystem: 0.15, freshness: 0.15, evidence: 0.10 }` -
`scoring_config_version = "1.0"`

Validate that weights sum to 1.0. Validate score bounds and edition
limits at startup. Configuration changes must be versioned so editions
can be reproduced.

## 12. Failure handling and edge cases

-   **Sparse news day:** Return fewer stories; never fill with noise.
-   **One country dominates breaking news:** Keep the most important
    stories, apply soft caps, and record any necessary relaxation.
-   **Missing funding amount:** Score based on other known facts; do not
    assume a value.
-   **Missing country:** Use `unknown` and avoid treating it as a
    diversity benefit. If country is material and cannot be resolved,
    lower confidence or flag for review.
-   **Cross-border company:** Represent multiple relevant geographies;
    avoid counting one event multiple times.
-   **Syndicated article:** Do not treat syndication as independent
    corroboration.
-   **Conflicting reports:** Lower evidence confidence or route for
    review; do not average contradictory claims blindly.
-   **New article about old event:** Exclude unless material new
    information is established.
-   **Uncertain sector trend:** Avoid momentum boosts with a small
    sample; mark confidence low.
-   **LLM unavailable or malformed output:** Use deterministic fallback
    scores or leave the story unscored and excluded; never invent a
    score silently.
-   **Source outage:** Rank remaining eligible candidates and log
    coverage degradation.
-   **All candidates below threshold:** Return an empty or smaller
    edition and surface an operational warning; do not bypass the
    threshold.
-   **Tied scores:** Use stable deterministic tie-breaking.
-   **Configuration changes:** Preserve the configuration version with
    each edition.
-   **Soft-cap conflict:** Relax only the documented soft constraint and
    record why.

## 13. Test plan and acceptance criteria

Implement automated tests using synthetic fixtures and, where possible,
anonymised real story examples.

### Scoring tests

-   Scores remain in 0--100 and the weighted result is correct.
-   Weights must sum to 1.0.
-   Missing values never cause crashes or silently become extreme
    scores.
-   Larger funding does not automatically dominate every other signal.
-   Sector labels and company fame do not independently force high
    rankings.
-   Freshness decays monotonically as a story ages.
-   The same inputs and configuration produce the same scores.

### Eligibility tests

-   Stories older than 24 hours are excluded.
-   Stories at the exact cutoff behave according to the documented
    inclusive boundary.
-   Missing or untrusted timestamps are not silently treated as fresh.
-   Old events republished in the window are excluded unless material
    new information is established.
-   Stories with evidence below the floor are excluded from the normal
    edition.
-   Deduplicated event IDs appear at most once.

### Selection tests

-   The edition never exceeds 30 stories.
-   It can return fewer than the target when too few stories qualify.
-   Country and topic diversity improve when equally valuable
    alternatives exist.
-   A genuinely high-impact story can outrank a diversity preference,
    subject to hard constraints.
-   Soft caps relax predictably when no alternative exists, with a
    logged reason.
-   Article count and publisher repetition do not inflate intrinsic
    score.
-   Cross-border events are counted once in edition size.
-   Ties resolve deterministically.
-   A single fashionable topic does not crowd out all other topics
    solely due to trend momentum.

### Presentation tests

-   Every story has a source link, timestamp, country/topic metadata
    where available, and a grounded explanation.
-   Company claims are attributed.
-   The UI does not display ungrounded superlatives or unsupported
    numerical claims.
-   Tier labels do not imply more certainty than the evidence supports.
-   The same event does not appear as multiple cards.

### Metrics tests

-   Country and source concentration metrics are calculated correctly.
-   Freshness buckets use the edition timestamp.
-   Quality-gate exclusions and soft-cap relaxations are logged.
-   Duplicate leakage is measurable.
-   Reader feedback metrics are optional and the system works when no
    feedback data exists.

### Acceptance criteria

The implementation is complete when: 1. Existing ingestion and
deduplication remain intact. 2. Each candidate has inspectable dimension
scores, an intrinsic score, evidence/provenance fields, and exclusion
reasons where relevant. 3. The daily edition selects at most 30 stories,
normally targets 25, and can return fewer. 4. The selection is
diversity-aware without fixed quotas or artificial low-quality
inclusions. 5. Each displayed story has a grounded explanation and
source attribution. 6. Ranking metrics and configuration version are
stored or logged. 7. Automated tests cover the cases above. 8. The code
includes a concise description of how to tune weights and thresholds
using editorial review.

## 14. Implementation instruction to the coding agent

Before editing: 1. Inspect the existing architecture, story schema,
timestamps, deduplication output, country/topic metadata, and
presentation components. 2. Identify the smallest changes needed to add
scoring, selection, explanations, and metrics. 3. State which existing
components will be reused and which files will change. 4. Do not rewrite
unrelated code or duplicate deduplication.

Then implement the smallest complete vertical slice: - Configurable
scoring. - Eligibility and quality gates. - Deterministic
diversity-aware selection. - Tiers and grounded presentation fields. -
Metrics/logging. - Automated tests.

After implementation: - Run the relevant test suite and lint/type
checks. - Report changed files, design decisions, tests run, and any
assumptions. - Identify data fields that were unavailable and how they
were handled. - Do not claim that the algorithm is calibrated from
real-world performance unless it has been evaluated against reviewed
historical editions.
