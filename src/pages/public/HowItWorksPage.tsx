import React from 'react';
import { ArrowRight, CheckCircle2, GitBranch, Cpu, Target, Compass, Sparkles } from 'lucide-react';

interface HowItWorksPageProps {
  onNavigate: (path: string) => void;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ onNavigate }) => {
  const steps = [
    {
      num: '01',
      title: 'Profile & Academic Grounding',
      desc: 'You provide your academic context: university, degree, branch, current semester, CGPA, and career ambitions. We keep academic marks separate from practical coding proficiency.',
      detail: 'Includes your GitHub and LinkedIn profile handles for project evidence tracking.'
    },
    {
      num: '02',
      title: 'Deterministic Skill Gap Engine',
      desc: 'Unlike static roadmaps, SkillPath runs mathematical gap calculation: Required Proficiency - Current Estimated Skill = Gap. We evaluate prerequisite dependencies first.',
      detail: 'If React requires JavaScript, JavaScript is prioritized before advanced React.'
    },
    {
      num: '03',
      title: 'Multi-Phase Personalized Roadmap',
      desc: 'A structured, vertical milestone plan adapted to your weekly availability (e.g. 15 hours/week). Items are dynamically locked until prerequisites are satisfied.',
      detail: 'Each milestone includes verified official documentation, hands-on practice, and project goals.'
    },
    {
      num: '04',
      title: 'Verified Technical Assessments',
      desc: 'Test your knowledge with rigorous multiple-choice and practical challenges. The system calculates an objective weighted score combining self-rating with verified test results.',
      detail: 'No fake 100% scores; transparent and fair evaluation.'
    },
    {
      num: '05',
      title: 'Portfolio & Project Recommendations',
      desc: 'Build tier-appropriate real-world applications (Beginner, Intermediate, Advanced). Connect your GitHub repository and live deployment link for verified review.',
      detail: 'Provides architectural checklists: state management, input validation, and README guides.'
    },
    {
      num: '06',
      title: 'Automated Closed-Loop Recalculation',
      desc: 'The defining innovation of SkillPath AI. Whenever you take a quiz, submit a project, or complete a task, the platform recalculates your Next Best Action and Career Readiness.',
      detail: 'You always have an exact answer to: "What should I learn or build today?"'
    }
  ];

  return (
    <div className="py-16 md:py-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Step-by-Step Architecture</span>
        <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          How SkillPath AI Works
        </h1>
        <p className="mt-4 text-sm text-slate-300 leading-relaxed">
          A continuous engineering methodology designed to bridge the gap between theoretical classroom learning and production-ready industry capabilities.
        </p>
      </div>

      <div className="space-y-6">
        {steps.map((s) => (
          <div
            key={s.num}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start hover:border-slate-700 transition-all"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-950 text-blue-400 border border-blue-800/60 font-mono font-bold text-lg">
              {s.num}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white tracking-tight">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">{s.desc}</p>
              <div className="mt-3 inline-flex items-center gap-2 text-xs text-blue-400 bg-blue-950/40 px-3 py-1.5 rounded-lg border border-blue-900/40">
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                <span>{s.detail}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <button
          onClick={() => onNavigate('/signup')}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 transition-all cursor-pointer"
        >
          <span>Start Your Assessment & Build Roadmap</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
