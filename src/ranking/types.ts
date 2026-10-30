/**
 * @file types.ts
 * @module ranking/types
 * @description
 * TypeScript interfaces and types for the European Tech Story Scoring,
 * Selection, and Presentation Engine specification.
 */

import type { StoryTopic, EuropeanRegion } from '../types/news.ts';

export type StoryTier = 
  | 'Tier 1 — Must know'
  | 'Tier 2 — Worth knowing'
  | 'Tier 3 — Emerging signals';

export type StoryEventType =
  | 'funding'
  | 'acquisition'
  | 'merger'
  | 'exit'
  | 'technical_milestone'
  | 'commercial_deployment'
  | 'regulation_policy'
  | 'restructuring'
  | 'ecosystem_infrastructure'
  | 'general_development';

export type ProvenanceLabel =
  | 'original_reporting'
  | 'independently_corroborated'
  | 'primary_announcement'
  | 'ecosystem_listing'
  | 'developing_unverified';

export interface DimensionScores {
  /** Economic and business impact (0 - 100, weight: 25%) */
  economicImpact: number;
  /** Technology and strategic significance (0 - 100, weight: 20%) */
  technologySignificance: number;
  /** Novelty and information value (0 - 100, weight: 15%) */
  novelty: number;
  /** Ecosystem significance (0 - 100, weight: 15%) */
  ecosystemSignificance: number;
  /** Freshness based on exponential half-life (0 - 100, weight: 15%) */
  freshness: number;
  /** Evidence and source confidence (0 - 100, weight: 10%) */
  evidenceConfidence: number;
}

export interface StoryExplanations {
  /** Grounded statement explaining what happened and why it is consequential */
  whyItMatters: string;
  /** Grounded statement explaining why the story was chosen for this edition */
  whySelected: string;
}

export interface EngineWeights {
  economic: number; // 0.25
  technology: number; // 0.20
  novelty: number; // 0.15
  ecosystem: number; // 0.15
  freshness: number; // 0.15
  evidence: number; // 0.10
}

export interface RankingEngineConfig {
  editionWindowHours: number; // 24
  editionTargetSize: number; // 25
  editionMaxSize: number; // 30
  freshnessHalfLifeHours: number; // 12
  minimumQualityScore: number; // 50
  minimumEvidenceConfidence: number; // 30
  countrySoftCapShare: number; // 0.25 (25% max per country)
  topTenCountrySoftCap: number; // 3 max in top 10
  allowSoftCapRelaxation: boolean; // true
  weights: EngineWeights;
  scoringConfigVersion: string; // "1.0"
  configVersion?: string; // alias for scoringConfigVersion
}

export interface SelectionOutput {
  selectedStories: import('../types/news.ts').NewsStory[];
  exclusions: QualityGateExclusion[];
  relaxations: SoftCapRelaxationRecord[];
  editionAsOf: string;
}

export interface SoftCapRelaxationRecord {
  country: string;
  previousCount: number;
  newCount: number;
  storyId: string;
  reason: string;
  timestamp: string;
}

export interface QualityGateExclusion {
  storyId: string;
  title: string;
  reason: string;
  intrinsicScore?: number;
  evidenceConfidence?: number;
  ageHours?: number;
}

export interface RankingMetrics {
  editionAsOf: string;
  configVersion: string;
  candidatesTotal: number;
  candidatesEligible: number;
  selectedCount: number;
  distinctCountriesCount: number;
  countryDistribution: Record<string, number>;
  countryShareTop3: Array<{ country: string; sharePercent: number }>;
  sourceDistribution: Record<string, number>;
  sourceShareTop3: Array<{ source: string; sharePercent: number }>;
  topicDistribution: Record<string, number>;
  largestTopicSharePercent: number;
  eventTypeDistribution: Record<string, number>;
  crossBorderCount: number;
  freshnessDistribution: {
    under3h: number;
    under6h: number;
    under12h: number;
    under24h: number;
    over24h: number;
  };
  provenanceDistribution: Record<ProvenanceLabel, number>;
  qualityGateExclusions: QualityGateExclusion[];
  softCapRelaxations: SoftCapRelaxationRecord[];
  averageIntrinsicScore: number;
}
