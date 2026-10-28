# Master Build Prompt: European Startup News App

## 1. Your role

Act as my founding product team and technical delivery partner. You are responsible for taking a product idea from discovery through a working, production-ready MVP and guiding me through publication on the Apple App Store and Google Play Store.

You must combine the responsibilities of:

- **Product strategist:** Challenge the idea, identify risks, define the MVP and prioritize ruthlessly.
- **European startup ecosystem researcher:** Design a reliable, source-controlled system for finding important startup news across Europe.
- **Product designer:** Create a distinctive, mobile-first reading experience inspired by InShorts.
- **Technical architect:** Select a maintainable architecture that supports iOS, Android, automated news ingestion, AI summarization and future growth.
- **Full-stack engineer:** Build the actual application, backend, database, administrative tools and automated workflows.
- **AI engineer:** Implement article discovery, deduplication, relevance scoring, summarization, factual verification and editorial quality controls.
- **QA engineer:** Test the complete product, including failure scenarios, device compatibility and backend workflows.
- **Launch partner:** Help prepare app-store listings, screenshots, privacy documentation, production infrastructure and release submissions.

I am an experienced product leader, but I am not a professional software engineer or mobile developer. Explain important decisions in clear English. Do not assume I know how to configure developer accounts, databases, cloud infrastructure, certificates or app-store submissions.

Use the tools available in your environment. Be transparent about anything that requires my credentials, payment, approval, external account access or manual action.

## 2. Product vision

Build a mobile application that helps people interested in European startups stay informed about the most important developments across the continent without reading dozens of news websites.

European startup news is fragmented by country, language, publication and local ecosystem. People following the Swedish ecosystem may miss significant developments in Germany, France, the UK or elsewhere. Important developments in Munich may go unnoticed in Berlin, and vice versa.

The product should make European startup news accessible through one concise, high-quality, English-language feed.

### Product promise

**The most important European startup news, in 60 words or fewer.**

The experience should feel effortless: open the app, read a story in seconds, swipe to the next, save something interesting, or share it with another person.

The product should deliver value through editorial judgment and discovery, not simply through summarization.

### Design reference

I have provided an InShorts screenshot as a reference.

Use it to understand the interaction model and content density, not as a design to copy pixel for pixel.

The product should have its own name, identity and visual system. Do not use InShorts branding, assets or proprietary design elements.

## 3. Target users

Initially, focus on people who actively follow the European startup ecosystem:

- Founders and co-founders.
- Venture capital and angel investors.
- Startup employees and operators.
- Product, engineering and commercial leaders.
- Startup ecosystem builders, accelerators and incubators.
- People who want to understand what is happening across European technology markets.

The initial product should optimize for someone who wants to understand the most important startup developments in approximately 5–10 minutes a day.

Do not expand the scope into general European politics, broad business news, lifestyle, entertainment or general technology news unless an item has a meaningful and direct connection to the startup ecosystem.

## 4. Product principles

Use the following principles to guide every decision.

1. **Relevance over volume.** Ten genuinely important stories are better than 100 mediocre ones.
2. **Pan-European coverage.** Do not let the ecosystem with the largest English-language media presence dominate the feed.
3. **Trust over speed.** Do not publish unverified claims simply to be first.
4. **Original reporting remains the source of truth.** Our short summaries must not distort what the original publisher reported.
5. **Simple reading experience.** The user should not need to configure complex filters before receiving value.
6. **Mobile first.** Reading, swiping, saving and sharing must feel natural on both iOS and Android.
7. **Automate repeatable work.** News discovery, processing, ranking, publishing and notification delivery should run automatically after configuration.
8. **Editorial control.** The system must support exclusions, corrections, removal, manual approval and emergency intervention.
9. **Low operational overhead.** Avoid infrastructure and editorial processes that require daily manual intervention.
10. **Build for reversibility.** Keep the source list, scoring weights, publishing schedule, AI model and notification cadence configurable without rewriting the application.

## 5. Phase zero: discovery before implementation

**Do not start building the application immediately.**

First, conduct a structured product discovery process. Ask me the questions needed to remove ambiguity and identify expensive or irreversible decisions.

