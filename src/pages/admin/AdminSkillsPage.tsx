import React, { useState, useEffect } from 'react';
import { Award, Plus, Trash2, Edit2, Search, ArrowLeft } from 'lucide-react';
import { Skill } from '../../types.js';

interface AdminSkillsPageProps {
  onNavigate: (path: string) => void;
}

export const AdminSkillsPage: React.FC<AdminSkillsPageProps> = ({ onNavigate }) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Form
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Frontend');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [description, setDescription] = useState('');
  const [careerRelevance, setCareerRelevance] = useState('');

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('skillpath_token')}`,
    'Content-Type': 'application/json'
  });

  const loadSkills = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/skills');
      if (res.ok) {
        const d = await res.json();
        setSkills(d.skills || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSkills();
  }, []);

  const handleCreateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    try {
      const res = await fetch('/api/skills', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name,
          slug,
          category,
          difficulty,
          description,
          careerRelevance
        })
      });

      if (res.ok) {
        await loadSkills();
        setModalOpen(false);
        setName('');
        setDescription('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this skill?')) return;
    try {
      await fetch(`/api/skills/${id}`, { method: 'DELETE', headers: getHeaders() });
      await loadSkills();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = skills.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="py-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Skills Matrix Catalog</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Universal technical skills taxonomy with difficulty levels and category tagging.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/admin/dependencies')}
            className="px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
          >
            Dependencies Graph
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Skill</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter skills..."
          className="w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading skills...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <div key={s.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-bold text-white tracking-tight">{s.name}</h3>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {s.difficulty}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-blue-400 block mb-2">{s.category}</span>
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{s.description}</p>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500 font-mono">ID: {s.id}</span>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="text-slate-500 hover:text-red-400 p-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Skill Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white">Create Technical Skill</h2>

            <form onSubmit={handleCreateSkill} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Skill Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Next.js App Router"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Frontend">Frontend</option>
                    <option value="Backend">Backend</option>
                    <option value="Database">Database</option>
                    <option value="DevOps">DevOps</option>
                    <option value="Core CS">Core CS</option>
                    <option value="DSA">DSA</option>
                    <option value="AI/ML">AI/ML</option>
                  </select>
                </div>

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
                  Create Skill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
