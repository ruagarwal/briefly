# European Startup News (Veloce / EurPulse) — Product & Technical Implementation Plan

A mobile-first news discovery application delivering the most consequential European startup news in 60 words or fewer, inspired by InShorts, powered by an automated RSS ingestion engine, Gemini 3.8 Flash summarization and factual verification, and an editorial quarantine management console.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed during Phase 1 discovery and guide the architecture:
> - **Native Mobile Target**: Architected for native iOS and Android deployment via Capacitor runtime (`capacitor.config.ts`, native assets, zero mobile web chrome) paired with a live interactive native device frame simulator in AI Studio preview.
> - **Editorial Workflow**: Automated daily publication cycle at 03:00 UTC. Stories scoring $\ge 75$ with verified claims are published automatically; low-confidence, disputed, or high-uncertainty stories route to an interactive Quarantine Queue for editorial review.
> - **Local-First Zero Friction**: No mandatory user accounts or sign-in walls in v1. Saved stories, reading history, and offline caches persist on-device via local storage and indexed persistence, minimizing GDPR friction.

---

## 1. Overview & Core Concept

- **What It Does**: Collects daily startup news across the UK, Nordics, DACH, France, Southern, and Eastern Europe from approved tier-1 publications. Normalizes, deduplicates, and ranks stories, then synthesizes factual, neutral, high-density English summaries of $\le 60$ words. Readers navigate one full-screen card at a time with vertical swipe gestures, swipe right to read original reporting, save articles locally, and generate branded share cards.
- **Target Audience**: European founders, angel/VC investors, operators, tech talent, and ecosystem builders who need a complete snapshot of continental developments in 5 minutes a day.
- **Key Value Proposition**: Pan-European signal over local noise. Eliminates geographic fragmentation without filler, clickbait, or unverified claims.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Daily Feed Walkthrough**:
   - The reader opens the app directly into the top-ranked story card for the day (03:00 UTC edition).
   - **Vertical Swipe (Up/Down)**: Smooth card transition to the next/previous story with fluid gesture physics.
   - **Right Swipe / Source Button**: Direct sheet or in-app browser view opening the original publisher's article.
   - **Progress Counter**: Clean unboxed indicator (e.g., `3 of 10`) showing daily completion depth.
2. **Save & Offline Reading**:
   - Tapping the bookmark icon saves the story to local storage instantly with haptic feedback.
   - Dedicated "Saved" tab allows quick offline browsing of saved cards.
3. **Branded News Card Sharing**:
   - Tapping "Share" opens a live preview modal rendering a clean, high-resolution news card (Headline, 60-word summary, source attribution, date, QR code / deep link).
   - Supports native share sheet invocation (`navigator.share`) and 1-tap image download/copy.
4. **Editorial Admin & Quarantine Console**:
   - Accessible via protected admin toggle (`/admin` view).
   - Real-time ingestion trigger ("Run Pipeline Now").
   - Review pending candidate stories, inspect Gemini confidence scores & fact-checking notes, approve/reject/edit summaries, and configure source RSS feeds.

### Visual Identity & Theme

- **Aesthetic Direction**: High-end European editorial typography combined with tactile mobile minimalism (inspired by Monocle, InShorts, and Bloomberg Technology).
- **Color Palette (60-30-10 discipline)**:
  - *Dominant Canvas (60%)*: Crisp off-black ink (`#0B0F17`) in dark mode, soft warm paper white (`#F8F9FA`) in light mode.
  - *Structural Surfaces (30%)*: Card background `#151B26` / `#FFFFFF` with subtle hairline border (`rgba(255,255,255,0.08)` / `rgba(0,0,0,0.06)`).
  - *Accent Budget (10%)*: Electric Cobalt (`#2563EB` / `#3B82F6`) for active navigation, verified badges, and primary actions; European Gold/Amber (`#F59E0B`) for funding deal milestones.
