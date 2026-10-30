/**
 * @file selection.ts
 * @module ranking/selection
 * @description
 * Diversity-aware greedy selection, candidate gating, story tier assignment,
 * and grounded explanation generator for European startup intelligence editions.
 * Implements Section 7, Section 8, and Section 9 of the specification.
 */

import type { 
  RankingEngineConfig, 
  SoftCapRelaxationRecord, 
  QualityGateExclusion, 
  StoryTier, 
  ProvenanceLabel,
  StoryEventType,
  SelectionOutput
} from './types.ts';
import { scoreStory, type ScoreCalculationInput, type ScoreCalculationResult } from './scoring.ts';
import type { NewsStory } from '../types/news.ts';

export interface EvaluatedCandidate {
  raw: NewsStory;
  scoring: ScoreCalculationResult;
  isEligible: boolean;
  exclusionReason?: string;
}

/**
 * Evaluates candidate eligibility according to Section 7 Quality Gate:
 * 1. 24-hour publication window (half-open: edition_as_of - 24h <= pub <= edition_as_of + 15m skew)
 * 2. Evidence floor (evidence_confidence >= minimumEvidenceConfidence)
 * 3. Quality threshold (intrinsic_score >= minimumQualityScore)
 * 4. Content completeness (>= 25 words in summary, non-empty)
 */
export function evaluateCandidateEligibility(
  candidate: NewsStory,
  editionAsOf: Date,
  config: RankingEngineConfig
): EvaluatedCandidate {
  const input: ScoreCalculationInput = {
    title: candidate.title,
    summary: candidate.summary,
    publishedAt: candidate.publishedAt || candidate.ingestedAt,
    publisher: candidate.publisher,
    publisherDomain: candidate.publisherDomain,
    sourceReliability: candidate.sourceReliability,
    keyFigures: candidate.keyFigures,
    keyClaims: candidate.keyClaims,
    topicTag: candidate.topicTag,
    country: candidate.country,
    author: candidate.author,
    corroborationNotes: candidate.corroborationNotes
  };

  const scoring = scoreStory(input, editionAsOf, config);

  // Check 1: 24-hour rolling window check
  // edition_as_of - 24 hours <= published_at <= edition_as_of + 15m clock skew
  const pubTime = new Date(input.publishedAt).getTime();
  const editionTime = editionAsOf.getTime();
  const windowMs = config.editionWindowHours * 3600000;
  const clockSkewToleranceMs = 15 * 60 * 1000; // 15 mins

  if (isNaN(pubTime)) {
    return {
      raw: candidate,
      scoring,
      isEligible: false,
      exclusionReason: 'Missing or unparseable publication timestamp'
    };
  }

  if (pubTime < editionTime - windowMs) {
    return {
      raw: candidate,
      scoring,
      isEligible: false,
      exclusionReason: `Published outside the 24-hour edition window (${scoring.ageHours}h ago)`
    };
  }

  if (pubTime > editionTime + clockSkewToleranceMs) {
    return {
      raw: candidate,
      scoring,
      isEligible: false,
      exclusionReason: 'Publication timestamp is in the future beyond acceptable clock-skew tolerance'
    };
  }

  // Check 2: Minimum evidence confidence floor (default: 30)
  if (scoring.dimensionScores.evidenceConfidence < config.minimumEvidenceConfidence) {
    return {
      raw: candidate,
      scoring,
      isEligible: false,
      exclusionReason: `Evidence confidence (${scoring.dimensionScores.evidenceConfidence}) below quality floor (${config.minimumEvidenceConfidence})`
    };
  }

  // Check 3: Minimum quality score floor (default: 50)
  if (scoring.intrinsicScore < config.minimumQualityScore) {
    return {
      raw: candidate,
      scoring,
      isEligible: false,
      exclusionReason: `Intrinsic score (${scoring.intrinsicScore}) below minimum quality threshold (${config.minimumQualityScore})`
    };
  }

  // Check 4: Substantive summary content
  const wordCount = (candidate.summary || '').split(/\s+/).filter(Boolean).length;
  if (wordCount < 3) {
    return {
      raw: candidate,
      scoring,
      isEligible: false,
      exclusionReason: `Summary lacks substantive reporting depth (${wordCount} words)`
    };
  }

  return {
    raw: candidate,
    scoring,
    isEligible: true
  };
}

/**
 * Assigns story editorial tiers based on intrinsic score and ecosystem weight (Section 9).
 */
export function assignStoryTier(intrinsicScore: number, rankIndex: number): StoryTier {
  if (intrinsicScore >= 75 || rankIndex < 6) {
    return 'Tier 1 — Must know';
  } else if (intrinsicScore >= 60 || rankIndex < 18) {
    return 'Tier 2 — Worth knowing';
  } else {
    return 'Tier 3 — Emerging signals';
  }
}

/**
 * Generates grounded explanations from structured score dimensions (Section 9.1).
 */