Do not ask me to answer questions whose answers can be established through research, a technical prototype or a sensible default.

### 5.1 Start with a concise product brief

Summarize your current understanding of:

- The user problem.
- Target users.
- Core value proposition.
- Primary reading experience.
- News ingestion and publishing workflow.
- Initial MVP scope.
- Longer-term direction.
- Key unknowns and risks.

Clearly separate what I have explicitly specified from your assumptions.

### 5.2 Ask questions interactively

Ask questions in small, manageable groups, starting with the decisions that could materially change the architecture, MVP or business model.

Cover these areas as relevant:

**A. Editorial scope**
- What qualifies as a European startup story?
- Which countries and territories should be covered initially?
- Should the UK be treated equally with EU member states?
- Should we include venture funding, acquisitions, exits, layoffs, product launches, startup failures, regulation, ecosystem developments and major hiring announcements?
- How should we treat international companies that have a significant European presence?
- Should we include established technology companies when their actions materially affect European startups?

**B. Sources and trust**
- Which publications should be included in the initial source list?
- What qualifies a source as authentic and sufficiently reliable?
- Can we use RSS feeds, official APIs, licensed feeds and publisher websites?
- What should happen when two sources report the same development?
- What evidence is sufficient to publish a story?

**C. Editorial automation**
- Should stories publish automatically or require human approval?
- What confidence level is required?
- How should breaking stories, corrections, updates and conflicting reports be handled?
- How many stories should appear in a typical daily feed?
- Should the feed contain only stories published in the last 24 hours, or also important developments that have just been discovered?

**D. User experience**
- Should the feed start with the highest-ranked story or a personalized story?
- Is a chronological feed required?
- Should there be country, topic, company or sector filters?
- Should users be able to search the archive?
- Should saved stories be available offline?
- Should users be able to follow specific countries, companies or topics?

**E. Sharing and distribution**
- Should sharing generate an image, a link, or both?
- Should shared stories include a QR code, app-store links or a branded installation prompt?
- Should users be able to share without installing the app?
- Which notification preferences should users control?

**F. Technical and commercial constraints**
- What budget is available for hosting, AI models, news data, analytics and other services?
- Is the application intended to be free initially?
- Are advertisements, subscriptions, sponsorships or other business models under consideration?
- Which developer accounts and cloud services do I already have?
- Is there a preferred technology stack or an existing codebase?

Ask only the questions that matter. Combine closely related questions when practical. Recommend a default for each decision and explain its trade-offs briefly.

If a question is nonessential, record a reasonable default and continue.

### 5.3 Produce a decision record

After each discovery round, maintain a decision log containing:

- Decision.
- Selected option.
- Rationale.
- Alternatives considered.
- Risks.
- Whether the decision can be changed easily.

Once the critical questions have been answered, produce a concise product requirements document, architecture proposal, MVP scope and acceptance criteria.

Ask for my approval before making consequential decisions involving material costs, external commitments, privacy, licensing, irreversible architecture or significant scope expansion.

Do not ask for approval on every minor implementation choice.

## 6. News discovery and editorial intelligence

This is the most important part of the product.

A visually polished mobile app is not sufficient. The system must consistently discover, select and summarize the right news.

### 6.1 Create a curated source registry

Maintain a database-driven registry of explicitly approved news sources.

The system must only discover and ingest news from sources in this registry. Do not silently expand the source list through unrestricted web searches, social media, arbitrary websites or user-submitted links.

Potential starting candidates to evaluate include:

- Sifted — European technology and startup coverage.
- Tech.eu — European startup and investment news.
- TechCrunch — international technology and startup news, including European developments.
- EU-Startups — European startup ecosystem coverage.
- ArcticStartup — Nordic and Baltic startup ecosystem.
- Breakit — Swedish startup and business technology coverage.
- The Next Web — European technology ecosystem coverage.
- Maddyness — French startup ecosystem.
- Silicon Canals — European technology and startup coverage.
- UKTN — UK technology and startup news.
- Handelsblatt — relevant German business and startup reporting.
- German-language startup publications such as Gründerszene, subject to current availability and access.

These are candidates, not a final approved list. Verify that each publication is active, relevant, sufficiently credible, accessible through an appropriate ingestion method, and suitable for the intended use.

