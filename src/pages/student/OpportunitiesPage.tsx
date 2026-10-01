import React, { useState, useEffect } from 'react';
import {
  Briefcase, CheckCircle2, AlertCircle, ExternalLink, Bookmark,
  Send, Search, MapPin, Building, Calendar, ArrowRight
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext.js';
import { Opportunity } from '../../types.js';
import {
  FadeIn, CardReveal, MotionButton
} from '../../components/common/AnimatedWrappers.js';

interface OpportunitiesPageProps {
  onNavigate: (path: string) => void;
}

export const OpportunitiesPage: React.FC<OpportunitiesPageProps> = ({ onNavigate }) => {
  const { showCelebration } = useNotifications();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [workModeFilter, setWorkModeFilter] = useState('All');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('skillpath_token')}`,
    'Content-Type': 'application/json'
  });

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/opportunities', { headers: getHeaders() });
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
    loadOpportunities();
  }, []);

  const handleTrackApplication = async (opp: Opportunity, status: 'saved' | 'applied') => {
    setActionLoadingId(opp.id);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          opportunityId: opp.id,
          status,
          appliedDate: status === 'applied' ? new Date().toISOString().split('T')[0] : null
        })
      });

      if (res.ok) {
        await loadOpportunities();
        showCelebration(
          status === 'applied' ? 'Application Tracked!' : 'Opportunity Bookmarked',
          `Added to your Application Pipeline. You can track interview stages on your Applications tab.`
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filtered = opportunities.filter(o => {
    const matchesSearch = o.role.toLowerCase().includes(search.toLowerCase()) ||
      o.company.toLowerCase().includes(search.toLowerCase()) ||
      o.location.toLowerCase().includes(search.toLowerCase());
    const matchesMode = workModeFilter === 'All' || o.work_mode.toLowerCase() === workModeFilter.toLowerCase();
    return matchesSearch && matchesMode;
  });

  return (
    <div className="py-4 sm:py-8 max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 overflow-x-hidden">
      
      {/* Header */}
      <FadeIn className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white">Verified Internship Matches</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Real industry opportunities matched against your verified skills. Links redirect strictly to official company application portals.
          </p>
        </div>

        <MotionButton
          onClick={() => onNavigate('/applications')}
          className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-semibold text-white border border-slate-700 transition-colors self-start sm:self-auto cursor-pointer min-h-[44px]"
        >
          <Send className="h-3.5 w-3.5" />
          <span>My Applications Kanban</span>
        </MotionButton>
      </FadeIn>

      {/* Filter and Search Bar */}
      <FadeIn delay={0.05} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company, position, city..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none min-h-[44px]"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
          {['All', 'Remote', 'Hybrid', 'On-site'].map((m) => (
            <button
              key={m}
              onClick={() => setWorkModeFilter(m)}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium transition-colors min-h-[38px] ${
                workModeFilter === m ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </FadeIn>

      {/* Opportunities List */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Matching opportunities...</div>
      ) : filtered.length === 0 ? (
        <CardReveal className="py-16 sm:py-20 text-center rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8 backdrop-blur-sm">
          <Briefcase className="h-8 w-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">No opportunities match the criteria.</p>
          <p className="text-xs text-slate-500 mt-1">Try resetting the filters or check back as verified roles are added.</p>
        </CardReveal>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {filtered.map((opp, idx) => (
            <CardReveal
              key={opp.id}
              delay={idx * 0.05}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 flex flex-col justify-between hover:border-slate-700 transition-all backdrop-blur-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 truncate">
                      <Building className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{opp.company}</span>
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-tight mt-0.5 truncate">{opp.role}</h3>
                  </div>

                  <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded-lg border flex-shrink-0 ${
                    opp.matchScore >= 75
                      ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40'
                      : 'text-blue-400 bg-blue-950/60 border-blue-800/40'
                  }`}>
                    {opp.matchScore}% Match
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-400 mt-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{opp.location} ({opp.work_mode})</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>Deadline: {opp.deadline}</span>
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mt-3">{opp.description}</p>

                {/* Skills tags */}
                <div className="mt-4 space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 block">Required Competencies:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {opp.requiredSkills?.map((s) => {
                      const isMissing = opp.missingSkills?.includes(s);
                      return (
                        <span
                          key={s}
                          className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                            isMissing
                              ? 'text-amber-300 bg-amber-950/50 border border-amber-800/50'
                              : 'text-emerald-300 bg-emerald-950/50 border border-emerald-800/50'
                          }`}
                        >
                          {isMissing ? '✕ ' : '✓ '}{s}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {opp.missingSkills?.length > 0 && (
                  <p className="mt-2 text-[11px] text-amber-400/90 leading-tight">
                    Strengthen {opp.missingSkills.join(', ')} to boost your match rating.
                  </p>
                )}
              </div>

              {/* Action Buttons - responsive flex-col on small mobile, row on tablet/desktop */}
              <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 text-xs">
                <div className="flex items-center gap-2">
                  {opp.applicationStatus ? (
                    <span className="text-[11px] font-semibold uppercase font-mono text-blue-400 bg-blue-950/60 px-2.5 py-1.5 rounded-lg border border-blue-800/40">
                      Status: {opp.applicationStatus}
                    </span>
                  ) : (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <MotionButton
                        onClick={() => handleTrackApplication(opp, 'saved')}
                        disabled={actionLoadingId === opp.id}
                        className="flex-1 sm:flex-none px-3 py-2 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors flex items-center justify-center gap-1 min-h-[40px] cursor-pointer"
                      >
                        <Bookmark className="h-3.5 w-3.5" />
                        <span>Bookmark</span>
                      </MotionButton>
                      <MotionButton
                        onClick={() => handleTrackApplication(opp, 'applied')}
                        disabled={actionLoadingId === opp.id}
                        className="flex-1 sm:flex-none px-3 py-2 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors min-h-[40px] cursor-pointer"
                      >
                        Track Applied
                      </MotionButton>
                    </div>
                  )}
                </div>

                <a
                  href={opp.application_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white shadow-sm shadow-blue-500/20 transition-all cursor-pointer min-h-[40px]"
                >
                  <span>Apply on Official Portal</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </CardReveal>
          ))}
        </div>
      )}
    </div>
  );
};

