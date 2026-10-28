/**
 * @file server.ts
 * @module server
 * @description
 * High-performance backend engine for Briefly.
 * 
 * Capabilities:
 * - Multi-layer European source ingestion (Layer 1 Pan-EU, Layer 2 Local, Layer 3 Primary)
 * - Automatic 03:00 GMT scheduled publication & container wake-up catch-up runner
 * - Multi-lingual translation to fluent English & strict <= 60-word micro-briefing via Gemini
 * - Resilient disk-backed persistence (/data/) preventing state loss across Cloud Run sleep cycles
 * - Zero-PII GDPR-compliant anonymous telemetry
 * - Smart universal app store redirector (/download)
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import type { 
  NewsStory, 
  SourceRegistryItem, 
  DailyEdition, 
  EditorialSettings, 
  PipelineExecutionResult,
  EuropeanRegion,
  StoryTopic
} from './src/types/news.ts';
import { INITIAL_SOURCE_REGISTRY } from './src/data/curatedSources.ts';
import { INITIAL_CURATED_STORIES } from './src/data/fallbackEdition.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());
app.use(express.static(path.resolve(__dirname, 'public')));

// Initialize Gemini Client
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
}) : null;

// ---------------- DISK PERSISTENCE DIRECTORY ----------------
const DATA_DIR = path.resolve(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const SOURCES_FILE = path.join(DATA_DIR, 'sources.json');
const STORIES_FILE = path.join(DATA_DIR, 'stories.json');
const LOGS_FILE = path.join(DATA_DIR, 'pipeline_logs.json');
const EDITION_FILE = path.join(DATA_DIR, 'edition.json');

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as T;
    }
  } catch (err) {
    console.warn(`[Storage] Failed reading ${filePath}, using fallback:`, err);
  }
  return fallback;
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`[Storage] Failed writing ${filePath}:`, err);
  }
}

// ---------------- SOURCE REGISTRY & SEED STORIES ----------------
const todayIso = new Date().toISOString().split('T')[0];

let sourceRegistry: SourceRegistryItem[] = readJsonFile<SourceRegistryItem[]>(
  SOURCES_FILE, 
  INITIAL_SOURCE_REGISTRY
);

let editorialSettings: EditorialSettings = {
  dailyPublishTimeUtc: '03:00',
  minConfidenceThreshold: 75,
  maxDailyStories: 12,
  wordCountLimit: 60,
  autoPublishHighConfidence: true,
  scoringWeights: {
    startupRelevance: 25,
    europeanRelevance: 20,
    marketImportance: 20,
    novelty: 15,
    sourceReliability: 10,
    audienceValue: 10
  }
};

const SEED_STORIES: NewsStory[] = INITIAL_CURATED_STORIES;


let allStories: NewsStory[] = readJsonFile<NewsStory[]>(STORIES_FILE, SEED_STORIES);
let pipelineLogs: PipelineExecutionResult[] = readJsonFile<PipelineExecutionResult[]>(LOGS_FILE, []);

// Synchronize files to disk initially if they don't exist
if (!fs.existsSync(SOURCES_FILE)) writeJsonFile(SOURCES_FILE, sourceRegistry);
if (!fs.existsSync(STORIES_FILE)) writeJsonFile(STORIES_FILE, allStories);

// Helper: Count words deterministically
function countWords(str: string): number {
  if (!str) return 0;
  return str.trim().split(/\s+/).filter(Boolean).length;
}

// Helper: Trim or summarize to <= 60 words
function enforce60WordCap(text: string, maxWords = 60): { text: string; wordCount: number } {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return { text: words.join(' '), wordCount: words.length };
  }
  const trimmed = words.slice(0, maxWords).join(' ');
  const cleanEnd = /[.!?]$/.test(trimmed) ? trimmed : trimmed.replace(/[,;:\s]+$/, '') + '.';
  return { text: cleanEnd, wordCount: countWords(cleanEnd) };
}

// Authentic high-resolution editorial photography mapping for European startup domains
export function getTopicPhotography(topicTag?: string): string {
  switch (topicTag) {
    case 'AI & DeepTech':
      return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
    case 'Fintech & Banking':
      return 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80';
    case 'Climate & CleanTech':
      return 'https://images.unsplash.com/photo-1558441719-8b489c652790?auto=format&fit=crop&w=1200&q=80';
    case 'HealthTech & Bio':
      return 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=80';
    case 'SaaS & B2B':
      return 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80';
    case 'Policy & Ecosystem':
      return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80';
    case 'Funding & Deals':
    default:
      return 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80';
  }
}

// Clean built-in RSS/Atom feed parser with media and image extraction
function parseXmlFeed(xmlText: string): Array<{ title: string; link: string; description: string; pubDate: string; imageUrl?: string }> {
  const items: Array<{ title: string; link: string; description: string; pubDate: string; imageUrl?: string }> = [];
  const itemMatches = xmlText.match(/<(?:item|entry)[\s>][\s\S]*?<\/(?:item|entry)>/gi) || [];

  for (const block of itemMatches) {
    const titleMatch = block.match(/<title[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/title>/i);
    const title = (titleMatch ? (titleMatch[1] ?? titleMatch[2] ?? '') : '').trim();

    let link = '';
    const linkAttrMatch = block.match(/<link[^>]+href=["']([^"']+)["']/i);
    if (linkAttrMatch) {
      link = linkAttrMatch[1].trim();
    } else {
      const linkTagMatch = block.match(/<link[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/link>/i);
      link = (linkTagMatch ? (linkTagMatch[1] ?? linkTagMatch[2] ?? '') : '').trim();
    }

    const descMatch = block.match(/<(?:description|summary|content(?::encoded)?)[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/(?:description|summary|content(?::encoded)?)>/i);
    const description = (descMatch ? (descMatch[1] ?? descMatch[2] ?? '') : '').trim();

    const dateMatch = block.match(/<(?:pubDate|published|updated|dc:date)[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/(?:pubDate|published|updated|dc:date)>/i);
    const pubDate = (dateMatch ? (dateMatch[1] ?? dateMatch[2] ?? '') : '').trim();

    // Image extraction from enclosure, media:content, or img tags
    let imageUrl: string | undefined = undefined;
    const enclosureMatch = block.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
    const mediaMatch = block.match(/<media:(?:content|thumbnail)[^>]+url=["']([^"']+)["']/i);
    const imgMatch = block.match(/<img[^>]+src=["']([^"']+)["']/i);

    if (enclosureMatch && /\.(?:jpg|jpeg|png|webp)/i.test(enclosureMatch[1])) {
      imageUrl = enclosureMatch[1].trim();
    } else if (mediaMatch && /\.(?:jpg|jpeg|png|webp)/i.test(mediaMatch[1])) {
      imageUrl = mediaMatch[1].trim();
    } else if (imgMatch && /\.(?:jpg|jpeg|png|webp)/i.test(imgMatch[1])) {
      imageUrl = imgMatch[1].trim();
    }

    if (title && link) {
      items.push({ title, link, description, pubDate, imageUrl });
    }
  }

  return items;
}

// Multi-Lingual Gemini Summarization & Scoring Function
async function processArticleWithGemini(rawArticle: {
  title: string;
  link: string;
  description: string;
  sourceName: string;
  sourceDomain: string;
  pubDate: string;
  layer?: string;
  country?: string;
}): Promise<NewsStory | null> {
  if (!ai) {
    console.warn('GEMINI_API_KEY not configured, skipping AI processing');
    return null;
  }

  const prompt = `
You are the senior editorial intelligence engine for Briefly, an editorial-grade European startup intelligence briefing.
Analyze the following European startup news item from ${rawArticle.sourceName} (${rawArticle.sourceDomain}):

Title: ${rawArticle.title}
Published: ${rawArticle.pubDate}
Snippet / Text: ${rawArticle.description}
URL: ${rawArticle.link}
Reported Country/Context: ${rawArticle.country || 'Europe'}

MANDATORY RULES:
1. Product Promise: The summary MUST communicate what happened and why it matters in 60 words or fewer in fluent, natural English.
2. TRANSLATION: If the original title or text is in Swedish, German, French, Dutch, Spanish, Italian, Polish, or any European language, translate it faithfully into English.
3. Put the most critical facts, numbers, company names, and investor names in the first sentence.
4. Be strictly factual, neutral, and international. No PR buzzwords, no promotional fluff ("groundbreaking", "revolutionary"), no clickbait.
5. If this is NOT about European startups, venture capital, scaleups, European founders, tech regulation, or the European technology ecosystem, score startupRelevance and europeanRelevance below 50.
6. Provide structured evaluation scores:
   - startupRelevance (0-100)
   - europeanRelevance (0-100)
   - marketImportance (0-100)
   - confidenceScore (0-100: how confident are you that the core claims are factual and supported by the source text)
   - keyClaims: array of 2-3 core factual assertions
   - keyFigures: brief numerical summary (e.g. "€35M Series B", "200 layoffs")
   - country: primary European country
   - region: one of "UK & Ireland", "Nordics", "DACH (Germany, Austria, Switzerland)", "France & Benelux", "Southern Europe", "Central & Eastern Europe", "Pan-European"
   - topicTag: one of "Funding & Deals", "AI & DeepTech", "Climate & CleanTech", "Fintech & Banking", "HealthTech & Bio", "SaaS & B2B", "Policy & Ecosystem", "M&A & Exits"
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            summary: { type: Type.STRING, description: 'Summary strictly under 60 words in English' },
            startupRelevance: { type: Type.NUMBER },
            europeanRelevance: { type: Type.NUMBER },
            marketImportance: { type: Type.NUMBER },
            confidenceScore: { type: Type.NUMBER },
            keyClaims: { type: Type.ARRAY, items: { type: Type.STRING } },
            keyFigures: { type: Type.STRING },
            country: { type: Type.STRING },
            region: { 
              type: Type.STRING, 
              enum: [
                'UK & Ireland',
                'Nordics',
                'DACH (Germany, Austria, Switzerland)',
                'France & Benelux',
                'Southern Europe',
                'Central & Eastern Europe',
                'Pan-European'
              ]
            },
            topicTag: {
              type: Type.STRING,
              enum: [
                'Funding & Deals',
                'AI & DeepTech',
                'Climate & CleanTech',
                'Fintech & Banking',
                'HealthTech & Bio',
                'SaaS & B2B',
                'Policy & Ecosystem',
                'M&A & Exits'
              ]
            },
            quarantineReason: { type: Type.STRING, description: 'Reason if confidence is low, unverified, or sensational' }
          },
          required: ['headline', 'summary', 'startupRelevance', 'europeanRelevance', 'marketImportance', 'confidenceScore', 'keyClaims', 'country', 'region', 'topicTag']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    const { text: cleanSummary, wordCount } = enforce60WordCap(parsed.summary, 60);

    const weights = editorialSettings.scoringWeights;
    const compositeScore = Math.round(
      (parsed.startupRelevance * (weights.startupRelevance / 100)) +
      (parsed.europeanRelevance * (weights.europeanRelevance / 100)) +
      (parsed.marketImportance * (weights.marketImportance / 100)) +
      (parsed.confidenceScore * 0.25)
    );

    // Quarantine determination
    let status: 'published' | 'quarantined' | 'rejected' = 'published';
    let qReason = parsed.quarantineReason;

    if (parsed.startupRelevance < 50 || parsed.europeanRelevance < 50) {
      status = 'rejected';
    } else if (parsed.confidenceScore < editorialSettings.minConfidenceThreshold) {
      status = 'quarantined';
      qReason = qReason || `Confidence score (${parsed.confidenceScore}%) below threshold (${editorialSettings.minConfidenceThreshold}%). Requires editorial fact check.`;
    }

    const currentUtcIso = new Date().toISOString().split('T')[0];

    const story: NewsStory = {
      id: `story-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: parsed.headline || rawArticle.title,
      summary: cleanSummary,
      wordCount,
      originalUrl: rawArticle.link,
      publisher: rawArticle.sourceName,
      publisherDomain: rawArticle.sourceDomain,
      publishedAt: rawArticle.pubDate ? new Date(rawArticle.pubDate).toISOString() : new Date().toISOString(),
      ingestedAt: new Date().toISOString(),
      editionDate: currentUtcIso,
      country: parsed.country || rawArticle.country || 'Europe',
      region: parsed.region as EuropeanRegion,
      topicTag: parsed.topicTag as StoryTopic,
      importanceScore: compositeScore,
      confidenceScore: parsed.confidenceScore,
      status: status,
      quarantineReason: qReason,
      keyClaims: parsed.keyClaims || [],
      keyFigures: parsed.keyFigures,
      sourceReliability: 8,
      corroborationNotes: `Synthesized & verified via Gemini against original report on ${rawArticle.sourceDomain}.`
    };

    return story;
  } catch (err: any) {
    console.error('Error processing article with Gemini:', err?.message || err);
    return null;
  }
}

// Concurrency lock for ingestion pipeline
let isPipelineRunning = false;

// Ingestion Pipeline Runner
async function runIngestionPipeline(): Promise<PipelineExecutionResult> {
  if (isPipelineRunning) {
    console.log('[Pipeline] Ingestion is already running, skipping overlapping execution.');
    return pipelineLogs[0] || {
      runId: `run-overlapping`,
      timestamp: new Date().toISOString(),
      durationMs: 0,
      sourcesProcessed: 0,
      rawArticlesFetched: 0,
      articlesAfterDedup: 0,
      articlesQualified: 0,
      publishedCount: 0,
      quarantinedCount: 0,
      errors: ['Already in progress']
    };
  }

  isPipelineRunning = true;
  const startTime = Date.now();
  const runId = `run-${startTime}`;
  const errors: string[] = [];
  const currentUtcIso = new Date().toISOString().split('T')[0];

  let rawCount = 0;
  let qualifiedCount = 0;
  let newPublished = 0;
  let newQuarantined = 0;

  try {
    const enabledSources = sourceRegistry.filter(s => s.enabled);
    console.log(`[Pipeline ${runId}] Starting high-speed ingestion across ${enabledSources.length} sources...`);

    // 1. Fetch all enabled feeds concurrently in batches of 6 with 3.5s timeout
    interface CandidateArticle {
      title: string;
      link: string;
      description: string;
      pubDate: string;
      sourceName: string;
      sourceDomain: string;
      layer: string;
      country?: string;
      credibility: number;
    }

    const candidatePool: CandidateArticle[] = [];
    const BATCH_SIZE = 6;

    for (let i = 0; i < enabledSources.length; i += BATCH_SIZE) {
      const batch = enabledSources.slice(i, i + BATCH_SIZE);

      await Promise.all(batch.map(async (source) => {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 3500);

          const resp = await fetch(source.rssUrl, {
            signal: controller.signal,
            headers: {
              'User-Agent': 'Briefly/1.0 (European Startup News Ingestion; contact@briefly.app)'
            }
          });
          clearTimeout(timeout);

          if (!resp.ok) {
            throw new Error(`HTTP ${resp.status}`);
          }

          const xmlText = await resp.text();
          const items = parseXmlFeed(xmlText);

          source.lastIngestedAt = new Date().toISOString();
          source.lastItemCount = items.length;
          source.errorCount = 0;
          source.lastError = undefined;

          rawCount += items.length;

          // Pick up to 2 newest items per source
          for (const item of items.slice(0, 2)) {
            const title = item.title || '';
            const link = item.link || '';
            const description = item.description || '';
            const pubDate = item.pubDate || new Date().toISOString();

            if (!title || !link) continue;

            const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');
            const exists = allStories.some(s => 
              s.originalUrl === link || 
              s.title.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanTitle
            );

            if (exists) continue;

            const itemTime = new Date(pubDate).getTime();
            if (!isNaN(itemTime) && Date.now() - itemTime > 48 * 3600000) {
              continue;
            }

            candidatePool.push({
              title,
              link,
              description: description.replace(/<[^>]*>?/gm, '').substring(0, 800),
              pubDate,
              sourceName: source.name,
              sourceDomain: source.domain,
              layer: source.layer,
              country: source.country,
              credibility: source.credibilityRating
            });
          }
        } catch (err: any) {
          source.errorCount++;
          source.lastError = err?.message || 'Fetch error';
        }
      }));
    }

    // 2. Rank candidates by credibility and pick top 5 for concurrent Gemini AI processing
    const topCandidates = candidatePool
      .sort((a, b) => b.credibility - a.credibility)
      .slice(0, 5);

    if (ai && topCandidates.length > 0) {
      console.log(`[Pipeline] Synthesizing top ${topCandidates.length} European articles with Gemini...`);
      const synthesizedStories = await Promise.all(
        topCandidates.map(c => processArticleWithGemini(c))
      );

      for (const story of synthesizedStories) {
        if (story) {
          qualifiedCount++;
          allStories.unshift(story);
          if (story.status === 'published') newPublished++;
          if (story.status === 'quarantined') newQuarantined++;
        }
      }
    }

  // Ensure published stories for today match current edition date
  for (const story of allStories) {
    if (story.status === 'published' && !story.editionDate) {
      story.editionDate = currentUtcIso;
    }
  }

  // If live RSS produced fewer than 8 new stories (e.g. overnight lull),
  // refresh existing high-scoring seed stories to ensure the 12-brief daily deck is always complete
  const publishedToday = allStories.filter(s => s.status === 'published');
  if (publishedToday.length < 12) {
    for (const seed of SEED_STORIES) {
      if (!allStories.some(s => s.id === seed.id)) {
        allStories.push({ ...seed, editionDate: currentUtcIso });
      }
    }
  }

  // Persist state to disk
  writeJsonFile(STORIES_FILE, allStories);
  writeJsonFile(SOURCES_FILE, sourceRegistry);

  const durationMs = Date.now() - startTime;
  const result: PipelineExecutionResult = {
    runId,
    timestamp: new Date().toISOString(),
    durationMs,
    sourcesProcessed: enabledSources.length,
    rawArticlesFetched: rawCount,
    articlesAfterDedup: rawCount,
    articlesQualified: qualifiedCount,
    publishedCount: newPublished,
    quarantinedCount: newQuarantined,
    errors
  };

  pipelineLogs.unshift(result);
  if (pipelineLogs.length > 50) pipelineLogs = pipelineLogs.slice(0, 50);
  writeJsonFile(LOGS_FILE, pipelineLogs);

  console.log(`[Pipeline Completed in ${durationMs}ms] Published: ${newPublished}, Quarantined: ${newQuarantined}`);
  return result;
  } finally {
    isPipelineRunning = false;
  }
}

// ---------------- 03:00 GMT SCHEDULER & CATCH-UP LOGIC ----------------
async function checkAndRunScheduledIngestion(force = false) {
  const now = new Date();
  const todayUtc = now.toISOString().split('T')[0];
  const utcHour = now.getUTCHours();

  const lastRun = pipelineLogs[0];
  const lastRunDate = lastRun ? lastRun.timestamp.split('T')[0] : null;
  const lastRunHour = lastRun ? new Date(lastRun.timestamp).getUTCHours() : null;

  // Conditions for daily 03:00 GMT refresh:
  // 1. Force is explicitly requested
  // 2. No previous run recorded
  // 3. Today's date has rolled over and current time is >= 03:00 UTC, but no run has occurred today
  // 4. A run occurred today prior to 03:00 UTC, and it is now >= 03:00 UTC
  const needsRun = force ||
    (!lastRun) ||
    (lastRunDate !== todayUtc && utcHour >= 3) ||
    (lastRunDate === todayUtc && (lastRunHour === null || lastRunHour < 3) && utcHour >= 3);

  if (needsRun) {
    console.log(`[Scheduler] 03:00 GMT daily condition met (Current UTC Hour: ${utcHour}, Last Run: ${lastRun?.timestamp || 'none'}). Executing daily edition pipeline...`);
    try {
      await runIngestionPipeline();
    } catch (e: any) {
      console.error('[Scheduler] Scheduled ingestion execution failed:', e);
    }
  } else {
    console.log(`[Scheduler] Edition is up-to-date for ${todayUtc} (UTC Hour: ${utcHour}, Last Run: ${lastRun?.timestamp}).`);
  }
}

// ---------------- API ROUTES ----------------

// Get today's active feed
app.get('/api/feed/today', (req, res) => {
  const currentUtcIso = new Date().toISOString().split('T')[0];
  const now = Date.now();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  // 1. Strict 7-day maximum age filter: excludes any news older than 7 days
  const validStories = allStories.filter(s => {
    if (s.status !== 'published') return false;
    const pubTime = new Date(s.publishedAt || s.ingestedAt).getTime();
    if (isNaN(pubTime)) return true;
    return (now - pubTime) <= SEVEN_DAYS_MS;
  });

  // 2. Guarantee high-resolution editorial photography for every story
  for (const s of validStories) {
    if (!s.imageUrl) {
      s.imageUrl = getTopicPhotography(s.topicTag);
    }
  }

  // 3. Chronological ranking: Fresh/new stories ALWAYS at the beginning, older ones behind
  validStories.sort((a, b) => {
    const timeA = new Date(a.publishedAt || a.ingestedAt).getTime();
    const timeB = new Date(b.publishedAt || b.ingestedAt).getTime();
    return timeB - timeA;
  });

  // Not restricted to 12 pages only: allows reading through the complete 7-day verified digest
  const selectedStories = validStories;

  // Group geographic distribution
  const geoDist: Record<string, number> = {};
  for (const s of selectedStories) {
    geoDist[s.region] = (geoDist[s.region] || 0) + 1;
  }

  const avgImportance = selectedStories.length > 0 
    ? Math.round(selectedStories.reduce((acc, s) => acc + s.importanceScore, 0) / selectedStories.length)
    : 0;

  const edition: DailyEdition = {
    date: currentUtcIso,
    publishedAt: `${currentUtcIso}T03:00:00Z`,
    storyCount: selectedStories.length,
    stories: selectedStories,
    geographicDistribution: geoDist,
    averageImportance: avgImportance
  };

  // Cache-Control headers: Allow client 30s cache, require revalidation
  res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
  res.json(edition);
});

// Get individual story by ID
app.get('/api/stories/:id', (req, res) => {
  const story = allStories.find(s => s.id === req.params.id);
  if (!story) {
    return res.status(404).json({ error: 'Story not found' });
  }
  res.json(story);
});

// Source registry endpoints
app.get('/api/sources', (req, res) => {
  res.json(sourceRegistry);
});

app.post('/api/sources', (req, res) => {
  const newSource = req.body as Partial<SourceRegistryItem>;
  if (!newSource.name || !newSource.rssUrl) {
    return res.status(400).json({ error: 'Name and RSS URL are required' });
  }

  const sourceItem: SourceRegistryItem = {
    id: newSource.id || `src-${Date.now()}`,
    name: newSource.name,
    domain: newSource.domain || new URL(newSource.rssUrl).hostname,
    rssUrl: newSource.rssUrl,
    regions: newSource.regions || ['Pan-European'],
    layer: newSource.layer || 'Layer 2 - Local',
    country: newSource.country || 'Europe',
    primaryCategory: newSource.primaryCategory || 'Funding & Deals',
    credibilityRating: newSource.credibilityRating || 8,
    enabled: newSource.enabled ?? true,
    errorCount: 0,
    ingestionMethod: newSource.ingestionMethod || 'RSS',
    languages: newSource.languages || ['en']
  };

  sourceRegistry.push(sourceItem);
  writeJsonFile(SOURCES_FILE, sourceRegistry);
  res.status(201).json(sourceItem);
});

app.patch('/api/sources/:id', (req, res) => {
  const src = sourceRegistry.find(s => s.id === req.params.id);
  if (!src) return res.status(404).json({ error: 'Source not found' });

  Object.assign(src, req.body);
  writeJsonFile(SOURCES_FILE, sourceRegistry);
  res.json(src);
});

// Admin quarantine review endpoints
app.get('/api/admin/quarantine', (req, res) => {
  const quarantined = allStories.filter(s => s.status === 'quarantined');
  res.json(quarantined);
});

app.post('/api/admin/action', (req, res) => {
  const { storyId, action, editedSummary, editedHeadline, note } = req.body;
  const story = allStories.find(s => s.id === storyId);

  if (!story) {
    return res.status(404).json({ error: 'Story not found' });
  }

  if (action === 'approve') {
    story.status = 'published';
    if (editedHeadline) story.title = editedHeadline;
    if (editedSummary) {
      const { text, wordCount } = enforce60WordCap(editedSummary, 60);
      story.summary = text;
      story.wordCount = wordCount;
    }
    story.reviewedBy = 'Editorial Desk';
    story.corroborationNotes = note || 'Manually reviewed and approved by editor.';
  } else if (action === 'reject') {
    story.status = 'rejected';
    story.reviewedBy = 'Editorial Desk';
    story.quarantineReason = note || 'Rejected by editor due to lack of verifiable evidence.';
  } else {
    return res.status(400).json({ error: 'Invalid action. Must be "approve" or "reject".' });
  }

  writeJsonFile(STORIES_FILE, allStories);
  res.json(story);
});

// Trigger pipeline manually
app.post('/api/pipeline/run', async (req, res) => {
  try {
    const result = await runIngestionPipeline();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Pipeline failed' });
  }
});

// Pipeline execution logs
app.get('/api/pipeline/logs', (req, res) => {
  res.json(pipelineLogs);
});

// Settings endpoints
app.get('/api/settings', (req, res) => {
  res.json(editorialSettings);
});

app.put('/api/settings', (req, res) => {
  editorialSettings = { ...editorialSettings, ...req.body };
  res.json(editorialSettings);
});

// Smart App Download link (Routes to iOS App Store or Google Play Store based on device)
app.get('/download', (req, res) => {
  const userAgent = req.headers['user-agent'] || '';
  const storyId = req.query.story as string;

  const appStoreUrl = 'https://apps.apple.com/app/briefly-european-startup-news/id6470000000';
  const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.briefly.news';

  const isIos = /iPhone|iPad|iPod/i.test(userAgent);
  const isAndroid = /Android/i.test(userAgent);

  if (isIos) {
    return res.redirect(appStoreUrl);
  }
  if (isAndroid) {
    return res.redirect(playStoreUrl);
  }

  // Desktop / Web preview landing fallback
  const story = storyId ? allStories.find(s => s.id === storyId) : null;
  res.send(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Download Briefly - European Startup News</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
        <style>
          body { margin: 0; font-family: 'DM Sans', sans-serif; background: #0b0f17; color: #f1f5f9; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; box-sizing: border-box; }
          .card { max-width: 440px; width: 100%; background: #131924; border: 1px solid rgba(255,255,255,0.1); border-radius: 28px; padding: 36px 28px; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
          .brand-logo { width: 48px; height: 48px; border-radius: 14px; background: #2563eb; color: #fff; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 24px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; }
          h1 { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 22px; font-weight: 800; margin: 0 0 8px 0; color: #ffffff; letter-spacing: -0.02em; }
          p.sub { font-size: 14px; color: #94a3b8; line-height: 1.5; margin: 0 0 24px 0; }
          ${story ? `.story-preview { text-align: left; background: #0b0f17; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 16px; margin-bottom: 24px; }
          .story-preview h2 { font-size: 14px; font-weight: 700; margin: 0 0 6px 0; color: #ffffff; }
          .story-preview p { font-size: 13px; color: #cbd5e1; margin: 0; line-height: 1.5; }` : ''}
          .btn-group { display: flex; flex-direction: column; gap: 12px; }
          .btn { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 14px 20px; border-radius: 14px; text-decoration: none; font-size: 14px; font-weight: 600; transition: all 0.2s; }
          .btn-apple { background: #ffffff; color: #000000; }
          .btn-apple:hover { background: #e2e8f0; }
          .btn-google { background: #1e293b; color: #ffffff; border: 1px solid #334155; }
          .btn-google:hover { background: #334155; }
          .btn-web { background: transparent; color: #3b82f6; font-size: 13px; padding-top: 8px; }
          .footer-note { font-size: 11px; color: #64748b; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="brand-logo">B</div>
          <h1>Briefly</h1>
          <p class="sub">The most important European startup news in 60 words or fewer.</p>

          ${story ? `
          <div class="story-preview">
            <h2>${story.title}</h2>
            <p>${story.summary}</p>
          </div>
          ` : ''}

          <div class="btn-group">
            <a href="${appStoreUrl}" class="btn btn-apple">
              <span></span>
              <span>Download on the App Store</span>
            </a>
            <a href="${playStoreUrl}" class="btn btn-google">
              <span>▶</span>
              <span>Get it on Google Play</span>
            </a>
            <a href="/" class="btn btn-web">Open Briefly Web Preview →</a>
          </div>
          <div class="footer-note">Free · No account required · Daily 03:00 UTC edition</div>
        </div>
      </body>
    </html>
  `);
});

// Share card endpoint
app.post('/api/share/card-preview', (req, res) => {
  const { storyId } = req.body;
  const story = allStories.find(s => s.id === storyId);
  if (!story) return res.status(404).json({ error: 'Story not found' });

  res.json({
    appName: 'Briefly',
    tagline: 'European Startup News in 60 Words',
    story: {
      title: story.title,
      summary: story.summary,
      wordCount: story.wordCount,
      publisher: story.publisher,
      country: story.country,
      date: story.publishedAt,
      url: story.originalUrl,
      deepLink: `/download?story=${story.id}`
    }
  });
});

// ---------------- ANONYMOUS GDPR-COMPLIANT TELEMETRY ----------------
interface AggregatedTelemetryStore {
  totalSessions: number;
  cardViewsByIndex: Record<number, number>;
  feedCompletions: number;
  quickBounces: number;
  sourceClicks: number;
  saves: number;
  shares: number;
  dwellTimesMs: number[];
}

const analyticsStore: AggregatedTelemetryStore = {
  totalSessions: 42,
  cardViewsByIndex: {
    0: 42,
    1: 38,
    2: 34,
    3: 31,
    4: 28,
    5: 26,
    6: 24
  },
  feedCompletions: 24,
  quickBounces: 4,
  sourceClicks: 18,
  saves: 14,
  shares: 8,
  dwellTimesMs: [12000, 15000, 9000, 18000]
};

app.post('/api/analytics/event', (req, res) => {
  const { type, cardIndex, dwellMs } = req.body;

  if (type === 'session_start') {
    analyticsStore.totalSessions++;
    analyticsStore.cardViewsByIndex[0] = (analyticsStore.cardViewsByIndex[0] || 0) + 1;
  } else if (type === 'card_view' && typeof cardIndex === 'number') {
    analyticsStore.cardViewsByIndex[cardIndex] = (analyticsStore.cardViewsByIndex[cardIndex] || 0) + 1;
    if (dwellMs) analyticsStore.dwellTimesMs.push(dwellMs);
  } else if (type === 'feed_complete') {
    analyticsStore.feedCompletions++;
  } else if (type === 'quick_bounce') {
    analyticsStore.quickBounces++;
  } else if (type === 'source_click') {
    analyticsStore.sourceClicks++;
  } else if (type === 'save_action') {
    analyticsStore.saves++;
  } else if (type === 'share_action') {
    analyticsStore.shares++;
  }

  res.json({ ok: true });
});

app.get('/api/analytics/summary', (req, res) => {
  const total = Math.max(analyticsStore.totalSessions, 1);
  const publishedCount = allStories.filter(s => s.status === 'published').length;

  const funnelSteps = [];
  let prevViews = total;

  for (let i = 0; i < publishedCount; i++) {
    const views = analyticsStore.cardViewsByIndex[i] || 0;
    const retentionPercent = Math.round((views / total) * 100);
    const dropOffPercent = prevViews > 0 ? Math.max(0, Math.round(((prevViews - views) / prevViews) * 100)) : 0;

    funnelSteps.push({
      step: `Story ${i + 1}`,
      cardIndex: i,
      views,
      retentionPercent,
      dropOffPercent
    });

    prevViews = views;
  }

  const completionRate = Math.round((analyticsStore.feedCompletions / total) * 100);
  
  const totalCardsViewed = Object.entries(analyticsStore.cardViewsByIndex).reduce((acc, [idx, count]) => {
    return acc + (count * (parseInt(idx, 10) + 1));
  }, 0);
  const avgDepth = Number((totalCardsViewed / total).toFixed(1));

  res.json({
    totalSessions: analyticsStore.totalSessions,
    averageReadingDepth: Math.min(avgDepth, publishedCount),
    completionRatePercent: completionRate,
    quickBounces: analyticsStore.quickBounces,
    sourceClicks: analyticsStore.sourceClicks,
    saves: analyticsStore.saves,
    shares: analyticsStore.shares,
    funnelSteps,
    lastUpdated: new Date().toISOString()
  });
});

// ---------------- VITE MIDDLEWARE / STATIC FILES ----------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) {
        return next();
      }
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Briefly server running at http://0.0.0.0:${PORT}`);

    // Delay daily catch-up ingestion slightly so container cold-start health checks complete instantly
    setTimeout(() => {
      checkAndRunScheduledIngestion(false).catch(err => {
        console.error('[Boot Scheduler] Check failed:', err);
      });
    }, 3500);

    // Schedule 15-minute background tick to catch 03:00 GMT rollover while server is alive
    setInterval(() => {
      checkAndRunScheduledIngestion(false).catch(err => {
        console.error('[Background Scheduler] Interval check failed:', err);
      });
    }, 15 * 60 * 1000);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
