import React, { useState } from 'react';
import { Sliders, Lock, Bell, Check, Save } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext.js';

export const SettingsPage: React.FC = () => {
  const { showCelebration } = useNotifications();
  const [learningPace, setLearningPace] = useState('moderate');
  const [weeklyHours, setWeeklyHours] = useState('15');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [roadmapNotifs, setRoadmapNotifs] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    showCelebration('Preferences Saved', 'Your weekly pacing and notification settings have been updated.');
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="py-8 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Student Account Settings</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Configure learning pacing, alerts, and system preferences.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Learning Pacing */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <h3 className="text-base font-bold text-white tracking-tight">Study Pacing & Commitments</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Dedicated Study Hours / Week</label>
              <input
                type="number"
                min="5"
                max="60"
                value={weeklyHours}
                onChange={(e) => setWeeklyHours(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Pacing Strategy</label>
              <select
                value={learningPace}
                onChange={(e) => setLearningPace(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="slow">Steady Foundation (5-10 hrs/week)</option>
                <option value="moderate">Moderate Acceleration (15-20 hrs/week)</option>
                <option value="intensive">Intensive Career Transition (25+ hrs/week)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <h3 className="text-base font-bold text-white tracking-tight">Notification Channels</h3>
          
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-white block">Next Best Action Alerts</span>
                <span className="text-[11px] text-slate-400">Receive in-app notifications whenever tasks recalculate.</span>
              </div>
              <input
                type="checkbox"
                checked={roadmapNotifs}
                onChange={(e) => setRoadmapNotifs(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-white block">New Internship Match Notifications</span>
                <span className="text-[11px] text-slate-400">Alerts when new roles match 80%+ of your skills.</span>
              </div>
              <input
                type="checkbox"
                checked={emailNotifs}
                onChange={(e) => setEmailNotifs(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
              />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>Save Preferences</span>
          </button>
        </div>

      </form>
    </div>
  );
};