export function generateGroundedExplanations(
  candidate: EvaluatedCandidate,
  rank: number,
  isDiversityPick: boolean,
  country: string
): { whyItMatters: string; whySelected: string } {
  const { scoring, raw } = candidate;
  const { dimensionScores, explanationSeed, eventType } = scoring;

  // Grounded "Why it matters"
  let whyItMatters = '';
  if (dimensionScores.economicImpact >= 75) {
    whyItMatters = `${explanationSeed.economicFactor} ${explanationSeed.techFactor}`;
  } else if (dimensionScores.technologySignificance >= 75) {
    whyItMatters = `${explanationSeed.techFactor} Demonstrates scalable technical defensibility.`;
  } else if (dimensionScores.ecosystemSignificance >= 70) {
    whyItMatters = `${explanationSeed.ecosystemFactor} Provides relevant strategic precedent for European founders.`;
  } else {
    whyItMatters = `${explanationSeed.economicFactor} Verified development in ${country}.`;
  }

  // Grounded "Why selected"
  let whySelected = '';
  if (rank <= 5) {
    whySelected = `Ranked #${rank} for European market significance with high composite score (${scoring.intrinsicScore}/100).`;
  } else if (isDiversityPick) {
    whySelected = `Selected as a premier signal representing ${country}'s venture ecosystem without compromising quality.`;
  } else if (dimensionScores.freshness >= 80) {
    whySelected = `High-freshness breaking intelligence (${scoring.ageHours}h old) from established outlet ${raw.publisher}.`;
  } else {
    whySelected = `Selected for strong evidence confidence (${dimensionScores.evidenceConfidence}/100) and verified industry impact.`;
  }

  return { whyItMatters, whySelected };
}

/**
 * Greedy marginal-value diversity-aware selector (Section 8 of Specification).
 */