- **Typography**:
  - *Display / Headlines*: `Plus Jakarta Sans` (bold, tight tracking `-0.02em`, `text-wrap: balance`, 20px–24px).
  - *Body Prose*: `DM Sans` / `Inter` (regular 400, 15px, line-height 1.6, clean legibility).
  - *Metadata & Counters*: Unboxed text with subtle typographic dot separators (`TechCrunch · Paris, France · 2h ago · 52 words`). No clunky pill badges.
- **Touch Ergonomics & Gestures**:
  - Thumb-zone optimized: Primary actions (Bookmark, Share, Read Source, Next) within the bottom 40% of the screen.
  - Touch hitboxes $\ge 44 \times 44\text{px}$.
  - Fluid gesture handling via `motion` and touch drag listeners.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Mobile Architecture (PWA + Capacitor Native Foundation)**
  - *Chosen Approach*: React 19 + TypeScript + Vite bundled with standard Capacitor configuration (`@capacitor/core`, `@capacitor/cli`, `capacitor.config.ts`, iOS/Android asset structure) and an interactive in-browser Device Frame simulator for testing gestures and screen sizes.
  - *Why*: Allows immediate zero-friction testing in the AI Studio environment while providing the exact code and configuration to build native `.ipa` and `.apk`/`.aab` packages for Apple App Store and Google Play.
- **Decision 2: Automated 03:00 UTC Pipeline with Quarantine Review**
  - *Chosen Approach*: Express backend orchestrates automated RSS polling, deduplication, scoring, and Gemini 3.8 Flash summarization. Candidate stories with high confidence ($\ge 75$) auto-publish; edge cases, high financial claims, or low-confidence stories wait in a Quarantine queue.
  - *Why*: Maximizes editorial reliability while eliminating repetitive daily manual labor.
- **Decision 3: Strict 60-Word Engine with Deterministic Validation**
  - *Chosen Approach*: Two-phase AI pipeline: (1) Prompt Gemini 3.8 Flash with structured schema to output headline, summary, key facts, and country/sector tags; (2) Server-side programmatic word count validator (`countWords <= 60`). If exceeded, an automatic tightening prompt runs before final approval.
  - *Why*: Guarantees the product promise ("European startup news in 60 words or fewer") is never violated.
- **Decision 4: Curated Tier-1 Source Registry**
  - *Chosen Approach*: Controlled registry seeded with active European startup feeds: *Sifted, Tech.eu, TechCrunch Europe, EU-Startups, Silicon Canals, ArcticStartup*.
  - *Why*: Protects credibility, respects copyright/fair use, and provides balanced geographic coverage across UK, Nordics, France, DACH, and Southern/Eastern Europe.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT / MOBILE APP                             │
│                                                                        │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │  Device Viewport (iOS / Android / Full Screen Mode)          │     │
│   │                                                              │     │
│   │  ┌────────────────────┐  ┌─────────────────┐  ┌───────────┐  │     │
│   │  │ Daily Feed Card    │  │ Saved Stories   │  │ Admin UI  │  │     │
│   │  │ (Vertical Swiper)  │  │ (Local Storage) │  │ & Sources │  │     │
│   │  └─────────┬──────────┘  └────────┬────────┘  └─────┬─────┘  │     │
│   └────────────┼──────────────────────┼─────────────────┼────────┘     │
│                │                      │                 │              │
│                ▼                      ▼                 ▼              │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │  State Stores: FeedStore, BookmarkStore, GestureEngine       │     │
│   └───────────────────────────────┬──────────────────────────────┘     │
└───────────────────────────────────┼────────────────────────────────────┘
                                    │ HTTP / REST API
┌───────────────────────────────────▼────────────────────────────────────┐
│                       EXPRESS BACKEND (server.ts)                      │
│                                                                        │
│  ┌───────────────────────┐  ┌───────────────────────────────────────┐  │
│  │ News Ingestion Worker │  │ Editorial Pipeline (Gemini 3.8 Flash) │  │
│  │ - RSS / Atom Parsers  │  │ - Relevance & Importance Scoring      │  │
│  │ - Canonical URL Norm  │  │ - 60-Word Factual Summarizer          │  │
│  │ - Exact/Fuzzy Dedup   │  │ - Strict Word Count Verifier          │  │
│  └───────────┬───────────┘  └───────────────────┬───────────────────┘  │
│              │                                  │                      │
│              ▼                                  ▼                      │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ In-Memory & Persistent Storage (JSON / File Persistence)        │  │
│  │ - Approved Sources Registry                                      │  │
│  │ - Daily Editions (03:00 UTC archive)                             │  │
│  │ - Published Stories Feed                                         │  │
│  │ - Quarantine / Review Queue                                      │  │
│  │ - Editorial Audit Log                                            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Core Data Models

