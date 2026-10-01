import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Compass, ArrowRight, CheckCircle2, Clock, Target, AlertCircle,
  Sparkles, RefreshCw, BarChart3, BookOpen, FolderGit2, Briefcase,
  ChevronRight, ExternalLink, Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useNotifications } from '../../context/NotificationContext.js';
import {
  FadeIn, CardReveal, StaggerContainer, StaggerItem,
  AnimatedProgressBar, MotionButton
} from '../../components/common/AnimatedWrappers.js';
import {
  NextBestAction, ReadinessBreakdown, SkillGapItem, RoadmapPhase,
  Opportunity, Project, Profile
} from '../../types.js';

interface DashboardPageProps {
  onNavigate: (path: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { showCelebration } = useNotifications();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [nextAction, setNextAction] = useState<NextBestAction | null>(null);
  const [readiness, setReadiness] = useState<ReadinessBreakdown | null>(null);
  const [gaps, setGaps] = useState<SkillGapItem[]>([]);
  const [phases, setPhases] = useState<RoadmapPhase[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [recommendedProject, setRecommendedProject] = useState<Project | null>(null);
  const [recalculating, setRecalculating] = useState(false);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('skillpath_token')}`
  });

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [profileRes, nextRes, readRes, gapRes, roadRes, oppRes, projRes] = await Promise.all([
        fetch('/api/profile', { headers: getHeaders() }),
        fetch('/api/student/next-action', { headers: getHeaders() }),
        fetch('/api/student/readiness', { headers: getHeaders() }),
        fetch('/api/student/gaps', { headers: getHeaders() }),
        fetch('/api/student/roadmap', { headers: getHeaders() }),
        fetch('/api/opportunities', { headers: getHeaders() }),
        fetch('/api/projects', { headers: getHeaders() })
      ]);

      if (profileRes.ok) {
        const d = await profileRes.json();
        setProfile(d.profile);
      }
      if (nextRes.ok) {
        const d = await nextRes.json();
        setNextAction(d.nextAction);
      }
      if (readRes.ok) {
        const d = await readRes.json();
        setReadiness(d.readiness);
      }
      if (gapRes.ok) {
        const d = await gapRes.json();
        setGaps(d.gaps || []);
      }
      if (roadRes.ok) {
        const d = await roadRes.json();
        setPhases(d.phases || []);
      }
      if (oppRes.ok) {
        const d = await oppRes.json();
        setOpportunities(d.opportunities?.slice(0, 3) || []);
      }
      if (projRes.ok) {
        const d = await projRes.json();
        setRecommendedProject(d.projects?.[0] || null);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const res = await fetch('/api/student/roadmap/recalculate', {
        method: 'POST',
        headers: getHeaders()
      });
      if (res.ok) {
        await loadDashboardData();
        showCelebration('State Synchronized', 'All skill gaps, roadmap phases, and actions have been recalculated.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRecalculating(false);
    }
  };

  // Metric computations
  const totalRoadmapItems = phases.reduce((acc, p) => acc + p.totalCount, 0);
  const completedRoadmapItems = phases.reduce((acc, p) => acc + p.completedCount, 0);
  const roadmapProgressPct = totalRoadmapItems > 0 ? Math.round((completedRoadmapItems / totalRoadmapItems) * 100) : 0;
  const completedSkillsCount = gaps.filter(g => g.currentProficiency >= 70).length;

  const currentPhase = phases.find(p => p.items.some(i => i.status === 'in_progress' || i.status === 'available')) || phases[0];

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading your career command center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 overflow-x-hidden">
      
      {/* Top Greeting & Header */}
      <FadeIn className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white">
              Good day, {profile?.full_name || user?.fullName || 'Student'}
            </h1>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Target Career Track: <span className="text-blue-400 font-semibold">{profile?.career_title || 'Full Stack Developer'}</span>
            {profile?.college && <span className="hidden sm:inline"> · {profile.college}</span>}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <MotionButton
            onClick={handleRecalculate}
            disabled={recalculating}
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer min-h-[44px]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${recalculating ? 'animate-spin text-blue-400' : ''}`} />
            <span>{recalculating ? 'Recalculating...' : 'Recalculate State'}</span>
          </MotionButton>
          <MotionButton
            onClick={() => onNavigate('/roadmap')}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-500 transition-all cursor-pointer min-h-[44px]"
          >
            <span>Open Roadmap</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </MotionButton>
        </div>
      </FadeIn>

