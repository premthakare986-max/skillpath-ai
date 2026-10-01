import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, ExternalLink, Search } from 'lucide-react';
import { Resource, Skill } from '../../types.js';

interface AdminResourcesPageProps {
  onNavigate: (path: string) => void;
}

export const AdminResourcesPage: React.FC<AdminResourcesPageProps> = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Form
  const [skillId, setSkillId] = useState<number>(1);
  const [topic, setTopic] = useState('');
  const [title, setTitle] = useState('');
  const [resourceType, setResourceType] = useState<'Learn' | 'Practice' | 'Build'>('Learn');
  const [platform, setPlatform] = useState('MDN');
  const [url, setUrl] = useState('');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [durationMinutes, setDurationMinutes] = useState('60');

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('skillpath_token')}`,
    'Content-Type': 'application/json'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [resData, skillData] = await Promise.all([
        fetch('/api/resources'),
        fetch('/api/skills')
      ]);
      if (resData.ok) {
        const d = await resData.json();
        setResources(d.resources || []);
      }
      if (skillData.ok) {
        const sd = await skillData.json();
        setSkills(sd.skills || []);
        if (sd.skills?.[0]) setSkillId(sd.skills[0].id);
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
    try {
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          skillId,
          topic,
          title,
          resourceType,
          platform,
          url,
          difficulty,
          durationMinutes: parseInt(durationMinutes) || 60,
          isFree: 1
        })
      });

      if (res.ok) {
        await loadData();
        setModalOpen(false);
        setTitle('');
        setUrl('');
      } else {
        alert('Validation failed: A valid full URL is required.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this resource?')) return;
    try {
      await fetch(`/api/resources/${id}`, { method: 'DELETE', headers: getHeaders() });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = resources.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.platform.toLowerCase().includes(search.toLowerCase()) ||
    (r.skill_name && r.skill_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="py-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Verified Resource Directory</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Maintain curated official guides, tutorials, and challenges linked to skills.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Official Resource</span>
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter resources..."
          className="w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading resources...</div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase font-semibold text-slate-400">
                <tr>
                  <th className="py-3 px-4">Title & Topic</th>
                  <th className="py-3 px-4">Skill Mapped</th>
                  <th className="py-3 px-4">Platform & Type</th>
                  <th className="py-3 px-4">URL</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{r.title}</div>
                      <div className="text-[11px] text-slate-500">{r.topic}</div>
                    </td>
                    <td className="py-3.5 px-4 text-blue-400 font-mono">
                      {r.skill_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <div>{r.platform}</div>
                      <span className="text-[10px] text-slate-500 uppercase">{r.resource_type}</span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate font-mono text-[11px] text-slate-400">
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 flex items-center gap-1">
                        <span className="truncate">{r.url}</span>
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-slate-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white">Add Verified Resource</h2>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Mapped Skill</label>
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
                <label className="block text-xs font-medium text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Official Documentation: Describing the UI"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Topic</label>
                  <input
                    type="text"
                    required
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Core Principles"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Platform</label>
                  <input
                    type="text"
                    required
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    placeholder="MDN / react.dev"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Verified URL</label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://developer.mozilla.org/..."
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
                  Save Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
