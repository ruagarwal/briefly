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
  Layers
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
  const [activeTab, setActiveTab] = useState<'funnel' | 'quarantine' | 'sources' | 'pipeline'>('funnel');
  const [quarantinedStories, setQuarantinedStories] = useState<NewsStory[]>([]);
  const [sources, setSources] = useState<SourceRegistryItem[]>([]);
  const [pipelineLogs, setPipelineLogs] = useState<PipelineExecutionResult[]>([]);
  const [analytics, setAnalytics] = useState<AnonymousAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [runningPipeline, setRunningPipeline] = useState(false);
  const [editingStory, setEditingStory] = useState<NewsStory | null>(null);
  const [editedHeadline, setEditedHeadline] = useState('');
  const [editedSummary, setEditedSummary] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [sourceFilterLayer, setSourceFilterLayer] = useState<string>('all');
  const [sourceSearchQuery, setSourceSearchQuery] = useState<string>('');

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [qRes, sRes, lRes, aRes] = await Promise.all([
        fetch('/api/admin/quarantine'),
        fetch('/api/sources'),
        fetch('/api/pipeline/logs'),
        fetch('/api/analytics/summary')
      ]);

      if (qRes.ok) setQuarantinedStories(await qRes.json());
      if (sRes.ok) setSources(await sRes.json());
      if (lRes.ok) setPipelineLogs(await lRes.json());
      if (aRes.ok) setAnalytics(await aRes.json());
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
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

  const calculateWordCount = (str: string) => {
    return str.trim().split(/\s+/).filter(Boolean).length;
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
              Pipeline Logs
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
                  <span><strong>GDPR Compliant by Default:</strong> Zero PII, no cookies, no tracking across sites. Pure aggregate session & drop-off metrics.</span>
                </div>
                <button 
                  onClick={fetchData}
                  className="p-1 rounded text-slate-400 hover:text-white shrink-0"
                  title="Refresh stats"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 4 Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">Active Reader Sessions</span>
                  <span className="text-xl font-bold text-white font-mono tabular-nums">
                    {analytics?.totalSessions || 0}
                  </span>
                  <span className="text-[10px] text-emerald-400 block mt-1">Controlled beta cohort</span>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">Avg Reading Depth</span>
                  <span className="text-xl font-bold text-blue-400 font-mono tabular-nums">
                    {analytics?.averageReadingDepth || 0} <span className="text-xs text-slate-500 font-normal">cards</span>
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">Stories read per session</span>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">Feed Completion Rate</span>
                  <span className="text-xl font-bold text-emerald-400 font-mono tabular-nums">
                    {analytics?.completionRatePercent || 0}%
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">Reached final card</span>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">Quick Bounce Rate</span>
                  <span className="text-xl font-bold text-amber-400 font-mono tabular-nums">
                    {analytics ? Math.round((analytics.quickBounces / Math.max(analytics.totalSessions, 1)) * 100) : 0}%
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">&lt; 4s dwell time</span>
                </div>
              </div>

              {/* Reading Funnel & Drop-off Breakdown */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white font-display">Reading Funnel & Drop-Off Progression</h3>
                    <p className="text-[11px] text-slate-400">Retention from Story 1 through the daily briefing</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Cohort size: {analytics?.totalSessions || 0} readers</span>
                </div>

                <div className="space-y-2.5 pt-2">
                  {analytics?.funnelSteps.map((step, idx) => (
                    <div key={idx} className="space-y-1">
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
                      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
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
                <h3 className="text-xs font-bold text-white font-display">Friction & Interest Signals</h3>
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

          {/* PIPELINE LOGS */}
          {activeTab === 'pipeline' && (
            <div className="space-y-3">
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
        </div>
      </div>
    </div>
  );
};
