import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Trash2, ExternalLink, MapPin, Building } from 'lucide-react';
import { Opportunity } from '../../types.js';

interface AdminOpportunitiesPageProps {
  onNavigate: (path: string) => void;
}

export const AdminOpportunitiesPage: React.FC<AdminOpportunitiesPageProps> = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Remote');
  const [workMode, setWorkMode] = useState('Remote');
  const [deadline, setDeadline] = useState('2026-12-31');
  const [applicationUrl, setApplicationUrl] = useState('');
  const [skillsStr, setSkillsStr] = useState('HTML, CSS, JavaScript, React');

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('skillpath_token')}`,
    'Content-Type': 'application/json'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/opportunities');
      if (res.ok) {
        const d = await res.json();
        setOpportunities(d.opportunities || []);
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
    const requiredSkills = skillsStr.split(',').map(s => s.trim()).filter(Boolean);
    try {
      const res = await fetch('/api/opportunities', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          company,
          role,
          description,
          location,
          workMode,
          deadline,
          applicationUrl,
          requiredSkills
        })
      });

      if (res.ok) {
        await loadData();
        setModalOpen(false);
        setCompany('');
        setRole('');
        setApplicationUrl('');
      } else {
        alert('Failed to save opportunity.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      await fetch(`/api/opportunities/${id}`, { method: 'DELETE', headers: getHeaders() });
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Verified Internship Listings</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Administer active openings with official employer application portal URLs.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Post Internship</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading listings...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {opportunities.map((opp) => (
            <div key={opp.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                      <Building className="h-3.5 w-3.5" />
                      <span>{opp.company}</span>
                    </span>
                    <h3 className="text-base font-bold text-white tracking-tight mt-0.5">{opp.role}</h3>
                  </div>

                  <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    {opp.work_mode}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-1">Location: {opp.location} · Deadline: {opp.deadline}</p>
                <p className="text-xs text-slate-300 mt-3 leading-relaxed">{opp.description}</p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {opp.requiredSkills?.map((s) => (
                    <span key={s} className="text-[10px] text-slate-300 bg-slate-800 px-2 py-0.5 rounded font-mono">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <a
                  href={opp.application_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                >
                  <span>Official Link</span>
                  <ExternalLink className="h-3 w-3" />
                </a>

                <button
                  onClick={() => handleDelete(opp.id)}
                  className="text-slate-500 hover:text-red-400 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white">Create Internship Opportunity</h2>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Company</label>
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Razorpay"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Role Title</label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Frontend Intern"
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
                <label className="block text-xs font-medium text-slate-300 mb-1">Required Skills (Comma-separated)</label>
                <input
                  type="text"
                  required
                  value={skillsStr}
                  onChange={(e) => setSkillsStr(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Work Mode</label>
                  <select
                    value={workMode}
                    onChange={(e) => setWorkMode(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Deadline</label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Official Portal URL</label>
                <input
                  type="url"
                  required
                  value={applicationUrl}
                  onChange={(e) => setApplicationUrl(e.target.value)}
                  placeholder="https://company.com/careers"
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
                  Post Opportunity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
