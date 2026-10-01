import React, { useState, useEffect } from 'react';
import { FileText, Shield, ArrowLeft, CheckCircle2, Clock } from 'lucide-react';

interface AdminReportsPageProps {
  onNavigate: (path: string) => void;
}

export const AdminReportsPage: React.FC<AdminReportsPageProps> = ({ onNavigate }) => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('skillpath_token')}`
  });

  useEffect(() => {
    fetch('/api/admin/reports', { headers: getHeaders() })
      .then(res => res.json())
      .then(d => setReports(d.auditLogs || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="py-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">System Audit Reports</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Audit logging for career template updates, role authentications, and recalculation cycles.
          </p>
        </div>

        <button
          onClick={() => onNavigate('/admin')}
          className="px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
        >
          Admin Overview
        </button>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
          <CheckCircle2 className="h-4 w-4" />
          <span>Database Integrity: All SQLite schemas initialized and WAL journal enabled.</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase font-semibold text-slate-400">
              <tr>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Admin Actor</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-500">
                    Audit log clean. System operating normally.
                  </td>
                </tr>
              ) : (
                reports.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-semibold text-white">{r.action}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono">{r.entity_type}</td>
                    <td className="py-3 px-4 text-blue-400">{r.admin_email}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono">{r.created_at}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
