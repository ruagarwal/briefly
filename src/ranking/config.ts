/**
 * @file config.ts
 * @module ranking/config
 * @description
 * Default configuration and validation for the European Tech Story Ranking Engine.
 * Adheres strictly to Section 11 of the specification.
 */

import type { RankingEngineConfig } from './types.ts';

export const DEFAULT_RANKING_CONFIG: RankingEngineConfig = {
  editionWindowHours: 24,
  editionTargetSize: 25,
  editionMaxSize: 30,
  freshnessHalfLifeHours: 12,
  minimumQualityScore: 50,
  minimumEvidenceConfidence: 30,
  countrySoftCapShare: 0.25,
  topTenCountrySoftCap: 3,
  allowSoftCapRelaxation: true,
  weights: {
    economic: 0.25,
    technology: 0.20,
    novelty: 0.15,
    ecosystem: 0.15,
    freshness: 0.15,
    evidence: 0.10
  },
  scoringConfigVersion: '1.0',
  configVersion: '1.0'
};

/**
 * Validates that the configuration satisfies specification invariants:
 * 1. Weights must sum to 1.0 (within float rounding error).
 * 2. Edition max size must never exceed 30.
 * 3. Freshness half life must be positive.
 * 4. Thresholds must be in 0 - 100.
 */
export function validateRankingConfig(cfg: RankingEngineConfig): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  const weightSum = 
    cfg.weights.economic + 
    cfg.weights.technology + 
    cfg.weights.novelty + 
    cfg.weights.ecosystem + 
    cfg.weights.freshness + 
    cfg.weights.evidence;

  if (Math.abs(weightSum - 1.0) > 0.001) {
    errors.push(`Config weights must sum to 1.0 (current sum: ${weightSum.toFixed(4)})`);
  }

  if (cfg.editionMaxSize > 30) {
    errors.push(`Edition max size cannot exceed 30 (current: ${cfg.editionMaxSize})`);
  }

  if (cfg.editionTargetSize > cfg.editionMaxSize) {
    errors.push(`Edition target size (${cfg.editionTargetSize}) cannot exceed max size (${cfg.editionMaxSize})`);
  }

  if (cfg.freshnessHalfLifeHours <= 0) {
    errors.push(`Freshness half-life must be positive (current: ${cfg.freshnessHalfLifeHours})`);
  }

  if (cfg.minimumQualityScore < 0 || cfg.minimumQualityScore > 100) {
    errors.push(`Minimum quality score must be between 0 and 100 (current: ${cfg.minimumQualityScore})`);
  }

  if (cfg.minimumEvidenceConfidence < 0 || cfg.minimumEvidenceConfidence > 100) {
    errors.push(`Minimum evidence confidence must be between 0 and 100 (current: ${cfg.minimumEvidenceConfidence})`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