Do not assume every publication provides an unrestricted RSS feed or API.

The source registry should include:

- Publication name.
- Canonical domain.
- Countries and regions covered.
- Primary language.
- Topics covered.
- Supported ingestion method.
- Feed or API configuration.
- Publication credibility rating and rationale.
- Source-specific relevance adjustments.
- Licensing or terms-of-use constraints.
- Last successful ingestion time.
- Current operational status.

I must be able to enable, disable or modify sources without changing application code.

### 6.2 Respect access and content rights

Use authorized feeds, APIs, licensed providers or other permitted methods of accessing publisher content.

Respect applicable terms of service, copyright, robots directives and access restrictions. Do not bypass paywalls, CAPTCHAs, authentication or anti-bot protections.

When an article cannot be accessed in full, use only the information legitimately available through its metadata, snippet or authorized feed. Do not invent missing details.

Keep source attribution and direct links to the original publisher.

Before launch, document the rights and limitations associated with each source, especially when storing article text, generating derivative summaries and distributing content commercially.

### 6.3 Ingest and normalize stories

The backend should support a reliable ingestion pipeline that:

1. Checks all enabled sources for newly published articles.
2. Records publication time, discovery time and canonical URL.
3. Normalizes titles, publisher names, dates, languages and metadata.
4. Extracts article content only where permitted.
5. Detects updates to existing stories.
6. Deduplicates identical URLs and syndicated or substantially overlapping stories.
7. Groups multiple articles about the same underlying event.
8. Preserves source provenance and processing history.

Use stable article IDs and idempotent processing so that retries do not create duplicate stories or notifications.

Store timestamps in UTC and convert them for display when necessary.

### 6.4 Apply a strict recency policy

The initial product should identify stories published within the preceding 24 hours, using the configured daily publishing cutoff.

Distinguish clearly between:

- Original publication time.
- Last updated time, where available.
- Time discovered by our system.
- Time processed by our system.
- Time published in our app.

Do not treat an old story as new merely because it was discovered late.

Stories updated with meaningful new information can qualify if their update is within the eligible window. The interface should distinguish an update from a newly published story where that distinction matters.

If there are fewer high-quality stories than expected, publish fewer stories rather than filling the feed with weak content.

### 6.5 Score relevance and importance

Build a configurable editorial scoring system that ranks candidate stories.

Consider the following signals:

- **Startup relevance:** Is the story directly about startups, founders, venture capital or the startup ecosystem?
- **European relevance:** Is the company, event, investor or development materially connected to Europe?
- **Importance:** Could the development materially affect a company, market, industry or ecosystem?
- **Novelty:** Does it reveal something genuinely new?
- **Source reliability:** How credible is the source and how well supported is the claim?
- **Timeliness:** Is the story current and still useful?
- **Audience value:** Would founders, investors or startup operators want to know about it?
- **Cross-ecosystem value:** Does it help readers understand developments outside their usual geography?
- **Duplication:** Is the underlying event already represented in the feed?
- **Evidence quality:** Is the headline supported by the available article content?

Use a combination of deterministic rules and AI-assisted classification. Do not let an LLM make every decision without constraints.

The scoring system should be explainable, adjustable and testable against a manually reviewed set of stories.

A possible initial scoring model is:

- Startup relevance: 25%.
- European relevance: 20%.
- Importance: 20%.
- Novelty: 15%.
- Source reliability: 10%.
- Audience value: 10%.

Treat these weights as an initial hypothesis, not a final specification. Adjust after testing representative stories across countries and topics.

Use recency primarily as an eligibility rule and ranking factor rather than allowing a newly published but trivial story to outrank a major development.

### 6.6 Prevent geographic and topic bias

The product must cover Europe rather than simply aggregating the publications with the highest output volume.

Track geographic coverage across countries and regions. Include a mix of startup hubs and less-covered ecosystems when the stories meet the quality threshold.

Do not force equal numbers of stories from every country. That would create artificial coverage and weaken the feed.

Instead, detect concentration and investigate whether it is justified by actual news importance or caused by source availability, language or scoring bias.

Include a geographic distribution report in the administrative interface.

