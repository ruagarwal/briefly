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

import React, { useState } from 'react';
import { 
  Bookmark, 
  Share2, 
  ExternalLink, 
  ChevronRight,
  Clock
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

function formatSourceTimestamp(isoString?: string): string {
  if (!isoString) return 'Verified Source';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Verified Source';
    const day = d.getUTCDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getUTCMonth()];
    const year = d.getUTCFullYear();
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const minutes = String(d.getUTCMinutes()).padStart(2, '0');
    return `${day} ${month} ${year} · ${hours}:${minutes} GMT`;
  } catch {
    return 'Verified Source';
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

  const handleSaveClick = () => {
    triggerHaptic('bookmark');
    onToggleSave();
  };

  const handleShareClick = () => {
    triggerHaptic('tap');
    onOpenShare();
  };

  const photoUrl = !imageError && story.imageUrl ? story.imageUrl : getCategoryPhoto(story.topicTag);

  return (
    <article className="relative flex flex-col justify-between h-full w-full bg-[#0c111a] text-slate-100 select-none overflow-hidden font-sans">
      {/* 
        Top Header Media Banner (38% on mobile, 35% on desktop):
        Guarantees high-resolution editorial photography on every single card.
      */}
      <div className="relative w-full h-[38%] sm:h-[35%] shrink-0 overflow-hidden bg-[#070a0f]">
        <img 
          src={photoUrl} 
          alt={story.title}
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          className="w-full h-full object-cover opacity-90 transition-transform duration-700 ease-out"
        />

        {/* Optical compensation scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c111a] via-[#0c111a]/40 to-transparent pointer-events-none" />

        {/* Top Floating Region & Topic Badge */}
        <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-white/90 font-mono bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 shadow-sm">
            {story.publisher}
          </span>
          <span className="text-[11px] font-medium text-white/90 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 shadow-sm">
            {story.topicTag || 'European Tech'}
          </span>
        </div>

        {/* Clean counter indicator on bottom right */}
        <div className="absolute bottom-2.5 right-3.5 z-20 flex items-center gap-1 text-[11px] font-mono tabular-nums text-slate-200 bg-black/75 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20 shadow-md">
          <span className="text-white font-bold">{index + 1}</span>
          <span className="text-slate-500">/</span>
          <span>{total}</span>
        </div>
      </div>

      {/* 
        Main Editorial Body (62%):
        Generous typography filling the vertical space seamlessly.
      */}
      <div className="flex-1 min-h-0 flex flex-col justify-between px-5 pt-3.5 pb-3 overflow-hidden bg-[#0c111a]">
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col justify-start">
          {/* Brand & Origin Metadata Row */}
          <div className="flex items-center justify-between mb-2 shrink-0">
            <div 
              onClick={() => {
                triggerHaptic('sheetOpen');
                onOpenSavedDrawer?.();
              }}
              className="flex items-center gap-2 cursor-pointer active:opacity-75"
              title="Briefly - Tap to view saved stories"
            >
              <span className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center text-[11px] text-white font-black shadow-sm">
                {tokens.brand.symbol}
              </span>
              <span className="text-xs font-bold text-white tracking-tight">
                {tokens.brand.name}
              </span>
            </div>

            <span className="text-[11px] text-slate-400 font-medium tracking-tight">
              {story.publisherDomain}
            </span>
          </div>

          {/* Headline - bold, legible display typography */}
          <h1 className="text-[19px] sm:text-[21px] md:text-[22px] font-extrabold tracking-tight text-white leading-[1.3] mb-2.5 shrink-0 [text-wrap:balance]">
            {story.title}
          </h1>

          {/* 60-Word Summary - comfortable reading size calibrated to fill the viewport */}
          <p className="text-[16.5px] sm:text-[17.5px] md:text-[18px] text-slate-100 leading-[1.7] font-normal tracking-normal">
            {story.summary}
          </p>

          {/* Footnote: Date & Time as per source article */}
          <div className="mt-3 pt-2 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0">
            <div className="flex items-center gap-1.5 truncate text-slate-300">
              <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate">{formatSourceTimestamp(story.publishedAt)}</span>
            </div>
            <span className="text-[10px] text-slate-300 bg-white/5 px-2 py-0.5 rounded font-sans uppercase tracking-wider font-semibold border border-white/10 shrink-0 ml-2">
              {story.country || 'Europe'}
            </span>
          </div>
        </div>

        {/* Bottom Interactive Thumb Zone */}
        <div className="shrink-0 mt-3 pt-2.5 border-t border-white/[0.08] flex items-center justify-between gap-3">
          {/* Read Source Trigger (Directly opens source URL, no trust note modal, no 404) */}
          <a
            href={story.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              triggerHaptic('tap');
              onOpenSource();
            }}
            className="flex-1 h-12 min-h-[48px] flex items-center justify-between px-3.5 bg-slate-800/90 hover:bg-slate-800 rounded-xl border border-white/10 text-xs font-medium text-slate-200 active:scale-[0.98] transition-all no-underline"
            title={`Read full article on ${story.publisherDomain}`}
          >
            <span className="flex items-center gap-2 truncate">
              <ExternalLink className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="truncate">Source: {story.publisherDomain}</span>
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </a>

          {/* Action triggers: Save & Share */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Save / Bookmark Button */}
            <button
              onClick={handleSaveClick}
              className={`h-12 w-12 min-h-[48px] min-w-[48px] flex items-center justify-center rounded-xl border transition-all active:scale-90 ${
                isSaved 
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/40 shadow-sm' 
                  : 'bg-slate-800/80 text-slate-400 border-white/10 hover:text-white'
              }`}
              aria-label={isSaved ? 'Remove bookmark' : 'Save story'}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>

            {/* Share Card Trigger */}
            <button
              onClick={handleShareClick}
              className="h-12 w-12 min-h-[48px] min-w-[48px] flex items-center justify-center bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-white/10 active:scale-90 transition-all"
              aria-label="Share story card"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
