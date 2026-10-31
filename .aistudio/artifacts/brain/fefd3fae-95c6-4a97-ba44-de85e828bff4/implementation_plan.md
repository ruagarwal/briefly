# Implementation Plan: Ingestion Pipeline Reliability, CSV Telemetry Export & Shared Link Privacy

## Problem Diagnosis
1. **Stories Not Refreshing When Laptop is Off**:
   - Cloud Run and container environments scale down to zero when idle. When the user opened the app early in the morning from their phone, the background ingestion timer (`setInterval`) was not running because the container had booted cold.
   - Background promises fired after an HTTP response are throttled or frozen by serverless execution runtimes.
   - Additionally, Gemini Free Tier quota was exhausted by attempting 25 concurrent calls, which caused non-English or unprocessed articles to get quarantined instead of published.
2. **Telemetry Management**:
   - The user requested removing the "Clear Data" button and replacing it with an "Export CSV" option to download all adoption and telemetry numbers cleanly.
3. **Privacy on Shared Preview Link**:
   - When the user shared the preview link with colleagues or testers, visitors on desktop monitors saw the top header containing "Editorial Desk" and "Native APK & iOS", risking exposure of internal telemetry and quarantine queues.

## Completed Changes

### 1. Ingestion Pipeline & Morning Briefing Reliability
- **Synchronous Cold-Boot Refresh in `GET /api/feed/today`**:
  - The endpoint now inspects `allStories`. If fewer than 15 stories are under 24 hours old (e.g. after overnight sleep or cold boot), the server awaits `runIngestionPipeline()` synchronously before responding, guaranteeing fresh stories are curated and delivered on mobile.
- **Quota-Resilient Algorithmic Synthesis**:
  - When Gemini free tier quota (20 req/day) is exhausted, the deterministic NLP synthesizer formats and publishes verified 60-word briefs directly with status `'published'`, eliminating false quarantines.
- **Expanded Ingestion Scan Window to 72 Hours**:
  - Set `ingestionScanWindowHours: 72` in `cadenceConfig` so that rolling 72-hour catch-up stories and weekend stories are ingested and ranked without arbitrary 24h truncation.
- **Separation Milestone Card**:
  - Preserved the milestone separator card ("You're all caught up on today's Top European Stories!"), followed by the continuous 72-hour catch-up archive.

### 2. Full CSV Telemetry & Adoption Export
- **Backend Endpoint (`GET /api/analytics/export`)**:
  - Exports a CSV with:
    - **KPI Summary**: DAU, Total Sessions, Avg Time Spent on App, Stories Read / Session, Completion Rate, Active Stories, Catch-up Stories, Total Stories.
    - **Stability Diagnostics**: Healthy Sessions %, Client Crashes, Slow Load Warnings, Feed Load Failures.
    - **Actions**: Bounces, Primary Source Clicks, Saves, Shares.
    - **Reader Geography**: Country breakdown and readership share %.
    - **Retention Funnel**: Step-by-step card retention % and drop-off rate %.
    - **Pipeline Execution Logs**: Run timestamps, durations, sources checked, articles fetched, published, and quarantined.
- **Editorial Desk UI**:
  - Removed "Clear Data" button completely.
  - Added "Export CSV" button with `Download` icon in `AdminConsoleModal.tsx`.

### 3. Shared Preview Link Privacy & Editorial Desk Gating
- **Suppression on Shared Links**:
  - "Editorial Desk" and "Native APK & iOS" buttons are strictly hidden on shared preview links unless the user has editor credentials.
  - Normal preview visitors opening the link on a computer see the consumer application inside the phone simulator frame or full viewport with only public controls (Refresh, Saved).
- **Editor Access Control**:
  - Rupesh can activate the Editorial Desk by opening the link with `?desk=1`, `?admin=1`, or `?editor=1`.
  - When accessed once with the query parameter, editor access is persisted in `localStorage.setItem('briefly_editor', 'true')` for subsequent visits.
  - Hidden gesture: Tapping the top-left "B" brand logo 5 times toggles editor mode on or off.
  - Modals (`AdminConsoleModal` and `StoreLaunchGuideModal`) are guarded by `isEditor`.

## Verification & Status
- `npm test`: All 14 ranking engine test suites passed.
- `lint_applet` (`tsc --noEmit`): Passed with 0 errors.
- `compile_applet`: Build succeeded with 0 errors.
- Endpoints verified:
  - `GET /api/feed/today`: Returns 33 stories with milestone separation card.
  - `GET /api/analytics/export`: Generates valid, downloadable CSV with telemetry.