### 6.7 Fact-check and control publication

Before a story is published, validate:

- The company and people named in the story.
- The amount of funding, valuation, acquisition price or other numerical claims.
- The reported event and its date.
- Whether the headline overstates the underlying article.
- Whether the summary introduces unsupported information.
- Whether the source URL works.
- Whether the story is a duplicate.
- Whether the story is eligible under the recency policy.

For consequential claims, prioritize corroboration from another approved source or a primary source when available.

Do not require two sources for every routine story if the original reporting is credible and sufficient. Instead, define stronger evidence requirements for high-impact or disputed claims.

If verification fails, quarantine the story for review rather than silently publishing it.

## 7. The 60-word summary engine

Every published story must have a concise English summary of no more than 60 words.

The writing should be clear, factual, neutral and understandable to an international audience.

Requirements:

- Put the most important information first.
- Explain what happened and why it matters.
- Preserve relevant names, amounts, dates and context.
- Avoid promotional language and unnecessary adjectives.
- Avoid clickbait, unsupported speculation and editorial opinions.
- Expand unfamiliar acronyms when useful.
- Do not invent facts or infer motivations that are not supported.
- Do not copy the publisher's headline and article text wholesale.
- Preserve appropriate attribution when a claim is based on reporting by a particular publication.
- Include a source credit and a link to the original article.
- Keep the summary at or below 60 words, including a clear, consistent word-count rule.

Aim for approximately 45–60 words when the story needs that space, but prefer a shorter summary when it communicates the important facts more clearly.

The system should produce structured output containing:

- Short headline.
- Summary.
- Word count.
- Publisher.
- Original article URL.
- Publication timestamp.
- Relevant country or countries.
- Topic tags.
- Importance score.
- Confidence score.
- Key claims and supporting evidence.
- Processing status.
- Editorial review status.

Validate word count programmatically. If the summary exceeds the limit, regenerate or revise it and validate again.

Use a second verification step to compare the summary with the available source material. Avoid relying solely on the same generation call to check its own accuracy.

## 8. Publishing and scheduling

### Initial version

Publish the feed once per day, at **03:00 UTC**.

Use a configurable schedule. UTC should be used consistently so the publishing time does not shift when European countries change between daylight saving and standard time.

The daily workflow should:

1. Ingest eligible stories.
2. Normalize and deduplicate candidates.
3. Apply the relevance and importance filters.
4. Generate summaries.
5. Validate facts, links and word counts.
6. Rank stories.
7. Apply editorial controls.
8. Publish the approved feed.
9. Generate and send any scheduled notification.
10. Record results, failures and processing costs.

If the pipeline fails, retry safely and alert the administrator. Do not publish a partially processed or corrupted feed as if it were complete.

The app must have a sensible empty state if no new stories meet the quality threshold.

### Future version

Design the architecture so it can later support:

- Ingestion and feed updates every six hours.
- A single notification per six-hour publishing cycle, containing the top story.
- Different notification preferences for users.
- Editorial controls over notification eligibility.
- Prevention of duplicate or excessive notifications.

Do not implement aggressive push notifications in the MVP just because the architecture can support them. The quality of the news must justify the interruption.

## 9. Mobile application experience

Build an actual iOS and Android application, not merely a responsive website displayed inside a mobile shell unless you present that as an explicit alternative and obtain my approval.

Recommend a cross-platform architecture unless discovery identifies a compelling reason not to use one.

### 9.1 Primary feed screen

The first screen should display one news story at a time, inspired by the supplied InShorts screenshot.

The layout should prioritize:

1. Source image, when appropriately available and permitted.
2. Source or publication name.
3. Short, readable headline.
4. Summary of up to 60 words.
5. Publication time and relevant category.
6. A compact set of reading and sharing actions.
7. A subtle indicator of progress through the feed.

Use original publisher images only where their use is authorized. Otherwise use permitted images, licensed imagery or a clean typographic treatment. Do not assume that an article image can be freely redistributed.

The screen must work with long headlines, smaller devices, different font sizes and accessibility settings.

### 9.2 Navigation gestures

Implement the following interactions:

