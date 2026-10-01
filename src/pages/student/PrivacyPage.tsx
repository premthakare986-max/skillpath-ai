import React, { useState } from 'react';
import { Shield, Download, Trash2, Github, Linkedin, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface PrivacyPageProps {
  onNavigate: (path: string) => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('skillpath_token')}`,
    'Content-Type': 'application/json'
  });

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const res = await fetch('/api/privacy/export', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `skillpath-data-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setStatusMessage('Your complete student record archive has been downloaded.');
      }
    } catch (err) {
      console.error(err);
      setStatusMessage('Export request failed. Please retry.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDisconnect = async (service: 'github' | 'linkedin') => {
    try {
      const res = await fetch(`/api/privacy/disconnect-${service}`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (res.ok) {
        setStatusMessage(`${service === 'github' ? 'GitHub' : 'LinkedIn'} connection removed.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch('/api/privacy/delete-account', {
        method: 'POST',
        headers: getHeaders()
      });
      if (res.ok) {
        await logout();
        onNavigate('/login');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="py-8 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-emerald-400" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Student Privacy & Data Transparency</h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Full ownership and transparency over what data SkillPath AI analyzes, stores, and computes.
        </p>
      </div>

      {statusMessage && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-3 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Data Ingestion Transparency */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h3 className="text-base font-bold text-white tracking-tight">Data Used by SkillPath AI</h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          We believe in complete algorithmic transparency. Here is exactly what data is stored and utilized to generate your personalized career roadmaps:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="font-semibold text-slate-200 block">Academic Records</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Degree, branch, college name, current semester, and CGPA.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="font-semibold text-slate-200 block">Skill Ratings & Quiz Scores</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Self-proficiency (0-100%) and verified quiz scores.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="font-semibold text-slate-200 block">Project Evidence</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Project descriptions, GitHub repo URLs, and live deployment links.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="font-semibold text-slate-200 block">Opportunity Applications</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Tracked internship stages and interview notes.</p>
          </div>
        </div>
      </div>

      {/* Connected Integrations */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h3 className="text-base font-bold text-white tracking-tight">Connected Profiles</h3>
        <p className="text-xs text-slate-300">
          You can disconnect your public profiles at any time.
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center gap-3">
              <Github className="h-5 w-5 text-slate-300" />
              <div>
                <span className="text-xs font-bold text-white block">GitHub Profile Link</span>
                <span className="text-[11px] text-slate-400">Used to reference repositories</span>
              </div>
            </div>
            <button
              onClick={() => handleDisconnect('github')}
              className="text-xs text-red-400 hover:text-red-300 font-semibold"
            >
              Disconnect
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center gap-3">
              <Linkedin className="h-5 w-5 text-blue-400" />
              <div>
                <span className="text-xs font-bold text-white block">LinkedIn Profile Link</span>
                <span className="text-[11px] text-slate-400">Used for recruiter reference</span>
              </div>
            </div>
            <button
              onClick={() => handleDisconnect('linkedin')}
              className="text-xs text-red-400 hover:text-red-300 font-semibold"
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>

      {/* Data Export & Account Deletion */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h3 className="text-base font-bold text-white tracking-tight">Data Portability & Erasure</h3>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div>
            <span className="text-xs font-bold text-white block">Export My Data (JSON)</span>
            <span className="text-[11px] text-slate-400">Download a full machine-readable archive of all your skills, assessments, and applications.</span>
          </div>
          <button
            onClick={handleExportData}
            disabled={exportLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{exportLoading ? 'Exporting...' : 'Export JSON'}</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-red-950/20 border border-red-900/40">
          <div>
            <span className="text-xs font-bold text-red-300 block">Delete SkillPath Account</span>
            <span className="text-[11px] text-slate-400">Permanently erase all profile records, skill assessments, and tracked roadmap milestones.</span>
          </div>
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold text-white transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-red-900/60 bg-slate-900 p-6 shadow-2xl space-y-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-950 text-red-400 border border-red-800 mx-auto">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Permanently delete your account?</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              This action cannot be undone. All your assessments, custom roadmap milestones, and tracked application records will be deleted immediately.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow-md shadow-red-500/20"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
