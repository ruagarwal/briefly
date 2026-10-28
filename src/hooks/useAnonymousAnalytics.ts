/**
 * @file useAnonymousAnalytics.ts
 * @module hooks/useAnonymousAnalytics
 * @description
 * Zero-PII, GDPR-compliant telemetry hook for Briefly.
 * Strict Privacy Invariants:
 * - Collects ZERO personally identifiable information, cookies, or device fingerprints
 * - Measures aggregate funnel friction: card dwell time, reading depth, and drop-offs
 * - Records non-blocking engagement actions (source clicks, bookmarks, shares)
 */

import { useEffect, useRef, useCallback } from 'react';
import type { AnalyticsEventType } from '../types/news.ts';

export function useAnonymousAnalytics(currentIndex: number, totalStories: number, currentStoryId?: string) {
  const sessionStarted = useRef(false);
  const cardStartTime = useRef(Date.now());
  const maxReachedIndex = useRef(0);

  // Send anonymous event
  const logEvent = useCallback(async (type: AnalyticsEventType, data: { cardIndex?: number; dwellMs?: number; storyId?: string } = {}) => {
    try {
      await fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...data }),
        keepalive: true
      });
    } catch {
      // Non-blocking telemetry
    }
  }, []);

  // Session start
  useEffect(() => {
    if (!sessionStarted.current) {
      sessionStarted.current = true;
      logEvent('session_start');

      // Quick bounce detection (if user leaves in < 4s)
      const bounceTimeout = setTimeout(() => {
        // Dwell > 4s, not a bounce
      }, 4000);

      const handleBeforeUnload = () => {
        if (Date.now() - cardStartTime.current < 4000 && maxReachedIndex.current === 0) {
          logEvent('quick_bounce');
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
        clearTimeout(bounceTimeout);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [logEvent]);

  // Card view tracking & funnel progress
  useEffect(() => {
    const dwell = Date.now() - cardStartTime.current;
    cardStartTime.current = Date.now();

    logEvent('card_view', { cardIndex: currentIndex, dwellMs: dwell, storyId: currentStoryId });

    if (currentIndex > maxReachedIndex.current) {
      maxReachedIndex.current = currentIndex;
    }

    // If user reaches last card
    if (totalStories > 0 && currentIndex === totalStories - 1) {
      logEvent('feed_complete');
    }
  }, [currentIndex, totalStories, currentStoryId, logEvent]);

  return {
    logSourceClick: (storyId: string) => logEvent('source_click', { storyId }),
    logSaveAction: (storyId: string) => logEvent('save_action', { storyId }),
    logShareAction: (storyId: string) => logEvent('share_action', { storyId })
  };
}
