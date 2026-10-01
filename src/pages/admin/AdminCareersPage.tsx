import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Edit2, Trash2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Career } from '../../types.js';

interface AdminCareersPageProps {
  onNavigate: (path: string) => void;
}

export const AdminCareersPage: React.FC<AdminCareersPageProps> = ({ onNavigate }) => {
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Software Engineering');
  const [marketDemand, setMarketDemand] = useState('High');
  const [avgSalary, setAvgSalary] = useState('$95,000 - $140,000 / yr');

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('skillpath_token')}`,
    'Content-Type': 'application/json'
  });

  const loadCareers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/careers');
      if (res.ok) {
        const d = await res.json();
        setCareers(d.careers || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCareers();
  }, []);

  const handleCreateCareer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/careers', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          title,
          slug: slug || title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          description,
          category,
          marketDemand,
          avgSalary
        })
      });

      if (res.ok) {
        await loadCareers();
        setModalOpen(false);
        setTitle('');
        setDescription('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this career track?')) return;
    try {
      await fetch(`/api/careers/${id}`, { method: 'DELETE', headers: getHeaders() });
      await loadCareers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="py-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Career Tracks Catalog</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Industry paths configured with skill requirement graphs and market expectations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/admin')}
            className="px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
          >
            Admin Overview
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Career Track</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading careers...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {careers.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between hover:border-slate-700 transition-all"
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-base font-bold text-white tracking-tight">{c.title}</h3>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    {c.market_demand}
                  </span>
                </div>

                <span className="text-xs text-slate-500 font-mono block mb-2">{c.category}</span>
                <p className="text-xs text-slate-300 leading-relaxed">{c.description}</p>
                <p className="text-xs text-blue-400 font-mono mt-3">{c.avg_salary}</p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono">{c.total_skills || 0} skills mapped</span>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="text-slate-500 hover:text-red-400 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Career Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white">Create New Career Track</h2>

            <form onSubmit={handleCreateCareer} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Career Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Cybersecurity Analyst"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Focuses on network security, intrusion detection..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Market Demand</label>
                  <select
                    value={marketDemand}
                    onChange={(e) => setMarketDemand(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Moderate">Moderate</option>
                    <option value="High">High</option>
                    <option value="Very High">Very High</option>
                    <option value="Exceptional">Exceptional</option>
                  </select>
                </div>
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
                  Create Track
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