```typescript
export interface SourceRegistryItem {
  id: string;
  name: string;
  domain: string;
  rssUrl: string;
  regions: ('UK' | 'Nordics' | 'DACH' | 'France' | 'Southern Europe' | 'CEE' | 'Pan-European')[];
  category: 'Seed/VC' | 'Growth' | 'Policy/Regulation' | 'Ecosystem' | 'Tech';
  credibilityRating: number; // 1-10
  enabled: boolean;
  lastIngestedAt?: string;
  errorCount: number;
}

export interface NewsStory {
  id: string;
  title: string;
  summary: string; // Guaranteed <= 60 words
  wordCount: number;
  originalUrl: string;
  publisher: string;
  publisherDomain: string;
  publishedAt: string; // UTC ISO
  ingestedAt: string;  // UTC ISO
  editionDate: string; // YYYY-MM-DD
  imageUrl?: string;
  country: string;
  region: string;
  topicTag: string;
  importanceScore: number; // 0-100
  confidenceScore: number; // 0-100
  status: 'published' | 'quarantined' | 'rejected' | 'archived';
  quarantineReason?: string;
  keyClaims: string[];
  reviewedBy?: string;
}

export interface DailyEdition {
  date: string; // YYYY-MM-DD
  publishedAt: string;
  storyCount: number;
  stories: NewsStory[];
  geographicDistribution: Record<string, number>;
}
```

### Server API Endpoints

- `GET /api/feed/today`: Returns today's active published feed ordered by importance score.
- `GET /api/feed/archive`: Returns past daily editions.
- `GET /api/sources`: Returns registered sources and health status.
- `POST /api/sources`: Add or edit source configuration.
- `POST /api/pipeline/run`: Manually trigger or schedule the ingestion and summarization cycle.
- `GET /api/admin/quarantine`: List items needing editorial inspection.
- `POST /api/admin/action`: Approve, reject, or edit a quarantined/published story.
- `POST /api/share/card`: Generate server-rendered or canvas-optimized share card data.

---

## 5. Implementation Steps & Milestones

1. **Backend Pipeline & Storage (`server.ts`)**:
   - RSS XML parser for Sifted, Tech.eu, TechCrunch, EU-Startups, Silicon Canals, ArcticStartup.
   - Idempotent normalization, deduplication, and recency filter ($\le 24$ hours).
   - `@google/genai` integration using `gemini-3.8-flash` with structured JSON schema output and 60-word validation.
   - Quarantine routing logic and in-memory/file storage with seed data fallback.
2. **Mobile Core UI & Vertical Swiper (`src/App.tsx`, `src/components/*`)**:
   - InShorts-style full-screen card reader with smooth vertical touch swipe transitions.
   - Clean unboxed metadata (Publisher · Region · Time · Word Count).
   - Right-swipe gesture / button trigger for original source article.
   - Device simulator wrapper with iOS / Android bezel toggles.
3. **Local-First Saving & Share Card Engine**:
   - LocalStorage bookmarking store with offline reading view.
   - Canvas-based Branded Share Card generator with QR code, formatted quote, and attribution.
4. **Editorial Admin Console**:
   - Quarantine review panel with 1-click Approve, Reject, or Edit.
   - Source Registry manager (toggle, edit RSS feeds, inspect errors).
   - Geographic balance telemetry (ensuring pan-European representation).
5. **Native Build & Store Readiness**:
   - Capacitor configuration (`capacitor.config.ts`), mobile manifest, icons, and App Store / Google Play packaging guide.
   - Privacy Policy and Store compliance documentation.
