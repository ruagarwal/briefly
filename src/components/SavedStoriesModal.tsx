/**
 * @file SavedStoriesModal.tsx
 * @module components/SavedStoriesModal
 * @description
 * Local-first offline reading list drawer for Briefly.
 * Stores bookmarked stories exclusively in device localStorage (100% GDPR compliant, zero remote tracking).
 * Features:
 * - Direct tap to jump directly to saved card index
 * - Immediate removal with tactile micro-haptic feedback
 * - Clear empty state guidance
 */

import React from 'react';
import { X, Bookmark, Trash2, ArrowRight } from 'lucide-react';
import type { NewsStory } from '../types/news.ts';
import { triggerHaptic } from '../design-system/index.ts';

interface SavedStoriesModalProps {
  /** Array of currently bookmarked stories */
  savedStories: NewsStory[];
  /** Handler to navigate the feed to selected story */
  onSelectStory: (index: number) => void;
  /** Handler to remove bookmark */
  onRemoveBookmark: (id: string) => void;
  /** Modal close callback */
  onClose: () => void;
}

export const SavedStoriesModal: React.FC<SavedStoriesModalProps> = ({
  savedStories,
  onSelectStory,
  onRemoveBookmark,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[85vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950 shrink-0">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-blue-400 fill-current" />
            <h2 className="text-sm font-semibold text-white">Saved Stories</h2>
            <span className="text-xs text-slate-400 font-mono tabular-nums">({savedStories.length})</span>
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

        {/* List of saved stories */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
          {savedStories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mb-3 text-slate-500">
                <Bookmark className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-200">No saved stories yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-[220px]">
                Tap the bookmark icon on any card to save it locally for offline reading.
              </p>
            </div>
          ) : (
            savedStories.map((story, idx) => (
              <div 
                key={story.id}
                className="p-3.5 bg-slate-950/80 hover:bg-slate-950 rounded-2xl border border-slate-800/90 transition-all flex flex-col justify-between group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300">{story.publisher}</span>
                    <span aria-hidden="true">·</span>
                    <span>{story.country}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic('bookmark');
                      onRemoveBookmark(story.id);
                    }}
                    className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 
                  onClick={() => {
                    triggerHaptic('tap');
                    onSelectStory(idx);
                    onClose();
                  }}
                  className="text-xs font-semibold text-white leading-snug line-clamp-2 cursor-pointer hover:text-blue-400 transition-colors mb-2"
                >
                  {story.title}
                </h3>

                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/60">
                  <span className="text-slate-400 font-mono tabular-nums">{story.wordCount} words</span>
                  <button
                    onClick={() => {
                      triggerHaptic('tap');
                      onSelectStory(idx);
                      onClose();
                    }}
                    className="flex items-center gap-1 text-blue-400 hover:underline font-medium"
                  >
                    <span>Read card</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