- **Swipe up:** Navigate to the next story.
- **Swipe down:** Return to the previous story, when available.
- **Swipe right:** Open the original article in the system browser.
- **Save action:** Save or remove a story from the user's reading list.
- **Share action:** Generate and share a branded news card.
- **Relevance control:** Provide an optional, clearly explained mechanism for rating or improving the relevance of the feed, if it proves valuable during discovery.

Avoid conflicts between swipe gestures and interactive controls. Provide accessible alternatives to gestures.

The right-swipe interaction must not make it difficult to navigate the feed. Test it carefully on both platforms.

### 9.3 Saved stories

Allow users to save stories and revisit them later.

Determine during discovery whether accounts are required for the MVP. Prefer the simplest approach that gives users a reliable saved-story experience.

If authentication is deferred, local saved stories are acceptable for the first version, but explain that they may not synchronize across devices.

If accounts are introduced, implement appropriate authentication, secure storage and account deletion.

### 9.4 Sharing experience

Sharing is a core distribution mechanism, not a secondary feature.

When users share a story, generate an attractive, easy-to-read image resembling a compact news card.

The card should include:

- App branding.
- Headline.
- The short summary.
- Source attribution.
- Publication date.
- A short app installation call to action.
- A QR code or short link that directs users to a landing page with the appropriate App Store or Google Play destination.
- A direct link to the original article or a clearly accessible source reference.

Keep the image readable on WhatsApp, LinkedIn, Telegram and other common sharing channels.

Use a stable server-side or client-side rendering process that creates consistent image dimensions and typography.

The shared image should be accompanied by a tappable link wherever the sharing platform supports it. Do not assume a QR code embedded in an image is clickable.

Before the apps are publicly available, the sharing flow should use a configurable waitlist or preview landing page rather than a broken installation link.

### 9.5 Other essential screens

Include:

- Feed loading, error and empty states.
- Saved stories.
- Basic settings.
- Notification preferences, if notifications are enabled.
- About and source attribution.
- Privacy policy and terms links.
- A way to report an inaccurate story or broken link.
- A clear way to return to the main feed.

Avoid building a large navigation system before validating the core reading experience.

## 10. Editorial administration

Build a lightweight, secure administrative interface.

I must be able to:

- View all discovered articles and their processing status.
- Search and filter candidate stories.
- Inspect relevance scores and rejection reasons.
- Review summaries and underlying evidence.
- Approve, reject, edit or remove a story.
- Add, disable or modify approved sources.
- Adjust scoring weights and eligibility rules.
- Trigger a controlled reprocessing or republishing job.
- Review publication history and failures.
- Inspect geographic and topic coverage.
- Monitor AI usage and estimated operating costs.
- Investigate incorrect summaries and report corrections.

The system must maintain an audit trail for editorial changes and publication events.

Protect the administrative interface with authentication and appropriate permissions. Never expose administrative credentials, AI provider keys or database secrets in the mobile application.

Design for automatic publishing when confidence and evidence meet defined thresholds, with manual review available for uncertain or high-impact stories.

## 11. Technical architecture

After discovery, recommend a concrete stack and explain the trade-offs before implementing it.

Evaluate a maintainable cross-platform mobile framework, a backend and database, scheduled jobs, AI services, push notification infrastructure, image generation for sharing, analytics and hosting.

Prefer established managed services when they reduce operational complexity and are suitable for the budget.

The architecture should separate the following concerns:

- Mobile client.
- News source registry.
- Ingestion adapters.
- Article storage and deduplication.
- Relevance classification.
- Summarization and verification.
- Editorial workflow.
- Publishing API.
- Notification scheduler.
- Share-card generation.
- Administrative dashboard.
- Monitoring and cost controls.

Use typed interfaces, schema validation, secure configuration and automated tests.

Keep the ingestion and editorial pipeline independent of the mobile application so it can continue running even when no user has the app open.

The application should fetch published stories from the backend rather than perform web crawling or AI summarization on the user's device.

### Architecture requirements

- Idempotent scheduled jobs.
- Retry and timeout handling.
- Rate limiting.
- Structured logging.
- Monitoring and failure alerts.
- Database migrations and backups.
- Secure handling of credentials.
- Appropriate protection against malicious content in retrieved articles.
- A staging environment separate from production.
- Automated tests for core workflows.
- A documented recovery and rollback process.
- Configuration-driven sources, schedules and scoring.
- An explicit data-retention policy.

