import React from 'react';
import { Compass, Shield, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 py-12 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Compass className="h-4 w-4" />
              </div>
              <span className="text-base font-bold tracking-tight text-white">SkillPath AI</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your personalized path to career readiness. Continuous skill-gap analysis, dynamic roadmap calculation, and authentic milestone tracking.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Platform Flow</h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => onNavigate('/how-it-works')} className="hover:text-white transition-colors">How It Works</button></li>
              <li><button onClick={() => onNavigate('/features')} className="hover:text-white transition-colors">Analytical Engine</button></li>
              <li><button onClick={() => onNavigate('/careers')} className="hover:text-white transition-colors">Career Tracks</button></li>
              <li><button onClick={() => onNavigate('/about')} className="hover:text-white transition-colors">Methodology & Ethics</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Student Hub</h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => onNavigate('/login')} className="hover:text-white transition-colors">Student Log In</button></li>
              <li><button onClick={() => onNavigate('/signup')} className="hover:text-white transition-colors">Generate Roadmap</button></li>
              <li><button onClick={() => onNavigate('/privacy')} className="hover:text-white transition-colors">Privacy & Data Center</button></li>
              <li><button onClick={() => onNavigate('/contact')} className="hover:text-white transition-colors">Help & Contact</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Data Integrity & Privacy</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              SkillPath AI uses deterministic skill graphs and verified student records. We never invent fake jobs, random scores, or phantom credentials.
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400">
              <Shield className="h-4 w-4" />
              <span>Full Student Data Ownership</span>
            </div>
          </div>

        </div>

        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} SkillPath AI. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <button onClick={() => onNavigate('/privacy')} className="hover:text-white transition-colors">Privacy Policy</button>
            <button onClick={() => onNavigate('/about')} className="hover:text-white transition-colors">Terms of Service</button>
            <button onClick={() => onNavigate('/contact')} className="hover:text-white transition-colors">Support</button>
          </div>
        </div>
      </div>
    </footer>
  );
};
