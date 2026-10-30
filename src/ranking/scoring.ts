/**
 * @file scoring.ts
 * @module ranking/scoring
 * @description
 * Deterministic scoring engine for European startup and tech news.
 * Implements Section 4 and Section 5 of the European Tech Story Ranking Engine specification.
 */

import type { DimensionScores, RankingEngineConfig, EngineWeights, StoryEventType } from './types.ts';

export interface ScoreCalculationInput {
  title: string;
  summary: string;
  publishedAt: string;
  publisher: string;
  publisherDomain?: string;
  sourceReliability?: number; // 1 - 10
  keyFigures?: string;
  keyClaims?: string[];
  topicTag?: string;
  country?: string;
  author?: string;
  corroborationNotes?: string;
  knownAgeHours?: number;
}

export interface ScoreCalculationResult {
  intrinsicScore: number; // 0 - 100 unrounded
  dimensionScores: DimensionScores;
  ageHours: number;
  eventType: StoryEventType;
  extractedCountries: string[];
  explanationSeed: {
    economicFactor: string;
    techFactor: string;
    noveltyFactor: string;
    ecosystemFactor: string;
    evidenceFactor: string;
  };
}

/**
 * Calculates exponential freshness score:
 * freshness_score = 100 * 2 ** (-age_hours / freshness_half_life_hours)
 * Adheres to Section 5 of the specification.
 */
export function calculateFreshnessScore(ageHours: number, halfLifeHours = 12): number {
  const boundedAge = Math.max(0, ageHours);
  const score = 100 * Math.pow(2, -boundedAge / halfLifeHours);
  return Math.min(100, Math.max(0, score));
}

/**
 * Parses monetary figures and evaluates economic impact using logarithmic diminishing returns.
 * Section 4.2: "Do not rank solely on absolute amount. Apply diminishing returns to amount, such as logarithmic scaling."
 */
export function evaluateEconomicImpact(text: string, keyFigures?: string): { score: number; reason: string; eventType: StoryEventType } {
  const combined = (text + ' ' + (keyFigures || '')).toLowerCase();

  // Detect event type
  let eventType: StoryEventType = 'general_development';
  if (/rais|seed|series\s+[a-z]|fund(?:ing|ed)?\b|closed\s+fund|\bround\b|pre-seed|venture/i.test(combined)) {
    eventType = 'funding';
  } else if (/acqui|bought|takeover|buys\b/i.test(combined)) {
    eventType = 'acquisition';
  } else if (/merger|merges\b/i.test(combined)) {
    eventType = 'merger';
  } else if (/exit|ipo|public\s+listing|direct\s+listing/i.test(combined)) {
    eventType = 'exit';
  } else if (/deploy|commercial\s+rollout|contract|partnership|customer/i.test(combined)) {
    eventType = 'commercial_deployment';
  } else if (/regulation|policy|commission|budget|tax|antitrust|act\b/i.test(combined)) {
    eventType = 'regulation_policy';
  } else if (/layoff|restructur|bankrupt|insolven|administration/i.test(combined)) {
    eventType = 'restructuring';
  } else if (/breakthrough|model|superconductor|fusion|quantum\s+chip/i.test(combined)) {
    eventType = 'technical_milestone';
  }

  // Extract numerical amount if present
  let amountEuros = 0;
  const eurMatch = combined.match(/(?:€|eur\s*|\$|£)\s*(\d+(?:\.\d+)?)\s*(k|m|b|billion|million|mrd)?/i);
  if (eurMatch) {
    const val = parseFloat(eurMatch[1]);
    const multiplier = (eurMatch[2] || '').toLowerCase();
    if (multiplier.startsWith('b') || multiplier === 'mrd') {
      amountEuros = val * 1_000_000_000;
    } else if (multiplier.startsWith('m')) {
      amountEuros = val * 1_000_000;
    } else if (multiplier.startsWith('k')) {
      amountEuros = val * 1_000;
    } else {
      amountEuros = val * 1_000_000; // default assumption for deals in tech press
    }
  }

  let score = 45; // baseline moderate
  let reason = 'Moderate commercial activity with standard operational scale.';

  if (amountEuros > 0) {
    // Logarithmic scale:
    // €500k -> ~50
    // €5M -> ~65
    // €25M -> ~75
    // €100M -> ~85
    // €500M+ -> ~92-96
    const logAmount = Math.log10(Math.max(10_000, amountEuros));
    score = Math.min(95, Math.max(35, Math.round((logAmount - 4.5) * 18 + 40)));
    reason = `Capital transaction verified at approx €${(amountEuros / 1_000_000).toFixed(1)}M with scaled economic footprint.`;
  } else if (eventType === 'acquisition' || eventType === 'exit') {
    score = 75;
    reason = 'Strategic corporate liquidity or ownership change.';
  } else if (eventType === 'restructuring') {
    score = 70;
    reason = 'Material workforce, solvency, or operational restructuring event.';
  } else if (eventType === 'commercial_deployment') {
    score = 65;
    reason = 'Demonstrated commercial expansion or enterprise contract rollout.';
  } else if (eventType === 'regulation_policy') {
    score = 68;
    reason = 'Cross-border regulatory or fiscal policy development impacting ecosystem incentives.';
  }

  return { score, reason, eventType };
}

