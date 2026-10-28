/**
 * @file DeviceSimulatorFrame.tsx
 * @module components/DeviceSimulatorFrame
 * @description
 * High-fidelity responsive wrapper and device chassis simulator for Briefly.
 * Enables:
 * 1. Pixel-perfect smartphone preview on desktop monitors (iPhone 16 Pro & Pixel 9 frames)
 * 2. Full viewport presentation for production and mobile viewports
 * 3. Quick access to top-level controls (Refresh, Saved Stories, Editorial Desk, Store Launch Guide)
 * 4. Automatic suppression of desktop chrome when running on native mobile viewports
 */

import React, { useState } from 'react';
import { 
  Smartphone, 
  Maximize2, 
  Bookmark, 
  ShieldCheck, 
  FileText, 
  Wifi, 
  Battery, 
  RefreshCw
} from 'lucide-react';
import { tokens, triggerHaptic } from '../design-system/index.ts';

interface DeviceSimulatorFrameProps {
  children: React.ReactNode;
  savedCount: number;
  onOpenSaved: () => void;
  onOpenAdmin: () => void;
  onOpenLaunchGuide: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

type DeviceMode = 'iphone' | 'pixel' | 'fullscreen';

export const DeviceSimulatorFrame: React.FC<DeviceSimulatorFrameProps> = ({
  children,
  savedCount,
  onOpenSaved,
  onOpenAdmin,
  onOpenLaunchGuide,
  onRefresh,
  isRefreshing
}) => {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('iphone');

  return (
    <div className="flex flex-col h-[100dvh] max-h-[100dvh] w-full bg-[#070a0f] text-slate-100 overflow-hidden font-sans">
      {/* 
        Desktop Top Control Bar:
        Strictly hidden on mobile (`hidden lg:flex`) to preserve 100% of the mobile screen.
        Follows the 3-zone contract: [Brand] — [Device Chassis Switcher] — [Actions]
      */}
      <header className="hidden lg:flex items-center justify-between gap-8 px-6 py-3 border-b border-white/[0.08] bg-[#0c111a]/80 backdrop-blur-md shrink-0 z-40">
        {/* Zone 1: Single text element brand */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm shadow-md shadow-blue-600/30">
            {tokens.brand.symbol}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold tracking-tight text-white">{tokens.brand.name}</span>
            <span className="text-xs text-slate-400">European Startup News · 60 Words or Fewer</span>
          </div>
        </div>

        {/* Zone 2: Device Chassis Selector (Segmented control) */}
        <div className="flex items-center gap-1 p-1 bg-[#070a0f] rounded-xl border border-white/[0.08]">
          <button
            onClick={() => {
              triggerHaptic('tap');
              setDeviceMode('iphone');
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              deviceMode === 'iphone'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>iPhone 16 Pro</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('tap');
              setDeviceMode('pixel');
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              deviceMode === 'pixel'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Pixel 9</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('tap');
              setDeviceMode('fullscreen');
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              deviceMode === 'fullscreen'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Full Viewport</span>
          </button>
        </div>

        {/* Zone 3: Actions (Refresh, Saved Stories, Editorial Desk, Store Guide) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              triggerHaptic('tap');
              onRefresh();
            }}
            disabled={isRefreshing}
            className="h-9 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-all"
            title="Refresh Feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          <button
            onClick={() => {
              triggerHaptic('sheetOpen');
              onOpenSaved();
            }}
            className="h-9 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-all relative"
          >
            <Bookmark className="w-3.5 h-3.5 text-blue-400" />
            <span>Saved</span>
            {savedCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                {savedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              triggerHaptic('sheetOpen');
              onOpenAdmin();
            }}
            className="h-9 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-all"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Editorial Desk</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('sheetOpen');
              onOpenLaunchGuide();
            }}
            className="h-9 px-3.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/40 text-xs font-medium flex items-center gap-1.5 transition-all"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Native APK & iOS</span>
          </button>
        </div>
      </header>

      {/* Main Viewport Container */}
      <main className="flex-1 flex items-center justify-center p-0 lg:p-6 overflow-hidden bg-gradient-to-b from-[#070a0f] via-[#0c111a] to-[#070a0f]">
        {deviceMode === 'fullscreen' ? (
          <div className="w-full h-full relative overflow-hidden bg-[#070a0f]">
            {children}
          </div>
        ) : (
          <div 
            className={`relative w-full h-full lg:h-[844px] ${
              deviceMode === 'iphone' ? 'lg:w-[390px] lg:rounded-[48px]' : 'lg:w-[412px] lg:rounded-[40px]'
            } bg-[#070a0f] lg:border-[10px] lg:border-slate-800/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden transition-all duration-300`}
          >
            {/* Native Mobile Status Bar simulation (desktop frame only) */}
            <div className="hidden lg:flex items-center justify-between px-6 pt-3 pb-1 z-30 select-none text-[12px] text-white font-medium shrink-0">
              <span className="font-semibold tracking-tight">09:41</span>
              {deviceMode === 'iphone' && (
                <div className="w-24 h-5 bg-black rounded-full mx-auto -mt-1 shadow-inner border border-white/5" />
              )}
              {deviceMode === 'pixel' && (
                <div className="w-3 h-3 bg-black rounded-full mx-auto -mt-1 border border-white/10" />
              )}
              <div className="flex items-center gap-1.5 text-white/90">
                <Wifi className="w-3.5 h-3.5" />
                <Battery className="w-4 h-4" />
              </div>
            </div>

            {/* Application Viewport */}
            <div className="flex-1 relative overflow-hidden flex flex-col">
              {children}
            </div>

            {/* Native Home Indicator Bar */}
            <div className="hidden lg:flex items-center justify-center pb-2 pt-1 bg-[#070a0f] shrink-0">
              <div className="w-32 h-1 bg-white/30 rounded-full" />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
