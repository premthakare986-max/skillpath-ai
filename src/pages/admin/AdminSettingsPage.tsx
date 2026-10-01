import React, { useState } from 'react';
import { Sliders, Shield, RefreshCw, CheckCircle2, Server, Key } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext.js';

interface AdminSettingsPageProps {
  onNavigate: (path: string) => void;
}

export const AdminSettingsPage: React.FC<AdminSettingsPageProps> = () => {
  const { showCelebration } = useNotifications();
  const [skillsWeight, setSkillsWeight] = useState(30);
  const [assessmentWeight, setAssessmentWeight] = useState(20);
  const [projectsWeight, setProjectsWeight] = useState(20);
  const [dsaWeight, setDsaWeight] = useState(15);
  const [profileWeight, setProfileWeight] = useState(15);

  const handleSaveWeights = (e: React.FormEvent) => {
    e.preventDefault();
    const sum = skillsWeight + assessmentWeight + projectsWeight + dsaWeight + profileWeight;
    if (sum !== 100) {
      alert(`The weights must sum to 100% (currently ${sum}%).`);
      return;
    }
    showCelebration('Scoring Weights Updated', 'Career readiness calculation weights updated successfully.');
  };

  return (
    <div className="py-8 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Admin Platform Settings</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Adjust analytical weights, inspect backend environment configurations, and manage platform defaults.
        </p>
      </div>

      {/* Career Readiness Analytical Formula Weights */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Career Readiness Indicator Weights</h3>
            <p className="text-xs text-slate-400 mt-0.5">Configurable scoring dimensions (must sum to 100%).</p>
          </div>
          <span className="text-xs font-mono font-bold text-blue-400 bg-blue-950 px-2.5 py-1 rounded border border-blue-800">
            Total: {skillsWeight + assessmentWeight + projectsWeight + dsaWeight + profileWeight}%
          </span>
        </div>

        <form onSubmit={handleSaveWeights} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Technical Skills Mastery (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={skillsWeight}
                onChange={(e) => setSkillsWeight(parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Technical Quiz Assessments (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={assessmentWeight}
                onChange={(e) => setAssessmentWeight(parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Project Portfolio Evidence (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={projectsWeight}
                onChange={(e) => setProjectsWeight(parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">DSA Problem Solving (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={dsaWeight}
                onChange={(e) => setDsaWeight(parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Academic & Profile (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={profileWeight}
                onChange={(e) => setProfileWeight(parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            Save Weight Configuration
          </button>
        </form>
      </div>

      {/* Environment & Architecture Inspection */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h3 className="text-base font-bold text-white tracking-tight">System Environment</h3>
        
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400">Database Engine:</span>
            <span className="font-mono text-emerald-400">SQLite 3 (Node 22 DatabaseSync WAL)</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400">AI Intelligence Engine:</span>
            <span className="font-mono text-indigo-400">Google Gemini API (@google/genai 2.4.0)</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400">Configured Model:</span>
            <span className="font-mono text-white">process.env.GEMINI_MODEL || gemini-3.8-flash</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400">Server Framework:</span>
            <span className="font-mono text-slate-200">Express + Vite Middleware (Full-Stack)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
