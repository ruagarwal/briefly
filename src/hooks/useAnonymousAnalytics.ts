/**
 * @file useAnonymousAnalytics.ts
 * @module hooks/useAnonymousAnalytics
 * @description
 * Zero-PII, GDPR-compliant telemetry hook for Briefly.
 * Strict Privacy Invariants:
 * - Collects ZERO personally identifiable information, cookies, or device fingerprints
 * - Measures adoption & aggregate funnel friction: DAU, session duration, reading depth, and drop-offs
 * - Diagnoses drop-off causation: natural decay vs network slowdowns vs feed failure vs crashes
 * - Records non-blocking engagement actions (source clicks, bookmarks, shares)
 */

import { useEffect, useRef, useCallback } from 'react';
import type { AnalyticsEventType } from '../types/news.ts';

const ANON_DEVICE_KEY = 'briefly_anon_device_id_v1';

export function getAnonDeviceId(): string {
  try {
    let id = localStorage.getItem(ANON_DEVICE_KEY);
    if (!id) {
      id = 'anon_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      localStorage.setItem(ANON_DEVICE_KEY, id);
    }
    return id;
  } catch {
    return 'anon_ephemeral_' + Math.random().toString(36).substring(2, 8);
  }
}

export async function logTelemetryEvent(
  type: AnalyticsEventType, 
  data: { 
    cardIndex?: number; 
    dwellMs?: number; 
    durationSec?: number;
    storyId?: string;
    errorMessage?: string;
    latencyMs?: number;
  } = {}
) {
  try {
    const anonId = getAnonDeviceId();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/London';
    await fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        type, 
        anonId, 
        timeZone,
        ...data 
      }),
      keepalive: true
    });
  } catch {
    // Non-blocking telemetry
  }
}

export function useAnonymousAnalytics(currentIndex: number, totalStories: number, currentStoryId?: string) {
  const sessionStarted = useRef(false);
  const sessionStartTime = useRef(Date.now());
  const cardStartTime = useRef(Date.now());
  const maxReachedIndex = useRef(0);

  // Send anonymous event
  const logEvent = useCallback((type: AnalyticsEventType, data: { cardIndex?: number; dwellMs?: number; durationSec?: number; storyId?: string } = {}) => {
    return logTelemetryEvent(type, data);
  }, []);

  // Session lifecycle & error listeners
  useEffect(() => {
    if (!sessionStarted.current) {
      sessionStarted.current = true;
      sessionStartTime.current = Date.now();
      logEvent('session_start');

      // Global crash detection (catches uncaught JS exceptions or unhandled promise rejections)
      const handleError = (event: ErrorEvent) => {
        logTelemetryEvent('client_crash', { 
          errorMessage: event.message?.slice(0, 120) || 'Uncaught error' 
        });
      };

      const handleRejection = (event: PromiseRejectionEvent) => {
        logTelemetryEvent('client_crash', { 
          errorMessage: String(event.reason)?.slice(0, 120) || 'Unhandled promise rejection' 
        });
      };

      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', handleRejection);

      // Session duration & quick bounce tracking on exit
      const sendSessionDuration = () => {
        const totalDurationSec = Math.max(1, Math.round((Date.now() - sessionStartTime.current) / 1000));
        logTelemetryEvent('session_end', { durationSec: totalDurationSec });

        if (totalDurationSec < 4 && maxReachedIndex.current === 0) {
          logTelemetryEvent('quick_bounce');
        }
      };

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          sendSessionDuration();
        }
      };

      window.addEventListener('beforeunload', sendSessionDuration);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        window.removeEventListener('error', handleError);
        window.removeEventListener('unhandledrejection', handleRejection);
        window.removeEventListener('beforeunload', sendSessionDuration);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
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
