/**
 * @file tokens.ts
 * @module design-system/tokens
 * @description
 * Defines the core visual and tactile tokens for Briefly.
 * Governs typography scale, strict 60-30-10 color discipline, elevation scrims,
 * motion spring curves, and haptic vibration timings to eliminate generic UI aesthetics.
 */

export const tokens = {
  // Brand identity
  brand: {
    name: 'Briefly',
    wordmark: 'Briefly',
    symbol: 'B',
    tagline: 'European Startup Intelligence in 60 Words',
  },

  // Color Architecture: 60% Slate canvas, 30% Structural surfaces, 10% Accents
  colors: {
    // 60% Dominant Neutral Canvas
    canvas: {
      background: '#070a0f',       // Deep midnight slate canvas
      card: '#0c111a',             // Primary card surface
      elevated: '#111827',         // Subtle elevated surface
      overlay: 'rgba(5, 8, 15, 0.85)',
    },
    // 30% Structural Surfaces & Hairlines
    structural: {
      borderSubtle: 'rgba(255, 255, 255, 0.08)',
      borderHover: 'rgba(255, 255, 255, 0.16)',
      borderActive: 'rgba(59, 130, 246, 0.4)',
      divider: 'rgba(255, 255, 255, 0.06)',
      pillBg: 'rgba(255, 255, 255, 0.05)',
      buttonSecondary: 'rgba(255, 255, 255, 0.06)',
      buttonSecondaryHover: 'rgba(255, 255, 255, 0.12)',
    },
    // 10% High-Intent Accents
    accents: {
      primary: '#2563eb',          // Electric blue for brand mark & primary CTAs
      primaryHover: '#1d4ed8',
      verified: '#10b981',         // Corroborated emerald
      warning: '#f59e0b',          // High volatility / caution amber
      breaking: '#ef4444',         // Breaking European deal red
    },
    // Editorial Typography Colors
    text: {
      primary: '#f8fafc',          // 98% bright white for crisp reading
      secondary: '#94a3b8',        // Slate 400 for contextual metadata
      muted: '#64748b',            // Slate 500 for secondary timestamps
      brand: '#3b82f6',            // Brand mark accent
    },
  },

  // Editorial Typographic Scales & Rules
  typography: {
    headline: {
      fontSize: 'text-xl sm:text-2xl',
      lineHeight: 'leading-tight sm:leading-snug',
      fontWeight: 'font-bold tracking-tight',
      fontFamily: 'font-sans',
    },
    body: {
      fontSize: 'text-[15px] sm:text-base md:text-[17px]',
      lineHeight: 'leading-[1.65] sm:leading-[1.7]',
      fontWeight: 'font-normal',
      fontFamily: 'font-sans',
    },
    metadata: {
      fontSize: 'text-xs sm:text-sm',
      fontWeight: 'font-medium',
      separator: '·',
    },
    counter: {
      fontFamily: 'tabular-nums font-mono',
      fontSize: 'text-xs sm:text-sm font-semibold tracking-wider',
    },
  },

  // Motion Curves & Spring Physics
  motion: {
    // 60fps natural inertial flicking physics
    spring: {
      stiffness: 350,
      damping: 28,
      mass: 0.8,
    },
    // Micro-interactions (routine feedback <= 180ms)
    micro: {
      duration: 0.18,
      ease: [0.16, 1, 0.3, 1], // Cubic bezier smooth settling
    },
    // Bottom drawer & sheet spring
    sheet: {
      stiffness: 400,
      damping: 32,
    },
  },

  // Tactile Vibration Durations (ms)
  haptics: {
    tap: 8,          // Ultra-crisp subtle selection click
    swipeSnap: 18,   // Satisfying card lock haptic
    bookmark: 25,    // Confirmed save pulse
    sheetOpen: 12,   // Drawer release
    error: [20, 40, 20],
  },

  // Dimensions & Touch Ergonomics
  geometry: {
    minTouchTarget: 44, // px
    cardRadius: 'rounded-2xl sm:rounded-3xl',
    headerHeight: 52,   // px
    bottomBarHeight: 64,// px
    bannerHeightRatio: '33%', // 33% photography banner, 67% editorial copy
  },
} as const;

/**
 * Executes calibrated device vibration where supported (modern Android Chrome, WebViews, etc.)
 * Gracefully ignores on devices or browsers without vibration API.
 */
export function triggerHaptic(type: 'tap' | 'swipeSnap' | 'bookmark' | 'sheetOpen' | 'error' = 'tap'): void {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      const pattern = tokens.haptics[type];
      const vibratePattern: VibratePattern = Array.isArray(pattern) ? [...pattern] : (pattern as number);
      navigator.vibrate(vibratePattern);
    } catch {
      // Ignore vibration errors on unprivileged contexts
    }
  }
}
