import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Award, Briefcase, ArrowLeft } from 'lucide-react';

interface AdminAnalyticsPageProps {
  onNavigate: (path: string) => void;
}

export const AdminAnalyticsPage: React.FC<AdminAnalyticsPageProps> = ({ onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('skillpath_token')}`
  });

  useEffect(() => {
    fetch('/api/admin/analytics', { headers: getHeaders() })
      .then(res => res.json())
      .then(d => setData(d))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="py-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Database Analytics & Distributions</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Grounded distributions computed directly from stored user skills, applications, and goals.
          </p>
        </div>

        <button
          onClick={() => onNavigate('/admin')}
          className="px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
        >
          Admin Overview
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading database analytics...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Career Distribution */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Career Goal Distribution</h3>
              <Briefcase className="h-4 w-4 text-blue-400" />
            </div>

            <div className="space-y-3 pt-2">
              {data?.careerDistribution?.map((c: any) => (
                <div key={c.title} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>{c.title}</span>
                    <span className="font-mono font-bold text-white">{c.student_count} students</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, (c.student_count / (data.careerDistribution[0]?.student_count || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Enrolled Skills */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Top Enrolled Skills</h3>
              <Award className="h-4 w-4 text-emerald-400" />
            </div>

            <div className="space-y-3 pt-2">
              {data?.topSkills?.map((s: any) => (
                <div key={s.name} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                  <div>
                    <span className="font-bold text-white block">{s.name}</span>
                    <span className="text-[10px] text-slate-500">{s.enrolled_count} students enrolled</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    Avg: {Math.round(s.avg_proficiency || 0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