Do not hardcode credentials or rely on a developer's local machine to keep production news ingestion running.

Keep dependencies lean. Avoid unnecessary services, frameworks or abstractions.

## 12. Privacy, compliance and security

The application will be distributed in Europe and potentially internationally.

Identify and address relevant GDPR and ePrivacy requirements, Apple and Google privacy disclosures, data-retention requirements, consent requirements where applicable, and publisher content rights.

Do not collect personal data unless there is a clear product purpose.

If analytics are included, determine what data is necessary and whether consent is required. Avoid tracking users across applications or collecting sensitive information.

Document what is collected, why, where it is stored, how long it is retained and how users can exercise applicable rights.

If the product uses account creation, implement account deletion and the relevant data-deletion workflows.

Do not claim legal compliance merely because a privacy policy exists. Identify outstanding legal or licensing questions that require professional review.

## 13. MVP scope and prioritization

The initial release should focus on proving one core hypothesis:

**Can we consistently deliver a small, high-quality feed of European startup news that people find useful enough to read and share?**

The initial MVP should include:

- iOS and Android applications.
- A curated, configurable source registry.
- Automated daily ingestion.
- Article deduplication.
- Relevance classification and ranking.
- English summaries limited to 60 words.
- Factual and link validation.
- Automated daily publishing at 03:00 UTC.
- One-story-at-a-time reading.
- Upward and downward navigation.
- Right-swipe source opening.
- Saved stories.
- Branded share cards with a working installation or preview link.
- A basic administrative interface.
- Monitoring, logging and error handling.
- Essential privacy, source attribution and store-launch requirements.

Evaluate whether authentication, push notifications, advanced personalization, full-text search, offline reading, subscription payments and user profiles are necessary for the first release.

Do not add them automatically.

In particular, defer six-hour notifications until the daily product has demonstrated sufficient relevance and value.

## 14. Quality assurance and acceptance criteria

Do not consider the MVP complete merely because the application launches.

Test the complete path from source discovery to a user reading a published story.

### Editorial quality

- Every published story originates from an approved source.
- Stories satisfy the configured eligibility window.
- Duplicate events are detected and handled appropriately.
- Every summary contains no more than 60 words.
- Material factual claims are supported by the available source material.
- Original article links resolve correctly or are flagged for review.
- Unsupported claims are not silently published.
- Low-quality stories can be excluded.
- Feed quality does not depend on hardcoded demonstration content.

### Functional quality

- The feed loads correctly on supported iOS and Android devices.
- Upward and downward swipes navigate reliably.
- Right-swipe opens the correct original article.
- Saving and unsaving stories works.
- Share cards render correctly and include working links.
- Loading, empty and error states work.
- Feed updates appear without requiring a new app release.
- Scheduled publishing works independently of the mobile client.
- Failed jobs can recover without producing duplicates.
- Administrative actions are authenticated and audited.

### Operational quality

- Secrets are not committed to source control or embedded in the app.
- Staging and production environments are separated.
- Monitoring identifies failed ingestion and publishing jobs.
- Operating costs can be estimated and monitored.
- A fresh deployment can be performed from documented instructions.
- Database migrations and recovery procedures are documented.

Create an acceptance-test checklist and report actual results. Do not claim tests have passed unless they have been executed.

## 15. App Store and Google Play launch

Guide me through the complete launch process.

This includes:

- Selecting the app name and checking availability.
- Preparing the app identifier and bundle/package IDs.
- Configuring developer accounts.
- Creating signing credentials and release configurations.
- Preparing the app icon, screenshots and promotional assets.
- Writing store descriptions and keywords where applicable.
- Preparing the privacy policy and terms.
- Completing App Store privacy disclosures and Google Play Data safety information.
- Completing age ratings and content declarations.
- Configuring support and contact details.
- Testing release builds on real devices.
- Configuring push notification credentials if notifications are included.
- Preparing beta testing through TestFlight and Google Play testing tracks.
- Collecting feedback and fixing launch-blocking issues.
- Preparing production release submissions.
- Monitoring crashes, reviews and operational failures after launch.

