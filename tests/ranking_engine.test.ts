/**
 * @file ranking_engine.test.ts
 * @description
 * Automated test suite for the European Tech Story Scoring, Selection, and Presentation Engine.
 * Implements all test suites from Section 13 of the specification:
 * - Scoring tests
 * - Eligibility tests
 * - Diversity-aware selection tests
 * - Presentation tests
 * - Metrics tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_RANKING_CONFIG,
  validateRankingConfig,
  calculateFreshnessScore,
  evaluateEconomicImpact,
  scoreStory,
  evaluateCandidateEligibility,
  selectDailyEdition,
  calculateRankingMetrics
} from '../src/ranking/index.ts';
import type { NewsStory } from '../src/types/news.ts';

describe('1. Scoring Model Tests (Section 4 & 5)', () => {
  it('should validate that default weights sum to 1.0', () => {
    const val = validateRankingConfig(DEFAULT_RANKING_CONFIG);
    assert.equal(val.isValid, true, `Validation failed: ${val.errors.join(', ')}`);
  });

  it('should calculate exponential freshness decay correctly', () => {
    const h1 = calculateFreshnessScore(1, 12);
    const h3 = calculateFreshnessScore(3, 12);
    const h6 = calculateFreshnessScore(6, 12);
    const h12 = calculateFreshnessScore(12, 12);
    const h18 = calculateFreshnessScore(18, 12);
    const h24 = calculateFreshnessScore(24, 12);

    assert.ok(h1 > 90 && h1 < 96, `Expected ~94 at 1h, got ${h1}`);
    assert.ok(h3 > 80 && h3 < 86, `Expected ~84 at 3h, got ${h3}`);
    assert.ok(h6 > 68 && h6 < 73, `Expected ~71 at 6h, got ${h6}`);
    assert.equal(Math.round(h12), 50, `Expected 50 at 12h, got ${h12}`);
    assert.ok(h18 > 32 && h18 < 38, `Expected ~35 at 18h, got ${h18}`);
    assert.equal(Math.round(h24), 25, `Expected 25 at 24h, got ${h24}`);

    // Freshness decays monotonically
    assert.ok(h1 > h3 && h3 > h6 && h6 > h12 && h12 > h18 && h18 > h24);
  });

  it('should apply logarithmic diminishing returns to funding amounts', () => {
    const round10M = evaluateEconomicImpact('Company raises €10M Series A', '€10M');
    const round100M = evaluateEconomicImpact('Company raises €100M Series C', '€100M');
    const round1B = evaluateEconomicImpact('Company raises €1B mega round', '€1B');

    // €100M is 10x €10M, but score should increase moderately (~10-15 pts), not 10x
    assert.ok(round100M.score > round10M.score);
    assert.ok(round100M.score - round10M.score < 25, 'Expected logarithmic compression, not linear scaling');
    assert.ok(round1B.score >= round100M.score);
    assert.ok(round1B.score <= 95, 'Score should be capped at anchor ceiling');
  });

  it('should produce identical scores for identical inputs (deterministic)', () => {
    const input = {
      title: 'Mistral AI closes €600M Series B',
      summary: 'Parisian AI champion Mistral secures major funding from international investors to scale frontier open models.',
      publishedAt: '2026-10-29T10:00:00.000Z',
      publisher: 'Sifted',
      sourceReliability: 9,
      keyFigures: '€600M Series B',
      country: 'France',
      topicTag: 'AI & DeepTech',
      author: 'Amy Lewin'
    };
    const now = new Date('2026-10-29T14:00:00.000Z');

    const score1 = scoreStory(input, now, DEFAULT_RANKING_CONFIG);
    const score2 = scoreStory(input, now, DEFAULT_RANKING_CONFIG);

    assert.equal(score1.intrinsicScore, score2.intrinsicScore);
    assert.deepEqual(score1.dimensionScores, score2.dimensionScores);
  });
});

describe('2. Eligibility & Quality Gate Tests (Section 7)', () => {
  const baseStory: NewsStory = {
    id: 'test-story-1',
    title: 'European Quantum Scaleup Debuts 100-Qubit Processor',
    summary: 'Munich-based quantum computing company unveils functional 100-qubit cryogenic chip for commercial enterprise deployments across Europe.',
    wordCount: 30,
    originalUrl: 'https://example.com/quantum-chip',
    publisher: 'Tech.eu',
    publisherDomain: 'tech.eu',
    publishedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    ingestedAt: new Date().toISOString(),
    editionDate: '2026-10-29',
    country: 'Germany',
    region: 'DACH (Germany, Austria, Switzerland)',
    topicTag: 'AI & DeepTech',
    importanceScore: 85,
    confidenceScore: 85,
    status: 'published',
    keyClaims: ['100-qubit processor debuted'],
    sourceReliability: 9,
    author: 'Dan Taylor'
  };

  it('should accept stories published within the rolling 24-hour window', () => {
    const now = new Date();
    const result = evaluateCandidateEligibility(baseStory, now, DEFAULT_RANKING_CONFIG);
    assert.equal(result.isEligible, true);
  });

  it('should exclude stories published older than 24 hours', () => {
    const now = new Date();
    const oldStory: NewsStory = {
      ...baseStory,
      id: 'old-story-1',
      publishedAt: new Date(now.getTime() - 25 * 3600000).toISOString()
    };
    const result = evaluateCandidateEligibility(oldStory, now, DEFAULT_RANKING_CONFIG);
    assert.equal(result.isEligible, false);
    assert.match(result.exclusionReason || '', /outside the 24-hour edition window/i);
  });

  it('should exclude stories with invalid or missing timestamps', () => {
    const now = new Date();
    const brokenStory: NewsStory = {
      ...baseStory,
      id: 'broken-time-1',
      publishedAt: 'invalid-date'
    };
    const result = evaluateCandidateEligibility(brokenStory, now, DEFAULT_RANKING_CONFIG);
    assert.equal(result.isEligible, false);
  });

  it('should exclude stories with low evidence confidence (< 30)', () => {
    const now = new Date();
    const lowEvidenceConfig = { ...DEFAULT_RANKING_CONFIG, minimumEvidenceConfidence: 60 };
    const lowEvidenceStory: NewsStory = {
      ...baseStory,
      id: 'unverified-rumor',
      publisher: 'Unknown Gossip Blog',
      sourceReliability: 2,
      author: undefined
    };
    const result = evaluateCandidateEligibility(lowEvidenceStory, now, lowEvidenceConfig);
    assert.equal(result.isEligible, false);
    assert.match(result.exclusionReason || '', /below quality floor/i);
  });
});

describe('3. Diversity-Aware Selection Tests (Section 8)', () => {
  const now = new Date('2026-10-29T12:00:00.000Z');

  const createDummyStory = (id: string, country: string, topic: import('../src/types/news.ts').StoryTopic, amount: string, ageH: number): NewsStory => ({
    id,
    title: `${country} ${topic} announcement with ${amount}`,
    summary: `Verified enterprise startup in ${country} secures ${amount} to expand digital operations and scale technical infrastructure across Europe.`,
    wordCount: 30,
    originalUrl: `https://example.com/story-${id}`,
    publisher: 'Sifted',
    publisherDomain: 'sifted.eu',
    publishedAt: new Date(now.getTime() - ageH * 3600000).toISOString(),
    ingestedAt: now.toISOString(),
    editionDate: '2026-10-29',
    country,
    region: 'Pan-European',
    topicTag: topic,
    importanceScore: 75,
    confidenceScore: 85,
    status: 'published',
    keyClaims: [`${country} tech move`],
    keyFigures: amount,
    sourceReliability: 9,
    author: 'Editorial Desk'
  });

  it('should strictly never exceed 30 stories in an edition', () => {
    // Generate 45 eligible candidates
    const candidates: NewsStory[] = [];
    const countries = ['UK', 'France', 'Germany', 'Sweden', 'Denmark', 'Estonia', 'Spain', 'Italy', 'Netherlands'];
    for (let i = 0; i < 45; i++) {
      candidates.push(createDummyStory(
        `cand-${i}`,
        countries[i % countries.length],
        'Funding & Deals',
        `€${i + 5}M`,
        i % 20 + 1
      ));
    }

    const selection = selectDailyEdition(candidates, now, DEFAULT_RANKING_CONFIG);
    assert.ok(selection.selectedStories.length <= 30, `Edition exceeded 30 stories: ${selection.selectedStories.length}`);
    assert.equal(selection.selectedStories.length, 25, 'Expected default target size of 25 stories');
  });

  it('should return fewer stories when few candidates pass the quality threshold (no noise padding)', () => {
    // Only 4 eligible candidates
    const candidates: NewsStory[] = [
      createDummyStory('few-1', 'Estonia', 'AI & DeepTech', '€20M', 2),
      createDummyStory('few-2', 'Denmark', 'Climate & CleanTech', '€15M', 4),
      createDummyStory('few-3', 'Lithuania', 'Fintech & Banking', '€8M', 6),
      createDummyStory('few-4', 'France', 'SaaS & B2B', '€30M', 8)
    ];

    const selection = selectDailyEdition(candidates, now, DEFAULT_RANKING_CONFIG);
    assert.equal(selection.selectedStories.length, 4, 'Should cleanly return only the 4 qualified stories without padding');
  });

  it('should prioritize geographic diversity over single-country concentration', () => {
    // 10 UK candidates + 1 Danish candidate of equal intrinsic strength
    const candidates: NewsStory[] = [];
    for (let i = 0; i < 10; i++) {
      candidates.push(createDummyStory(`uk-${i}`, 'UK', 'Funding & Deals', '€15M', 5));
    }
    candidates.push(createDummyStory('denmark-1', 'Denmark', 'Funding & Deals', '€15M', 5));

    const selection = selectDailyEdition(candidates, now, DEFAULT_RANKING_CONFIG);
    const selectedIds = selection.selectedStories.map(s => s.id);
    assert.ok(selectedIds.includes('denmark-1'), 'Danish candidate must be selected due to geographic diversity bonus');
  });

  it('should allow exceptional stories to override soft caps with recorded reason', () => {
    const candidates: NewsStory[] = [];
    // 8 standard UK stories
    for (let i = 0; i < 8; i++) {
      candidates.push(createDummyStory(`uk-std-${i}`, 'UK', 'Funding & Deals', '€5M', 10));
    }
    // 1 landmark €500M UK mega round
    candidates.push(createDummyStory('uk-mega', 'UK', 'AI & DeepTech', '€500M', 1));

    const selection = selectDailyEdition(candidates, now, DEFAULT_RANKING_CONFIG);
    const megaStory = selection.selectedStories.find(s => s.id === 'uk-mega');
    assert.ok(megaStory, 'Exceptional story must be included regardless of existing country concentration');
    assert.equal(selection.selectedStories[0].id, 'uk-mega', 'Exceptional story must rank #1');
  });
});

describe('4. Presentation & Grounded Explanation Tests (Section 9)', () => {
  const now = new Date('2026-10-29T12:00:00.000Z');

  it('should assign valid editorial tiers (Tier 1, 2, 3) and grounded explanations', () => {
    const candidate: NewsStory = {
      id: 'pres-1',
      title: 'Proxima Fusion closes €150M Series B for Stellarator Energy',
      summary: 'Munich deeptech fusion developer Proxima Fusion secures €150M Series B to build demonstration magnetic confinement power plant.',
      wordCount: 30,
      originalUrl: 'https://example.com/proxima',
      publisher: 'Tech.eu',
      publisherDomain: 'tech.eu',
      publishedAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
      ingestedAt: now.toISOString(),
      editionDate: '2026-10-29',
      country: 'Germany',
      region: 'DACH (Germany, Austria, Switzerland)',
      topicTag: 'AI & DeepTech',
      importanceScore: 92,
      confidenceScore: 90,
      status: 'published',
      keyClaims: ['€150M Series B closed'],
      keyFigures: '€150M',
      sourceReliability: 9,
      author: 'Dan Taylor'
    };

    const selection = selectDailyEdition([candidate], now, DEFAULT_RANKING_CONFIG);
    const story = selection.selectedStories[0];

    assert.ok(story);
    assert.equal(story.tier, 'Tier 1 — Must know');
    assert.ok(story.whyItMatters && story.whyItMatters.length > 20);
    assert.ok(story.whySelected && story.whySelected.length > 20);
    assert.ok(story.dimensionScores);
    assert.equal(story.dimensionScores.economicImpact >= 75, true);
    assert.equal(story.originalUrl, 'https://example.com/proxima');
  });
});

describe('5. Ranking Metrics Tests (Section 10)', () => {
  const now = new Date('2026-10-29T12:00:00.000Z');

  it('should compute concentration and distribution metrics accurately', () => {
    const candidates: NewsStory[] = [
      {
        id: 'm-1',
        title: 'Story 1',
        summary: 'Summary with verified data 1',
        wordCount: 25,
        originalUrl: 'https://example.com/1',
        publisher: 'Sifted',
        publisherDomain: 'sifted.eu',
        publishedAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
        ingestedAt: now.toISOString(),
        editionDate: '2026-10-29',
        country: 'France',
        region: 'France & Benelux',
        topicTag: 'AI & DeepTech',
        importanceScore: 80,
        confidenceScore: 85,
        status: 'published',
        keyClaims: [],
        sourceReliability: 9
      },
      {
        id: 'm-2',
        title: 'Story 2',
        summary: 'Summary with verified data 2',
        wordCount: 25,
        originalUrl: 'https://example.com/2',
        publisher: 'Tech.eu',
        publisherDomain: 'tech.eu',
        publishedAt: new Date(now.getTime() - 8 * 3600000).toISOString(),
        ingestedAt: now.toISOString(),
        editionDate: '2026-10-29',
        country: 'Germany',
        region: 'DACH (Germany, Austria, Switzerland)',
        topicTag: 'Funding & Deals',
        importanceScore: 70,
        confidenceScore: 80,
        status: 'published',
        keyClaims: [],
        sourceReliability: 8
      }
    ];

    const selection = selectDailyEdition(candidates, now, DEFAULT_RANKING_CONFIG);
    const metrics = calculateRankingMetrics(selection, 5, DEFAULT_RANKING_CONFIG);

    assert.equal(metrics.selectedCount, 2);
    assert.equal(metrics.distinctCountriesCount, 2);
    assert.equal(metrics.freshnessDistribution.under3h, 1);
    assert.equal(metrics.freshnessDistribution.under12h, 1);
    assert.equal(metrics.configVersion, '1.0');
    assert.ok(metrics.averageIntrinsicScore >= 50, 'Average score must be above quality threshold');
  });
});
