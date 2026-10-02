import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Map, CheckCircle2, Lock, Play, Clock, BookOpen,
  CheckSquare, ArrowRight, RefreshCw, AlertCircle, Sparkles, Filter
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext.js';
import {
  FadeIn, CardReveal, StaggerContainer, StaggerItem,
  AnimatedProgressBar, MotionButton
} from '../../components/common/AnimatedWrappers.js';
import { RoadmapPhase, RoadmapItemView } from '../../types.js';
import { apiFetch } from '../../lib/api.js';

interface RoadmapPageProps {
  onNavigate: (path: string) => void;
}

export const RoadmapPage: React.FC<RoadmapPageProps> = ({ onNavigate }) => {
  const { showCelebration } = useNotifications();
  const [phases, setPhases] = useState<RoadmapPhase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [recalculating, setRecalculating] = useState(false);

  const loadRoadmap = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch<{ phases: RoadmapPhase[] }>('/api/student/roadmap');
      if (res.ok && res.data?.phases) {
        setPhases(res.data.phases);
      } else {
        setError(res.error || 'Failed to load roadmap.');
      }
    } catch (err: any) {
      console.error('Failed to load roadmap:', err);
      setError(err?.message || 'Network error loading roadmap.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoadmap();
  }, []);

  const handleUpdateStatus = async (item: RoadmapItemView, newStatus: string) => {
    setUpdatingId(item.id);
    try {
      const res = await apiFetch(`/api/student/roadmap/item/${item.id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        await loadRoadmap();
        if (newStatus === 'completed') {
          showCelebration(
            `Milestone Completed: ${item.skillName}!`,
            'Your progress was recorded and the roadmap has automatically unlocked subsequent dependent phases.',
            'Roadmap Recalculated'
          );
        }
      }
    } catch (err) {
      console.error('Status update failed:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleManualRecalculate = async () => {
    setRecalculating(true);
    try {
      const res = await apiFetch<{ phases: RoadmapPhase[] }>('/api/student/roadmap/recalculate', {
        method: 'POST'
      });
      if (res.ok && res.data?.phases) {
        setPhases(res.data.phases);
        showCelebration('Roadmap Recalculated', 'All dependencies, prerequisites, and milestone statuses have been refreshed.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRecalculating(false);
    }
  };

  const totalItems = phases.reduce((acc, p) => acc + p.totalCount, 0);
  const completedItems = phases.reduce((acc, p) => acc + p.completedCount, 0);
  const percent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <div className="py-4 sm:py-8 max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 overflow-x-hidden">
      
      {/* Header */}
      <FadeIn className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white">Personalized Engineering Roadmap</h1>
            <span className="text-[10px] sm:text-xs text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40 font-semibold uppercase tracking-wider">Dynamic</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Adapts automatically as your skill assessments, project submissions, and task milestones evolve.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <MotionButton
            onClick={handleManualRecalculate}
            disabled={recalculating}
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer min-h-[44px]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${recalculating ? 'animate-spin text-blue-400' : ''}`} />
            <span>{recalculating ? 'Recalculating...' : 'Force Recalculate'}</span>
          </MotionButton>
        </div>
      </FadeIn>

      {/* Progress Card */}
      <CardReveal className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-6 backdrop-blur-sm">
        <div className="w-full sm:w-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Completion</span>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">{percent}%</span>
            <span className="text-xs text-slate-400">{completedItems} of {totalItems} milestones achieved</span>
          </div>
          <div className="w-full sm:w-80 mt-3">
            <AnimatedProgressBar progress={percent} />
          </div>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 self-start sm:self-auto w-full sm:w-auto justify-around sm:justify-start">
          {(['all', 'pending', 'completed'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className={`flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold rounded-lg capitalize transition-colors min-h-[40px] ${
                filter === mode ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </CardReveal>

      {/* Vertical Phases List */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Computing dynamic roadmap...</div>
      ) : error ? (
        <CardReveal className="rounded-2xl border border-red-900/40 bg-red-950/20 p-6 sm:p-8 text-center backdrop-blur-sm">
          <AlertCircle className="mx-auto h-8 w-8 text-red-400 mb-2" />
          <h3 className="text-sm font-semibold text-white">Could not load roadmap</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">{error}</p>
          <MotionButton
            onClick={loadRoadmap}
            className="mt-4 px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-xl cursor-pointer"
          >
            Retry Connection
          </MotionButton>
        </CardReveal>
      ) : phases.length === 0 ? (
        <CardReveal className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center backdrop-blur-sm">
          <Map className="mx-auto h-10 w-10 text-blue-400 mb-3 opacity-80" />
          <h3 className="text-base font-bold text-white">Initializing Your Personalized Roadmap</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Configuring milestones based on your career goal, academic background, and skills.
          </p>
          <MotionButton
            onClick={handleManualRecalculate}
            disabled={recalculating}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 cursor-pointer shadow-lg shadow-blue-500/20"
          >
            <Sparkles className="h-4 w-4" />
            <span>Generate Roadmap Now</span>
          </MotionButton>
        </CardReveal>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {phases.map((phase, pIdx) => {
            const filteredItems = phase.items.filter(it => {
              if (filter === 'completed') return it.status === 'completed';
              if (filter === 'pending') return it.status !== 'completed';
              return true;
            });

            if (filteredItems.length === 0 && filter !== 'all') return null;

            return (
              <CardReveal
                key={phase.phaseNumber}
                delay={pIdx * 0.08}
                className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-6 relative overflow-hidden backdrop-blur-sm"
              >
                {/* Phase Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 mb-5 gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-950 text-blue-400 border border-blue-800/50 text-xs font-bold font-mono">
                      {phase.phaseNumber}
                    </span>
                    <div>
                      <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">{phase.phaseTitle}</h2>
                      <span className="text-[11px] text-slate-400">
                        {phase.completedCount} / {phase.totalCount} completed
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded self-start sm:self-auto ${
                    phase.completedCount === phase.totalCount
                      ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/40'
                      : phase.isUnlocked
                      ? 'text-blue-400 bg-blue-950/60 border border-blue-800/40'
                      : 'text-slate-500 bg-slate-900 border border-slate-800'
                  }`}>
                    {phase.completedCount === phase.totalCount ? 'Phase Mastered' : phase.isUnlocked ? 'Unlocked Phase' : 'Locked Phase'}
                  </span>
                </div>

                {/* Milestone Items */}
                <div className="space-y-3">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                        item.status === 'completed'
                          ? 'border-emerald-950/60 bg-emerald-950/10'
                          : item.status === 'in_progress'
                          ? 'border-blue-500/40 bg-blue-950/20 shadow-md shadow-blue-500/5'
                          : item.status === 'locked'
                          ? 'border-slate-800/60 bg-slate-950/40 opacity-70'
                          : 'border-slate-800 bg-slate-950/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs ${
                            item.status === 'completed'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                              : item.status === 'in_progress'
                              ? 'bg-blue-950 text-blue-400 border border-blue-800/60'
                              : item.status === 'locked'
                              ? 'bg-slate-900 text-slate-600 border border-slate-800'
                              : 'bg-slate-900 text-slate-400'
                          }`}>
                            {item.status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> : item.status === 'locked' ? <Lock className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                          </div>

                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                              <h3 className={`text-xs sm:text-sm font-bold break-words ${item.status === 'completed' ? 'text-slate-300 line-through' : 'text-white'}`}>
                                {item.title}
                              </h3>
                              <span className="text-[10px] font-mono text-slate-500">· {item.estimatedHours}h est.</span>
                            </div>

                            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl break-words">
                              {item.description}
                            </p>

                            {!item.prerequisitesMet && item.status === 'locked' && (
                              <div className="flex items-center gap-1.5 text-[11px] text-amber-400 pt-1">
                                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                                <span>Locked: Complete {item.missingPrerequisites.join(', ')} first.</span>
                              </div>
                            )}

                            {/* Related Links */}
                            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                              {item.resourcesCount > 0 && (
                                <button
                                  onClick={() => onNavigate(`/resources?skill=${item.skillId}`)}
                                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1 min-h-[36px]"
                                >
                                  <BookOpen className="h-3.5 w-3.5" />
                                  <span>{item.resourcesCount} Verified Resources</span>
                                </button>
                              )}
                              {item.hasAssessment && (
                                <button
                                  onClick={() => onNavigate(`/assessments?skill=${item.skillId}`)}
                                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 min-h-[36px]"
                                >
                                  <CheckSquare className="h-3.5 w-3.5" />
                                  <span>Take Technical Quiz</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status Action Controls */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                          {item.status === 'completed' ? (
                            <MotionButton
                              onClick={() => handleUpdateStatus(item, 'in_progress')}
                              disabled={updatingId === item.id}
                              className="text-[11px] text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors min-h-[40px] flex items-center"
                            >
                              Mark In Progress
                            </MotionButton>
                          ) : item.status === 'locked' ? (
                            <span className="text-[11px] font-medium text-slate-500 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 min-h-[40px] flex items-center">
                              Locked
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              {item.status === 'available' && (
                                <MotionButton
                                  onClick={() => handleUpdateStatus(item, 'in_progress')}
                                  disabled={updatingId === item.id}
                                  className="text-[11px] font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors min-h-[40px] flex items-center"
                                >
                                  Start Task
                                </MotionButton>
                              )}
                              <MotionButton
                                onClick={() => handleUpdateStatus(item, 'completed')}
                                disabled={updatingId === item.id}
                                className="flex items-center gap-1 text-[11px] font-bold text-white px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 shadow-sm shadow-emerald-500/20 transition-all cursor-pointer min-h-[40px]"
                              >
                                <span>Mark Complete</span>
                              </MotionButton>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardReveal>
            );
          })}
        </div>
      )}
    </div>
  );
};
