/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type EuropeanRegion = 
  | 'UK & Ireland'
  | 'Nordics'
  | 'DACH (Germany, Austria, Switzerland)'
  | 'France & Benelux'
  | 'Southern Europe'
  | 'Central & Eastern Europe'
  | 'Pan-European';

export type StoryTopic =
  | 'Funding & Deals'
  | 'AI & DeepTech'
  | 'Climate & CleanTech'
  | 'Fintech & Banking'
  | 'HealthTech & Bio'
  | 'SaaS & B2B'
  | 'Policy & Ecosystem'
  | 'M&A & Exits';

export type StoryStatus = 'published' | 'quarantined' | 'rejected' | 'archived';

export interface NewsStory {
  id: string;
  title: string;
  summary: string; // Guaranteed <= 60 words
  wordCount: number;
  originalUrl: string;
  publisher: string;
  publisherDomain: string;
  publishedAt: string; // ISO UTC string
  ingestedAt: string;  // ISO UTC string
  editionDate: string; // YYYY-MM-DD
  imageUrl?: string;
  country: string;
  region: EuropeanRegion;
  topicTag: StoryTopic;
  importanceScore: number; // 0 - 100
  confidenceScore: number; // 0 - 100
  status: StoryStatus;
  quarantineReason?: string;
  keyClaims: string[];
  keyFigures?: string; // e.g., "€45M Series B led by Index Ventures"
  sourceReliability: number; // 1 - 10
  corroborationNotes?: string;
  isBreaking?: boolean;
  reviewedBy?: string;
  author?: string; // Journalist or writer byline if extracted from RSS/article
  isGeneratedImage?: boolean; // True if image was synthesized/illustrative rather than original press photo
  isMilestone?: boolean; // True if card is a 30-story milestone transition to the 72h archive
  tier?: 'Tier 1 — Must know' | 'Tier 2 — Worth knowing' | 'Tier 3 — Emerging signals';
  whyItMatters?: string; // Grounded explanation of business/tech consequence
  whySelected?: string; // Grounded explanation of edition/diversity selection rationale
  provenance?: 'original_reporting' | 'independently_corroborated' | 'primary_announcement' | 'ecosystem_listing' | 'developing_unverified';
  dimensionScores?: {
    economicImpact: number;
    technologySignificance: number;
    novelty: number;
    ecosystemSignificance: number;
    freshness: number;
    evidenceConfidence: number;
  };
  eventType?: string;
  extractedCountries?: string[];
  rank?: number;
}

export type SourceLayer = 
  | 'Layer 1 - Pan-European'
  | 'Layer 2 - Local'
  | 'Layer 3 - Primary & Data';

export interface SourceRegistryItem {
  id: string;
  name: string;
  domain: string;
  rssUrl: string;
  regions: EuropeanRegion[];
  country?: string;
  layer: SourceLayer;
  sourceRole?: string;
  languages?: string[];
  priority?: 'core' | 'secondary' | 'situational';
  primaryCategory: StoryTopic;
  credibilityRating: number; // 1 - 10
  enabled: boolean;
  lastIngestedAt?: string;
  lastItemCount?: number;
  errorCount: number;
  lastError?: string;
  ingestionMethod: 'RSS' | 'API' | 'ATOM';
  notes?: string;
}

export interface DailyEdition {
  date: string; // YYYY-MM-DD
  publishedAt: string;
  storyCount: number;
  stories: NewsStory[];
  geographicDistribution: Record<string, number>;
  averageImportance: number;
  rankingMetrics?: any;
  configVersion?: string;
}

export interface EditorialSettings {
  dailyPublishTimeUtc: string; // "03:00"
  minConfidenceThreshold: number; // e.g. 75
  maxDailyStories: number; // e.g. 12
  wordCountLimit: number; // 60
  autoPublishHighConfidence: boolean;
  scoringWeights: {
    startupRelevance: number; // 25
    europeanRelevance: number; // 20
    marketImportance: number; // 20
    novelty: number; // 15
    sourceReliability: number; // 10
    audienceValue: number; // 10
  };
}

export interface PipelineExecutionResult {
  runId: string;
  timestamp: string;
  durationMs: number;
  sourcesProcessed: number;
  rawArticlesFetched: number;
  articlesAfterDedup: number;
  articlesQualified: number;
  publishedCount: number;
  quarantinedCount: number;
  errors: string[];
}

export type AnalyticsEventType = 
  | 'session_start'
  | 'session_ping'
  | 'session_end'
  | 'card_view'
  | 'feed_complete'
  | 'quick_bounce'
  | 'source_click'
  | 'save_action'
  | 'share_action'
  | 'client_crash'
  | 'slow_load'
  | 'feed_load_failure';

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  anonId?: string;
  storyId?: string;
  cardIndex?: number;
  dwellMs?: number;
  durationSec?: number;
  country?: string;
  timeZone?: string;
  errorMessage?: string;
  latencyMs?: number;
}

export interface FunnelStep {
  step: string;
  cardIndex: number;
  views: number;
  retentionPercent: number;
  dropOffPercent: number;
}

export interface DropOffCausation {
  naturalDecayPercent: number;
  slowLoadPercent: number;
  feedFailurePercent: number;
  crashPercent: number;
}

export interface HealthDiagnostics {
  feedLoadFailures: number;
  clientCrashes: number;
  slowLoadWarnings: number;
  healthySessionsPercent: number;
  dropOffCausation: DropOffCausation;
}

export interface StoriesPerDayMetrics {
  activeEdition: number;
  archive72h: number;
  totalAvailable: number;
  dailyCadenceTarget: number;
}

export interface AnonymousAnalyticsSummary {
  dau: number; // Daily Active Users (today)
  totalSessions: number;
  averageReadingDepth: number; // Stories per user per session
  avgSessionDurationSec: number; // Time spent on app (seconds)
  completionRatePercent: number;
  quickBounces: number;
  sourceClicks: number;
  saves: number;
  shares: number;
  funnelSteps: FunnelStep[];
  readerCountries: Record<string, number>;
  storiesPerDay: StoriesPerDayMetrics;
  healthDiagnostics: HealthDiagnostics;
  lastUpdated: string;
}


