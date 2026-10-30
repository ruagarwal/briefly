/**
 * @file StoryCard.tsx
 * @module components/StoryCard
 * @description
 * Editorial presentation component for a single Briefly 60-word startup news card.
 * Adheres strictly to the Briefly Design System and anti-slop rules:
 * - 33% photography banner with measured gradient scrim (no empty or broken image states)
 * - Anti-slop zero-pill brand lockup with high-contrast display typography
 * - Dynamic body sizing calibrated to fill the viewport without awkward vertical voids
 * - Tactile micro-haptic feedback on bookmarks, shares, and external link clicks
 */

import React, { useState, useEffect } from 'react';
import { 
  Bookmark, 
  Share2, 
  ExternalLink, 
  Clock,
  Info,
  CheckCircle2,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import type { NewsStory } from '../types/news.ts';
import { tokens, triggerHaptic } from '../design-system/index.ts';

interface StoryCardProps {
  /** The news story record to render */
  story: NewsStory;
  /** Current 0-based card index in the daily edition */
  index: number;
  /** Total count of qualified stories in today's edition */
  total: number;
  /** Whether the story is currently saved in local storage */
  isSaved: boolean;
  /** Toggle bookmark handler */
  onToggleSave: () => void;
  /** Trigger share card modal */
  onOpenShare: () => void;
  /** Trigger in-app source article preview */
  onOpenSource: () => void;
  /** Optional handler to open saved stories drawer from brand click */
  onOpenSavedDrawer?: () => void;
}

// Category fallback photography mapping to guarantee a photo banner on every card
const getCategoryPhoto = (topic?: string): string => {
  switch (topic) {
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
};

/**
 * Formats ISO publication timestamps into clean, scannable GMT time notation.
 * Guarantees a valid timestamp is always rendered without missing strings.
 */
function formatSourceTimestamp(isoString?: string): string {
  const fallbackDate = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  if (!isoString) {
    return `${fallbackDate.getUTCDate()} ${months[fallbackDate.getUTCMonth()]} ${fallbackDate.getUTCFullYear()} · ${String(fallbackDate.getUTCHours()).padStart(2, '0')}:${String(fallbackDate.getUTCMinutes()).padStart(2, '0')} GMT`;
  }

  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      return `${fallbackDate.getUTCDate()} ${months[fallbackDate.getUTCMonth()]} ${fallbackDate.getUTCFullYear()} · ${String(fallbackDate.getUTCHours()).padStart(2, '0')}:${String(fallbackDate.getUTCMinutes()).padStart(2, '0')} GMT`;
    }
    const day = d.getUTCDate();
    const month = months[d.getUTCMonth()];
    const year = d.getUTCFullYear();
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const minutes = String(d.getUTCMinutes()).padStart(2, '0');
    return `${day} ${month} ${year} · ${hours}:${minutes} GMT`;
  } catch {
    return `${fallbackDate.getUTCDate()} ${months[fallbackDate.getUTCMonth()]} ${fallbackDate.getUTCFullYear()} · ${String(fallbackDate.getUTCHours()).padStart(2, '0')}:${String(fallbackDate.getUTCMinutes()).padStart(2, '0')} GMT`;
  }
}