/**
 * Evaluates technology and strategic significance (Section 4.3).
 * Assesses underlying development rather than buzzword count.
 */
export function evaluateTechnologySignificance(text: string, topicTag?: string): { score: number; reason: string } {
  const lower = text.toLowerCase();

  let score = 45;
  let reason = 'Iterative digital product development or standard software iteration.';

  const isDeeptechOrInfrastructure = 
    /fusion|quantum|superconductor|semiconductor|chip|lithography|robotics|satellite|space|biotech|genomic|industrial\s+automation/i.test(lower);
  const isFoundationalAI = 
    /foundation\s+model|large\s+multimodal|inference\s+engine|frontier\s+ai|open-source\s+weights/i.test(lower);
  const isCleanEnergyTech = 
    /grid\s+storage|solid-state\s+battery|carbon\s+capture|green\s+hydrogen|nuclear/i.test(lower);
  const isGenericBuzzwordsOnly = 
    /innovative\s+ai|ai-powered\s+app|smart\s+tool|revolutionary\s+platform/i.test(lower) && !isDeeptechOrInfrastructure && !isFoundationalAI;

  if (isDeeptechOrInfrastructure) {
    score = 85;
    reason = 'Strategic European hardware, quantum, or deep infrastructure capability.';
  } else if (isFoundationalAI) {
    score = 80;
    reason = 'Foundational generative architecture or scalable compute infrastructure.';
  } else if (isCleanEnergyTech) {
    score = 78;
    reason = 'Critical climate transition or industrial energy resilience technology.';
  } else if (isGenericBuzzwordsOnly) {
    score = 40;
    reason = 'Standard application software layer with marketing AI terminology.';
  } else if (topicTag === 'AI & DeepTech' || topicTag === 'Climate & CleanTech') {
    score = 65;
    reason = 'Applied technical innovation in a priority European domain.';
  }

  return { score, reason };
}

/**
 * Evaluates novelty and information value (Section 4.4).
 */
export function evaluateNovelty(text: string, publisher: string): { score: number; reason: string } {
  const lower = text.toLowerCase();

  let score = 55;
  let reason = 'Credible announcement covering a known market trajectory.';

  if (/unveils\s+first|world's\s+first|european\s+first|debuts|exclusive|first\s+time/i.test(lower)) {
    score = 82;
    reason = 'First-time revelation or exclusive industry milestone.';
  } else if (/confirms|agrees|closes\s+second|follow-on/i.test(lower)) {
    score = 62;
    reason = 'Incremental confirmation of an ongoing corporate trajectory.';
  } else if (/tips|insights|how\s+to|best\s+practices|opinion|perspective/i.test(lower)) {
    score = 25;
    reason = 'Non-novel commentary or opinion analysis without primary breaking news.';
  }

  return { score, reason };
}

/**
 * Evaluates ecosystem significance (Section 4.5).
 */
export function evaluateEcosystemSignificance(text: string, country?: string): { score: number; reason: string } {
  const lower = text.toLowerCase();

  let score = 50;
  let reason = 'Relevant primary development within a single national startup ecosystem.';

  if (/cross-border|bilateral|pan-european|multiple\s+countries|across\s+europe|eu-wide/i.test(lower)) {
    score = 85;
    reason = 'Multi-market systemic implications connecting multiple European geographies.';
  } else if (/fund\s+close|new\s+fund|raises\s+€\d+m\s+fund|vc\s+firm/i.test(lower)) {
    score = 78;
    reason = 'Catalytic capital deployment vehicle benefiting early-stage European founders.';
  } else if (/parliament|directive|chancellor|budget|treaty|sovereignty/i.test(lower)) {
    score = 75;
    reason = 'Institutional policy framework impacting regional innovation climate.';
  } else if (country && country !== 'Pan-European' && country !== 'Europe') {
    score = 60;
    reason = `Notable ecosystem signal strengthening ${country}'s venture ecosystem.`;
  }

  return { score, reason };
}

