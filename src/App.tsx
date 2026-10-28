/**
 * @file App.tsx
 * @module App
 * @description
 * Root client orchestrator for Briefly.
 * Coordinates:
 * - Edition fetching and live bookmarking state via useNewsFeed
 * - Anonymous telemetry capture via useAnonymousAnalytics
 * - Responsive smartphone chassis simulation for desktop & full-bleed for mobile
 * - Modal overlays (Share Card, Saved Stories, Source Transparency, Editorial Desk, Store Launch Guide)
 */

import React, { useState } from 'react';
import { useNewsFeed } from './hooks/useNewsFeed.ts';
import { useAnonymousAnalytics } from './hooks/useAnonymousAnalytics.ts';
import { FeedSwiper } from './components/FeedSwiper.tsx';
import { ShareCardModal } from './components/ShareCardModal.tsx';
import { SavedStoriesModal } from './components/SavedStoriesModal.tsx';
import { AdminConsoleModal } from './components/AdminConsoleModal.tsx';
import { StoreLaunchGuideModal } from './components/StoreLaunchGuideModal.tsx';
import { DeviceSimulatorFrame } from './components/DeviceSimulatorFrame.tsx';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import type { NewsStory } from './types/news.ts';

export default function App() {
  const {
    edition,
    loading,
    error,
    currentIndex,
    currentStory,
    totalStories,
    bookmarkedIds,
    savedStories,
    isBookmarked,
    toggleBookmark,
    goToNext,
    goToPrev,
    jumpToIndex,
    refreshFeed
  } = useNewsFeed();

  // Anonymous GDPR-compliant telemetry
  const { logSourceClick, logSaveAction, logShareAction } = useAnonymousAnalytics(
    currentIndex, 
    totalStories, 
    currentStory?.id
  );

  // Modals state
  const [sharingStory, setSharingStory] = useState<NewsStory | null>(null);
  const [isSavedOpen, setIsSavedOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isLaunchGuideOpen, setIsLaunchGuideOpen] = useState(false);

  return (
    <DeviceSimulatorFrame
      savedCount={bookmarkedIds.length}
      onOpenSaved={() => setIsSavedOpen(true)}
      onOpenAdmin={() => setIsAdminOpen(true)}
      onOpenLaunchGuide={() => setIsLaunchGuideOpen(true)}
      onRefresh={refreshFeed}
      isRefreshing={loading}
    >
      {loading && !edition ? (
        <div className="flex flex-col items-center justify-center h-full w-full bg-slate-950 text-slate-400 gap-3 p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="text-sm font-medium text-slate-200">Loading daily European startup briefing...</span>
          <span className="text-xs text-slate-500">Curating stories in 60 words or fewer</span>
        </div>
      ) : error && !edition ? (
        <div className="flex flex-col items-center justify-center h-full w-full bg-slate-950 text-slate-400 gap-3 p-6 text-center">
          <AlertCircle className="w-8 h-8 text-rose-500" />
          <span className="text-sm font-medium text-slate-200">Failed to load feed</span>
          <p className="text-xs text-slate-500 max-w-xs">{error}</p>
          <button
            onClick={refreshFeed}
            className="mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      ) : (
        <FeedSwiper
          stories={edition?.stories || []}
          currentIndex={currentIndex}
          isSaved={isBookmarked}
          onToggleSave={(id) => {
            toggleBookmark(id);
            logSaveAction(id);
          }}
          onOpenShare={(story) => {
            setSharingStory(story);
            logShareAction(story.id);
          }}
          onOpenSource={(story) => {
            logSourceClick(story.id);
            if (story?.originalUrl) {
              window.open(story.originalUrl, '_blank', 'noopener,noreferrer');
            }
          }}
          onNext={goToNext}
          onPrev={goToPrev}
          onOpenSaved={() => setIsSavedOpen(true)}
        />
      )}

      {/* Share Card Modal */}
      <ShareCardModal
        story={sharingStory}
        onClose={() => setSharingStory(null)}
      />

      {/* Saved Stories Modal */}
      {isSavedOpen && (
        <SavedStoriesModal
          savedStories={savedStories}
          onSelectStory={(index) => {
            jumpToIndex(index);
            setIsSavedOpen(false);
          }}
          onRemoveBookmark={toggleBookmark}
          onClose={() => setIsSavedOpen(false)}
        />
      )}

      {/* Editorial Admin Desk Modal */}
      {isAdminOpen && (
        <AdminConsoleModal
          onClose={() => setIsAdminOpen(false)}
          onFeedUpdated={refreshFeed}
        />
      )}

      {/* App Store & Google Play Launch Guide */}
      {isLaunchGuideOpen && (
        <StoreLaunchGuideModal
          onClose={() => setIsLaunchGuideOpen(false)}
        />
      )}
    </DeviceSimulatorFrame>
  );
}
