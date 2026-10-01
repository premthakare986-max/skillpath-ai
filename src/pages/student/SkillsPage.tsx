import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Award, ArrowRight, CheckCircle2, AlertCircle, BookOpen,
  CheckSquare, FolderGit2, Search, SlidersHorizontal, RefreshCw,
  Github, ExternalLink, Sparkles, Youtube, ArrowUpRight, Info, Shield
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext.js';
import {
  FadeIn, CardReveal, StaggerContainer, StaggerItem,
  AnimatedProgressBar, MotionButton
} from '../../components/common/AnimatedWrappers.js';
import { SkillGapItem, GitHubEvidenceSummary, SkillEvidenceItem, EvidenceLevel } from '../../types.js';

interface SkillsPageProps {
  onNavigate: (path: string) => void;
}

export const SkillsPage: React.FC<SkillsPageProps> = ({ onNavigate }) => {
  const { showCelebration } = useNotifications();
  const [gaps, setGaps] = useState<SkillGapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [updatingSkillId, setUpdatingSkillId] = useState<number | null>(null);

  // GitHub Evidence State
  const [githubSummary, setGithubSummary] = useState<GitHubEvidenceSummary | null>(null);
  const [githubLoading, setGithubLoading] = useState(true);
  const [githubRefreshing, setGithubRefreshing] = useState(false);
  const [connectInput, setConnectInput] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [showConnectForm, setShowConnectForm] = useState(false);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('skillpath_token')}`,
    'Content-Type': 'application/json'
  });

  const loadSkills = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/student/gaps', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setGaps(data.gaps || []);
      }
    } catch (err) {
      console.error('Failed to load skills:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadGitHubEvidence = async () => {
    try {
      setGithubLoading(true);
      const res = await fetch('/api/github/evidence', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setGithubSummary(data);
      }
    } catch (err) {
      console.error('Failed to load GitHub evidence:', err);
    } finally {
      setGithubLoading(false);
    }
  };

  useEffect(() => {
    loadSkills();
    loadGitHubEvidence();
  }, []);

  const handleRefreshGitHub = async () => {
    try {
      setGithubRefreshing(true);
      const res = await fetch('/api/github/analyze', {
        method: 'POST',
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setGithubSummary(data);
        showCelebration('GitHub Evidence Refreshed', 'Repository technical evidence has been re-analyzed.');
      }
    } catch (err) {
      console.error('Failed to refresh GitHub analysis:', err);
    } finally {
      setGithubRefreshing(false);
    }
  };

  const handleConnectGitHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectInput.trim()) return;

    try {
      setConnecting(true);
      setConnectError(null);
      const res = await fetch('/api/github/connect', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ githubUrl: connectInput.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGithubSummary(data.summary);
        setShowConnectForm(false);
        setConnectInput('');
        showCelebration('GitHub Connected', `Connected @${data.username} and analyzed public repositories.`);
      } else {
        setConnectError(data.error || 'Failed to connect GitHub account.');
      }
    } catch (err: any) {
      setConnectError(err?.message || 'Network error connecting GitHub account.');
    } finally {
      setConnecting(false);
    }
  };

  const handleUpdateProficiency = async (skillId: number, newSelf: number) => {
    setUpdatingSkillId(skillId);
    try {
      const res = await fetch('/api/student/skills', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          skillId,
          selfProficiency: newSelf
        })
      });

      if (res.ok) {
        await loadSkills();
        if (newSelf >= 80) {
          showCelebration('Skill Proficiency Updated', 'Target reached! Your roadmap dependencies have updated accordingly.');
        }
      }
    } catch (err) {
      console.error('Failed to update skill:', err);
    } finally {
      setUpdatingSkillId(null);
    }
  };

  const handleMarkCompleted = async (item: SkillGapItem) => {
    handleUpdateProficiency(item.skillId, 85);
  };

  const categories = ['All', ...new Set(gaps.map(g => g.category))];

  const filteredGaps = gaps.filter(g => {
    const matchesSearch = g.skillName.toLowerCase().includes(search.toLowerCase()) || g.category.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'All' || g.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const getEvidenceBadge = (level?: EvidenceLevel) => {
    switch (level) {
      case 'Strong Evidence':
        return {
          bg: 'bg-emerald-950/70 border-emerald-700/50 text-emerald-400',
          dot: 'bg-emerald-400',
          label: 'Strong Evidence'
        };
      case 'Moderate Evidence':
        return {
          bg: 'bg-blue-950/70 border-blue-700/50 text-blue-400',
          dot: 'bg-blue-400',
          label: 'Moderate Evidence'
        };
      case 'Limited Evidence':
        return {
          bg: 'bg-amber-950/70 border-amber-700/50 text-amber-400',
          dot: 'bg-amber-400',
          label: 'Limited Evidence'
        };
      case 'No Evidence Detected':
      default:
        return {
          bg: 'bg-slate-900 border-slate-800 text-slate-400',
          dot: 'bg-slate-500',
          label: 'No Evidence Detected'
        };
    }
  };

  return (
    <div className="py-4 sm:py-8 max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 overflow-x-hidden">
      
      {/* Header */}
      <FadeIn className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white">Skills & Gap Analysis</h1>
            <span className="text-[10px] sm:text-xs text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40 font-semibold flex items-center gap-1">
              <Github className="h-3 w-3" />
              <span>Real GitHub Evidence</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Multi-source technical validation comparing your self-assessment, quiz testing, and observed GitHub project evidence.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <MotionButton
            onClick={() => onNavigate('/resources')}
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-colors min-h-[44px]"
          >
            <Youtube className="h-3.5 w-3.5 text-red-500" />
            <span>YouTube Resources</span>
          </MotionButton>
          <MotionButton
            onClick={() => onNavigate('/assessments')}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-500 transition-colors min-h-[44px]"
          >
            <CheckSquare className="h-3.5 w-3.5" />
            <span>Skill Quizzes</span>
          </MotionButton>
        </div>
      </FadeIn>

      {/* ==================================================== */}
      {/* FEATURE 2: REAL GITHUB SKILL EVIDENCE PANEL */}
      {/* ==================================================== */}
      <CardReveal className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950 p-5 sm:p-6 shadow-xl backdrop-blur-sm space-y-4">
        {githubLoading ? (
          <div className="flex items-center gap-3 py-4 text-xs text-slate-400">
            <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />
            <span>Analyzing repository technical evidence...</span>
          </div>
        ) : !githubSummary?.connected ? (
          /* State H: GitHub Not Connected */
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2">
                <Github className="h-5 w-5 text-white" />
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">GitHub Project Evidence Engine</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Connect GitHub to analyze your project evidence. SkillPath compares your public repositories, primary languages, and architecture topics against your declared skills.
              </p>
              <p className="text-[11px] text-slate-500">
                Transparent indicator derived solely from permitted public repository data. Does not alter your declared skill baseline.
              </p>
            </div>

            <div className="flex-shrink-0">
              {!showConnectForm ? (
                <MotionButton
                  onClick={() => setShowConnectForm(true)}
                  className="flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-white text-slate-900 px-4 py-2.5 text-xs font-bold shadow-md transition-all cursor-pointer min-h-[42px]"
                >
                  <Github className="h-4 w-4" />
                  <span>Connect GitHub Account</span>
                </MotionButton>
              ) : (
                <form onSubmit={handleConnectGitHub} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={connectInput}
                    onChange={(e) => setConnectInput(e.target.value)}
                    placeholder="github-username or profile URL"
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none min-h-[40px] w-full sm:w-64"
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <MotionButton
                      type="submit"
                      disabled={connecting || !connectInput.trim()}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-bold text-white transition-all cursor-pointer min-h-[40px] flex items-center justify-center gap-1.5"
                    >
                      {connecting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      <span>{connecting ? 'Analyzing...' : 'Connect'}</span>
                    </MotionButton>
                    <button
                      type="button"
                      onClick={() => { setShowConnectForm(false); setConnectError(null); }}
                      className="px-3 py-2 text-xs text-slate-400 hover:text-white cursor-pointer min-h-[40px]"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
            {connectError && (
              <p className="text-xs text-red-400 mt-1 col-span-full">{connectError}</p>
            )}
          </div>
        ) : !githubSummary.available ? (
          /* State I: GitHub API Failure / Unavailable */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-amber-500/30 bg-amber-950/10">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">GitHub analysis is temporarily unavailable.</h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  The profile itself remains unchanged. You can retry refreshing your repository analysis when access is restored.
                </p>
                {githubSummary.error && (
                  <p className="text-[11px] text-slate-500 mt-1 font-mono">{githubSummary.error}</p>
                )}
              </div>
            </div>
            <MotionButton
              onClick={handleRefreshGitHub}
              disabled={githubRefreshing}
              className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors cursor-pointer self-start sm:self-auto min-h-[40px]"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${githubRefreshing ? 'animate-spin' : ''}`} />
              <span>Retry Analysis</span>
            </MotionButton>
          </div>
        ) : (
          /* Connected & Analyzed Factual Evidence State */
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white flex-shrink-0">
                  <Github className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <a
                      href={githubSummary.profileUrl || `https://github.com/${githubSummary.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs sm:text-sm font-bold text-white hover:text-blue-400 transition-colors inline-flex items-center gap-1"
                    >
                      <span>@{githubSummary.username}</span>
                      <ArrowUpRight className="h-3 w-3 opacity-70" />
                    </a>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 font-semibold">
                      Connected
                    </span>
                    {githubSummary.cached && (
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                        Cached
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Analyzed {githubSummary.totalRepos} public repositories · Last verified {new Date(githubSummary.analyzedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Refresh Action */}
              <MotionButton
                onClick={handleRefreshGitHub}
                disabled={githubRefreshing}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white transition-all cursor-pointer self-start sm:self-auto min-h-[40px]"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${githubRefreshing ? 'animate-spin text-blue-400' : ''}`} />
                <span>{githubRefreshing ? 'Analyzing Repos...' : 'Refresh GitHub Analysis'}</span>
              </MotionButton>
            </div>

            {/* General Insights */}
            {githubSummary.generalInsights && githubSummary.generalInsights.length > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                  <span>Factual Evidence Insights</span>
                </div>
                {githubSummary.generalInsights.map((insight, idx) => (
                  <p key={idx} className="text-xs text-slate-300 leading-relaxed">
                    {insight}
                  </p>
                ))}
              </div>
            )}

            {/* Discovered Technologies Alert (Technologies detected but not listed) */}
            {githubSummary.discoveredTech && githubSummary.discoveredTech.length > 0 && (
              <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-900/40 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
                  <Info className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Discovered Technologies in GitHub (Not currently declared in profile)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {githubSummary.discoveredTech.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{item.techName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{item.repoCount} repo{item.repoCount > 1 ? 's' : ''}</span>
                      </div>
                      <p className="text-[11px] text-slate-300">{item.recommendationMessage}</p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.repos.slice(0, 2).map((r, rIdx) => (
                          <a
                            key={rIdx}
                            href={r.htmlUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-mono text-blue-400 hover:text-blue-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 hover:border-blue-700"
                          >
                            <span>{r.name}</span>
                            <ArrowUpRight className="h-2.5 w-2.5 opacity-70" />
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardReveal>

      {/* Search & Category Filter Controls */}
      <CardReveal className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search skills, frameworks..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none min-h-[44px]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto w-full sm:w-auto">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors min-h-[38px] cursor-pointer ${
                categoryFilter === c
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </CardReveal>

      {/* Skill Cards Grid with Stagger & GitHub Evidence Integration */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading skill matrix...</div>
      ) : (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {filteredGaps.map((item) => {
            // Match skill with its calculated GitHub project evidence
            const evidence = githubSummary?.skillEvidence?.find(
              e => e.skillId === item.skillId || e.skillName.toLowerCase() === item.skillName.toLowerCase()
            );

            const badge = getEvidenceBadge(evidence?.evidenceLevel);

            return (
              <StaggerItem key={item.skillId}>
                <CardReveal className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 flex flex-col justify-between hover:border-slate-700 transition-all backdrop-blur-sm h-full">
                  <div>
                    {/* Top Row: Skill Name & Priority */}
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">{item.skillName}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-400">
                          <span>{item.category}</span>
                          <span>·</span>
                          <span>{item.difficulty}</span>
                        </div>
                      </div>

                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border flex-shrink-0 ${
                        item.priority === 'High'
                          ? 'text-red-400 bg-red-950/60 border-red-800/40'
                          : item.priority === 'Medium'
                          ? 'text-amber-400 bg-amber-950/60 border-amber-800/40'
                          : 'text-slate-400 bg-slate-900 border-slate-800'
                      }`}>
                        {item.priority} Priority
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {item.relevance}
                    </p>

                    {/* Multi-Source Evidence Matrix Breakdown */}
                    <div className="mt-4 p-3.5 rounded-xl bg-slate-950/90 border border-slate-800/90 space-y-3">
                      
                      {/* Evidence Sources Comparison Table */}
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/60">
                          <span className="text-slate-400">Self-assessment:</span>
                          <span className="font-semibold text-slate-200">
                            {item.selfProficiency ?? item.currentProficiency}%
                          </span>
                        </div>

                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/60">
                          <span className="text-slate-400">Assessment Quiz:</span>
                          <span className="font-semibold text-slate-200">
                            {item.assessedProficiency != null ? `${item.assessedProficiency}%` : <span className="text-slate-500 font-normal">Pending quiz</span>}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/60">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Github className="h-3 w-3 text-slate-400" />
                            <span>GitHub Evidence:</span>
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold inline-flex items-center gap-1.5 ${badge.bg}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                            <span>{badge.label}</span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 font-mono">
                          <span className="text-slate-300 font-bold">Estimated Skill:</span>
                          <span className="text-blue-400 font-extrabold text-sm">{item.currentProficiency}%</span>
                        </div>
                      </div>

                      {/* Progress Bar & Gap */}
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[11px] font-mono text-slate-400">
                          <span>Target: <strong className="text-white">{item.requiredProficiency}%</strong></span>
                          <span className="text-amber-400 font-bold">Gap: {item.gap}%</span>
                        </div>
                        <AnimatedProgressBar progress={item.currentProficiency} />
                      </div>

                      {/* Factual Insight text */}
                      {evidence && (
                        <div className="pt-2 border-t border-slate-900 text-[11px] leading-relaxed text-slate-400">
                          <span className="text-slate-300 font-medium">Observed: </span>
                          <span>{evidence.factualInsight}</span>
                        </div>
                      )}

                      {/* Supporting Repositories if any */}
                      {evidence?.supportingRepos && evidence.supportingRepos.length > 0 && (
                        <div className="pt-2 border-t border-slate-900 space-y-1.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                            Supporting Repositories:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {evidence.supportingRepos.map((repo, rIdx) => (
                              <a
                                key={rIdx}
                                href={repo.htmlUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={repo.matchReason}
                                className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 hover:text-emerald-300 bg-slate-900 px-2 py-1 rounded-md border border-slate-800 hover:border-emerald-700 transition-colors"
                              >
                                <Github className="h-3 w-3" />
                                <span>{repo.name}</span>
                                <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Interactive Slider for Self-Rating */}
                      <div className="pt-2 border-t border-slate-900 flex flex-col xs:flex-row xs:items-center justify-between gap-2 text-[11px] text-slate-400">
                        <span>Adjust self-rating:</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          disabled={updatingSkillId === item.skillId}
                          value={item.selfProficiency ?? item.currentProficiency}
                          onChange={(e) => handleUpdateProficiency(item.skillId, parseInt(e.target.value))}
                          className="w-full xs:w-32 accent-blue-500 cursor-pointer min-h-[32px]"
                        />
                      </div>
                    </div>

                    {!item.prerequisitesMet && (
                      <div className="mt-3 text-[11px] text-amber-400 flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>Requires: {item.missingPrerequisites.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => onNavigate(`/resources?skill=${encodeURIComponent(item.skillName)}`)}
                        className="text-red-400 hover:text-red-300 font-medium flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-950/30 border border-red-900/40 hover:bg-red-950/60 transition-colors min-h-[36px] cursor-pointer"
                        title="Discover real YouTube courses"
                      >
                        <Youtube className="h-3.5 w-3.5" />
                        <span>YouTube Courses</span>
                      </button>

                      <button
                        onClick={() => onNavigate(`/assessments?skill=${item.skillId}`)}
                        className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-950/30 border border-indigo-900/40 hover:bg-indigo-950/60 transition-colors min-h-[36px] cursor-pointer"
                      >
                        <CheckSquare className="h-3.5 w-3.5" />
                        <span>Quiz</span>
                      </button>
                    </div>

                    {item.status !== 'completed' && (
                      <MotionButton
                        onClick={() => handleMarkCompleted(item)}
                        disabled={updatingSkillId === item.skillId}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors cursor-pointer min-h-[36px] flex items-center"
                      >
                        Mark Mastery
                      </MotionButton>
                    )}
                  </div>
                </CardReveal>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      )}
    </div>
  );
};