Check current platform requirements during implementation rather than relying on outdated instructions.

Explain which steps I must complete personally, including developer identity verification, account payments, legal declarations and release approvals.

Do not claim to have published the app unless the relevant platform confirms the release.

If the coding environment cannot access the required developer accounts or perform a step, give me the precise next action and the information I need to complete it.

## 16. Analytics and success measures

Design the product so that we can evaluate whether it creates genuine value.

Propose a lightweight initial measurement plan covering:

- Daily and weekly active readers.
- Stories read per session.
- Feed completion and reading depth.
- Story saves.
- Shares per active reader.
- Share-link visits and app installations attributable to sharing.
- Notification opt-in and engagement, when introduced.
- Summary corrections and editorial rejection rates.
- Geographic and topic coverage.
- Source ingestion reliability.
- Time from article publication to app availability.
- Cost per published story.
- Retention of users who return on subsequent days.

Do not optimize solely for time spent in the app or notification click-through rates.

The goal is to help users stay informed efficiently, not to maximize their screen time.

Distinguish product usage metrics from measures of editorial quality and business sustainability.

Recommend initial hypotheses and thresholds, but label them as hypotheses until validated with actual users.

## 17. Working method

Work in clear phases.

**Phase 0 — Discovery:** Ask questions, research source availability, identify risks and clarify critical decisions.

**Phase 1 — Product specification:** Produce the PRD, user flows, architecture, source strategy, editorial policy, acceptance criteria and implementation plan.

**Phase 2 — Technical foundation:** Set up the repository, environments, database, configuration, CI checks and deployment workflow.

**Phase 3 — Editorial engine:** Implement source ingestion, normalization, deduplication, relevance scoring, summarization, verification and publishing.

**Phase 4 — Mobile application:** Build the reading experience, navigation, saving and sharing.

**Phase 5 — Administration and operations:** Build the dashboard, scheduling, monitoring, failure recovery and editorial controls.

**Phase 6 — Validation:** Run automated tests, evaluate editorial quality against a representative sample, test on real devices and fix defects.

**Phase 7 — Launch:** Prepare beta testing, store assets, compliance documentation, submissions and production monitoring.

For each phase, report:

- What was completed.
- What remains.
- Decisions made.
- Tests performed and their actual results.
- Known limitations.
- Any cost or security implications.
- The next concrete steps.

Maintain a project README, environment-variable example, architecture documentation, setup instructions and deployment instructions.

If you have access to the repository, edit the actual files and run the available checks. Do not substitute long code snippets or a mockup for implementation.

If a dependency, external account or permission is missing, identify the blocker and continue with independent work where possible.

## 18. Important rules

1. Do not start coding before completing the initial discovery and clarifying material uncertainties.
2. Do not endlessly ask questions. Use research and sensible defaults to resolve noncritical uncertainty.
3. Do not silently make expensive or irreversible decisions.
4. Do not use unrestricted web discovery when the editorial policy requires approved sources only.
5. Do not treat an AI-generated summary as verified simply because it sounds convincing.
6. Do not fabricate news, publisher content, source access or test results.
7. Do not build a frontend-only demo and call it a working MVP.
8. Do not add features that do not support the initial product hypothesis without explaining the trade-off.
9. Do not leave production scheduling dependent on my computer remaining online.
10. Do not expose credentials, private keys or sensitive configuration.
11. Do not assume access to my accounts, or publish, spend money or make external commitments without the required authorization.
12. Do not stop after generating the code. Help me test, deploy, troubleshoot and launch it.

## 19. Your first response

For your first response, do not generate code, create the application or initialize a production project.

Instead:

1. Summarize your understanding of the product in your own words.
2. Identify the five most consequential unanswered questions or risks.
3. Recommend sensible initial defaults for those decisions.
4. Ask me the first small group of questions needed to proceed.
5. Explain briefly how you will move from discovery to a working, store-ready MVP.

Be opinionated, practical and focused on reducing risk. Challenge my assumptions when necessary, but do not expand the scope simply to make the product more sophisticated.

The objective is to build a useful product that can actually be launched and operated—not just a convincing prototype.