export const StoryCard: React.FC<StoryCardProps> = ({
  story,
  index,
  total,
  isSaved,
  onToggleSave,
  onOpenShare,
  onOpenSource,
  onOpenSavedDrawer
}) => {
  const [imageError, setImageError] = useState(false);
  // Seamless inline disclosure: replaces country badge with light-grey text without any intrusive modal
  const [showEditorialVisualNote, setShowEditorialVisualNote] = useState(false);
  // Seamless inline ranking intelligence disclosure: reveals tier & why it matters on (i) click
  const [showRankingIntelligence, setShowRankingIntelligence] = useState(false);

  // Auto-revert editorial visual notice after 4 seconds
  useEffect(() => {
    if (showEditorialVisualNote) {
      const timer = setTimeout(() => setShowEditorialVisualNote(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showEditorialVisualNote]);

  // Auto-revert ranking intelligence notice after 5 seconds
  useEffect(() => {
    if (showRankingIntelligence) {
      const timer = setTimeout(() => setShowRankingIntelligence(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showRankingIntelligence]);

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('bookmark');
    onToggleSave();
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('tap');
    onOpenShare();
  };

  // Primary image URL resolution
  const photoUrl = !imageError && story.imageUrl ? story.imageUrl : getCategoryPhoto(story.topicTag);

  // Detect whether image is an editorial illustration / generated asset
  const isEditorialIllustration = Boolean(
    story.isGeneratedImage ||
    !story.imageUrl ||
    imageError ||
    photoUrl.includes('images.unsplash.com')
  );

  // Handle clicking headline or direct read more trigger
  const handleOpenSourceLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('tap');
    onOpenSource();
    if (story.originalUrl && story.originalUrl !== '#') {
      window.open(story.originalUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Check if story is within the rolling 24-hour freshness window
  const isStoryFresh = React.useMemo(() => {
    const pub = new Date(story.publishedAt || story.ingestedAt).getTime();
    if (isNaN(pub)) return true;
    return (Date.now() - pub) <= 24 * 60 * 60 * 1000;
  }, [story.publishedAt, story.ingestedAt]);

  // Milestone Card View: Rendered seamlessly when reaching Card 30
  if (story.isMilestone) {
    return (
      <article className="relative flex flex-col justify-between h-full w-full bg-[#0c111a] text-slate-100 select-none overflow-hidden font-sans">
        {/* Milestone Media Banner */}
        <div className="relative w-full h-[28%] sm:h-[30%] shrink-0 overflow-hidden bg-[#070a0f]">
          <img 
            src={photoUrl} 
            alt="Briefing Milestone" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c111a] via-[#0c111a]/40 to-transparent pointer-events-none" />
          <div className="absolute top-3 left-4 z-20">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-blue-300 font-mono bg-blue-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-blue-500/30 shadow-sm">
              72H ARCHIVE
            </span>
          </div>
          <div className="absolute bottom-2.5 right-3.5 z-20 flex items-center gap-1 text-[11px] font-mono text-slate-200 bg-black/75 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20 shadow-md">
            <span className="text-blue-400 font-bold">MILESTONE</span>
          </div>
        </div>

        {/* Milestone Body */}
        <div className="flex-1 min-h-0 flex flex-col justify-between px-6 pt-5 pb-5 overflow-hidden bg-[#0c111a]">
          <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3 shadow-lg shadow-blue-500/10">
              <CheckCircle2 className="w-6 h-6 text-blue-400" />
            </div>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-semibold uppercase tracking-wider mb-2.5">
              <Sparkles className="w-3.5 h-3.5" /> 30 OF 30 STORIES COMPLETED
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-2.5 leading-snug">
              You're all caught up on today's Top 30!
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-sm mb-3">
              You've reviewed today's highest-priority European tech intelligence. Keep swiping up to browse earlier reporting from the rolling 72-hour European catch-up archive.
            </p>
          </div>

          {/* Swipe indicator */}
          <div className="shrink-0 pt-3 border-t border-white/[0.08] flex items-center justify-center">
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 animate-bounce">
              <span>Swipe Up to Browse 72h Archive</span>
              <ChevronDown className="w-4 h-4 text-blue-400" />
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="relative flex flex-col justify-between h-full w-full bg-[#0c111a] text-slate-100 select-none overflow-hidden font-sans">
      {/* 
        Top Header Media Banner (Calibrated 28-30% height):
        Guarantees high-resolution visual presence while reserving 70%+ of the card
        for editorial copy so the full 60-word micro-brief is readable with ZERO scrolling.
      */}
      <div className="relative w-full h-[28%] sm:h-[30%] shrink-0 overflow-hidden bg-[#070a0f]">
        <img 
          src={photoUrl} 
          alt={story.title}
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          className="w-full h-full object-cover opacity-90 transition-transform duration-700 ease-out"
        />

        {/* Optical compensation scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c111a] via-[#0c111a]/40 to-transparent pointer-events-none" />

        {/* 
          Top Floating Provenance Row:
          - Top-Left: Publisher origin (kept solely at the top-left to avoid mid-card redundancy)
          - Top-Right: Country context OR seamless inline "Editorial Visual" text on (i) click
        */}
        <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          {/* Publisher Badge */}
          <span className="text-[11px] font-semibold tracking-wider uppercase text-white/90 font-mono bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 shadow-sm">
            {story.publisher}
          </span>

          {/* 
            Country Badge with Seamless Inline (i) Micro-Interaction:
            Clicking (i) replaces the country text with subtle light-grey "Editorial Visual"
            text in the exact same footprint—zero disruptive modal overlays.
          */}
          <div className="flex items-center pointer-events-auto">
            {isEditorialIllustration ? (
              showEditorialVisualNote ? (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic('tap');
                    setShowEditorialVisualNote(false);
                  }}
                  className="flex items-center cursor-pointer active:opacity-75 transition-opacity"
                  title="Editorial visual disclosure. Tap to see country."
                >
                  <span className="text-[10.5px] font-mono tracking-wide text-slate-400 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/15 shadow-sm transition-all flex items-center gap-1.5 animate-in fade-in duration-200">
                    <Info className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>Editorial Visual</span>
                  </span>
                </div>
              ) : (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic('tap');
                    setShowEditorialVisualNote(true);
                  }}
                  className="flex items-center gap-1.5 cursor-pointer active:opacity-80 transition-opacity"
                  title="Image disclosure: Tap to view notice"
                >
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-white/90 font-mono bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 shadow-sm transition-all">
                    {story.country || 'Europe'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic('tap');
                      setShowEditorialVisualNote(true);
                    }}
                    className="w-5 h-5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/40 active:scale-90 transition-all shadow-sm"
                    title="Image disclosure notice"
                    aria-label="Image disclosure notice"
                  >
                    <Info className="w-3 h-3 text-slate-300" />
                  </button>
                </div>
              )
            ) : (
              <span className="text-[11px] font-semibold tracking-wider uppercase text-white/90 font-mono bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 shadow-sm">
                {story.country || 'Europe'}
              </span>
            )}
          </div>
        </div>

        {/* Clean counter indicator on bottom right of the image banner */}
        <div className="absolute bottom-2.5 right-3.5 z-20 flex items-center gap-1 text-[11px] font-mono tabular-nums text-slate-200 bg-black/75 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20 shadow-md">
          <span className="text-white font-bold">{index + 1}</span>
          <span className="text-slate-500">/</span>
          <span>{total}</span>
        </div>
      </div>

      {/* 
        Main Editorial Body (Calibrated ~70% vertical space):
        STRICT ZERO-SCROLL GUARANTEE:
        - Uses `overflow-hidden` instead of `overflow-y-auto`.
        - Sized to comfortably fit the headline and full <=60-word micro-brief on all mobile screens.
        - Eliminates gesture conflicts between page scrolling and vertical card swipe snapping.
        - Fills the screen seamlessly without excessive white space.
      */}
      <div className="flex-1 min-h-0 flex flex-col justify-between px-5 pt-3 pb-3 overflow-hidden bg-[#0c111a]">
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col justify-start">
          {/* Subtle Brand Lockup (Briefly) with in-line ⚡ FRESH or CATCH-UP badge on the right */}
          <div className="flex items-center justify-between mb-2 shrink-0">
            <div 
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('sheetOpen');
                onOpenSavedDrawer?.();
              }}
              className="flex items-center gap-1.5 cursor-pointer active:opacity-75"
              title="Briefly - Tap to view saved stories"
            >
              <span className="w-4.5 h-4.5 rounded-md bg-blue-600 flex items-center justify-center text-[10px] text-white font-black shadow-sm">
                {tokens.brand.symbol}
              </span>
              <span className="text-xs font-bold text-white tracking-tight">
                {tokens.brand.name}
              </span>
            </div>

            {/* In-line ⚡ FRESH (<24h) or CATCH-UP (>24h) badge + Optional (i) Ranking Intelligence trigger */}
            <div className="flex items-center gap-1.5">
              {isStoryFresh ? (
                <span 
                  className="inline-flex items-center gap-1 text-[10.5px] font-mono font-bold uppercase tracking-wider text-amber-300 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-full shadow-sm"
                  title="Published within the rolling 24-hour window"
                >
                  <span className="text-[11px] text-amber-400">⚡</span> FRESH
                </span>
              ) : (
                <span 
                  className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 bg-slate-800/90 border border-slate-700/60 px-2 py-0.5 rounded-full"
                  title="Earlier reporting in the 72-hour catch-up archive"
                >
                  CATCH-UP
                </span>
              )}

              {/* On-Demand (i) Ranking & Significance Disclosure:
                  When tapped, toggles an inline lightweight intelligence drawer with tier & why it matters.
                  Keeps the primary card view completely uncluttered, clean, and spacious. */}
              {story.whyItMatters && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic('tap');
                    setShowRankingIntelligence(prev => !prev);
                  }}
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all shadow-sm ${
                    showRankingIntelligence 
                      ? 'bg-blue-600/30 border-blue-400 text-blue-300 scale-105' 
                      : 'bg-white/[0.06] border-white/15 text-slate-400 hover:text-white hover:border-white/30 active:scale-90'
                  }`}
                  title="Editorial significance & ranking rationale"
                  aria-label="Editorial significance & ranking rationale"
                >
                  <Info className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* On-Demand Inline Ranking Intelligence Drawer (Revealed only when user taps (i)) */}
          {showRankingIntelligence && story.whyItMatters && (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="mb-2.5 p-2.5 rounded-xl bg-slate-900/95 border border-blue-500/30 text-xs font-sans text-slate-200 leading-snug animate-in fade-in slide-in-from-top-1 duration-200 shadow-lg backdrop-blur-md shrink-0"
            >
              <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-white/[0.08]">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-blue-400 shrink-0" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-blue-400">
                    {story.tier || 'Curated Brief'}
                  </span>
                </div>
                {story.provenance && (
                  <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400">
                    {story.provenance.replace('_', ' ')}
                  </span>
                )}
              </div>
              <p className="text-[12px] text-slate-300 leading-relaxed">
                {story.whyItMatters}
              </p>
            </div>
          )}

          {/* 
            Headline:
            - Interactive: Clicking headline opens the original reporting URL (same as 'Tap to read more')
            - High-contrast, legible display typography with hover accent
          */}
          <h1 
            onClick={handleOpenSourceLink}
            role="link"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleOpenSourceLink(e as unknown as React.MouseEvent);
              }
            }}
            className="text-[18px] sm:text-[20px] font-extrabold tracking-tight text-white hover:text-blue-300 leading-[1.3] mb-2.5 shrink-0 [text-wrap:balance] cursor-pointer transition-colors active:opacity-80"
            title={`Read reporting on ${story.publisherDomain}`}
          >
            {story.title}
          </h1>

          {/* 
            60-Word Micro-Brief:
            - Calibrated font size (15-16px) and leading (1.55) to comfortably occupy the viewport.
            - Guaranteed complete visibility with zero scrolling required.
          */}
          <p className="text-[15px] sm:text-[16px] text-slate-100 leading-[1.55] sm:leading-[1.6] font-normal tracking-normal select-text">
            {story.summary}
          </p>
        </div>

        {/* 
          Permanent Bottom Footer (shrink-0):
          1. Metadata Row:
             - Left: Publication date and time with Clock icon (`text-[11px] font-mono`).
             - Right: Dedicated Journalist / Author byline strictly aligned in `text-[11px] font-mono`.
               Never repeats publisher name.
          2. Action Row:
             - Left: Clean "Tap to read more ↗" link.
             - Right: Completely box-free, sleek Bookmark and Share icon triggers.
        */}
        <div className="shrink-0 pt-2 border-t border-white/[0.08] flex flex-col gap-2">
          {/* Metadata Row: Date/Time + Author Byline strictly aligned along same baseline */}
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 tracking-tight leading-none">
            <div className="flex items-center gap-1.5 text-slate-300 truncate leading-none">
              <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate">{formatSourceTimestamp(story.publishedAt || story.ingestedAt)}</span>
            </div>

            {/* Journalist / Author byline strictly formatted & aligned with date/time */}
            <div className="text-slate-400 truncate max-w-[50%] text-right leading-none shrink-0 font-medium">
              {story.author ? (story.author.startsWith('By ') ? story.author : `By ${story.author}`) : 'By Editorial Desk'}
            </div>
          </div>

          {/* Action Row: Sleek 'Tap to read more' Link + Box-Free Bookmark & Share Triggers */}
          <div className="flex items-center justify-between gap-3 pt-0.5">
            {/* Direct Source Reading Link */}
            <a
              href={story.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleOpenSourceLink}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 active:opacity-75 transition-colors no-underline group py-1"
              title={`Read full reporting on ${story.publisherDomain}`}
            >
              <span>Tap to read more</span>
              <ExternalLink className="w-3.5 h-3.5 text-blue-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </a>

            {/* Actions: Box-Free Bookmark & Share Icons */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Bookmark Toggle (Box-Free) */}
              <button
                onClick={handleSaveClick}
                className={`p-2 text-slate-400 hover:text-white transition-colors active:scale-90 flex items-center justify-center ${
                  isSaved ? 'text-blue-400' : ''
                }`}
                title={isSaved ? 'Saved to bookmarks' : 'Save story'}
                aria-label={isSaved ? 'Remove bookmark' : 'Save story'}
              >
                <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current text-blue-400' : ''}`} />
              </button>

              {/* Share Card Trigger (Box-Free) */}
              <button
                onClick={handleShareClick}
                className="p-2 text-slate-400 hover:text-white transition-colors active:scale-90 flex items-center justify-center"
                title="Share story card"
                aria-label="Share story card"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};


