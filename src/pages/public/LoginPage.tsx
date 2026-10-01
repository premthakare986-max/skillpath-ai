import React, { useState } from 'react';
import { Compass, Lock, Mail, ArrowRight, Shield, AlertCircle, X, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { FadeIn, CardReveal, MotionButton } from '../../components/common/AnimatedWrappers.js';
import { isFirebaseConfigured, signInWithGoogleFromFirebase } from '../../lib/firebase.js';

interface LoginPageProps {
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  // Development sandbox modal when Firebase client keys are not yet configured in preview
  const [showSandboxGoogleModal, setShowSandboxGoogleModal] = useState(false);
  const [sandboxEmail, setSandboxEmail] = useState('');
  const [sandboxName, setSandboxName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success && res.user) {
      if (res.user.role === 'admin') {
        onNavigate('/admin');
      } else if (!res.user.onboardingCompleted) {
        onNavigate('/onboarding');
      } else {
        onNavigate('/dashboard');
      }
    } else {
      setError(res.error || 'Invalid credentials.');
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);

    if (isFirebaseConfigured()) {
      setGoogleLoading(true);
      try {
        const googleUser = await signInWithGoogleFromFirebase();
        const res = await loginWithGoogle(googleUser);
        setGoogleLoading(false);

        if (res.success && res.user) {
          if (res.user.role === 'admin') {
            onNavigate('/admin');
          } else if (!res.user.onboardingCompleted) {
            onNavigate('/onboarding');
          } else {
            onNavigate('/dashboard');
          }
        } else {
          setError(res.error || 'Google login failed.');
        }
      } catch (err: any) {
        setGoogleLoading(false);
        setError(err.message || 'Google authentication encountered an issue.');
      }
      return;
    }

    // If Firebase client variables are not present in preview, open Google Sign-In prompt
    setShowSandboxGoogleModal(true);
  };

  const handleSandboxGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sandboxEmail.trim()) return;
    setGoogleLoading(true);

    // Generate unique Firebase-style UID for this Google account
    const uid = 'firebase-google-' + btoa(sandboxEmail.toLowerCase().trim()).replace(/=/g, '');
    const res = await loginWithGoogle({
      uid,
      email: sandboxEmail.toLowerCase().trim(),
      displayName: sandboxName.trim() || sandboxEmail.split('@')[0],
      photoURL: null
    });

    setGoogleLoading(false);
    setShowSandboxGoogleModal(false);

    if (res.success && res.user) {
      if (res.user.role === 'admin') {
        onNavigate('/admin');
      } else if (!res.user.onboardingCompleted) {
        onNavigate('/onboarding');
      } else {
        onNavigate('/dashboard');
      }
    } else {
      setError(res.error || 'Google login failed.');
    }
  };

  const handleDemoStudentLogin = async () => {
    setEmail('rohit.student@skillpath.edu');
    setPassword('rohit@demo');
    setError(null);
    setLoading(true);
    const res = await login('rohit.student@skillpath.edu', 'rohit@demo');
    setLoading(false);
    if (res.success) {
      onNavigate('/dashboard');
    } else {
      setError(res.error || 'Demo login failed.');
    }
  };

  const handleAdminQuickFill = () => {
    setEmail('premthakare986@gmail.com');
    setPassword('');
    setError(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 sm:py-12 px-3 sm:px-6 lg:px-8 overflow-x-hidden">
      <FadeIn className="w-full max-w-md space-y-5 sm:space-y-6">
        
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 mb-4">
            <Compass className="h-6 w-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Log in to SkillPath AI</h1>
          <p className="mt-1 text-xs text-slate-400">Access your personalized roadmap and career command center</p>
        </div>

        <CardReveal className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-8 shadow-xl backdrop-blur-sm">
          {error && (
            <div className="mb-4 rounded-xl bg-red-950/40 border border-red-800/60 p-3 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {forgotSent && (
            <div className="mb-4 rounded-xl bg-blue-950/40 border border-blue-800/60 p-3 text-xs text-blue-300 flex items-center gap-2">
              <Shield className="h-4 w-4 flex-shrink-0 text-blue-400" />
              <span>Password recovery instructions simulated for development environment.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={() => setForgotSent(true)}
                  className="text-[11px] text-blue-400 hover:text-blue-300 min-h-[30px] flex items-center cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-3.5 py-3 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none min-h-[44px]"
                />
              </div>
            </div>

            <MotionButton
              type="submit"
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 px-4 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 transition-all cursor-pointer min-h-[44px]"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="h-4 w-4" />
            </MotionButton>

            {/* Google Authentication Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-slate-700/80 bg-slate-950/80 hover:bg-slate-800/80 py-3 px-4 text-xs font-semibold text-white shadow-sm hover:border-slate-600 disabled:opacity-50 transition-all cursor-pointer min-h-[44px]"
            >
              {/* Official Google 'G' icon */}
              <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>
          </form>

          {/* Quick Demo Pre-fills */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <span className="text-[11px] font-semibold text-slate-400 block mb-3 uppercase tracking-wider text-center">
              Quick Test Accounts
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleDemoStudentLogin}
                className="flex flex-col items-start p-3 rounded-xl border border-blue-900/40 bg-blue-950/20 hover:bg-blue-950/40 text-left transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] min-h-[54px]"
              >
                <span className="text-xs font-semibold text-blue-300">Demo Student (Rohit)</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Full Stack Track with Gaps</span>
              </button>

              <button
                type="button"
                onClick={handleAdminQuickFill}
                className="flex flex-col items-start p-3 rounded-xl border border-purple-900/40 bg-purple-950/20 hover:bg-purple-950/40 text-left transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] min-h-[54px]"
              >
                <span className="text-xs font-semibold text-purple-300">Admin Account</span>
                <span className="text-[10px] text-slate-400 mt-0.5">premthakare986@gmail.com</span>
              </button>
            </div>
          </div>
        </CardReveal>

        <p className="text-center text-xs text-slate-400">
          Don't have an account yet?{' '}
          <button
            onClick={() => onNavigate('/signup')}
            className="font-semibold text-blue-400 hover:text-blue-300 ml-1 min-h-[36px] inline-flex items-center cursor-pointer"
          >
            Build your personalized roadmap
          </button>
        </p>

      </FadeIn>

      {/* Sandbox Google Authentication Dialog */}
      {showSandboxGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <h3 className="text-sm font-bold text-white">Google Sign-In</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSandboxGoogleModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Sign in with your Google account. Every Google identity receives a unique UID and isolated student profile.
            </p>

            <form onSubmit={handleSandboxGoogleSubmit} className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Google Email</label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={sandboxEmail}
                  onChange={(e) => setSandboxEmail(e.target.value)}
                  placeholder="alex.student@gmail.com"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Display Name (Optional)</label>
                <input
                  type="text"
                  value={sandboxName}
                  onChange={(e) => setSandboxName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSandboxGoogleModal(false)}
                  className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={googleLoading || !sandboxEmail.trim()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {googleLoading ? 'Signing In...' : 'Continue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
