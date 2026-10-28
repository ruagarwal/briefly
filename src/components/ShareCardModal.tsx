/**
 * @file ShareCardModal.tsx
 * @module components/ShareCardModal
 * @description
 * Generates an editorial card share preview and deep link for social and messaging sharing.
 * When shared, includes:
 * 1. Clean headline and 60-word verified summary
 * 2. Deep link with auto-detection for Google Play (Android) and App Store (iOS)
 * 3. Original publisher source attribution
 */

import React, { useRef, useState } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink
} from 'lucide-react';
import type { NewsStory } from '../types/news.ts';
import { tokens, triggerHaptic } from '../design-system/index.ts';

interface ShareCardModalProps {
  /** The story to be shared, or null if modal is closed */
  story: NewsStory | null;
  /** Modal close callback */
  onClose: () => void;
}

export const ShareCardModal: React.FC<ShareCardModalProps> = ({ story, onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!story) return null;

  // Universal Smart Link that routes to App Store on iOS or Google Play on Android
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://briefly.news';
  const smartDownloadUrl = `${origin}/download?story=${story.id}`;

  const shareText = `"${story.title}"\n\n${story.summary}\n\n📲 Read on Briefly (European startup news in 60 words):\n${smartDownloadUrl}\n\n🔗 Original source: ${story.originalUrl}`;

  const handleCopySummary = async () => {
    triggerHaptic('tap');
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const handleCopySmartLink = async () => {
    triggerHaptic('tap');
    try {
      await navigator.clipboard.writeText(smartDownloadUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };

  const handleNativeShare = async () => {
    triggerHaptic('tap');
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Briefly: ${story.title}`,
          text: `"${story.title}"\n\n${story.summary}\n\nDownload Briefly app:`,
          url: smartDownloadUrl,
        });
      } catch {
        // Ignored or cancelled by user
      }
    } else {
      handleCopySummary();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-[10px]">
              {tokens.brand.symbol}
            </div>
            <span className="text-sm font-semibold text-white">Share Briefly Card</span>
          </div>
          <button
            onClick={() => {
              triggerHaptic('tap');
              onClose();
            }}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Canvas Preview Container */}
        <div className="p-4 overflow-y-auto no-scrollbar flex-1 flex flex-col items-center">
          <div 
            ref={cardRef}
            className="w-full bg-[#0c111a] rounded-2xl border border-white/10 p-5 flex flex-col justify-between shadow-lg relative overflow-hidden"
          >
            {/* Ambient subtle glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              {/* Clean Briefly Brand Header - unencumbered by diluted subtitle tags */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                    {tokens.brand.symbol}
                  </div>
                  <span className="text-sm font-bold tracking-tight text-white">
                    {tokens.brand.name}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                  {story.wordCount} words
                </span>
              </div>

              {/* Publisher & Metadata */}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-2.5">
                <span className="font-semibold text-slate-300">{story.publisher}</span>
                <span aria-hidden="true">·</span>
                <span>{story.country}</span>
              </div>

              {/* Headline */}
              <h2 className="text-base font-bold text-white leading-snug mb-2.5 [text-wrap:balance]">
                {story.title}
              </h2>

              {/* 60-Word Summary */}
              <p className="text-xs text-slate-200 leading-relaxed font-normal mb-3">
                {story.summary}
              </p>
            </div>

            {/* Smart App Download Deep Link Badge */}
            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-slate-400">
              <span className="truncate">Includes Play Store & App Store link</span>
              <button
                onClick={handleCopySmartLink}
                className="text-blue-400 hover:text-blue-300 font-medium shrink-0 flex items-center gap-1 ml-2"
              >
                {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-col gap-2 shrink-0">
          <button
            onClick={handleNativeShare}
            className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 active:scale-98 transition-all shadow-md shadow-blue-600/20"
          >
            <Share2 className="w-4 h-4" />
            <span>Share with Download Link</span>
          </button>

          <button
            onClick={handleCopySummary}
            className="w-full h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-2 active:scale-98 transition-all border border-slate-700/80"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy 60-Word Summary'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
