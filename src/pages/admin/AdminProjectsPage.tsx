import React, { useState, useEffect } from 'react';
import { FolderGit2, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { Project, Career } from '../../types.js';

interface AdminProjectsPageProps {
  onNavigate: (path: string) => void;
}

export const AdminProjectsPage: React.FC<AdminProjectsPageProps> = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form
  const [careerId, setCareerId] = useState<number>(1);
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [description, setDescription] = useState('');
  const [whyThisProject, setWhyThisProject] = useState('');
  const [learningOutcomes, setLearningOutcomes] = useState('');
  const [techStr, setTechStr] = useState('React, TypeScript, Tailwind');
  const [checklistStr, setChecklistStr] = useState('Setup repo, Create UI components, Add tests');

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('skillpath_token')}`,
    'Content-Type': 'application/json'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [pRes, cRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/careers')
      ]);
      if (pRes.ok) {
        const d = await pRes.json();
        setProjects(d.projects || []);
      }
      if (cRes.ok) {
        const cd = await cRes.json();
        setCareers(cd.careers || []);
        if (cd.careers?.[0]) setCareerId(cd.careers[0].id);
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const technologies = techStr.split(',').map(s => s.trim()).filter(Boolean);
    const checklist = checklistStr.split(',').map(s => s.trim()).filter(Boolean);
    const slug = title.toLowerCase().replace(/[^a-z0-9]/g, '-');

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          careerId,
          title,
          slug,
          difficulty,
          description,
          whyThisProject,
          learningOutcomes,
          technologies,
          checklist
        })
      });

      if (res.ok) {
        await loadData();
        setModalOpen(false);
        setTitle('');
        setDescription('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="py-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Project Blueprints Catalog</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Production-style portfolio recommendations with architecture checklists.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Project Template</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading projects...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((p) => (
            <div key={p.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-base font-bold text-white tracking-tight">{p.title}</h3>
                  <span className="text-[10px] uppercase font-bold text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                    {p.difficulty}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mt-2">{p.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.technologies?.map(t => (
                    <span key={t} className="text-[10px] text-slate-300 bg-slate-800 px-2 py-0.5 rounded font-mono">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white">Create Project Template</h2>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Career Track</label>
                <select
                  value={careerId}
                  onChange={(e) => setCareerId(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                >
                  {careers.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Distributed Task Queue Dashboard"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Technologies (CSV)</label>
                  <input
                    type="text"
                    required
                    value={techStr}
                    onChange={(e) => setTechStr(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Checklist Items (Comma-separated)</label>
                <input
                  type="text"
                  required
                  value={checklistStr}
                  onChange={(e) => setChecklistStr(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md shadow-blue-500/20"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