/**
 * Evaluates evidence and source confidence (Section 4.6).
 */
export function evaluateEvidenceConfidence(
  publisher: string,
  sourceReliability = 8,
  author?: string,
  corroborationNotes?: string
): { score: number; reason: string; provenance: import('./types.ts').ProvenanceLabel } {
  let score = 75;
  let reason = `Reported by established editorial newsroom (${publisher}).`;
  let provenance: import('./types.ts').ProvenanceLabel = 'original_reporting';

  // Sifted, Tech.eu, Silicon Republic, Nordic 9, EU-Startups
  const isHighTierNewsroom = /(?:sifted|tech\.eu|silicon\s*republic|eu-startups|techcrunch|bloomberg|reuters|financial\s*times)/i.test(publisher);

  if (isHighTierNewsroom && author) {
    score = 90;
    reason = `Byline-credited original journalism by ${author} from verified primary outlet ${publisher}.`;
    provenance = 'original_reporting';
  } else if (isHighTierNewsroom) {
    score = 82;
    reason = `Direct reporting from verified tech publication ${publisher}.`;
    provenance = 'independently_corroborated';
  } else if (sourceReliability >= 9) {
    score = 85;
    reason = `High-reliability institutional or primary source announcement.`;
    provenance = 'primary_announcement';
  } else if (sourceReliability >= 7) {
    score = 72;
    reason = `Regional tech publication reporting.`;
    provenance = 'independently_corroborated';
  } else {
    score = 55;
    reason = `Syndicated or early community listing.`;
    provenance = 'ecosystem_listing';
  }

  if (corroborationNotes && corroborationNotes.includes('verified')) {
    score = Math.min(98, score + 5);
  }

  return { score, reason, provenance };
}

/**
 * Master scoring function: Computes the 6 weighted dimensions and the intrinsic score.
 */
export function scoreStory(
  input: ScoreCalculationInput,
  editionAsOf: Date,
  config: RankingEngineConfig
): ScoreCalculationResult {
  const pubDate = new Date(input.publishedAt);
  const editionTime = editionAsOf.getTime();
  const pubTime = !isNaN(pubDate.getTime()) ? pubDate.getTime() : editionTime - (input.knownAgeHours || 6) * 3600000;
  
  const ageHours = Math.max(0, (editionTime - pubTime) / 3600000);
  const freshness = calculateFreshnessScore(ageHours, config.freshnessHalfLifeHours);

  const fullText = `${input.title} ${input.summary}`;
  const economic = evaluateEconomicImpact(fullText, input.keyFigures);
  const tech = evaluateTechnologySignificance(fullText, input.topicTag);
  const novelty = evaluateNovelty(fullText, input.publisher);
  const ecosystem = evaluateEcosystemSignificance(fullText, input.country);
  const evidence = evaluateEvidenceConfidence(input.publisher, input.sourceReliability, input.author, input.corroborationNotes);

  const dimensionScores: DimensionScores = {
    economicImpact: economic.score,
    technologySignificance: tech.score,
    novelty: novelty.score,
    ecosystemSignificance: ecosystem.score,
    freshness: Math.round(freshness * 10) / 10,
    evidenceConfidence: evidence.score
  };

  const w = config.weights;
  const unroundedIntrinsic = 
    (w.economic * dimensionScores.economicImpact) +
    (w.technology * dimensionScores.technologySignificance) +
    (w.novelty * dimensionScores.novelty) +
    (w.ecosystem * dimensionScores.ecosystemSignificance) +
    (w.freshness * dimensionScores.freshness) +
    (w.evidence * dimensionScores.evidenceConfidence);

  const intrinsicScore = Math.min(100, Math.max(0, Math.round(unroundedIntrinsic * 100) / 100));

  // Determine countries involved
  const extractedCountries: string[] = [];
  if (input.country && input.country !== 'Pan-European' && input.country !== 'Europe') {
    extractedCountries.push(input.country);
  } else {
    extractedCountries.push('Pan-European');
  }

  return {
    intrinsicScore,
    dimensionScores,
    ageHours: Math.round(ageHours * 10) / 10,
    eventType: economic.eventType,
    extractedCountries,
    explanationSeed: {
      economicFactor: economic.reason,
      techFactor: tech.reason,
      noveltyFactor: novelty.reason,
      ecosystemFactor: ecosystem.reason,
      evidenceFactor: evidence.reason
    }
  };
}
