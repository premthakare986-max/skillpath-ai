import React, { useState, useEffect } from 'react';
import {
  FolderGit2, CheckCircle2, ArrowRight, ExternalLink, Github,
  Plus, Check, Sparkles, AlertCircle
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext.js';
import { Project, StudentProject } from '../../types.js';

interface ProjectsPageProps {
  onNavigate: (path: string) => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = () => {
  const { showCelebration } = useNotifications();
  const [projects, setProjects] = useState<Project[]>([]);
  const [myProjects, setMyProjects] = useState<StudentProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  // Submission Form Modal state
  const [submittingProject, setSubmittingProject] = useState<Project | null>(null);
  const [repoUrl, setRepoUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({});
  const [saving, setSaving] = useState(false);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('skillpath_token')}`,
    'Content-Type': 'application/json'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [projRes, myRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/student/projects', { headers: getHeaders() })
      ]);
      if (projRes.ok) {
        const d = await projRes.json();
        setProjects(d.projects || []);
      }
      if (myRes.ok) {
        const d = await myRes.json();
        setMyProjects(d.projects || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenSubmitModal = (proj: Project) => {
    setSubmittingProject(proj);
    const existing = myProjects.find(m => m.project_id === proj.id);
    setRepoUrl(existing?.github_repo_url || '');
    setDemoUrl(existing?.live_demo_url || '');
    const checklistObj: { [key: string]: boolean } = {};
    proj.checklist.forEach(item => {
      checklistObj[item] = existing?.completedChecklist?.includes(item) || false;
    });
    setCheckedItems(checklistObj);
  };

  const handleSaveProject = async () => {
    if (!submittingProject) return;
    setSaving(true);

    const completedList = Object.entries(checkedItems)
      .filter(([_, checked]) => checked)
      .map(([item]) => item);

    try {
      const res = await fetch('/api/student/projects', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          projectId: submittingProject.id,
          status: 'completed',
          githubRepoUrl: repoUrl,
          liveDemoUrl: demoUrl,
          completedChecklist: completedList
        })
      });

      if (res.ok) {
        await loadData();
        setSubmittingProject(null);
        showCelebration(
          `Project Verified: ${submittingProject.title}!`,
          'Project evidence added to your Career Readiness record. Portfolio score increased!',
          'Project Completed'
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="py-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Recommended Engineering Projects</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Build production-grade projects mapped to your career track. Add verified GitHub repos and live deployments to elevate your Career Readiness.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading project blueprints...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((proj) => {
            const myStatus = myProjects.find(m => m.project_id === proj.id);
            const isCompleted = myStatus?.status === 'completed';

            return (
              <div
                key={proj.id}
                className={`rounded-2xl border p-6 flex flex-col justify-between transition-all ${
                  isCompleted
                    ? 'border-emerald-500/30 bg-emerald-950/10'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                      {proj.difficulty} Track
                    </span>
                    {isCompleted && (
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Completed</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white tracking-tight">{proj.title}</h3>
                  <p className="mt-2 text-xs text-slate-300 leading-relaxed">{proj.description}</p>

                  <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-200 block">Why this project:</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{proj.why_this_project}</p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {proj.technologies?.map((tech) => (
                      <span key={tech} className="text-[11px] text-slate-300 bg-slate-800 px-2 py-0.5 rounded font-mono">
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* Checklist Preview */}
                  <div className="mt-4 pt-3 border-t border-slate-800/60 space-y-1">
                    <span className="text-[11px] font-medium text-slate-400 block mb-1">Architecture Checklist:</span>
                    {proj.checklist?.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                        <span className="truncate">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                  {myStatus?.github_repo_url ? (
                    <a
                      href={myStatus.github_repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                    >
                      <Github className="h-3.5 w-3.5" />
                      <span>View My Repo</span>
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500">Not submitted yet</span>
                  )}

                  <button
                    onClick={() => handleOpenSubmitModal(proj)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    <span>{isCompleted ? 'Update Project Links' : 'Submit Project Evidence'}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submission Modal */}
      {submittingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">Project Review</span>
              <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">{submittingProject.title}</h2>
              <p className="text-xs text-slate-400 mt-1">
                Provide real GitHub and deployment URLs to verify practical execution.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">GitHub Repository URL</label>
              <input
                type="url"
                required
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/rohit/ecommerce-fullstack"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Live Demo Deployment URL (Optional)</label>
              <input
                type="url"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                placeholder="https://my-project.vercel.app"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Checklist items verification */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-medium text-slate-300">Feature Checklist Completed</label>
              <div className="max-h-40 overflow-y-auto space-y-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
                {submittingProject.checklist.map((item) => (
                  <label key={item} className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkedItems[item] || false}
                      onChange={(e) => setCheckedItems(prev => ({ ...prev, [item]: e.target.checked }))}
                      className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSubmittingProject(null)}
                className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving || !repoUrl}
                onClick={handleSaveProject}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <span>{saving ? 'Verifying...' : 'Save & Recalculate Readiness'}</span>
                <Check className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
