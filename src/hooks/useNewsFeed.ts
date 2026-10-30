/**
 * @file useNewsFeed.ts
 * @module hooks/useNewsFeed
 * @description
 * Primary state management hook for Briefly's daily edition feed.
 * Features:
 * - Instant Stale-While-Revalidate hydration from localStorage (zero blank screens on cold start)
 * - Automatic exponential retry (3 attempts) if container is booting
 * - Active card index, keyboard navigation, and bounds checking
 * - Local-first offline bookmarking persisted in localStorage
 * - Tracking story read state to optimize reading progress
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { DailyEdition, NewsStory } from '../types/news.ts';
import { FALLBACK_EDITION } from '../data/fallbackEdition.ts';
import { logTelemetryEvent } from './useAnonymousAnalytics.ts';

const CACHED_EDITION_STORAGE_KEY = 'briefly_cached_edition_v4';
const BOOKMARKS_STORAGE_KEY = 'briefly_bookmarks_v1';
const READ_STORIES_STORAGE_KEY = 'briefly_read_ids_v1';

export function useNewsFeed() {
  // 1. Instant hydration from cache or fallback edition (zero blank screens, zero loading blocks)
  const [edition, setEdition] = useState<DailyEdition>(() => {
    try {
      const cached = localStorage.getItem(CACHED_EDITION_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.stories?.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Could not read cached edition:', e);
    }
    return FALLBACK_EDITION;
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(READ_STORIES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch today's edition with retry mechanism for Cloud Run container warm-up
  const fetchFeed = useCallback(async (retryCount = 0) => {
    setIsRefreshing(true);
    if (!edition) {
      setLoading(true);
    }
    setError(null);

    const startTime = performance.now();
    try {
      const res = await fetch('/api/feed/today');
      const latencyMs = Math.round(performance.now() - startTime);
      if (latencyMs > 3000) {
        logTelemetryEvent('slow_load', { latencyMs });
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data: DailyEdition = await res.json();
      
      if (data && Array.isArray(data.stories) && data.stories.length > 0) {
        setEdition(data);
        try {
          localStorage.setItem(CACHED_EDITION_STORAGE_KEY, JSON.stringify(data));
        } catch (storageErr) {
          console.warn('Failed to persist edition to localStorage:', storageErr);
        }
      }
    } catch (err: any) {
      console.warn(`[useNewsFeed] Fetch failed (attempt ${retryCount + 1}):`, err?.message);
      
      // Auto-retry up to 3 times with exponential backoff (1s, 2s, 4s) to tolerate server waking up
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000;
        retryTimeoutRef.current = setTimeout(() => {
          fetchFeed(retryCount + 1);
        }, delay);
      } else {
        logTelemetryEvent('feed_load_failure', { errorMessage: err?.message || 'Feed fetch failed' });
        // If we already have a cached edition, keep showing it without blocking error!
        if (!edition) {
          setError(err?.message || 'Connecting to news server...');
        }
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [edition]);

  useEffect(() => {
    fetchFeed(0);
    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, []);

  // Mark current story as read
  useEffect(() => {
    if (edition?.stories[currentIndex]) {
      const currentStoryId = edition.stories[currentIndex].id;
      setReadIds(prev => {
        if (!prev.includes(currentStoryId)) {
          const updated = [...prev, currentStoryId];
          try {
            localStorage.setItem(READ_STORIES_STORAGE_KEY, JSON.stringify(updated));
          } catch (e) {
            console.error('Storage error', e);
          }
          return updated;
        }
        return prev;
      });
    }
  }, [currentIndex, edition]);

  // Toggle bookmark (local-first)
  const toggleBookmark = useCallback((storyId: string) => {
    setBookmarkedIds(prev => {
      const next = prev.includes(storyId) 
        ? prev.filter(id => id !== storyId)
        : [...prev, storyId];
      try {
        localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('Storage error', e);
      }
      return next;
    });
  }, []);

  const isBookmarked = useCallback((storyId: string) => {
    return bookmarkedIds.includes(storyId);
  }, [bookmarkedIds]);

  const savedStories = edition?.stories.filter(s => bookmarkedIds.includes(s.id)) || [];

  const goToNext = useCallback(() => {
    if (edition && currentIndex < edition.stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, edition]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const jumpToIndex = useCallback((index: number) => {
    if (edition && index >= 0 && index < edition.stories.length) {
      setCurrentIndex(index);
    }
  }, [edition]);

  return {
    edition,
    loading: loading && !edition,
    isRefreshing,
    error,
    currentIndex,
    currentStory: edition?.stories[currentIndex] || null,
    totalStories: edition?.stories.length || 0,
    bookmarkedIds,
    savedStories,
    readIds,
    isBookmarked,
    toggleBookmark,
    goToNext,
    goToPrev,
    jumpToIndex,
    refreshFeed: () => fetchFeed(0)
  };
}
