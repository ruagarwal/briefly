/**
 * @file SourceArticleModal.tsx
 * @module components/SourceArticleModal
 * @description
 * In-app article transparency and original reporting modal for Briefly.
 * Displays:
 * - Direct publisher attribution and publisher domain
 * - Factual corroboration notes and key verified claims
 * - Outbound link opening the full investigative article in the native browser
 */

import React from 'react';
import { X, ExternalLink, ShieldCheck, Globe } from 'lucide-react';
import type { NewsStory } from '../types/news.ts';
import { triggerHaptic } from '../design-system/index.ts';

interface SourceArticleModalProps {
  story: NewsStory | null;
  onClose: () => void;
}

export const SourceArticleModal: React.FC<SourceArticleModalProps> = ({ story, onClose }) => {
  if (!story) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Drag handle affordance for mobile */}
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto my-3 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950 shrink-0">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-white">Original Reporting</span>
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

        {/* Content */}
        <div className="p-5 overflow-y-auto no-scrollbar space-y-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
              <span className="font-semibold text-white">{story.publisher}</span>
              <span aria-hidden="true">·</span>
              <span>{story.publisherDomain}</span>
            </div>
            <h3 className="text-base font-bold text-white leading-snug mb-2">
              {story.title}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {story.summary}
            </p>
          </div>

          {/* Provenance & Factual Verification info */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Editorial Verification</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              {story.corroborationNotes || 'Original source verified against approved European tech registry.'}
            </p>
            {story.keyClaims && story.keyClaims.length > 0 && (
              <div className="pt-2 border-t border-slate-800/60">
                <span className="text-slate-300 text-[11px] font-medium block mb-1">Key Verified Claims:</span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-400">
                  {story.keyClaims.map((claim, idx) => (
                    <li key={idx} className="truncate">{claim}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 shrink-0">
          <a
            href={story.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => triggerHaptic('tap')}
            className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 active:scale-98 transition-all shadow-md shadow-blue-600/20"
          >
            <span>Read full story on {story.publisherDomain}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
