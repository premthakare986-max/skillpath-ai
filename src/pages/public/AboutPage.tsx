import React from 'react';
import { Shield, Target, Compass, Award, ArrowRight } from 'lucide-react';

interface AboutPageProps {
  onNavigate: (path: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="py-16 md:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Our Mission & Ethics</span>
        <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          About SkillPath AI
        </h1>
        <p className="mt-4 text-sm text-slate-300 leading-relaxed max-w-2xl mx-auto">
          SkillPath AI was conceived around a single core insight: Computer Science education is saturated with static checklists and generic chatbots that offer zero accountability.
        </p>
      </div>

      <div className="space-y-8 text-sm text-slate-300 leading-relaxed">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8">
          <h2 className="text-xl font-bold text-white mb-3">The Problem With Traditional Career Advice</h2>
          <p>
            Students are constantly told to "learn everything" — from 10 different front-end frameworks to complex distributed systems — without an understanding of prerequisites or current proficiency. Roadmaps on the internet are typically static PDFs or GitHub markdown files that do not adjust as the student progresses.
          </p>
          <p className="mt-3">
            Generic AI chatbots exacerbate this by hallucinating false achievements, generating unrealistic 10-step plans in 3 seconds, or providing superficial advice with zero memory of the student’s actual code or assessment scores.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8">
          <h2 className="text-xl font-bold text-white mb-3">Our Core Principles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4">
              <h3 className="font-semibold text-white text-xs uppercase tracking-wider text-blue-400">1. Real Mathematical State</h3>
              <p className="mt-1 text-xs text-slate-300">
                Gaps are calculated with: Required Level - Current Estimated Skill = Gap. No random vanity percentages.
              </p>
            </div>
            <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4">
              <h3 className="font-semibold text-white text-xs uppercase tracking-wider text-emerald-400">2. Strict Prerequisite Graph</h3>
              <p className="mt-1 text-xs text-slate-300">
                We never encourage building a full-stack React app until foundational JavaScript, functions, and async concepts are proven.
              </p>
            </div>
            <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4">
              <h3 className="font-semibold text-white text-xs uppercase tracking-wider text-purple-400">3. Dynamic Recalculation</h3>
              <p className="mt-1 text-xs text-slate-300">
                Every task completion triggers an automated recalculation. The dashboard updates to answer: "What should I do right now?"
              </p>
            </div>
            <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4">
              <h3 className="font-semibold text-white text-xs uppercase tracking-wider text-amber-400">4. Transparent Analytical Scoring</h3>
              <p className="mt-1 text-xs text-slate-300">
                The Career Readiness Indicator is an analytical prototype. We never claim "guaranteed job placement".
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
        <button
          onClick={() => onNavigate('/signup')}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 transition-all cursor-pointer"
        >
          <span>Get Started With SkillPath AI</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
