import React, { useState, useEffect } from 'react';
import {
  TrendingUp, CheckCircle2, Clock, Code, Award,
  Check, ArrowRight, BarChart2, Plus, Minus
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext.js';
import { DsaTopic } from '../../types.js';

interface ProgressPageProps {
  onNavigate: (path: string) => void;
}

export const ProgressPage: React.FC<ProgressPageProps> = ({ onNavigate }) => {
  const { showCelebration } = useNotifications();
  const [dsaTopics, setDsaTopics] = useState<DsaTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('skillpath_token')}`,
    'Content-Type': 'application/json'
  });

  const loadDsa = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dsa', { headers: getHeaders() });
      if (res.ok) {
        const d = await res.json();
        setDsaTopics(d.topics || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDsa();
  }, []);

  const handleAdjustSolved = async (topic: DsaTopic, delta: number) => {
    const newSolved = Math.max(0, Math.min(topic.total_problems, topic.problems_solved + delta));
    const newStatus = newSolved >= topic.total_problems ? 'completed' : (newSolved > 0 ? 'in_progress' : 'not_started');

    setUpdatingId(topic.id);
    try {
      const res = await fetch(`/api/dsa/${topic.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          problemsSolved: newSolved,
          status: newStatus
        })
      });

      if (res.ok) {
        setDsaTopics(prev => prev.map(t => t.id === topic.id ? { ...t, problems_solved: newSolved, status: newStatus } : t));
        if (newStatus === 'completed' && topic.status !== 'completed') {
          showCelebration(
            `DSA Topic Mastered: ${topic.topic}!`,
            `Solved all ${topic.total_problems} problems. Next algorithmic topic unlocked.`,
            'DSA Milestone'
          );
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const totalProblems = dsaTopics.reduce((acc, t) => acc + t.total_problems, 0);
  const totalSolved = dsaTopics.reduce((acc, t) => acc + t.problems_solved, 0);
  const overallDsaPct = totalProblems > 0 ? Math.round((totalSolved / totalProblems) * 100) : 0;

  return (
    <div className="py-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Algorithm & Progress Tracking</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Data Structures & Algorithms problem-solving velocity across core foundational topics.
          </p>
        </div>
      </div>

      {/* DSA Overview Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total DSA Progress</span>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-3xl font-extrabold text-white font-mono">{overallDsaPct}%</span>
            <span className="text-xs text-slate-400">{totalSolved} of {totalProblems} problems solved</span>
          </div>
          <div className="w-full sm:w-80 bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${overallDsaPct}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3 text-xs text-slate-400 max-w-xs">
          <span className="font-semibold text-slate-200 block mb-1">Algorithmic Pipeline:</span>
          <p className="text-[11px] leading-relaxed">
            Arrays → Strings → Searching → Sorting → Linked Lists → Stack/Queue → Trees → Graphs.
          </p>
        </div>
      </div>

      {/* DSA Topics List */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading DSA curriculum...</div>
      ) : (
        <div className="space-y-3">
          {dsaTopics.map((topic, idx) => {
            const isCompleted = topic.status === 'completed';
            const pct = Math.round((topic.problems_solved / topic.total_problems) * 100);

            return (
              <div
                key={topic.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isCompleted
                    ? 'border-emerald-950/60 bg-emerald-950/10'
                    : topic.status === 'in_progress'
                    ? 'border-blue-900/40 bg-blue-950/20'
                    : 'border-slate-800 bg-slate-900/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 font-mono text-xs font-bold text-slate-300">
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">{topic.topic}</h3>
                    <span className="text-[11px] font-mono text-slate-400">
                      {topic.problems_solved} / {topic.total_problems} solved ({pct}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Progress bar */}
                  <div className="w-24 sm:w-36 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Increment/Decrement Controls */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleAdjustSolved(topic, -1)}
                      disabled={updatingId === topic.id || topic.problems_solved <= 0}
                      className="h-7 w-7 rounded-lg border border-slate-800 bg-slate-900 flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleAdjustSolved(topic, 1)}
                      disabled={updatingId === topic.id || topic.problems_solved >= topic.total_problems}
                      className="h-7 w-7 rounded-lg border border-slate-800 bg-slate-900 flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border min-w-[80px] text-center ${
                    isCompleted
                      ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40'
                      : topic.status === 'in_progress'
                      ? 'text-blue-400 bg-blue-950/60 border-blue-800/40'
                      : 'text-slate-500 bg-slate-950 border-slate-800'
                  }`}>
                    {topic.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
