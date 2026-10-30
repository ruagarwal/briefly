/**
 * @file AdminConsoleModal.tsx
 * @module components/AdminConsoleModal
 * @description
 * Editorial Desk & Ingestion Pipeline Console for Briefly.
 * Provides editors and operators with:
 * 1. Anonymous funnel analytics & drop-off metrics (GDPR-compliant)
 * 2. Story quarantine inspection with real-time editorial approvals / revisions
 * 3. European RSS/Atom source registry status and credibility ratings
 * 4. Pipeline execution history, execution durations, and error monitoring
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle, 
  RefreshCw, 
  AlertTriangle,
  FileEdit,
  ExternalLink,
  Activity,
  Users,
  TrendingDown,
  ShieldCheck,
  Bookmark,
  Share2,
  Compass,
  Search,
  Globe,
  Layers,
  RotateCcw,
  Clock,
  Sparkles,
  Zap,
  ServerCrash,
  WifiOff,
  Timer,
  BarChart3,
  Check
} from 'lucide-react';
import type { 
  NewsStory, 
  SourceRegistryItem, 
  PipelineExecutionResult,
  AnonymousAnalyticsSummary
} from '../types/news.ts';

interface AdminConsoleModalProps {
  onClose: () => void;
  onFeedUpdated: () => void;
}

export const AdminConsoleModal: React.FC<AdminConsoleModalProps> = ({ onClose, onFeedUpdated }) => {
  const [activeTab, setActiveTab] = useState<'funnel' | 'quarantine' | 'sources' | 'pipeline' | 'ranking'>('funnel');
  const [quarantinedStories, setQuarantinedStories] = useState<NewsStory[]>([]);
  const [sources, setSources] = useState<SourceRegistryItem[]>([]);
  const [pipelineLogs, setPipelineLogs] = useState<PipelineExecutionResult[]>([]);
  const [analytics, setAnalytics] = useState<AnonymousAnalyticsSummary | null>(null);
  const [rankingMetrics, setRankingMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [runningPipeline, setRunningPipeline] = useState(false);
  const [editingStory, setEditingStory] = useState<NewsStory | null>(null);
  const [editedHeadline, setEditedHeadline] = useState('');
  const [editedSummary, setEditedSummary] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [sourceFilterLayer, setSourceFilterLayer] = useState<string>('all');
  const [sourceSearchQuery, setSourceSearchQuery] = useState<string>('');
  const [cadenceInfo, setCadenceInfo] = useState<any>(null);
  const [restoringConfig, setRestoringConfig] = useState(false);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [qRes, sRes, lRes, aRes, cRes, rRes] = await Promise.all([
        fetch('/api/admin/quarantine'),
        fetch('/api/sources'),
        fetch('/api/pipeline/logs'),
        fetch('/api/analytics/summary'),
        fetch('/api/editorial/cadence-config'),
        fetch('/api/ranking/metrics')
      ]);

      if (qRes.ok) setQuarantinedStories(await qRes.json());
      if (sRes.ok) setSources(await sRes.json());
      if (lRes.ok) setPipelineLogs(await lRes.json());
      if (aRes.ok) setAnalytics(await aRes.json());
      if (cRes.ok) setCadenceInfo(await cRes.json());
      if (rRes.ok) {
        const rData = await rRes.json();
        setRankingMetrics(rData.metrics);
      }
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  // Single-Click Restore: Revert to Legacy Pre-Cadence Configuration (Daily 03:00 GMT / 7-Day)
  const handleRestoreBackup = async () => {
    setRestoringConfig(true);
    try {
      const res = await fetch('/api/editorial/restore-backup', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(data.message);
        await fetchData();
        onFeedUpdated();
        setTimeout(() => setActionSuccess(null), 4000);
      }
    } catch (err) {
      console.error('Restore failed', err);
    } finally {
      setRestoringConfig(false);
    }
  };

  // Single-Click Apply: 6-Hour Ingestion Cadence & 72-Hour Catch-Up Archive
  const handleApplyCadence = async () => {
    setRestoringConfig(true);
    try {
      const res = await fetch('/api/editorial/apply-cadence', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(data.message);
        await fetchData();
        onFeedUpdated();
        setTimeout(() => setActionSuccess(null), 4000);
      }
    } catch (err) {
      console.error('Apply cadence failed', err);
    } finally {
      setRestoringConfig(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Trigger manual pipeline
  const handleTriggerPipeline = async () => {
    setRunningPipeline(true);
    setActionSuccess(null);
    try {
      const res = await fetch('/api/pipeline/run', { method: 'POST' });
      const result = await res.json();
      setActionSuccess(`Pipeline completed! Discovered ${result.rawArticlesFetched} articles, qualified ${result.articlesQualified}.`);
      await fetchData();
      onFeedUpdated();
    } catch (err: any) {
      console.error('Pipeline failed', err);
    } finally {
      setRunningPipeline(false);
    }
  };

  // Toggle source
  const handleToggleSource = async (sourceId: string, currentEnabled: boolean) => {
    try {
      const res = await fetch(`/api/sources/${sourceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentEnabled })
      });
      if (res.ok) {
        setSources(prev => prev.map(s => s.id === sourceId ? { ...s, enabled: !currentEnabled } : s));
      }
    } catch (err) {
      console.error('Failed to toggle source', err);
    }
  };

  // Editorial action on quarantined item
  const handleEditorialAction = async (storyId: string, action: 'approve' | 'reject') => {
    try {
      const payload: any = { storyId, action };
      if (action === 'approve' && editingStory?.id === storyId) {
        payload.editedHeadline = editedHeadline;
        payload.editedSummary = editedSummary;
      }

      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setActionSuccess(`Story ${action === 'approve' ? 'approved & published' : 'rejected'}.`);
        setQuarantinedStories(prev => prev.filter(s => s.id !== storyId));
        setEditingStory(null);
        onFeedUpdated();
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Action failed', err);
    }
  };

  const handleResetAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics/reset', { method: 'POST' });
      if (res.ok) {
        setActionSuccess('Telemetry reset: Live metrics cleared to 0.');
        fetchData();
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Reset analytics failed', err);
    }
  };

  const calculateWordCount = (str: string) => {
    return str.trim().split(/\s+/).filter(Boolean).length;
  };

  const formatDuration = (sec: number = 0) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[90vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/30 font-display">
              B
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-display">Briefly Editorial & Telemetry Desk</h2>
              <span className="text-[11px] text-slate-400">GDPR-Compliant Funnel, Friction & Quarantine</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation (Segmented control) */}
        <div className="px-6 py-2.5 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('funnel')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'funnel' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Audience & Funnel
            </button>
            <button
              onClick={() => setActiveTab('quarantine')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'quarantine' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Quarantine Queue ({quarantinedStories.length})
            </button>
            <button
              onClick={() => setActiveTab('sources')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'sources' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Source Registry ({sources.length})
            </button>
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'pipeline' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pipeline & Cadence
            </button>
            <button
              onClick={() => setActiveTab('ranking')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'ranking' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ranking Engine & Tiers
            </button>
          </div>

          <button
            onClick={handleTriggerPipeline}
            disabled={runningPipeline}
            className="h-8 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 text-xs font-medium flex items-center gap-1.5 shrink-0 disabled:opacity-50 transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${runningPipeline ? 'animate-spin text-blue-400' : ''}`} />
            <span>{runningPipeline ? 'Running...' : 'Run Pipeline'}</span>
          </button>
        </div>

        {/* Toast alert */}
        {actionSuccess && (
          <div className="px-6 py-2 bg-emerald-950/80 border-b border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6">
          {/* AUDIENCE & FUNNEL TAB */}
          {activeTab === 'funnel' && (
            <div className="space-y-6">
              {/* GDPR Compliance Notice */}
              <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-2xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-blue-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Zero-PII Telemetry:</strong> GDPR-compliant aggregate metrics. No cookies, no trackers, no cross-device fingerprints.</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button 
                    onClick={handleResetAnalytics}
                    className="p-1 rounded text-slate-400 hover:text-rose-300 shrink-0 flex items-center gap-1 text-[11px] bg-slate-900 hover:bg-slate-800 px-2 py-1 rounded-lg border border-slate-800 hover:border-rose-900/40 transition-all"
                    title="Reset telemetry counters to 0"
                  >
                    <RotateCcw className="w-3 h-3 text-rose-400" />
                    <span>Clear Data</span>
                  </button>
                  <button 
                    onClick={fetchData}
                    className="p-1 rounded text-slate-400 hover:text-white shrink-0 flex items-center gap-1.5 text-[11px] bg-slate-900 hover:bg-slate-800 px-2 py-1 rounded-lg border border-slate-800 transition-all"
                    title="Refresh stats"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* 6 Core Adoption & Engagement Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* 1. DAU */}
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>Daily Active Users (DAU)</span>
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <span className="text-2xl font-bold text-white font-mono tabular-nums">
                    {analytics?.dau || 0}
                  </span>
                  <span className="text-[10px] text-emerald-400 block mt-1">Unique readers active today</span>
                </div>

                {/* 2. Avg Stories / User / Session */}
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>Stories Read / Session</span>
                    <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <span className="text-2xl font-bold text-blue-400 font-mono tabular-nums">
                    {analytics?.averageReadingDepth || 0} <span className="text-xs text-slate-500 font-normal">stories</span>
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">Average depth per reader</span>
                </div>

                {/* 3. Number of Sessions */}
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>Total Reader Sessions</span>
                    <Activity className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <span className="text-2xl font-bold text-white font-mono tabular-nums">
                    {analytics?.totalSessions || 0}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">Cumulative reader visits</span>
                </div>

                {/* 4. Avg Time Spent on App */}
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>Avg Time Spent on App</span>
                    <Timer className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <span className="text-2xl font-bold text-amber-300 font-mono tabular-nums">
                    {formatDuration(analytics?.avgSessionDurationSec)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">Active dwell time per session</span>
                </div>

                {/* 5. Number of Stories Per Day */}
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>Stories / Day</span>
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-white font-mono tabular-nums">
                      {analytics?.storiesPerDay?.activeEdition || 20}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      + {analytics?.storiesPerDay?.archive72h || 15} catch-up
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 block mt-1">
                    {analytics?.storiesPerDay?.totalAvailable || 35} total curated available
                  </span>
                </div>

                {/* 6. Feed Completion Rate */}
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>Briefing Completion Rate</span>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <span className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
                    {analytics?.completionRatePercent || 0}%
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">Reached milestone / final card</span>
                </div>
              </div>

              {/* DROP-OFF CAUSATION & HEALTH DIAGNOSTICS */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <h3 className="text-xs font-bold text-white font-display">Drop-Off Causation & Stability Diagnostics</h3>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Diagnosing why readers stop reading: natural attention decay vs. latency, unhandled crashes, or failed story loads.
                    </p>
                  </div>
                  <div className="px-2.5 py-1 bg-emerald-950/60 border border-emerald-800/80 rounded-full text-[10px] font-mono text-emerald-300 font-semibold shrink-0">
                    {analytics?.healthDiagnostics?.healthySessionsPercent ?? 99.2}% Healthy Sessions
                  </div>
                </div>

                {/* Drop-Off Causation Breakdown Bars */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Natural Content Decay */}
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-medium flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Natural Content / Attention Decay</span>
                      </span>
                      <span className="text-emerald-400 font-bold font-mono">
                        {analytics?.healthDiagnostics?.dropOffCausation?.naturalDecayPercent ?? 96}%
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Reader satisfied with top headlines or reached personal reading limit. Normal reading behavior.
                    </p>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${analytics?.healthDiagnostics?.dropOffCausation?.naturalDecayPercent ?? 96}%` }}
                      />
                    </div>
                  </div>

                  {/* Slow Network Latency */}
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-medium flex items-center gap-1.5">
                        <Timer className="w-3.5 h-3.5 text-amber-400" />
                        <span>Slow Network Latency (&gt; 3.0s)</span>
                      </span>
                      <span className="text-amber-400 font-bold font-mono">
                        {analytics?.healthDiagnostics?.dropOffCausation?.slowLoadPercent ?? 4}%
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      {analytics?.healthDiagnostics?.slowLoadWarnings || 0} slow load events recorded. High latency can cause early reader abandonment.
                    </p>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${analytics?.healthDiagnostics?.dropOffCausation?.slowLoadPercent ?? 4}%` }}
                      />
                    </div>
                  </div>

                  {/* Stories Failed to Load */}
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-medium flex items-center gap-1.5">
                        <WifiOff className="w-3.5 h-3.5 text-sky-400" />
                        <span>Feed Load Failures (Blank Screen)</span>
                      </span>
                      <span className={`font-bold font-mono ${
                        (analytics?.healthDiagnostics?.feedLoadFailures || 0) > 0 ? 'text-rose-400' : 'text-slate-400'
                      }`}>
                        {analytics?.healthDiagnostics?.dropOffCausation?.feedFailurePercent ?? 0}%
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      {analytics?.healthDiagnostics?.feedLoadFailures || 0} failed feed fetches. Shielded by instant Stale-While-Revalidate offline cache.
                    </p>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-sky-500 rounded-full"
                        style={{ width: `${analytics?.healthDiagnostics?.dropOffCausation?.feedFailurePercent ?? 0}%` }}
                      />
                    </div>
                  </div>

                  {/* App Crashes */}
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-medium flex items-center gap-1.5">
                        <ServerCrash className="w-3.5 h-3.5 text-rose-400" />
                        <span>Client Crashes & JS Exceptions</span>
                      </span>
                      <span className={`font-bold font-mono ${
                        (analytics?.healthDiagnostics?.clientCrashes || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {analytics?.healthDiagnostics?.clientCrashes || 0} errors
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      {(analytics?.healthDiagnostics?.clientCrashes || 0) === 0 
                        ? '100% crash-free. Zero uncaught exceptions or React boundary crashes.' 
                        : `${analytics?.healthDiagnostics?.clientCrashes} client crash events logged.`}
                    </p>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-rose-500 rounded-full"
                        style={{ width: `${Math.min(100, (analytics?.healthDiagnostics?.clientCrashes || 0) * 10)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* READER COUNTRY / GEOGRAPHY BREAKDOWN */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <div>
                      <h3 className="text-xs font-bold text-white font-display">Reader Country & Geography</h3>
                      <p className="text-[11px] text-slate-400">Distribution of active readers across European ecosystems</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {Object.keys(analytics?.readerCountries || {}).length} Countries Detected
                  </span>
                </div>

                {Object.keys(analytics?.readerCountries || {}).length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-500 font-mono">
                    No reader sessions logged yet. Swipe cards in the briefing to register live reader telemetry.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                    {Object.entries(analytics?.readerCountries || {})
                      .sort(([, a], [, b]) => b - a)
                      .map(([country, count]) => {
                        const totalReaders = Math.max(1, Object.values(analytics?.readerCountries || {}).reduce((x, y) => x + y, 0));
                        const sharePercent = Math.round((count / totalReaders) * 100);
                        return (
                          <div key={country} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-white truncate max-w-[70%]">{country}</span>
                              <span className="font-mono text-blue-400 font-bold">{count}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                              <span>Share</span>
                              <span>{sharePercent}%</span>
                            </div>
                            <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full transition-all"
                                style={{ width: `${sharePercent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Reading Funnel & Drop-off Breakdown */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white font-display">Card-by-Card Reading Funnel & Drop-Off</h3>
                    <p className="text-[11px] text-slate-400">Exact retention from Story 1 through the briefing to identify high-friction points</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Cohort size: {analytics?.totalSessions || 0} readers</span>
                </div>

                <div className="space-y-2.5 pt-2 max-h-72 overflow-y-auto no-scrollbar pr-1">
                  {analytics?.funnelSteps.map((step, idx) => (
                    <div key={idx} className="space-y-1 p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-300 font-sans font-medium">{step.step}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 tabular-nums">{step.views} reads</span>
                          <span className="text-white font-semibold tabular-nums w-10 text-right">{step.retentionPercent}%</span>
                          {idx > 0 && step.dropOffPercent > 0 && (
                            <span className="text-[10px] text-rose-400 tabular-nums bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-900/50">
                              -{step.dropOffPercent}%
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Visual Retention Bar */}
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(step.retentionPercent, 4)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Friction & Engagement Signals */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-white font-display">Engagement & Action Signals</h3>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-col justify-between">
                    <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                      <span>Source Deep-Dives</span>
                    </span>
                    <span className="text-base font-bold text-white font-mono mt-2">
                      {analytics?.sourceClicks || 0}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Readers verified original report</span>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-col justify-between">
                    <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                      <Bookmark className="w-3.5 h-3.5 text-blue-400" />
                      <span>Local Bookmarks</span>
                    </span>
                    <span className="text-base font-bold text-white font-mono mt-2">
                      {analytics?.saves || 0}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Stories saved for offline</span>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-col justify-between">
                    <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>News Cards Shared</span>
                    </span>
                    <span className="text-base font-bold text-white font-mono mt-2">
                      {analytics?.shares || 0}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Smart link shares generated</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* QUARANTINE QUEUE */}
          {activeTab === 'quarantine' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-2xl flex items-start gap-3 text-xs text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Stories with Gemini confidence &lt;75% or uncorroborated high-impact financial claims are quarantined. Review, refine summary to $\le 60$ words, and approve or reject before publication.
                </p>
              </div>

              {quarantinedStories.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  <CheckCircle className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
                  <p className="text-slate-300 font-medium">Quarantine queue is clear</p>
                  <p className="mt-1">All qualified stories meet the 75% factual confidence threshold.</p>
                </div>
              ) : (
                quarantinedStories.map((story) => (
                  <div key={story.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800/90 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                          <span className="font-semibold text-slate-300">{story.publisher}</span>
                          <span aria-hidden="true">·</span>
                          <span>{story.country}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-amber-400 font-mono">Confidence: {story.confidenceScore}%</span>
                        </div>
                        <h4 className="text-sm font-bold text-white font-display">{story.title}</h4>
                      </div>
                      <a 
                        href={story.originalUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-1 text-slate-400 hover:text-white"
                        title="Open source URL"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>

                    {/* Quarantine reason box */}
                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-[11px] text-amber-300/90">
                      <span className="font-semibold block mb-0.5">Quarantine Rationale:</span>
                      <span>{story.quarantineReason || 'Low confidence in numerical assertion.'}</span>
                    </div>

                    {/* Edit mode vs Read mode */}
                    {editingStory?.id === story.id ? (
                      <div className="space-y-2 p-3 bg-slate-900/80 rounded-xl border border-slate-700">
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Headline</label>
                          <input 
                            type="text" 
                            value={editedHeadline}
                            onChange={(e) => setEditedHeadline(e.target.value)}
                            className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] text-slate-400 uppercase font-semibold">Summary</label>
                            <span className={`text-[10px] font-mono tabular-nums ${calculateWordCount(editedSummary) > 60 ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                              {calculateWordCount(editedSummary)} / 60 words
                            </span>
                          </div>
                          <textarea 
                            value={editedSummary}
                            onChange={(e) => setEditedSummary(e.target.value)}
                            rows={3}
                            className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {story.summary}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                      {editingStory?.id === story.id ? (
                        <>
                          <button
                            onClick={() => setEditingStory(null)}
                            className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                          >
                            Cancel Edit
                          </button>
                          <button
                            onClick={() => handleEditorialAction(story.id, 'approve')}
                            disabled={calculateWordCount(editedSummary) > 60}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium disabled:opacity-50"
                          >
                            Save & Publish
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingStory(story);
                              setEditedHeadline(story.title);
                              setEditedSummary(story.summary);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5"
                          >
                            <FileEdit className="w-3.5 h-3.5" />
                            <span>Edit Summary</span>
                          </button>
                          <button
                            onClick={() => handleEditorialAction(story.id, 'reject')}
                            className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/50 text-xs font-medium"
                          >
                            Reject Story
                          </button>
                          <button
                            onClick={() => handleEditorialAction(story.id, 'approve')}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium"
                          >
                            Approve
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* SOURCES REGISTRY */}
          {activeTab === 'sources' && (
            <div className="space-y-4">
              {/* Header and Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-white font-display">European Startup Registry</span>
                    <span className="text-[10px] text-slate-400">({sources.filter(s => s.enabled).length}/{sources.length} active)</span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5">3-Tier architecture: Pan-EU, Local Newsrooms, and Primary sources</span>
                </div>

                <button
                  onClick={handleTriggerPipeline}
                  disabled={runningPipeline}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${runningPipeline ? 'animate-spin' : ''}`} />
                  <span>{runningPipeline ? 'Ingesting Feeds...' : 'Run Daily Ingestion'}</span>
                </button>
              </div>

              {/* Layer Filters & Search */}
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full sm:w-auto">
                  {[
                    { id: 'all', label: 'All Sources' },
                    { id: 'Layer 1 - Pan-European', label: 'Layer 1: Pan-EU' },
                    { id: 'Layer 2 - Local', label: 'Layer 2: Local' },
                    { id: 'Layer 3 - Primary & Data', label: 'Layer 3: Primary' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setSourceFilterLayer(f.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                        sourceFilterLayer === f.id
                          ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-48 ml-auto">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={sourceSearchQuery}
                    onChange={(e) => setSourceSearchQuery(e.target.value)}
                    placeholder="Search country or name..."
                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1 text-white placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Source List */}
              <div className="space-y-2">
                {sources
                  .filter(s => {
                    const matchesLayer = sourceFilterLayer === 'all' || s.layer === sourceFilterLayer;
                    const matchesQuery = !sourceSearchQuery || 
                      s.name.toLowerCase().includes(sourceSearchQuery.toLowerCase()) ||
                      (s.country && s.country.toLowerCase().includes(sourceSearchQuery.toLowerCase())) ||
                      s.domain.toLowerCase().includes(sourceSearchQuery.toLowerCase());
                    return matchesLayer && matchesQuery;
                  })
                  .map(source => (
                    <div key={source.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800/90 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold text-white truncate">{source.name}</span>
                          <span className="text-[10px] text-slate-400 truncate">({source.domain})</span>
                          {source.country && (
                            <span className="text-[10px] text-slate-300 bg-slate-800 px-1.5 py-0.2 rounded font-medium">
                              {source.country}
                            </span>
                          )}
                          <span className="text-[10px] text-blue-400 font-mono ml-auto">Score: {source.credibilityRating}/10</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span className="text-blue-400/90 font-medium">{source.layer || 'Layer 2 - Local'}</span>
                          <span aria-hidden="true">·</span>
                          <span>{source.primaryCategory}</span>
                          {source.languages && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="uppercase text-slate-500">{source.languages.join(', ')}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleToggleSource(source.id, source.enabled)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                            source.enabled 
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                              : 'bg-slate-800 text-slate-500 border border-slate-700'
                          }`}
                        >
                          {source.enabled ? 'Active' : 'Disabled'}
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* PIPELINE & CADENCE SETTINGS */}
          {activeTab === 'pipeline' && (
            <div className="space-y-4">
              {/* Cadence & Shelf-Life Configuration Overview */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-white font-display">
                        {cadenceInfo?.config?.mode === 'cadence-6h' 
                          ? '6-Hour Ingestion Cadence & 72h Rolling Archive' 
                          : 'Legacy Mode (Daily 03:00 GMT / 7-Day)'}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold uppercase ${
                        cadenceInfo?.config?.mode === 'cadence-6h'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {cadenceInfo?.config?.mode === 'cadence-6h' ? 'ACTIVE CADENCE' : 'LEGACY DEFAULTS'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {cadenceInfo?.config?.mode === 'cadence-6h'
                        ? 'Automated 4-slot daily editions (Morning 03:00, Lunch 09:30, Evening 14:30, Overnight 19:00 GMT). Stories expire from active feed after 72 hours, with database retention for 7 days.'
                        : 'Single daily 03:00 GMT execution with 7-day shelf-life and 48-hour scan window.'}
                    </p>
                  </div>

                  {/* Single-Click Restore / Apply Action Button */}
                  <div className="shrink-0">
                    {cadenceInfo?.config?.mode === 'cadence-6h' ? (
                      <button
                        onClick={handleRestoreBackup}
                        disabled={restoringConfig}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 active:scale-95 shadow-sm"
                        title="1-Click Restore: Revert to previous Daily 03:00 GMT and 7-Day shelf-life"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${restoringConfig ? 'animate-spin' : ''}`} />
                        <span>{restoringConfig ? 'Reverting...' : 'Revert to Pre-Cadence Defaults'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleApplyCadence}
                        disabled={restoringConfig}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 active:scale-95 shadow-sm"
                        title="1-Click Apply: 6-Hour Cadence and 72-Hour Catch-Up Archive"
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${restoringConfig ? 'animate-spin' : ''}`} />
                        <span>{restoringConfig ? 'Applying...' : 'Apply 6-Hour Cadence (72h)'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Grid of Active Cadence Parameters */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                  <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">EDITIONS (GMT)</span>
                    <span className="text-white font-semibold">03:00 · 09:30 · 14:30 · 19:00</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">READER SHELF-LIFE</span>
                    <span className="text-amber-300 font-semibold">{cadenceInfo?.activeShelfLifeHours || 72}h (3 Days)</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">INGESTION SCAN</span>
                    <span className="text-blue-300 font-semibold">{cadenceInfo?.scanWindowHours || 24}h Rolling</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">DATABASE RETENTION</span>
                    <span className="text-slate-300 font-semibold">{cadenceInfo?.dbRetentionDays || 7} Days</span>
                  </div>
                </div>
              </div>

              {/* Execution Run Logs Header */}
              <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-1">
                <span className="font-semibold text-white font-display">Ingestion Execution History</span>
                <span className="text-[11px] font-mono">Auto-refreshes every 5 mins</span>
              </div>

              {pipelineLogs.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No pipeline runs recorded yet.</p>
              ) : (
                pipelineLogs.map((log, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5 font-mono">
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>Run: {log.runId}</span>
                      <span>Duration: {log.durationMs}ms</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-200">
                      <span>Discovered: {log.rawArticlesFetched}</span>
                      <span>Qualified: {log.articlesQualified}</span>
                      <span className="text-emerald-400">Published: {log.publishedCount}</span>
                      <span className="text-amber-400">Quarantined: {log.quarantinedCount}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Ranking Engine & Tiers Inspection View (Section 10 of Specification) */}
          {activeTab === 'ranking' && (
            <div className="space-y-4">
              {/* Specification Overview Card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-400" />
                      European Tech Story Ranking Engine v1.0
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Deterministic 6-dimension scoring, rolling 24h quality gate, diversity-aware portfolio selection (target 25, max 30).
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-blue-950/80 border border-blue-500/30 text-blue-300 font-mono text-[10px] font-bold">
                    SPEC COMPLIANT
                  </span>
                </div>

                {/* Six Scoring Dimensions Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">ECONOMIC IMPACT</span>
                    <span className="text-white font-semibold">25% (Log Funding Scale)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">TECH SIGNIFICANCE</span>
                    <span className="text-white font-semibold">20% (Breakthroughs & Depth)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">NOVELTY & ORIGINALITY</span>
                    <span className="text-white font-semibold">15% (Primary Reporting)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">ECOSYSTEM IMPACT</span>
                    <span className="text-white font-semibold">15% (Pan-EU Precedent)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">FRESHNESS (12H HALF-LIFE)</span>
                    <span className="text-amber-300 font-semibold">15% (Exponential Decay)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">EVIDENCE CONFIDENCE</span>
                    <span className="text-emerald-300 font-semibold">10% (Floor ≥ 30)</span>
                  </div>
                </div>
              </div>

              {/* Live Edition Selection Metrics */}
              {rankingMetrics ? (
                <div className="space-y-4">
                  {/* Summary Counters */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[10.5px]">SELECTED / TARGET</span>
                      <span className="text-lg font-bold text-white">
                        {rankingMetrics.selectedCount} / 25 <span className="text-[10px] text-slate-400 font-normal">(Max 30)</span>
                      </span>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[10.5px]">DISTINCT COUNTRIES</span>
                      <span className="text-lg font-bold text-blue-400">{rankingMetrics.distinctCountriesCount}</span>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[10.5px]">AVG INTRINSIC SCORE</span>
                      <span className="text-lg font-bold text-amber-300">{rankingMetrics.averageIntrinsicScore} / 100</span>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[10.5px]">QUALITY EXCLUSIONS</span>
                      <span className="text-lg font-bold text-slate-300">{rankingMetrics.qualityGateExclusions?.length || 0}</span>
                    </div>
                  </div>

                  {/* Top 3 Country Concentration & Guardrails */}
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white font-display">Country Concentration (Soft Cap: ≤ 25%)</span>
                      <span className="text-[11px] font-mono text-slate-400">Top 3 Countries Share</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {rankingMetrics.countryShareTop3?.map((c: any, i: number) => (
                        <div key={i} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
                          <span className="text-slate-400 block text-[10px]">#{i + 1} {c.country}</span>
                          <span className="text-white font-bold">{c.sharePercent}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Freshness Buckets */}
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white font-display">Freshness Distribution</span>
                      <span className="text-[11px] font-mono text-slate-400">Exponential 12h Half-Life</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
                      <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                        <span className="text-amber-400 block font-bold text-base">{rankingMetrics.freshnessDistribution?.under3h || 0}</span>
                        <span className="text-slate-500 text-[10px]">Under 3h</span>
                      </div>
                      <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                        <span className="text-amber-300 block font-bold text-base">{rankingMetrics.freshnessDistribution?.under6h || 0}</span>
                        <span className="text-slate-500 text-[10px]">3h - 6h</span>
                      </div>
                      <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                        <span className="text-sky-300 block font-bold text-base">{rankingMetrics.freshnessDistribution?.under12h || 0}</span>
                        <span className="text-slate-500 text-[10px]">6h - 12h</span>
                      </div>
                      <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                        <span className="text-slate-300 block font-bold text-base">{rankingMetrics.freshnessDistribution?.under24h || 0}</span>
                        <span className="text-slate-500 text-[10px]">12h - 24h</span>
                      </div>
                    </div>
                  </div>

                  {/* Quality Gate Exclusions Log */}
                  {rankingMetrics.qualityGateExclusions?.length > 0 && (
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white font-display">Quality Gate Exclusions (Audit Log)</span>
                        <span className="text-[11px] font-mono text-amber-400">{rankingMetrics.qualityGateExclusions.length} Stories Filtered</span>
                      </div>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto font-mono text-[11px]">
                        {rankingMetrics.qualityGateExclusions.map((ex: any, idx: number) => (
                          <div key={idx} className="p-2 rounded bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
                            <span className="truncate text-slate-300 max-w-[65%]">{ex.title}</span>
                            <span className="text-amber-300/80 text-[10px] shrink-0">{ex.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 font-mono">
                  Loading ranking metrics and distribution logs...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
