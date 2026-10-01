import React from 'react';
import {
  Compass, ArrowRight, CheckCircle2, Sparkles, Target,
  Layers, GitBranch, Terminal, Shield, TrendingUp, Users, ArrowDown
} from 'lucide-react';
import {
  FadeIn, CardReveal, StaggerContainer, StaggerItem,
  MotionButton
} from '../../components/common/AnimatedWrappers.js';

interface HomePageProps {
  onNavigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const steps = [
    { title: 'Student Profile', desc: 'Degree, branch, semester & academic record' },
    { title: 'AI Profile Analysis', desc: 'Grounded assessment of existing foundations' },
    { title: 'Skill Gap Analysis', desc: 'Deterministic gap calculation against career targets' },
    { title: 'Skill Dependency Graph', desc: 'Prerequisite logic ensures solid learning order' },
    { title: 'Personalized Roadmap', desc: 'Tailored timeline adapted to your weekly availability' },
    { title: 'Learn & Practice', desc: 'Verified official documentation and practical challenges' },
    { title: 'Build Projects', desc: 'Real architecture projects with live deployment' },
    { title: 'GitHub & Portfolio', desc: 'Evidence-backed proof for recruiters and managers' },
    { title: 'Internship Matches', desc: 'Official company opportunities scored by skill fit' },
    { title: 'AI Re-Calculates', desc: 'Closed-loop adaptation as your progress evolves' },
  ];

