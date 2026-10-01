import React from 'react';
import {
  Target, RefreshCw, Compass, BarChart3, BookOpen,
  FolderGit2, Briefcase, Bot, Shield, CheckCircle2, ArrowRight
} from 'lucide-react';

interface FeaturesPageProps {
  onNavigate: (path: string) => void;
}

export const FeaturesPage: React.FC<FeaturesPageProps> = ({ onNavigate }) => {
  const features = [
    {
      icon: Target,
      title: 'Deterministic Skill-Gap Engine',
      desc: 'Calculates exact numerical skill deficits: Required Level - Current Proficiency = Gap. Incorporates prerequisite trees so you build a solid foundation before tackling advanced frameworks.'
    },
    {
      icon: RefreshCw,
      title: 'Closed-Loop Dynamic Recalculation',
      desc: 'Your roadmap is alive. Complete a skill assessment, submit a project repo, or track an application, and the platform recalculates your priorities instantly.'
    },
    {
      icon: Compass,
      title: 'Single Next Best Action',
      desc: 'No decision paralysis. Your dashboard answers: "What should I do right now?" with estimated duration, the technical reason why, and the steps that follow.'
    },
    {
      icon: BarChart3,
      title: 'Transparent Career Readiness Indicator',
      desc: 'An analytical score (0-100%) computed from skills mastery (30%), assessments (20%), projects (20%), DSA problems (15%), and profile completeness (15%). No fake guarantees.'
    },
    {
      icon: BookOpen,
      title: 'Curated Verified Resources',
      desc: 'Only genuine official documentation and high-quality open educational resources (MDN, react.dev, nodejs.org, postgresql.org). Zero broken links or fake video URLs.'
    },
    {
      icon: FolderGit2,
      title: 'Production Project Blueprinting',
      desc: 'Recommended projects mapped to your career track with architectural checklists: authentication flows, database schema normalization, and GitHub repository guidelines.'
    },
    {
      icon: Briefcase,
      title: 'Verified Opportunity Matching',
      desc: 'Real company internship postings scored with transparent skill match percentages (e.g. 85% Match) based strictly on your stored proficiency.'
    },
    {
      icon: Bot,
      title: 'Context-Aware AI Career Mentor',
      desc: 'Powered by Gemini using only your authorized SkillPath data. Ask "Why is React my priority?" or "What should I build next?" and receive answers grounded in your real progress.'
    },
    {
      icon: Shield,
      title: 'Privacy Center & Data Sovereignty',
      desc: 'Export your complete student records as JSON, disconnect third-party links anytime, and exercise full control over your academic data.'
    }
  ];

  return (
    <div className="py-16 md:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Engineering Capabilities</span>
        <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Built for Serious Engineering Progression
        </h1>
        <p className="mt-4 text-sm text-slate-300 leading-relaxed">
          Every capability in SkillPath AI is purpose-built to deliver deterministic, verified guidance without cosmetic fluff.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between hover:border-slate-700 transition-all"
            >
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-950/80 text-blue-400 border border-blue-800/50 mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">{f.title}</h3>
                <p className="mt-2 text-xs text-slate-300 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-16 rounded-2xl border border-blue-900/40 bg-gradient-to-r from-blue-950/40 to-indigo-950/40 p-8 text-center">
        <h3 className="text-lg font-bold text-white">Experience the platform with Rohit's sample profile</h3>
        <p className="mt-2 text-xs text-slate-300 max-w-xl mx-auto">
          Want to inspect the dashboard, skill gaps, and roadmap recalculation without filling out onboarding? You can log in with our pre-configured demo student account in one click.
        </p>
        <button
          onClick={() => onNavigate('/login')}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors cursor-pointer"
        >
          <span>Go to Log In & Try Demo</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
