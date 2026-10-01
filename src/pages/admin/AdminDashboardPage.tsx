import React, { useState, useEffect } from 'react';
import {
  Users, Briefcase, Award, FolderGit2, Send, CheckCircle2,
  TrendingUp, Shield, ArrowRight, BarChart3, AlertCircle, Mail
} from 'lucide-react';

interface AdminDashboardPageProps {
  onNavigate: (path: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('skillpath_token')}`
  });

  useEffect(() => {
    fetch('/api/admin/overview', { headers: getHeaders() })
      .then(res => res.json())
      .then(d => setData(d))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading admin console...</div>;
  }

  const metrics = data?.metrics || {};

  return (
    <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-purple-400" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Administrator Console</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time database statistics and curriculum management. No synthetic demo figures.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-800/40 font-mono">
            System Status: Healthy
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] font-medium text-slate-400">Enrolled Students</span>
          <p className="text-2xl font-bold text-white mt-1 font-mono">{metrics.totalUsers || 0}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] font-medium text-slate-400">Career Tracks</span>
          <p className="text-2xl font-bold text-white mt-1 font-mono">{metrics.totalCareers || 0}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] font-medium text-slate-400">Master Skills</span>
          <p className="text-2xl font-bold text-white mt-1 font-mono">{metrics.totalSkills || 0}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] font-medium text-slate-400">Project Blueprints</span>
          <p className="text-2xl font-bold text-white mt-1 font-mono">{metrics.totalProjects || 0}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] font-medium text-slate-400">Active Openings</span>
          <p className="text-2xl font-bold text-white mt-1 font-mono">{metrics.totalOpportunities || 0}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] font-medium text-slate-400">Applications Tracked</span>
          <p className="text-2xl font-bold text-white mt-1 font-mono">{metrics.totalApplications || 0}</p>
        </div>

        <button
          onClick={() => onNavigate('/admin/inquiries')}
          className="rounded-2xl border border-blue-900/40 bg-blue-950/20 p-4 text-left hover:border-blue-700/60 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-blue-300">Contact Inquiries</span>
            {(metrics.newInquiries || 0) > 0 && (
              <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>
            )}
          </div>
          <p className="text-2xl font-bold text-blue-400 mt-1 font-mono">{metrics.totalInquiries || 0}</p>
        </button>
      </div>

      {/* Quick Nav Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <button
          onClick={() => onNavigate('/admin/inquiries')}
          className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700 text-left transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <Mail className="h-5 w-5 text-blue-400 mb-2" />
            <h3 className="text-sm font-bold text-white">Contact Inquiries</h3>
            <p className="text-xs text-slate-400 mt-1">Review, triage, and reply to student and institutional messages.</p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs text-blue-400 font-semibold">
            <span>Manage inquiries</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </button>
        <button
          onClick={() => onNavigate('/admin/users')}
          className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700 text-left transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <Users className="h-5 w-5 text-blue-400 mb-2" />
            <h3 className="text-sm font-bold text-white">Student Management</h3>
            <p className="text-xs text-slate-400 mt-1">Review student progress, academic records, and career goals.</p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs text-blue-400 font-semibold">
            <span>Manage users</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </button>

        <button
          onClick={() => onNavigate('/admin/careers')}
          className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700 text-left transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <Briefcase className="h-5 w-5 text-purple-400 mb-2" />
            <h3 className="text-sm font-bold text-white">Career Tracks</h3>
            <p className="text-xs text-slate-400 mt-1">Define industry roles, required skill levels, and descriptions.</p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs text-purple-400 font-semibold">
            <span>Manage careers</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </button>

        <button
          onClick={() => onNavigate('/admin/skills')}
          className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700 text-left transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <Award className="h-5 w-5 text-emerald-400 mb-2" />
            <h3 className="text-sm font-bold text-white">Skills & Graphs</h3>
            <p className="text-xs text-slate-400 mt-1">Maintain core competencies, categories, and prerequisite trees.</p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs text-emerald-400 font-semibold">
            <span>Manage skills</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </button>

        <button
          onClick={() => onNavigate('/admin/opportunities')}
          className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700 text-left transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <Send className="h-5 w-5 text-amber-400 mb-2" />
            <h3 className="text-sm font-bold text-white">Internship Listings</h3>
            <p className="text-xs text-slate-400 mt-1">Publish verified employer postings and official portal URLs.</p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs text-amber-400 font-semibold">
            <span>Manage listings</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </button>
      </div>

      {/* Recent Users Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white tracking-tight">Recent Registered Students</h2>
          <button
            onClick={() => onNavigate('/admin/users')}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
          >
            View All Users
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] uppercase font-semibold text-slate-400">
              <tr>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Career Goal</th>
                <th className="py-3 px-4">Registered Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {data?.recentUsers?.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-semibold text-white">{u.full_name || 'In Onboarding'}</td>
                  <td className="py-3 px-4 text-slate-400 font-mono">{u.email}</td>
                  <td className="py-3 px-4 text-blue-400">{u.career_goal || 'Not Selected'}</td>
                  <td className="py-3 px-4 text-slate-500 font-mono">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
