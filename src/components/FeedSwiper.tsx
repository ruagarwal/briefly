/**
 * @file FeedSwiper.tsx
 * @module components/FeedSwiper
 * @description
 * Gesture engine and full-screen card swiping container for Briefly.
 * Features:
 * - Direct native touch tracking with `touch-action: none` to override Android Chrome pull-to-refresh
 * - Calibrated 28px vertical swipe threshold for snappy single-handed thumb flicking
 * - Desktop pointer dragging and mouse wheel emulation for preview & editor testing
 * - Tactile micro-haptic feedback (`triggerHaptic('swipeSnap')`) on card snap
 * - Fluid 60fps spring transitions powered by motion/react
 * - Automatic PWA installation prompt handling for web browser users
 */

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StoryCard } from './StoryCard.tsx';
import type { NewsStory } from '../types/news.ts';
import { Download, X } from 'lucide-react';
import { tokens } from '../design-system/index.ts';

interface FeedSwiperProps {
  /** Array of verified news stories for today's edition */
  stories: NewsStory[];
  /** Current active story index */
  currentIndex: number;
  /** Function to check whether a story ID is bookmarked */
  isSaved: (id: string) => boolean;
  /** Toggle bookmark callback */
  onToggleSave: (id: string) => void;
  /** Trigger share card modal */
  onOpenShare: (story: NewsStory) => void;
  /** Trigger source article reader */
  onOpenSource: (story: NewsStory) => void;
  /** Advance to next card */
  onNext: () => void;
  /** Return to previous card */
  onPrev: () => void;
  /** Open saved bookmarks drawer */
  onOpenSaved?: () => void;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const FeedSwiper: React.FC<FeedSwiperProps> = ({
  stories,
  currentIndex,
  isSaved,
  onToggleSave,
  onOpenShare,
  onOpenSource,
  onNext,
  onPrev,
  onOpenSaved
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Touch tracking coordinates
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchMoveY = useRef<number | null>(null);
  const isTouchActive = useRef<boolean>(false);

  // Mouse & Pointer coordinates (for desktop browser preview click-drag simulation)
  const pointerStartY = useRef<number | null>(null);
  const pointerStartX = useRef<number | null>(null);
  const isPointerActive = useRef<boolean>(false);

  const lastWheelTime = useRef<number>(0);
  const [direction, setDirection] = useState<'up' | 'down'>('up');

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissInstallBanner, setDismissInstallBanner] = useState(false);

  // Detect standalone mode and listen for browser install prompt
  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsStandalone(true);
      setDeferredPrompt(null);
    }
  };

  // Physical keyboard navigation support (Arrow keys, vim keys, spacebar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        setDirection('down');
        onPrev();
      } else if (e.key === 'ArrowDown' || e.key === 'j' || e.key === ' ') {
        e.preventDefault();
        setDirection('up');
        onNext();
      } else if (e.key === 'ArrowRight' || e.key === 'l') {
        e.preventDefault();
        if (stories[currentIndex]) {
          onOpenSource(stories[currentIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, onNext, onPrev, onOpenSource, stories]);

  // High-reliability native touch listeners with non-passive touchmove for Android Chrome
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onNativeTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
      touchMoveY.current = e.touches[0].clientY;
      isTouchActive.current = true;
    };

    const onNativeTouchMove = (e: TouchEvent) => {
      if (!isTouchActive.current || touchStartY.current === null) return;
      touchMoveY.current = e.touches[0].clientY;

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const diffY = Math.abs(currentY - touchStartY.current);
      const diffX = Math.abs(currentX - (touchStartX.current || currentX));

      // If predominantly vertical movement, cancel Android browser scroll/pull-to-refresh
      if (diffY > 6 && diffY > diffX && e.cancelable) {
        e.preventDefault();
      }
    };

    const onNativeTouchEnd = (e: TouchEvent) => {
      if (!isTouchActive.current || touchStartY.current === null || touchStartX.current === null) {
        return;
      }

      const endY = e.changedTouches[0]?.clientY ?? touchMoveY.current ?? touchStartY.current;
      const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;

      const deltaY = touchStartY.current - endY;
      const deltaX = endX - touchStartX.current;
      const absY = Math.abs(deltaY);
      const absX = Math.abs(deltaX);

      isTouchActive.current = false;
      touchStartY.current = null;
      touchStartX.current = null;
      touchMoveY.current = null;

      // Horizontal swipe right -> open publisher source
      if (deltaX > 60 && absX > absY * 1.3) {
        if (stories[currentIndex]) {
          onOpenSource(stories[currentIndex]);
        }
        return;
      }

      // Vertical swipe: snappy 18px threshold for instantaneous thumb flicking
      if (absY >= 18) {
        if (deltaY > 0) {
          // Swipe UP -> Next story
          setDirection('up');
          onNext();
        } else {
          // Swipe DOWN -> Previous story
          setDirection('down');
          onPrev();
        }
      }
    };

    container.addEventListener('touchstart', onNativeTouchStart, { passive: true });
    container.addEventListener('touchmove', onNativeTouchMove, { passive: false });
    container.addEventListener('touchend', onNativeTouchEnd, { passive: true });
    container.addEventListener('touchcancel', () => {
      isTouchActive.current = false;
      touchStartY.current = null;
    });

    return () => {
      container.removeEventListener('touchstart', onNativeTouchStart);
      container.removeEventListener('touchmove', onNativeTouchMove);
      container.removeEventListener('touchend', onNativeTouchEnd);
    };
  }, [currentIndex, onNext, onPrev, onOpenSource, stories]);

  // Mouse Pointer handlers for desktop click-drag simulation
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return; // Handled natively by touch events
    if (e.button !== 0) return;
    pointerStartY.current = e.clientY;
    pointerStartX.current = e.clientX;
    isPointerActive.current = true;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    if (!isPointerActive.current || pointerStartY.current === null || pointerStartX.current === null) return;

    const deltaY = pointerStartY.current - e.clientY;
    const deltaX = e.clientX - pointerStartX.current;
    const absY = Math.abs(deltaY);
    const absX = Math.abs(deltaX);

    isPointerActive.current = false;
    pointerStartY.current = null;
    pointerStartX.current = null;

    if (deltaX > 60 && absX > absY * 1.2) {
      if (stories[currentIndex]) {
        onOpenSource(stories[currentIndex]);
      }
      return;
    }

    if (absY >= 20) {
      if (deltaY > 0) {
        setDirection('up');
        onNext();
      } else {
        setDirection('down');
        onPrev();
      }
    }
  };

  // Debounced mouse wheel handler with snappy 260ms cooldown
  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    if (now - lastWheelTime.current < 260) return;

    if (e.deltaY > 25) {
      lastWheelTime.current = now;
      setDirection('up');
      onNext();
    } else if (e.deltaY < -25) {
      lastWheelTime.current = now;
      setDirection('down');
      onPrev();
    }
  };

  const currentStory = stories[currentIndex];

  if (!currentStory) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-[#070a0f] text-slate-400">
        <p className="text-base font-medium text-slate-200">No stories available today</p>
        <p className="text-xs text-slate-500 mt-1">Check back after the 03:00 UTC publishing cycle</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-[#070a0f] select-none cursor-grab active:cursor-grabbing touch-none"
      style={{ touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        isPointerActive.current = false;
        pointerStartY.current = null;
      }}
      onWheel={handleWheel}
    >
      {/* PWA Install Banner: shown in mobile browser when not yet installed in standalone mode */}
      {!isStandalone && deferredPrompt && !dismissInstallBanner && (
        <div className="absolute top-2 left-3 right-3 z-50 bg-blue-600 text-white px-3.5 py-2 rounded-xl shadow-2xl flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 truncate">
            <Download className="w-4 h-4 shrink-0" />
            <span className="font-semibold truncate">Install Briefly as Standalone App</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <button
              onClick={handleInstallApp}
              className="px-2.5 py-1 bg-white text-blue-700 font-bold rounded-lg text-[11px] shadow-sm active:scale-95"
            >
              Install
            </button>
            <button
              onClick={() => setDismissInstallBanner(true)}
              className="p-1 text-white/80 hover:text-white rounded-md"
              aria-label="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 
        Instantaneous 60fps Animated Story Card with Spring Physics:
        Uses `mode="popLayout"` with parallel entrance/exit so there is ZERO blank gap or lag
        between swiping and the next card appearing.
      */}
      <AnimatePresence initial={false} mode="popLayout" custom={direction}>
        <motion.div
          key={currentStory.id}
          custom={direction}
          initial={{ 
            opacity: 0.15, 
            y: direction === 'up' ? '35%' : '-35%'
          }}
          animate={{ 
            opacity: 1, 
            y: 0
          }}
          exit={{ 
            opacity: 0, 
            y: direction === 'up' ? '-35%' : '35%'
          }}
          transition={{ 
            type: 'spring',
            stiffness: tokens.motion.spring.stiffness,
            damping: tokens.motion.spring.damping,
            mass: tokens.motion.spring.mass,
          }}
          className="w-full h-full absolute inset-0"
        >
          <StoryCard 
            story={currentStory}
            index={currentIndex}
            total={stories.length}
            isSaved={isSaved(currentStory.id)}
            onToggleSave={() => onToggleSave(currentStory.id)}
            onOpenShare={() => onOpenShare(currentStory)}
            onOpenSource={() => onOpenSource(currentStory)}
            onOpenSavedDrawer={onOpenSaved}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
