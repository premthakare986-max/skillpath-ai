import React, { useState, useEffect } from 'react';
import { Network, Plus, Trash2, ArrowRight } from 'lucide-react';
import { Skill } from '../../types.js';

interface AdminDependenciesPageProps {
  onNavigate: (path: string) => void;
}

export const AdminDependenciesPage: React.FC<AdminDependenciesPageProps> = ({ onNavigate }) => {
  const [dependencies, setDependencies] = useState<any[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form
  const [skillId, setSkillId] = useState<number>(0);
  const [dependsOnSkillId, setDependsOnSkillId] = useState<number>(0);
  const [reason, setReason] = useState('');

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('skillpath_token')}`,
    'Content-Type': 'application/json'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [depRes, skillRes] = await Promise.all([
        fetch('/api/skill-dependencies'),
        fetch('/api/skills')
      ]);
      if (depRes.ok) {
        const d = await depRes.json();
        setDependencies(d.dependencies || []);
      }
      if (skillRes.ok) {
        const sd = await skillRes.json();
        setSkills(sd.skills || []);
        if (sd.skills?.length > 1) {
          setSkillId(sd.skills[0].id);
          setDependsOnSkillId(sd.skills[1].id);
        }
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
    if (!skillId || !dependsOnSkillId || skillId === dependsOnSkillId) {
      alert('A skill cannot depend on itself.');
      return;
    }
    try {
      const res = await fetch('/api/skill-dependencies', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ skillId, dependsOnSkillId, reason })
      });
      if (res.ok) {
        await loadData();
        setModalOpen(false);
        setReason('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/skill-dependencies/${id}`, { method: 'DELETE', headers: getHeaders() });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="py-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Skill Dependency Graph</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Rules governing roadmap lock/unlock conditions. Advanced skills stay locked until prerequisites are satisfied.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Dependency Rule</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading dependency graph...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dependencies.map((d) => (
            <div key={d.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-white bg-slate-800 px-2 py-1 rounded">{d.skill_name}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-blue-400" />
                    <span className="font-bold text-blue-300 bg-blue-950/60 px-2 py-1 rounded border border-blue-800/40">
                      requires {d.depends_on_name}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDelete(d.id)}
                    className="text-slate-500 hover:text-red-400 p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <p className="mt-2.5 text-xs text-slate-400 leading-relaxed">
                  Reason: {d.reason || 'Foundational prerequisite.'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white">Create Skill Prerequisite</h2>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Skill</label>
                <select
                  value={skillId}
                  onChange={(e) => setSkillId(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                >
                  {skills.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Depends On (Must Learn First)</label>
                <select
                  value={dependsOnSkillId}
                  onChange={(e) => setDependsOnSkillId(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                >
                  {skills.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Reason / Pedagogical Explanation</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Asynchronous promises are required before Express routing."
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
                  Save Dependency
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
