import React, { useState } from 'react';
import { Compass, Lock, Mail, User, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { FadeIn, CardReveal, MotionButton } from '../../components/common/AnimatedWrappers.js';

interface SignupPageProps {
  onNavigate: (path: string) => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onNavigate }) => {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    const res = await register(email, password, fullName);
    setLoading(false);

    if (res.success) {
      onNavigate('/onboarding');
    } else {
      setError(res.error || 'Registration failed.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 sm:py-12 px-3 sm:px-6 lg:px-8 overflow-x-hidden">
      <FadeIn className="w-full max-w-md space-y-5 sm:space-y-6">
        
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 mb-4">
            <Compass className="h-6 w-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Create Your SkillPath Account</h1>
          <p className="mt-1 text-xs text-slate-400">Begin your step-by-step path to industry career readiness</p>
        </div>

        <CardReveal className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-8 shadow-xl backdrop-blur-sm">
          {error && (
            <div className="mb-4 rounded-xl bg-red-950/40 border border-red-800/60 p-3 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rohit Sharma"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-3.5 py-3 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Student Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@college.edu"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-3.5 py-3 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password (Min. 6 characters)</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-3.5 py-3 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none min-h-[44px]"
                />
              </div>
            </div>

            <div className="py-1">
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                <span>Next step: 10-step wizard to calibrate your skills and roadmap</span>
              </div>
            </div>

            <MotionButton
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 px-4 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 transition-all cursor-pointer min-h-[44px]"
            >
              <span>{loading ? 'Creating Account...' : 'Continue to Onboarding'}</span>
              <ArrowRight className="h-4 w-4" />
            </MotionButton>
          </form>
        </CardReveal>

        <p className="text-center text-xs text-slate-400">
          Already have an account?{' '}
          <button
            onClick={() => onNavigate('/login')}
            className="font-semibold text-blue-400 hover:text-blue-300 ml-1 min-h-[36px] inline-flex items-center cursor-pointer"
          >
            Log in here
          </button>
        </p>

      </FadeIn>
    </div>
  );
};

