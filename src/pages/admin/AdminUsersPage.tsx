import React, { useState, useEffect } from 'react';
import { Users, Search, Shield, ArrowLeft, CheckCircle2, Clock } from 'lucide-react';

interface AdminUsersPageProps {
  onNavigate: (path: string) => void;
}

export const AdminUsersPage: React.FC<AdminUsersPageProps> = ({ onNavigate }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('skillpath_token')}`
  });

  useEffect(() => {
    fetch('/api/admin/users', { headers: getHeaders() })
      .then(res => res.json())
      .then(d => setUsers(d.users || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    (u.full_name && u.full_name.toLowerCase().includes(search.toLowerCase())) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.career_title && u.career_title.toLowerCase().includes(search.toLowerCase())) ||
    (u.college && u.college.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Registered Students</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real student accounts, completed onboarding statuses, and skill milestone counts.
          </p>
        </div>

        <button
          onClick={() => onNavigate('/admin')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Admin Overview</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by name, email, college, track..."
          className="w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading student directory...</div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase font-semibold text-slate-400">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Institution & Degree</th>
                  <th className="py-3 px-4">Career Goal</th>
                  <th className="py-3 px-4">Skills Mastered</th>
                  <th className="py-3 px-4">Projects Built</th>
                  <th className="py-3 px-4">Applications</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{u.full_name || 'In Onboarding'}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <div>{u.college || '—'}</div>
                      <div className="text-[11px] text-slate-500">{u.degree} {u.branch ? `· ${u.branch}` : ''} {u.cgpa ? `(CGPA: ${u.cgpa})` : ''}</div>
                    </td>
                    <td className="py-3.5 px-4 text-blue-400 font-medium">
                      {u.career_title || 'Not Selected'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {u.completed_skills_count || 0}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {u.completed_projects_count || 0}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {u.applications_count || 0}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                        u.onboarding_completed
                          ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40'
                          : 'text-amber-400 bg-amber-950/60 border-amber-800/40'
                      }`}>
                        {u.onboarding_completed ? 'Active' : 'Onboarding Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
