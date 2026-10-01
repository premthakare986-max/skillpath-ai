import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send, Calendar, Clock, ExternalLink, Trash2, Edit2,
  CheckCircle2, AlertCircle, Building, Plus, X
} from 'lucide-react';
import { Application } from '../../types.js';
import {
  FadeIn, CardReveal, MotionButton, smoothEase
} from '../../components/common/AnimatedWrappers.js';

interface ApplicationsPageProps {
  onNavigate: (path: string) => void;
}

export const ApplicationsPage: React.FC<ApplicationsPageProps> = ({ onNavigate }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [editStatus, setEditStatus] = useState<string>('applied');
  const [editInterviewDate, setEditInterviewDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('skillpath_token')}`,
    'Content-Type': 'application/json'
  });

  const loadApplications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/applications', { headers: getHeaders() });
      if (res.ok) {
        const d = await res.json();
        setApplications(d.applications || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleOpenEdit = (app: Application) => {
    setEditingApp(app);
    setEditStatus(app.status);
    setEditInterviewDate(app.interview_date || '');
    setEditNotes(app.notes || '');
  };

  const handleSaveEdit = async () => {
    if (!editingApp) return;
    try {
      const res = await fetch(`/api/applications/${editingApp.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          status: editStatus,
          interviewDate: editInterviewDate || null,
          notes: editNotes || null
        })
      });

      if (res.ok) {
        await loadApplications();
        setEditingApp(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setApplications(prev => prev.filter(a => a.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="py-4 sm:py-8 max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 overflow-x-hidden">
      
      {/* Header */}
      <FadeIn className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white">Application Pipeline</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Track interview timelines, test deadlines, and application statuses across your opportunities.
          </p>
        </div>

        <MotionButton
          onClick={() => onNavigate('/opportunities')}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-sm shadow-blue-500/20 transition-all self-start sm:self-auto cursor-pointer min-h-[44px]"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Find Openings</span>
        </MotionButton>
      </FadeIn>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading pipeline...</div>
      ) : applications.length === 0 ? (
        <CardReveal className="py-16 sm:py-20 text-center rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8 backdrop-blur-sm">
          <Send className="h-8 w-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">No applications tracked yet.</p>
          <p className="text-xs text-slate-500 mt-1">Bookmark or track applications directly from the Opportunities tab.</p>
          <MotionButton
            onClick={() => onNavigate('/opportunities')}
            className="mt-4 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white min-h-[44px] cursor-pointer"
          >
            Explore Matched Opportunities
          </MotionButton>
        </CardReveal>
      ) : (
        /* Applications Kanban / Grid */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {applications.map((app, idx) => (
              <CardReveal
                key={app.id}
                delay={idx * 0.05}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 flex flex-col justify-between hover:border-slate-700 transition-all backdrop-blur-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-xs text-slate-400 flex items-center gap-1 font-medium truncate">
                        <Building className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{app.company}</span>
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-white tracking-tight mt-0.5 truncate">{app.role}</h3>
                    </div>

                    <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border border-blue-800/40 bg-blue-950/60 text-blue-300 flex-shrink-0">
                      {app.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 space-y-1 mt-3">
                    <p className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                      <span className="truncate">Applied: {app.applied_date || 'Not specified'}</span>
                    </p>
                    {app.interview_date && (
                      <p className="flex items-center gap-1.5 text-amber-400">
                        <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">Interview: {app.interview_date}</span>
                      </p>
                    )}
                  </div>

                  {app.notes && (
                    <div className="mt-3 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300 leading-relaxed break-words">
                      {app.notes}
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs gap-2">
                  <button
                    onClick={() => handleOpenEdit(app)}
                    className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer py-1.5 min-h-[40px]"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>Update Stage</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <a
                      href={app.application_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold transition-colors cursor-pointer py-1.5 min-h-[40px]"
                    >
                      <span>Portal</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <button
                      onClick={() => handleDelete(app.id)}
                      className="text-slate-500 hover:text-red-400 p-1.5 transition-colors cursor-pointer"
                      aria-label="Delete application"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </CardReveal>
            ))}
          </div>
        </div>
      )}

      {/* Edit Stage Modal */}
      <AnimatePresence>
        {editingApp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm"
            onClick={() => setEditingApp(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: smoothEase }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-blue-400">Update Pipeline</span>
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">{editingApp.company} - {editingApp.role}</h2>
                </div>
                <button
                  onClick={() => setEditingApp(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Application Status Stage</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none capitalize min-h-[44px]"
                >
                  <option value="saved">Saved / Bookmarked</option>
                  <option value="applied">Applied</option>
                  <option value="assessment">Online Assessment Scheduled</option>
                  <option value="interview">Interview Scheduled</option>
                  <option value="selected">Offer Received</option>
                  <option value="rejected">Not Selected</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Interview / Deadline Date (Optional)</label>
                <input
                  type="date"
                  value={editInterviewDate}
                  onChange={(e) => setEditInterviewDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Personal Notes / Interview Insights</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Completed technical round, asked questions on React useEffect and SQL indexing."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 sm:gap-3 border-t border-slate-800">
                <MotionButton
                  type="button"
                  onClick={() => setEditingApp(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white min-h-[44px] cursor-pointer"
                >
                  Cancel
                </MotionButton>
                <MotionButton
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer min-h-[44px]"
                >
                  Save Updates
                </MotionButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