  const careerTracks = [
    { title: 'Full Stack Developer', demand: 'Very High', skills: ['React', 'Node.js', 'SQL', 'REST APIs', 'Git'], tag: 'Most Popular' },
    { title: 'Software Engineer (Backend)', demand: 'High', skills: ['Distributed Systems', 'PostgreSQL', 'Docker', 'DSA'], tag: 'Core CS' },
    { title: 'AI / Machine Learning Engineer', demand: 'Exceptional', skills: ['Python', 'Neural Networks', 'Model Evaluation', 'SQL'], tag: 'Emerging' },
    { title: 'Cloud & DevOps Engineer', demand: 'Very High', skills: ['Docker', 'CI/CD Pipelines', 'Linux', 'Cloud Architecture'], tag: 'Infrastructure' },
  ];

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-20 sm:pb-24 md:pt-28 md:pb-32">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 sm:h-96 w-80 sm:w-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-5xl px-3 sm:px-6 lg:px-8 text-center relative z-10">
          <FadeIn delay={0.05} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-950/40 text-blue-400 text-xs font-semibold mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Closed-Loop Student Career Intelligence</span>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Your Personalized Path From <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-200 bg-clip-text text-transparent">
                Student to Career Ready
              </span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.15}>
            <p className="mt-5 sm:mt-6 text-sm sm:text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
              AI-powered career guidance that analyzes your current skills, identifies gaps, builds your personalized roadmap, recommends what to learn and build next, and helps you track your progress.
            </p>
          </FadeIn>

          <FadeIn delay={0.2} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-md sm:max-w-none mx-auto">
            <MotionButton
              onClick={() => onNavigate('/signup')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-xs sm:text-sm font-semibold text-white shadow-xl shadow-blue-500/25 hover:from-blue-500 hover:to-indigo-500 transition-all cursor-pointer min-h-[44px]"
            >
              <span>Build My Career Roadmap</span>
              <ArrowRight className="h-4 w-4" />
            </MotionButton>
            <MotionButton
              onClick={() => onNavigate('/how-it-works')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-6 py-3.5 text-xs sm:text-sm font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-all cursor-pointer min-h-[44px]"
            >
              <span>See How It Works</span>
            </MotionButton>
          </FadeIn>

          <FadeIn delay={0.25} className="mt-10 sm:mt-12 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Deterministic skill gaps</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Real verified resources</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Zero fake metrics</span>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* The Core Product Flow (Visual Representation) */}
      <section className="py-16 sm:py-20 border-y border-slate-800/80 bg-slate-950/60">
        <div className="mx-auto max-w-6xl px-3 sm:px-6 lg:px-8">
          <FadeIn className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Continuous Closed-Loop</span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-white">How SkillPath AI Operates</h2>
            <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed">
              SkillPath AI continuously understands where you are, where you want to go, what skills are missing, what should be learned next, what should be built, and when you should start applying.
            </p>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {steps.map((step, idx) => (
              <StaggerItem
                key={step.title}
                className="relative rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition-all hover:border-slate-700 hover:bg-slate-900 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-950 text-blue-400 border border-blue-800/50 text-xs font-bold font-mono">
                    {idx + 1}
                  </span>
                  {idx < steps.length - 1 && (
                    <span className="text-slate-600 text-xs hidden lg:inline">→</span>
                  )}
                </div>
                <h3 className="text-xs font-bold text-white tracking-tight">{step.title}</h3>
                <p className="mt-1 text-[11px] text-slate-400 leading-snug">{step.desc}</p>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <CardReveal className="mt-8 rounded-2xl border border-blue-900/40 bg-gradient-to-r from-blue-950/30 to-indigo-950/30 p-5 sm:p-6 text-center">
            <p className="text-xs sm:text-sm font-medium text-slate-200">
              <span className="font-bold text-blue-400">The Core Innovation:</span> Every completed assessment, skill update, or project immediately triggers the <span className="text-white underline decoration-blue-500">Recalculation Engine</span> to update your Next Best Action.
            </p>
          </CardReveal>
        </div>
      </section>

      {/* Career Tracks Preview */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-3 sm:px-6 lg:px-8">
          <FadeIn className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Industry Aligned</span>
              <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-white">Curated Engineering Tracks</h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-400">Pre-configured with complete skill dependency graphs and verified project milestones.</p>
            </div>
            <MotionButton
              onClick={() => onNavigate('/careers')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 self-start cursor-pointer py-1"
            >
              <span>Explore all career tracks</span>
              <ArrowRight className="h-4 w-4" />
            </MotionButton>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {careerTracks.map((c, idx) => (
              <CardReveal
                key={c.title}
                delay={idx * 0.08}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 hover:border-slate-700 transition-all backdrop-blur-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">{c.title}</h3>
                    <span className="text-xs text-slate-400 mt-0.5 block">Market Demand: <span className="text-emerald-400 font-medium">{c.demand}</span></span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40 flex-shrink-0">
                    {c.tag}
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/60 flex flex-wrap gap-1.5 sm:gap-2">
                  {c.skills.map((s) => (
                    <span key={s} className="text-[11px] sm:text-xs text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-lg">
                      {s}
                    </span>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-between gap-2">
                  <span className="text-[11px] sm:text-xs text-slate-500">Includes DSA Track & Projects</span>
                  <MotionButton
                    onClick={() => onNavigate('/signup')}
                    className="text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 px-3.5 py-2 rounded-lg transition-colors cursor-pointer min-h-[38px]"
                  >
                    Select Track
                  </MotionButton>
                </div>
              </CardReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="py-16 sm:py-20 border-t border-slate-800/80 bg-slate-950">
        <div className="mx-auto max-w-4xl px-3 sm:px-6 lg:px-8 text-center">
          <CardReveal className="rounded-3xl border border-blue-500/20 bg-gradient-to-b from-blue-950/40 to-slate-900 p-6 sm:p-12 shadow-2xl">
            <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-white">
              Ready to take control of your engineering career?
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              Stop guessing what to learn next. Get your personalized roadmap, take real skill assessments, and unlock verified internship opportunities.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md sm:max-w-none mx-auto">
              <MotionButton
                onClick={() => onNavigate('/signup')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 transition-all cursor-pointer min-h-[44px]"
              >
                Get Started for Free
              </MotionButton>
              <MotionButton
                onClick={() => onNavigate('/login')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-700 bg-slate-800 text-xs sm:text-sm font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all cursor-pointer min-h-[44px]"
              >
                Log In to Account
              </MotionButton>
            </div>
          </CardReveal>
        </div>
      </section>
    </div>
  );
};

