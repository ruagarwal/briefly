/**
 * @file metrics.ts
 * @module ranking/metrics
 * @description
 * Ranking-quality metrics, concentration tracking, and audit telemetry.
 * Implements Section 10 of the European Tech Story Ranking Engine specification.
 */

import type { NewsStory } from '../types/news.ts';
import type { RankingMetrics, SelectionOutput, RankingEngineConfig, ProvenanceLabel } from './types.ts';

export function calculateRankingMetrics(
  selection: SelectionOutput,
  candidatesTotal: number,
  config: RankingEngineConfig
): RankingMetrics {
  const stories = selection.selectedStories;
  const total = Math.max(1, stories.length);

  // 1. Country distribution
  const countryCounts: Record<string, number> = {};
  let crossBorderCount = 0;

  for (const s of stories) {
    const c = s.country || 'Pan-European';
    countryCounts[c] = (countryCounts[c] || 0) + 1;
    if (s.country === 'Pan-European' || (s.extractedCountries && s.extractedCountries.length > 1)) {
      crossBorderCount++;
    }
  }

  const sortedCountries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([country, count]) => ({
      country,
      sharePercent: Math.round((count / total) * 100)
    }));

  const countryShareTop3 = sortedCountries.slice(0, 3);

  // 2. Source distribution
  const sourceCounts: Record<string, number> = {};
  for (const s of stories) {
    const src = s.publisher || 'Unknown';
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;
  }

  const sortedSources = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([source, count]) => ({
      source,
      sharePercent: Math.round((count / total) * 100)
    }));

  const sourceShareTop3 = sortedSources.slice(0, 3);

  // 3. Topic distribution
  const topicCounts: Record<string, number> = {};
  for (const s of stories) {
    const topic = s.topicTag || 'Funding & Deals';
    topicCounts[topic] = (topicCounts[topic] || 0) + 1;
  }

  const largestTopicCount = Math.max(0, ...Object.values(topicCounts));
  const largestTopicSharePercent = Math.round((largestTopicCount / total) * 100);

  // 4. Event type distribution
  const eventTypeCounts: Record<string, number> = {};
  for (const s of stories) {
    const ev = (s as any).eventType || 'general_development';
    eventTypeCounts[ev] = (eventTypeCounts[ev] || 0) + 1;
  }

  // 5. Freshness distribution
  const now = new Date(selection.editionAsOf).getTime();
  const freshnessDistribution = {
    under3h: 0,
    under6h: 0,
    under12h: 0,
    under24h: 0,
    over24h: 0
  };

  for (const s of stories) {
    const pub = new Date(s.publishedAt || s.ingestedAt).getTime();
    const ageH = Math.max(0, (now - pub) / 3600000);
    if (ageH <= 3) freshnessDistribution.under3h++;
    else if (ageH <= 6) freshnessDistribution.under6h++;
    else if (ageH <= 12) freshnessDistribution.under12h++;
    else if (ageH <= 24) freshnessDistribution.under24h++;
    else freshnessDistribution.over24h++;
  }

  // 6. Provenance distribution
  const provenanceDistribution: Record<ProvenanceLabel, number> = {
    original_reporting: 0,
    independently_corroborated: 0,
    primary_announcement: 0,
    ecosystem_listing: 0,
    developing_unverified: 0
  };

  for (const s of stories) {
    const prov = (s as any).provenance as ProvenanceLabel || 'independently_corroborated';
    provenanceDistribution[prov] = (provenanceDistribution[prov] || 0) + 1;
  }

  const avgIntrinsic = stories.length > 0
    ? Math.round((stories.reduce((acc: number, s: NewsStory) => acc + (s.importanceScore || 0), 0) / stories.length) * 10) / 10
    : 0;

  return {
    editionAsOf: selection.editionAsOf,
    configVersion: config.scoringConfigVersion,
    candidatesTotal,
    candidatesEligible: stories.length + selection.exclusions.length,
    selectedCount: stories.length,
    distinctCountriesCount: Object.keys(countryCounts).length,
    countryDistribution: countryCounts,
    countryShareTop3,
    sourceDistribution: sourceCounts,
    sourceShareTop3,
    topicDistribution: topicCounts,
    largestTopicSharePercent,
    eventTypeDistribution: eventTypeCounts,
    crossBorderCount,
    freshnessDistribution,
    provenanceDistribution,
    qualityGateExclusions: selection.exclusions,
    softCapRelaxations: selection.relaxations,
    averageIntrinsicScore: avgIntrinsic
  };
}