      {/* Prototype Career Readiness Banner Card */}
      {readiness && (
        <CardReveal className="rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 p-4 sm:p-6 shadow-xl backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
            <div className="flex items-start gap-3.5 sm:gap-4">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex h-14 w-14 sm:h-16 sm:w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-inner"
              >
                <span className="text-xl sm:text-2xl font-extrabold font-mono">{readiness.overallScore}%</span>
              </motion.div>
              <div>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-blue-400">
                    Analytical Evaluation
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-[11px] sm:text-xs font-medium text-slate-300">{readiness.label}</span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
                  Career Readiness Indicator
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  {readiness.disclaimer}
                </p>
              </div>
            </div>

            {/* Component breakdown pill row - responsive grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs w-full lg:w-auto">
              <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-2">
                <span className="text-slate-500 block text-[10px]">Skills (30%)</span>
                <span className="font-mono font-bold text-slate-200">{readiness.components.skills.score}%</span>
              </div>
              <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-2">
                <span className="text-slate-500 block text-[10px]">Quizzes (20%)</span>
                <span className="font-mono font-bold text-slate-200">{readiness.components.assessments.score}%</span>
              </div>
              <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-2">
                <span className="text-slate-500 block text-[10px]">Projects (20%)</span>
                <span className="font-mono font-bold text-slate-200">{readiness.components.projects.score}%</span>
              </div>
              <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-2">
                <span className="text-slate-500 block text-[10px]">DSA (15%)</span>
                <span className="font-mono font-bold text-slate-200">{readiness.components.dsa.score}%</span>
              </div>
              <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-2 col-span-2 sm:col-span-1">
                <span className="text-slate-500 block text-[10px]">Profile (15%)</span>
                <span className="font-mono font-bold text-slate-200">{readiness.components.profile.score}%</span>
              </div>
            </div>
          </div>
        </CardReveal>
      )}

      {/* Prominent NEXT BEST ACTION Card with subtle glowing pulse border */}
      {nextAction && (
        <CardReveal className="rounded-2xl border border-indigo-500/50 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 p-5 sm:p-7 shadow-xl animate-pulse-glow">
          <div className="flex flex-wrap items-center justify-between pb-3 border-b border-indigo-900/40 mb-4 gap-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                Next Best Action
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-indigo-950/50 px-2.5 py-1 rounded-lg border border-indigo-800/40">
              <Clock className="h-3.5 w-3.5 text-indigo-400" />
              <span>Est. {nextAction.estimatedMinutes} minutes</span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
            <div className="space-y-2 max-w-2xl">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight">
                {nextAction.actionTitle}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                <span className="font-semibold text-blue-400">Why now: </span>
                {nextAction.whyExplanation}
              </p>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 sm:gap-4 text-xs text-slate-400">
                <div>
                  <span className="font-medium text-slate-300 block">After this:</span>
                  <span className="text-slate-400">{nextAction.stepAfter}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-300 block">Then:</span>
                  <span className="text-slate-400">{nextAction.stepThen}</span>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 w-full sm:w-auto">
              <MotionButton
                onClick={() => onNavigate(nextAction.ctaLink)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-xs font-bold text-white shadow-xl shadow-blue-500/25 hover:from-blue-500 hover:to-indigo-500 transition-all cursor-pointer min-h-[44px]"
              >
                <span>{nextAction.ctaText}</span>
                <ArrowRight className="h-4 w-4" />
              </MotionButton>
            </div>
          </div>
        </CardReveal>
      )}

      {/* KPI Metric Cards Grid - Staggered entrance */}
      <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
        <StaggerItem>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 sm:p-4 hover:border-slate-700 transition-all">
            <span className="text-[11px] font-medium text-slate-400">Roadmap Progress</span>
            <p className="text-lg sm:text-xl font-bold text-white mt-1 font-mono">{roadmapProgressPct}%</p>
            <span className="text-[10px] text-slate-500 mt-1 block truncate">{completedRoadmapItems} of {totalRoadmapItems} items</span>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 sm:p-4 hover:border-slate-700 transition-all">
            <span className="text-[11px] font-medium text-slate-400">Skills Verified</span>
            <p className="text-lg sm:text-xl font-bold text-white mt-1 font-mono">{completedSkillsCount}</p>
            <span className="text-[10px] text-slate-500 mt-1 block truncate">{gaps.length} career targets</span>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 sm:p-4 hover:border-slate-700 transition-all">
            <span className="text-[11px] font-medium text-slate-400">Projects Built</span>
            <p className="text-lg sm:text-xl font-bold text-white mt-1 font-mono">1 / 4</p>
            <span className="text-[10px] text-slate-500 mt-1 block truncate">1 with live repo</span>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 sm:p-4 hover:border-slate-700 transition-all">
            <span className="text-[11px] font-medium text-slate-400">Applications Tracked</span>
            <p className="text-lg sm:text-xl font-bold text-white mt-1 font-mono">2</p>
            <span className="text-[10px] text-slate-500 mt-1 block truncate">1 active, 1 saved</span>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 sm:p-4 hover:border-slate-700 transition-all">
            <span className="text-[11px] font-medium text-slate-400">DSA Topics</span>
            <p className="text-lg sm:text-xl font-bold text-white mt-1 font-mono">25%</p>
            <span className="text-[10px] text-slate-500 mt-1 block truncate">Arrays & Strings</span>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 sm:p-4 hover:border-slate-700 transition-all">
            <span className="text-[11px] font-medium text-slate-400">Profile Ready</span>
            <p className="text-lg sm:text-xl font-bold text-emerald-400 mt-1 font-mono">90%</p>
            <span className="text-[10px] text-slate-500 mt-1 block truncate">GitHub & LinkedIn</span>
          </div>
        </StaggerItem>
      </StaggerContainer>

      {/* Main Grid: Skill Gaps + Current Roadmap Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* Left Column (2 Cols): Skill Gaps & Current Roadmap Phase */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Skill Gap Section */}
          <CardReveal className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">Active Skill Gaps</h3>
                <p className="text-[11px] sm:text-xs text-slate-400">Calculated gap = Required Level - Current Estimated Level</p>
              </div>
              <button
                onClick={() => onNavigate('/skills')}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors min-h-[44px]"
              >
                <span>View Full Matrix</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {gaps.filter(g => g.gap > 0).slice(0, 4).map((g) => (
                <div key={g.skillId} className="rounded-xl bg-slate-950/60 border border-slate-800 p-3.5 hover:border-slate-700 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white">{g.skillName}</span>
                      <span className="text-[10px] text-slate-500 font-mono ml-2">({g.category})</span>
                    </div>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                      g.priority === 'High'
                        ? 'text-red-400 bg-red-950/60 border-red-800/40'
                        : 'text-amber-400 bg-amber-950/60 border-amber-800/40'
                    }`}>
                      {g.priority} Priority
                    </span>
                  </div>

                  {/* Dual bar representation: Current vs Required */}
                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Current: <strong className="text-slate-200">{g.currentProficiency}%</strong></span>
                      <span>Target: <strong className="text-slate-200">{g.requiredProficiency}%</strong></span>
                      <span>Gap: <strong className="text-blue-400">{g.gap}%</strong></span>
                    </div>

                    <AnimatedProgressBar progress={g.currentProficiency} />
                  </div>

                  {!g.prerequisitesMet && (
                    <div className="mt-2 text-[11px] text-amber-400 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>Prerequisite needed: {g.missingPrerequisites.join(', ')}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardReveal>

          {/* Current Roadmap Phase Summary */}
          {currentPhase && (
            <CardReveal className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 backdrop-blur-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">Active Track</span>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight mt-0.5">{currentPhase.phaseTitle}</h3>
                </div>
                <button
                  onClick={() => onNavigate('/roadmap')}
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors min-h-[44px]"
                >
                  <span>Interactive Map</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-2.5">
                {currentPhase.items.slice(0, 4).map((it) => (
                  <div
                    key={it.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                        it.status === 'completed'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                          : it.status === 'in_progress'
                          ? 'bg-blue-950 text-blue-400 border border-blue-800/60'
                          : 'bg-slate-900 text-slate-500'
                      }`}>
                        {it.status === 'completed' ? '✓' : '→'}
                      </div>
                      <div>
                        <span className={`text-xs font-semibold ${it.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {it.title}
                        </span>
                        <span className="text-[10px] text-slate-500 block">Est. {it.estimatedHours} hrs</span>
                      </div>
                    </div>

                    <span className="text-[10px] uppercase font-mono text-slate-400">
                      {it.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </CardReveal>
          )}

        </div>

        {/* Right Column (1 Col): Recommended Project & Internship Matches */}
        <div className="space-y-6">
          
          {/* Recommended Project Card */}
          {recommendedProject && (
            <CardReveal className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                  <FolderGit2 className="h-3.5 w-3.5" />
                  <span>Next Recommended Project</span>
                </span>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  {recommendedProject.difficulty}
                </span>
              </div>

              <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">{recommendedProject.title}</h4>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed line-clamp-3">
                {recommendedProject.why_this_project}
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {recommendedProject.technologies?.slice(0, 3).map((t) => (
                  <span key={t} className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {t}
                  </span>
                ))}
              </div>

              <MotionButton
                onClick={() => onNavigate(`/projects?id=${recommendedProject.id}`)}
                className="mt-5 w-full flex items-center justify-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-950/20 py-2.5 text-xs font-semibold text-purple-300 hover:bg-purple-950/40 transition-colors min-h-[44px]"
              >
                <span>View Specifications & Tasks</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </MotionButton>
            </CardReveal>
          )}

          {/* Matched Internship Openings */}
          <CardReveal className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight">Matched Opportunities</h4>
                <p className="text-[11px] text-slate-400">Scored strictly by your verified skills</p>
              </div>
              <button
                onClick={() => onNavigate('/opportunities')}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors min-h-[44px] flex items-center"
              >
                View all
              </button>
            </div>

            <div className="space-y-3">
              {opportunities.map((opp) => (
                <div key={opp.id} className="rounded-xl bg-slate-950/60 border border-slate-800 p-3 hover:border-slate-700 transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">{opp.role}</span>
                      <span className="text-[11px] text-slate-400">{opp.company} · {opp.location}</span>
                    </div>
                    <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                      {opp.matchScore}% Match
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
                    <span className="text-[10px] text-slate-500">Deadline: {opp.deadline}</span>
                    <a
                      href={opp.application_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 min-h-[36px]"
                    >
                      <span>Apply</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </CardReveal>

          {/* AI Career Mentor quick prompt */}
          <CardReveal className="rounded-2xl border border-indigo-900/40 bg-gradient-to-tr from-indigo-950/30 to-slate-900 p-4 sm:p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <Compass className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-bold text-indigo-300">AI Career Mentor Ready</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Have questions regarding your roadmap, technical quizzes, or project architecture?
            </p>
            <MotionButton
              onClick={() => onNavigate('/mentor')}
              className="mt-3 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors cursor-pointer min-h-[44px] flex items-center justify-center"
            >
              Ask AI Mentor
            </MotionButton>
          </CardReveal>

        </div>

      </div>

    </div>
  );
};
