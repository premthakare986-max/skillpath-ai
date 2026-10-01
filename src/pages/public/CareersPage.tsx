import React, { useEffect, useState } from 'react';
import { ArrowRight, Layers, Server, Cpu, BarChart3, Cloud, Smartphone, Briefcase, Check } from 'lucide-react';
import { Career } from '../../types.js';

interface CareersPageProps {
  onNavigate: (path: string) => void;
}

export const CareersPage: React.FC<CareersPageProps> = ({ onNavigate }) => {
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/careers')
      .then(res => res.json())
      .then(data => {
        setCareers(data.careers || []);
      })
      .catch(err => console.error('Failed to load careers:', err))
      .finally(() => setLoading(false));
  }, []);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Layers': return Layers;
      case 'Server': return Server;
      case 'Cpu': return Cpu;
      case 'BarChart3': return BarChart3;
      case 'Cloud': return Cloud;
      case 'Smartphone': return Smartphone;
      default: return Briefcase;
    }
  };

  return (
    <div className="py-16 md:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Standardized Career Blueprints</span>
        <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Explore Industry Career Tracks
        </h1>
        <p className="mt-4 text-sm text-slate-300 leading-relaxed">
          Each track is mapped with prerequisite dependencies, required technical proficiencies, project recommendations, and verified internship opportunities.
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading career blueprints...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {careers.map((career) => {
            const Icon = getIcon(career.icon);
            return (
              <div
                key={career.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-950/80 text-blue-400 border border-blue-800/50">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                      {career.market_demand} Demand
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white tracking-tight">{career.title}</h3>
                  <p className="mt-1 text-xs text-slate-400 font-mono">{career.category}</p>
                  <p className="mt-3 text-xs text-slate-300 leading-relaxed">{career.description}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">{career.total_skills || 10}+ required skills</span>
                  <button
                    onClick={() => onNavigate('/signup')}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <span>Build Roadmap</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
