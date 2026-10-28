/**
 * @file StoreLaunchGuideModal.tsx
 * @module components/StoreLaunchGuideModal
 * @description
 * Native installation and release packaging guide for Briefly.
 * Provides developers and testers with:
 * 1. Direct Android APK build workflow (sideloading app-debug.apk for instant controlled group testing)
 * 2. Native iOS packaging instructions via Xcode and TestFlight
 * 3. Formal Google Play and Apple App Store compliance checklists
 */

import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  Apple, 
  CheckSquare, 
  Terminal, 
  Shield, 
  Download, 
  Copy, 
  Check, 
  Layers, 
  PlaySquare
} from 'lucide-react';
import { triggerHaptic } from '../design-system/index.ts';

interface StoreLaunchGuideModalProps {
  onClose: () => void;
}

export const StoreLaunchGuideModal: React.FC<StoreLaunchGuideModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'direct-apk' | 'store-publishing'>('direct-apk');
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const copyToClipboard = (cmd: string) => {
    triggerHaptic('tap');
    navigator.clipboard.writeText(cmd);
    setCopiedCommand(cmd);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[88vh]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-display">Native Installation & Distribution</h2>
              <p className="text-[11px] text-slate-400">Direct Android APK Compilation & iOS TestFlight</p>
            </div>
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

        {/* Tab Selector */}
        <div className="flex items-center gap-1 px-6 pt-3 pb-2 bg-slate-950 border-b border-slate-800/80 shrink-0">
          <button
            onClick={() => {
              triggerHaptic('tap');
              setActiveTab('direct-apk');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'direct-apk'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Direct APK & iOS Testing (Instant)</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('tap');
              setActiveTab('store-publishing');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'store-publishing'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <PlaySquare className="w-3.5 h-3.5" />
            <span>Google Play & App Store Track</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6 text-xs text-slate-300">
          {activeTab === 'direct-apk' ? (
            <>
              {/* Highlight Box */}
              <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl">
                <div className="flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-white font-semibold text-xs mb-1">
                      Skip Store Approvals: Test Real APK Sideloading
                    </h3>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      You do not have to wait for Google Play or Apple App Store approval to test Briefly natively.
                      Because Capacitor is configured in this repository, you can compile a standalone <strong>.apk</strong> file in under 60 seconds and install it on any Android phone.
                    </p>
                  </div>
                </div>
              </div>

              {/* Android APK Generation Runbook */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-blue-400" />
                    <span>Method 1: Compile Android APK (Debug / Release)</span>
                  </h4>
                  <button
                    onClick={() => copyToClipboard('npm run build:apk')}
                    className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300"
                  >
                    {copiedCommand === 'npm run build:apk' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCommand === 'npm run build:apk' ? 'Copied' : 'Copy Command'}</span>
                  </button>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-200 space-y-2">
                  <div className="text-slate-500"># 1. Run the automated APK build script:</div>
                  <div className="text-blue-300 bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    npm run build:apk
                  </div>
                  <div className="text-slate-500 pt-1"># 2. Or sync assets and open in Android Studio:</div>
                  <div className="text-blue-300 bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    npm run build && npx cap sync android && npx cap open android
                  </div>
                  <div className="text-slate-500 pt-1"># 3. Output APK location:</div>
                  <div className="text-emerald-400 font-semibold">
                    android/app/build/outputs/apk/debug/app-debug.apk
                  </div>
                </div>

                {/* Installation steps for Android phone */}
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-[11px]">
                  <p className="font-semibold text-white">How to install onto your phone:</p>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                    <li>Send <code className="text-blue-300">app-debug.apk</code> to your phone (via Google Drive, USB cable, or WhatsApp/Telegram).</li>
                    <li>Tap the file on your Android device. When prompted, tap <strong>Settings &gt; Allow from this source</strong>.</li>
                    <li>Tap <strong>Install</strong>. Briefly will now open with its native icon, high-speed splash screen, and zero browser URL bar!</li>
                  </ol>
                </div>
              </div>

              {/* iOS Workflow */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Apple className="w-4 h-4 text-slate-200" />
                    <span>Method 2: iOS Device & TestFlight Distribution</span>
                  </h4>
                  <button
                    onClick={() => copyToClipboard('npm run build:ios && npx cap open ios')}
                    className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300"
                  >
                    {copiedCommand === 'npm run build:ios && npx cap open ios' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCommand === 'npm run build:ios && npx cap open ios' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-200 space-y-2">
                  <div className="text-slate-500"># Compile web bundle and sync native Xcode workspace:</div>
                  <div className="text-blue-300 bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    npm run build:ios && npx cap open ios
                  </div>
                  <div className="text-slate-400 text-[11px] pt-1 leading-relaxed font-sans">
                    Xcode opens <code className="text-blue-300 font-mono">ios/App/App.xcworkspace</code>. Select your connected iPhone or internal TestFlight profile, and click <strong>Product &gt; Archive</strong> or press <code className="text-slate-200">Cmd + R</code> to test immediately.
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Apple App Store Requirements */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-blue-400" />
                  <span>1. Apple App Store Requirements</span>
                </h4>
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-[11px]">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">•</span>
                    <span><strong>Developer Account:</strong> Apple Developer Program ($99/year). DUNS number needed for organization accounts.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">•</span>
                    <span><strong>App Store Privacy:</strong> Data Used to Track You: None. Data Linked to You: None (zero PII collection, local storage only).</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">•</span>
                    <span><strong>Age Rating & Content:</strong> 12+ (News category, uncensored internet links require web browser declaration).</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">•</span>
                    <span><strong>Screenshots:</strong> 6.9" (iPhone 16 Pro Max) & 6.3" (iPhone 16 Pro) portrait screenshots.</span>
                  </div>
                </div>
              </div>

              {/* Google Play Requirements */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                  <span>2. Google Play Store Requirements</span>
                </h4>
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-[11px]">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span><strong>Google Play Console:</strong> $25 one-time registration fee + identity verification.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span><strong>Data Safety Form:</strong> Declare zero personal data collected, stored, or shared.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span><strong>Closed Testing Track:</strong> Requires 14-day closed test with 20 opt-in testers before production release.</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">Bundle ID: <code className="text-blue-400">com.briefly.news</code></span>
          <button
            onClick={() => {
              triggerHaptic('tap');
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