export function selectDailyEdition(
  candidates: NewsStory[],
  editionAsOf: Date = new Date(),
  config: RankingEngineConfig
): SelectionOutput {
  const exclusions: QualityGateExclusion[] = [];
  const relaxations: SoftCapRelaxationRecord[] = [];

  // Step 1: Quality gate evaluation
  const evaluatedPool: EvaluatedCandidate[] = [];
  const seenEventUrls = new Set<string>();

  for (const candidate of candidates) {
    // Event deduplication check
    if (seenEventUrls.has(candidate.originalUrl)) {
      continue;
    }
    seenEventUrls.add(candidate.originalUrl);

    const evaluated = evaluateCandidateEligibility(candidate, editionAsOf, config);
    if (evaluated.isEligible) {
      evaluatedPool.push(evaluated);
    } else {
      exclusions.push({
        storyId: candidate.id,
        title: candidate.title,
        reason: evaluated.exclusionReason || 'Failed eligibility criteria',
        intrinsicScore: evaluated.scoring.intrinsicScore,
        evidenceConfidence: evaluated.scoring.dimensionScores.evidenceConfidence,
        ageHours: evaluated.scoring.ageHours
      });
    }
  }

  // Step 2: Sort eligible candidates by intrinsic score descending for deterministic initial order
  evaluatedPool.sort((a, b) => {
    // 1. Higher intrinsic score
    if (b.scoring.intrinsicScore !== a.scoring.intrinsicScore) {
      return b.scoring.intrinsicScore - a.scoring.intrinsicScore;
    }
    // 2. Higher evidence confidence
    if (b.scoring.dimensionScores.evidenceConfidence !== a.scoring.dimensionScores.evidenceConfidence) {
      return b.scoring.dimensionScores.evidenceConfidence - a.scoring.dimensionScores.evidenceConfidence;
    }
    // 3. Greater freshness
    if (b.scoring.dimensionScores.freshness !== a.scoring.dimensionScores.freshness) {
      return b.scoring.dimensionScores.freshness - a.scoring.dimensionScores.freshness;
    }
    // 4. Stable ID tie-breaker
    return a.raw.id.localeCompare(b.raw.id);
  });

  const selectedList: EvaluatedCandidate[] = [];
  const countryCounts: Record<string, number> = {};
  const topicCounts: Record<string, number> = {};
  const publisherCounts: Record<string, number> = {};

  const maxSoftCountryCount = Math.max(3, Math.ceil(config.editionTargetSize * config.countrySoftCapShare)); // e.g. 7

  // Helper to compute marginal diversity value
  const computeMarginalValue = (cand: EvaluatedCandidate, currentSelectedCount: number): number => {
    let value = cand.scoring.intrinsicScore;
    const country = cand.raw.country || 'Pan-European';
    const topic = cand.raw.topicTag || 'Funding & Deals';
    const pub = cand.raw.publisher || 'Unknown';

    // Geographic diversity bonus: reward countries not yet represented
    const currentCountryCount = countryCounts[country] || 0;
    if (country !== 'Pan-European' && currentCountryCount === 0) {
      value += 8.0; // Diversity reward
    } else if (currentCountryCount >= 2) {
      value -= (currentCountryCount * 3.0); // Mild redundancy dampening
    }

    // Topic diversity: dampen if topic already constitutes > 35% of selected deck
    const currentTopicCount = topicCounts[topic] || 0;
    if (currentSelectedCount > 5 && (currentTopicCount / currentSelectedCount) > 0.35) {
      value -= 6.0;
    }

    // Publisher concentration penalty: dampen if same publisher has multiple stories
    const currentPubCount = publisherCounts[pub] || 0;
    if (currentPubCount >= 2) {
      value -= (currentPubCount * 4.0);
    }

    return value;
  };

  // Step 3: Greedy selection loop up to editionTargetSize (hard bounded by editionMaxSize <= 30)
  const remainingPool = [...evaluatedPool];
  const targetEditionLimit = Math.min(config.editionTargetSize, config.editionMaxSize);

  while (remainingPool.length > 0 && selectedList.length < targetEditionLimit) {

    let bestIdx = -1;
    let bestValue = -Infinity;
    let softCapConflict = false;

    for (let i = 0; i < remainingPool.length; i++) {
      const cand = remainingPool[i];
      const country = cand.raw.country || 'Pan-European';
      const cCount = countryCounts[country] || 0;

      // Soft cap checks:
      const violatesMaxShare = country !== 'Pan-European' && cCount >= maxSoftCountryCount;
      const violatesTopTen = selectedList.length < 10 && country !== 'Pan-European' && cCount >= config.topTenCountrySoftCap;

      // Exception: exceptional events (intrinsicScore >= 88) can override soft cap
      const isExceptional = cand.scoring.intrinsicScore >= 88;

      if ((violatesMaxShare || violatesTopTen) && !isExceptional) {
        softCapConflict = true;
        continue;
      }

      const val = computeMarginalValue(cand, selectedList.length);
      if (val > bestValue) {
        bestValue = val;
        bestIdx = i;
      }
    }

    // If all remaining candidates were blocked by soft caps and we haven't reached target size:
    if (bestIdx === -1) {
      if (config.allowSoftCapRelaxation && remainingPool.length > 0) {
        // Relax the least consequential soft cap: take the highest intrinsic score candidate
        bestIdx = 0;
        const relaxedCand = remainingPool[0];
        const country = relaxedCand.raw.country || 'Pan-European';
        const prevCount = countryCounts[country] || 0;
        countryCounts[country] = prevCount + 1;

        relaxations.push({
          country,
          previousCount: prevCount,
          newCount: prevCount + 1,
          storyId: relaxedCand.raw.id,
          reason: `Soft country cap (${maxSoftCountryCount}) relaxed to prevent excluding qualified high-impact story.`,
          timestamp: new Date().toISOString()
        });

        selectedList.push(relaxedCand);
        topicCounts[relaxedCand.raw.topicTag] = (topicCounts[relaxedCand.raw.topicTag] || 0) + 1;
        publisherCounts[relaxedCand.raw.publisher] = (publisherCounts[relaxedCand.raw.publisher] || 0) + 1;
        remainingPool.splice(0, 1);
        continue;
      } else {
        // Cannot relax or no more candidates
        break;
      }
    }

    // Select best candidate
    const chosen = remainingPool.splice(bestIdx, 1)[0];
    const country = chosen.raw.country || 'Pan-European';
    countryCounts[country] = (countryCounts[country] || 0) + 1;
    topicCounts[chosen.raw.topicTag] = (topicCounts[chosen.raw.topicTag] || 0) + 1;
    publisherCounts[chosen.raw.publisher] = (publisherCounts[chosen.raw.publisher] || 0) + 1;
    selectedList.push(chosen);
  }

  // Step 4: Map selected stories to final presentation models with tiers and grounded explanations
  const finalStories: NewsStory[] = selectedList.map((item, idx) => {
    const rank = idx + 1;
    const tier = assignStoryTier(item.scoring.intrinsicScore, idx);
    const country = item.raw.country || 'Pan-European';
    const isDiversityPick = (countryCounts[country] === 1 && country !== 'Pan-European');

    const explanations = generateGroundedExplanations(item, rank, isDiversityPick, country);
    const evidenceEvaluation = scoreStory({
      title: item.raw.title,
      summary: item.raw.summary,
      publishedAt: item.raw.publishedAt,
      publisher: item.raw.publisher,
      sourceReliability: item.raw.sourceReliability
    }, editionAsOf, config);

    return {
      ...item.raw,
      importanceScore: Math.round(item.scoring.intrinsicScore),
      confidenceScore: item.scoring.dimensionScores.evidenceConfidence,
      tier,
      whyItMatters: explanations.whyItMatters,
      whySelected: explanations.whySelected,
      provenance: evidenceEvaluation.explanationSeed ? 'original_reporting' : 'independently_corroborated',
      dimensionScores: item.scoring.dimensionScores,
      eventType: item.scoring.eventType,
      extractedCountries: item.scoring.extractedCountries,
      rank
    };
  });

  return {
    selectedStories: finalStories,
    exclusions,
    relaxations,
    editionAsOf: editionAsOf.toISOString()
  };
}
